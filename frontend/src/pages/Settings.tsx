// File: src/pages/Settings.tsx
import React from "react";
import { Settings as SettingsIcon, Globe, Palette, Printer, Bell, Shield, ChevronRight } from "lucide-react";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };

const settings = [
  { icon: Globe, label: "Language", value: "Vietnamese (Tiếng Việt)" },
  { icon: Palette, label: "Theme", value: "Light (Glassmorphism)" },
  { icon: Printer, label: "Receipt Printer", value: "Epson TM-T88VII (Connected)" },
  { icon: Bell, label: "Notifications", value: "Email & App Alerts" },
  { icon: Shield, label: "Security", value: "Role-based Access Control" },
];

export function Settings() {
  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500 }}>System Configuration</p>
        <h1 style={{ color: "#3d1a2e", fontSize: "26px", fontWeight: 700 }}>General Settings</h1>
      </div>

      <div className="max-w-3xl" style={glassCard}>
        <div className="p-6 space-y-3">
          {settings.map(({ icon: Icon, label, value }) => (
            <div key={label} className="flex items-center gap-4 p-5 rounded-xl border bg-white hover:bg-gray-50 cursor-pointer transition-all">
              <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center"><Icon size={20} color="#D4AF37"/></div>
              <div className="flex-1"><p className="text-[#3d1a2e] font-bold text-[14px]">{label}</p><p className="text-[#9d6b7a] text-[12px] mt-1">{value}</p></div>
              <ChevronRight size={18} color="#c9a0b0"/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}