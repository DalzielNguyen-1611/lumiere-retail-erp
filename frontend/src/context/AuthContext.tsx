import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// 1. Định nghĩa cấu hình quyền hạn (Role Config)
export const roleConfig = {
  admin: {
    defaultPath: "/dashboard",
    allowedPaths: ["/dashboard", "/inventory", "/hrm", "/finance"],
  },
  staff: {
    defaultPath: "/pos",
    allowedPaths: ["/pos", "/customers"],
  },
};

interface User {
  maNhanVien: number;
  username: string;
  role: 'admin' | 'staff'; // Khớp với dữ liệu từ Oracle
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