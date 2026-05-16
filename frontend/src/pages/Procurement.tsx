import React, { useState, useEffect } from "react";
import { Building, Truck, Plus, X, CheckCircle2, XCircle, Mail, MapPin, Phone, Receipt, ChevronDown, ChevronRight, Search, Trash2, Clock, Sparkles } from "lucide-react";
// Đảm bảo đường dẫn này khớp với file AuthContext trong source code của bạn:
import { useAuth } from "../context/AuthContext"; 

const glassCard = { background: "rgba(255,255,255,0.72)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.9)", boxShadow: "0 8px 32px rgba(61,26,46,0.06)", borderRadius: "20px" };
const BACKEND_URL = "http://localhost:5000";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export function Procurement() {
  const { user } = useAuth(); // Lấy dữ liệu tài khoản đang đăng nhập
  const [activeTab, setActiveTab] = useState<"suppliers"|"orders">("orders");
  
  // Dữ liệu API
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State - Quản lý Nhà cung cấp
  const [expandedSupplier, setExpandedSupplier] = useState<number | null>(null);
  const [isAddSupplierOpen, setIsAddSupplierOpen] = useState(false);
  const [isSubmittingSupplier, setIsSubmittingSupplier] = useState(false);
  const [newSupplier, setNewSupplier] = useState({ name: "", phone: "", email: "", address: "", taxCode: "", paymentTerms: "Chuyển khoản / Tiền mặt", note: "" });
  
  // UI State - Quản lý Nhập hàng (PO)
  const [isAddPOOpen, setIsAddPOOpen] = useState(false);
  const [isSubmittingPO, setIsSubmittingPO] = useState(false);
  const [poForm, setPoForm] = useState({ supplierId: "", note: "" });
  const [poItems, setPoItems] = useState<{productId: number, name: string, quantity: number, price: number}[]>([]);
  const [productSearch, setProductSearch] = useState("");
  
  const [toast, setToast] = useState<{show: boolean, message: string, type: "success" | "error"}>({show: false, message: "", type: "success"});

  const showToast = (message: string, type: "success" | "error") => {
    setToast({show: true, message, type});
    setTimeout(() => setToast(prev => ({...prev, show: false})), 3000);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [supRes, ordRes, prodRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/procurement/suppliers`),
        fetch(`${BACKEND_URL}/api/procurement/orders`),
        fetch(`${BACKEND_URL}/api/procurement/products`)
      ]);
      
      const supJson = await supRes.json();
      const ordJson = await ordRes.json();
      const prodJson = await prodRes.json();
      
      if (supJson.status === "success") setSuppliers(supJson.data);
      if (ordJson.status === "success") setOrders(ordJson.data);
      if (prodJson.status === "success") setProducts(prodJson.data);
    } catch (error) {
      showToast("Lỗi tải dữ liệu!", "error");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSupplier = async () => {
    if (!newSupplier.name.trim()) return showToast("Vui lòng nhập tên doanh nghiệp!", "error");
    if (!newSupplier.taxCode.trim()) return showToast("Vui lòng nhập Mã số thuế!", "error");

    setIsSubmittingSupplier(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/procurement/suppliers`, {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newSupplier)
      });
      if (res.ok) {
        setIsAddSupplierOpen(false); 
        setNewSupplier({ name: "", phone: "", email: "", address: "", taxCode: "", paymentTerms: "Chuyển khoản / Tiền mặt", note: "" });
        fetchData(); 
        showToast("Đã thêm nhà cung cấp thành công!", "success");
      }
    } catch (err) { showToast("Lỗi kết nối máy chủ!", "error"); } 
    finally { setIsSubmittingSupplier(false); }
  };

  const addProductToPO = (productId: string) => {
    if (!productId) return;
    const prod = products.find(p => p.id.toString() === productId);
    if (!prod) return;
    
    const existingIndex = poItems.findIndex(i => i.productId === prod.id);
    if (existingIndex >= 0) {
      const newItems = [...poItems];
      newItems[existingIndex].quantity += 1;
      setPoItems(newItems);
    } else {
      setPoItems([...poItems, { productId: prod.id, name: prod.name, quantity: 1, price: prod.price * 0.7 }]);
    }
  };

  const updatePOItem = (index: number, field: string, value: number) => {
    const newItems = [...poItems];
    newItems[index] = { ...newItems[index], [field]: value } as any;
    setPoItems(newItems);
  };

  const removePOItem = (index: number) => {
    setPoItems(poItems.filter((_, i) => i !== index));
  };

  const poTotalValue = poItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

  const handleSavePO = async () => {
    if (!poForm.supplierId) return showToast("Vui lòng chọn Nhà cung cấp!", "error");
    if (poItems.length === 0) return showToast("Vui lòng thêm ít nhất 1 sản phẩm!", "error");
    
    setIsSubmittingPO(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/procurement/orders`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          supplierId: parseInt(poForm.supplierId),
          note: poForm.note,
          items: poItems,
          totalValue: poTotalValue,
          employeeId: (user as any)?.maNhanVien || (user as any)?.id || 1
        })
      });

      const json = await res.json();

      if (res.ok && json.status === 'success') {
        setIsAddPOOpen(false); 
        setPoForm({ supplierId: "", note: "" }); 
        setPoItems([]);
        fetchData(); 
        showToast("Tạo Đơn nhập hàng thành công!", "success");
        setActiveTab("orders"); 
      } else {
        showToast(json.message || "Lỗi khi lưu đơn hàng!", "error");
      }
    } catch (err) { 
      showToast("Lỗi kết nối máy chủ! Hãy kiểm tra Backend.", "error"); 
    } 
    finally { 
      setIsSubmittingPO(false); 
    }
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
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>Mua Hàng & Cung Ứng</h1>
        </div>
        <div className="flex gap-3">
          {activeTab === "suppliers" && (
            <button onClick={() => setIsAddSupplierOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 cursor-pointer" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
              <Building size={18} /> Thêm Nhà Cung Cấp
            </button>
          )}
          <button onClick={() => setIsAddPOOpen(true)} className="flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 cursor-pointer" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>
            <Plus size={18} /> Tạo Đơn Nhập Hàng (PO)
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-6">
        <button 
          onClick={() => setActiveTab("orders")} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95" 
          style={{ 
            background: activeTab === "orders" ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.7)", 
            color: activeTab === "orders" ? "#fff" : "#3d1a2e", 
            border: "1px solid", 
            borderColor: activeTab === "orders" ? "transparent" : "rgba(255,255,255,0.9)",
            boxShadow: activeTab === "orders" ? "0 8px 24px rgba(212,175,55,0.25)" : "none"
          }}
        >
          <Truck size={18}/> Đơn Nhập Hàng (PO)
        </button>
        <button 
          onClick={() => setActiveTab("suppliers")} 
          className="flex items-center gap-2 px-6 py-3 rounded-2xl text-[14px] font-bold transition-all shadow-sm hover:shadow-md active:scale-95" 
          style={{ 
            background: activeTab === "suppliers" ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.7)", 
            color: activeTab === "suppliers" ? "#fff" : "#3d1a2e", 
            border: "1px solid", 
            borderColor: activeTab === "suppliers" ? "transparent" : "rgba(255,255,255,0.9)",
            boxShadow: activeTab === "suppliers" ? "0 8px 24px rgba(212,175,55,0.25)" : "none"
          }}
        >
          <Building size={18}/> Quản Lý Nhà Cung Cấp
        </button>
      </div>

      {/* DANH SÁCH NHÀ CUNG CẤP */}
      {activeTab === "suppliers" && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
          {isLoading ? (
            <div className="col-span-2 text-center py-10 text-[#9d6b7a]">Đang tải dữ liệu...</div>
          ) : suppliers.length === 0 ? (
             <div className="col-span-2 text-center py-10 text-[#9d6b7a] bg-white/50 rounded-2xl border border-white">Chưa có dữ liệu nhà cung cấp nào.</div>
          ) : (
            suppliers.map(s => {
              const supplierOrders = orders.filter(o => o.supplierId === s.id);
              const isExpanded = expandedSupplier === s.id;

              return (
                <div key={s.id} style={glassCard} className="p-6 transition-all duration-300">
                  <div className="flex items-center gap-4 mb-4 border-b border-[#D4AF37]/10 pb-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center border border-green-100"><Building color="#10b981" size={24}/></div>
                    <div className="flex-1">
                      <p className="font-bold text-[#3d1a2e] text-[16px]">{s.name}</p>
                      <p className="text-[#9d6b7a] text-[12px] mt-0.5">ID: NCC-{s.id} • Tham gia: {s.createdAt || 'N/A'}</p>
                    </div>
                  </div>

                  <div className="space-y-2 mb-4">
                    <div className="flex items-center gap-3 text-[#6b4153] text-[13px]"><Phone size={14} color="#9d6b7a" /> {s.phone || "Chưa cập nhật SĐT"}</div>
                    <div className="flex items-center gap-3 text-[#6b4153] text-[13px]"><Mail size={14} color="#9d6b7a" /> {s.email || "Chưa cập nhật Email"}</div>
                    <div className="flex items-start gap-3 text-[#6b4153] text-[13px]"><MapPin size={14} color="#9d6b7a" className="shrink-0 mt-0.5" /> <span className="line-clamp-2">{s.address || "Chưa cập nhật địa chỉ"}</span></div>
                  </div>

                  <button onClick={() => setExpandedSupplier(isExpanded ? null : s.id)} className="w-full flex items-center justify-between py-2.5 px-4 bg-emerald-50 hover:bg-emerald-100 transition-colors rounded-xl text-[12px] font-bold text-[#059669]">
                    <span className="flex items-center gap-2"><Receipt size={14}/> Lịch sử nhập hàng ({supplierOrders.length})</span>
                    {isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>}
                  </button>

                  {isExpanded && (
                    <div className="mt-3 bg-white/60 rounded-xl border border-gray-100 overflow-hidden animate-in slide-in-from-top-2 fade-in">
                      {supplierOrders.length === 0 ? (
                        <p className="p-4 text-center text-[12px] text-gray-400 italic">Chưa có đơn nhập hàng nào.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead><tr className="bg-gray-50/50 text-[#9d6b7a] text-[10px] font-bold uppercase tracking-wider border-b"><th className="py-2 px-3">Mã Đơn</th><th className="px-3">Trạng Thái Kho</th><th className="px-3 text-right">Tổng Tiền</th></tr></thead>
                          <tbody>
                            {supplierOrders.map(po => (
                              <tr key={po.id} className="border-b border-gray-50 hover:bg-white transition-colors">
                                <td className="py-2.5 px-3 font-bold text-[#D4AF37] text-[11px]">{po.code || `PO-${po.id}`}</td>
                                <td className="px-3">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${po.status === 'Chờ giao hàng' || po.status === 'Chờ duyệt' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}`}>
                                    {po.status}
                                  </span>
                                </td>
                                <td className="px-3 font-bold text-[#3d1a2e] text-[12px] text-right">{po.value.toLocaleString()} ₫</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* DANH SÁCH TẤT CẢ ĐƠN NHẬP HÀNG (PO) */}
      {activeTab === "orders" && (
        <div style={glassCard} className="p-6">
          <table className="w-full text-left">
            <thead><tr className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider border-b border-[#D4AF37]/10"><th className="py-3 px-2">Hóa Đơn (PO)</th><th className="px-2">Nhà Cung Cấp</th><th className="px-2">Ngày Nhập</th><th className="px-2">Tổng Giá Trị</th><th className="px-2">Mã Phiếu Kho</th><th className="px-2 text-center">Trạng Thái Kho</th></tr></thead>
            <tbody>
              {orders.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-[#9d6b7a]">Chưa có đơn nhập hàng nào trong hệ thống.</td></tr>
              ) : (
                orders.map(po => (
                  <tr key={po.id} className="border-b border-[#D4AF37]/5 hover:bg-[#D4AF37]/5 transition-colors">
                    <td className="py-4 px-2 font-black text-[#D4AF37] text-[13px]">{po.code || `PO-${po.id}`}</td>
                    <td className="px-2 font-bold text-[#3d1a2e] text-[13px]">{po.supplier}</td>
                    <td className="px-2 text-[#6b4153] text-[13px]">{po.date}</td>
                    <td className="px-2 font-bold text-[#3d1a2e] text-[14px]">{po.value.toLocaleString()} ₫</td>
                    <td className="px-2 text-[#6b4153] text-[12px]">{po.ticketCode || 'N/A'}</td>
                    {/* KHU VỰC THAY ĐỔI: Nhãn trạng thái thay vì nút bấm */}
                    <td className="px-2 text-center">
                       {po.status === 'Chờ giao hàng' || po.status === 'Chờ duyệt' ? (
                          <span className="px-3 py-1.5 bg-amber-50 border border-amber-200 text-amber-600 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm">
                             <Clock size={12}/> {po.status}
                          </span>
                       ) : po.status === 'Đã hoàn tất' || po.status === 'Đã nhập xong' ? (
                          <span className="px-3 py-1.5 bg-emerald-50 border border-emerald-200 text-emerald-600 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm">
                             <CheckCircle2 size={12}/> Đã nhập kho
                          </span>
                       ) : (
                          <span className="px-3 py-1.5 bg-gray-50 border border-gray-200 text-gray-500 rounded-full text-[10px] font-bold flex items-center justify-center gap-1.5 w-max mx-auto shadow-sm">
                             {po.status}
                          </span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= MODAL TẠO ĐƠN NHẬP HÀNG (MINI-POS) ======================= */}
      {isAddPOOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-6xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200 flex flex-col h-[90vh]">
            <button onClick={() => setIsAddPOOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 z-10"><X size={24} /></button>
            <h2 className="text-2xl font-bold mb-6 text-[#3d1a2e] px-2" style={{ fontFamily: "var(--font-heading)" }}>Lập Đơn Nhập Hàng (PO)</h2>
            
            <div className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* === CỘT TRÁI: LƯỚI SẢN PHẨM === */}
                <div className="lg:col-span-5 flex flex-col bg-[#fdfbf7] border border-[#D4AF37]/30 rounded-2xl overflow-hidden">
                    <div className="p-4 bg-white border-b border-[#D4AF37]/20 flex items-center gap-3 shadow-sm z-10">
                        <Search size={18} color="#D4AF37"/>
                        <input 
                            value={productSearch} 
                            onChange={(e) => setProductSearch(e.target.value)} 
                            placeholder="Tìm tên sản phẩm muốn nhập..." 
                            className="flex-1 outline-none text-[14px] bg-transparent font-medium text-[#3d1a2e]"
                        />
                    </div>
                    <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 md:grid-cols-3 gap-3 content-start">
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).map(p => (
                            <div 
                                key={p.id} 
                                onClick={() => addProductToPO(p.id.toString())}
                                className="bg-white border border-[#D4AF37]/20 rounded-xl p-3 cursor-pointer hover:border-[#D4AF37] hover:shadow-md hover:-translate-y-1 transition-all flex flex-col items-center text-center group"
                            >
                                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-50 mb-2 border border-gray-100 flex items-center justify-center">
                                    <img src={getImageUrl(p.img)} alt={p.name} className="max-w-full max-h-full object-cover mix-blend-multiply" onError={(e) => e.currentTarget.src = '/placeholder.png'} />
                                </div>
                                <p className="text-[12px] font-bold text-[#3d1a2e] line-clamp-2 leading-tight mb-1">{p.name}</p>
                                <p className="text-[11px] text-[#9d6b7a]">Giá: {(p.price * 0.7).toLocaleString()} ₫</p>
                            </div>
                        ))}
                        {products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase())).length === 0 && (
                            <div className="col-span-full py-10 text-center text-[#9d6b7a] text-[13px] italic">Không tìm thấy sản phẩm phù hợp.</div>
                        )}
                    </div>
                </div>

                {/* === CỘT PHẢI: THÔNG TIN ĐƠN & GIỎ HÀNG === */}
                <div className="lg:col-span-7 flex flex-col gap-4 min-h-0">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-2 text-[#9d6b7a] text-[12px] font-bold uppercase">Nhà Cung Cấp *</label>
                            <select value={poForm.supplierId} onChange={(e) => setPoForm({...poForm, supplierId: e.target.value})} className="w-full p-3.5 rounded-xl border outline-none bg-gray-50 text-[13px] border-gray-200 focus:border-[#D4AF37]">
                                <option value="">-- Chọn Nhà Cung Cấp --</option>
                                {suppliers.map(s => <option key={s.id} value={s.id}>{s.name} (NCC-{s.id})</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block mb-2 text-[#9d6b7a] text-[12px] font-bold uppercase">Ghi chú đơn hàng</label>
                            <input value={poForm.note} onChange={(e) => setPoForm({...poForm, note: e.target.value})} placeholder="VD: Nhập hàng đợt 1 tháng 4..." className="w-full p-3.5 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#D4AF37]" />
                        </div>
                    </div>

                    <div className="flex-1 border border-gray-200 rounded-2xl overflow-hidden bg-white flex flex-col">
                        <div className="bg-gray-50 p-3 border-b border-gray-200 text-[#9d6b7a] text-[11px] font-bold uppercase grid grid-cols-12 gap-2 text-center">
                            <div className="col-span-5 text-left pl-2">Sản phẩm nhập</div>
                            <div className="col-span-2">Số lượng</div>
                            <div className="col-span-2">Đơn giá</div>
                            <div className="col-span-2 text-right">Thành tiền</div>
                            <div className="col-span-1"></div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2">
                            {poItems.length === 0 ? (
                                <div className="h-full flex items-center justify-center text-[#9d6b7a] text-[13px] italic">Hãy nhấp vào hình sản phẩm bên trái để thêm vào đơn.</div>
                            ) : (
                                <div className="space-y-2">
                                    {poItems.map((item, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center p-2 border border-gray-100 rounded-xl hover:bg-gray-50">
                                            <div className="col-span-5 pl-2 text-[13px] font-bold text-[#3d1a2e] line-clamp-2">{item.name}</div>
                                            <div className="col-span-2"><input type="number" min="1" value={item.quantity} onChange={(e) => updatePOItem(index, 'quantity', parseInt(e.target.value) || 1)} className="w-full p-2 text-center border rounded-lg text-[13px] outline-none focus:border-[#D4AF37]"/></div>
                                            <div className="col-span-2 flex items-center gap-1"><input type="number" min="0" value={item.price} onChange={(e) => updatePOItem(index, 'price', parseInt(e.target.value) || 0)} className="w-full p-2 text-center border rounded-lg text-[13px] outline-none focus:border-[#D4AF37]"/></div>
                                            <div className="col-span-2 text-right text-[13px] font-bold text-[#D4AF37]">{(item.quantity * item.price).toLocaleString()}</div>
                                            <div className="col-span-1 text-center"><button onClick={() => removePOItem(index)} className="text-red-400 hover:text-red-600 p-1.5 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"><Trash2 size={15}/></button></div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="pt-5 mt-4 border-t border-gray-100 flex items-center justify-between shrink-0">
                <div>
                    <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">Tổng Giá Trị Đơn Hàng</p>
                    <p className="text-[#D4AF37] text-[28px] font-black leading-none mt-1">{poTotalValue.toLocaleString()} ₫</p>
                </div>
                <div className="flex gap-3">
                    <button type="button" onClick={() => setIsAddPOOpen(false)} className="px-6 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 text-[14px]">Hủy bỏ</button>
                    <button onClick={handleSavePO} disabled={isSubmittingPO || poItems.length === 0} className="px-8 py-3.5 rounded-xl font-bold text-white shadow-lg disabled:opacity-50 flex items-center gap-2 hover:-translate-y-0.5 transition-transform" style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}>{isSubmittingPO ? "Đang xử lý..." : "Lưu Đơn Hàng & Tạo Phiếu Kho"}</button>
                </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THÊM NHÀ CUNG CẤP */}
      {isAddSupplierOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-lg shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setIsAddSupplierOpen(false)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]">Thêm Nhà Cung Cấp Mới</h2>
            <div className="space-y-4">
              {/* Thông tin chung */}
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase">Tên Doanh Nghiệp / Đối Tác *</label>
                <input value={newSupplier.name} onChange={e => setNewSupplier({...newSupplier, name: e.target.value})} placeholder="Công ty TNHH..." className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#10b981]" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase">Số Điện Thoại</label>
                  <input maxLength={10} value={newSupplier.phone} onChange={e => setNewSupplier({...newSupplier, phone: e.target.value.replace(/\D/g, "")})} placeholder="Liên hệ..." className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#10b981]" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase">Email Liên Hệ</label>
                  <input type="email" value={newSupplier.email} onChange={e => setNewSupplier({...newSupplier, email: e.target.value})} placeholder="email@example.com" className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#10b981]" />
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[#9d6b7a] text-[12px] font-bold uppercase">Địa Chỉ</label>
                <input value={newSupplier.address} onChange={e => setNewSupplier({...newSupplier, address: e.target.value})} placeholder="Địa chỉ..." className="w-full p-3 rounded-xl border border-gray-200 bg-gray-50 text-[13px] outline-none focus:border-[#10b981]" />
              </div>

              <div className="h-px bg-gray-200 my-4"></div>

              {/* Thông tin chuyên biệt */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1.5 text-[#10b981] text-[12px] font-bold uppercase">Mã Số Thuế *</label>
                  <input value={newSupplier.taxCode} onChange={e => setNewSupplier({...newSupplier, taxCode: e.target.value})} placeholder="0312345678" className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-[13px] outline-none focus:border-[#10b981]" />
                </div>
                <div>
                  <label className="block mb-1.5 text-[#10b981] text-[12px] font-bold uppercase">Thanh toán</label>
                  <select value={newSupplier.paymentTerms} onChange={e => setNewSupplier({...newSupplier, paymentTerms: e.target.value})} className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-[13px] outline-none focus:border-[#10b981]">
                    <option value="Chuyển khoản / Tiền mặt">Chuyển khoản / Tiền mặt</option>
                    <option value="Công nợ 15 ngày">Công nợ 15 ngày</option>
                    <option value="Công nợ 30 ngày">Công nợ 30 ngày</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block mb-1.5 text-[#10b981] text-[12px] font-bold uppercase">Ghi chú thêm</label>
                <input value={newSupplier.note} onChange={e => setNewSupplier({...newSupplier, note: e.target.value})} placeholder="Ghi chú nội bộ..." className="w-full p-3 rounded-xl border border-emerald-100 bg-emerald-50/50 text-[13px] outline-none focus:border-[#10b981]" />
              </div>

              <div className="flex gap-3 mt-6 pt-2">
                <button type="button" onClick={() => setIsAddSupplierOpen(false)} className="flex-1 py-3 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 text-[14px]">Hủy</button>
                <button onClick={handleSaveSupplier} disabled={isSubmittingSupplier} className="flex-[2] py-3 rounded-xl font-bold text-white shadow-lg disabled:opacity-50" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>{isSubmittingSupplier ? "Đang xử lý..." : "Lưu Thông Tin"}</button>
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