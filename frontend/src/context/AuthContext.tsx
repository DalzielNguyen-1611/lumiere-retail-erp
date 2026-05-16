import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Định nghĩa cấu hình quyền hạn (Role Config)
export const roleConfig = {
  admin: {
    defaultPath: "/dashboard",
    // Cấp thẻ VIP đi được mọi nơi:
    allowedPaths: [
      "/dashboard", 
      "/pos", 
      "/inventory", 
      "/sales", 
      "/customers", 
      "/analytics", 
      "/hr-payroll", 
      "/multi-store", 
      "/procurement", 
      "/settings"
    ],
    color: "#D4AF37", 
    label: "Administrator",
    labelVi: "Quản trị viên",
  },
  staff: {
    defaultPath: "/pos",
  allowedPaths: ["/pos", "/customers"],
  color: "#60A5FA",
  label: "Staff",
  labelVi: "Nhân viên",
  },
  sales: {
    defaultPath: "/pos",
  allowedPaths: ["/pos", "/orders"],
  color: "#8B5CF6",
  label: "Sales",
  labelVi: "Nhân viên bán hàng",
  },
  warehouse: {
    defaultPath: "/inventory",
  allowedPaths: ["/inventory", "/receiving"],
  color: "#10B981",
  label: "Warehouse",
  labelVi: "Nhân viên kho",
  },
  accounting: {
    defaultPath: "/dashboard", // Đăng nhập xong cho vào xem Dashboard đầu tiên
    // Cấp phép cho họ vào đúng những trang đã khai báo ở Sidebar:
    allowedPaths: ["/dashboard", "/sales", "/analytics", "/hr-payroll", "/procurement"],
    color: "#10B981", // Màu xanh lá hoặc đổi thành "#F97316" tùy bạn
    label: "Accounting",
    labelVi: "Kế toán",
  },
  manager: {
    defaultPath: "/dashboard",
  allowedPaths: ["/dashboard", "/stores", "/hrm"],
  color: "#06B6D4",
  label: "Manager",
  labelVi: "Quản lý",
  },
  
};

export type UserRole = 'admin' | 'staff' | 'sales' | 'warehouse' | 'accounting' | 'manager';

// Sửa lại interface User, đồng thời export nó ra nếu sau này cần dùng ở component khác
export interface User {
  maNhanVien: number;
  username: string;
  name?: string;
  role: UserRole; // Đã cập nhật để nhận full các role từ Backend gửi về
}

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null;
  login: (user: User, token: string) => void;
  logout: () => void;
  canAccess: (path: string) => boolean;
  isLoading: boolean;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Kiểm tra token khi vừa mở App PC
  useEffect(() => {
    const token = localStorage.getItem('lumiere_token');
    const savedUser = localStorage.getItem('lumiere_user');
    if (token && savedUser) {
      setIsAuthenticated(true);
      setUser(JSON.parse(savedUser));
    }
    setIsLoading(false);
  }, []);

  const login = (userData: User, token: string) => {
    localStorage.setItem('lumiere_token', token);
    localStorage.setItem('lumiere_user', JSON.stringify(userData));
    setUser(userData);
    setIsAuthenticated(true);
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    setIsAuthenticated(false);
  };

  // Hàm kiểm tra quyền truy cập (Dùng trong AuthLayout)
  const canAccess = (path: string) => {
    if (!user) return false;
    const config = roleConfig[user.role];
    return config?.allowedPaths.some(p => path.startsWith(p));
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, canAccess, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook để dùng nhanh ở các component khác
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};