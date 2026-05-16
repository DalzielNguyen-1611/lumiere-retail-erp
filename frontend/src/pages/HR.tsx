// File: src/pages/HR.tsx
import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, ChevronRight, Phone, Mail, AlertCircle, Minus, Plus, 
  X, CheckCircle2, XCircle, FileCheck, Check
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

type Tab = "staff" | "attendance" | "leave_approvals";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };

const weekDays = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];
const attendanceColors: Record<string, { bg: string; color: string; label: string }> = {
  "Đi làm": { bg: "rgba(74,222,128,0.15)", color: "#16a34a", label: "✓" },
  "Đi trễ": { bg: "rgba(212,175,55,0.18)", color: "#92740d", label: "!" },
  "Nghỉ phép": { bg: "rgba(147,197,253,0.3)", color: "#1d4ed8", label: "P" },
  "Nghỉ ốm": { bg: "rgba(253,164,175,0.3)", color: "#be185d", label: "Ố" },
  "Nghỉ": { bg: "rgba(200,200,200,0.15)", color: "#94a3b8", label: "—" },
};

const deptColors: Record<string, string> = { "Quản lý": "#D4AF37", "Kế toán": "#3b82f6", "Bán hàng": "#C084FC", "Kho vận": "#4ade80", Default: "#94a3b8" };
const BACKEND_URL = "http://localhost:5000";

export function HR() {
  const [activeTab, setActiveTab] = useState<Tab>("staff");
  const [selectedEmp, setSelectedEmp] = useState<string | null>(null);
  
  const [staffList, setStaffList] = useState<any[]>([]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]); // Danh sách đơn chờ duyệt
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newEmp, setNewEmp] = useState({ name: "", phone: "", email: "", roleCode: "sales" });
  const [toast, setToast] = useState<{ message: string; subMessage?: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, subMessage?: string, type: "success" | "error" = "success") => {
    setToast({ message, subMessage, type });
    setTimeout(() => setToast(null), subMessage ? 8000 : 3000);
  };

  const fetchHRData = async () => {
    setIsLoading(true);
    try {
      // Tải song song cả 3 luồng dữ liệu
      const [staffRes, attendanceRes, leavesRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/hr/staff`),
        fetch(`${BACKEND_URL}/api/hr/attendance`),
        fetch(`${BACKEND_URL}/api/hr/leaves/pending`)
      ]);
      
      const staffJson = await staffRes.json();
      const attendanceJson = await attendanceRes.json();
      const leavesJson = await leavesRes.json();

      if (staffJson.status === 'success') setStaffList(staffJson.data);
      if (attendanceJson.status === 'success') setAttendanceList(attendanceJson.data);
      if (leavesJson.status === 'success') setLeaveRequests(leavesJson.data);
      
    } catch (error) {
      showToast("Lỗi tải dữ liệu máy chủ!", undefined, "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchHRData(); }, []);

  const handleSaveEmployee = async () => {
    if (!newEmp.name.trim() || !newEmp.phone.trim()) return showToast("Vui lòng điền đủ Tên và SĐT!", undefined, "error");
    setIsSubmitting(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/hr/staff`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newEmp)
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast("Đã thêm nhân viên thành công!", `Tài khoản: ${json.account.username} - MK: ${json.account.password}`, "success");
        setIsAddModalOpen(false);
        setNewEmp({ name: "", phone: "", email: "", roleCode: "sales" });
        fetchHRData(); 
      } else showToast("Lỗi: " + json.message, undefined, "error");
    } catch (err) { showToast("Mất kết nối máy chủ!", undefined, "error");
    } finally { setIsSubmitting(false); }
  };

  // Hàm duyệt hoặc từ chối đơn
  const handleReviewLeave = async (id: number, status: 'Đã duyệt' | 'Từ chối') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/hr/leaves/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`Đã ${status.toLowerCase()} đơn xin nghỉ!`, undefined, "success");
        // Gọi lại API để load danh sách mới nhất
        fetchHRData();
      } else showToast("Lỗi xử lý đơn!", undefined, "error");
    } catch (err) { showToast("Mất kết nối máy chủ!", undefined, "error"); }
  };

  return (
    <div className="p-8 min-h-screen relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500 }}>Quản lý đội ngũ</p>
          <h1 style={{ color: "#3d1a2e", fontSize: "26px", fontWeight: 700, fontFamily: "'Playfair Display', serif" }}>Nhân Sự & Chấm Công</h1>
        </div>
        <button 
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-xl text-white font-semibold text-[13px] flex items-center gap-2 hover:scale-105 transition-transform shadow-md cursor-pointer" 
          style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
        >
          <Plus size={16} /> Thêm Nhân Viên
        </button>
      </div>

      <div className="flex gap-2 mb-6">
        {[
          { key: "staff" as Tab, label: "Danh sách nhân sự", icon: Users }, 
          { key: "attendance" as Tab, label: "Bảng chấm công", icon: Calendar },
          { key: "leave_approvals" as Tab, label: "Duyệt đơn nghỉ", icon: FileCheck } // Tab mới
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold" style={{ background: activeTab === t.key ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.7)", color: activeTab === t.key ? "white" : "#6b4153", border: "1px solid", borderColor: activeTab === t.key ? "transparent" : "rgba(255,255,255,0.9)", boxShadow: activeTab === t.key ? "0 4px 14px rgba(212,175,55,0.3)" : "none" }}>
            <t.icon size={15} /> {t.label} {t.key === "leave_approvals" && leaveRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{leaveRequests.length}</span>}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-[#9d6b7a]">Đang đồng bộ dữ liệu từ Database...</div>
      ) : activeTab === "staff" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {staffList.map((emp) => (
            <div key={emp.id} style={glassCard} className="p-5 cursor-pointer relative hover:shadow-md transition-shadow" onClick={() => setSelectedEmp(selectedEmp === emp.id ? null : emp.id)}>
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shrink-0 border-2" style={{ borderColor: `${deptColors[emp.dept] || deptColors.Default}40` }}>
                  <ImageWithFallback src={emp.img} alt={emp.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between"><p className="text-[#3d1a2e] text-[14px] font-bold">{emp.name}</p></div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-bold" style={{ background: `${deptColors[emp.dept] || deptColors.Default}20`, color: deptColors[emp.dept] || deptColors.Default }}>{emp.dept}</span>
                    <span className="text-[#9d6b7a] text-[11px]">{emp.role}</span>
                  </div>
                </div>
              </div>
              {selectedEmp === emp.id && (
                <div className="mt-4 pt-4 border-t border-[rgba(212,175,55,0.15)] space-y-2 animate-in fade-in slide-in-from-top-2">
                  <div className="flex items-center gap-2"><Phone size={12} color="#9d6b7a" /><span className="text-[#6b4153] text-[12px]">{emp.phone}</span></div>
                  <div className="flex items-center gap-2"><Mail size={12} color="#9d6b7a" /><span className="text-[#6b4153] text-[12px]">{emp.email}</span></div>
                  <div className="text-[11px] text-[#9d6b7a] italic mt-2">Tham gia: {emp.joined}</div>
                </div>
              )}
              <ChevronRight size={14} color="#c9a0b0" className={`absolute right-4 top-5 transition-transform ${selectedEmp === emp.id ? "rotate-90" : ""}`} />
            </div>
          ))}
        </div>
      ) : activeTab === "attendance" ? (
        <div style={glassCard} className="p-6 overflow-x-auto">
          <p className="text-[#9d6b7a] text-[13px] italic mb-4">Dữ liệu được cập nhật tự động từ hành động Vào Ca/Kết Ca của nhân viên trong tuần này.</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(212,175,55,0.15)]">
                <th className="text-left py-2 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Họ & Tên</th>
                {weekDays.map(d => <th key={d} className="text-center text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{d}</th>)}
                <th className="text-center text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Tăng ca (OT)</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((row) => (
                <tr key={row.name} className="border-b border-[rgba(212,175,55,0.07)] hover:bg-[rgba(212,175,55,0.03)] transition-colors">
                  <td className="py-3 text-[#3d1a2e] text-[13px] font-semibold">{row.name}</td>
                  {row.days.map((day: string, di: number) => (
                    <td key={di} className="py-3 text-center">
                      <div className="w-6 h-6 rounded mx-auto flex items-center justify-center text-[9px] font-bold shadow-sm" style={{ background: attendanceColors[day]?.bg || "#eee", color: attendanceColors[day]?.color || "#000" }} title={day}>
                        {attendanceColors[day]?.label || "?"}
                      </div>
                    </td>
                  ))}
                  <td className="py-3 text-center text-[12px] font-bold text-[#92740d]">
                    {row.ot > 0 ? `+${row.ot}h` : <Minus size={14} className="mx-auto text-[#c9a0b0]" />}
                  </td>
                </tr>
              ))}
              {attendanceList.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-[#9d6b7a] italic">Chưa có dữ liệu chấm công tuần này.</td></tr>}
            </tbody>
          </table>
        </div>
      ) : (
        /* TAB DUYỆT ĐƠN NGHỈ PHÉP */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaveRequests.length === 0 ? (
            <div className="col-span-full text-center py-20 text-[#9d6b7a] italic">Tuyệt vời! Không có đơn xin nghỉ nào đang chờ duyệt.</div>
          ) : leaveRequests.map((req) => (
            <div key={req.id} style={glassCard} className="p-6 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start border-b border-[rgba(212,175,55,0.15)] pb-4 mb-4">
                <div>
                  <h3 className="text-[#3d1a2e] font-bold text-[16px]">{req.empName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">{req.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">Thời gian nghỉ</p>
                  <p className="text-[#3d1a2e] text-[14px] font-bold mt-0.5">{req.fromDate} - {req.toDate}</p>
                  <p className="text-[#c9a0b0] text-[11px]">Tổng cộng: {req.days} ngày</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-1">Lý do nghỉ:</p>
                <p className="text-[#3d1a2e] text-[13px] bg-white/50 p-3 rounded-xl border border-white">{req.reason}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleReviewLeave(req.id, 'Đã duyệt')} className="flex-1 bg-[#16a34a] hover:bg-[#15803d] text-white py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-green-500/20 transition-all text-[13px]">
                  <Check size={16} /> Phê Duyệt
                </button>
                <button onClick={() => handleReviewLeave(req.id, 'Từ chối')} className="flex-1 bg-white hover:bg-red-50 text-red-600 border border-red-100 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 transition-all text-[13px]">
                  <X size={16} /> Từ Chối
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL THÊM MỚI (GIỮ NGUYÊN) --- */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]" style={{ fontFamily: "'Playfair Display', serif" }}>Thêm Nhân Viên Mới</h2>
            <div className="space-y-4">
              <div><label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Họ và Tên *</label><input value={newEmp.name} onChange={e => setNewEmp({...newEmp, name: e.target.value})} placeholder="Nguyễn Văn A..." className="w-full p-3 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" style={{ borderColor: "rgba(212,175,55,0.3)" }} /></div>
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Vị trí</label><select value={newEmp.roleCode} onChange={e => setNewEmp({...newEmp, roleCode: e.target.value})} className="w-full p-3 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]"><option value="manager">Quản lý</option><option value="sales">Bán hàng</option><option value="kho">Kho vận</option><option value="ketoan">Kế toán</option></select></div>
                <div><label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">SĐT *</label><input value={newEmp.phone} maxLength={10} onChange={e => setNewEmp({...newEmp, phone: e.target.value.replace(/\D/g, "")})} placeholder="09xx..." className="w-full p-3 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" style={{ borderColor: "rgba(212,175,55,0.3)" }} /></div>
              </div>
              <div><label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Email</label><input type="email" value={newEmp.email} onChange={e => setNewEmp({...newEmp, email: e.target.value})} placeholder="email@example.com" className="w-full p-3 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" style={{ borderColor: "rgba(212,175,55,0.3)" }} /></div>
              <button onClick={handleSaveEmployee} disabled={isSubmitting} className="w-full mt-4 py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 transition-all" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>{isSubmitting ? "Đang xử lý..." : "Lưu Thông Tin"}</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM TOAST (GIỮ NGUYÊN) --- */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[110] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 border ${toast.type === 'success' ? 'bg-[#f0fdf4] border-green-200' : 'bg-[#fef2f2] border-red-200'}`}>
          <div className="shrink-0">{toast.type === 'success' ? <CheckCircle2 color="#16a34a" size={24} /> : <AlertCircle color="#dc2626" size={24} />}</div>
          <div><h4 className={`font-bold text-[14px] ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.message}</h4>{toast.subMessage && <p className="text-[13px] font-bold mt-1 text-green-700 bg-green-100 px-2 py-1 rounded inline-block">{toast.subMessage}</p>}</div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors"><XCircle size={18} className={toast.type === 'success' ? 'text-green-700' : 'text-red-700'} /></button>
        </div>
      )}
    </div>
  );
}