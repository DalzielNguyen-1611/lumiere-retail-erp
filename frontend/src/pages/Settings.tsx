// File: src/pages/Settings.tsx
import React, { useState, useEffect } from "react";
import { Settings as SettingsIcon, Globe, Palette, Printer, Bell, Shield, ChevronRight, Sparkles, X } from "lucide-react";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };

const settings = [
  { icon: Globe, label: "Ngôn ngữ", value: "Vietnamese (Tiếng Việt)" },
  { icon: Palette, label: "Giao diện", value: "Sáng (Glassmorphism)" },
  { icon: Printer, label: "Máy in hóa đơn", value: "Epson TM-T88VII (Đã kết nối)" },
  { icon: Bell, label: "Thông báo", value: "Email & App Alerts" },
  { icon: Shield, label: "Bảo mật", value: "Phân quyền truy cập" },
];

export function Settings() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleItemClick = (label: string) => {
    if (["Máy in hóa đơn", "Thông báo", "Bảo mật"].includes(label)) {
      setToast("Tính năng đang phát triển");
      setTimeout(() => setToast(null), 3000);
    }
  };
  return (
    <div className="p-8 min-h-screen relative">
      {/* Toast Notification (Standardized) */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Sparkles size={20} className="text-[#D4AF37]" />
            </div>
            <div>
              <p className="font-bold text-[15px]">Thông báo</p>
              <p className="text-white/80 text-[13px] mt-0.5">{toast}</p>
            </div>
            <button onClick={() => setToast(null)} className="ml-auto text-white/40 hover:text-white transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>
      )}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles size={16} color="#D4AF37" />
          <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
          </p>
        </div>
        <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Cài Đặt Hệ Thống</h1>
      </div>

      <div className="w-full" style={glassCard}>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          {settings.map(({ icon: Icon, label, value }) => (
            <div 
              key={label} 
              onClick={() => handleItemClick(label)}
              className="flex items-center gap-4 p-6 rounded-2xl border border-white bg-white/50 shadow-sm hover:bg-white/80 hover:shadow-md hover:-translate-y-0.5 cursor-pointer transition-all active:scale-[0.98]"
            >
              <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center shadow-inner border border-amber-100">
                <Icon size={24} color="#D4AF37"/>
              </div>
              <div className="flex-1">
                <p className="text-[#3d1a2e] font-bold text-[15px]">{label}</p>
                <p className="text-[#9d6b7a] text-[13px] mt-1">{value}</p>
              </div>
              <ChevronRight size={18} color="#c9a0b0"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}