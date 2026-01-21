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

    // 替换简单变量
    body = body.replace(/\{\{method\}\}/g, data.method);
    body = body.replace(/\{\{webhookName\}\}/g, data.webhookName);
    body = body.replace(/\{\{webhookPath\}\}/g, data.webhookPath);
    body = body.replace(/\{\{time\}\}/g, new Date().toISOString());
    body = body.replace(
      /\{\{time_cn\}\}/g,
      new Date().toLocaleString("zh-CN", { timeZone: "Asia/Shanghai" }),
    );

    // 替换整个 payload（JSON 格式）
    body = body.replace(/\{\{payload\}\}/g, JSON.stringify(data.payload));

    // 替换 payload 的属性（支持 {{payload.xxx}} 格式）
    const payloadObj = data.payload as Record<string, unknown> | null;
    if (payloadObj && typeof payloadObj === "object") {
      body = body.replace(/\{\{payload\.([^}]+)\}\}/g, (_, key: string) => {
        const value = this.getNestedValue(payloadObj, key);
        if (value === undefined) return "";
        if (typeof value === "object") return JSON.stringify(value);
        return String(value);
      });
    }

    // 尝试解析为 JSON，如果失败则作为字符串返回
    try {
      return JSON.parse(body);
    } catch {
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
