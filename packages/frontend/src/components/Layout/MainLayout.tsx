import { Layout, theme, Grid } from "antd";
import { useState, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";

const { Content } = Layout;
const { useBreakpoint } = Grid;

export const MainLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const {
    token: { colorBgContainer, borderRadiusLG },
  } = theme.useToken();
  const screens = useBreakpoint();

  // Auto-collapse on mobile
  useEffect(() => {
    if (screens.xs) {
      setCollapsed(true);
    } else {
      setCollapsed(false);
    }
  }, [screens.xs]);

  const handleMenuClick = (key: string) => {
    navigate(key);
    // Close sidebar on mobile when navigating
    if (screens.xs) {
      setCollapsed(true);
    }
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sidebar
        collapsed={collapsed}
        onCollapse={setCollapsed}
        onMenuClick={handleMenuClick}
        selectedKeys={[location.pathname]}
      />
      <Layout>
        <Header collapsed={collapsed} setCollapsed={setCollapsed} />
        <Content
          style={{
            margin: "24px 16px",
            padding: 24,
            minHeight: 280,
            background: colorBgContainer,
            borderRadius: borderRadiusLG,
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};
