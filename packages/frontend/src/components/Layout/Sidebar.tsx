import { Layout, Menu } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  HistoryOutlined,
  ApiOutlined,
} from "@ant-design/icons";
import type { MenuProps } from "antd";

const { Sider } = Layout;

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (collapsed: boolean) => void;
  selectedKeys?: string[];
  onMenuClick?: (key: string) => void;
}

export const Sidebar = ({
  collapsed,
  selectedKeys,
  onMenuClick,
}: Omit<SidebarProps, "onCollapse"> & {
  onCollapse: (collapsed: boolean) => void;
}) => {
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

  const handleMenuClick: MenuProps["onClick"] = (info) => {
    if (onMenuClick) {
      onMenuClick(info.key);
    } else {
      navigate(info.key);
    }
  };

  return (
    <Sider
      trigger={null}
      collapsible
      collapsed={collapsed}
      breakpoint="lg"
      onBreakpoint={() => {
        // Handled by parent
      }}
    >
      <div className="demo-logo-vertical" />
      <div
        className={`text-white p-4 font-bold text-lg flex items-center justify-center transition-all duration-300 ${collapsed ? "opacity-0 w-0 overflow-hidden" : "opacity-100"}`}
      >
        Webhook mgr
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={selectedKeys || [location.pathname]}
        items={menuItems}
        onClick={handleMenuClick}
      />
    </Sider>
  );
};
