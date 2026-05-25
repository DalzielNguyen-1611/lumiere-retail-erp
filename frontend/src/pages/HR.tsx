// File: src/pages/HR.tsx
import React, { useState, useEffect } from "react";
import { 
  Users, Calendar, ChevronRight, Phone, Mail, AlertCircle, Minus, Plus, 
  X, CheckCircle2, XCircle, FileCheck, Check, DollarSign, Wallet,
  Landmark, Clock, Sparkles, Info, RotateCcw, Search
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useLanguage } from "../context/LanguageContext";

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

const translateDept = (dept: string, language: string) => {
  if (language === 'vi') return dept;
  const map: Record<string, string> = {
    "Quản lý": "Manager",
    "Kế toán": "Accountant",
    "Bán hàng": "Sales",
    "Kho vận": "Logistics"
  };
  return map[dept] || dept;
};

const translateRole = (role: string, language: string) => {
  if (language === 'vi') return role;
  const map: Record<string, string> = {
    "Quản lý": "Manager",
    "Kế toán": "Accountant",
    "Bán hàng": "Sales Staff",
    "Kho vận": "Logistics Staff",
    "Nhân viên bán hàng": "Sales Staff",
    "Nhân viên kho": "Logistics Staff",
    "Kế toán trưởng": "Chief Accountant",
    "Giám đốc": "Director",
    "Nhân viên": "Staff"
  };
  return map[role] || role;
};

const deptColors: Record<string, string> = { "Quản lý": "#D4AF37", "Kế toán": "#3b82f6", "Bán hàng": "#C084FC", "Kho vận": "#4ade80", Default: "#94a3b8" };
const BACKEND_URL = "http://localhost:5001";

// Modal tính toán chi tiết (Tách ra ngoài để tránh flickering khi re-render)
const CalculationModal = ({ emp, onClose, onConfirm }: { emp: any, onClose: () => void, onConfirm: (emp: any) => void }) => {
  const { t, language } = useLanguage();
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
        <button onClick={onClose} className="absolute top-6 right-6 p-2 rounded-full hover:bg-gray-100 transition-colors">
          <X size={20} />
        </button>
        
        <div className="p-8 text-left">
          <h2 className="text-[24px] font-black text-[#3d1a2e] mb-2" style={{ fontFamily: "var(--font-heading)" }}>{t('hr.calc_title')}</h2>
          <p className="text-[#9d6b7a] text-[14px] mb-8 uppercase tracking-widest font-bold">{t('hr.staff')}: {emp.name} • {language === 'vi' ? 'Tháng' : 'Month'} {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
            {/* PHẦN NGƯỜI LAO ĐỘNG */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#D4AF37] font-bold text-[13px] uppercase tracking-wider">
                <Users size={16} /> {t('hr.insurance_worker')}
              </div>
              <div className="bg-[#fdfbf7] rounded-2xl p-4 space-y-3 border border-[#D4AF37]/20">
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
                <div className="pt-2 border-t border-[#D4AF37]/20 flex justify-between font-black text-[#3d1a2e]">
                  <span>{language === 'vi' ? 'Tổng khấu trừ' : 'Total Deduction'}</span>
                  <span>{total_nv.toLocaleString()}đ</span>
                </div>
              </div>
            </div>

            {/* PHẦN DOANH NGHIỆP */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-[#6b4153] font-bold text-[13px] uppercase tracking-wider">
                <Landmark size={16} /> {t('hr.insurance_company')}
              </div>
              <div className="bg-[#fdfbf7] rounded-2xl p-4 space-y-3 border border-[#6b4153]/20">
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
                <div className="pt-2 border-t border-[#6b4153]/20 flex justify-between font-black text-[#3d1a2e]">
                  <span>{language === 'vi' ? 'Tổng DN nộp' : 'Company Total'}</span>
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
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">{t('hr.net_salary')}</p>
                  <p className="text-[24px] font-black">{netSalary.toLocaleString()}đ</p>
                </div>
                <div className="text-right">
                  <p className="text-white/60 text-[11px] font-bold uppercase tracking-widest mb-1">{t('hr.total_cost')}</p>
                  <p className="text-[24px] font-black text-amber-400">{totalCost.toLocaleString()}đ</p>
                </div>
             </div>
          </div>

          <div className="mt-8 flex gap-4">
            <button 
              onClick={onClose}
              className="flex-1 py-4 rounded-2xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
            >
              Đóng
            </button>
            <button 
              onClick={() => onConfirm(emp)}
              className="flex-[2] py-4 rounded-2xl font-black text-white shadow-xl shadow-[#D4AF37]/20 hover:-translate-y-1 active:scale-95 transition-all flex items-center justify-center gap-2"
              style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
            >
              <FileCheck size={20} /> {language === 'vi' ? 'Xác nhận & Tạo phiếu chi' : 'Confirm & Pay'}
            </button>
          </div>

          <div className="mt-6 flex items-center gap-2 p-4 bg-amber-50 rounded-xl border border-amber-100">
            <Info className="text-amber-600 shrink-0" size={18} />
            <p className="text-[12px] text-amber-800 leading-relaxed italic text-left">
              {t('hr.insurance_note')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export function HR() {
  const { t, language } = useLanguage();
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
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [toast, setToast] = useState<{ message: string; subMessage?: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, subMessage?: string, type: "success" | "error" = "success") => {
    setToast({ message, subMessage, type });
    setTimeout(() => setToast(null), subMessage ? 8000 : 3000);
  };

  const tabs: { id: Tab; label: string; icon: any }[] = [
    { id: "staff", label: t('hr.staff'), icon: Users },
    { id: "attendance", label: t('hr.attendance'), icon: Clock },
    { id: "leave_approvals", label: t('hr.leave'), icon: Calendar },
    { id: "payroll", label: t('hr.payroll'), icon: Wallet },
  ];

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [showCalcModal, setShowCalcModal] = useState(false);
  const [selectedEmpForCalc, setSelectedEmpForCalc] = useState<any>(null);

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

  const displayedStaff = staffList.filter(emp => {
    const matchesSearch = 
      emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.phone.includes(searchQuery) ||
      emp.dept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchQuery.toLowerCase());
      
    if (selectedBranch === "q1") {
      return matchesSearch && (emp.dept === "Quản lý" || emp.dept === "Kế toán");
    }
    if (selectedBranch === "q3") {
      return matchesSearch && (emp.dept === "Bán hàng" || emp.dept === "Kho vận");
    }
    return matchesSearch;
  });

  return (
    <div className="p-8 min-h-screen relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>{t('hr.hr_management')}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/50 rounded-2xl border border-white shadow-inner shrink-0 overflow-x-auto max-w-full scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all font-bold text-[13px] active:scale-95 shrink-0" 
              style={{ 
                background: activeTab === tab.id ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent", 
                color: activeTab === tab.id ? "white" : "#6b4153", 
                boxShadow: activeTab === tab.id ? "0 8px 24px rgba(212,175,55,0.25)" : "none" 
              }}
            >
              <tab.icon size={16} /> {tab.label} 
              {tab.id === "leave_approvals" && leaveRequests.length > 0 && (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ml-1 shrink-0">
                  {leaveRequests.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-[#9d6b7a]">{t('common.loading')}</div>
      ) : activeTab === "staff" ? (
        <div className="grid grid-cols-1 lg:grid-cols-10 gap-6 items-start">
          {/* PANEL TRÁI (70%) */}
          <div className="lg:col-span-7 space-y-5">
            {/* Thanh công cụ (Header Bar) */}
            <div style={glassCard} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 border border-white">
              {/* Tìm kiếm & Chi nhánh */}
              <div className="flex flex-1 items-center gap-3 w-full">
                <div className="flex-1 bg-white/50 border border-gray-200/80 rounded-xl px-3 py-2 flex items-center gap-2 shadow-inner">
                  <Search size={16} className="text-gray-400" />
                  <input 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={language === 'vi' ? "Tìm kiếm nhân viên..." : "Search staff..."}
                    className="bg-transparent outline-none text-[13px] w-full text-[#3d1a2e]"
                  />
                </div>
                <select 
                  value={selectedBranch}
                  onChange={(e) => setSelectedBranch(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-[12px] font-bold text-[#6b4153] outline-none cursor-pointer shadow-sm hover:border-[#D4AF37]"
                >
                  <option value="all">{language === 'vi' ? "Tất cả chi nhánh" : "All branches"}</option>
                  <option value="q1">CN Lumière Q1</option>
                  <option value="q3">CN Lumière Q3</option>
                </select>
              </div>

              {/* Nút thêm nhân sự */}
              <button 
                onClick={() => {
                  setIsAddModalOpen(true);
                  setSelectedEmp(null);
                }}
                className="px-5 py-2.5 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-1.5 text-[12px] shrink-0 w-full md:w-auto justify-center"
                style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
              >
                <Plus size={16} /> {t('hr.add_staff')}
              </button>
            </div>

            {/* Lưới thẻ nhân sự */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedStaff.map((emp) => {
                const isSelected = selectedEmp === emp.id;
                return (
                  <div 
                    key={emp.id} 
                    style={glassCard} 
                    className={`p-4 cursor-pointer relative transition-all duration-300 border-2 ${
                      isSelected 
                        ? "border-[#D4AF37] bg-white shadow-lg -translate-y-0.5" 
                        : "border-white hover:border-[#D4AF37]/30 hover:shadow-md"
                    }`}
                    onClick={() => {
                      setSelectedEmp(isSelected ? null : emp.id);
                      setIsAddModalOpen(false); // Close add form when viewing detail
                    }}
                  >
                    <div className="flex items-center gap-4">
                      {/* Avatar */}
                      <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border-2" style={{ borderColor: `${deptColors[emp.dept] || deptColors.Default}40` }}>
                        <ImageWithFallback src={emp.img} alt={emp.name} className="w-full h-full object-cover" />
                      </div>
                      
                      {/* Tên & Phân ban */}
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex justify-between items-center">
                          <p className="text-[#3d1a2e] text-[14px] font-bold truncate">{emp.name}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="px-2 py-0.5 rounded text-[9px] font-bold" style={{ background: `${deptColors[emp.dept] || deptColors.Default}20`, color: deptColors[emp.dept] || deptColors.Default }}>{translateDept(emp.dept, language)}</span>
                          <span className="text-[#9d6b7a] text-[11px] truncate">{translateRole(emp.role, language)}</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight size={14} color="#c9a0b0" className={`absolute right-3 top-1/2 -translate-y-1/2 transition-transform duration-300 ${isSelected ? "rotate-90 text-[#D4AF37]" : ""}`} />
                  </div>
                );
              })}
              {displayedStaff.length === 0 && (
                <div className="col-span-full text-center py-10 text-[#9d6b7a] bg-white/50 rounded-2xl border border-white">
                  {language === 'vi' ? 'Không tìm thấy nhân viên nào phù hợp.' : 'No matching staff found.'}
                </div>
              )}
            </div>
          </div>

          {/* PANEL PHẢI (30%) */}
          <div className="lg:col-span-3">
            <div className="sticky top-8 transition-all duration-300">
              {/* CASE 1: FORM THÊM MỚI NHÂN SỰ */}
              {isAddModalOpen ? (
                <div style={glassCard} className="p-6 border border-[#D4AF37]/30 bg-white/95 shadow-xl animate-in slide-in-from-right-4 duration-300">
                  <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#D4AF37]/15">
                    <h3 className="text-[16px] font-bold text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>{language === 'vi' ? 'Thêm Nhân Viên Mới' : 'Add New Staff'}</h3>
                    <button 
                      onClick={() => setIsAddModalOpen(false)}
                      className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>

                  <div className="space-y-4 text-left">
                    <div>
                      <label className="block mb-1 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">{language === 'vi' ? 'Họ và Tên *' : 'Full Name *'}</label>
                      <input 
                        value={newEmp.name} 
                        onChange={e => setNewEmp({...newEmp, name: e.target.value})} 
                        placeholder="Nguyễn Văn A..." 
                        className="w-full p-2.5 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" 
                        style={{ borderColor: "rgba(212,175,55,0.3)" }} 
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block mb-1 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">{language === 'vi' ? 'Vị trí' : 'Role'}</label>
                        <select 
                          value={newEmp.roleCode} 
                          onChange={e => setNewEmp({...newEmp, roleCode: e.target.value})} 
                          className="w-full p-2.5 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37] cursor-pointer"
                          style={{ borderColor: "rgba(212,175,55,0.3)" }}
                        >
                          <option value="manager">{language === 'vi' ? 'Quản lý' : 'Manager'}</option>
                          <option value="sales">{language === 'vi' ? 'Bán hàng' : 'Sales'}</option>
                          <option value="kho">{language === 'vi' ? 'Kho vận' : 'Logistics'}</option>
                          <option value="ketoan">{language === 'vi' ? 'Kế toán' : 'Accountant'}</option>
                        </select>
                      </div>
                      <div>
                        <label className="block mb-1 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">{language === 'vi' ? 'SĐT *' : 'Phone *'}</label>
                        <input 
                          value={newEmp.phone} 
                          maxLength={10} 
                          onChange={e => setNewEmp({...newEmp, phone: e.target.value.replace(/\D/g, "")})} 
                          placeholder="09xx..." 
                          className="w-full p-2.5 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" 
                          style={{ borderColor: "rgba(212,175,55,0.3)" }} 
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block mb-1 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">Email</label>
                      <input 
                        type="email" 
                        value={newEmp.email} 
                        onChange={e => setNewEmp({...newEmp, email: e.target.value})} 
                        placeholder="email@example.com" 
                        className="w-full p-2.5 rounded-xl border outline-none bg-[#fdfbf7] text-[13px] focus:border-[#D4AF37]" 
                        style={{ borderColor: "rgba(212,175,55,0.3)" }} 
                      />
                    </div>

                    <button 
                      onClick={handleSaveEmployee} 
                      disabled={isSubmitting} 
                      className="w-full mt-2 py-3 rounded-xl font-bold text-white shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98] disabled:bg-gray-300 disabled:scale-100 flex items-center justify-center gap-2 text-[13px]" 
                      style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
                    >
                      {isSubmitting ? (language === 'vi' ? "Đang xử lý..." : "Processing...") : (language === 'vi' ? "Lưu Thông Tin" : "Save Info")}
                    </button>
                  </div>
                </div>
              ) : selectedEmp && staffList.find(e => e.id === selectedEmp) ? (() => {
                const emp = staffList.find(e => e.id === selectedEmp);
                return (
                  /* CASE 2: CHI TIẾT NHÂN VIÊN ĐANG CHỌN */
                  <div style={glassCard} className="p-6 border border-white bg-white/80 shadow-xl animate-in slide-in-from-right-4 duration-300 text-left">
                    <div className="flex justify-between items-start mb-5 pb-3 border-b border-gray-100">
                      <h3 className="text-[16px] font-bold text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>{language === 'vi' ? 'Hồ Sơ Nhân Viên' : 'Staff Profile'}</h3>
                      <button 
                        onClick={() => setSelectedEmp(null)}
                        className="p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        <X size={16} />
                      </button>
                    </div>

                    <div className="flex flex-col items-center text-center mb-6">
                      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 mb-3 shadow-md" style={{ borderColor: `${deptColors[emp.dept] || deptColors.Default}60` }}>
                        <ImageWithFallback src={emp.img} alt={emp.name} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-[#3d1a2e] text-[16px] font-bold leading-tight truncate w-full px-2">{emp.name}</h4>
                      <p className="text-[11px] text-[#9d6b7a] font-bold uppercase tracking-wider mt-0.5">ID: NV-{emp.id}</p>
                      
                      <div className="flex flex-wrap gap-2 mt-3 justify-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold shadow-sm" style={{ background: `${deptColors[emp.dept] || deptColors.Default}20`, color: deptColors[emp.dept] || deptColors.Default }}>{translateDept(emp.dept, language)}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#3d1a2e]/5 text-[#3d1a2e] shadow-sm">{translateRole(emp.role, language)}</span>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="p-3 bg-white/55 rounded-xl border border-white space-y-2.5">
                        <div className="flex items-center gap-3 text-[#6b4153] text-[12px] min-w-0">
                          <Phone size={14} className="text-[#9d6b7a] shrink-0" />
                          <span className="font-medium truncate">{emp.phone}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#6b4153] text-[12px] min-w-0">
                          <Mail size={14} className="text-[#9d6b7a] shrink-0" />
                          <span className="font-medium truncate">{emp.email || "N/A"}</span>
                        </div>
                        <div className="flex items-center gap-3 text-[#6b4153] text-[12px] min-w-0">
                          <Calendar size={14} className="text-[#9d6b7a] shrink-0" />
                          <span className="font-medium truncate">{language === 'vi' ? 'Tham gia' : 'Joined'}: {emp.joined || "N/A"}</span>
                        </div>
                      </div>

                      {/* Thông số đi làm & lương cơ bản */}
                      <div className="p-3 bg-[#fdfbf7] rounded-xl border border-[#D4AF37]/20">
                        <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider mb-2">{language === 'vi' ? 'Thông tin hợp đồng' : 'Contract Info'}</p>
                        <div className="flex justify-between text-[12px] mb-1.5">
                          <span className="text-[#9d6b7a]">{language === 'vi' ? 'Lương cơ bản' : 'Base Salary'}</span>
                          <span className="font-bold text-[#3d1a2e]">{emp.baseSalary?.toLocaleString()}đ</span>
                        </div>
                        <div className="flex justify-between text-[12px]">
                          <span className="text-[#9d6b7a]">{language === 'vi' ? 'Trạng thái' : 'Status'}</span>
                          <span className="font-bold text-[#10b981] flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-[#10b981]" /> {emp.status || 'Active'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })() : (
                /* CASE 3: THỐNG KÊ NHÂN SỰ CHUNG */
                <div style={glassCard} className="p-6 border border-white bg-white/80 shadow-xl text-left animate-in slide-in-from-right-4 duration-300">
                  <h3 className="text-[16px] font-bold text-[#3d1a2e] mb-4 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
                    <Sparkles size={18} color="#D4AF37" />
                    {language === 'vi' ? 'Tổng Quan Nhân Sự' : 'HR Summary'}
                  </h3>

                  <div className="space-y-4">
                    <div className="p-4 bg-white/60 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">{language === 'vi' ? 'Tổng nhân sự' : 'Total Staff'}</p>
                        <p className="text-[#3d1a2e] text-[24px] font-black mt-0.5">{staffList.length}</p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center border border-purple-100">
                        <Users size={20} className="text-[#C084FC]" />
                      </div>
                    </div>

                    <div className="p-4 bg-white/60 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                      <div>
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider">{language === 'vi' ? 'Làm việc hôm nay' : 'Active Today'}</p>
                        <p className="text-[#10b981] text-[24px] font-black mt-0.5">
                          {Math.round(staffList.length * 0.85)}
                        </p>
                      </div>
                      <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <CheckCircle2 size={20} className="text-emerald-500" />
                      </div>
                    </div>

                    <div className="p-4 bg-[#fdfbf7] rounded-2xl border border-[#D4AF37]/20">
                      <p className="text-[#D4AF37] text-[10px] font-black uppercase tracking-wider mb-2">{language === 'vi' ? 'Tỉ lệ theo phòng ban' : 'Department Ratio'}</p>
                      <div className="space-y-2">
                        {(Object.entries(
                          staffList.reduce((acc, emp) => {
                            acc[emp.dept] = (acc[emp.dept] || 0) + 1;
                            return acc;
                          }, {} as Record<string, number>)
                        ) as [string, number][]).map(([dept, count]) => {
                          const pct = Math.round((count / (staffList.length || 1)) * 100) || 0;
                          return (
                            <div key={dept} className="space-y-1">
                              <div className="flex justify-between text-[11px] font-bold">
                                <span className="text-[#6b4153]">{translateDept(dept, language)}</span>
                                <span className="text-[#3d1a2e]">{count} ({pct}%)</span>
                              </div>
                              <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: deptColors[dept] || deptColors.Default }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      ) : activeTab === "attendance" ? (
        <div style={glassCard} className="p-6 overflow-x-auto">
          <p className="text-[#9d6b7a] text-[13px] italic mb-4">{language === 'vi' ? "Dữ liệu được cập nhật tự động từ hành động Vào Ca/Kết Ca của nhân viên trong tuần này." : "Data is automatically updated from staff Clock-in/Clock-out actions this week."}</p>
          <table className="w-full">
            <thead>
              <tr className="border-b border-[rgba(212,175,55,0.15)]">
                <th className="text-left py-2 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{language === 'vi' ? "Họ & Tên" : "Full Name"}</th>
                {weekDays.map(d => <th key={d} className="text-center text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{d}</th>)}
                <th className="text-center text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{language === 'vi' ? "Tăng ca (OT)" : "Overtime (OT)"}</th>
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
              {attendanceList.length === 0 && <tr><td colSpan={9} className="py-10 text-center text-[#9d6b7a] italic">{language === 'vi' ? "Chưa có dữ liệu chấm công tuần này." : "No attendance data for this week."}</td></tr>}
            </tbody>
          </table>
        </div>
      ) : activeTab === "leave_approvals" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {leaveRequests.length === 0 ? (
            <div className="col-span-full text-center py-20 text-[#9d6b7a] italic">{language === 'vi' ? "Tuyệt vời! Không có đơn xin nghỉ nào đang chờ duyệt." : "Excellent! No pending leave requests."}</div>
          ) : leaveRequests.map((req) => (
            <div key={req.id} style={glassCard} className="p-6 animate-in fade-in zoom-in duration-300">
              <div className="flex justify-between items-start border-b border-[rgba(212,175,55,0.15)] pb-4 mb-4">
                <div>
                  <h3 className="text-[#3d1a2e] font-bold text-[16px]">{req.empName}</h3>
                  <span className="inline-block mt-1 px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-700">{req.type}</span>
                </div>
                <div className="text-right">
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">{language === 'vi' ? "Thời gian nghỉ" : "Time Off"}</p>
                  <p className="text-[#3d1a2e] text-[14px] font-bold mt-0.5">{req.fromDate} - {req.toDate}</p>
                  <p className="text-[#c9a0b0] text-[11px]">{language === 'vi' ? `Tổng cộng: ${req.days} ngày` : `Total: ${req.days} days`}</p>
                </div>
              </div>
              <div className="mb-6">
                <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-1">{language === 'vi' ? "Lý do nghỉ:" : "Reason:"}</p>
                <p className="text-[#3d1a2e] text-[13px] bg-white/50 p-3 rounded-xl border border-white">{req.reason}</p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleReviewLeave(req.id, 'Đã duyệt')} className="flex-1 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 flex items-center justify-center gap-2" style={{ background: "linear-gradient(135deg, #16a34a, #15803d)" }}>
                  <Check size={18} /> {language === 'vi' ? "Phê Duyệt" : "Approve"}
                </button>
                <button onClick={() => handleReviewLeave(req.id, 'Từ chối')} className="flex-1 px-6 py-3 rounded-2xl bg-white text-red-600 font-bold text-[14px] transition-all hover:scale-105 border border-red-100 shadow-sm active:scale-95 flex items-center justify-center gap-2">
                  <X size={18} /> {language === 'vi' ? "Từ Chối" : "Reject"}
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* TAB TRẢ LƯƠNG */
        <div style={glassCard} className="p-6">
          <div className="flex items-center gap-3 mb-6 p-4 bg-[#fdfbf7] border border-[#D4AF37]/20 rounded-2xl">
            <Wallet className="text-[#D4AF37]" size={24} />
            <div>
              <p className="text-[#3d1a2e] font-bold text-[14px]">{t('hr.payroll_month')} {new Date().getMonth() + 1}</p>
              <p className="text-[#9d6b7a] text-[12px]">{t('hr.payroll_desc')}</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[rgba(212,175,55,0.15)]">
                  <th className="text-left py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.staff')}</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.base_salary')}</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.work_days')}</th>
                  <th className="text-right py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.total_received')}</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.status')}</th>
                  <th className="text-center py-3 text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">{t('hr.actions')}</th>
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
                        {emp.displayStatus === 'Đã thanh toán' ? (language === 'vi' ? 'Đã thanh toán' : 'Paid') :
                         emp.displayStatus === 'Chưa thanh toán' ? (language === 'vi' ? 'Chưa thanh toán' : 'Unpaid') :
                         language === 'vi' ? emp.displayStatus : 'Uncalculated'}
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      {emp.displayStatus === 'Chưa tính' && (
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            onClick={() => { setSelectedEmpForCalc(emp); setShowCalcModal(true); }}
                            className="px-3 py-1.5 rounded-lg border border-[#D4AF37]/30 text-[#D4AF37] text-[11px] font-bold hover:bg-[#D4AF37]/5 transition-all"
                          >
                            {t('hr.calc_button')}
                          </button>
                          <button 
                            onClick={() => handleCalculateSalary(emp)}
                            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#C9A94E] text-white text-[11px] font-bold hover:opacity-90 transition-all shadow-md shadow-[#D4AF37]/20"
                          >
                            {t('hr.payment_button')}
                          </button>
                        </div>
                      )}
                      {emp.displayStatus === 'Chưa thanh toán' && (
                        <button disabled className="px-4 py-1.5 rounded-lg bg-amber-50 text-amber-700 text-[11px] font-bold border border-amber-200/50 cursor-not-allowed">
                          {language === 'vi' ? 'Đã chốt - Chờ chi (Tài chính)' : 'Approved - Pending Payment'}
                        </button>
                      )}
                      {emp.displayStatus === 'Đã thanh toán' && (
                        <button disabled className="px-4 py-1.5 rounded-lg bg-green-50 text-green-600 text-[11px] font-bold flex items-center gap-1 mx-auto">
                          <Check size={12} /> {language === 'vi' ? 'Đã hoàn tất' : 'Completed'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}


      {/* --- CUSTOM TOAST (GIỮ NGUYÊN) --- */}
      {showCalcModal && selectedEmpForCalc && (
        <CalculationModal 
          emp={selectedEmpForCalc} 
          onClose={() => setShowCalcModal(false)}
          onConfirm={(emp) => {
            setShowCalcModal(false);
            handleCalculateSalary(emp);
          }}
        />
      )}
      
      {/* TOAST NOTIFICATION (Standardized) */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === "success" ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}>
              {toast.type === "error" ? <AlertCircle className="text-rose-400" size={20} /> : <Sparkles className="text-[#D4AF37]" size={20} />}
            </div>
            <div>
              <p className="font-bold text-[15px]">{toast.message}</p>
              {toast.subMessage && <p className="text-white/80 text-[13px] mt-0.5">{toast.subMessage}</p>}
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}