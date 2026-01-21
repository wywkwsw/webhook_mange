import { Form, Input, Button, Space, Typography } from "antd";

const { Text } = Typography;

interface WebhookFormValues {
  name: string;
  path: string;
  secret?: string;
}

interface WebhookFormProps {
  initialValues?: WebhookFormValues;
  onSubmit: (values: WebhookFormValues) => void;
  onCancel: () => void;
}

const WebhookForm = ({ initialValues, onSubmit, onCancel }: WebhookFormProps) => {
  const [form] = Form.useForm();
  const isEditing = !!initialValues;

  const handleFinish = (values: WebhookFormValues) => {
    onSubmit(values);
  };

  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={initialValues}
      onFinish={handleFinish}
    >
      <Form.Item
        name="name"
        label={<span className="text-primary">名称</span>}
        rules={[
          { required: true, message: "请输入名称" },
          { min: 1, max: 100, message: "名称长度需在 1-100 个字符之间" },
        ]}
      >
        <Input placeholder="例如：GitHub Webhook" />
      </Form.Item>

      <Form.Item
        name="path"
        label={<span className="text-primary">路径</span>}
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
          </Text>
        }
      >
        <Input placeholder="例如：github-webhook" disabled={isEditing} />
      </Form.Item>

      <Form.Item
        name="secret"
        label={<span className="text-primary">密钥（可选）</span>}
        rules={[{ max: 200, message: "密钥长度不能超过 200 个字符" }]}
        extra={
          <Text type="secondary" className="text-xs">
            设置后，请求需在 x-webhook-secret 请求头中携带此密钥
          </Text>
        }
      >
        <Input.Password placeholder="输入用于验证的密钥" />
      </Form.Item>

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
