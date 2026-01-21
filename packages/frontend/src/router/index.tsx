import { createBrowserRouter } from "react-router-dom";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import WebhookList from "../pages/WebhookList";
import WebhookDetail from "../pages/WebhookDetail";
import History from "../pages/History";
import { ProtectedLayout } from "../components/Layout/ProtectedLayout";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <ProtectedLayout />,
    children: [
      {
        path: "/",
        element: <Dashboard />,
      },
      {
        path: "/webhooks",
        element: <WebhookList />,
      },
      {
        path: "/webhooks/:id",
        element: <WebhookDetail />,
      },
      {
        path: "/history",
        element: <History />,
      },
    ],
  },
]);
