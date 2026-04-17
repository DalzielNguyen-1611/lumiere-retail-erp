import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Login } from "../pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <AuthLayout />, // Tất cả những gì nằm trong này đều phải qua bước check login/role
    children: [
      {
        path: "/dashboard",
        element: <div className="p-8"><h1>Nội dung Dashboard tại đây</h1></div>,
      },
      // Các route khác...
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  }
]);