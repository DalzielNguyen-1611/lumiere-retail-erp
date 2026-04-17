import { useState } from "react";
import React from "react";
import { useNavigate } from "react-router";
import {
  Eye,
  EyeOff,
  Sparkles,
  Lock,
  User,
  ShieldCheck,
  ArrowRight,
  AlertCircle,
  Monitor,
  Package,
  LayoutDashboard,
  Truck,
} from "lucide-react";
import { useAuth, roleConfig, UserRole, MOCK_USERS } from "../context/AuthContext";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const BG_IMAGE = "https://images.unsplash.com/photo-1759262151080-e05ba1c6294f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1920";
const BG_IMAGE_2 = "https://images.unsplash.com/photo-1591964023443-60bc8afbdf8c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=800";

const demoAccounts: {
  label: string;
  labelVi: string;
  username: string;
  password: string;
  role: UserRole;
  icon: React.ElementType;
  description: string;
}[] = [
  { label: "Admin", labelVi: "Quản trị viên", username: "admin", password: "admin123", role: "admin", icon: ShieldCheck, description: "Full access to all modules" },
  { label: "Store Manager", labelVi: "Quản lý CN", username: "sophia", password: "manager123", role: "manager", icon: LayoutDashboard, description: "Branch-level management" },
  { label: "Sales Staff", labelVi: "Nhân viên quầy", username: "mia", password: "sales123", role: "sales", icon: Monitor, description: "POS & returns access" },
  { label: "Warehouse Staff", labelVi: "Nhân viên kho", username: "hana", password: "warehouse123", role: "warehouse", icon: Truck, description: "Inventory & logistics" },
];

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgot, setShowForgot] = useState(false);
  const [activeDemo, setActiveDemo] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      setError("Vui lòng nhập tài khoản và mật khẩu.");
      return;
    }
    
    setLoading(true);
    setError("");

    // 1. Gửi request thật xuống Backend Node.js -> Oracle
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      // 2. Lấy thông tin user vừa đăng nhập thành công từ AuthContext
      // Giả sử logic login đã lưu user vào state
      // Chúng ta sẽ điều hướng dựa trên roleConfig mà bạn đã định nghĩa
      const defaultPath = roleConfig[activeDemo as UserRole]?.defaultPath || "/dashboard";
      
      // Chuyển hướng người dùng
      navigate(defaultPath, { replace: true });
    } else {
      // 3. Hiển thị lỗi từ Backend (Sai mật khẩu, Server chết, Oracle lỗi...)
      setError(result.error || "Đăng nhập thất bại. Kiểm tra kết nối hệ thống.");
    }
  };

  const fillDemo = (acc: typeof demoAccounts[number]) => {
    setActiveDemo(acc.username);
    setUsername(acc.username);
    setPassword(acc.password);
    setError("");
  };

  return (
    <div className="min-h-screen flex overflow-hidden relative">
      {/* ── Background ─────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 z-0">
        <ImageWithFallback
          src={BG_IMAGE}
          alt="Lumière Beauty Studio"
          className="w-full h-full object-cover"
        />
        {/* Multi-layer overlay for depth */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(135deg, rgba(45,16,32,0.82) 0%, rgba(75,28,55,0.65) 40%, rgba(45,16,32,0.55) 100%)",
          }}
        />
        {/* Decorative blobs */}
        <div
          className="absolute pointer-events-none"
          style={{
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(212,175,55,0.18) 0%, transparent 70%)",
            top: "-100px",
            left: "-100px",
            borderRadius: "50%",
          }}
        />
        <div
          className="absolute pointer-events-none"
          style={{
            width: 400,
            height: 400,
            background: "radial-gradient(circle, rgba(244,143,177,0.15) 0%, transparent 70%)",
            bottom: "50px",
            right: "40%",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* ── Left Brand Panel ───────────────────────────────────────────────── */}
      <div className="relative z-10 flex-1 hidden lg:flex flex-col justify-between p-16 max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
              boxShadow: "0 8px 24px rgba(212,175,55,0.5)",
            }}
          >
            <Sparkles size={28} color="#3d1a2e" strokeWidth={2} />
          </div>
          <div>
            <h1 className="text-white" style={{ fontSize: "22px", fontWeight: 800, letterSpacing: "0.08em" }}>LUMIÈRE</h1>
            <p style={{ color: "#D4AF37", fontSize: "12px", letterSpacing: "0.3em", fontWeight: 500 }}>BEAUTY STUDIO</p>
          </div>
        </div>

        {/* Brand Copy */}
        <div>
          <h2 style={{ color: "rgba(255,255,255,0.95)", fontSize: "38px", fontWeight: 300, lineHeight: 1.25, marginBottom: 20 }}>
            Your beauty<br />
            <span style={{ fontWeight: 700, color: "#F5E6C8" }}>empire,</span><br />
            beautifully<br />managed.
          </h2>
          <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "15px", lineHeight: 1.7 }}>
            The all-in-one management platform for premium cosmetics boutiques. POS, HR, Finance, Inventory — all in one elegant interface.
          </p>

          {/* Feature badges */}
          <div className="flex flex-wrap gap-2 mt-8">
            {["POS System", "HR & Payroll", "Multi-Store", "Analytics", "Finance"].map((f) => (
              <span
                key={f}
                className="px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "rgba(255,255,255,0.7)",
                  fontSize: "12px",
                }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom image */}
        <div
          className="rounded-2xl overflow-hidden"
          style={{
            height: 180,
            border: "1px solid rgba(255,255,255,0.15)",
            boxShadow: "0 16px 40px rgba(0,0,0,0.3)",
          }}
        >
          <ImageWithFallback
            src={BG_IMAGE_2}
            alt="Cosmetic products"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.85) saturate(1.1)" }}
          />
        </div>
      </div>

      {/* ── Right Login Panel ──────────────────────────────────────────────── */}
      <div className="relative z-10 flex items-center justify-center flex-1 lg:max-w-lg p-6 lg:p-10">
        <div className="w-full max-w-md">
          {/* Login Card */}
          <div
            className="rounded-3xl p-8"
            style={{
              background: "rgba(255,255,255,0.12)",
              backdropFilter: "blur(40px)",
              WebkitBackdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.22)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.2)",
            }}
          >
            {/* Mobile Logo */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #D4AF37, #F5E6C8)" }}
              >
                <Sparkles size={20} color="#3d1a2e" />
              </div>
              <div>
                <p className="text-white" style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.08em" }}>LUMIÈRE</p>
                <p style={{ color: "#D4AF37", fontSize: "9px", letterSpacing: "0.3em" }}>BEAUTY STUDIO</p>
              </div>
            </div>

            <div className="mb-7">
              <h2 style={{ color: "rgba(255,255,255,0.95)", fontSize: "24px", fontWeight: 700, marginBottom: 6 }}>
                Welcome back
              </h2>
              <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px" }}>
                Sign in to your workspace
              </p>
            </div>

            {/* Error Banner */}
            {error && (
              <div
                className="flex items-center gap-3 px-4 py-3 rounded-xl mb-5"
                style={{ background: "rgba(244,63,94,0.15)", border: "1px solid rgba(244,63,94,0.35)" }}
              >
                <AlertCircle size={16} color="#f43f5e" />
                <p style={{ color: "#fda4af", fontSize: "13px" }}>{error}</p>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em", display: "block", marginBottom: 8 }}>
                  USERNAME
                </label>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${username ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.12)"}`,
                  }}
                >
                  <User size={16} color="rgba(255,255,255,0.4)" />
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Enter your username"
                    autoComplete="username"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label style={{ color: "rgba(255,255,255,0.65)", fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em" }}>
                    PASSWORD
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgot(true)}
                    style={{ color: "#D4AF37", fontSize: "12px", fontWeight: 500 }}
                  >
                    Forgot password?
                  </button>
                </div>
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all"
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    border: `1px solid ${password ? "rgba(212,175,55,0.5)" : "rgba(255,255,255,0.12)"}`,
                  }}
                >
                  <Lock size={16} color="rgba(255,255,255,0.4)" />
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    autoComplete="current-password"
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "white",
                      fontSize: "14px",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ color: "rgba(255,255,255,0.4)", transition: "color 0.2s" }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.8)")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(255,255,255,0.4)")}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all"
                  style={{
                    background: rememberMe ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.08)",
                    border: `1px solid ${rememberMe ? "#D4AF37" : "rgba(255,255,255,0.2)"}`,
                  }}
                >
                  {rememberMe && <span style={{ color: "white", fontSize: "11px" }}>✓</span>}
                </button>
                <span style={{ color: "rgba(255,255,255,0.6)", fontSize: "13px" }}>Remember me on this device</span>
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-xl transition-all mt-2"
                style={{
                  background: loading ? "rgba(212,175,55,0.5)" : "linear-gradient(135deg, #D4AF37 0%, #C9A94E 50%, #B8941F 100%)",
                  boxShadow: loading ? "none" : "0 8px 30px rgba(212,175,55,0.5), inset 0 1px 0 rgba(255,255,255,0.3)",
                  cursor: loading ? "not-allowed" : "pointer",
                  transform: loading ? "none" : undefined,
                }}
              >
                {loading ? (
                  <>
                    <div
                      className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"
                    />
                    <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>Signing in…</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: "white", fontSize: "14px", fontWeight: 700 }}>Sign In to Lumière</span>
                    <ArrowRight size={18} color="white" />
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6">
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
              <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px" }}>DEMO ACCOUNTS</span>
              <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.12)" }} />
            </div>

            {/* Demo Accounts */}
            <div className="grid grid-cols-2 gap-2">
              {demoAccounts.map((acc) => {
                const config = roleConfig[acc.role];
                const isActive = activeDemo === acc.username;
                const Icon = acc.icon;
                return (
                  <button
                    key={acc.username}
                    type="button"
                    onClick={() => fillDemo(acc)}
                    className="flex items-center gap-2 p-2.5 rounded-xl text-left transition-all"
                    style={{
                      background: isActive ? `${config.color}25` : "rgba(255,255,255,0.06)",
                      border: `1px solid ${isActive ? config.color + "60" : "rgba(255,255,255,0.1)"}`,
                      boxShadow: isActive ? `0 4px 12px ${config.color}25` : "none",
                    }}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                      style={{ background: `${config.color}22` }}
                    >
                      <Icon size={14} color={config.color} />
                    </div>
                    <div className="min-w-0">
                      <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "11.5px", fontWeight: 600 }}>{acc.label}</p>
                      <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "10px" }}>{acc.username}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <p style={{ color: "rgba(255,255,255,0.3)", fontSize: "11px", textAlign: "center", marginTop: 20 }}>
            © 2026 Lumière Beauty Studio. All rights reserved.
          </p>
        </div>
      </div>

      {/* ── Forgot Password Modal ──────────────────────────────────────────── */}
      {showForgot && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
        >
          <div
            className="rounded-2xl p-8 text-center max-w-sm w-full mx-4"
            style={{
              background: "rgba(255,255,255,0.14)",
              backdropFilter: "blur(40px)",
              border: "1px solid rgba(255,255,255,0.2)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.4)",
            }}
          >
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: "rgba(212,175,55,0.2)", border: "1px solid rgba(212,175,55,0.4)" }}
            >
              <Lock size={24} color="#D4AF37" />
            </div>
            <h3 style={{ color: "white", fontSize: "18px", fontWeight: 700, marginBottom: 8 }}>Reset Password</h3>
            <p style={{ color: "rgba(255,255,255,0.5)", fontSize: "13px", marginBottom: 20 }}>
              Contact your system administrator to reset your password or use a demo account below.
            </p>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "11px", marginBottom: 20 }}>
              📧 admin@lumiere.vn
            </p>
            <button
              onClick={() => setShowForgot(false)}
              className="w-full py-3 rounded-xl"
              style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white", fontWeight: 700, fontSize: "13px" }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}