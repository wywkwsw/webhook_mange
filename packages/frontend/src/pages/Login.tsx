import { Form, Input, Button, message } from "antd";
import { UserOutlined, LockOutlined, ApiOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

interface LoginFormData {
  username: string;
  password: string;
}

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [form] = Form.useForm();

  const handleSubmit = async (values: LoginFormData) => {
    try {
      await login({ username: values.username, password: values.password });
      message.success("登录成功");
      navigate("/");
    } catch {
      message.error("用户名或密码错误");
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#f8fafc" }}
    >
      <div
        className="w-full max-w-md rounded-2xl p-8"
        style={{
          background: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
        }}
      >
        {/* Logo 和标题 */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "#3b82f6" }}
          >
            <ApiOutlined className="text-3xl text-white" />
          </div>
          <h1
            className="text-2xl font-semibold m-0"
            style={{ color: "#1e293b" }}
          >
            Webhook 管理平台
          </h1>
          <p className="mt-2 m-0" style={{ color: "#64748b" }}>
            请登录您的账户
          </p>
        </div>

        {/* 登录表单 */}
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          autoComplete="off"
          size="large"
        >
          <Form.Item
            name="username"
            label={<span style={{ color: "#1e293b" }}>用户名</span>}
            rules={[{ required: true, message: "请输入用户名" }]}
          >
            <Input
              prefix={<UserOutlined style={{ color: "#94a3b8" }} />}
              placeholder="请输入用户名"
            />
          </Form.Item>

          <Form.Item
            name="password"
            label={<span style={{ color: "#1e293b" }}>密码</span>}
            rules={[{ required: true, message: "请输入密码" }]}
          >
            <Input.Password
              prefix={<LockOutlined style={{ color: "#94a3b8" }} />}
              placeholder="请输入密码"
            />
          </Form.Item>

          <Form.Item className="mb-0 mt-6">
            <Button type="primary" htmlType="submit" block size="large">
              登录
            </Button>
          </Form.Item>
        </Form>

        {/* 提示信息 */}
        <div
          className="mt-6 p-4 rounded-lg text-center"
          style={{ background: "#f1f5f9" }}
        >
          <p className="text-sm m-0" style={{ color: "#64748b" }}>
            演示账号：admin / admin123
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
