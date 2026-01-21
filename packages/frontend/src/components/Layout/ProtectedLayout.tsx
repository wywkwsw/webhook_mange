import { Navigate } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";
import { MainLayout } from "./MainLayout";

export const ProtectedLayout = () => {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <MainLayout />;
};
