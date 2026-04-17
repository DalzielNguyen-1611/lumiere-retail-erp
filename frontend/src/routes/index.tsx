import { createBrowserRouter, Navigate } from "react-router-dom";
import { AuthLayout } from "../components/layout/AuthLayout";
import { Login } from "../pages/Login";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    element: <AuthLayout />, 
    children: [
      {
        path: "/dashboard",
        element: (
          <div className="p-8">
            <h1 className="text-2xl font-bold text-pink-600">Lumière Dashboard</h1>
            <p className="text-gray-500 mt-2">Hệ thống đã sẵn sàng!</p>
          </div>
        ),
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/dashboard" replace />,
  }
]);