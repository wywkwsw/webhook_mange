import { Navigate, Outlet } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

export const ProtectedLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div>
      {/* FE-060 will add Sidebar/Header here */}
      <div className="layout-content">
        <Outlet />
      </div>
    </div>
  );
};
