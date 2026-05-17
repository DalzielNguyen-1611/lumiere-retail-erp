import React, { useState, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";
import { 
  Clock, CalendarCheck, CalendarX, Fingerprint, LogOut, CheckCircle2, 
  Send, Sparkles, FileText, Clock3
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { toast } from "sonner";

const glassCard = { 
  background: "rgba(255,255,255,0.72)", 
  backdropFilter: "blur(20px)", 
  WebkitBackdropFilter: "blur(20px)", 
  border: "1px solid rgba(255,255,255,0.9)", 
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)", 
  borderRadius: "24px" 
};

const BACKEND_URL = "http://localhost:5000";

const formatTimeWithSeconds = (date: Date) => {
  const pad = (num: number) => num.toString().padStart(2, "0");
  return `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
};

export function TimeManagement() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"attendance" | "leave">("attendance");
  const [history, setHistory] = useState<any[]>([]);
  const [leaveHistory, setLeaveHistory] = useState<any[]>([]); 
  
  const { user } = useAuth();
  const employeeId = (user as any)?.id || (user as any)?.MANHANVIEN || 1;

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/attendance/${employeeId}`);
      const json = await res.json();
      if (json.status === 'success') setHistory(json.data);
    } catch (error) { console.log("Chưa kết nối API Chấm công"); }
  };

  const fetchLeaveHistory = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/leave-history/${employeeId}`);
      const json = await res.json();
      if (json.status === 'success') setLeaveHistory(json.data);
    } catch (error) { console.log("Lỗi fetch lịch sử nghỉ phép"); }
  };

  useEffect(() => {
    if (activeTab === "attendance") fetchAttendance();
    if (activeTab === "leave") fetchLeaveHistory();
  }, [activeTab, employeeId]);

  const handleCheckIn = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const json = await res.json();
      if (json.status === 'success') {
        toast.success(t('time.toast_in_success'), { description: t('time.toast_in_desc') });
        fetchAttendance();
      } else {
        toast.warning(json.message);
      }
    } catch (error) { toast.error(t('time.toast_err_conn')); }
  };
 
  const handleCheckOut = async () => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/check-out`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId })
      });
      const json = await res.json();
      if (json.status === 'success') {
        toast.success(json.message, { description: t('time.toast_out_desc') });
        fetchAttendance(); 
      } else {
        toast.warning(json.message); 
      }
    } catch (error) { toast.error(t('time.toast_err_conn')); }
  };
  
  const [leaveForm, setLeaveForm] = useState({ type: language === 'vi' ? 'Nghỉ phép năm (Có lương)' : 'Annual leave (Paid)', fromDate: '', toDate: '', days: 1, reason: '' });
  // =========================================================================
  // THÊM EFFECT TỰ ĐỘNG TÍNH NGÀY NGHỈ
  // =========================================================================
  useEffect(() => {
    if (leaveForm.fromDate && leaveForm.toDate) {
      const start = new Date(leaveForm.fromDate);
      const end = new Date(leaveForm.toDate);
      
      // Nếu "Đến ngày" lớn hơn hoặc bằng "Từ ngày", ta tính khoảng cách
      if (end >= start) {
        const diffTime = end.getTime() - start.getTime();
        // Tính ra số ngày và cộng thêm 1 (Vì nghỉ từ mùng 1 đến mùng 1 tính là 1 ngày)
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        setLeaveForm(prev => ({ ...prev, days: diffDays }));
      } else {
        // Nếu chọn sai ngày (Đến ngày nhỏ hơn Từ ngày) thì set về 0
        setLeaveForm(prev => ({ ...prev, days: 0 }));
      }
    }
  }, [leaveForm.fromDate, leaveForm.toDate]);

  const handleLeaveSubmit = async (e: any) => {
    e.preventDefault();
    if (leaveForm.days <= 0) {
      toast.error(t('time.date_err'), { description: t('time.date_err_desc') });
      return;
    }
 
    try {
      const res = await fetch(`${BACKEND_URL}/api/tm/leave`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId, ...leaveForm })
      });
      const json = await res.json();
      if (json.status === 'success') {
        toast.success(t('time.submit_success'), { description: json.message });
        setLeaveForm({ type: language === 'vi' ? 'Nghỉ phép năm (Có lương)' : 'Annual leave (Paid)', fromDate: '', toDate: '', days: 1, reason: '' });
        fetchLeaveHistory(); 
      } else toast.error(json.message);
    } catch (error) { toast.error(t('time.submit_err')); }
  };

  return (
    <div className="p-8 min-h-screen">
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
            {language === 'vi' ? 'Công Ca & Nghỉ Phép' : 'Attendance & Leave'}
          </h1>
        </div>
        
        {/* TABS */}
        <div className="flex gap-1 p-1 bg-white/50 rounded-2xl border border-white shadow-inner">
          <TabButton active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={Fingerprint} label={language === 'vi' ? "Chấm Công" : "Attendance"} />
          <TabButton active={activeTab === "leave"} onClick={() => setActiveTab("leave")} icon={CalendarX} label={language === 'vi' ? "Xin Nghỉ Phép" : "Leave Request"} />
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        
        {/* ======================= TAB 1: CHẤM CÔNG ======================= */}
        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            
            {/* 70% bên trái: Lịch sử & Thống kê */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Khối Thẻ Thống Kê nhanh */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div style={glassCard} className="p-5 text-center flex flex-col justify-center items-center">
                  <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-1">
                    {language === 'vi' ? 'Số ca hoàn thành' : 'Shifts Completed'}
                  </p>
                  <p className="text-2xl font-black text-[#3d1a2e]">
                    {history.filter(h => h.status !== 'Đang làm việc').length} ca
                  </p>
                </div>
                <div style={glassCard} className="p-5 text-center flex flex-col justify-center items-center">
                  <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-1">
                    {language === 'vi' ? 'Tổng giờ làm việc' : 'Total Work Hours'}
                  </p>
                  <p className="text-2xl font-black text-[#D4AF37]">
                    {history.reduce((sum, h) => sum + (h.workHours || 0), 0).toFixed(1)} h
                  </p>
                </div>
                <div style={glassCard} className="p-5 text-center flex flex-col justify-center items-center">
                  <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-1">
                    {language === 'vi' ? 'Tăng ca (OT)' : 'Overtime Hours'}
                  </p>
                  <p className="text-2xl font-black text-emerald-600">
                    {history.reduce((sum, h) => sum + (h.overtime || 0), 0).toFixed(1)} h
                  </p>
                </div>
              </div>

              {/* Khối Bảng Lịch sử */}
              <div style={glassCard} className="p-6 md:p-8">
                <h3 className="text-[#3d1a2e] font-bold mb-5 flex items-center gap-2 text-[15px]">
                  <CalendarCheck size={18} color="#D4AF37" /> {t('time.history_title')}
                </h3>
                
                <div className="overflow-x-auto bg-white/40 rounded-xl border border-white shadow-sm">
                  <table className="w-full text-left border-collapse whitespace-nowrap">
                    <thead>
                      <tr className="bg-white/60 border-b border-gray-100">
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_date')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_in')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_out')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_work')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_ot')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_status')}</th>
                        <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_notes')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.length > 0 ? history.map((item, index) => (
                        <tr key={index} className="border-b border-gray-100/50 hover:bg-white/70 transition-colors">
                          <td className="py-3 px-5 text-[#3d1a2e] text-[13px] font-bold">{item.date}</td>
                          <td className="py-3 px-5 text-[#3d1a2e] text-[13px]">{item.checkIn}</td>
                          <td className="py-3 px-5 text-[#3d1a2e] text-[13px]">
                            {item.status === 'Đang làm việc' ? '--:--:--' : item.checkOut}
                          </td>
                          <td className="py-3 px-5 text-[#3d1a2e] text-[13px] font-medium">
                            {item.status === 'Đang làm việc' ? '--' : `${item.workHours || 0} ${t('time.hours')}`}
                          </td>
                          <td className="py-3 px-5 text-[#3d1a2e] text-[13px]">
                            {item.overtime || 0} {t('time.hours')}
                          </td>
                          <td className="py-3 px-5">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                              item.status === 'Đang làm việc' 
                                ? 'bg-amber-100 text-amber-700' 
                                : 'bg-emerald-100 text-emerald-700'
                            }`}>
                              {item.status === 'Đang làm việc' ? <Clock size={12}/> : <CheckCircle2 size={12}/>} 
                              {item.status === 'Đang làm việc' ? t('time.working') : (language === 'vi' ? 'Đã kết ca' : 'Completed')}
                            </span>
                          </td>
                          <td className="py-3 px-5 text-[#9d6b7a] text-[12px] max-w-[150px] truncate" title={item.notes}>
                            {item.notes}
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan={7} className="py-10 text-center text-[#9d6b7a] text-[13px] italic">
                            {t('time.no_attendance')}
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* 30% bên phải: Trạm Chấm Công (Card Đóng gói) */}
            <div className="lg:col-span-1">
              <div 
                style={{ 
                  ...glassCard, 
                  background: "linear-gradient(135deg, rgba(255,255,255,0.85) 0%, rgba(253,248,240,0.85) 100%)",
                  border: "2px solid rgba(212,175,55,0.25)",
                  boxShadow: "0 12px 40px rgba(212,175,55,0.08)"
                }} 
                className="p-6 flex flex-col justify-between relative overflow-hidden"
              >
                {/* Họa tiết trang trí nhẹ nhàng thương hiệu */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-[#D4AF37]/5 rounded-bl-full pointer-events-none"></div>

                <div className="text-center pb-6 border-b border-[#D4AF37]/15">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D4AF37]/10 text-[#D4AF37] rounded-full text-[10px] font-bold tracking-widest uppercase mb-4">
                    <Fingerprint size={12}/> {language === 'vi' ? 'Trạm Chấm Công' : 'Attendance Station'}
                  </span>
                  
                  {/* Action Clock: To, Đậm, Font Monospace và ĐẾM GIÂY liên tục */}
                  <h2 className="text-[#3d1a2e] text-[38px] font-black tracking-widest font-mono leading-none mb-2 tabular-nums">
                    {formatTimeWithSeconds(currentTime)}
                  </h2>

                  <p className="text-[#9d6b7a] text-[12px] font-semibold uppercase tracking-wider">
                    {currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>

                {/* Trạng thái hiện tại */}
                <div className="py-6 flex flex-col items-center">
                  <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-2">
                    {language === 'vi' ? 'Trạng thái nhân sự' : 'Your Shift Status'}
                  </p>
                  
                  {history.length > 0 && history[0].status === 'Đang làm việc' ? (
                    <span className="px-4 py-2 bg-amber-50 border border-amber-200 text-amber-700 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-sm animate-pulse">
                      <Clock size={14} className="animate-spin" style={{ animationDuration: '6s' }} /> {language === 'vi' ? 'Đang Trong Ca Làm Việc' : 'Active In Shift'}
                    </span>
                  ) : (
                    <span className="px-4 py-2 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[12px] font-bold flex items-center gap-1.5 shadow-sm">
                      <Clock3 size={14}/> {language === 'vi' ? 'Chưa Vào Ca' : 'Out of Shift'}
                    </span>
                  )}
                </div>

                {/* Nút bấm check-in/out khổng lồ được neo an toàn vào Card */}
                <div className="space-y-4 pt-2">
                  {history.length > 0 && history[0].status === 'Đang làm việc' ? (
                    <button 
                      onClick={handleCheckOut} 
                      className="w-full py-4 bg-gradient-to-r from-rose-500 to-red-600 hover:from-rose-600 hover:to-red-700 text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all text-[14px] cursor-pointer"
                    >
                      <LogOut size={18}/> {language === 'vi' ? 'KẾT CA (CHECK OUT)' : 'SHIFT COMPLETE (CHECK OUT)'}
                    </button>
                  ) : (
                    <button 
                      onClick={handleCheckIn} 
                      className="w-full py-4 bg-gradient-to-r from-[#D4AF37] to-[#C9A94E] hover:from-[#C9A94E] hover:to-[#Bca043] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all text-[14px] cursor-pointer"
                    >
                      <Fingerprint size={18}/> {language === 'vi' ? 'BẮT ĐẦU CA (CHECK IN)' : 'START SHIFT (CHECK IN)'}
                    </button>
                  )}

                  {/* Chân đế cho nút bấm */}
                  <div className="pt-4 border-t border-gray-100 flex flex-col items-center text-center gap-1.5">
                    <p className="text-[11px] text-gray-400 italic leading-snug">
                      {language === 'vi' 
                        ? 'Hệ thống tự động ghi nhận vị trí IP và thời gian thực lúc bấm nút.' 
                        : 'System automatically logs IP location and real-time upon clicking.'}
                    </p>
                    <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                      <span>📍</span>
                      <span>
                        {language === 'vi' ? 'Chi nhánh: Lumière Quận 1' : 'Branch: Lumière District 1'}
                      </span>
                    </div>
                  </div>
                </div>

              </div>
            </div>

          </div>
        )}

        {/* ======================= TAB 2: NGHỈ PHÉP ======================= */}
        {activeTab === "leave" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div style={glassCard} className="p-6 lg:col-span-1 h-fit">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-5 flex items-center gap-2">
                <CalendarX size={18} color="#D4AF37"/> {t('time.create_leave')}
              </h2>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">{t('time.leave_type')}</label>
                  <select className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]" 
                    value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}>
                    <option value={language === 'vi' ? 'Nghỉ phép năm (Có lương)' : 'Annual leave (Paid)'}>{t('time.leave_annual')}</option>
                    <option value={language === 'vi' ? 'Nghỉ ốm' : 'Sick leave'}>{t('time.leave_sick')}</option>
                    <option value={language === 'vi' ? 'Nghỉ việc riêng (Không lương)' : 'Unpaid personal leave'}>{t('time.leave_unpaid')}</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">{t('time.from_date')}</label>
                    <input type="date" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]"
                      value={leaveForm.fromDate} onChange={e => setLeaveForm({...leaveForm, fromDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">{t('time.to_date')}</label>
                    <input type="date" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]"
                      value={leaveForm.toDate} onChange={e => setLeaveForm({...leaveForm, toDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase flex justify-between">
                    <span>{t('time.total_days')}</span>
                    <span className="text-[10px] text-amber-600 italic font-normal lowercase">{t('time.auto_calc')}</span>
                  </label>
                  <input type="number" min="0.5" step="0.5" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-emerald-50/50 outline-none focus:border-[#D4AF37] font-bold text-[#3d1a2e]"
                    value={leaveForm.days} onChange={e => setLeaveForm({...leaveForm, days: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">{t('time.reason')}</label>
                  <textarea rows={3} required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37] resize-none"
                    value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-[#3d1a2e] hover:bg-[#2a111f] text-white py-3 rounded-xl font-bold transition-all shadow-md mt-2 flex justify-center items-center gap-2 text-[13px]">
                  <Send size={16}/> {t('time.submit_leave')}
                </button>
              </form>
            </div>

            <div style={glassCard} className="p-6 lg:col-span-2">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-5 flex items-center gap-2">
                <FileText size={18} color="#D4AF37"/> {t('time.submitted_leaves')}
              </h2>
              
              <div className="overflow-x-auto bg-white/40 rounded-xl border border-white shadow-sm">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white/60 border-b border-gray-100">
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.leave_col_type')}</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.leave_col_time')}</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.leave_col_days')}</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">{t('time.col_status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.length > 0 ? leaveHistory.map((item, index) => {
                      const typeLabel = item.type === 'Nghỉ phép năm (Có lương)' ? t('time.leave_annual') : 
                                        item.type === 'Nghỉ ốm' ? t('time.leave_sick') : 
                                        item.type === 'Nghỉ việc riêng (Không lương)' ? t('time.leave_unpaid') : item.type;
                      const statusLabel = item.status === 'Chờ duyệt' ? t('time.pending') : 
                                          item.status === 'Đã duyệt' ? t('time.approved') : t('time.rejected');
                      return (
                        <tr key={index} className="border-b border-gray-100/50 hover:bg-white/70 transition-colors">
                          <td className="py-3 px-4 text-[#3d1a2e] text-[13px] font-bold">{typeLabel}</td>
                          <td className="py-3 px-4 text-[#9d6b7a] text-[13px]">{item.fromDate} - {item.toDate}</td>
                          <td className="py-3 px-4 text-[#3d1a2e] text-[13px] font-medium">{item.days} {t('time.days_count')}</td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                              item.status === 'Chờ duyệt' ? 'bg-amber-100 text-amber-700' : 
                              item.status === 'Đã duyệt' ? 'bg-emerald-100 text-emerald-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {item.status === 'Chờ duyệt' ? <Clock3 size={12}/> : <CheckCircle2 size={12}/>} 
                              {statusLabel}
                            </span>
                          </td>
                        </tr>
                      );
                    }) : (
                      <tr><td colSpan={4} className="py-10 text-center text-[#9d6b7a] text-[13px] italic">{t('time.no_leaves')}</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

// Component phụ trợ TabButton
function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${active ? "text-white shadow-md shadow-amber-500/20" : "text-[#6b4153] hover:bg-white"}`}
      style={{ background: active ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent" }}
    >
      <Icon size={16} />
      <span className="font-bold text-[13px]">{label}</span>
    </button>
  );
}