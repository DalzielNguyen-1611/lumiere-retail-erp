// File: src/pages/Logistics.tsx
import React, { useState, useEffect } from "react";
import { ArrowRight, CheckCircle2, Plus, Clock, PackageCheck, XCircle, FileText, Search, X, Sparkles } from "lucide-react";

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };
const BACKEND_URL = "http://localhost:5000";

export function Logistics() {
  const [receipts, setReceipts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [toast, setToast] = useState<{show: boolean, message: string, type: "success" | "error"}>({show: false, message: "", type: "success"});
  
  // State mới để quản lý Modal Xác nhận thay cho window.confirm
  const [confirmModal, setConfirmModal] = useState({ isOpen: false, ticketCode: "" });
  const [isApproving, setIsApproving] = useState(false);

  // States cho Modal Chuyển Kho
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [transferForm, setTransferForm] = useState({ fromId: "", toId: "", productId: "", qty: 1 });
  const [isTransferring, setIsTransferring] = useState(false);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchReceipts = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/logistics/receipts`);
      const json = await res.json();
      if (json.status === "success") {
        setReceipts(json.data);
      }
    } catch (error) {
      showToast("Lỗi tải dữ liệu phiếu kho!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMetadata = async () => {
    try {
      const [wRes, pRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/inventory/warehouses`),
        fetch(`${BACKEND_URL}/api/inventory/products`)
      ]);
      const wJson = await wRes.json();
      const pJson = await pRes.json();
      if (wJson.status === "success") setWarehouses(wJson.data);
      if (pJson.status === "success") setProducts(pJson.data);
    } catch (e) { console.error("Lỗi tải metadata"); }
  };

  useEffect(() => { 
    fetchReceipts(); 
    fetchMetadata();
  }, []);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferForm.fromId || !transferForm.toId || !transferForm.productId) {
      showToast("Vui lòng nhập đầy đủ thông tin!", "error");
      return;
    }
    setIsTransferring(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/logistics/transfer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouseId: transferForm.fromId,
          toWarehouseId: transferForm.toId,
          productId: transferForm.productId,
          quantity: transferForm.qty,
          staffId: 1 // Giả lập NV số 1
        })
      });
      const json = await res.json();
      if (json.status === "success") {
        showToast("Tạo phiếu chuyển kho thành công!", "success");
        setIsTransferModalOpen(false);
        fetchReceipts();
      } else {
        showToast(json.message, "error");
      }
    } catch (e) {
      showToast("Lỗi kết nối server!", "error");
    } finally {
      setIsTransferring(false);
    }
  };

  // Hàm xử lý duyệt khi bấm "Xác Nhận" trong Modal xịn
  const executeApproveWarehouse = async () => {
    setIsApproving(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/logistics/approve/${confirmModal.ticketCode}`, { method: 'PUT' });
      const json = await res.json();
      if (json.status === 'success') {
        showToast("Đã duyệt nhập kho thành công! Tồn kho đã được cộng.", "success");
        fetchReceipts();
        setConfirmModal({ isOpen: false, ticketCode: "" }); // Đóng modal khi xong
      } else {
        showToast(json.message, "error");
      }
    } catch (error) {
      showToast("Lỗi xử lý duyệt kho!", "error");
    } finally {
      setIsApproving(false);
    }
  };

  const filteredReceipts = receipts.filter(r => 
    r.id?.toLowerCase().includes(searchQuery.toLowerCase()) || 
    r.partner?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Quản Lý Phiếu Kho</h1>
        </div>
        <button 
          onClick={() => setIsTransferModalOpen(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 cursor-pointer" 
          style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
        >
          <Plus size={18}/> Tạo Phiếu Xuất/Chuyển Kho
        </button>
      </div>

      <div style={glassCard} className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[#3d1a2e] text-[16px] font-bold">Lịch Sử Phiếu Kho (Nhập/Xuất)</h2>
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#D4AF37]/20 shadow-sm w-80">
            <Search size={16} color="#9d6b7a"/>
            <input 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Tìm theo mã phiếu, đối tác..." 
              className="bg-transparent outline-none text-[13px] w-full text-[#3d1a2e]"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/10 bg-[#D4AF37]/5">
                <th className="py-4 px-4 rounded-tl-xl">Mã Phiếu</th>
                <th className="px-3">Loại Phiếu</th>
                <th className="px-3">Từ (Nguồn)</th>
                <th className="px-3">Đến (Đích)</th>
                <th className="px-3">Ngày Lập</th>
                <th className="px-3 text-right">Tổng Giá Trị</th>
                <th className="px-4 text-center rounded-tr-xl">Hành Động / Trạng Thái</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="py-10 text-center text-[#9d6b7a]">Đang tải dữ liệu phiếu kho...</td></tr>
              ) : filteredReceipts.length === 0 ? (
                <tr><td colSpan={7} className="py-10 text-center text-[#9d6b7a]">Chưa có dữ liệu phiếu kho nào.</td></tr>
              ) : (
                filteredReceipts.map((r) => (
                  <tr key={r.id} className="border-b border-[#D4AF37]/5 hover:bg-white transition-colors">
                    <td className="py-4 px-4 font-black text-[#D4AF37] text-[13px] flex items-center gap-2">
                      <FileText size={16} className="text-[#D4AF37]/70"/> {r.id}
                    </td>
                    <td className="px-3 font-bold text-[#3d1a2e] text-[13px]">{r.type}</td>
                    <td className="px-3 text-[#6b4153] text-[13px]">{r.partner || r.fromWarehouse}</td>
                    <td className="px-3 font-bold text-[#3d1a2e] text-[13px] flex items-center gap-1.5">
                      {r.fromWarehouse !== 'N/A' && r.fromWarehouse !== null && <ArrowRight size={14} className="text-[#9d6b7a]"/>} 
                      {r.toWarehouse}
                    </td>
                    <td className="px-3 text-[#6b4153] text-[13px]">{r.date}</td>
                    <td className="px-3 font-bold text-[#3d1a2e] text-[13px] text-right">
                      {r.value ? r.value.toLocaleString() : 0} ₫
                    </td>
                    <td className="px-4 text-center">
                      {/* NÚT BẤM MỞ MODAL XÁC NHẬN */}
                      {(r.status === 'Chờ giao hàng' || r.status === 'Chờ duyệt') && r.type === 'Nhập kho' ? (
                        <button 
                          onClick={() => setConfirmModal({ isOpen: true, ticketCode: r.id })} 
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[12px] font-bold transition-all flex items-center gap-1.5 mx-auto shadow-md shadow-emerald-500/20 hover:-translate-y-0.5"
                        >
                          <PackageCheck size={16}/> Xác nhận Nhập Kho
                        </button>
                      ) : r.status === 'Đã hoàn tất' || r.status === 'Đã nhập xong' ? (
                        <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm">
                          <CheckCircle2 size={14}/> Đã hoàn tất
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-[11px] font-bold flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm">
                          <Clock size={14}/> {r.status}
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ======================= MODAL XÁC NHẬN NHẬP KHO XỊN XÒ ======================= */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95 duration-200">
            <button onClick={() => setConfirmModal({ isOpen: false, ticketCode: "" })} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors">
              <X size={24} />
            </button>
            
            <div className="flex flex-col items-center text-center mt-2">
              <div className="w-20 h-20 bg-emerald-50 border-4 border-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mb-5">
                <PackageCheck size={40} />
              </div>
              <h2 className="text-2xl font-bold mb-3 text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>Xác nhận Nhập Kho</h2>
              <p className="text-[#9d6b7a] text-[14px] mb-8 leading-relaxed">
                Bạn có chắc chắn hàng đã giao đủ và muốn tiến hành nhập kho cho phiếu <br/><strong className="text-[#D4AF37] text-[16px]">{confirmModal.ticketCode}</strong> không?<br/> Số lượng tồn kho sẽ được cộng tự động.
              </p>
              
              <div className="flex gap-3 w-full">
                <button type="button" onClick={() => setConfirmModal({ isOpen: false, ticketCode: "" })} disabled={isApproving} className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200 text-[14px] transition-colors disabled:opacity-50">
                  Hủy bỏ
                </button>
                <button onClick={executeApproveWarehouse} disabled={isApproving} className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-emerald-500/30 hover:-translate-y-0.5 disabled:opacity-50 transition-all" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                  {isApproving ? "Đang xử lý..." : "Xác Nhận Nhập"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* ======================= MODAL TẠO PHIẾU CHUYỂN KHO ======================= */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsTransferModalOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
            <h2 className="text-2xl font-bold mb-6 text-[#3d1a2e]" style={{ fontFamily: "var(--font-heading)" }}>Tạo Phiếu Chuyển Kho</h2>
            
            <form onSubmit={handleCreateTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#9d6b7a] uppercase mb-1">Kho Đi</label>
                  <select 
                    value={transferForm.fromId}
                    onChange={e => setTransferForm({...transferForm, fromId: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Chọn kho đi</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#9d6b7a] uppercase mb-1">Kho Đến</label>
                  <select 
                    value={transferForm.toId}
                    onChange={e => setTransferForm({...transferForm, toId: e.target.value})}
                    className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#D4AF37]"
                  >
                    <option value="">Chọn kho đến</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#9d6b7a] uppercase mb-1">Sản Phẩm</label>
                <select 
                  value={transferForm.productId}
                  onChange={e => setTransferForm({...transferForm, productId: e.target.value})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#D4AF37]"
                >
                  <option value="">Chọn sản phẩm</option>
                  {products.map(p => <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock})</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#9d6b7a] uppercase mb-1">Số Lượng Chuyển</label>
                <input 
                  type="number"
                  min="1"
                  value={transferForm.qty}
                  onChange={e => setTransferForm({...transferForm, qty: parseInt(e.target.value) || 1})}
                  className="w-full p-3 rounded-xl border border-gray-200 outline-none focus:border-[#D4AF37]"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="flex-1 py-3.5 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-gray-200">
                  Hủy bỏ
                </button>
                <button type="submit" disabled={isTransferring} className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-amber-500/30" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>
                  {isTransferring ? "Đang xử lý..." : "Xác Nhận Chuyển"}
                </button>
              </div>
            </form>
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