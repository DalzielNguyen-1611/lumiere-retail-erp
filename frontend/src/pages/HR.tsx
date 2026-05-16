// File: src/pages/HR.tsx
import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, ChevronRight, Phone, Mail, AlertCircle, Minus, Plus, 
  X, CheckCircle2, XCircle, FileCheck, Check, DollarSign, Wallet,
  Landmark, Clock, Sparkles, Info, RotateCcw
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

type Tab = "staff" | "attendance" | "leave_approvals" | "payroll";

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
  const [leaveRequests, setLeaveRequests] = useState<any[]>([]); 
  const [payrollList, setPayrollList] = useState<any[]>([]);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [newEmp, setNewEmp] = useState({ name: "", phone: "", email: "", roleCode: "sales" });
  const [toast, setToast] = useState<{ message: string; subMessage?: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, subMessage?: string, type: "success" | "error" = "success") => {
    setToast({ message, subMessage, type });
    setTimeout(() => setToast(null), subMessage ? 8000 : 3000);
  };

  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedEmpForCalc, setSelectedEmpForCalc] = useState<any>(null);

  // Modal tính toán chi tiết
  const CalculationModal = ({ emp }: { emp: any }) => {
    const base = emp.baseSalary;
    const workDays = emp.workDays;
    const standardDays = 26;
    const daily = base / standardDays;
    const mainSalary = Math.round(daily * workDays);
    
    // Giới hạn lương đóng bảo hiểm 36tr
    const insSalary = Math.min(base, 36000000);
    
    // NLĐ đóng 10.5%
    const bhxh_nv = Math.round(insSalary * 0.08);
    const bhyt_nv = Math.round(insSalary * 0.015);
    const bhtn_nv = Math.round(insSalary * 0.01);
    const total_nv = bhxh_nv + bhyt_nv + bhtn_nv;
    
    // DN đóng 21.5%
    const bhxh_dn = Math.round(insSalary * 0.17); // 14% hưu trí + 3% ốm đau
    const tnld_dn = Math.round(insSalary * 0.005);
    const bhyt_dn = Math.round(insSalary * 0.03);
    const bhtn_dn = Math.round(insSalary * 0.01);
    const total_dn = bhxh_dn + tnld_dn + bhyt_dn + bhtn_dn;

    const netSalary = Math.max(0, mainSalary - total_nv);
    const totalCost = mainSalary + total_dn;

    return (
      <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
        <div className="bg-white rounded-[32px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative border border-white/20">
          <button onClick={() => setShowCalcModal(false)} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
          
          <div className="p-8 text-left">
            <h2 className="text-[24px] font-black text-[#3d1a2e] mb-2" style={{ fontFamily: "'Playfair Display', serif" }}>Bảng Tính Lương Chi Tiết</h2>
            <p className="text-[#9d6b7a] text-[14px] mb-8 uppercase tracking-widest font-bold">Nhân viên: {emp.name} • Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
              {/* PHẦN NGƯỜI LAO ĐỘNG */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-blue-600 font-bold text-[13px] uppercase tracking-wider">
                  <Users size={16} /> Khoản trích từ lương (10.5%)
                </div>
                <div className="bg-blue-50/50 rounded-2xl p-4 space-y-3 border border-blue-100/50">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHXH (8%)</span>
                    <span className="font-bold">{bhxh_nv.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHYT (1.5%)</span>
                    <span className="font-bold">{bhyt_nv.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHTN (1%)</span>
                    <span className="font-bold">{bhtn_nv.toLocaleString()}đ</span>
                  </div>
                  <div className="pt-2 border-t border-blue-200 flex justify-between font-black text-blue-700">
                    <span>Tổng khấu trừ</span>
                    <span>{total_nv.toLocaleString()}đ</span>
                  </div>
                </div>
              </div>

              {/* PHẦN DOANH NGHIỆP */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 text-purple-600 font-bold text-[13px] uppercase tracking-wider">
                  <Landmark size={16} /> DN đóng thêm (21.5%)
                </div>
                <div className="bg-purple-50/50 rounded-2xl p-4 space-y-3 border border-purple-100/50">
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHXH (17%)</span>
                    <span className="font-bold">{bhxh_dn.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHYT (3%)</span>
                    <span className="font-bold">{bhyt_dn.toLocaleString()}đ</span>
                  </div>
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#6b4153]">BHTN (1%)</span>
                    <span className="font-bold">{bhtn_dn.toLocaleString()}đ</span>
                  </div>
                  <div className="pt-2 border-t border-purple-200 flex justify-between font-black text-purple-700">
                    <span>Tổng DN nộp</span>
                    <span>{total_dn.toLocaleString()}đ</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TỔNG KẾT */}
            <div className="mt-8 p-6 bg-[#3d1a2e] rounded-3xl text-white shadow-xl shadow-[#3d1a2e]/20 relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 blur-2xl"></div>
               <div className="relative z-10 grid grid-cols-2 gap-8 text-left">
                  <div>
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">Thực lĩnh nhân viên</p>
                    <p className="text-[24px] font-black">{netSalary.toLocaleString()}đ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">Tổng chi phí DN</p>
                    <p className="text-[24px] font-black text-amber-400">{totalCost.toLocaleString()}đ</p>
                  </div>
               </div>
            </div>

            <div className="mt-8 flex gap-4">
              <button 
                onClick={() => setShowCalcModal(false)}
                className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              >
                Đóng
              </button>
              <button 
                onClick={() => { handleCalculateSalary(emp); setShowCalcModal(false); }}
                className="flex-[2] py-4 rounded-2xl font-black text-white shadow-xl shadow-blue-500/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
                style={{ background: "linear-gradient(135deg, #2563eb, #1d4ed8)" }}
              >
                <FileCheck size={20} /> Xác nhận & Tạo phiếu chi
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
              <Info className="text-amber-600 shrink-0" size={18} />
              <p className="text-[12px] text-amber-800 leading-relaxed italic text-left">
                Mức lương đóng bảo hiểm tối đa được giới hạn ở 36,000,000đ. Doanh nghiệp cần hoàn tất nộp tiền bảo hiểm muộn nhất vào ngày cuối tháng.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const fetchHRData = async () => {
    setIsLoading(true);
    try {
      const [staffRes, attendanceRes, leavesRes, payrollRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/hr/staff`),
        fetch(`${BACKEND_URL}/api/hr/attendance`),
        fetch(`${BACKEND_URL}/api/hr/leaves/pending`),
        fetch(`${BACKEND_URL}/api/hr/payroll`)
      ]);
      
      const staffJson = await staffRes.json();
      const attendanceJson = await attendanceRes.json();
      const leavesJson = await leavesRes.json();
      const payrollJson = await payrollRes.json();

      if (staffJson.status === 'success') setStaffList(staffJson.data);
      if (attendanceJson.status === 'success') setAttendanceList(attendanceJson.data);
      if (leavesJson.status === 'success') setLeaveRequests(leavesJson.data);
      if (payrollJson.status === 'success') setPayrollList(payrollJson.data);
      
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

  const handleReviewLeave = async (id: number, status: 'Đã duyệt' | 'Từ chối') => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/hr/leaves/${id}/status`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status })
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast(`Đã ${status.toLowerCase()} đơn xin nghỉ!`, undefined, "success");
        fetchHRData();
      } else showToast("Lỗi xử lý đơn!", undefined, "error");
    } catch (err) { showToast("Mất kết nối máy chủ!", undefined, "error"); }
  };

  const handleCalculateSalary = async (emp: any) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/hr/payroll/calculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empId: emp.id, amount: emp.totalSalary })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast("Đã chốt phiếu lương!", "Vui lòng thực hiện Chi trả để hoàn tất hạch toán.", "success");
        fetchHRData();
      } else showToast("Lỗi: " + json.message, undefined, "error");
    } catch (err) { showToast("Lỗi kết nối!", undefined, "error"); }
  };

  const handlePaySalary = async (emp: any) => {
    if (!confirm(`Xác nhận chi tiền mặt ${emp.totalSalary.toLocaleString()}đ trả lương cho nhân viên ${emp.name}?`)) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/hr/payroll/pay/${emp.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: 111, 
          note: `Chi trả lương tháng ${new Date().getMonth() + 1} cho ${emp.name}`
        })
      });
      const json = await res.json();
      if (json.status === 'success') {
        showToast("Đã tạo phiếu chi lương!", `Cập nhật số dư Quỹ Tiền mặt thành công.`, "success");
        fetchHRData();
      } else showToast("Lỗi chi trả: " + json.message, undefined, "error");
    } catch (err) { showToast("Lỗi kết nối!", undefined, "error"); }
  };

  return (
    <div className="p-8 min-h-screen relative overflow-hidden">
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
          { key: "leave_approvals" as Tab, label: "Duyệt đơn nghỉ", icon: FileCheck },
          { key: "payroll" as Tab, label: "Trả lương", icon: DollarSign }
        ].map((t) => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold" style={{ background: activeTab === t.key ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.7)", color: activeTab === t.key ? "white" : "#6b4153", border: "1px solid", borderColor: activeTab === t.key ? "transparent" : "rgba(255,255,255,0.9)", boxShadow: activeTab === t.key ? "0 4px 14px rgba(212,175,55,0.3)" : "none" }}>
            <t.icon size={15} /> {t.label} 
            {t.key === "leave_approvals" && leaveRequests.length > 0 && <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1">{leaveRequests.length}</span>}
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
      ) : activeTab === "leave_approvals" ? (
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
      ) : (
        /* TAB TRẢ LƯƠNG */
        <div style={glassCard} className="p-6">
          <div className="flex items-center gap-3 mb-6 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <Wallet className="text-blue-600" size={24} />
            <div>
              <p className="text-blue-800 font-bold text-[14px]">Bảng lương tháng {new Date().getMonth() + 1}</p>
              <p className="text-blue-600 text-[12px]">Chuẩn công: 26 ngày/tháng. Lương thực nhận = (Lương CB / 26 * Công) + Tăng ca.</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(212,175,55,0.15)]">
                  <th className="text-left py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Nhân viên</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Lương cơ bản</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Công thực tế</th>
                  <th className="text-right py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Tổng nhận</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Trạng thái</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">Hành động</th>
                </tr>
              </thead>
              <tbody>
                {payrollList.map((emp) => (
                  <tr key={emp.id} className="border-b border-[rgba(212,175,55,0.07)] hover:bg-[rgba(212,175,55,0.02)]">
                    <td className="py-4">
                      <div className="font-bold text-[#3d1a2e] text-[14px]">{emp.name}</div>
                      <div className="text-[11px] text-[#9d6b7a]">ID: {emp.id}</div>
                    </td>
                    <td className="py-4 text-center text-[#6b4153] text-[13px]">{emp.baseSalary?.toLocaleString()}đ</td>
                    <td className="py-4 text-center text-[#3d1a2e] font-semibold text-[13px]">{emp.workDays} / 26</td>
                    <td className="py-4 text-right">
                      <div className="text-[#16a34a] font-black text-[15px]">{emp.totalSalary?.toLocaleString()}đ</div>
                    </td>
                    <td className="py-4 text-center">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                        emp.displayStatus === 'Đã thanh toán' ? 'bg-green-100 text-green-700' : 
                        emp.displayStatus === 'Chưa thanh toán' ? 'bg-amber-100 text-amber-700' : 
                        'bg-gray-100 text-gray-500'
                      }`}>
                        {emp.displayStatus}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {emp.displayStatus === 'Chưa tính' && (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedEmpForCalc(emp); setShowCalcModal(true); }}
                            className="px-3 py-1.5 rounded-lg border border-blue-200 text-blue-600 text-[11px] font-bold hover:bg-blue-50 transition-all"
                          >
                            Lập phiếu lương
                          </button>
                          <button 
                            onClick={() => handleCalculateSalary(emp)}
                            className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-500/20"
                          >
                            Tạo phiếu chi
                          </button>
                        </div>
                      )}
                      {emp.displayStatus === 'Chưa thanh toán' && (
                        <button disabled className="px-4 py-1.5 rounded-lg bg-[#3d1a2e]/10 text-[#3d1a2e] text-[11px] font-bold border border-[#3d1a2e]/20 cursor-not-allowed">Đã chốt - Chờ chi (Tài chính)</button>
                      )}
                      {emp.displayStatus === 'Đã thanh toán' && (
                        <button disabled className="px-4 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-bold flex items-center gap-1 mx-auto"><Check size={12} /> Đã hoàn tất</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
      {showCalcModal && selectedEmpForCalc && <CalculationModal emp={selectedEmpForCalc} />}
      
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