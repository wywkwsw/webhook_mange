import { Form, Input, Select, Switch } from "antd";
import type { FormInstance } from "antd";

interface WebhookFormProps {
  form: FormInstance;
  initialValues?: any;
}

export const WebhookForm = ({ form, initialValues }: WebhookFormProps) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={{
        status: true,
        method: "POST",
        ...initialValues,
      }}
    >
      <Form.Item
        name="name"
        label="Webhook Name"
        rules={[{ required: true, message: "Please enter a name" }]}
      >
        <Input placeholder="e.g. Order Created" />
      </Form.Item>

      <Form.Item
        name="url"
        label="Endpoint URL"
        rules={[
          { required: true, message: "Please enter the URL" },
          { type: "url", message: "Please enter a valid URL" },
        ]}
      >
        <Input placeholder="https://api.example.com/webhook" />
      </Form.Item>

      <Form.Item
        name="method"
        label="HTTP Method"
        rules={[{ required: true, message: "Please select a method" }]}
      >
        <Select>
          <Select.Option value="GET">GET</Select.Option>
          <Select.Option value="POST">POST</Select.Option>
          <Select.Option value="PUT">PUT</Select.Option>
          <Select.Option value="DELETE">DELETE</Select.Option>
        </Select>
      </Form.Item>

      <Form.Item name="status" label="Active" valuePropName="checked">
        <Switch />
      </Form.Item>
    </Form>
  );
};
