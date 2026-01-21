import { Button, Checkbox, Form, Input, Card, message } from "antd";
import { UserOutlined, LockOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";
import { useState } from "react";
import type { LoginDto } from "../types/auth";

const Login = () => {
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const [loading, setLoading] = useState(false);

  const onFinish = async (values: LoginDto) => {
    setLoading(true);
    try {
      await login(values);
      message.success("Login successful");
      navigate("/");
    } catch {
      message.error("Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
      <Card className="w-full max-w-md shadow-lg" bordered={false}>
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-800">Webhook Manager</h1>
          <p className="text-gray-500 mt-2">Sign in to your account</p>
        </div>

        <Form
          name="login"
          initialValues={{ remember: true }}
          onFinish={onFinish}
          layout="vertical"
          size="large"
        >
          <Form.Item
            name="username"
            rules={[{ required: true, message: "Please input your Username!" }]}
          >
            <Input
              prefix={<UserOutlined className="text-gray-400" />}
              placeholder="Username"
            />
          </Form.Item>

          <Form.Item
            name="password"
            rules={[{ required: true, message: "Please input your Password!" }]}
          >
            <Input.Password
              prefix={<LockOutlined className="text-gray-400" />}
              placeholder="Password"
            />
          </Form.Item>

          <Form.Item>
            <Form.Item name="remember" valuePropName="checked" noStyle>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="w-full"
              loading={loading}
            >
              Log in
            </Button>
          </Form.Item>
        </Form>
      </Card>

      <p className="mt-8 text-gray-500 text-sm">
        Default Mock Login: Any username / any password
      </p>
    </div>
  );
};

export default Login;
