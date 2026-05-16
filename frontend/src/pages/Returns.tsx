// File: src/pages/Returns.tsx
import  { useState, useEffect } from "react"; 
import { useAuth } from "../context/AuthContext";   
import { 
  Search, CheckCircle2, XCircle, Clock, 
  ShieldCheck, Receipt, ArrowRight,
  AlertCircle, Minus, Plus
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const glassCard = { 
  background: "rgba(255,255,255,0.72)", 
  backdropFilter: "blur(20px)", 
  border: "1px solid rgba(255,255,255,0.9)", 
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)", 
  borderRadius: "20px" 
};

const BACKEND_URL = "http://localhost:5000";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export function Returns() {
  const { user } = useAuth();
  const canApprove = user?.role === "manager" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"pos" | "manager">("pos");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");
  
  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!canApprove && activeTab === "manager") setActiveTab("pos");
  }, [canApprove, activeTab]);

  const fetchRecentRequests = () => {
    if (canApprove) {
      fetch(`${BACKEND_URL}/api/returns/recent`)
        .then(res => res.json())
        .then(json => { if (json.status === 'success') setRequests(json.data); })
        .catch(err => console.error(err));
    }
  };

  useEffect(() => {
    if (activeTab === "manager") fetchRecentRequests();
  }, [activeTab]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setInvoiceData(null); 
    try {
      const response = await fetch(`${BACKEND_URL}/api/returns/invoice/${searchQuery}`);
      const json = await response.json();
      if (json.status === 'success') {
        const processedItems = json.data.items.map((item: any) => ({ ...item, returnQty: 0, restock: true }));
        setInvoiceData({ customer: json.data.customer, date: json.data.date, items: processedItems });
        setToast(null);
      } else {
        showToast(json.message || "Không tìm thấy hóa đơn", "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối máy chủ!", "error");
    } finally { setIsSearching(false); }
  };

  const updateReturnQty = (id: number, delta: number) => {
    if (!invoiceData) return;
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map((item: any) => {
        if (item.id === id) {
          let newQty = item.returnQty + delta;
          if (newQty < 0) newQty = 0;
          if (newQty > item.qty) newQty = item.qty; 
          return { ...item, returnQty: newQty };
        }
        return item;
      })
    });
  };

  const toggleRestock = (id: number) => {
    if (!invoiceData) return;
    setInvoiceData({
      ...invoiceData,
      items: invoiceData.items.map((item: any) => 
        item.id === id ? { ...item, restock: !item.restock } : item
      )
    });
  };

  const submitRequest = async () => {
    if (!invoiceData) return;
    const itemsToReturn = invoiceData.items.filter((i: any) => i.returnQty > 0);
    if (itemsToReturn.length === 0) return showToast("Vui lòng chọn sản phẩm muốn trả!", "error");

    setIsSubmitting(true);
    const totalRefund = itemsToReturn.reduce((sum: number, i: any) => sum + (i.price * i.returnQty), 0);

    try {
      const response = await fetch(`${BACKEND_URL}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId: searchQuery, items: itemsToReturn, totalRefund, reason })
      });
      const json = await response.json();
      if (json.status === 'success') {
        showToast("Đã gửi Yêu cầu trả hàng cho Quản lý!", "success");
        setInvoiceData(null); setSearchQuery(""); setReason("");
      } else showToast("Lỗi: " + json.message, "error");
    } catch (error) { showToast("Lỗi kết nối máy chủ!", "error"); } 
    finally { setIsSubmitting(false); }
  };

  const handleManagerAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/returns/${id}/${action}`, { method: 'PUT' });
      const json = await response.json();
      if (json.status === 'success') {
        showToast(`Đã ${action === "approve" ? "hoàn tất" : "từ chối"} phiếu thành công!`, "success");
        fetchRecentRequests();
      } else {
        showToast(json.message, "error");
      }
    } catch (error) {
      showToast("Lỗi kết nối khi xử lý!", "error");
    }
  };

  const currentTotalRefund = invoiceData?.items.reduce((sum: number, i: any) => sum + (i.price * i.returnQty), 0) || 0;

  return (
    <div className="p-8 min-h-screen relative">
      <div className="flex items-center gap-3 mb-8">
        <div>
          <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">After-Sales</p>
          <h1 className="text-[#3d1a2e] text-[26px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Quản Lý Đổi Trả</h1>
        </div>
      </div>

      <div className="flex gap-2 mb-8">
        <button 
          onClick={() => setActiveTab("pos")}
          className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === "pos" ? "bg-gradient-to-r from-[#D4AF37] to-[#C9A94E] text-white shadow-lg shadow-[#D4AF37]/30" : "bg-white text-[#6b4153] hover:bg-gray-50 border border-white"}`}
        >
          <Receipt size={16} /> Tạo Phiếu Trả Hàng (POS)
        </button>
        {canApprove && (
          <button 
            onClick={() => setActiveTab("manager")}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all ${activeTab === "manager" ? "bg-gradient-to-r from-[#D4AF37] to-[#C9A94E] text-white shadow-lg shadow-[#D4AF37]/30" : "bg-white text-[#6b4153] hover:bg-gray-50 border border-white"}`}
          >
            <ShieldCheck size={16} /> Duyệt Yêu Cầu (Manager)
            {requests.filter(r => r.status === "Chờ duyệt").length > 0 && (
              <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full ring-2 ring-white animate-pulse">
                {requests.filter(r => r.status === "Chờ duyệt").length}
              </span>
            )}
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {activeTab === "pos" ? (
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <div style={glassCard} className="p-8">
              <h2 className="text-[#3d1a2e] text-[18px] font-bold mb-4 flex items-center gap-2"><Search size={20} color="#D4AF37"/> Tra cứu hóa đơn</h2>
              <div className="flex gap-3">
                <input 
                  value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleSearch()}
                  placeholder="Mã hóa đơn (Ví dụ: INV-1)..." 
                  className="flex-1 p-4 rounded-2xl border border-[#D4AF37]/20 outline-none focus:ring-2 ring-[#D4AF37]/10 bg-[#fdfbf7] text-[14px]" 
                />
                <button onClick={handleSearch} disabled={isSearching} className="px-8 py-4 rounded-2xl bg-[#3d1a2e] text-white font-bold text-[14px] transition-transform active:scale-95 disabled:opacity-70">
                  {isSearching ? "Đang tìm..." : "Kiểm Tra"}
                </button>
              </div>
            </div>

            {invoiceData && (
              <div style={glassCard} className="p-8 animate-in slide-in-from-bottom-5 duration-500">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-[#D4AF37]/10">
                  <div>
                    <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-widest">Khách hàng</p>
                    <p className="text-[#3d1a2e] text-[18px] font-bold">{invoiceData.customer}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[#9d6b7a] text-[11px] font-bold uppercase">Ngày mua</p>
                    <p className="text-[#3d1a2e] text-[14px] font-medium">{invoiceData.date}</p>
                  </div>
                </div>

                <div className="space-y-4 mb-8">
                  <div className="grid grid-cols-12 gap-4 px-4 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-2">
                    <div className="col-span-6">Sản Phẩm</div>
                    <div className="col-span-3 text-center">SL Trả / Mua</div>
                    <div className="col-span-3 text-right">Nhập lại kho?</div>
                  </div>

                  {invoiceData.items.map((i: any) => (
                    <div key={i.id} className={`flex items-center grid grid-cols-12 gap-4 p-4 rounded-2xl border transition-all ${i.returnQty > 0 ? "bg-[rgba(212,175,55,0.05)] border-[#D4AF37]/40" : "bg-white border-[#D4AF37]/10"}`}>
                      <div className="col-span-6 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100">
                          <ImageWithFallback src={getImageUrl(i.img)} alt={i.name} className="w-full h-full object-cover" />
                        </div>
                        <div>
                          <p className="font-bold text-[#3d1a2e] text-[13px] line-clamp-2 leading-tight">{i.name}</p>
                          <p className="text-[#9d6b7a] text-[12px] mt-1">{i.price.toLocaleString()} ₫</p>
                        </div>
                      </div>
                      <div className="col-span-3 flex justify-center">
                        <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-1 border border-gray-200">
                          <button onClick={() => updateReturnQty(i.id, -1)} className="w-7 h-7 flex items-center justify-center rounded bg-white shadow-sm text-gray-500 hover:text-red-500"><Minus size={14}/></button>
                          <span className="w-6 text-center font-bold text-[14px] text-[#3d1a2e]">{i.returnQty}</span>
                          <button onClick={() => updateReturnQty(i.id, 1)} className="w-7 h-7 flex items-center justify-center rounded bg-white shadow-sm text-gray-500 hover:text-green-500"><Plus size={14}/></button>
                        </div>
                        <span className="ml-2 mt-2 text-[#9d6b7a] text-[11px]">/ {i.qty}</span>
                      </div>
                      <div className="col-span-3 flex justify-end items-center">
                         <button
                            onClick={() => toggleRestock(i.id)}
                            disabled={i.returnQty === 0}
                            className={`w-12 h-6 rounded-full p-1 transition-all duration-300 relative ${i.returnQty === 0 ? "bg-gray-200 opacity-50 cursor-not-allowed" : i.restock ? "bg-green-500" : "bg-red-400"}`}
                          >
                            <div className={`w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${i.restock ? "translate-x-6" : "translate-x-0"}`}></div>
                         </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex gap-6 mb-8 items-end">
                  <div className="flex-1">
                    <label className="block mb-2 text-[#9d6b7a] text-[12px] font-bold uppercase">Ghi chú cho Quản lý (Lý do trả)</label>
                    <input 
                      value={reason} onChange={e => setReason(e.target.value)}
                      placeholder="VD: Sản phẩm bị lỗi seal, cần hoàn tiền..."
                      className="w-full p-4 rounded-2xl border border-[#D4AF37]/20 outline-none bg-[#fdfbf7] text-[14px] focus:ring-2 ring-[#D4AF37]/10"
                    />
                  </div>
                  <div className="text-right p-4 rounded-2xl bg-[#D4AF37]/10 border border-[#D4AF37]/30 min-w-[200px]">
                     <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-1">Tổng tiền sẽ hoàn</p>
                     <p className="text-[#D4AF37] text-[24px] font-black">{currentTotalRefund.toLocaleString()} ₫</p>
                  </div>
                </div>

                <button 
                  onClick={submitRequest} 
                  disabled={isSubmitting || currentTotalRefund === 0}
                  className="w-full py-5 rounded-2xl text-white font-bold text-[15px] flex items-center justify-center gap-2 transition-transform disabled:opacity-50 active:scale-[0.98]"
                  style={{ background: currentTotalRefund > 0 ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "#ccc", boxShadow: currentTotalRefund > 0 ? "0 8px 24px rgba(212,175,55,0.4)" : "none" }}
                >
                  {isSubmitting ? "Đang gửi..." : "Gửi Yêu Cầu Chờ Duyệt"} <ArrowRight size={18}/>
                </button>
              </div>
            )}
          </div>
        ) : (
          canApprove && (
            <div className="col-span-1 lg:col-span-3 space-y-4">
              {requests.length === 0 ? (
                <div className="text-center py-10 text-[#9d6b7a] italic">Chưa có yêu cầu đổi trả nào.</div>
              ) : (
                requests.map(req => {
                  let statusUI = { bg: "bg-gray-100", text: "text-gray-800", border: "#ccc", icon: Clock, label: req.status };
                  
                  if (req.status === "Chờ duyệt") {
                    statusUI = { bg: "bg-amber-100", text: "text-amber-800", border: "#fbbf24", icon: Clock, label: "Yêu cầu chờ duyệt" };
                  } else if (req.status === "Đã hoàn tất" || req.status === "Đã duyệt") {
                    statusUI = { bg: "bg-green-100", text: "text-green-800", border: "#22c55e", icon: CheckCircle2, label: "Yêu cầu đã hoàn tất" };
                  } else if (req.status === "Từ chối") {
                    statusUI = { bg: "bg-red-100", text: "text-red-800", border: "#ef4444", icon: XCircle, label: "Yêu cầu đã từ chối" };
                  }

                  return (
                    <div key={req.id} className="p-6 flex items-center justify-between transition-all hover:translate-y-[-2px] border-l-4" style={{ ...glassCard, borderLeftColor: statusUI.border }}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <span className="font-black text-[15px] text-[#3d1a2e]">{req.id}</span>
                          <span className="font-medium text-[13px] text-[#9d6b7a]">({req.date})</span>
                          <span className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-widest flex items-center gap-1.5 ${statusUI.bg} ${statusUI.text}`}>
                            <statusUI.icon size={12}/> {statusUI.label}
                          </span>
                        </div>
                        <p className="text-[#3d1a2e] text-[14px]">Khách hàng: <strong>{req.customer}</strong> (Hóa đơn: <strong className="text-[#D4AF37]">{req.invoice}</strong>)</p>
                        <p className="mt-1 text-[#6b4153] text-[13px]">Số lượng trả: <strong>{req.items}</strong> sản phẩm. Lý do: <i>{req.reason || "Không có"}</i></p>
                      </div>

                      <div className="text-right ml-8">
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-1">Số tiền cần hoàn</p>
                        <p className="text-[#3d1a2e] text-[22px] font-black mb-3">
                          {req.status === "Từ chối" ? "0 ₫" : `-${req.refund.toLocaleString()} ₫`}
                        </p>
                        
                        {req.status === "Chờ duyệt" && (
                          <div className="flex gap-2 justify-end">
                            <button onClick={() => handleManagerAction(req.id, "reject")} className="px-4 py-2 rounded-xl bg-red-50 text-red-600 font-bold text-[12px] hover:bg-red-100 transition-colors">Từ chối</button>
                            <button onClick={() => handleManagerAction(req.id, "approve")} className="px-5 py-2 rounded-xl bg-green-600 text-white font-bold text-[12px] flex items-center gap-1.5 hover:bg-green-700 shadow-md shadow-green-600/20"><CheckCircle2 size={14}/> Hoàn tất</button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )
        )}
      </div>

      {toast && (
        <div className={`fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl animate-in slide-in-from-bottom-5 border ${toast.type === 'success' ? 'bg-[#f0fdf4] border-green-200' : 'bg-[#fef2f2] border-red-200'}`}>
          <div className="shrink-0">{toast.type === 'success' ? <CheckCircle2 color="#16a34a" size={24} /> : <AlertCircle color="#dc2626" size={24} />}</div>
          <div>
            <h4 className={`font-bold text-[14px] ${toast.type === 'success' ? 'text-green-800' : 'text-red-800'}`}>{toast.type === 'success' ? 'Thành công' : 'Thông báo'}</h4>
            <p className={`text-[12px] mt-0.5 ${toast.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 rounded-full hover:bg-black/5"><XCircle size={18} /></button>
        </div>
      )}
    </div>
  );
}