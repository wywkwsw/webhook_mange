import { Layout, Button, Avatar, Dropdown } from "antd";
import type { MenuProps } from "antd";
import {
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UserOutlined,
  LogoutOutlined,
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
      key: "logout",
      icon: <LogoutOutlined />,
      label: "Logout",
      onClick: logout,
    },
  ];

  return (
    <AntHeader className="bg-white px-4 flex items-center justify-between shadow-sm sticky top-0 z-10 w-full">
      <Button
        type="text"
        icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
        onClick={() => setCollapsed(!collapsed)}
        className="text-lg w-16 h-16"
      />

      <div className="flex items-center gap-4">
        <span className="text-gray-600 hidden sm:block">
          {user?.username || "Admin"}
        </span>
        <Dropdown menu={{ items: userMenu }} placement="bottomRight">
          <Avatar
            src={user?.avatar}
            icon={<UserOutlined />}
            className="cursor-pointer bg-primary-500"
          />
        </Dropdown>
      </div>
    </AntHeader>
  );
};
