import {
  Form,
  Input,
  Button,
  Space,
  Typography,
  Switch,
  Select,
  InputNumber,
  Collapse,
  Alert,
  Divider,
  Tooltip,
} from "antd";
import {
  SendOutlined,
  SettingOutlined,
  QuestionCircleOutlined,
} from "@ant-design/icons";
import Editor from "@monaco-editor/react";
import type { ForwardConfig } from "../../types/webhook";

const { Text } = Typography;
const { TextArea } = Input;
const { Panel } = Collapse;

/**
 * JSON Template Editor component compatible with Ant Design Form
 */
interface JsonTemplateEditorProps {
  value?: string;
  onChange?: (value: string) => void;
}

const JsonTemplateEditor = ({ value, onChange }: JsonTemplateEditorProps) => {
  return (
    <div className="border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden">
      <Editor
        height="200px"
        language="json"
        theme="vs-dark"
        value={value || ""}
        onChange={(val) => onChange?.(val || "")}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          automaticLayout: true,
          tabSize: 2,
          wordWrap: "on",
          formatOnPaste: true,
          formatOnType: true,
          scrollbar: {
            verticalScrollbarSize: 8,
            horizontalScrollbarSize: 8,
          },
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
};

interface WebhookFormValues {
  name: string;
  path: string;
  secret?: string;
  isActive?: boolean;
  forwardConfig?: ForwardConfig;
}

interface WebhookFormProps {
  initialValues?: WebhookFormValues;
  onSubmit: (values: WebhookFormValues) => void;
  onCancel: () => void;
}

const TEMPLATE_HELP = `支持以下变量：
• {{payload}} - 完整的原始请求体 (JSON)
• {{payload.xxx}} - 请求体中的特定字段
• {{method}} - 请求方法 (GET/POST 等)
• {{webhookName}} - Webhook 名称
• {{webhookPath}} - Webhook 路径
• {{time}} - 接收时间 (ISO 格式)
• {{time_cn}} - 接收时间 (中国时区)`;

const TELEGRAM_TEMPLATE = `{
  "chat_id": "YOUR_CHAT_ID",
  "text": "**{{webhookName}}**\\n\\n收到 {{method}} 请求\\n时间: {{time_cn}}\\n\\n消息: {{payload.message}}",
  "parse_mode": "Markdown"
}`;

const DINGTALK_TEMPLATE = `{
  "msgtype": "markdown",
  "markdown": {
    "title": "{{webhookName}}",
    "text": "### {{webhookName}}\\n\\n> 时间: {{time_cn}}\\n\\n{{payload.message}}"
  }
}`;

const WECHAT_TEMPLATE = `{
  "msgtype": "markdown",
  "markdown": {
    "content": "### {{webhookName}}\\n> 时间: <font color=\\"comment\\">{{time_cn}}</font>\\n\\n{{payload.message}}"
  }
}`;

const WebhookForm = ({ initialValues, onSubmit, onCancel }: WebhookFormProps) => {
  const [form] = Form.useForm();
  const isEditing = !!initialValues;

  const forwardEnabled = Form.useWatch(["forwardConfig", "enabled"], form);

  const handleFinish = (values: WebhookFormValues) => {
    // 如果转发未启用，清除转发配置
    if (!values.forwardConfig?.enabled) {
      values.forwardConfig = undefined;
    }
    onSubmit(values);
  };

  const applyTemplate = (template: string) => {
    form.setFieldValue(["forwardConfig", "bodyTemplate"], template);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        isActive: true,
        forwardConfig: {
          enabled: false,
          method: "POST",
          timeout: 10000,
          retryCount: 0,
        },
        ...initialValues,
      }}
      onFinish={handleFinish}
    >
      {/* 基本信息 */}
      <div className="space-y-4">
        <Form.Item
          name="name"
          label={<span className="text-primary font-medium">名称</span>}
          rules={[
            { required: true, message: "请输入名称" },
            { min: 1, max: 100, message: "名称长度需在 1-100 个字符之间" },
          ]}
        >
          <Input placeholder="例如：TradingView 告警" />
        </Form.Item>

        <Form.Item
          name="path"
          label={<span className="text-primary font-medium">路径</span>}
          rules={[
            { required: true, message: "请输入路径" },
            { min: 1, max: 100, message: "路径长度需在 1-100 个字符之间" },
            {
              pattern: /^[a-zA-Z0-9_-]+$/,
              message: "路径只能包含字母、数字、下划线和连字符",
            },
          ]}
          extra={
            <Text type="secondary" className="text-xs">
              Webhook 接收地址将为: /hook/{"<路径>"}
              {isEditing && " （路径创建后不可修改）"}
            </Text>
          }
        >
          <Input placeholder="例如：tradingview-alert" disabled={isEditing} />
        </Form.Item>

        <Form.Item
          name="secret"
          label={<span className="text-primary font-medium">密钥（可选）</span>}
          rules={[{ max: 200, message: "密钥长度不能超过 200 个字符" }]}
          extra={
            <Text type="secondary" className="text-xs">
              设置后，请求需在 x-webhook-secret 请求头或 ?secret= 查询参数中携带此密钥
            </Text>
          }
        >
          <Input.Password placeholder="输入用于验证的密钥" />
        </Form.Item>

        <Form.Item
          name="isActive"
          label={<span className="text-primary font-medium">启用状态</span>}
          valuePropName="checked"
        >
          <Switch checkedChildren="启用" unCheckedChildren="禁用" />
        </Form.Item>
      </div>

      <Divider />

      {/* 转发配置 */}
      <Collapse
        ghost
        defaultActiveKey={initialValues?.forwardConfig?.enabled ? ["forward"] : []}
      >
        <Panel
          header={
            <span className="text-primary font-medium">
              <SendOutlined className="mr-2" />
              转发配置
            </span>
          }
          key="forward"
        >
          <div className="space-y-4 pt-2">
            <Form.Item
              name={["forwardConfig", "enabled"]}
              label="启用转发"
              valuePropName="checked"
            >
              <Switch checkedChildren="开启" unCheckedChildren="关闭" />
            </Form.Item>

            {forwardEnabled && (
              <>
                <Alert
                  message="转发功能"
                  description="Webhook 收到请求后，会自动将消息转发到配置的目标地址（如 Telegram、钉钉、企业微信等）"
                  type="info"
                  showIcon
                  className="mb-4"
                />

                <Form.Item
                  name={["forwardConfig", "targetUrl"]}
                  label={<span className="text-primary font-medium">目标 URL</span>}
                  rules={[
                    { required: forwardEnabled, message: "请输入目标 URL" },
                    { type: "url", message: "请输入有效的 URL" },
                  ]}
                  extra={
                    <Text type="secondary" className="text-xs">
                      例如: https://api.telegram.org/bot&lt;TOKEN&gt;/sendMessage
                    </Text>
                  }
                >
                  <Input placeholder="https://api.telegram.org/bot<TOKEN>/sendMessage" />
                </Form.Item>

                <Form.Item
                  name={["forwardConfig", "method"]}
                  label={<span className="text-primary font-medium">HTTP 方法</span>}
                >
                  <Select>
                    <Select.Option value="GET">GET</Select.Option>
                    <Select.Option value="POST">POST</Select.Option>
                    <Select.Option value="PUT">PUT</Select.Option>
                    <Select.Option value="PATCH">PATCH</Select.Option>
                  </Select>
                </Form.Item>

                <Form.Item
                  name={["forwardConfig", "bodyTemplate"]}
                  label={
                    <Space>
                      <span className="text-primary font-medium">消息模板</span>
                      <Tooltip
                        title={
                          <div className="whitespace-pre-line text-sm">
                            {TEMPLATE_HELP}
                            {"\n\n"}
                            <strong>提示：</strong>留空则直接转发原始请求体
                          </div>
                        }
                        placement="right"
                        overlayStyle={{ maxWidth: 400 }}
                      >
                        <QuestionCircleOutlined className="text-blue-400 cursor-help" />
                      </Tooltip>
                    </Space>
                  }
                  extra={
                    <div className="mt-2">
                      <Text type="secondary" className="text-xs block mb-2">
                        快速应用模板：
                      </Text>
                      <Space wrap size="small">
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => applyTemplate(TELEGRAM_TEMPLATE)}
                        >
                          Telegram
                        </Button>
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => applyTemplate(DINGTALK_TEMPLATE)}
                        >
                          钉钉
                        </Button>
                        <Button
                          size="small"
                          type="dashed"
                          onClick={() => applyTemplate(WECHAT_TEMPLATE)}
                        >
                          企业微信
                        </Button>
                      </Space>
                    </div>
                  }
                >
                  <JsonTemplateEditor />
                </Form.Item>

                <Collapse ghost size="small">
                  <Panel
                    header={
                      <span className="text-secondary text-sm">
                        <SettingOutlined className="mr-1" />
                        高级设置
                      </span>
                    }
                    key="advanced"
                  >
                    <div className="space-y-4 pt-2">
                      <Form.Item
                        name={["forwardConfig", "timeout"]}
                        label="超时时间 (毫秒)"
                      >
                        <InputNumber
                          min={1000}
                          max={60000}
                          step={1000}
                          className="w-full"
                          placeholder="10000"
                        />
                      </Form.Item>

                      <Form.Item
                        name={["forwardConfig", "retryCount"]}
                        label="重试次数"
                      >
                        <InputNumber
                          min={0}
                          max={5}
                          className="w-full"
                          placeholder="0"
                        />
                      </Form.Item>

                      <Form.Item
                        name={["forwardConfig", "headersJson"]}
                        label="自定义请求头 (JSON)"
                        extra={
                          <Text type="secondary" className="text-xs">
                            例如: {`{"Authorization": "Bearer xxx"}`}
                          </Text>
                        }
                      >
                        <TextArea
                          rows={3}
                          placeholder='{"Authorization": "Bearer xxx"}'
                          className="font-mono text-sm"
                        />
                      </Form.Item>
                    </div>
                  </Panel>
                </Collapse>
              </>
            )}
          </div>
        </Panel>
      </Collapse>

      <Form.Item className="mb-0 mt-6">
        <Space className="w-full justify-end">
          <Button onClick={onCancel}>取消</Button>
          <Button type="primary" htmlType="submit">
            {isEditing ? "更新" : "创建"}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default WebhookForm;
