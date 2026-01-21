import { ConfigProvider, Button } from "antd";
import zhCN from "antd/locale/zh_CN";

function App() {
  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        token: {
          colorPrimary: "#3b82f6",
        },
      }}
    >
      <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold text-center py-8">Webhook Manager</h1>
        <p className="text-center text-gray-600 mb-4">系统初始化成功！</p>
        <Button type="primary">Ant Design Button</Button>
      </div>
    </ConfigProvider>
  );
}

export default App;
