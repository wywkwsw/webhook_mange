import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  HistoryOutlined,
  ApiOutlined,
} from "@ant-design/icons";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
}

export const Sidebar = ({ collapsed }: SidebarProps) => {
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    {
      key: "/",
      icon: <DashboardOutlined />,
      label: "Dashboard",
    },
    {
      key: "/webhooks",
      icon: <ApiOutlined />,
      label: "Webhooks",
    },
    {
      key: "/history",
      icon: <HistoryOutlined />,
      label: "History",
    },
  ];

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      className="h-screen overflow-auto sticky top-0 left-0 bg-white shadow-md"
    >
      <div className="h-16 flex items-center justify-center border-b border-gray-100">
        <span
          className={`text-xl font-bold text-primary-600 transition-all duration-300 ${collapsed ? "scale-0 w-0" : "scale-100"}`}
        >
          Webhook
        </span>
      </div>
      <Menu
        mode="inline"
        selectedKeys={[
          location.pathname === "/"
            ? "/"
            : `/${location.pathname.split("/")[1]}`,
        ]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
        className="border-none"
      />
    </Sider>
  );
};
