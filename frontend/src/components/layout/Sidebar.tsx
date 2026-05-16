import React from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Package, ShoppingBag, Users, BarChart3, Sparkles, LogOut,
  Monitor, UserCog, Building2, FileSpreadsheet, Settings2, Clock, ShieldCheck,
  Wallet, Store, PieChart, CornerUpLeft, Truck // THÊM CÁC ICON NÀY
} from "lucide-react";
import { useAuth, roleConfig, type UserRole } from "../../context/AuthContext";

// ─── Nav Item Types ───────────────────────────────────────────────────────────
interface NavItemDef {
  path: string;
  icon: React.ElementType;
  label: string;
  badge?: string;
  roles: UserRole[];
}

const mainNavItems: NavItemDef[] = [
  { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard", roles: ["admin", "manager", "accounting", "warehouse"] },
  { path: "/pos", icon: Monitor, label: "Bán hàng (POS)", roles: ["admin", "sales"] },
  { path: "/customers", icon: Users, label: "Đối tác", roles: ["admin", "manager", "sales", "accounting"] },
  { path: "/inventory", icon: Package, label: "Tồn kho", roles: ["admin", "manager", "warehouse", "accounting"] },
  { path: "/returns", icon: CornerUpLeft, label: "Đổi trả", roles: ["admin", "manager", "sales", "warehouse", "accounting"] },
  { path: "/logistics", icon: Truck, label: "Phiếu kho", roles: ["admin", "warehouse"] },
  { path: "/time-management", icon: Clock, label: "Chấm công & Phép", roles: ["admin", "manager", "sales", "warehouse", "accounting"] },
];

const opsNavItems: NavItemDef[] = [
  { path: "/finance", icon: PieChart, label: "Thu chi", roles: ["admin", "accounting", "manager"] },
  { path: "/procurement", icon: ShoppingBag, label: "Mua hàng", roles: ["admin", "accounting", "manager", "warehouse"] },
  { path: "/hr", icon: UserCog, label: "Nhân sự", roles: ["admin", "accounting", "manager"] },
  { path: "/multi-store", icon: Store, label: "Chi nhánh", roles: ["admin", "manager", "warehouse"] },
  { path: "/settings", icon: Settings2, label: "Cài đặt", roles: ["admin", "manager", "sales", "warehouse", "accounting"] },
];

// Cập nhật đủ icon cho các Role (Tránh lỗi undefined)
const roleIcons: Record<UserRole, React.ElementType> = {
  admin: ShieldCheck,
  manager: LayoutDashboard,
  sales: Monitor,
  warehouse: Package,
  staff: Users,
  accounting: FileSpreadsheet
};

// Đưa NavItem ra ngoài để tránh Re-mount component (Sửa lỗi giật/mất trạng thái)
const NavItem = ({ item, isActive }: { item: NavItemDef; isActive: boolean }) => {
  const { path, icon: Icon, label, badge } = item;
  return (
    <NavLink
      to={path}
      className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200"
      style={{
        background: isActive
          ? "linear-gradient(135deg, rgba(212,175,55,0.22), rgba(245,230,200,0.1))"
          : "transparent",
        borderLeft: isActive ? "3px solid #D4AF37" : "3px solid transparent",
      }}
    >
      <div
        className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-all"
        style={{
          background: isActive
            ? "linear-gradient(135deg, #D4AF37, #C9A94E)"
            : "rgba(255,255,255,0.08)",
        }}
      >
        <Icon
          size={14}
          color={isActive ? "#3d1a2e" : "rgba(255,255,255,0.7)"}
          strokeWidth={isActive ? 2.5 : 1.8}
        />
      </div>
      <span
        className="flex-1 truncate"
        style={{
          color: isActive ? "#F5E6C8" : "rgba(255,255,255,0.65)",
          fontSize: "12.5px",
          fontWeight: isActive ? 600 : 400,
          letterSpacing: "0.01em",
        }}
      >
        {label}
      </span>
      <div className="flex items-center gap-1 shrink-0">
        {badge && (
          <span
            style={{
              background: "linear-gradient(135deg, #F48FB1, #E879A0)",
              color: "white",
              fontSize: "8px",
              fontWeight: 700,
              letterSpacing: "0.05em",
              padding: "2px 5px",
              borderRadius: "4px",
            }}
          >
            {badge}
          </span>
        )}
        {isActive && (
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#D4AF37" }} />
        )}
      </div>
    </NavLink>
  );
};

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const userRole = user?.role ?? "sales";
  const config = roleConfig[userRole];

  const visibleMain = mainNavItems.filter((item) => item.roles.includes(userRole));
  const visibleOps = opsNavItems.filter((item) => item.roles.includes(userRole));
  const hasOpsSection = visibleOps.length > 0;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // Giá trị dự phòng (Fallback) nếu config bị thiếu thuộc tính
  const roleLabel = config?.label ? config.label.toUpperCase() : userRole.toUpperCase();
  const roleLabelVi = config?.labelVi ? config.labelVi : "Nhân viên";
  const colorTheme = config?.color || "#D4AF37";
  const RoleIcon = roleIcons[userRole as UserRole] || Users;

  return (
    <aside
      className="flex flex-col h-full"
      style={{
        background: "linear-gradient(180deg, #2d1020 0%, #4a1c37 30%, #6b2b4e 65%, #7a3055 100%)",
        width: "258px",
        minWidth: "258px",
      }}
    >
      {/* Logo */}
      <div
        className="px-5 py-6 shrink-0 border-b"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{
              background: "linear-gradient(135deg, #D4AF37, #F5E6C8)",
              boxShadow: "0 4px 15px rgba(212,175,55,0.4)",
            }}
          >
            <Sparkles size={20} color="#3d1a2e" strokeWidth={2} />
          </div>
          <div>
            <h1
              className="text-white"
              style={{ fontSize: "15px", fontWeight: 700, letterSpacing: "0.05em" }}
            >
              LUMIÈRE
            </h1>
            <p
              style={{ color: "#D4AF37", fontSize: "10px", letterSpacing: "0.2em", fontWeight: 500 }}
            >
              BEAUTY STUDIO
            </p>
          </div>
        </div>
      </div>

      {/* Role Badge */}
      <div className="px-5 pt-4 pb-2 shrink-0">
        <div
          className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl"
          style={{ background: `${colorTheme}20`, border: `1px solid ${colorTheme}35` }}
        >
          <RoleIcon size={12} color={colorTheme} strokeWidth={2.5} />
          <span style={{ color: colorTheme, fontSize: "10.5px", fontWeight: 700, letterSpacing: "0.04em" }}>
            {roleLabel}
          </span>
          {/* Sửa lại truy cập thuộc tính an toàn bằng "as any" tạm thời hoặc kiểm tra tồn tại */}
          {(user as any)?.branch && (
            <span
              className="ml-auto px-1.5 py-0.5 rounded"
              style={{ background: `${colorTheme}25`, color: colorTheme, fontSize: "9px", fontWeight: 700 }}
            >
              {(user as any).branch}
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Navigation */}
      <nav
        className="flex-1 px-3 py-3 overflow-y-auto"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {/* Main Menu Section */}
        <p
          style={{
            color: "rgba(255,255,255,0.35)",
            fontSize: "9.5px",
            letterSpacing: "0.2em",
            fontWeight: 700,
            marginBottom: "10px",
            paddingLeft: "10px",
          }}
        >
          MAIN MENU
        </p>
        <div className="space-y-0.5">
          {visibleMain.map((item) => (
            <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
          ))}
        </div>

        {/* Operations Section */}
        {hasOpsSection && (
          <>
            <div
              className="my-4 mx-3 border-t"
              style={{ borderColor: "rgba(255,255,255,0.08)" }}
            />
            <p
              style={{
                color: "rgba(255,255,255,0.35)",
                fontSize: "9.5px",
                letterSpacing: "0.2em",
                fontWeight: 700,
                marginBottom: "10px",
                paddingLeft: "10px",
              }}
            >
              OPERATIONS
            </p>
            <div className="space-y-0.5">
              {visibleOps.map((item) => (
                <NavItem key={item.path} item={item} isActive={location.pathname === item.path} />
              ))}
            </div>
          </>
        )}

        

        {/* System */}
        <div className="my-4 mx-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }} />
        <div className="space-y-0.5">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl transition-all duration-200"
            style={{ background: "transparent", borderLeft: "3px solid transparent" }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(244,63,94,0.08)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.background = "transparent";
            }}
          >
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(244,63,94,0.1)" }}
            >
              <LogOut size={14} color="rgba(244,143,177,0.7)" strokeWidth={1.8} />
            </div>
            <span
              style={{ color: "rgba(255,255,255,0.45)", fontSize: "12.5px", fontWeight: 400 }}
            >
              Đăng xuất
            </span>
          </button>
        </div>
      </nav>

      {/* Profile Footer */}
      <div
        className="px-3 py-4 shrink-0 border-t"
        style={{ borderColor: "rgba(255,255,255,0.08)" }}
      >
        <div
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl"
          style={{ background: "rgba(255,255,255,0.06)" }}
        >
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
            style={{
              background: `linear-gradient(135deg, ${colorTheme}, #D4AF37)`,
              boxShadow: `0 4px 12px ${colorTheme}40`,
            }}
          >
            <span style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>
              {(user as any)?.initials ?? "?"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p style={{ color: "white", fontSize: "12.5px", fontWeight: 600 }}>
              {(user as any)?.name ?? "Guest"}
            </p>
            <p style={{ color: "rgba(255,255,255,0.4)", fontSize: "10px" }}>
              {roleLabelVi}
            </p>
          </div>
          <div
            className="w-2 h-2 rounded-full shrink-0"
            style={{ background: "#4ade80", boxShadow: "0 0 6px #4ade80" }}
          />
        </div>
      </div>
    </aside>
  );
}