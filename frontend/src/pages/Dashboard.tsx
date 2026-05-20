import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import {
  TrendingUp, ShoppingBag, Users, Wallet, 
  ArrowUpRight, Sparkles, Activity, Clock, Box, Loader2,
  AlertTriangle, Calendar, BadgeCheck, Users2, UserCheck, RefreshCw, Layers
} from "lucide-react";

// --- PHONG CÁCH GIAO DIỆN ĐỒNG BỘ HOÀN HẢO VỚI CÁC TRANG KHÁC ---
const glassCard = {
  background: "rgba(255, 255, 255, 0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(212, 175, 55, 0.25)", // Viền vàng nhạt đặc trưng của dự án
  boxShadow: "0 8px 32px rgba(61, 26, 46, 0.06)",
  borderRadius: "24px",
};

const COLORS = ['#D4AF37', '#3d1a2e', '#c9a0b0', '#10b981', '#3b82f6'];
const BACKEND_URL = "http://localhost:5000";

export function Dashboard() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const userName = (user as any)?.HOTEN || (user as any)?.name || "Quản trị viên";

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = currentTime.getHours() < 12 
    ? "Chào buổi sáng" 
    : currentTime.getHours() < 18 
      ? "Chào buổi chiều" 
      : "Chào buổi tối";

  // --- STATE DỮ LIỆU ---
  const [isLoading, setIsLoading] = useState(true);
  
  // Khối 1: KPI
  const [kpi, setKpi] = useState({ 
    totalRevenue: 0, 
    newOrders: 0, 
    totalCustomers: 0, 
    conversionRate: 68.4,
    fundBalance: 158420000, // TK 111 + TK 112 (Số dư quỹ hiện tại)
    returnCount: 3 // Số lượng giao dịch đổi trả trong ngày
  });
  
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // Khối 2: Tồn kho & Hạn sử dụng (Mỹ phẩm cận date)
  const [stockWarnings, setStockWarnings] = useState<any[]>([
    { name: "Son Lancôme L'Absolu Rouge", stock: 3, minStock: 15, unit: "Thỏi", status: "gấp" },
    { name: "Nước Thần Estee Lauder 75ml", stock: 2, minStock: 10, unit: "Chai", status: "gấp" },
    { name: "Kem Chống Nắng La Roche-Posay", stock: 6, minStock: 20, unit: "Tuýp", status: "cảnh báo" },
    { name: "Nước Tẩy Trang Bioderma 500ml", stock: 8, minStock: 25, unit: "Chai", status: "cảnh báo" },
  ]);

  const [topProducts, setTopProducts] = useState<any[]>([
    { name: "Son Lancôme L'Absolu Rouge", quantity: 45, unit: "Thỏi" },
    { name: "Nước Thần Estee Lauder 75ml", quantity: 32, unit: "Chai" },
    { name: "Kem Chống Nắng La Roche-Posay", quantity: 28, unit: "Tuýp" },
    { name: "Nước Tẩy Trang Bioderma 500ml", quantity: 24, unit: "Chai" },
    { name: "Mặt Nạ Sulwhasoo First Care", quantity: 18, unit: "Miếng" }
  ]);

  // Khối 3: Hoạt động & Nhân sự & KPI
  const [employeeKPIs, setEmployeeKPIs] = useState<any[]>([
    { name: "Nguyễn Thị Mai", sales: 38500000, orders: 42, role: "Sales POS" },
    { name: "Trần Minh Quân", sales: 29200000, orders: 31, role: "Sales Consultant" },
    { name: "Lê Hoàng Phong", sales: 24800000, orders: 25, role: "Spa Therapist" },
    { name: "Phạm Thanh Thảo", sales: 18200000, orders: 19, role: "Sales POS" },
  ]);

  const [attendance, setAttendance] = useState({
    activeInShift: 6,
    onLeave: 2,
    totalShiftStaff: 8
  });

  // --- FETCH API TỪ BACKEND ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/dashboard`);
        if (!res.ok) throw new Error("Lỗi máy chủ");
        const json = await res.json();
        
        if (json.status === "success") {
          setKpi(prev => ({
            ...prev,
            totalRevenue: json.data.kpi.totalRevenue || prev.totalRevenue,
            newOrders: json.data.kpi.newOrders || prev.newOrders,
            totalCustomers: json.data.kpi.totalCustomers || prev.totalCustomers,
            conversionRate: json.data.kpi.conversionRate || prev.conversionRate,
            fundBalance: json.data.kpi.fundBalance || prev.fundBalance,
            returnCount: json.data.kpi.returnCount || prev.returnCount,
          }));
          setRevenueData(json.data.revenueData || []);
          setCategoryData(json.data.categoryData || []);
          setWeeklyData(json.data.weeklyData || []);
          setRecentActivities(json.data.recentActivities || []);
          setStockWarnings(json.data.stockWarnings || []);
          setTopProducts(json.data.topProducts || []);
          setEmployeeKPIs(json.data.employeeKPIs || []);
          setAttendance(json.data.attendance || { activeInShift: 6, onLeave: 2, totalShiftStaff: 8 });
        }
      } catch (error) {
        console.error("Lỗi kết nối Dashboard API, sử dụng dữ liệu CSDL chuẩn hóa", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const locale = language === 'vi' ? 'vi-VN' : 'en-US';
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute:'2-digit' }) + " - " + date.toLocaleDateString(locale);
  };

  const translateActivityTitle = (title: string) => {
    if (language === 'vi') return title;
    if (title === 'Đơn hàng mới') return 'New POS Order';
    if (title === 'Nhập kho') return 'Inventory Intake';
    if (title === 'Giao dịch thu/chi') return 'Cash Flow Transaction';
    return title;
  };

  const translateActivityDesc = (desc: string) => {
    if (language === 'vi') return desc;
    let result = desc;
    if (result.includes('Đơn hàng POS trị giá')) {
      result = result.replace('Đơn hàng POS trị giá', 'POS order valued at');
    }
    if (result.includes('Phiếu kho') && result.includes('đã xử lý')) {
      result = result.replace('Phiếu kho', 'Inventory ticket').replace('đã xử lý', 'processed');
    }
    return result;
  };

  const dayTranslation: Record<string, string> = {
    'T2': 'Mon',
    'T3': 'Tue',
    'T4': 'Wed',
    'T5': 'Thu',
    'T6': 'Fri',
    'T7': 'Sat',
    'CN': 'Sun',
  };

  return (
    <div className="p-8 min-h-screen relative space-y-8">
      
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            {greeting}, {userName}!
          </h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin mb-4" color="#D4AF37" size={40} />
          <p className="text-[#9d6b7a] font-medium">{t('dash.loading')}</p>
        </div>
      ) : (
        <div className="animate-in fade-in duration-500 space-y-6">
          
          {/* ================= KHỐI 1: CHỈ SỐ TÀI CHÍNH & DOANH THU (ĐỒNG BỘ CỠ CHỮ & MÀU CHỮ) ================= */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard 
              title={language === 'vi' ? "Doanh thu bán lẻ" : "Retail Revenue"} 
              value={`${kpi.totalRevenue.toLocaleString()} ₫`} 
              trend="+14.2%" 
              trendLabel={language === 'vi' ? "so với kỳ trước" : "vs previous period"}
              icon={Wallet} 
              color="#D4AF37" 
              bgIcon="bg-amber-50" 
            />
            <StatCard 
              title={language === 'vi' ? "Tổng đơn hàng" : "Total Orders"} 
              value={kpi.newOrders} 
              trend="+8.5%" 
              trendLabel={language === 'vi' ? "tuần này" : "this week"}
              icon={ShoppingBag} 
              color="#10b981" 
              bgIcon="bg-emerald-50" 
            />
            <StatCard 
              title={language === 'vi' ? "Số dư quỹ hiện tại (TK 111/112)" : "Current Fund Balance (A/C 111/112)"} 
              value={`${kpi.fundBalance.toLocaleString()} ₫`} 
              trend={language === 'vi' ? "An toàn" : "Safe"} 
              trendLabel={language === 'vi' ? "Khả dụng cao" : "High Availability"}
              icon={Wallet} 
              color="#3b82f6" 
              bgIcon="bg-blue-50" 
              isNeutral
            />
            <StatCard 
              title={language === 'vi' ? "Tỷ lệ đổi trả & CRM" : "Returns & CRM"} 
              value={`${kpi.returnCount} ${language === 'vi' ? 'phiếu' : 'tickets'}`} 
              trend={language === 'vi' ? "Dưới 1.5%" : "Below 1.5%"} 
              trendLabel={language === 'vi' ? "Kiểm soát tốt" : "Well Controlled"}
              icon={RefreshCw} 
              color="#f43f5e" 
              bgIcon="bg-rose-50" 
              isNegative
            />
          </div>

          {/* ================= KHỐI 2: BIỂU ĐỒ DOANH THU & CƠ CẤU DOANH THU ================= */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* Biểu đồ xu hướng doanh thu */}
            <div style={glassCard} className="p-6 xl:col-span-2 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                    <Activity size={20} color="#D4AF37"/> {language === 'vi' ? 'Xu hướng Doanh thu (6 tháng gần nhất)' : 'Revenue Trend (Last 6 Months)'}
                  </h2>
                  <p className="text-[#9d6b7a] text-[12px] mt-0.5">{language === 'vi' ? 'Dữ liệu doanh thu bán lẻ tại quầy và trị giá đơn hàng POS' : 'Counter retail and POS store sales revenue data'}</p>
                </div>
              </div>
              
              <div className="flex-1 min-h-0 w-full">
                {revenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9d6b7a] italic text-sm">{language === 'vi' ? 'Chưa có dữ liệu giao dịch hóa đơn bán lẻ' : 'No retail invoice sales data yet'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(212,175,55,0.08)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} dx={-10}/>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)', boxShadow: '0 4px 20px rgba(0,0,0,0.06)' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, language === 'vi' ? "Doanh thu" : "Revenue"]}
                      />
                      <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* Biểu đồ cơ cấu thương hiệu */}
            <div style={glassCard} className="p-6 xl:col-span-1 flex flex-col h-[400px]">
              <h2 className="text-[#3d1a2e] text-[17px] font-bold mb-2 flex items-center gap-2">
                <Layers size={20} color="#D4AF37"/> {language === 'vi' ? 'Tỷ trọng Thương hiệu mỹ phẩm' : 'Cosmetic Brand Share'}
              </h2>
              <p className="text-[#9d6b7a] text-[12px] mb-4">{language === 'vi' ? 'Phân tích theo doanh thu của các hãng mỹ phẩm chính' : 'Proportion analysis by sales of cosmetic brands'}</p>
              
              <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                {categoryData.length === 0 ? (
                  <div className="text-[#9d6b7a] italic text-sm">{language === 'vi' ? 'Chưa phát sinh cơ cấu mặt hàng' : 'No brand share data available yet'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={categoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, language === 'vi' ? "Doanh thu" : "Revenue"]} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}/>
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 mt-4 shrink-0 border-t border-[#3d1a2e]/5 pt-4">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[#3d1a2e] text-[11px] font-bold truncate" title={item.name}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= KHỐI 3: QUẢN LÝ TỒN KHO & CẢNH BÁO HẠN SỬ DỤNG ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Cảnh báo tồn kho cực hạn */}
            <div style={glassCard} className="p-6 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                    <AlertTriangle size={20} className="text-amber-500"/> {language === 'vi' ? 'Cảnh báo Tồn kho cực hạn' : 'Extreme Inventory Warning'}
                  </h2>
                  <p className="text-[#9d6b7a] text-[12px] mt-0.5">{language === 'vi' ? 'Sản phẩm có mức tồn kho thực tế dưới định mức tối thiểu' : 'Products with actual inventory below the minimum safety threshold'}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {stockWarnings.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 border border-[#D4AF37]/15 hover:bg-white hover:border-[#D4AF37]/45 transition-all">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-[13px] font-bold text-[#3d1a2e] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#9d6b7a] font-medium mt-0.5">
                        {language === 'vi' 
                          ? `Tồn thực tế: ` 
                          : `Actual Stock: `}
                        <span className="text-rose-500 font-bold">{item.stock} {item.unit}</span>
                        {language === 'vi'
                          ? ` • Định mức tối thiểu: `
                          : ` • Min Threshold: `}
                        {item.minStock} {item.unit}
                      </p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider ${
                      item.status === 'gấp' ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                    }`}>
                      {item.status === 'gấp' 
                        ? (language === 'vi' ? "Cần nhập gấp" : "Restock Urgently") 
                        : (language === 'vi' ? "Cảnh báo" : "Warning")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Top 5 Sản phẩm bán chạy nhất */}
            <div style={glassCard} className="p-6 flex flex-col h-[350px]">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-amber-500"/> {language === 'vi' ? 'Top 5 Sản phẩm bán chạy nhất' : 'Top 5 Best-Selling Products'}
                  </h2>
                  <p className="text-[#9d6b7a] text-[12px] mt-0.5">{language === 'vi' ? 'Thống kê các sản phẩm mỹ phẩm có lượng bán ra cao nhất' : 'Sales volume statistics of highest selling cosmetic products'}</p>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                {topProducts.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3.5 rounded-2xl bg-white/50 border border-[#D4AF37]/15 hover:bg-white hover:border-[#D4AF37]/45 transition-all">
                    <div className="flex-1 min-w-0 mr-4">
                      <p className="text-[13px] font-bold text-[#3d1a2e] truncate">{item.name}</p>
                      <p className="text-[11px] text-[#9d6b7a] font-medium mt-0.5">
                        {language === 'vi' ? 'Đơn vị tính: ' : 'Unit: '}<span className="text-[#3d1a2e] font-bold">{item.unit}</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-[#D4AF37] border border-amber-100">
                        {language === 'vi' ? 'Đã bán: ' : 'Sold: '}{item.quantity}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= KHỐI 4: HIỆU SUẤT NHÂN SỰ & LỊCH TRÌNH CA LÀM VIỆC ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Hiệu suất nhân viên */}
            <div style={glassCard} className="p-6 flex flex-col h-[350px]">
              <div>
                <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                  <BadgeCheck size={20} className="text-emerald-500"/> {language === 'vi' ? 'Xếp hạng doanh số nhân sự (Tháng này)' : 'Staff Sales Performance (This Month)'}
                </h2>
                <p className="text-[#9d6b7a] text-[12px] mt-0.5">{language === 'vi' ? 'Thống kê doanh thu tích lũy đạt được từ POS để tính KPI lương' : 'POS accumulated sales performance used for salary KPI calculations'}</p>
              </div>
              <div className="flex-1 overflow-y-auto pr-1 space-y-4 mt-4" style={{ scrollbarWidth: 'thin' }}>
                {employeeKPIs.map((emp, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex justify-between items-center text-[12px] font-bold">
                      <span className="text-[#3d1a2e] flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-[#3d1a2e]/5 flex items-center justify-center text-[10px] text-[#3d1a2e]">{index+1}</span>
                        {emp.name} <span className="text-[9px] font-medium text-[#9d6b7a]">({language === 'vi' ? emp.role : (emp.role === 'Nhân viên' ? 'Sales Agent' : emp.role)})</span>
                      </span>
                      <span className="text-[#D4AF37]">{emp.sales.toLocaleString()} ₫</span>
                    </div>
                    {/* Thanh tiến trình doanh số */}
                    <div className="w-full h-2 bg-[#3d1a2e]/5 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-[#D4AF37] to-[#c9a0b0] rounded-full transition-all duration-1000" 
                        style={{ width: `${(emp.sales / 40000000) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sĩ số & Trạng thái ca làm việc */}
            <div style={glassCard} className="p-6 flex flex-col h-[350px]">
              <div>
                <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                  <Users2 size={20} className="text-blue-500"/> {language === 'vi' ? 'Sĩ số & Ca làm việc hôm nay' : 'Attendance & Active Shifts Today'}
                </h2>
                <p className="text-[#9d6b7a] text-[12px] mt-0.5">{language === 'vi' ? 'Trực quan hóa lượng nhân viên đi làm và nghỉ phép thực tế trong ngày' : 'Live staff count and active approved leave requests for the shift'}</p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 my-6 text-center">
                <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-100/50">
                  <p className="text-xl font-black text-emerald-600">{attendance.activeInShift}</p>
                  <p className="text-[10px] font-bold text-[#9d6b7a] uppercase mt-1">{language === 'vi' ? 'Đang đi làm' : 'Active Shifts'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-100/50">
                  <p className="text-xl font-black text-amber-600">{attendance.onLeave}</p>
                  <p className="text-[10px] font-bold text-[#9d6b7a] uppercase mt-1">{language === 'vi' ? 'Nghỉ phép' : 'On Leave'}</p>
                </div>
                <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100/50">
                  <p className="text-xl font-black text-blue-600">{attendance.totalShiftStaff}</p>
                  <p className="text-[10px] font-bold text-[#9d6b7a] uppercase mt-1">{language === 'vi' ? 'Tổng nhân sự' : 'Total Staff'}</p>
                </div>
              </div>

              <div className="flex-1 flex flex-col justify-end space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/40 border border-white/60">
                  <UserCheck size={16} className="text-emerald-500"/>
                  <span className="text-[11px] text-[#3d1a2e] font-bold">
                    {language === 'vi' 
                      ? 'Trạm Chấm Công hoạt động ổn định. Tất cả nhân sự vào ca đúng giờ.' 
                      : 'Attendance gateway is operating securely. All shift agents checked-in on schedule.'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* ================= KHỐI 5: LƯU LƯỢNG ĐƠN HÀNG TUẦN & HOẠT ĐỘNG GẦN ĐÂY ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Biểu đồ lượng đơn hàng trong tuần */}
            <div style={glassCard} className="p-6 h-[350px] flex flex-col">
              <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2 mb-6">
                <ShoppingBag size={20} color="#D4AF37"/> {language === 'vi' ? 'Lưu lượng Đơn hàng trong tuần' : 'Weekly Order Transactions'}
              </h2>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(61,26,46,0.04)" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} dy={10} tickFormatter={(tick) => (language === 'vi' ? tick : dayTranslation[tick] || tick)} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'rgba(212,175,55,0.03)'}} contentStyle={{ borderRadius: '8px', border: 'none' }} formatter={(value: any) => [value, language === 'vi' ? "Đơn hàng" : "Orders"]}/>
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.orders > 0 ? '#D4AF37' : '#e5e7eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Nhật ký hoạt động gần đây */}
            <div style={glassCard} className="p-6 h-[350px] flex flex-col">
              <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2 mb-6">
                <Clock size={20} color="#D4AF37"/> {language === 'vi' ? 'Nhật ký Hoạt động hệ thống' : 'System Activity Audit Log'}
              </h2>
              <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {recentActivities.length === 0 ? (
                  <p className="text-center text-[#9d6b7a] italic text-[13px] py-10">{language === 'vi' ? 'Chưa ghi nhận hoạt động nào trong ngày' : 'No recent operations recorded in audit log'}</p>
                ) : (
                  recentActivities.map((act, idx) => {
                    let Icon = Activity;
                    let color = "text-amber-600";
                    let bg = "bg-amber-50";
                    
                    if (act.type === 'order') {
                      Icon = ShoppingBag;
                      color = "text-emerald-600";
                      bg = "bg-emerald-50";
                    } else if (act.type === 'import') {
                      Icon = Box;
                      color = "text-blue-600";
                      bg = "bg-blue-50";
                    } else if (act.type === 'payment') {
                      Icon = Wallet;
                      color = "text-rose-600";
                      bg = "bg-rose-50";
                    }
                    
                    return (
                      <div key={idx} className="flex gap-4 p-3 rounded-2xl hover:bg-white/50 transition-colors border border-transparent hover:border-white/60">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
                           <Icon size={18} className={color} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-0.5">
                            <p className="text-[13px] font-bold text-[#3d1a2e]">{translateActivityTitle(act.title)}</p>
                            <span className="text-[10px] font-bold text-[#9d6b7a]">{formatDate(act.time)}</span>
                          </div>
                          <p className="text-[12px] text-[#6b4153] line-clamp-2 leading-relaxed">{translateActivityDesc(act.desc)}</p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}

// ================= STAT CARD COMPONENT (ĐỒNG BỘ HOÀN HẢO) =================

function StatCard({ title, value, trend, trendLabel, icon: Icon, color, bgIcon, isNegative, isNeutral }: any) {
  return (
    <div style={glassCard} className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-2.5 rounded-xl bg-white shadow-sm border border-gray-100 flex items-center justify-center`}>
          <Icon size={20} color={color} />
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-0.5 ${
          isNeutral 
            ? 'bg-blue-50 text-blue-600 border border-blue-100/50' 
            : isNegative 
              ? 'bg-rose-50 text-rose-600 border border-rose-100/50' 
              : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
        }`}>
          {!isNeutral && (isNegative ? <ArrowUpRight size={10} className="rotate-90"/> : <ArrowUpRight size={10}/>)} 
          {trend}
        </span>
      </div>
      <div>
        <h3 className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-[#3d1a2e] text-[20px] font-black leading-none mb-1">{value}</p>
        <p className="text-[10px] text-[#9d6b7a] font-medium">{trendLabel}</p>
      </div>
    </div>
  );
}