// File: src/pages/Customers.tsx
import { useState, useEffect, useMemo } from "react";
import { Search, Users, Heart, Star, UserPlus, CheckCircle2, XCircle, X, Sparkles } from "lucide-react";

const glassCard = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)",
  borderRadius: "20px",
};

interface CustomerData {
  id: number;
  name: string;
  phone: string;
  email: string;
  address: string;
  tier: string;
  points: number;
  createdAt?: string;
}

const tierStyle: Record<string, { bg: string; color: string }> = {
  "Kim Cương": { bg: "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white" },
  "VIP": { bg: "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white" },
  "Vàng": { bg: "rgba(212,175,55,0.15)", color: "#92740d" },
  "Bạc": { bg: "rgba(148,163,184,0.15)", color: "#64748b" },
  "Thường": { bg: "rgba(255,255,255,0.5)", color: "#9d6b7a" },
};

const avatarColors = ["#F48FB1", "#D4AF37", "#C084FC", "#FDA4AF", "#F9A8D4", "#FCA5A5", "#86EFAC", "#93C5FD"];

export function Customers() {
  const [customers, setCustomers] = useState<CustomerData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{show: boolean, message: string, type: "success" | "error"}>({show: false, message: "", type: "success"});

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newCustomer, setNewCustomer] = useState({ name: "", phone: "", email: "", address: "" });

  const [selectedCustomer, setSelectedCustomer] = useState<CustomerData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchCustomers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("http://localhost:5000/api/partners");
      const json = await response.json();
      if (json.status === "success" && Array.isArray(json.data)) {
        // CHỈ LỌC KHÁCH HÀNG
        const filtered = json.data.filter((p: any) => p.type === "Khách hàng");
        setCustomers(filtered.map((p: any) => ({
          id: p.id,
          name: p.name || "Chưa cập nhật",
          phone: p.phone || "",
          email: p.email || "",
          address: p.address || "Chưa cập nhật",
          tier: p.tier || "Thường",
          points: p.points || 0,
          createdAt: p.createdAt || "N/A"
        })));
      }
    } catch (error) {
      showToast("Lỗi kết nối API", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  const phoneRegex = /^\d{10}$/;

  const handleSaveCustomer = async () => {
    if (!newCustomer.name.trim()) return showToast("Vui lòng nhập tên khách hàng!", "error");
    if (!phoneRegex.test(newCustomer.phone)) return showToast("Số điện thoại phải có đúng 10 số!", "error");
    
    setIsSubmitting(true);
    try {
      // Gán cứng type là Khách hàng
      const payload = { ...newCustomer, type: "Khách hàng" };
      const res = await fetch("http://localhost:5000/api/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        setIsAddModalOpen(false);
        fetchCustomers();
        showToast("Đã thêm khách hàng thành công!", "success");
      }
    } catch (err) {
      showToast("Mất kết nối đến Server!", "error");
    } finally { setIsSubmitting(false); }
  };

  const handleUpdateCustomer = async () => {
    if (!selectedCustomer || !selectedCustomer.name.trim()) return showToast("Tên không được để trống!", "error");
    if (!phoneRegex.test(selectedCustomer.phone)) return showToast("Số điện thoại phải có đúng 10 số!", "error");
    
    setIsUpdating(true);
    try {
      const res = await fetch(`http://localhost:5000/api/partners/${selectedCustomer.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedCustomer)
      });
      if (res.ok) {
        setSelectedCustomer(null);
        fetchCustomers();
        showToast("Cập nhật thông tin thành công!", "success");
      }
    } catch (err) {
      showToast("Lỗi kết nối khi cập nhật!", "error");
    } finally { setIsUpdating(false); }
  };

  const displayedCustomers = useMemo(() => {
    return customers.filter((p) => {
      const safeName = String(p.name || "").toLowerCase();
      const safePhone = String(p.phone || "");
      return safeName.includes(searchQuery.toLowerCase()) || safePhone.includes(searchQuery);
    });
  }, [customers, searchQuery]);

  const getInitials = (name: string) => {
    if (!name || name === "Chưa cập nhật") return "?";
    const parts = name.split(" ");
    return parts.length >= 2 ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase() : name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-8 min-h-screen relative">
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
              {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Quản Lý Khách Hàng</h1>
        </div>
        <button
          onClick={() => {
            setNewCustomer({ name: "", phone: "", email: "", address: "" });
            setIsAddModalOpen(true);
          }}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 cursor-pointer"
          style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
        >
          <UserPlus size={18} /> Thêm Khách Hàng
        </button>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {[
          { label: "Tổng Khách Hàng", value: customers.length.toLocaleString('vi-VN'), icon: Users, color: "#D4AF37", bg: "rgba(212,175,55,0.12)" },
          { label: "Khách Có Thẻ Thành Viên", value: customers.filter(p => p.tier !== "Thường").length.toLocaleString('vi-VN'), icon: Heart, color: "#F48FB1", bg: "rgba(244,143,177,0.12)" },
          { label: "Khách VIP", value: customers.filter(p => p.tier.includes("VIP") || p.tier.includes("Kim Cương")).length.toLocaleString('vi-VN'), icon: Star, color: "#C084FC", bg: "rgba(192,132,252,0.12)" },
        ].map((s) => (
          <div key={s.label} style={glassCard} className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: s.bg }}><s.icon size={22} color={s.color} /></div>
            <div>
              <p style={{ color: "#9d6b7a", fontSize: "12px" }}>{s.label}</p>
              <p style={{ color: "#3d1a2e", fontSize: "22px", fontWeight: 700 }}>{isLoading ? "..." : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={glassCard}>
        <div className="p-6 pb-0 border-b" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[16px] font-bold text-[#3d1a2e]">Danh sách Khách hàng</h2>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/60 border border-[rgba(212,175,55,0.2)]">
              <Search size={15} color="#9d6b7a" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Tìm tên, SĐT..." className="bg-transparent outline-none text-[13px] w-[200px]" />
            </div>
          </div>
        </div>

        <div className="p-6 pt-4 overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[rgba(212,175,55,0.15)] text-[11px] font-bold text-[#9d6b7a] uppercase tracking-wider">
                <th className="p-3">Khách hàng</th>
                <th className="p-3">Liên hệ</th>
                <th className="p-3">Ngày tham gia</th>
                <th className="p-3">Hạng thẻ</th>
                <th className="p-3">Điểm</th>
              </tr>
            </thead>
            <tbody>
              {displayedCustomers.map((p, i) => (
                <tr 
                  key={p.id} 
                  onClick={() => setSelectedCustomer(p)} 
                  className="border-b border-[rgba(212,175,55,0.08)] hover:bg-[rgba(212,175,55,0.03)] cursor-pointer transition-all"
                >
                  <td className="p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-[11px]" style={{ background: avatarColors[i % avatarColors.length] + "30", border: `2px solid ${avatarColors[i % avatarColors.length]}50`, color: avatarColors[i % avatarColors.length] }}>{getInitials(p.name)}</div>
                      <div><p className="text-[13px] font-bold text-[#3d1a2e]">{p.name}</p><p className="text-[11px] text-[#9d6b7a]">ID: {p.id}</p></div>
                    </div>
                  </td>
                  <td className="p-3 text-[13px] text-[#6b4153] font-medium">{p.phone}</td>
                  <td className="p-3 text-[13px] text-[#6b4153]">{p.createdAt}</td>
                  <td className="p-3"><span className="px-2.5 py-1 rounded-full text-[11px] font-bold" style={{ background: tierStyle[p.tier]?.bg || "gray", color: tierStyle[p.tier]?.color || "white" }}>{p.tier}</span></td>
                  <td className="p-3 text-[13px] font-bold text-[#3d1a2e]">{p.points.toLocaleString('vi-VN')} pts</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL THÊM KHÁCH HÀNG */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>Thêm Mới Khách Hàng</h2>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Tên Khách Hàng *</label>
                <input value={newCustomer.name} onChange={e => setNewCustomer({...newCustomer, name: e.target.value})} placeholder="Nhập tên đầy đủ..." className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Số Điện Thoại *</label>
                  <input maxLength={10} value={newCustomer.phone} onChange={e => setNewCustomer({...newCustomer, phone: e.target.value.replace(/\D/g, "")})} placeholder="Đủ 10 số..." className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Email</label>
                  <input type="email" value={newCustomer.email} onChange={e => setNewCustomer({...newCustomer, email: e.target.value})} placeholder="email@example.com" className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Địa Chỉ</label>
                <input value={newCustomer.address} onChange={e => setNewCustomer({...newCustomer, address: e.target.value})} placeholder="Địa chỉ..." className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="flex-1 py-4 rounded-2xl font-bold bg-red-50 text-red-600 text-[14px] transition-all hover:bg-red-100 active:scale-95">Hủy</button>
                <button onClick={handleSaveCustomer} disabled={isSubmitting} className="flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:scale-100" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>{isSubmitting ? "Đang xử lý..." : "Lưu Thông Tin"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CHỈNH SỬA KHÁCH HÀNG */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>Chỉnh Sửa Khách Hàng</h2>
            <button onClick={() => setSelectedCustomer(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <div className="space-y-4">
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Tên Khách Hàng</label>
                <input value={selectedCustomer.name} onChange={e => setSelectedCustomer({...selectedCustomer, name: e.target.value})} className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Số Điện Thoại</label>
                  <input maxLength={10} value={selectedCustomer.phone} onChange={e => setSelectedCustomer({...selectedCustomer, phone: e.target.value.replace(/\D/g, "")})} className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Email</label>
                  <input value={selectedCustomer.email} onChange={e => setSelectedCustomer({...selectedCustomer, email: e.target.value})} className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase tracking-wider">Địa Chỉ</label>
                <input value={selectedCustomer.address} onChange={e => setSelectedCustomer({...selectedCustomer, address: e.target.value})} className="w-full p-3 rounded-xl border border-[rgba(212,175,55,0.3)] bg-[#fdfbf7] text-[13px] outline-none" />
              </div>
              <div className="flex gap-3 mt-6">
                <button onClick={() => setSelectedCustomer(null)} className="flex-1 py-4 rounded-2xl font-bold bg-red-50 text-red-600 text-[14px] transition-all hover:bg-red-100 active:scale-95">Hủy</button>
                <button onClick={handleUpdateCustomer} disabled={isUpdating} className="flex-[2] py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95 disabled:bg-gray-300 disabled:scale-100" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>{isUpdating ? "Đang lưu..." : "Cập Nhật"}</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION (Standardized) */}
      {toast.show && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === "success" ? "bg-emerald-500/20" : "bg-rose-500/20"
            }`}>
              {toast.type === "error" ? <AlertCircle className="text-rose-400" size={20} /> : <Sparkles className="text-[#D4AF37]" size={20} />}
            </div>
            <div>
              <p className="font-bold text-[15px]">{toast.type === "success" ? "Thành công" : "Lỗi hệ thống"}</p>
              <p className="text-white/80 text-[13px] mt-0.5">{toast.message}</p>
            </div>
            <button onClick={() => setToast({ ...toast, show: false })} className="ml-auto text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}