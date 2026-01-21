import { Modal, Form, Input, message } from "antd";
import { LockOutlined } from "@ant-design/icons";
import { useState } from "react";
import { useAuthStore } from "../../store/authStore";

interface ChangePasswordModalProps {
  open: boolean;
  onClose: () => void;
}

interface FormValues {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export const ChangePasswordModal = ({ open, onClose }: ChangePasswordModalProps) => {
  const [form] = Form.useForm<FormValues>();
  const [loading, setLoading] = useState(false);
  const changePassword = useAuthStore((state) => state.changePassword);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });

      message.success("密码修改成功");
      form.resetFields();
      onClose();
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      if (err.response?.data?.message) {
        message.error(
          err.response.data.message === "Current password is incorrect"
            ? "当前密码错误"
            : err.response.data.message
        );
      } else if (error instanceof Error && error.message !== "Validation failed") {
        message.error("密码修改失败，请重试");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      title="修改密码"
      open={open}
      onOk={handleSubmit}
      onCancel={handleCancel}
      okText="确认修改"
      cancelText="取消"
      confirmLoading={loading}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        autoComplete="off"
        className="mt-4"
      >
        <Form.Item
          name="currentPassword"
          label="当前密码"
          rules={[
            { required: true, message: "请输入当前密码" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            placeholder="请输入当前密码"
          />
        </Form.Item>

        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: "请输入新密码" },
            { min: 6, message: "密码长度至少 6 个字符" },
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            placeholder="请输入新密码（至少 6 个字符）"
          />
        </Form.Item>

        <Form.Item
          name="confirmPassword"
          label="确认新密码"
          dependencies={["newPassword"]}
          rules={[
            { required: true, message: "请确认新密码" },
            ({ getFieldValue }) => ({
              validator(_, value) {
                if (!value || getFieldValue("newPassword") === value) {
                  return Promise.resolve();
                }
                return Promise.reject(new Error("两次输入的密码不一致"));
              },
            }),
          ]}
        >
          <Input.Password
            prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
            placeholder="请再次输入新密码"
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};
