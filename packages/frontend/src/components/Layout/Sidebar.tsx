import { Layout, Menu, Tooltip } from "antd";
import { useLocation, useNavigate } from "react-router-dom";
import {
  DashboardOutlined,
  HistoryOutlined,
  ApiOutlined,
  ThunderboltOutlined,
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
      icon: <DashboardOutlined style={{ fontSize: 18 }} />,
      label: "数据概览",
    },
    {
      key: "/webhooks",
      icon: <ApiOutlined style={{ fontSize: 18 }} />,
      label: "Webhook 管理",
    },
    {
      key: "/history",
      icon: <HistoryOutlined style={{ fontSize: 18 }} />,
      label: "历史记录",
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
      width={220}
      collapsedWidth={72}
      onBreakpoint={() => {
        // Handled by parent
      }}
      className="sidebar-container"
      style={{
        background: "linear-gradient(180deg, #1e3a5f 0%, #0d1b2a 100%)",
        borderRight: "none",
        boxShadow: "2px 0 8px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Logo 区域 */}
      <div
        className="flex items-center justify-center py-5 px-4 border-b"
        style={{
          borderColor: "rgba(255, 255, 255, 0.1)",
          minHeight: 64,
        }}
      >
        {collapsed ? (
          <Tooltip title="Webhook 平台" placement="right">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center cursor-pointer transition-transform hover:scale-105"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 20, color: "#fff" }} />
            </div>
          </Tooltip>
        ) : (
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{
                background: "linear-gradient(135deg, #3b82f6 0%, #06b6d4 100%)",
                boxShadow: "0 4px 12px rgba(59, 130, 246, 0.4)",
              }}
            >
              <ThunderboltOutlined style={{ fontSize: 20, color: "#fff" }} />
            </div>
            <div>
              <div className="text-white font-semibold text-base tracking-wide">
                Webhook
              </div>
              <div className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                管理平台
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 菜单区域 */}
      <div className="py-4">
        <Menu
          mode="inline"
          selectedKeys={selectedKeys || [location.pathname]}
          items={menuItems}
          onClick={handleMenuClick}
          className="sidebar-menu"
          style={{
            background: "transparent",
            border: "none",
          }}
        />
      </div>

      {/* 底部版本信息 */}
      <div
        className="absolute bottom-0 left-0 right-0 py-4 text-center"
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.1)",
        }}
      >
        {!collapsed && (
          <div className="text-xs" style={{ color: "rgba(255,255,255,0.4)" }}>
            v1.0.0
          </div>
        )}
      </div>
    </Sider>
  );
};
