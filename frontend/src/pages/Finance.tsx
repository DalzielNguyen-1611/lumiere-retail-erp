import React, { useState, useEffect } from "react";
import { 
  ArrowUpRight, ArrowDownRight, Loader2, Info, XCircle, X,
  BarChart3, PieChart, Landmark, ShoppingCart, Users2, Clock, Sparkles, Download,
  CheckCircle2, AlertCircle, ChevronDown, ChevronUp, RotateCcw, LayoutDashboard, Receipt, CreditCard
} from "lucide-react";
import { useLanguage } from "../context/LanguageContext";

// --- STYLES & CẤU HÌNH ---
const glassCard = { 
  background: "rgba(255,255,255,0.72)", 
  backdropFilter: "blur(20px)", 
  WebkitBackdropFilter: "blur(20px)", 
  border: "1px solid rgba(212, 175, 55, 0.25)", 
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

const translateAccountNameOnly = (name: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('tiền mặt')) return 'Cash';
  if (nameLower.includes('ngân hàng') || nameLower.includes('tiền gửi')) return 'Bank Deposit';
  if (nameLower.includes('phải thu')) return 'Accounts Receivable';
  if (nameLower.includes('hàng hóa')) return 'Inventory Supply';
  if (nameLower.includes('tài sản cố định')) return 'Tangible Fixed Assets';
  if (nameLower.includes('hao mòn')) return 'Accumulated Depreciation';
  if (nameLower.includes('trả trước')) return 'Prepaid Expenses';
  if (nameLower.includes('phải trả người lao động')) return 'Salaries Payable';
  if (nameLower.includes('phải trả')) return 'Accounts Payable';
  if (nameLower.includes('vốn đầu tư')) return "Owner's Equity";
  if (nameLower.includes('lợi nhuận')) return 'Undistributed Earnings';
  if (nameLower.includes('giảm trừ')) return 'Sales Deductions';
  if (nameLower.includes('giá vốn')) return 'Cost of Goods Sold';
  if (nameLower.includes('chi phí')) return 'Administrative Expenses';
  if (nameLower.includes('xác định kết quả')) return 'Net Income Determination';
  if (nameLower.includes('thuế gtgt')) return 'VAT Payable';
  if (nameLower.includes('thuế tndn')) return 'Corporate Income Tax';
  if (nameLower.includes('thuế tncn')) return 'Personal Income Tax';
  if (nameLower.includes('xã hội')) return 'Social Insurance';
  if (nameLower.includes('y tế')) return 'Health Insurance';
  if (nameLower.includes('thất nghiệp')) return 'Unemployment Insurance';
  if (nameLower.includes('doanh thu')) return 'Sales Revenue';
  return name;
};

const translateAccountPurpose = (name: string, purpose: string) => {
  const nameLower = name.toLowerCase();
  if (nameLower.includes('tiền mặt')) return 'Cash stored in the store vault';
  if (nameLower.includes('ngân hàng') || nameLower.includes('tiền gửi')) return 'Cash deposited in corporate bank accounts';
  if (nameLower.includes('phải thu')) return 'Outstanding customer invoices and receivables';
  if (nameLower.includes('hàng hóa')) return 'Total cost value of supplies and pets in stock';
  if (nameLower.includes('tài sản cố định')) return 'Skincare machinery, shelving cabinets, and high-end furniture (>30M VND)';
  if (nameLower.includes('hao mòn')) return 'Calculation of machinery value decreasing over time';
  if (nameLower.includes('trả trước')) return 'Prepaid operations, rental, and marketing expenses';
  if (nameLower.includes('phải trả người lao động')) return 'Salaries, bonuses, and allowances payable to employees';
  if (nameLower.includes('phải trả')) return 'Unpaid balances due to procurement vendors';
  if (nameLower.includes('vốn đầu tư')) return 'Contributed equity capital from company shareholders';
  if (nameLower.includes('lợi nhuận')) return 'Accumulated net profit of the studio after all expenses';
  if (nameLower.includes('giảm trừ')) return 'Customer discounts, promo codes, and vouchers';
  if (nameLower.includes('giá vốn')) return 'Original cost of the cosmetics and products sold';
  if (nameLower.includes('chi phí')) return 'Administrative, salary, and retail operations expense';
  if (nameLower.includes('xác định kết quả')) return 'Aggregates revenues and expenses to close books monthly';
  if (nameLower.includes('thuế gtgt')) return '10% Value Added Tax collected from customers';
  if (nameLower.includes('thuế tndn')) return 'Corporate Income Tax calculated on net profit of Lumière';
  if (nameLower.includes('thuế tncn')) return 'Personal Income Tax withheld from employee salaries';
  if (nameLower.includes('xã hội')) return 'Social Insurance: 8% (Employee) and 17.5% (Employer)';
  if (nameLower.includes('y tế')) return 'Health Insurance: 1.5% (Employee) and 3% (Employer)';
  if (nameLower.includes('thất nghiệp')) return 'Unemployment Insurance: 1% (Employee) and 1% (Employer)';
  if (nameLower.includes('doanh thu')) return 'Core cumulative revenue generated from sales and services';
  return purpose;
};

export function Finance() {
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "payables">("overview");

  const [accounts, setAccounts] = useState<AccountBalance[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingOverview, setIsLoadingOverview] = useState(true);
  const [isAccountsExpanded, setIsAccountsExpanded] = useState(false);
  const [isTransactionsExpanded, setIsTransactionsExpanded] = useState(false);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);

  const [payables, setPayables] = useState<any[]>([]);
  const [isLoadingPayables, setIsLoadingPayables] = useState(true);

  const [paymentHistory, setPaymentHistory] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Modal Thanh Toán
  const [paymentModal, setPaymentModal] = useState<{isOpen: boolean, id: number, supplier: string, amount: number, accountId: number, type?: string} | null>(null);

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
  const locale = language === 'vi' ? 'vi-VN' : 'en-US';
  const dateString = currentTime.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const timeString = currentTime.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" });

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

  const fetchPaymentHistoryData = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await fetch(`${BACKEND_URL}/api/finance/payment-history`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      if (json.status === "success") {
        setPaymentHistory(json.data);
      }
    } catch (error: any) {
      console.error("Lỗi tải lịch sử chi:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === "overview") fetchOverviewData();
    if (activeTab === "payables") {
      fetchPayablesData();
      fetchPaymentHistoryData();
    }
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
        body: JSON.stringify({ 
          accountId: paymentModal.accountId,
          type: paymentModal.type // Cần type để BE biết gọi SP nào
        })
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
    <div className="p-8 min-h-screen relative">
      <div className="flex justify-between items-end mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles size={16} color="#D4AF37" />
            <p className="text-[#9d6b7a] text-[13px] font-medium uppercase tracking-widest">
              {timeString} • {dateString}
            </p>
          </div>
          <h1 className="text-[#3d1a2e] text-[28px] font-bold" style={{ fontFamily: "var(--font-heading)" }}>{t('fin.title')}</h1>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white/50 rounded-2xl border border-white shadow-inner shrink-0">
          {[
            { id: "overview", label: t('fin.tab_overview'), icon: BarChart3 },
            { id: "payables", label: t('fin.tab_payables'), icon: CreditCard },
          ].map((tab) => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-[13px] transition-all active:scale-95 shrink-0"
              style={{
                background: activeTab === tab.id ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent",
                color: activeTab === tab.id ? "white" : "#6b4153",
                boxShadow: activeTab === tab.id ? "0 8px 24px rgba(212,175,55,0.25)" : "none"
              }}
            >
              <tab.icon size={16} /> {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="animate-in fade-in duration-500">
        {activeTab === "overview" && (
          isLoadingOverview ? (
            <div className="flex flex-col items-center justify-center h-64">
              <Loader2 className="animate-spin mb-4" color="#D4AF37" size={40} />
              <p className="text-[#9d6b7a] font-medium">{t('fin.loading')}</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-5 mb-8">
                <StatCard label={t('fin.total_assets')} value={totalAssets} icon={Landmark} color="#D4AF37" />
                <StatCard label={t('fin.total_liabilities')} value={totalLiabilities} icon={Users2} color="#f43f5e" />
                <StatCard label={t('fin.total_revenue')} value={totalRevenue} icon={BarChart3} color="#10b981" />
                <StatCard label={t('fin.inventory_value')} value={accounts.find(a => a.id === 156)?.balance || 0} icon={ShoppingCart} color="#3b82f6" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-6">
                  <div style={glassCard} className="p-6">
                    <div className="flex justify-between items-center mb-5">
                      <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                        <PieChart size={20} color="#D4AF37" /> {language === 'vi' ? 'Hệ Thống Tài Khoản' : 'Chart of Accounts'}
                      </h2>
                      <button 
                        onClick={() => showToast(language === 'vi' ? "Chức năng tải file Excel Sổ cái đang được xây dựng!" : "The Ledger Excel download feature is under development!", "info")} 
                        className="flex items-center gap-2 px-4 py-2 rounded-xl transition-all hover:bg-[#D4AF37]/5 border border-[#D4AF37]/30 text-[#D4AF37] active:scale-95"
                      >
                        <Download size={14} /> <span className="font-bold text-[12px]">{language === 'vi' ? 'Xuất Excel' : 'Export Excel'}</span>
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {displayedAccounts.map(acc => (
                        <div key={acc.id} onClick={() => setSelectedAccountId(acc.id === selectedAccountId ? null : acc.id)} className={`p-4 rounded-2xl border transition-all group cursor-pointer ${selectedAccountId === acc.id ? 'bg-white shadow-md border-2 border-[#D4AF37]' : 'bg-white/60 border-[#D4AF37]/25 hover:border-[#D4AF37]/60 hover:bg-white hover:shadow-md'}`}>
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <span className="text-[10px] font-black text-[#D4AF37] bg-[#D4AF37]/10 px-2 py-0.5 rounded">{acc.id}</span>
                              <p className="font-bold text-[#3d1a2e] text-[14px] mt-1">{language === 'vi' ? acc.name : translateAccountNameOnly(acc.name)}</p>
                            </div>
                            <p className="font-black text-[#3d1a2e] text-[15px]">{acc.balance.toLocaleString()} ₫</p>
                          </div>
                          <p className="text-[11px] text-[#9d6b7a] line-clamp-1 italic group-hover:line-clamp-none transition-all">{language === 'vi' ? acc.purpose : translateAccountPurpose(acc.name, acc.purpose)}</p>
                        </div>
                      ))}
                    </div>

                    {accounts.length > 6 && (
                      <button onClick={() => setIsAccountsExpanded(!isAccountsExpanded)} className="w-full mt-5 py-2.5 flex items-center justify-center gap-2 rounded-xl transition-all hover:bg-[#D4AF37]/5 font-bold text-[13px] text-[#D4AF37] border border-dashed border-[#D4AF37]/40">
                        {isAccountsExpanded ? <><ChevronUp size={16}/> {language === 'vi' ? 'Thu gọn danh sách' : 'Collapse list'}</> : <><ChevronDown size={16}/> {language === 'vi' ? `Xem thêm ${accounts.length - 6} tài khoản` : `Show ${accounts.length - 6} more accounts`}</>}
                      </button>
                    )}
                  </div>
                </div>

                <div className="lg:col-span-1">
                  <div className="sticky top-8 transition-all duration-500">
                    <div style={glassCard} className="p-6 flex flex-col max-h-[calc(100vh-6rem)]">
                      <div className="flex justify-between items-center mb-5 shrink-0">
                        <h2 className="text-[#3d1a2e] text-[17px] font-bold flex items-center gap-2">
                          <Clock size={20} color="#D4AF37" /> {selectedAccountName ? `${language === 'vi' ? 'Biến Động' : 'Fluctuation'}: ${language === 'vi' ? selectedAccountName : translateAccountNameOnly(selectedAccountName)}` : (language === 'vi' ? 'Giao Dịch Gần Đây' : 'Recent Transactions')}
                        </h2>
                        {selectedAccountId && (
                          <button onClick={() => setSelectedAccountId(null)} className="p-1.5 rounded-full bg-[#fdfbf7] border hover:bg-gray-100 transition-colors" title={language === 'vi' ? "Trở về toàn bộ" : "Back to all"}>
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
                              <p className="text-[11px] text-[#9d6b7a]">{tx.date} • {language === 'vi' ? tx.accountName : translateAccountNameOnly(tx.accountName)}</p>
                            </div>
                            <p className={`text-[13px] font-bold shrink-0 ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                              {tx.amount > 0 ? "+" : ""}{tx.amount.toLocaleString()}
                            </p>
                          </div>
                        )) : (
                          <div className="text-center py-8"><p className="text-[12px] text-[#9d6b7a] italic">{language === 'vi' ? 'Không có dữ liệu giao dịch.' : 'No transaction data.'}</p></div>
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
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">{t('fin.total_unpaid')}</p>
                  <p className="text-amber-600 text-[24px] font-black mt-1">{totalUnpaid.toLocaleString()} ₫</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-amber-50 flex items-center justify-center"><AlertCircle color="#d97706"/></div>
              </div>
              <div style={glassCard} className="p-5 flex items-center justify-between border-l-4 border-l-emerald-400">
                <div>
                  <p className="text-[#9d6b7a] text-[12px] font-bold uppercase">{t('fin.total_paid_history')}</p>
                  <p className="text-emerald-600 text-[24px] font-black mt-1">{totalPaid.toLocaleString()} ₫</p>
                </div>
                <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center"><CheckCircle2 color="#10b981"/></div>
              </div>
            </div>

            <div style={glassCard} className="p-6">
              <h2 className="text-[#3d1a2e] text-[16px] font-bold mb-6">{t('fin.docs_payables')}</h2>
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#D4AF37]/20 text-[#9d6b7a] text-[11px] uppercase tracking-wider bg-[#D4AF37]/5">
                    <th className="py-3 px-3 rounded-tl-xl">{t('fin.doc_type')}</th>
                    <th className="px-3">{t('fin.entity')}</th>
                    <th className="px-3">{t('fin.date_created')}</th>
                    <th className="px-3 text-right">{t('fin.amount')}</th>
                    <th className="px-3 text-center">{t('hr.status')}</th>
                    <th className="px-3 text-center rounded-tr-xl">{t('fin.action')}</th>
                  </tr>
                </thead>
                <tbody>
                  {isLoadingPayables ? (
                    <tr><td colSpan={6} className="py-10 text-center text-[#9d6b7a]">{language === 'vi' ? 'Đang tải dữ liệu công nợ...' : 'Loading payables data...'}</td></tr>
                  ) : payables.length === 0 ? (
                    <tr><td colSpan={6} className="py-10 text-center text-[#9d6b7a]">{language === 'vi' ? 'Không có hóa đơn nào cần xử lý.' : 'No invoices to process.'}</td></tr>
                  ) : (
                    payables.map((row) => (
                      <tr key={`${row.type}-${row.id}`} className="border-b border-[rgba(212,175,55,0.07)] hover:bg-white transition-colors">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2">
                            <div className={`p-1.5 rounded-lg ${row.type === 'LUONG' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'}`}>
                              {row.type === 'LUONG' ? <Users2 size={14} /> : <ShoppingCart size={14} />}
                            </div>
                            <p className="font-bold text-[#D4AF37] text-[13px]">{row.code}</p>
                          </div>
                        </td>
                        <td className="px-3 font-bold text-[#3d1a2e] text-[13px]">{row.supplier}</td>
                        <td className="px-3 text-[#6b4153] text-[13px]">{row.date}</td>
                        <td className="px-3 font-black text-[#b91c1c] text-[14px] text-right">{row.amount.toLocaleString()} ₫</td>
                        <td className="px-3 text-center">
                          {row.status === 'Chưa thanh toán' ? (
                            <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><Clock size={12}/> {t('fin.pending_pay')}</span>
                          ) : (
                            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-bold inline-flex items-center gap-1"><CheckCircle2 size={12}/> {t('fin.paid_status')}</span>
                          )}
                        </td>
                        <td className="px-3 text-center">
                          {row.status === 'Chưa thanh toán' ? (
                            <button 
                              onClick={() => setPaymentModal({ isOpen: true, id: row.id, supplier: row.supplier, amount: row.amount, accountId: 111, type: row.type })} 
                              className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all inline-flex items-center gap-1.5 shadow-md text-white hover:scale-105 active:scale-95"
                              style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)" }}
                            >
                              <CreditCard size={14}/> {t('fin.pay_button')}
                            </button>
                          ) : (
                            <span className="text-gray-400 text-[12px] italic">{t('fin.done')}</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* PHẦN LỊCH SỬ CHI TIỀN MỚI THÊM */}
            <div style={glassCard} className="p-6 mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><RotateCcw size={20} /></div>
                <h2 className="text-[#3d1a2e] text-[16px] font-bold">{t('fin.history')}</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-[#9d6b7a] text-[11px] uppercase tracking-wider border-b border-gray-100">
                      <th className="py-3 px-3">{t('fin.expense_type')}</th>
                      <th className="px-3">{t('fin.note')}</th>
                      <th className="px-3">{t('fin.account')}</th>
                      <th className="px-3 text-center">{t('fin.time')}</th>
                      <th className="px-3 text-right">{t('fin.amount')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingHistory ? (
                      <tr><td colSpan={5} className="py-10 text-center text-[#9d6b7a]">{t('common.loading')}</td></tr>
                    ) : paymentHistory.length === 0 ? (
                      <tr><td colSpan={5} className="py-10 text-center text-[#9d6b7a]">{t('fin.no_history')}</td></tr>
                    ) : (
                      paymentHistory.map((h) => (
                        <tr key={h.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                          <td className="py-4 px-3">
                            <span className={`px-2 py-1 rounded-lg text-[10px] font-bold ${
                              h.type === 'LUONG' ? 'bg-purple-100 text-purple-700' : 
                              h.type === 'MUA' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {h.type === 'LUONG' ? t('fin.salary_expense') : h.type === 'MUA' ? t('fin.supplier_debt') : t('fin.other_expense')}
                            </span>
                          </td>
                          <td className="px-3">
                            <p className="text-[13px] font-medium text-[#3d1a2e]">{h.desc}</p>
                          </td>
                          <td className="px-3">
                            <div className="flex items-center gap-2">
                              <Landmark size={14} className="text-[#D4AF37]" />
                              <span className="text-[12px] text-[#6b4153] font-bold">{h.accountName}</span>
                            </div>
                          </td>
                          <td className="px-3 text-center text-[#9d6b7a] text-[12px]">{h.date}</td>
                          <td className="px-3 text-right">
                            <p className="text-[14px] font-black text-red-600">-{h.amount.toLocaleString()} ₫</p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
            <h2 className="text-xl font-bold mb-6 text-[#3d1a2e]">{t('fin.confirm_pay')}</h2>

            <div className="bg-gray-50 p-4 rounded-xl mb-6 border border-gray-100">
              <p className="text-[11px] text-[#9d6b7a] font-bold uppercase mb-1">{t('fin.pay_to_supplier')}</p>
              <p className="text-[16px] font-bold text-[#3d1a2e] mb-4">{paymentModal.supplier}</p>
              
              <p className="text-[11px] text-[#9d6b7a] font-bold uppercase mb-1">{t('fin.pay_amount')}</p>
              <p className="text-[28px] font-black text-[#b91c1c] leading-none">{paymentModal.amount.toLocaleString()} ₫</p>
            </div>

            <div className="mb-6">
              <label className="block mb-2 text-[#9d6b7a] text-[12px] font-bold uppercase">{language === 'vi' ? 'Phương thức chi tiền' : 'Payment Method'}</label>
              <select
                value={paymentModal.accountId}
                onChange={e => setPaymentModal({...paymentModal, accountId: Number(e.target.value)})}
                className="w-full p-3.5 rounded-xl border border-gray-200 bg-white outline-none focus:border-[#D4AF37] cursor-pointer"
              >
                <option value={111}>{language === 'vi' ? 'Tiền mặt (Tài khoản 111)' : 'Cash'}</option>
                <option value={112}>{language === 'vi' ? 'Chuyển khoản (Tài khoản Ngân hàng 112)' : 'Bank Transfer'}</option>
              </select>
            </div>

            <div className="flex gap-3">
              <button onClick={() => setPaymentModal(null)} className="flex-1 py-3.5 rounded-xl font-semibold bg-gray-100 text-gray-600 hover:bg-gray-200 text-[14px]">{language === 'vi' ? 'Hủy bỏ' : 'Cancel'}</button>
              <button onClick={confirmPayment} className="flex-1 py-4 rounded-2xl font-bold text-white shadow-lg transition-all hover:scale-105 active:scale-95" style={{ background: "linear-gradient(135deg, #10b981, #059669)" }}>
                {language === 'vi' ? 'Xác nhận chi' : 'Confirm Expense'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION (Standardized) */}
      {toast && (
        <div className="fixed top-24 right-8 z-50 animate-in fade-in slide-in-from-right-4 duration-300">
          <div className="bg-[#3d1a2e] text-white px-6 py-4 rounded-2xl shadow-2xl flex items-center gap-4 min-w-[320px] border border-white/10">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              toast.type === "success" ? "bg-emerald-500/20" : toast.type === "error" ? "bg-rose-500/20" : "bg-amber-500/20"
            }`}>
              {toast.type === "error" ? <AlertCircle className="text-rose-400" size={20} /> : <Sparkles className="text-[#D4AF37]" size={20} />}
            </div>
            <div>
              <p className="font-bold text-[15px]">{toast.type === "success" ? (language === 'vi' ? "Thành công" : "Success") : toast.type === "error" ? (language === 'vi' ? "Lỗi hệ thống" : "System Error") : (language === 'vi' ? "Thông báo" : "Notification")}</p>
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
    <button 
      onClick={onClick} 
      className={`flex items-center gap-2 px-6 py-3 rounded-2xl transition-all shadow-sm hover:shadow-md active:scale-95 ${active ? "text-white shadow-amber-500/20" : "text-[#6b4153] hover:bg-white"}`} 
      style={{ background: active ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "transparent" }}
    >
      <Icon size={18} /> <span className="font-bold text-[14px]">{label}</span>
    </button>
  );
}