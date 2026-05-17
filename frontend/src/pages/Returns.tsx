// File: src/pages/Returns.tsx
import { useState, useEffect } from "react"; 
import { useLanguage } from "../context/LanguageContext";
import { useAuth } from "../context/AuthContext";   
import { 
  Search, CheckCircle2, XCircle, Clock, 
  ShieldCheck, Receipt, ArrowRight, ArrowLeft,
  AlertCircle, Minus, Plus, Sparkles, X,
  Wallet, CreditCard, Coins, Calendar, User, Phone, Check, RefreshCw
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const glassCard = { 
  background: "rgba(255,255,255,0.72)", 
  backdropFilter: "blur(20px)", 
  WebkitBackdropFilter: "blur(20px)",
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

// Mock recent invoices as a robust fallback
const recentInvoicesMock = [
  { id: "INV-10025", customer: "Trần Thị Lan", phone: "0901234567", date: "Today, 10:15 AM", total: 1250000, itemsCount: 3 },
  { id: "INV-10024", customer: "Nguyễn Văn Hùng", phone: "0987654321", date: "Today, 08:30 AM", total: 780000, itemsCount: 2 },
  { id: "INV-10023", customer: "Phạm Minh Tuấn", phone: "0912345678", date: "Yesterday, 04:45 PM", total: 2450000, itemsCount: 5 },
  { id: "INV-10022", customer: "Lê Hoàng Yến", phone: "0934567890", date: "Yesterday, 11:20 AM", total: 1100000, itemsCount: 1 }
];

// Mock products for the mock invoices
const mockInvoiceProducts: Record<string, any[]> = {
  "INV-10025": [
    { id: 101, name: "Kem dưỡng ẩm chuyên sâu Lumière Hydra-Cream", price: 450000, qty: 2, img: "/img/hydra.png", sku: "LM-HYD-01" },
    { id: 102, name: "Serum phục hồi tế bào Lumière Peptide Youth", price: 800000, qty: 1, img: "/img/peptide.png", sku: "LM-PEP-02" }
  ],
  "INV-10024": [
    { id: 103, name: "Son kem nhung mịn Lumière Velvet Matte Red", price: 390000, qty: 2, img: "/img/lipstick.png", sku: "LM-LIP-03" }
  ],
  "INV-10023": [
    { id: 104, name: "Nước tẩy trang dịu nhẹ Lumière Micellar Cleanse", price: 290000, qty: 3, img: "/img/micellar.png", sku: "LM-MIC-04" },
    { id: 105, name: "Mặt nạ đất sét thanh lọc Lumière Pure Clay Mask", price: 350000, qty: 2, img: "/img/clay.png", sku: "LM-CLY-05" }
  ],
  "INV-10022": [
    { id: 106, name: "Kem chống nắng phổ rộng Lumière Shield SPF50+", price: 1100000, qty: 1, img: "/img/shield.png", sku: "LM-SHD-06" }
  ]
};

export function Returns() {
  const { t, language } = useLanguage();
  const { user } = useAuth();
  const canApprove = user?.role === "manager" || user?.role === "admin";

  const [activeTab, setActiveTab] = useState<"pos" | "manager">("pos");
  const [searchQuery, setSearchQuery] = useState("");
  const [reason, setReason] = useState("");
  
  // Recent invoices state from Database
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [isRecentLoading, setIsRecentLoading] = useState(false);

  // Step workflow state: 1 = Lookup & History, 2 = Select Products
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [selectedRefundMethod, setSelectedRefundMethod] = useState<"cash" | "bank" | "points">("cash");

  const [invoiceData, setInvoiceData] = useState<any | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const showToast = (message: string, type: "success" | "error") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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

  // Fetch real invoices from backend
  const fetchRecentInvoices = async () => {
    setIsRecentLoading(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/returns/invoices/recent`);
      const json = await response.json();
      if (json.status === 'success' && json.data.length > 0) {
        setRecentInvoices(json.data);
      } else {
        // Fallback to mock if empty
        setRecentInvoices(recentInvoicesMock);
      }
    } catch (error) {
      console.error("Failed to fetch recent invoices, falling back to mock:", error);
      setRecentInvoices(recentInvoicesMock);
    } finally {
      setIsRecentLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === "pos") {
      fetchRecentInvoices();
    } else if (activeTab === "manager") {
      fetchRecentRequests();
    }
  }, [activeTab]);

  // Handle click on recent invoice card
  const handleSelectInvoice = async (inv: any) => {
    // If it's a mock invoice, use local mock items
    if (inv.id.startsWith("INV-1002")) {
      const mockItems = mockInvoiceProducts[inv.id] || [];
      const processedItems = mockItems.map(item => ({ ...item, returnQty: 0, restock: true }));
      setInvoiceData({
        id: inv.id,
        customer: inv.customer,
        phone: inv.phone,
        date: inv.date,
        items: processedItems
      });
      setCurrentStep(2);
      setReason("");
      return;
    }

    // Otherwise, fetch real products from backend database
    setIsSearching(true);
    try {
      const cleanedId = inv.id.replace(/\D/g, '');
      const response = await fetch(`${BACKEND_URL}/api/returns/invoice/${cleanedId}`);
      const json = await response.json();
      if (json.status === 'success') {
        const processedItems = json.data.items.map((item: any) => ({ ...item, returnQty: 0, restock: true }));
        setInvoiceData({ 
          id: inv.id,
          customer: json.data.customer, 
          phone: inv.phone || "N/A",
          date: json.data.date, 
          items: processedItems 
        });
        setCurrentStep(2);
        setReason("");
      } else {
        showToast(json.message || t('ret.err_not_found'), "error");
      }
    } catch (error) {
      showToast(t('ret.err_connection'), "error");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    // First check if search query matches any mock or currently preloaded invoices (by ID, Phone, or Name)
    const matched = recentInvoices.find(inv => 
      inv.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      inv.phone.includes(searchQuery) ||
      inv.customer.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (matched) {
      handleSelectInvoice(matched);
      return;
    }

    setIsSearching(true);
    setInvoiceData(null); 
    try {
      const cleanedQuery = searchQuery.replace(/\D/g, '') || searchQuery;
      const response = await fetch(`${BACKEND_URL}/api/returns/invoice/${cleanedQuery}`);
      const json = await response.json();
      
      if (json.status === 'success') {
        const processedItems = json.data.items.map((item: any) => ({ ...item, returnQty: 0, restock: true }));
        setInvoiceData({ 
          id: `INV-${cleanedQuery}`,
          customer: json.data.customer, 
          phone: "Database Client",
          date: json.data.date, 
          items: processedItems 
        });
        setCurrentStep(2);
        setReason("");
        setToast(null);
      } else {
        showToast(json.message || t('ret.err_not_found'), "error");
      }
    } catch (error) {
      showToast(t('ret.err_connection'), "error");
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
    if (itemsToReturn.length === 0) return showToast(t('ret.err_select_product'), "error");

    setIsSubmitting(true);
    const totalRefund = itemsToReturn.reduce((sum: number, i: any) => sum + (i.price * i.returnQty), 0);

    // Giả lập thành công cho Hóa đơn Demo tránh lỗi khóa ngoại Oracle (do mã 1002x không có sẵn trong DB thực tế)
    if (invoiceData.id.startsWith("INV-1002")) {
      setTimeout(() => {
        showToast(language === 'vi' ? "Gửi yêu cầu trả hàng thành công (Demo)!" : "Return request submitted successfully (Demo)!", "success");
        setInvoiceData(null); 
        setSearchQuery(""); 
        setReason("");
        setCurrentStep(1);
        setIsSubmitting(false);
      }, 600);
      return;
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/returns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          invoiceId: invoiceData.id, 
          items: itemsToReturn, 
          totalRefund, 
          reason: `${reason} [Method: ${selectedRefundMethod.toUpperCase()}]`
        })
      });
      const json = await response.json();
      if (json.status === 'success') {
        showToast(t('ret.success_submit'), "success");
        setInvoiceData(null); 
        setSearchQuery(""); 
        setReason("");
        setCurrentStep(1);
      } else showToast((language === 'vi' ? "Lỗi: " : "Error: ") + json.message, "error");
    } catch (error) { 
      showToast(t('ret.err_connection'), "error"); 
    } finally { setIsSubmitting(false); }
  };

  const handleManagerAction = async (id: string, action: "approve" | "reject") => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/returns/${id}/${action}`, { method: 'PUT' });
      const json = await response.json();
      if (json.status === 'success') {
        showToast(action === "approve" ? t('ret.success_approve') : t('ret.success_reject'), "success");
        fetchRecentRequests();
      } else {
        showToast(json.message, "error");
      }
    } catch (error) {
      showToast(language === 'vi' ? "Lỗi kết nối khi xử lý!" : "Connection error during processing!", "error");
    }
  };

  // Derived states
  const currentTotalRefund = invoiceData?.items.reduce((sum: number, i: any) => sum + (i.price * i.returnQty), 0) || 0;
  const itemsInCart = invoiceData?.items.filter((i: any) => i.returnQty > 0) || [];

  return (
    <div className="p-8 min-h-screen relative">
      {/* Dynamic Background Accents */}
      <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#D4AF37]/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-15%] w-[600px] h-[600px] rounded-full bg-purple-500/5 blur-[150px] pointer-events-none" />

      {/* Header Bar */}
      <div className="flex justify-between items-end mb-8 relative z-10">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" className="animate-pulse" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {currentTime.toLocaleTimeString(language === 'vi' ? 'vi-VN' : 'en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} • {currentTime.toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-black tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {t('ret.title')}
          </h1>
        </div>

        {/* Tabs switcher */}
        <div className="flex gap-1 p-1 bg-white/60 backdrop-blur-md rounded-2xl border border-white shadow-sm shrink-0">
          <button 
            onClick={() => setActiveTab("pos")}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all active:scale-95 shrink-0"
            style={{
              background: activeTab === "pos" ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent",
              color: activeTab === "pos" ? "white" : "#6b4153",
              boxShadow: activeTab === "pos" ? "0 8px 24px rgba(212,175,55,0.25)" : "none"
            }}
          >
            <Receipt size={16} /> 
            {language === 'vi' ? 'Tạo phiếu trả POS' : 'POS Returns'}
          </button>
          {canApprove && (
            <button 
              onClick={() => setActiveTab("manager")}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-black text-[12px] uppercase tracking-wider transition-all active:scale-95 shrink-0"
              style={{
                background: activeTab === "manager" ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent",
                color: activeTab === "manager" ? "white" : "#6b4153",
                boxShadow: activeTab === "manager" ? "0 8px 24px rgba(212,175,55,0.25)" : "none"
              }}
            >
              <ShieldCheck size={16} /> 
              {language === 'vi' ? 'Duyệt yêu cầu' : 'Approve requests'}
              {requests.filter(r => r.status === "Chờ duyệt").length > 0 && (
                <span className="ml-1 bg-white text-[#D4AF37] text-[10px] px-1.5 py-0.5 rounded-full font-black animate-pulse">
                  {requests.filter(r => r.status === "Chờ duyệt").length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-10 gap-8 relative z-10">
        {activeTab === "pos" ? (
          <>
            {/* PANEL TRÁI (70%) - Cả Step 1 & Step 2 */}
            <div className="col-span-1 lg:col-span-7 space-y-6">
              
              {/* STEP 1: Lookup & Recent History list */}
              {currentStep === 1 ? (
                <div className="space-y-6 animate-in fade-in duration-300">
                  
                  {/* Search Bar Block */}
                  <div style={glassCard} className="p-6">
                    <h2 className="text-[#3d1a2e] text-[16px] font-black uppercase tracking-wider mb-4 flex items-center gap-2">
                      <Search size={18} color="#D4AF37"/> 
                      {t('ret.lookup_invoice')}
                    </h2>
                    <div className="flex gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          value={searchQuery} 
                          onChange={e => setSearchQuery(e.target.value)}
                          onKeyDown={e => e.key === "Enter" && handleSearch()}
                          placeholder={language === 'vi' ? "Nhập mã hóa đơn, SĐT hoặc Tên khách hàng..." : "Enter invoice ID, Phone number, or Name..."}
                          className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 outline-none focus:ring-2 focus:ring-[#D4AF37]/20 bg-white text-[14px] shadow-sm transition-all" 
                        />
                      </div>
                      <button 
                        onClick={handleSearch} 
                        disabled={isSearching} 
                        className="px-8 py-4 rounded-2xl bg-[#3d1a2e] text-white font-bold text-[14px] transition-all hover:scale-105 shadow-lg active:scale-95 disabled:bg-gray-300 disabled:scale-100 flex items-center gap-2"
                      >
                        {isSearching ? <RefreshCw className="animate-spin" size={16} /> : null}
                        {isSearching ? t('ret.searching') : t('ret.check_btn')}
                      </button>
                    </div>
                  </div>

                  {/* Recent Invoices Email-like Inbox List */}
                  <div style={glassCard} className="p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-[#3d1a2e] font-black text-[14px] uppercase tracking-wider flex items-center gap-2">
                        <Clock size={16} className="text-gray-400" />
                        {language === 'vi' ? 'Hóa đơn mua hàng gần đây' : 'Recent Purchase Invoices'}
                      </h3>
                    </div>

                    {isRecentLoading ? (
                      <div className="py-12 flex flex-col items-center justify-center gap-3 text-[#9d6b7a]">
                        <RefreshCw className="animate-spin text-[#D4AF37]" size={24} />
                        <span className="text-[12px] font-bold">{language === 'vi' ? 'Đang tải hóa đơn...' : 'Loading invoices...'}</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {recentInvoices.map((inv) => {
                           const isFully = inv.isFullyReturned === 1;
                           return (
                             <div 
                               key={inv.id}
                               onClick={() => handleSelectInvoice(inv)}
                               className={`p-4 rounded-2xl border transition-all flex items-center justify-between group cursor-pointer ${
                                 isFully 
                                   ? "bg-gray-100/50 border-dashed border-gray-200/80 opacity-75 hover:bg-gray-100" 
                                   : "bg-white/60 border-gray-100 hover:bg-white hover:border-[#D4AF37]/40 hover:translate-y-[-2px] shadow-sm"
                               }`}
                             >
                               <div className="flex items-center gap-4">
                                 <div className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-transform ${
                                   isFully 
                                     ? "bg-gray-200/50 border-gray-300/30 text-gray-400" 
                                     : "bg-[#D4AF37]/10 border-[#D4AF37]/20 text-[#D4AF37] group-hover:scale-110"
                                 }`}>
                                   <Receipt size={18} />
                                 </div>
                                 <div>
                                   <div className="flex items-center gap-2">
                                     <span className={`font-black text-[14px] ${isFully ? 'text-gray-500 line-through' : 'text-[#3d1a2e]'}`}>{inv.id}</span>
                                     {isFully && (
                                       <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[9px] font-black bg-gray-200 text-gray-500 border border-gray-300/30 uppercase tracking-wide">
                                         {language === 'vi' ? 'Đã trả hết' : 'Fully Returned'}
                                       </span>
                                     )}
                                     <span className="text-[11px] font-medium text-gray-400">{inv.date}</span>
                                   </div>
                                   <div className="flex items-center gap-2 mt-1 text-[12px] text-[#9d6b7a]">
                                     <span className="flex items-center gap-0.5"><User size={12} /> {inv.customer}</span>
                                     <span className="w-1 h-1 rounded-full bg-gray-300" />
                                     <span className="flex items-center gap-0.5"><Phone size={12} /> {inv.phone}</span>
                                   </div>
                                 </div>
                               </div>
                               
                               <div className="text-right flex items-center gap-4">
                                 <div>
                                   <p className="text-[11px] font-bold text-[#9d6b7a] uppercase">{language === 'vi' ? 'Tổng tiền' : 'Total'}</p>
                                   <p className={`font-extrabold text-[14px] mt-0.5 ${isFully ? 'text-gray-500' : 'text-[#3d1a2e]'}`}>{inv.total.toLocaleString()} ₫</p>
                                 </div>
                                 <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-[#D4AF37]/10 transition-colors">
                                   <ArrowRight size={14} className="text-gray-400 group-hover:text-[#D4AF37] transition-colors" />
                                 </div>
                               </div>
                             </div>
                           );
                         })}
                      </div>
                    )}
                  </div>

                </div>
              ) : (
                
                /* STEP 2: Selected Invoice Items Page */
                <div style={glassCard} className="p-6 animate-in slide-in-from-left-5 duration-300">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => setCurrentStep(1)} 
                        className="w-10 h-10 rounded-xl bg-white hover:bg-[#D4AF37]/10 border border-gray-100 flex items-center justify-center transition-colors active:scale-95 group"
                      >
                        <ArrowLeft size={16} className="text-gray-500 group-hover:text-[#D4AF37]" />
                      </button>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-black text-[18px] text-[#3d1a2e]">{invoiceData.id}</span>
                          <span className="inline-block px-2.5 py-0.5 rounded text-[11px] font-bold bg-green-50 border border-green-200 text-green-700">
                            {language === 'vi' ? 'Đã Thanh Toán' : 'Paid'}
                          </span>
                        </div>
                        <p className="text-[#9d6b7a] text-[12px] mt-0.5">
                          {language === 'vi' ? 'Khách hàng' : 'Customer'}: <strong>{invoiceData.customer}</strong> • {invoiceData.date}
                        </p>
                      </div>
                    </div>

                    <button 
                      onClick={() => setCurrentStep(1)}
                      className="text-[12px] font-bold text-[#D4AF37] bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 px-3 py-1.5 rounded-xl transition-colors"
                    >
                      {language === 'vi' ? 'Chọn hóa đơn khác' : 'Select another invoice'}
                    </button>
                  </div>

                  {/* Products Grid */}
                  <div className="space-y-4">
                    <div className="grid grid-cols-12 gap-4 px-4 text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-2">
                      <div className="col-span-6">{t('ret.product')}</div>
                      <div className="col-span-4 text-center">{t('ret.qty_ratio')}</div>
                      <div className="col-span-2 text-right">{t('ret.restock')}</div>
                    </div>

                    {invoiceData.items.map((i: any) => (
                      <div 
                        key={i.id} 
                        className={`flex items-center grid grid-cols-12 gap-4 p-4 rounded-2xl border transition-all ${
                          i.returnQty > 0 
                            ? "bg-[#D4AF37]/5 border-[#D4AF37]/30" 
                            : "bg-white/60 border-gray-100 hover:border-gray-200"
                        }`}
                      >
                        {/* Column 1: Info */}
                        <div className="col-span-6 flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-gray-100 bg-white">
                            <ImageWithFallback src={getImageUrl(i.img)} alt={i.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-extrabold text-[#3d1a2e] text-[13px] line-clamp-2 leading-tight truncate-two-lines">
                              {i.name}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-[11px] text-[#9d6b7a]">
                              <span className="font-mono text-gray-400">{i.sku}</span>
                              <span className="w-1 h-1 rounded-full bg-gray-300" />
                              <span className="font-bold text-[#D4AF37]">{i.price.toLocaleString()} ₫</span>
                            </div>
                          </div>
                        </div>

                        {/* Column 2: Adjust Qty */}
                        <div className="col-span-4 flex justify-center items-center">
                          <div className="flex items-center gap-2.5 bg-white rounded-xl p-1 border border-gray-100 shadow-sm">
                            <button 
                              onClick={() => updateReturnQty(i.id, -1)} 
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                            >
                              <Minus size={12} />
                            </button>
                            <span className="w-6 text-center font-black text-[13px] text-[#3d1a2e]">
                              {i.returnQty}
                            </span>
                            <button 
                              onClick={() => updateReturnQty(i.id, 1)} 
                              className="w-7 h-7 flex items-center justify-center rounded-lg bg-gray-50 text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            >
                              <Plus size={12} />
                            </button>
                          </div>
                          <span className="ml-2 text-[#9d6b7a] text-[11px] font-bold">
                            / {i.qty}
                          </span>
                        </div>

                        {/* Column 3: Restock */}
                        <div className="col-span-2 flex justify-end items-center">
                          <button
                            onClick={() => toggleRestock(i.id)}
                            disabled={i.returnQty === 0}
                            className={`w-11 h-6 rounded-full p-1 transition-all duration-300 relative ${
                              i.returnQty === 0 
                                ? "bg-gray-100 opacity-50 cursor-not-allowed" 
                                : i.restock 
                                  ? "bg-emerald-500" 
                                  : "bg-red-400"
                            }`}
                            title={i.restock ? (language === 'vi' ? 'Sẽ trả về tồn kho' : 'Will restock') : (language === 'vi' ? 'Tiêu hủy / Lỗi' : 'Scrapped / Damaged')}
                          >
                            <div 
                              className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform duration-300 ${
                                i.restock ? "translate-x-5" : "translate-x-0"
                              }`} 
                            />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>
              )}
            </div>

            {/* PANEL PHẢI (30%) - STEP 3: GIỎ HÀNG ĐỔI / TRẢ (Reverse Cart) */}
            <div className="col-span-1 lg:col-span-3">
              <div 
                style={{ ...glassCard, borderTop: "4px solid #D4AF37" }} 
                className="p-6 sticky top-8 flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-[#3d1a2e] text-[16px] font-black uppercase tracking-wider mb-4 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <Receipt size={18} className="text-[#D4AF37]" />
                    {language === 'vi' ? 'Giỏ hàng đổi trả' : 'Returns Cart'}
                  </h2>

                  {/* List of items selected for refund */}
                  {itemsInCart.length === 0 ? (
                    <div className="text-center py-12 px-4 bg-white/40 border border-dashed border-gray-200 rounded-2xl my-4 animate-in zoom-in-95">
                      <div className="w-12 h-12 rounded-full bg-[#D4AF37]/10 flex items-center justify-center mx-auto mb-3">
                        <XCircle className="text-[#D4AF37]" size={20} />
                      </div>
                      <p className="text-[#9d6b7a] text-[12px] font-bold">
                        {language === 'vi' ? 'Chưa chọn món trả' : 'No items selected'}
                      </p>
                      <p className="text-gray-400 text-[10.5px] mt-1 leading-normal">
                        {language === 'vi' ? 'Bấm nút +/- ở panel bên trái để thêm sản phẩm vào giỏ trả.' : 'Click +/- on the left panel items to select refund items.'}
                      </p>
                    </div>
                  ) : (
                    <div className="my-4 max-h-[220px] overflow-y-auto space-y-2 pr-1">
                      {itemsInCart.map((i: any) => (
                        <div key={i.id} className="p-3 bg-white border border-gray-100 rounded-xl flex items-center justify-between shadow-sm">
                          <div className="min-w-0 flex-1 pr-2">
                            <p className="font-bold text-[12px] text-[#3d1a2e] truncate">{i.name}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">
                              {language === 'vi' ? 'Số lượng' : 'Qty'}: <strong className="text-[#D4AF37]">{i.returnQty}</strong> • {i.price.toLocaleString()}đ
                            </p>
                          </div>
                          <span className="text-[12px] font-extrabold text-[#3d1a2e] shrink-0">
                            -{(i.price * i.returnQty).toLocaleString()}đ
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Refund Method Grid Select */}
                  <div className="mt-6 border-t border-gray-100 pt-4">
                    <label className="block text-[11px] font-black uppercase text-[#9d6b7a] mb-2.5">
                      {language === 'vi' ? 'Phương thức hoàn tiền' : 'Refund Method'}
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => setSelectedRefundMethod("cash")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          selectedRefundMethod === "cash" 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]" 
                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Wallet size={16} />
                        <span className="text-[9.5px] font-black uppercase tracking-wider">{language === 'vi' ? 'Tiền mặt' : 'Cash'}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedRefundMethod("bank")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          selectedRefundMethod === "bank" 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]" 
                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <CreditCard size={16} />
                        <span className="text-[9.5px] font-black uppercase tracking-wider">{language === 'vi' ? 'Chuyển khoản' : 'Transfer'}</span>
                      </button>
                      <button 
                        type="button"
                        onClick={() => setSelectedRefundMethod("points")}
                        className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition-all ${
                          selectedRefundMethod === "points" 
                            ? "bg-[#D4AF37]/10 border-[#D4AF37]/40 text-[#D4AF37]" 
                            : "bg-white border-gray-100 text-gray-500 hover:bg-gray-50"
                        }`}
                      >
                        <Coins size={16} />
                        <span className="text-[9.5px] font-black uppercase tracking-wider">{language === 'vi' ? 'Tích điểm' : 'Credit'}</span>
                      </button>
                    </div>
                  </div>

                  {/* Notes / Reasons Form */}
                  <div className="mt-5">
                    <label className="block mb-2 text-[#9d6b7a] text-[11px] font-black uppercase">
                      {t('ret.note_to_manager')}
                    </label>
                    <textarea 
                      value={reason} 
                      onChange={e => setReason(e.target.value)}
                      placeholder={t('ret.note_placeholder')}
                      rows={2}
                      className="w-full p-3 rounded-xl border border-gray-100 outline-none bg-white text-[13px] focus:ring-2 focus:ring-[#D4AF37]/20 shadow-sm transition-all"
                    />
                  </div>
                </div>

                {/* Refund Totals Section */}
                <div className="mt-6 border-t border-gray-100 pt-4 space-y-4">
                  <div className="flex justify-between items-center p-3 rounded-xl bg-[#D4AF37]/5 border border-[#D4AF37]/20">
                    <div>
                      <p className="text-[#9d6b7a] text-[10px] font-black uppercase tracking-wider">{t('ret.total_refund')}</p>
                      <p className="text-gray-400 text-[9px]">{language === 'vi' ? 'Tự động tính thuế & chiết khấu' : 'Tax & discount included'}</p>
                    </div>
                    <span className="text-[#D4AF37] text-[20px] font-black tracking-tight">
                      {currentTotalRefund.toLocaleString()} ₫
                    </span>
                  </div>

                  <button 
                    onClick={submitRequest} 
                    disabled={isSubmitting || currentTotalRefund === 0}
                    className="w-full py-4 rounded-xl text-white font-black text-[13px] uppercase tracking-wider flex items-center justify-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#be9b2f] active:scale-[0.98] shadow-lg shadow-[#D4AF37]/10"
                    style={{ 
                      background: currentTotalRefund > 0 ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "#ccc"
                    }}
                  >
                    {isSubmitting ? t('ret.searching') : (language === 'vi' ? 'Duyệt yêu cầu hoàn tiền' : 'Request Refund')}
                    <Check size={16} />
                  </button>
                </div>
              </div>
            </div>
          </>
        ) : (
          /* Tab MANAGER - Duyệt các đơn đổi trả */
          canApprove && (
            <div className="col-span-1 lg:col-span-10 space-y-4 animate-in fade-in duration-300">
              {requests.length === 0 ? (
                <div className="text-center py-20 text-[#9d6b7a] italic bg-white/40 border border-dashed border-gray-200 rounded-2xl shadow-sm">
                  {t('ret.no_requests')}
                </div>
              ) : (
                requests.map(req => {
                  let statusUI = { bg: "bg-gray-100", text: "text-gray-800", border: "#ccc", icon: Clock, label: req.status };
                  
                  if (req.status === "Chờ duyệt") {
                    statusUI = { bg: "bg-amber-50 text-amber-700 border-amber-200", text: "text-amber-800", border: "#fbbf24", icon: Clock, label: t('ret.pending_msg') };
                  } else if (req.status === "Đã hoàn tất" || req.status === "Đã duyệt") {
                    statusUI = { bg: "bg-emerald-50 text-emerald-700 border-emerald-200", text: "text-green-800", border: "#22c55e", icon: CheckCircle2, label: t('ret.completed_msg') };
                  } else if (req.status === "Từ chối") {
                    statusUI = { bg: "bg-rose-50 text-[#D4AF37] border-rose-200", text: "text-red-800", border: "#ef4444", icon: XCircle, label: t('ret.rejected_msg') };
                  }

                  return (
                    <div 
                      key={req.id} 
                      className="p-5 flex items-center justify-between transition-all hover:translate-y-[-2px] border-l-4 shadow-sm" 
                      style={{ ...glassCard, borderLeftColor: statusUI.border }}
                    >
                      <div className="flex-1 min-w-0 pr-4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <span className="font-extrabold text-[15px] text-[#3d1a2e]">{req.id}</span>
                          <span className="text-[12px] font-medium text-gray-400 flex items-center gap-1">
                            <Calendar size={12} /> {req.date}
                          </span>
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider flex items-center gap-1.5 border ${statusUI.bg}`}>
                            <statusUI.icon size={11} /> {statusUI.label}
                          </span>
                        </div>
                        <p className="text-[#3d1a2e] text-[13.5px]">
                          {t('ret.customer')}: <strong>{req.customer}</strong> ({language === 'vi' ? 'Hóa đơn gốc' : 'Original Invoice'}: <strong className="text-[#D4AF37]">{req.invoice}</strong>)
                        </p>
                        <p className="mt-1 text-[#6b4153] text-[12.5px]">
                          {language === 'vi' ? 'Số lượng trả' : 'Return qty'}: <strong>{req.items}</strong> {language === 'vi' ? 'sản phẩm' : 'items'}. 
                          <span className="ml-2 font-semibold text-gray-400">|</span> 
                          <span className="ml-2">{t('ret.reason_lbl')}: <i>{req.reason || t('ret.no_reason')}</i></span>
                        </p>
                      </div>

                      <div className="text-right ml-8 shrink-0">
                        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase mb-1">{t('ret.amount_to_refund')}</p>
                        <p className="text-[#D4AF37] text-[20px] font-black mb-3">
                          {req.status === "Từ chối" ? "0 ₫" : `-${req.refund.toLocaleString()} ₫`}
                        </p>
                        
                        {req.status === "Chờ duyệt" && (
                          <div className="flex gap-2 justify-end">
                            <button 
                              onClick={() => handleManagerAction(req.id, "reject")} 
                              className="px-4 py-2 rounded-xl bg-rose-50 text-[#D4AF37] border border-[#D4AF37]/20 font-black text-[11px] hover:bg-[#D4AF37]/10 transition-colors uppercase tracking-wider"
                            >
                              {t('ret.reject_btn')}
                            </button>
                            <button 
                              onClick={() => handleManagerAction(req.id, "approve")} 
                              className="px-5 py-2 rounded-xl bg-[#e11d48] text-white font-black text-[11px] flex items-center gap-1.5 hover:bg-rose-700 shadow-md shadow-[#D4AF37]/20 uppercase tracking-wider transition-colors"
                              style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
                            >
                              <CheckCircle2 size={13}/> {t('ret.complete_btn')}
                            </button>
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

      {/* TOAST NOTIFICATION (Gold Accent) */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === "success" ? "bg-emerald-500/20" : "bg-[#D4AF37]/20"
            }`}>
              {toast.type === "error" ? <AlertCircle className="text-rose-400" size={20} /> : <Sparkles className="text-[#D4AF37]" size={20} />}
            </div>
            <div>
              <p className="font-bold text-[15px]">{toast.type === "success" ? (language === 'vi' ? "Thành công" : "Success") : (language === 'vi' ? "Lỗi hệ thống" : "System Error")}</p>
              <p className="text-white/80 text-[13px] mt-0.5">{toast.message}</p>
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