import { Injectable, Logger } from "@nestjs/common";
import axios, { AxiosError } from "axios";
import type { ForwardConfig } from "../webhook/entities/webhook.entity";

export interface ForwardPayload {
  /** 原始请求方法 */
  method: string;
  /** 原始请求头 */
  headers: Record<string, string>;
  /** 原始请求体 */
  payload: unknown;
  /** Webhook 名称 */
  webhookName: string;
  /** Webhook 路径 */
  webhookPath: string;
}

export interface ForwardResult {
  success: boolean;
  statusCode?: number;
  response?: unknown;
  error?: string;
  duration?: number;
}

@Injectable()
export class ForwardService {
  private readonly logger = new Logger(ForwardService.name);

  /**
   * 执行转发
   */
  async forward(config: ForwardConfig, data: ForwardPayload): Promise<ForwardResult> {
    if (!config.enabled || !config.targetUrl) {
      return { success: false, error: "Forward not enabled or target URL not configured" };
    }

    const startTime = Date.now();
    const timeout = config.timeout ?? 10000;
    const retryCount = config.retryCount ?? 0;

    // 构建请求体
    const body = this.buildRequestBody(config, data);

    // 构建请求头
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "WebhookManager/1.0",
      ...config.headers,
    };

    let lastError: Error | null = null;

    // 重试逻辑
    for (let attempt = 0; attempt <= retryCount; attempt++) {
      try {
        const response = await axios({
          method: config.method,
          url: config.targetUrl,
          headers,
          data: body,
          timeout,
          validateStatus: () => true, // 不抛出 HTTP 错误
        });

        const duration = Date.now() - startTime;

        this.logger.log(
          `Forward success: ${config.targetUrl} [${response.status}] (${duration}ms)`,
        );

        return {
          success: response.status >= 200 && response.status < 400,
          statusCode: response.status,
          response: response.data,
          duration,
        };
      } catch (error) {
        lastError = error as Error;
        const axiosError = error as AxiosError;

        this.logger.warn(
          `Forward attempt ${attempt + 1}/${retryCount + 1} failed: ${axiosError.message}`,
        );

        // 如果还有重试机会，等待后重试
        if (attempt < retryCount) {
          await this.delay(1000 * (attempt + 1)); // 递增延迟
        }
      }
    }

    const duration = Date.now() - startTime;
    const errorMessage = lastError?.message ?? "Unknown error";

    this.logger.error(`Forward failed after ${retryCount + 1} attempts: ${errorMessage}`);

    return {
      success: false,
      error: errorMessage,
      duration,
    };
  }

  /**
   * 构建请求体
   */
  private buildRequestBody(config: ForwardConfig, data: ForwardPayload): unknown {
    // 如果没有模板，直接返回原始 payload
    if (!config.bodyTemplate) {
      return data.payload;
    }

    // 使用模板替换变量
    let body = config.bodyTemplate;

    // 检测变量是否在 JSON 字符串值内（被双引号包围）
    const isInsideJsonString = (template: string, matchIndex: number): boolean => {
      // 从匹配位置向前查找，统计未转义的双引号数量
      let quoteCount = 0;
      for (let i = matchIndex - 1; i >= 0; i--) {
        if (template[i] === '"' && (i === 0 || template[i - 1] !== "\\")) {
          quoteCount++;
        }
      }
      // 奇数个双引号表示在字符串内
      return quoteCount % 2 === 1;
    };

    // 转义字符串以便安全嵌入 JSON 字符串值中
    const escapeForJsonString = (str: string): string => {
      return str
        .replace(/\\/g, "\\\\")
        .replace(/"/g, '\\"')
        .replace(/\n/g, "\\n")
        .replace(/\r/g, "\\r")
        .replace(/\t/g, "\\t");
    };

    // 替换简单变量（需要根据上下文决定是否转义）
    const replaceSimpleVar = (
      template: string,
      pattern: RegExp,
      getValue: () => string,
    ): string => {
      return template.replace(pattern, (match, ...args) => {
        const value = getValue();
        // args 的倒数第二个是 offset
        const offset = args[args.length - 2] as number;
        if (isInsideJsonString(template, offset)) {
          return escapeForJsonString(value);
        }
        return value;
      });
    };

    body = replaceSimpleVar(body, /\{\{method\}\}/g, () => data.method);
    body = replaceSimpleVar(body, /\{\{webhookName\}\}/g, () => data.webhookName);
    body = replaceSimpleVar(body, /\{\{webhookPath\}\}/g, () => data.webhookPath);
    body = replaceSimpleVar(body, /\{\{time\}\}/g, () => new Date().toISOString());
    body = replaceSimpleVar(body, /\{\{time_cn\}\}/g, () =>
      new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    );

    // 替换整个 payload
    // 特殊处理：如果 {{payload}} 在字符串内，需要转义 JSON；如果不在，直接替换为 JSON 对象
    body = body.replace(/\{\{payload\}\}/g, (match, offset: number) => {
      const payloadJson = JSON.stringify(data.payload);
      if (isInsideJsonString(body, offset)) {
        // 在字符串内：需要转义整个 JSON 字符串
        return escapeForJsonString(payloadJson);
      }
      // 不在字符串内：直接返回 JSON（会成为对象/数组）
      return payloadJson;
    });

    // 替换 payload 的属性（支持 {{payload.xxx}} 格式）
    const payloadObj = data.payload as Record<string, unknown> | null;
    if (payloadObj && typeof payloadObj === "object") {
      // 先处理带格式化的时间变量 {{payload.xxx|time_cn}}
      body = body.replace(
        /\{\{payload\.([^}|]+)\|time_cn\}\}/g,
        (match, key: string, offset: number) => {
          const value = this.getNestedValue(payloadObj, key);
          if (value === undefined || value === null || value === "") return "";
          try {
            const date = new Date(value as string | number);
            if (isNaN(date.getTime())) {
              const strValue = String(value);
              return isInsideJsonString(body, offset) ? escapeForJsonString(strValue) : strValue;
            }
            const formatted = date.toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" });
            return isInsideJsonString(body, offset) ? escapeForJsonString(formatted) : formatted;
          } catch {
            const strValue = String(value);
            return isInsideJsonString(body, offset) ? escapeForJsonString(strValue) : strValue;
          }
        },
      );

      // 处理带 ISO 格式化的时间变量 {{payload.xxx|time}}
      body = body.replace(
        /\{\{payload\.([^}|]+)\|time\}\}/g,
        (match, key: string, offset: number) => {
          const value = this.getNestedValue(payloadObj, key);
          if (value === undefined || value === null || value === "") return "";
          try {
            const date = new Date(value as string | number);
            if (isNaN(date.getTime())) {
              const strValue = String(value);
              return isInsideJsonString(body, offset) ? escapeForJsonString(strValue) : strValue;
            }
            const formatted = date.toISOString();
            return isInsideJsonString(body, offset) ? escapeForJsonString(formatted) : formatted;
          } catch {
            const strValue = String(value);
            return isInsideJsonString(body, offset) ? escapeForJsonString(strValue) : strValue;
          }
        },
      );

      // 处理普通的 payload 属性
      body = body.replace(/\{\{payload\.([^}]+)\}\}/g, (match, key: string, offset: number) => {
        const value = this.getNestedValue(payloadObj, key);
        if (value === undefined) return "";

        if (typeof value === "object") {
          const jsonStr = JSON.stringify(value);
          return isInsideJsonString(body, offset) ? escapeForJsonString(jsonStr) : jsonStr;
        }

        const strValue = String(value);
        return isInsideJsonString(body, offset) ? escapeForJsonString(strValue) : strValue;
      });
    }

    // 尝试解析为 JSON，如果失败则作为字符串返回
    try {
      return JSON.parse(body);
    } catch (e) {
      this.logger.warn(`Failed to parse template result as JSON: ${(e as Error).message}`);
      this.logger.debug(`Template result: ${body}`);
      return body;
    }
  }

  /**
   * 获取嵌套对象的值
   */
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    return path.split(".").reduce<unknown>((current, key) => {
      if (current && typeof current === "object") {
        return (current as Record<string, unknown>)[key];
      }
      return undefined;
    }, obj);
  }

  /**
   * 延迟
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
