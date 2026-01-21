import { Layout, Button, Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
} from "@ant-design/icons";
import { useAuthStore } from "../../store/authStore";

const { Header: AntHeader } = Layout;

interface HeaderProps {
  collapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

export const Header = ({ collapsed, setCollapsed }: HeaderProps) => {
  const { user, logout } = useAuthStore();

  const userMenu: MenuProps["items"] = [
    {
      key: "settings",
      icon: <SettingOutlined />,
      label: "设置",
    },
    {
      type: "divider",
    },
    {
      key: "logout",
      icon: <LogoutOutlined />,
      label: "退出登录",
      onClick: logout,
    },
  ];

  return (
    <AntHeader
      className="px-6 flex items-center justify-between sticky top-0 z-10 w-full"
      style={{
        background: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
      }}
    >
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        style={{ width: "40px", height: "40px", color: "#64748b" }}
      />

      <div className="flex items-center gap-4">
        <span className="hidden sm:block text-sm" style={{ color: "#64748b" }}>
          {user?.username || "管理员"}
        </span>
        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
          <Avatar
            src={user?.avatar}
            icon={<UserOutlined />}
            className="cursor-pointer"
            style={{
              background: "#3b82f6",
            }}
          />
        </Dropdown>
      </div>
    </AntHeader>
  );
};
