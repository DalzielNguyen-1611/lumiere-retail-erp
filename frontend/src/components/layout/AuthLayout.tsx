import { useEffect, type ReactNode } from "react";
import { Outlet, useNavigate, useLocation } from "react-router";
import { Sidebar } from "./Sidebar"; // Đảm bảo bạn cũng sẽ tạo file Sidebar.tsx nhé
import { useAuth } from "../../context/AuthContext";

export function AuthLayout() {
  const { isAuthenticated, user, canAccess, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate("/login", { replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  // Nếu đang kiểm tra token hoặc chưa đăng nhập thì không hiện giao diện chính
  if (isLoading || !isAuthenticated) return null;

  return (
    <div
      className="flex h-screen overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #fdf2f8 0%, #fce7f3 30%, #fff7ed 70%, #fefce8 100%)",
      }}
    >
      {/* Decorative blobs */}
      <div
        className="fixed pointer-events-none"
        style={{
          width: "600px", height: "600px",
          background: "radial-gradient(circle, rgba(244,143,177,0.15) 0%, transparent 70%)",
          top: "-100px", right: "200px", borderRadius: "50%", zIndex: 0,
        }}
      />

      {/* Sidebar */}
      <div className="relative z-10 flex-shrink-0" style={{ boxShadow: "4px 0 30px rgba(61,26,46,0.15)" }}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <main className="flex-1 overflow-auto relative z-10">
        <Outlet />
      </main>
    </div>
  );
}