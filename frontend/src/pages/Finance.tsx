import React, { useState, useEffect } from "react";
import { 
  ArrowUpRight, ArrowDownRight, Loader2, Info, XCircle, X,
  BarChart3, PieChart, Landmark, ShoppingCart, Users2, Clock, Sparkles, Download,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, RotateCcw, LayoutDashboard, Receipt, CreditCard
} from "lucide-react";

// --- STYLES & CẤU HÌNH ---
const glassCard = { 
  background: "rgba(255,255,255,0.72)", 
  backdropFilter: "blur(20px)", 
  WebkitBackdropFilter: "blur(20px)", 
  border: "1px solid rgba(255,255,255,0.9)", 
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)", 
  borderRadius: "24px" 
};
const BACKEND_URL = "http://localhost:5000";

interface AccountBalance { id: number; name: string; type: string; balance: number; purpose: string; }
interface Transaction { id: string; desc: string; amount: number; date: string; accountName: string; }

const getAccountPriority = (name: string) => {
  const n = name.toLowerCase();
  if (n.includes("111")) return 100;
  if (n.includes("112")) return 90;
  if (n.includes("511")) return 80;
  if (n.includes("156")) return 70;
  return 10;
};

export function Finance() {
  const [activeTab, setActiveTab] = useState<"overview" | "payables">("overview");

  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [payables, setPayables] = useState<any[]>([]);
  const [isLoadingPayables, setIsLoadingPayables] = useState(true);

  // Modal Thanh Toán
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, id: number, supplier: string, amount: number, accountId: number} | null>(null);

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000); 
  };

  const [currentTime, setCurrentTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  const dateString = currentTime.toLocaleDateString("vi-VN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeString = currentTime.toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

  const fetchOverviewData = async () => {
    setIsLoadingOverview(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/finance`);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const json = await response.json();
      if (json.status === 'success') {
        const sortedAccounts = [...(json.data.accounts || [])].sort((a, b) => getAccountPriority(b.name) - getAccountPriority(a.name));
        setAccounts(sortedAccounts);
        setTransactions(json.data.transactions || []);
      }
    } catch (error: any) { 
      if (error.message.includes("Failed to fetch")) showToast("Không thể kết nối máy chủ. Vui lòng bật Backend!", "error");
      else showToast(`Lỗi tải dữ liệu Sổ cái`, "error"); 
    } 
    finally { setIsLoadingOverview(false); }
  };

  const fetchPayablesData = async () => {
    setIsLoadingPayables(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/finance/payables`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const json = await res.json();
      if (json.status === "success") {
        setPayables(json.data);
      } else {
        showToast(json.message || "Lỗi xử lý Data!", "error");
      }
    } catch (error: any) { 
      if (error.message.includes("Failed to fetch")) showToast("Không thể kết nối máy chủ. Vui lòng bật Backend!", "error");
      else showToast(`Lỗi tải dữ liệu công nợ`, "error"); 
    } 
    finally { setIsLoadingPayables(false); }
  };

  useEffect(() => {
    if (activeTab === "overview") fetchOverviewData();
    if (activeTab === "payables") fetchPayablesData();
  }, [activeTab]);

  // Kích hoạt Modal Thanh Toán
  const openPaymentModal = (id: number, supplier: string, amount: number) => {
    setPaymentModal({ isOpen: true, id, supplier, amount, accountId: 111 }); // Mặc định là Tiền mặt
  };

  // Xác nhận Thanh Toán Gửi API
  const confirmPayment = async () => {
    if (!paymentModal) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/finance/pay/${paymentModal.id}`, { 
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountId: paymentModal.accountId })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      
      if (json.status === 'success') {
        showToast("Đã lập phiếu chi & thanh toán thành công!", "success");
        setPaymentModal(null);
        fetchPayablesData(); 
        fetchOverviewData(); 
      } else showToast(json.message, "error");
    } catch (error: any) { 
      if (error.message.includes("Failed to fetch")) showToast("Không thể kết nối máy chủ. Vui lòng bật Backend!", "error");
      else showToast(`Lỗi thanh toán: ${error.message}`, "error"); 
    }
  };

  const totalAssets = accounts.filter(a => ['Tài sản', 'Tiền mặt', 'Ngân hàng'].includes(a.type)).reduce((s, a) => s + a.balance, 0);
  const totalLiabilities = accounts.filter(a => a.type === 'Nợ phải trả').reduce((s, a) => s + a.balance, 0);
  const totalRevenue = accounts.filter(a => a.type === 'Doanh thu').reduce((s, a) => s + a.balance, 0);

  const selectedAccountName = accounts.find(a => a.id === selectedAccountId)?.name;
  const filteredTransactions = selectedAccountName ? transactions.filter(t => t.accountName === selectedAccountName) : transactions;
  const displayedAccounts = isAccountsExpanded ? accounts : accounts.slice(0, 6);
  const displayedTransactions = isTransactionsExpanded ? filteredTransactions : filteredTransactions.slice(0, 6);

  const totalUnpaid = payables.filter(p => p.status === 'Chưa thanh toán').reduce((s, p) => s + p.amount, 0);
  const totalPaid = payables.filter(p => p.status === 'Đã thanh toán').reduce((s, p) => s + p.amount, 0);

  return (
    <div className="p-8 min-h-screen bg-[#fdfbf7] relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">{dateString} • {timeString}</p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Tài Chính & Kế Toán</h1>
        </div>
        
        <div className="flex gap-1 p-1 bg-white/50 rounded-2xl border border-white shadow-inner">
          <TabButton active={activeTab === "overview"} onClick={() => setActiveTab("overview")} icon={LayoutDashboard} label="Tổng Quan Sổ Cái" />
          <TabButton active={activeTab === "payables"} onClick={() => setActiveTab("payables")} icon={Receipt} label="Công Nợ & Chi Tiền" />
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        {/* ========================================================= */}
        {/* TỔNG QUAN SỔ CÁI */}
        {/* ========================================================= */}
        {activeTab === "overview" && (
          isLoadingOverview ? (
            <div className="flex flex-col items-center justify-center h-96">
              <Loader2 className="animate-spin mb-4" color="#D4AF37" size={40} />
              <p className="text-[#9d6b7a] font-medium tracking-wide">Đang hợp nhất sổ cái...</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <StatCard label="Tổng Tài Sản" value={totalAssets} icon={Landmark} color="#D4AF37" />
                <StatCard label="Nợ Phải Trả" value={totalLiabilities} icon={Users2} color="#f43f5e" />
                <StatCard label="Doanh Thu Tháng" value={totalRevenue} icon={BarChart3} color="#10b981" />
                <StatCard label="Giá Trị Kho Hàng" value={accounts.find(a => a.id === 156)?.balance || 0} icon={ShoppingCart} color="#3b82f6" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div style={glassCard} className="p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                        <PieChart size={20} color="#D4AF37" /> Hệ Thống Tài Khoản (Chart of Accounts)
                      </h2>
                      <button onClick={() => showToast("Chức năng tải file Excel Sổ cái đang được xây dựng!", "info")} className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all hover:bg-gray-50 border border-gray-200 text-[#3d1a2e]">
                        <Download size={14} /> <span className="font-bold text-[12px]">Xuất Excel</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedAccounts.map(acc => (
                        <div key={acc.id} onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)} className={`p-4 rounded-2xl border transition-all group cursor-pointer ${selectedAccountId === acc.id ? 'bg-white shadow-md border-[#D4AF37]' : 'bg-white/50 border-white hover:border-[#D4AF37]/30'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">{acc.id}</span>
                              <p className="font-bold text-[#3d1a2e] text-[14px] mt-1">{acc.name}</p>
                            </div>
                            <p className="font-black text-[#3d1a2e] text-[15px]">{acc.balance.toLocaleString()} ₫</p>
                          </div>
                          <p className="text-[11px] text-[#9d6b7a] line-clamp-1 italic group-hover:line-clamp-none transition-all">{acc.purpose}</p>
                        </div>
                      ))}
                    </div>

                    {accounts.length > 6 && (
                      <button onClick={() => setIsAccountsExpanded(!isAccountsExpanded)} className="w-full mt-5 py-2.5 flex items-center justify-center gap-2 rounded-xl transition-all hover:bg-[#D4AF37]/5 font-bold text-[13px] text-[#D4AF37] border border-dashed border-[#D4AF37]/40">
                        {isAccountsExpanded ? <><ChevronUp size={16}/> Thu gọn danh sách</> : <><ChevronDown size={16}/> Xem thêm {accounts.length - 6} tài khoản</>}
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-8 transition-all duration-500">
                    <div style={glassCard} className="p-6 flex flex-col max-h-[calc(100vh-6rem)]">
                      <div className="flex justify-between items-center mb-5 shrink-0">
                        <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                          <Clock size={20} color="#D4AF37" /> {selectedAccountName ? `Biến Động: ${selectedAccountName}` : 'Giao Dịch Gần Đây'}
                        </h2>
                        {selectedAccountId && (
                          <button onClick={() => setSelectedAccountId(null)} className="p-1.5 rounded-full bg-[#fdfbf7] border hover:bg-gray-100 transition-colors" title="Trở về toàn bộ">
                            <RotateCcw size={14} color="#3d1a2e" />
                          </button>
                        )}
                      </div>

                      <div className="space-y-4 flex-1 overflow-y-auto pr-2" style={{ scrollbarWidth: 'thin' }}>
                        {displayedTransactions.length > 0 ? displayedTransactions.map(tx => (
                          <div key={tx.id} className="flex gap-3 items-start pb-4 border-b border-gray-100 last:border-0">
                            <div className={`mt-1 p-2 rounded-lg shrink-0 ${tx.amount > 0 ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                              {tx.amount > 0 ? <ArrowUpRight size={14}/> : <ArrowDownRight size={14}/>}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-bold text-[#3d1a2e] truncate">{tx.desc}</p>
                              <p className="text-[11px] text-[#9d6b7a]">{tx.date} • {tx.accountName}</p>
                            </div>
                            <p className={`text-[13px] font-bold shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        )) : (
                          <div className="text-center py-8"><p className="text-[12px] text-[#9d6b7a] italic">Không có dữ liệu giao dịch.</p></div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )
        )}

        {/* ========================================================= */}
        {/* DANH SÁCH CÔNG NỢ */}
        {/* ========================================================= */}
        {activeTab === "payables" && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="grid grid-cols-2 gap-5 mb-8">
              <div style={glassCard} className="p-5 flex items-center justify-between border-l-4 border-l-amber-400">
                <div>
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">Tổng nợ chưa trả (Phải trả NCC)</p>
                  <p className="text-amber-600 text-[24px] font-black mt-1">{totalUnpaid.toLocaleString()} ₫</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center"><AlertCircle color="#d97706"/></div>
              </div>
              <div style={glassCard} className="p-5 flex items-center justify-between border-l-4 border-l-emerald-400">
                <div>
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">Đã chi trả (Lịch sử)</p>
                  <p className="text-emerald-600 text-[24px] font-black mt-1">{totalPaid.toLocaleString()} ₫</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 color="#10b981"/></div>
              </div>
            </div>

            <div style={glassCard} className="p-6">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-6">Chứng Từ Mua Hàng & Thanh Toán</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 text-[#9d6b7a] text-[11px] uppercase tracking-wider bg-[#D4AF37]/5">
                    <th className="py-3 px-3 rounded-tl-xl">Mã Hóa Đơn</th>
                    <th className="px-3">Đối Tác (Nhà Cung Cấp)</th>
                    <th className="px-3">Ngày Lập</th>
                    <th className="px-3 text-right">Tổng Tiền Cần Chi</th>
                    <th className="px-3 text-center">Trạng Thái</th>
                    <th className="px-3 text-center rounded-tr-xl">Nghiệp Vụ</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayables ? (
                    <tr><td colSpan={6} className="py-10 text-center text-[#9d6b7a]">Đang tải dữ liệu công nợ...</td></tr>
                  ) : payables.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-[#9d6b7a]">Không có hóa đơn nào cần xử lý.</td></tr>
                  ) : (
                    payables.map((row) => (
                      <tr key={row.id} className="border-b border-[rgba(212,175,55,0.07)] hover:bg-white transition-colors">
                        <td className="py-3 px-3"><p className="font-bold text-[#D4AF37] text-[13px]">{row.code}</p></td>
                        <td className="px-3 font-bold text-[#3d1a2e] text-[13px]">{row.supplier}</td>
                        <td className="px-3 text-[#6b4153] text-[13px]">{row.date}</td>
                        <td className="px-3 font-black text-[#b91c1c] text-[14px] text-right">{row.amount.toLocaleString()} ₫</td>
                        <td className="px-3 text-center">
                          {row.status === 'Chưa thanh toán' ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><Clock size={12}/> Chưa chi</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 size={12}/> Đã chi</span>
                          )}
                        </td>
                        <td className="px-3 text-center">
                          {row.status === 'Chưa thanh toán' ? (
                            <button onClick={() => openPaymentModal(row.id, row.supplier, row.amount)} className="px-3 py-1.5 bg-[#3d1a2e] hover:bg-[#2a111f] text-white rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1.5 shadow-md">
                              <CreditCard size={14}/> Lập Phiếu Chi
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[12px] italic">Hoàn tất</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================= */}
      {/* MODAL CHỌN PHƯƠNG THỨC THANH TOÁN (MỚI) */}
      {/* ========================================================= */}
      {paymentModal && paymentModal.isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl relative animate-in zoom-in-95">
            <button onClick={() => setPaymentModal(null)} className="absolute top-6 right-6 text-gray-400 hover:text-gray-600"><X size={20} /></button>
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]">Xác nhận thanh toán</h2>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              <p className="text-[11px] text-[#9d6b7a] font-bold uppercase mb-1">Chi trả cho NCC</p>
              <p className="text-[16px] font-bold text-[#3d1a2e] mb-4">{paymentModal.supplier}</p>
              
              <p className="text-[11px] text-[#9d6b7a] font-bold uppercase mb-1">Số tiền thanh toán</p>
              <p className="text-[28px] font-black text-[#b91c1c] leading-none">{paymentModal.amount.toLocaleString()} ₫</p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-[#9d6b7a] text-[12px] font-bold uppercase">Phương thức chi tiền</label>
              <select
                value={paymentModal.accountId}
                onChange={e => setPaymentModal({...paymentModal, accountId: Number(e.target.value)})}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value={111}>Tiền mặt (Tài khoản 111)</option>
                <option value={112}>Chuyển khoản (Tài khoản Ngân hàng 112)</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 text-[14px]">Hủy bỏ</button>
              <button onClick={confirmPayment} className="flex-1 py-3.5 rounded-xl font-bold text-white shadow-lg transition-transform hover:-translate-y-0.5 active:scale-95" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                Xác nhận chi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST CUSTOM (Đã update giao diện) */}
      {toast && (
        <div className={`fixed bottom-10 right-10 z-[120] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300 animate-in slide-in-from-bottom-5 border ${toast.type === 'success' ? 'bg-[#f0fdf4] border-green-200' : toast.type === 'error' ? 'bg-[#fef2f2] border-red-200' : 'bg-[#eff6ff] border-blue-200'}`}>
          <div className="shrink-0">
            {toast.type === 'success' ? <CheckCircle2 color="#16a34a" size={24} /> : toast.type === 'error' ? <AlertCircle color="#dc2626" size={24} /> : <Info color="#2563eb" size={24} />}
          </div>
          <div>
            <h4 className={`font-bold text-[14px] ${toast.type === 'success' ? 'text-green-800' : toast.type === 'error' ? 'text-red-800' : 'text-blue-800'}`}>
              {toast.type === 'success' ? 'Thành công' : toast.type === 'error' ? 'Lỗi hệ thống' : 'Thông báo'}
            </h4>
            <p className={`text-[13px] mt-0.5 font-medium ${toast.type === 'success' ? 'text-green-600' : toast.type === 'error' ? 'text-red-600' : 'text-blue-600'}`}>{toast.message}</p>
          </div>
          <button onClick={() => setToast(null)} className="ml-4 p-1 rounded-full hover:bg-black/5 transition-colors"><XCircle size={18} /></button>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: any) {
  return (
    <div style={glassCard} className="p-5 flex flex-col justify-between hover:-translate-y-1 transition-transform">
      <div className="flex justify-between items-start">
        <div className="p-2.5 rounded-xl bg-white shadow-sm border border-gray-50"><Icon size={20} color={color} /></div>
      </div>
      <div className="mt-4">
        <p className="text-[#9d6b7a] text-[11px] font-bold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-[#3d1a2e] text-[20px] font-black">{value.toLocaleString()} ₫</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon: Icon, label }: any) {
  return (
    <button onClick={onClick} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl transition-all ${active ? "text-white shadow-md shadow-amber-500/20" : "text-[#6b4153] hover:bg-white"}`} style={{ background: active ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent" }}>
      <Icon size={16} /> <span className="font-bold text-[13px]">{label}</span>
    </button>
  );
}