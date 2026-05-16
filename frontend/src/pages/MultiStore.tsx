// File: src/pages/MultiStore.tsx
import React, { useState } from "react";
import { Building2, MapPin, RefreshCw, AlertTriangle } from "lucide-react";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };

type StoreKey = "tong" | "ch1" | "ch2";
const stores: { key: StoreKey; label: string; short: string; color: string; address: string }[] = [
  { key: "tong", label: "Kho Tổng (HQ)", short: "Kho Tổng", color: "#D4AF37", address: "12 Nguyễn Huệ, Q.1" },
  { key: "ch1", label: "Kho CH1", short: "Kho CH1", color: "#F48FB1", address: "56 Lê Lợi, Q.3" },
  { key: "ch2", label: "Kho CH2", short: "Kho CH2", color: "#C084FC", address: "88 Trần Hưng Đạo, Q.5" },
];

const stockData = [
  { name: "Rose Velvet Lip Serum", sku: "LVL-ROS-001", tong: 620, ch1: 142, ch2: 142, minLevel: 50 },
  { name: "Golden Glow Foundation", sku: "FAC-GLD-002", tong: 380, ch1: 88, ch2: 68, minLevel: 40 },
  { name: "Hydra Boost Serum", sku: "SKN-HYD-008", tong: 0, ch1: 0, ch2: 0, minLevel: 30 },
];

export function MultiStore() {
  const [activeStore, setActiveStore] = useState<StoreKey>("tong");
  const currentStore = stores.find((s) => s.key === activeStore)!;

  return (
    <div className="p-8 min-h-screen">
      <div className="mb-8">
        <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500 }}>Warehouse Management</p>
        <h1 style={{ color: "#3d1a2e", fontSize: "26px", fontWeight: 700 }}>Store Inventory</h1>
      </div>

      <div className="grid grid-cols-3 gap-5 mb-8">
        {stores.map((s) => {
          const totalStock = stockData.reduce((sum, r) => sum + r[s.key], 0);
          return (
            <button key={s.key} onClick={() => setActiveStore(s.key)} style={{ ...glassCard, border: activeStore === s.key ? `2px solid ${s.color}` : "1px solid rgba(255,255,255,0.9)" }} className="p-5 text-left transition-all">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}><Building2 size={20} color={s.color} /></div>
                <div><p className="font-bold text-[#3d1a2e] text-[15px]">{s.short}</p><p className="text-[11px] text-[#9d6b7a]"><MapPin size={10} className="inline mr-1"/>{s.address}</p></div>
              </div>
              <p className="text-[22px] font-extrabold text-[#3d1a2e] mt-4">{totalStock.toLocaleString()} <span className="text-[12px] font-normal text-[#9d6b7a]">Units in stock</span></p>
            </button>
          );
        })}
      </div>

      <div style={glassCard} className="p-6">
        <div className="flex justify-between mb-5">
          <h2 className="text-[#3d1a2e] text-[16px] font-bold">Stock Levels — {currentStore.short}</h2>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-yellow-50"><RefreshCw size={12} color="#D4AF37"/><span className="text-[11px] text-[#92740d] font-bold">Sync: Just now</span></div>
        </div>
        <table className="w-full text-left">
          <thead><tr className="text-[#9d6b7a] text-[11px] border-b border-[rgba(212,175,55,0.15)]"><th className="py-2">PRODUCT</th><th>SKU</th><th>STOCK</th><th>STATUS</th></tr></thead>
          <tbody>
            {stockData.map((row) => {
              const qty = row[activeStore];
              const oos = qty === 0;
              const low = qty < row.minLevel && !oos;
              return (
                <tr key={row.sku} className="border-b border-[rgba(212,175,55,0.07)]">
                  <td className="py-3 font-bold text-[#3d1a2e] text-[13px]">{row.name}</td>
                  <td className="text-[11px] font-mono text-[#9d6b7a]">{row.sku}</td>
                  <td className="font-bold text-[14px] text-[#3d1a2e]">{qty}</td>
                  <td><span className={`px-2 py-1 rounded text-[10px] font-bold ${oos ? 'bg-red-100 text-red-600' : low ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-600'}`}>{oos ? "Out of Stock" : low ? "Low Stock" : "In Stock"}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}