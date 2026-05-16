import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell, PieChart, Pie
} from "recharts";
import {
  TrendingUp, ShoppingBag, Users, Wallet, 
  ArrowUpRight, Sparkles, Activity, Clock, Box, Loader2, PieChart as PieChartIcon
} from "lucide-react";

// --- PHONG CÁCH GIAO DIỆN ---
const glassCard = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)",
  borderRadius: "24px",
};

const COLORS = ['#D4AF37', '#3d1a2e', '#c9a0b0', '#10b981', '#3b82f6'];
const BACKEND_URL = "http://localhost:5000";

export function Dashboard() {
  const { user } = useAuth();
  const userName = (user as any)?.HOTEN || (user as any)?.name || "Quản trị viên";

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = currentTime.getHours() < 12 ? "Chào buổi sáng" : currentTime.getHours() < 18 ? "Chào buổi chiều" : "Chào buổi tối";

  // --- STATE DỮ LIỆU ---
  const [isLoading, setIsLoading] = useState(true);
  const [kpi, setKpi] = useState({ totalRevenue: 0, newOrders: 0, totalCustomers: 0, conversionRate: 0 });
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [recentActivities, setRecentActivities] = useState<any[]>([]);

  // --- FETCH API TỪ BACKEND ---
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const res = await fetch(`${BACKEND_URL}/api/dashboard`);
        if (!res.ok) throw new Error("Mất kết nối máy chủ");
        const json = await res.json();
        
        if (json.status === "success") {
          setKpi(json.data.kpi);
          setRevenueData(json.data.revenueData);
          setCategoryData(json.data.categoryData);
          setWeeklyData(json.data.weeklyData);
          setRecentActivities(json.data.recentActivities);
        }
      } catch (error) {
        console.error("Lỗi lấy dữ liệu Dashboard", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  // Xử lý loại icon và màu sắc cho hoạt động gần đây
  const getActivityProps = (type: string) => {
    switch(type) {
      case 'order': return { icon: ShoppingBag, color: "text-emerald-600", bg: "bg-emerald-100" };
      case 'import': return { icon: Box, color: "text-blue-600", bg: "bg-blue-100" };
      case 'payment': return { icon: Wallet, color: "text-rose-600", bg: "bg-rose-100" };
      default: return { icon: Activity, color: "text-amber-600", bg: "bg-amber-100" };
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute:'2-digit' }) + " - " + date.toLocaleDateString('vi-VN');
  };

  return (
    <div className="p-8 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>
            {greeting}, {userName}!
          </h1>
          <p className="text-[#6b4153] text-[14px] mt-1">Dưới đây là tình hình kinh doanh của toàn hệ thống theo thời gian thực</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="animate-spin mb-4" color="#D4AF37" size={40} />
          <p className="text-[#9d6b7a] font-medium">Đang tổng hợp dữ liệu toàn hệ thống...</p>
        </div>
      ) : (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-6">
          
          {/* ================= THẺ THỐNG KÊ NHANH (KPI CARDS) ================= */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
            <StatCard 
              title="Doanh Thu (Tháng)" 
              value={`${kpi.totalRevenue.toLocaleString()} ₫`} 
              trend="+12.5%" icon={Wallet} color="#D4AF37" bgIcon="bg-amber-50" 
            />
            <StatCard 
              title="Đơn Hàng (Tháng)" 
              value={kpi.newOrders} 
              trend="+5.2%" icon={ShoppingBag} color="#10b981" bgIcon="bg-emerald-50" 
            />
            <StatCard 
              title="Tổng Khách Hàng" 
              value={kpi.totalCustomers} 
              trend="+18.1%" icon={Users} color="#3b82f6" bgIcon="bg-blue-50" 
            />
            <StatCard 
              title="Tỷ lệ chuyển đổi" 
              value={`${kpi.conversionRate}%`} 
              trend="-2.4%" icon={TrendingUp} color="#f43f5e" bgIcon="bg-rose-50" isNegative 
            />
          </div>

          {/* ================= KHU VỰC BIỂU ĐỒ CHÍNH ================= */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            
            {/* BIỂU ĐỒ DOANH THU (Cột chiếm 2/3) */}
            <div style={glassCard} className="p-6 xl:col-span-2 flex flex-col h-[400px]">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[#3d1a2e] text-[16px] font-bold flex items-center gap-2">
                  <Activity size={18} color="#D4AF37"/> Doanh thu 6 tháng qua
                </h2>
              </div>
              
              <div className="flex-1 min-h-0 w-full">
                {revenueData.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-[#9d6b7a] italic text-sm">Chưa có giao dịch bán hàng nào trong 6 tháng qua.</div>
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={revenueData} margin={{ top: 10, right: 10, left: 30, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#D4AF37" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#D4AF37" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(212,175,55,0.1)" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`} dx={-10}/>
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}
                        formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, 'Doanh thu']}
                      />
                      <Area type="monotone" dataKey="value" stroke="#D4AF37" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </div>
            </div>

            {/* BIỂU ĐỒ CƠ CẤU DOANH THU (Cột chiếm 1/3) */}
            <div style={glassCard} className="p-6 xl:col-span-1 flex flex-col h-[400px]">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-2 flex items-center gap-2">
                <PieChartIcon size={18} color="#D4AF37"/> Cơ cấu bán hàng
              </h2>
              <p className="text-[#9d6b7a] text-[12px] mb-4">Tỷ trọng doanh số theo thương hiệu</p>
              
              <div className="flex-1 min-h-0 w-full flex items-center justify-center relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={categoryData} cx="50%" cy="45%" innerRadius={60} outerRadius={85} paddingAngle={5} dataKey="value" stroke="none">
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: any) => [`${Number(value).toLocaleString()} ₫`, 'Doanh số']} contentStyle={{ borderRadius: '8px', border: 'none', fontSize: '12px' }}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
              
              <div className="grid grid-cols-2 gap-y-3 mt-4 shrink-0">
                {categoryData.map((item, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                    <span className="text-[#3d1a2e] text-[11px] font-bold truncate" title={item.name}>{item.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= KHU VỰC BÊN DƯỚI ================= */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* LƯU LƯỢNG ĐƠN HÀNG TRONG TUẦN */}
            <div style={glassCard} className="p-6 h-[350px] flex flex-col">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-6 flex items-center gap-2">
                <ShoppingBag size={18} color="#D4AF37"/> Lượng đơn hàng trong tuần
              </h2>
              <div className="flex-1 min-h-0 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={35}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9d6b7a', fontSize: 12}} allowDecimals={false} />
                    <Tooltip cursor={{fill: 'rgba(212,175,55,0.05)'}} contentStyle={{ borderRadius: '8px', border: 'none' }}/>
                    <Bar dataKey="orders" radius={[6, 6, 0, 0]}>
                      {weeklyData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.orders > 0 ? '#D4AF37' : '#e5e7eb'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* NHẬT KÝ HOẠT ĐỘNG GẦN ĐÂY */}
            <div style={glassCard} className="p-6 h-[350px] flex flex-col">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-[#3d1a2e] text-[16px] font-bold flex items-center gap-2">
                  <Clock size={18} color="#D4AF37"/> Hoạt động mới nhất
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto pr-2 space-y-4" style={{ scrollbarWidth: 'thin' }}>
                {recentActivities.length === 0 ? (
                  <p className="text-center text-[#9d6b7a] italic text-[13px] py-10">Chưa có hoạt động nào được ghi nhận.</p>
                ) : (
                  recentActivities.map((act, idx) => {
                    const props = getActivityProps(act.type);
                    return (
                      <ActivityItem 
                        key={idx}
                        icon={props.icon} color={props.color} bg={props.bg} 
                        title={act.title} 
                        time={formatDate(act.time)} 
                        desc={act.desc} 
                      />
                    )
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

// ================= CÁC COMPONENT PHỤ TRỢ =================

function StatCard({ title, value, trend, icon: Icon, color, bgIcon, isNegative }: any) {
  return (
    <div style={glassCard} className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform group cursor-default">
      <div className="flex justify-between items-start mb-4">
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${bgIcon} transition-colors group-hover:bg-white group-hover:shadow-sm`}>
          <Icon size={24} color={color} />
        </div>
        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold flex items-center gap-0.5 ${isNegative ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
          {isNegative ? <ArrowUpRight size={12} className="rotate-90"/> : <ArrowUpRight size={12}/>} 
          {trend}
        </span>
      </div>
      <div>
        <h3 className="text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider mb-1">{title}</h3>
        <p className="text-[#3d1a2e] text-[24px] font-black leading-none">{value}</p>
      </div>
    </div>
  );
}

function ActivityItem({ icon: Icon, color, bg, title, time, desc }: any) {
  return (
    <div className="flex gap-4 p-3 rounded-xl hover:bg-white/50 transition-colors border border-transparent hover:border-white">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${bg}`}>
        <Icon size={18} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-start mb-0.5">
          <p className="text-[13px] font-bold text-[#3d1a2e]">{title}</p>
          <span className="text-[10px] font-bold text-[#9d6b7a]">{time}</span>
        </div>
        <p className="text-[12px] text-[#6b4153] line-clamp-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}