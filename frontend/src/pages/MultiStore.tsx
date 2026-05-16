import React, { useState, useEffect } from "react";
import { Building2, MapPin, Sparkles, Plus, Users, Warehouse, Phone, ChevronRight, X, AlertCircle } from "lucide-react";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };

interface Branch {
  id: number;
  name: string;
  address: string;
  phone: string;
  managerId: number;
  managerName: string | null;
  staffCount: number;
  warehouseCount: number;
}

export function MultiStore() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [branches, setBranches] = useState<Branch[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeBranchId, setActiveBranchId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchBranches();
    return () => clearInterval(timer);
  }, []);

  const fetchBranches = async () => {
    try {
      setIsLoading(true);
      const res = await fetch('http://localhost:5000/api/stores/branches');
      const data = await res.json();
      if (data.status === 'success') {
        setBranches(data.data);
        if (data.data.length > 0 && activeBranchId === null) {
          setActiveBranchId(data.data[0].id);
        }
      }
    } catch (err) {
      setToast({ message: "Không thể kết nối với máy chủ", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  const activeBranch = branches.find(b => b.id === activeBranchId);

  return (
    <div className="p-8 min-h-screen">
      {/* Standardized Toast */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === "success" ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}>
              {toast.type === "error" ? <AlertCircle className="text-rose-400" size={20} /> : <Sparkles className="text-[#D4AF37]" size={20} />}
            </div>
            <div>
              <p className="font-bold text-[15px]">{toast.type === "success" ? "Thành công" : "Thông báo"}</p>
              <p className="text-white/80 text-[13px] mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Hệ Thống Chi Nhánh</h1>
        </div>
        <button 
          onClick={() => setToast({ message: "Tính năng thêm chi nhánh đang được hoàn thiện", type: "success" })}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
        >
          <Plus size={18} /> Thêm Chi Nhánh
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#D4AF37]"></div>
        </div>
      ) : (
        <div className="space-y-8">
          {/* BRANCH CARDS GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b) => (
              <div 
                key={b.id} 
                onClick={() => setActiveBranchId(b.id)}
                style={{ 
                  ...glassCard, 
                  border: activeBranchId === b.id ? "2px solid #D4AF37" : "1px solid rgba(255,255,255,0.9)",
                  transform: activeBranchId === b.id ? "translateY(-4px)" : "none"
                }} 
                className="p-6 cursor-pointer transition-all hover:shadow-xl"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 rounded-2xl bg-amber-50 flex items-center justify-center shadow-sm">
                    <Building2 size={24} color="#D4AF37" />
                  </div>
                  <div className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 text-[10px] font-bold uppercase tracking-wider">Hoạt động</div>
                </div>
                
                <h3 className="text-[#3d1a2e] font-bold text-[18px] mb-1">{b.name}</h3>
                <p className="text-[#9d6b7a] text-[12px] flex items-center gap-1 mb-4">
                  <MapPin size={12} /> {b.address}
                </p>

                <div className="grid grid-cols-2 gap-4 mt-6 pt-6 border-t border-amber-100/50">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#9d6b7a] uppercase font-bold tracking-tighter">Nhân sự</span>
                    <span className="text-[16px] font-black text-[#3d1a2e]">{b.staffCount} <span className="text-[10px] font-normal">thành viên</span></span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] text-[#9d6b7a] uppercase font-bold tracking-tighter">Kho bãi</span>
                    <span className="text-[16px] font-black text-[#3d1a2e]">{b.warehouseCount} <span className="text-[10px] font-normal">địa điểm</span></span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* BRANCH DETAILS SECTION */}
          {activeBranch && (
            <div style={glassCard} className="p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-6">
                  <div>
                    <h2 className="text-[#3d1a2e] text-[20px] font-bold mb-6 flex items-center gap-2">
                      Chi tiết: {activeBranch.name}
                    </h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-1">
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase">Quản lý trực tiếp</p>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 border border-white">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#C9A94E] flex items-center justify-center text-white font-bold text-[14px]">
                            {activeBranch.managerName?.charAt(0) || "M"}
                          </div>
                          <div>
                            <p className="text-[#3d1a2e] font-bold text-[14px]">{activeBranch.managerName || "Chưa gán quản lý"}</p>
                            <p className="text-[#9d6b7a] text-[12px]">ID: {activeBranch.managerId}</p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase">Thông tin liên lạc</p>
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/40 border border-white h-[74px]">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center">
                            <Phone size={18} color="#D4AF37" />
                          </div>
                          <p className="text-[#3d1a2e] font-bold text-[14px]">{activeBranch.phone}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-4">
                    <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-4">Các hoạt động gần đây</p>
                    <div className="space-y-3">
                      {[1, 2].map((i) => (
                        <div key={i} className="flex items-center justify-between p-4 rounded-xl bg-white/30 border border-white/50 hover:bg-white/50 transition-colors cursor-pointer group">
                          <div className="flex items-center gap-3">
                            <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]"></div>
                            <p className="text-[13px] text-[#3d1a2e]">Đã đồng bộ tồn kho từ Kho Tổng</p>
                          </div>
                          <span className="text-[11px] text-[#9d6b7a] group-hover:text-[#3d1a2e] transition-colors">15 phút trước</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="w-full md:w-80 space-y-4">
                  <button className="w-full py-4 rounded-2xl bg-white border border-amber-200 text-[#3d1a2e] font-bold text-[13px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <Users size={16} /> Quản lý nhân sự
                  </button>
                  <button className="w-full py-4 rounded-2xl bg-white border border-amber-200 text-[#3d1a2e] font-bold text-[13px] shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2">
                    <Warehouse size={16} /> Xem sơ đồ kho
                  </button>
                  <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100 mt-4">
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-[12px] mb-2">
                      <Sparkles size={14} /> Hệ thống gợi ý
                    </div>
                    <p className="text-amber-800/70 text-[11px] leading-relaxed">
                      Chi nhánh này đang có hiệu suất cao hơn 15% so với cùng kỳ tháng trước. Nên cân nhắc mở rộng thêm kho bãi.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}