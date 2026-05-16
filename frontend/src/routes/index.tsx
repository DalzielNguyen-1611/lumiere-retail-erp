import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";

// Import các Trang cốt lõi
import { Login } from "../pages/Login";
import { Dashboard } from "../pages/Dashboard";
import { POS } from "../pages/POS";
import { Inventory } from "../pages/Inventory";
import { Customers } from "../pages/Partners";
import { TimeManagement } from "../pages/TimeManagement";

// Import 8 Trang mới đã được tách module
import { HR } from "../pages/HR";
import { MultiStore } from "../pages/MultiStore";
import { Logistics } from "../pages/Logistics";
import { Procurement } from "../pages/Procurement";
import { Finance } from "../pages/Finance";
import { Returns } from "../pages/Returns";
import { Settings } from "../pages/Settings";

export const router = createBrowserRouter([
  // 1. TRANG ĐĂNG NHẬP (Public)
  {
    path: "/login",
    element: <Login />,
  },

  // 2. KHU VỰC NỘI BỘ (Bọc bởi AuthLayout và Sidebar)
  {
    path: "/",
    element: <AuthLayout />, 
    children: [
      // Mặc định khi vào "/" sẽ nhảy vào Dashboard
      {
        index: true,
        element: <Navigate to="/dashboard" replace />,
      },
      {
        path: "dashboard",
        element: <Dashboard />,
      },
      {
        path: "pos",
        element: <POS />,
      },
      {
        path: "inventory",
        element: <Inventory />,
      },
      {
        path: "customers",
        element: <Customers />,
      },
      {
        path: "time-management",
        element: <TimeManagement />, // 👈 2. THÊM ROUTE NÀY VÀO ĐÂY
      },
      // --- 8 ROUTES MỚI ĐÃ TÁCH ---
      {
        path: "hr",
        element: <HR />,
      },
      {
        path: "multi-store",
        element: <MultiStore />,
      },
      {
        path: "logistics",
        element: <Logistics />,
      },
      {
        path: "procurement",
        element: <Procurement />,
      },
      {
        path: "finance",
        element: <Finance />,
      },
      {
        path: "returns",
        element: <Returns />,
      },
      {
        path: "settings",
        element: <Settings />,
      },
    ],
  },

  // 3. BẮT LỖI ĐƯỜNG DẪN LẠ (Trang không tồn tại sẽ bị đá về Login)
  {
    path: "*",
    element: <Navigate to="/login" replace />,
  }
]);