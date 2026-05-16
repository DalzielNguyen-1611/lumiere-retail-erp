import React, { useState, useEffect } from "react";
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

export function TimeManagement() {
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
        toast.success("Điểm danh thành công!", { description: "Chúc bạn một ca làm việc tràn đầy năng lượng! ✨" });
        fetchAttendance();
      } else {
        toast.warning(json.message);
      }
    } catch (error) { toast.error("Lỗi kết nối máy chủ!"); }
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
        toast.success(json.message, { description: "Cảm ơn bạn vì một ngày làm việc tuyệt vời. Nghỉ ngơi tốt nhé! 🌙" });
        fetchAttendance(); 
      } else {
        toast.warning(json.message); 
      }
    } catch (error) { toast.error("Lỗi kết nối máy chủ!"); }
  };
  
  const [leaveForm, setLeaveForm] = useState({ type: 'Nghỉ phép năm (Có lương)', fromDate: '', toDate: '', days: 1, reason: '' });
  
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
      toast.error("Lỗi ngày tháng", { description: "Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu!" });
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
        toast.success("Gửi đơn thành công!", { description: json.message });
        setLeaveForm({ type: 'Nghỉ phép năm (Có lương)', fromDate: '', toDate: '', days: 1, reason: '' });
        fetchLeaveHistory(); 
      } else toast.error(json.message);
    } catch (error) { toast.error("Lỗi khi gửi đơn!"); }
  };

  return (
    <div className="p-8 min-h-screen">
      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
            Công Ca & Nghỉ Phép
          </h1>
        </div>
        
        {/* TABS */}
        <div className="flex gap-1 p-1 bg-white/50 rounded-2xl border border-white shadow-inner">
          <TabButton active={activeTab === "attendance"} onClick={() => setActiveTab("attendance")} icon={Fingerprint} label="Chấm Công" />
          <TabButton active={activeTab === "leave"} onClick={() => setActiveTab("leave")} icon={CalendarX} label="Xin Nghỉ Phép" />
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        
        {/* ======================= TAB 1: CHẤM CÔNG ======================= */}
        {activeTab === "attendance" && (
          <div className="flex flex-col gap-6">
            
            <div style={glassCard} className="p-5 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4 w-full md:w-auto text-left">
                <div className="w-14 h-14 rounded-full bg-[#D4AF37]/10 flex items-center justify-center shadow-inner shrink-0">
                  <Clock size={28} color="#D4AF37" />
                </div>
                <div>
                  <h2 className="text-[#3d1a2e] text-2xl lg:text-3xl font-black mb-0.5 tracking-tight">
                    {currentTime.toLocaleTimeString('vi-VN')}
                  </h2>
                  <p className="text-[#9d6b7a] text-xs font-bold uppercase tracking-wider">
                    {currentTime.toLocaleDateString('vi-VN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3 w-full md:w-auto shrink-0">
                <button onClick={handleCheckIn} className="flex-1 md:flex-none px-6 py-2.5 bg-[#D4AF37] hover:bg-[#C9A94E] text-white rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all hover:-translate-y-1 text-[13px]">
                  <Fingerprint size={16}/> Vào Ca
                </button>
                <button onClick={handleCheckOut} className="flex-1 md:flex-none px-6 py-2.5 bg-white hover:bg-gray-50 text-[#3d1a2e] border border-gray-200 rounded-xl font-bold flex items-center justify-center gap-2 transition-all hover:-translate-y-1 shadow-sm text-[13px]">
                  <LogOut size={16}/> Kết Ca
                </button>
              </div>
            </div>

            <div style={glassCard} className="p-6 md:p-8">
              <h3 className="text-[#3d1a2e] font-bold mb-5 flex items-center gap-2 text-[15px]">
                <CalendarCheck size={18} color="#D4AF37" /> Lịch sử chấm công chi tiết
              </h3>
              
              <div className="overflow-x-auto bg-white/40 rounded-xl border border-white shadow-sm">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white/60 border-b border-gray-100">
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Ngày</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Giờ vào</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Giờ ra</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Giờ làm</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Tăng ca</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Trạng thái</th>
                      <th className="py-3 px-5 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Ghi chú</th>
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
                          {item.status === 'Đang làm việc' ? '--' : `${item.workHours || 0} giờ`}
                        </td>
                        <td className="py-3 px-5 text-[#3d1a2e] text-[13px]">
                          {item.overtime || 0} giờ
                        </td>
                        <td className="py-3 px-5">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                            item.status === 'Đang làm việc' 
                              ? 'bg-amber-100 text-amber-700' 
                              : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {item.status === 'Đang làm việc' ? <Clock size={12}/> : <CheckCircle2 size={12}/>} 
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-5 text-[#9d6b7a] text-[12px] max-w-[200px] truncate" title={item.notes}>
                          {item.notes}
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={7} className="py-10 text-center text-[#9d6b7a] text-[13px] italic">
                          Chưa có dữ liệu chấm công.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ======================= TAB 2: NGHỈ PHÉP ======================= */}
        {activeTab === "leave" && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            <div style={glassCard} className="p-6 lg:col-span-1 h-fit">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-5 flex items-center gap-2">
                <CalendarX size={18} color="#D4AF37"/> Tạo Đơn Xin Nghỉ Phép
              </h2>
              <form onSubmit={handleLeaveSubmit} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">Loại nghỉ phép</label>
                  <select className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]" 
                    value={leaveForm.type} onChange={e => setLeaveForm({...leaveForm, type: e.target.value})}>
                    <option>Nghỉ phép năm (Có lương)</option>
                    <option>Nghỉ ốm</option>
                    <option>Nghỉ việc riêng (Không lương)</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">Từ ngày</label>
                    <input type="date" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]"
                      value={leaveForm.fromDate} onChange={e => setLeaveForm({...leaveForm, fromDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">Đến ngày</label>
                    <input type="date" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37]"
                      value={leaveForm.toDate} onChange={e => setLeaveForm({...leaveForm, toDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase flex justify-between">
                    <span>Tổng số ngày</span>
                    <span className="text-[10px] text-amber-600 italic font-normal lowercase">(Tự động tính)</span>
                  </label>
                  <input type="number" min="0.5" step="0.5" required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-emerald-50/50 outline-none focus:border-[#D4AF37] font-bold text-[#3d1a2e]"
                    value={leaveForm.days} onChange={e => setLeaveForm({...leaveForm, days: Number(e.target.value)})} />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-[#9d6b7a] mb-1.5 uppercase">Lý do chi tiết</label>
                  <textarea rows={3} required className="w-full p-2.5 text-[13px] rounded-xl border border-gray-200 bg-white/50 outline-none focus:border-[#D4AF37] resize-none"
                    value={leaveForm.reason} onChange={e => setLeaveForm({...leaveForm, reason: e.target.value})} />
                </div>
                <button type="submit" className="w-full bg-[#3d1a2e] hover:bg-[#2a111f] text-white py-3 rounded-xl font-bold transition-all shadow-md mt-2 flex justify-center items-center gap-2 text-[13px]">
                  <Send size={16}/> Gửi Đơn Cho Quản Lý
                </button>
              </form>
            </div>

            <div style={glassCard} className="p-6 lg:col-span-2">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-5 flex items-center gap-2">
                <FileText size={18} color="#D4AF37"/> Danh sách đơn đã gửi
              </h2>
              
              <div className="overflow-x-auto bg-white/40 rounded-xl border border-white shadow-sm">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-white/60 border-b border-gray-100">
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Loại nghỉ</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Thời gian</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Số ngày</th>
                      <th className="py-3 px-4 text-[#9d6b7a] font-bold text-[11px] uppercase tracking-wider">Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaveHistory.length > 0 ? leaveHistory.map((item, index) => (
                      <tr key={index} className="border-b border-gray-100/50 hover:bg-white/70 transition-colors">
                        <td className="py-3 px-4 text-[#3d1a2e] text-[13px] font-bold">{item.type}</td>
                        <td className="py-3 px-4 text-[#9d6b7a] text-[13px]">{item.fromDate} - {item.toDate}</td>
                        <td className="py-3 px-4 text-[#3d1a2e] text-[13px] font-medium">{item.days} ngày</td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-md text-[11px] font-bold inline-flex items-center gap-1 ${
                            item.status === 'Chờ duyệt' ? 'bg-amber-100 text-amber-700' : 
                            item.status === 'Đã duyệt' ? 'bg-emerald-100 text-emerald-700' : 
                            'bg-red-100 text-red-700'
                          }`}>
                            {item.status === 'Chờ duyệt' ? <Clock3 size={12}/> : <CheckCircle2 size={12}/>} 
                            {item.status}
                          </span>
                        </td>
                      </tr>
                    )) : (
                      <tr><td colSpan={4} className="py-10 text-center text-[#9d6b7a] text-[13px] italic">Bạn chưa gửi đơn xin nghỉ phép nào.</td></tr>
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