import { ConfigProvider } from "antd";
import zhCN from "antd/locale/zh_CN";

function App() {
  return (
    <ConfigProvider locale={zhCN}>
      <div className="min-h-screen bg-gray-100">
        <h1 className="text-2xl font-bold text-center py-8">Webhook Manager</h1>
        <p className="text-center text-gray-600">系统初始化成功！</p>
      </div>
    </ConfigProvider>
  );
}

export default App;
