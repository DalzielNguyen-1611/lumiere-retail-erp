import { useState, useMemo, useEffect } from "react";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  User,
  CreditCard,
  Banknote,
  Printer,
  PauseCircle,
  XCircle,
  Star,
  QrCode,
  CheckCircle2,
  ShoppingCart,
  Zap,
  ScanLine,
  Calendar,
  ChevronDown,
  Package,
  Send,
  MessageSquare
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

// ─── Types ───────────────────────────────────────────────────────────────────
interface Product {
  id: number;
  name: string;
  sku: string;
  barcode: string;
  price: number;
  stock: number;
  status: "In Stock" | "Low Stock" | "Out of Stock";
  category: string;
  img: string;
}

interface CartItem extends Product {
  qty: number;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  tier: "VIP" | "Gold" | "Silver";
  points: number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const quickKeys = [1, 2, 3, 5, 6, 7];
const categories = ["All", "Skincare", "Face", "Lips", "Eyes", "Fragrance"];
const VAT_RATE = 0.1;

const tierColors: Record<string, { bg: string; color: string }> = {
  VIP: { bg: "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white" },
  Gold: { bg: "rgba(212,175,55,0.15)", color: "#92740d" },
  Silver: { bg: "rgba(148,163,184,0.15)", color: "#64748b" },
};

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  "In Stock": { bg: "rgba(74,222,128,0.12)", color: "#16a34a", dot: "#4ade80" },
  "Low Stock": { bg: "rgba(212,175,55,0.15)", color: "#92740d", dot: "#D4AF37" },
  "Out of Stock": { bg: "rgba(244,63,94,0.1)", color: "#dc2626", dot: "#f43f5e" },
};

const glassPanel = {
  background: "rgba(255,255,255,0.75)",
  backdropFilter: "blur(24px)",
  WebkitBackdropFilter: "blur(24px)",
  border: "1px solid rgba(255,255,255,0.95)",
  boxShadow: "0 8px 32px rgba(61,26,46,0.08)",
};

const BACKEND_URL = "http://localhost:5000";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export function POS() {
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // TABS & REFILL STATE
  const [activeTab, setActiveTab] = useState<"sales" | "refill">("sales");
  const [refillCart, setRefillCart] = useState<CartItem[]>([]);
  const [refillNote, setRefillNote] = useState("");
  const [toastMessage, setToastMessage] = useState("");

  // SALES CART STATE
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerPhone, setCustomerPhone] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState("");
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "bank" | null>(null);
  const [showQR, setShowQR] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBatchFilter, setShowBatchFilter] = useState(false);
  const [heldOrders, setHeldOrders] = useState<{ id: string; items: CartItem[] }[]>([]);

  const fetchProducts = async () => {
    try {
      setIsLoadingProducts(true);
      const response = await fetch('http://localhost:5000/api/products'); 
      const json = await response.json();
      
      if (json.status === 'success') {
        setAllProducts(json.data);
      } else {
        console.error("Lỗi từ server:", json.message);
      }
    } catch (error) {
      console.error("Lỗi fetch sản phẩm:", error);
    } finally {
      setIsLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      const safeName = p.name ? String(p.name) : "";
      const safeSku = p.sku ? String(p.sku) : "";
      const safeBarcode = p.barcode ? String(p.barcode) : "";
      const safeCategory = p.category ? String(p.category) : "";

      const matchesCat = activeCategory === "All" || safeCategory === activeCategory;
      const matchesSearch =
        safeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeSku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        safeBarcode.toLowerCase().includes(searchQuery.toLowerCase());
        
      return matchesCat && matchesSearch;
    });
  }, [allProducts, activeCategory, searchQuery]);

  const quickProducts = useMemo(() => allProducts.filter((p) => quickKeys.includes(p.id)), [allProducts]);

  // Calculations
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
  const tax = subtotal * VAT_RATE;
  const total = subtotal + tax;
  const cartCount = cart.reduce((sum, item) => sum + item.qty, 0);
  const refillCount = refillCart.reduce((sum, item) => sum + item.qty, 0);

  // ─── CLICK HANDLER TỔNG HỢP ────────────────────────────────────────────────
  const handleProductClick = (product: Product) => {
    if (activeTab === "sales") {
      if (product.status === "Out of Stock") return;
      setCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) =>
            item.id === product.id ? { ...item, qty: item.qty + 1 } : item
          );
        }
        return [...prev, { ...product, qty: 1 }];
      });
    } else {
      // Logic thêm vào Refill Cart
      setRefillCart((prev) => {
        const existing = prev.find((item) => item.id === product.id);
        if (existing) {
          return prev.map((item) => item.id === product.id ? { ...item, qty: item.qty + 5 } : item); 
        }
        return [...prev, { ...product, qty: 10 }]; 
      });
    }
  };

  // ─── BẢN GỐC: SALES FUNCTIONS ──────────────────────────────────────────────
  const updateQty = (id: number, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) => (item.id === id ? { ...item, qty: item.qty + delta } : item))
        .filter((item) => item.qty > 0)
    );
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const searchCustomer = async () => {
    if (!customerPhone.trim()) return;
    try {
      const response = await fetch(`http://localhost:5000/api/customers/search?phone=${customerPhone}`);
      const json = await response.json();

      if (json.status === 'success') {
        const customerData = json.data;
        let tierColor = "Silver";
        if (customerData.tier.includes('Vàng') || customerData.tier.includes('Gold')) tierColor = "Gold";
        if (customerData.tier.includes('VIP') || customerData.tier.includes('Kim Cương')) tierColor = "VIP";

        setSelectedCustomer({
          id: customerData.id,
          name: customerData.name,
          phone: customerData.phone,
          tier: tierColor as any, 
          points: customerData.points
        });
        setShowNewCustomerForm(false); 
      } else {
        setSelectedCustomer(null);
        setShowNewCustomerForm(true);
        setNewCustomerName(""); 
      }
    } catch (error) {
      console.error("Lỗi tìm kiếm khách hàng:", error);
    }
  };

  const createNewCustomer = async () => {
    if (!newCustomerName.trim()) return;
    setIsCreatingCustomer(true);
    try {
      const response = await fetch('http://localhost:5000/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCustomerName, phone: customerPhone }),
      });
      const json = await response.json();

      if (json.status === 'success') {
        setSelectedCustomer({
          id: json.data.id,
          name: newCustomerName,
          phone: customerPhone,
          tier: "Silver",
          points: 0
        });
        setShowNewCustomerForm(false);
      } else {
        alert("Lỗi tạo khách hàng: " + json.message);
      }
    } catch (error) {
      console.error("Lỗi tạo KH:", error);
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const holdOrder = () => {
    if (cart.length === 0) return;
    const id = `HOLD-${Date.now()}`;
    setHeldOrders((prev) => [...prev, { id, items: cart }]);
    setCart([]);
  };

  const processPaymentAPI = async (method: "cash" | "bank") => {
    setIsProcessing(true); 
    try {
      const customerId = selectedCustomer?.id ? parseInt(selectedCustomer.id) : 1;
      const payload = { cart: cart, total: total, customerId: customerId, phuongThuc: method };

      const response = await fetch('http://localhost:5000/api/orders/charge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Lỗi không xác định' }));
        throw new Error(`HTTP ${response.status}: ${errorData.message || response.statusText}`);
      }

      const json = await response.json();

      if (json.status === 'success') {
        setShowQR(false);
        setShowSuccess(true);
        
        // Cập nhật lại tồn kho ngay lập tức
        fetchProducts();

        setTimeout(() => {
          setShowSuccess(false);
          setCart([]);
          setSelectedCustomer(null);
          setCustomerPhone("");
          setPaymentMethod(null);
        }, 2500);
      } else {
        alert("Lỗi từ CSDL Oracle: " + (json.message || 'Không xác định'));
      }
    } catch (error) {
      alert("Mất kết nối với Backend! Chi tiết: " + (error instanceof Error ? error.message : 'Không xác định'));
    } finally {
      setIsProcessing(false); 
    }
  };  
  
  const handlePayment = () => {
    if (!paymentMethod) return;
    if (paymentMethod === "bank") setShowQR(true);
    else processPaymentAPI("cash");
  };

  const confirmBankPayment = () => {
    processPaymentAPI("bank");
  };

  const handlePrintReceipt = () => {
    if (cart.length === 0) {
      alert("Giỏ hàng đang trống, không có gì để in!");
      return;
    }
    const printWindow = window.open('', '_blank', 'width=400,height=600');
    if (!printWindow) {
      alert("Vui lòng cho phép trình duyệt mở Popup để in hóa đơn!");
      return;
    }

    const itemsHtml = cart.map(item => `
      <div style="display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 12px; font-family: monospace;">
        <div style="flex: 1; padding-right: 10px;">
          <div style="font-weight: bold; color: #000;">${item.name}</div>
          <div style="color: #555;">${item.qty} x ${item.price.toFixed(2)} ₫</div>
        </div>
        <div style="font-weight: bold; color: #000;">${(item.qty * item.price).toFixed(2)} ₫</div>
      </div>
    `).join('');

    const html = `
      <html>
        <head>
          <title>Receipt - Lumière Beauty</title>
          <style>
            body { font-family: 'Courier New', Courier, monospace; width: 300px; margin: 0 auto; padding: 20px; color: #000; }
            .text-center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #000; margin: 12px 0; }
            @media print {
              body { width: 100%; padding: 0; margin: 0; }
              @page { margin: 0; }
            }
          </style>
        </head>
        <body>
          <h2 class="text-center" style="margin-bottom: 5px;">LUMIÈRE BEAUTY</h2>
          <p class="text-center" style="font-size: 12px; margin: 2px 0;">123 Beauty Street, HCMC</p>
          <p class="text-center" style="font-size: 12px; margin: 2px 0;">Tel: 0123.456.789</p>
          <div class="divider"></div>
          
          <p style="font-size: 12px; margin: 4px 0;">Date: ${new Date().toLocaleString('vi-VN')}</p>
          <p style="font-size: 12px; margin: 4px 0;">Cashier: Admin (01)</p>
          <p style="font-size: 12px; margin: 4px 0;">Customer: ${selectedCustomer ? selectedCustomer.name : 'Guest'}</p>
          
          <div class="divider"></div>
          ${itemsHtml}
          <div class="divider"></div>
          
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>Subtotal:</span>
            <span>${subtotal.toFixed(2)} ₫</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px;">
            <span>VAT (10%):</span>
            <span>${tax.toFixed(2)} ₫</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 16px; font-weight: bold; margin-top: 8px;">
            <span>TOTAL:</span>
            <span>${total.toFixed(2)} ₫</span>
          </div>
          
          <div class="divider"></div>
          <p class="text-center bold" style="font-size: 14px; margin-top: 20px;">THANK YOU!</p>
          <p class="text-center" style="font-size: 12px;">See you again</p>
          
          <script>
            window.onload = () => { 
              // TẠM THỜI TẮT LỆNH IN VÀ ĐÓNG CỬA SỔ ĐỂ XEM TRƯỚC HÓA ĐƠN
              /*
              setTimeout(() => {
                window.print(); 
                window.close(); 
              }, 250); 
              */
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(html);
    printWindow.document.close();
  };

  // ─── REFILL FUNCTIONS ──────────────────────────────────────────────────────
  const updateRefillQty = (id: number, delta: number) => {
    setRefillCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, qty: Math.max(1, item.qty + delta) } : item))
    );
  };
  const removeFromRefill = (id: number) => setRefillCart((prev) => prev.filter((item) => item.id !== id));
  
  const submitRefillRequest = () => {
    if (refillCart.length === 0) return;
    
    // Bật thông báo Toast thay vì alert
    setToastMessage("Đã gửi Yêu cầu nhập kho thành công tới phòng Kế toán!");
    setTimeout(() => setToastMessage(""), 4000); // Tự động ẩn sau 4 giây

    setRefillCart([]);
    setRefillNote("");
    setActiveTab("sales"); 
  };

  return (
    <div className="flex h-screen overflow-hidden" style={{ padding: "16px", gap: "16px" }}>
      
      {/* ── LEFT PANEL (68%) ─────────────────────────────────────────────── */}
      <div className="flex flex-col" style={{ flex: "0 0 68%", gap: "12px" }}>
        
        {/* Banner Nhắc nhở nếu đang ở chế độ Refill */}
        {activeTab === "refill" && (
          <div className="px-4 py-2 rounded-xl flex items-center justify-center gap-2 animate-pulse" style={{ background: "rgba(220,38,38,0.1)", border: "1px dashed rgba(220,38,38,0.3)" }}>
            <Package size={16} color="#dc2626" />
            <span style={{ color: "#dc2626", fontSize: "12px", fontWeight: 700 }}>CHẾ ĐỘ YÊU CẦU NHẬP HÀNG: Click vào sản phẩm để thêm vào giỏ Refill.</span>
          </div>
        )}

        {/* Header Bar */}
        <div className="flex items-center gap-3 px-4 py-3 rounded-2xl shrink-0" style={glassPanel}>
          <div className="flex items-center gap-2 flex-1 px-3 py-2 rounded-xl" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <Search size={15} color="#9d6b7a" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by name, SKU, barcode…"
              style={{ border: "none", outline: "none", background: "transparent", color: "#3d1a2e", fontSize: "13px", flex: 1 }}
            />
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "rgba(212,175,55,0.06)", border: "1px solid rgba(212,175,55,0.2)" }}>
            <ScanLine size={15} color="#D4AF37" />
            <span style={{ color: "#9d6b7a", fontSize: "12px" }}>Scan Barcode</span>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 shrink-0">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className="px-4 py-2 rounded-xl transition-all"
              style={{
                background: activeCategory === cat ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(255,255,255,0.7)",
                color: activeCategory === cat ? "white" : "#6b4153",
                fontSize: "12px",
                fontWeight: activeCategory === cat ? 700 : 400,
                border: "1px solid",
                borderColor: activeCategory === cat ? "transparent" : "rgba(255,255,255,0.9)",
                boxShadow: activeCategory === cat ? "0 4px 14px rgba(212,175,55,0.4)" : "0 2px 8px rgba(61,26,46,0.05)",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Product Grid */}
        <div className="flex-1 overflow-y-auto rounded-2xl p-4" style={{ ...glassPanel, scrollbarWidth: "thin" }}>
          <div className="grid grid-cols-4 gap-3">
            {filteredProducts.map((product) => {
              const inSalesCart = cart.find((i) => i.id === product.id);
              const inRefillCart = refillCart.find((i) => i.id === product.id);
              const isOOS = product.status === "Out of Stock";
              
              const badgeQty = activeTab === "sales" ? inSalesCart?.qty : inRefillCart?.qty;
              const isSelected = activeTab === "sales" ? !!inSalesCart : !!inRefillCart;
              
              return (
                <button
                  key={product.id}
                  onClick={() => handleProductClick(product)}
                  disabled={activeTab === "sales" && isOOS} 
                  className="relative rounded-xl overflow-hidden text-left transition-all group"
                  style={{
                    background: isOOS ? "rgba(244,243,243,0.7)" : "rgba(255,255,255,0.8)",
                    border: isSelected 
                            ? (activeTab === "sales" ? "2px solid #D4AF37" : "2px solid #dc2626") 
                            : "1px solid rgba(255,255,255,0.9)",
                    boxShadow: isSelected ? "0 4px 16px rgba(212,175,55,0.25)" : "0 2px 8px rgba(61,26,46,0.05)",
                    opacity: (activeTab === "sales" && isOOS) ? 0.6 : 1,
                    cursor: (activeTab === "sales" && isOOS) ? "not-allowed" : "pointer",
                  }}
                >
                  {badgeQty && (
                    <div
                      className="absolute top-2 right-2 z-10 min-w-[20px] h-5 px-1.5 rounded-full flex items-center justify-center"
                      style={{ 
                        background: activeTab === "sales" ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "#dc2626", 
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)" 
                      }}
                    >
                      <span style={{ color: "white", fontSize: "10px", fontWeight: 800 }}>{badgeQty}</span>
                    </div>
                  )}
                  <div className="w-full aspect-square overflow-hidden" style={{ background: "rgba(253,242,248,0.5)" }}>
                    <ImageWithFallback src={getImageUrl(product.img)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="p-2.5">
                    <p style={{ color: "#3d1a2e", fontSize: "11.5px", fontWeight: 600, lineHeight: 1.3, marginBottom: 2 }} className="line-clamp-2">
                      {product.name}
                    </p>
                    <p style={{ color: "#9d6b7a", fontSize: "9.5px", fontFamily: "monospace" }}>{product.barcode}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span style={{ color: "#D4AF37", fontSize: "13px", fontWeight: 800 }}>{product.price} ₫</span>
                      <span
                        className="flex items-center gap-1 px-1.5 py-0.5 rounded-full"
                        style={{ background: statusStyle[product.status].bg, color: statusStyle[product.status].color, fontSize: "9px", fontWeight: 600 }}
                      >
                        <span className="w-1 h-1 rounded-full" style={{ background: statusStyle[product.status].dot }} />
                        {product.stock > 0 ? product.stock : "OOS"}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL (31%) ─────────────────────────────────────────────── */}
      <div className="flex flex-col rounded-2xl overflow-hidden shrink-0" style={{ flex: "0 0 31%", ...glassPanel }}>
        
        {/* Tab Switcher */}
        <div className="flex border-b" style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(255,255,255,0.7)" }}>
          <button
            onClick={() => setActiveTab("sales")}
            className="flex-1 py-3.5 flex justify-center items-center gap-2 transition-all"
            style={{
              background: activeTab === "sales" ? "white" : "transparent",
              color: activeTab === "sales" ? "#D4AF37" : "#9d6b7a",
              borderBottom: activeTab === "sales" ? "3px solid #D4AF37" : "3px solid transparent",
              fontWeight: activeTab === "sales" ? 700 : 500,
              fontSize: "13px"
            }}
          >
            <ShoppingCart size={16} /> 
            Active Cart {cartCount > 0 && <span className="bg-[#D4AF37] text-white px-1.5 py-0.5 rounded-md text-[10px] ml-1">{cartCount}</span>}
          </button>
          <button
            onClick={() => setActiveTab("refill")}
            className="flex-1 py-3.5 flex justify-center items-center gap-2 transition-all"
            style={{
              background: activeTab === "refill" ? "white" : "transparent",
              color: activeTab === "refill" ? "#dc2626" : "#9d6b7a",
              borderBottom: activeTab === "refill" ? "3px solid #dc2626" : "3px solid transparent",
              fontWeight: activeTab === "refill" ? 700 : 500,
              fontSize: "13px"
            }}
          >
            <Package size={16} /> 
            Refill Req {refillCount > 0 && <span className="bg-[#dc2626] text-white px-1.5 py-0.5 rounded-md text-[10px] ml-1">{refillCount}</span>}
          </button>
        </div>

        {/* ====================================================================
            TAB NỘI DUNG: BÁN HÀNG (SALES CART) - ĐÃ KHÔI PHỤC BẢN GỐC
            ==================================================================== */}
        {activeTab === "sales" ? (
          <>
            <div className="px-4 py-4 flex items-center justify-between border-b shrink-0" style={{ borderColor: "rgba(212,175,55,0.15)", background: "rgba(255,255,255,0.5)" }}>
              <span style={{ color: "#3d1a2e", fontSize: "14px", fontWeight: 700 }}>Active Orders</span>
              <div className="flex gap-1.5">
                <button onClick={holdOrder} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)" }}>
                  <PauseCircle size={13} color="#92740d" />
                  <span style={{ color: "#92740d", fontSize: "11px", fontWeight: 600 }}>Hold</span>
                </button>
                <button onClick={() => setCart([])} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.08)", border: "1px solid rgba(244,63,94,0.15)" }}>
                  <XCircle size={13} color="#dc2626" />
                  <span style={{ color: "#dc2626", fontSize: "11px", fontWeight: 600 }}>Cancel</span>
                </button>
              </div>
            </div>

            {heldOrders.length > 0 && (
              <div className="px-4 py-2 flex gap-2 shrink-0" style={{ background: "rgba(212,175,55,0.05)", borderBottom: "1px solid rgba(212,175,55,0.1)" }}>
                {heldOrders.map((h) => (
                  <button
                    key={h.id}
                    onClick={() => { setCart(h.items); setHeldOrders((prev) => prev.filter((o) => o.id !== h.id)); }}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg"
                    style={{ background: "rgba(212,175,55,0.15)", border: "1px dashed rgba(212,175,55,0.5)" }}
                  >
                    <PauseCircle size={11} color="#D4AF37" />
                    <span style={{ color: "#92740d", fontSize: "10px", fontWeight: 600 }}>{h.id.slice(-4)} ({h.items.length})</span>
                  </button>
                ))}
              </div>
            )}

            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(212,175,55,0.2) transparent" }}>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full" style={{ opacity: 0.5 }}>
                  <ShoppingCart size={36} color="#D4AF37" strokeWidth={1} />
                  <p style={{ color: "#9d6b7a", fontSize: "13px", marginTop: 12 }}>Cart is empty</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.id} className="flex items-center gap-2.5 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(212,175,55,0.12)" }}>
                      <div className="w-9 h-9 rounded-lg overflow-hidden shrink-0">
                        <ImageWithFallback src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 600 }} className="truncate">{item.name}</p>
                        <p style={{ color: "#D4AF37", fontSize: "12px", fontWeight: 700 }}>{(item.price * item.qty).toFixed(2)} ₫</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button onClick={() => updateQty(item.id, -1)} className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100"><Minus size={11} /></button>
                        
                        {/* ĐÃ KHÔI PHỤC Ô INPUT NHẬP SỐ LƯỢNG CHO BẠN */}
                        <input
                          type="number"
                          min="1"
                          max={item.stock}
                          value={item.qty === 0 ? "" : item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value);
                            let newQty = isNaN(val) ? 0 : val;
                            if (newQty > item.stock) newQty = item.stock; 
                            setCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: newQty } : i)));
                          }}
                          onBlur={() => {
                            if (!item.qty || item.qty <= 0) {
                              setCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: 1 } : i)));
                            }
                          }}
                          style={{ width: "36px", background: "transparent", border: "none", outline: "none", color: "#3d1a2e", fontSize: "13px", fontWeight: 700, textAlign: "center", MozAppearance: "textfield" }}
                          className="[&::-webkit-inner-spin-button]:appearance-none"
                        />

                        <button onClick={() => updateQty(item.id, 1)} className="w-6 h-6 rounded-full flex items-center justify-center bg-gray-100"><Plus size={11} /></button>
                        <button onClick={() => removeFromCart(item.id)} className="ml-1 w-6 h-6 rounded-full flex items-center justify-center bg-red-50"><Trash2 size={11} color="#dc2626" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Customer & Payment Section (Sales) */}
            <div className="px-4 py-3 shrink-0 border-t" style={{ borderColor: "rgba(212,175,55,0.12)", background: "rgba(253,242,248,0.3)" }}>
              <div className="flex items-center gap-1.5 mb-2">
                <User size={13} color="#D4AF37" />
                <span style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 700 }}>Customer</span>
              </div>

              {selectedCustomer ? (
                <div className="flex items-center gap-3 p-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.7)", border: "1px solid rgba(212,175,55,0.25)" }}>
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F48FB1, #D4AF37)" }}>
                    <span style={{ color: "white", fontSize: "11px", fontWeight: 700 }}>{selectedCustomer.name ? selectedCustomer.name.charAt(0) : "?"}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 600 }}>{selectedCustomer.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="px-1.5 py-0.5 rounded-full" style={{ background: tierColors[selectedCustomer.tier]?.bg || "rgba(148,163,184,0.15)", color: tierColors[selectedCustomer.tier]?.color || "#64748b", fontSize: "9px", fontWeight: 700 }}>{selectedCustomer.tier}</span>
                      <span style={{ color: "#9d6b7a", fontSize: "10px" }}><Star size={9} color="#D4AF37" style={{ display: "inline", marginRight: 2 }} /> {selectedCustomer.points ? selectedCustomer.points.toLocaleString() : 0} pts</span>
                    </div>
                  </div>
                  <button onClick={() => { setSelectedCustomer(null); setCustomerPhone(""); setShowNewCustomerForm(false); }} style={{ color: "#9d6b7a" }}><XCircle size={14} /></button>
                </div>
              ) : showNewCustomerForm ? (
                <div className="p-3 rounded-xl" style={{ background: "white", border: "1px dashed rgba(212,175,55,0.4)" }}>
                  <p style={{ color: "#9d6b7a", fontSize: "11px", marginBottom: 6 }}>SĐT <strong style={{ color: "#D4AF37" }}>{customerPhone}</strong> chưa có</p>
                  <input value={newCustomerName} onChange={(e) => setNewCustomerName(e.target.value)} placeholder="Nhập tên khách hàng mới..." style={{ width: "100%", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 8, padding: "6px 10px", fontSize: "12px", outline: "none", marginBottom: 8, background: "#fdfbf7" }} />
                  <div className="flex gap-2">
                    <button onClick={createNewCustomer} disabled={!newCustomerName.trim() || isCreatingCustomer} className="flex-1 py-1.5 rounded-lg transition-all" style={{ background: (!newCustomerName.trim() || isCreatingCustomer) ? "#ccc" : "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white", fontSize: "11px", fontWeight: 600 }}>{isCreatingCustomer ? "Đang tạo..." : "+ Tạo & Chọn"}</button>
                    <button onClick={() => { setShowNewCustomerForm(false); setSelectedCustomer({ id: "1", name: "Khách vãng lai", phone: customerPhone, tier: "Silver", points: 0 }); }} className="px-3 py-1.5 rounded-lg" style={{ background: "rgba(244,63,94,0.08)", color: "#dc2626", fontSize: "11px", fontWeight: 600 }}>Bỏ qua</button>
                  </div>
                </div>
              ) : (
                <div className="flex gap-2">
                  <input value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && searchCustomer()} placeholder="Search by phone number…" style={{ flex: 1, border: "1px solid rgba(212,175,55,0.25)", borderRadius: 10, padding: "7px 12px", fontSize: "12px", outline: "none", background: "rgba(255,255,255,0.7)", color: "#3d1a2e" }} />
                  <button onClick={searchCustomer} className="px-3 rounded-xl" style={{ background: "rgba(212,175,55,0.15)", border: "1px solid rgba(212,175,55,0.3)", color: "#92740d", fontSize: "12px", fontWeight: 600 }}>Find</button>
                </div>
              )}
            </div>

            <div className="px-4 pb-4 pt-3 shrink-0" style={{ background: "rgba(255,255,255,0.4)" }}>
              <div className="space-y-1.5 mb-3 p-3 rounded-xl" style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.12)" }}>
                <div className="flex justify-between"><span style={{ color: "#9d6b7a", fontSize: "12px" }}>Subtotal</span><span style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 600 }}>{subtotal.toFixed(2)} ₫</span></div>
                <div className="flex justify-between"><span style={{ color: "#9d6b7a", fontSize: "12px" }}>VAT (10%)</span><span style={{ color: "#9d6b7a", fontSize: "12px" }}>{tax.toFixed(2)} ₫</span></div>
                <div className="flex justify-between pt-1.5 border-t" style={{ borderColor: "rgba(212,175,55,0.2)" }}><span style={{ color: "#3d1a2e", fontSize: "14px", fontWeight: 700 }}>Total Due</span><span style={{ color: "#D4AF37", fontSize: "18px", fontWeight: 800 }}>{total.toFixed(2)} ₫</span></div>
              </div>

              <div className="grid grid-cols-2 gap-2 mb-3">
                <button onClick={() => setPaymentMethod("cash")} className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all" style={{ background: paymentMethod === "cash" ? "linear-gradient(135deg, #4ade80, #22c55e)" : "rgba(255,255,255,0.6)", border: `2px solid ${paymentMethod === "cash" ? "#22c55e" : "rgba(74,222,128,0.3)"}`, boxShadow: paymentMethod === "cash" ? "0 4px 14px rgba(34,197,94,0.3)" : "none" }}>
                  <Banknote size={16} color={paymentMethod === "cash" ? "white" : "#16a34a"} /><span style={{ color: paymentMethod === "cash" ? "white" : "#16a34a", fontSize: "12px", fontWeight: 700 }}>Cash</span>
                </button>
                <button onClick={() => setPaymentMethod("bank")} className="flex items-center justify-center gap-2 py-3 rounded-xl transition-all" style={{ background: paymentMethod === "bank" ? "linear-gradient(135deg, #3b82f6, #2563eb)" : "rgba(255,255,255,0.6)", border: `2px solid ${paymentMethod === "bank" ? "#2563eb" : "rgba(59,130,246,0.3)"}`, boxShadow: paymentMethod === "bank" ? "0 4px 14px rgba(37,99,235,0.3)" : "none" }}>
                  <QrCode size={16} color={paymentMethod === "bank" ? "white" : "#2563eb"} /><span style={{ color: paymentMethod === "bank" ? "white" : "#2563eb", fontSize: "12px", fontWeight: 700 }}>Bank QR</span>
                </button>
              </div>

              <button onClick={handlePayment} disabled={cart.length === 0 || !paymentMethod} className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all" style={{ background: cart.length > 0 && paymentMethod ? "linear-gradient(135deg, #D4AF37, #C9A94E)" : "rgba(200,190,190,0.3)", boxShadow: cart.length > 0 && paymentMethod ? "0 6px 22px rgba(212,175,55,0.45)" : "none", cursor: cart.length > 0 && paymentMethod ? "pointer" : "not-allowed" }}>
                <CreditCard size={16} color={cart.length > 0 && paymentMethod ? "white" : "#aaa"} />
                <span style={{ color: cart.length > 0 && paymentMethod ? "white" : "#aaa", fontSize: "14px", fontWeight: 700 }}>Charge {total.toFixed(2)} ₫</span>
              </button>

              <button onClick={handlePrintReceipt} className="w-full mt-2 py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all hover:bg-yellow-50" style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)" }}>
                <Printer size={14} color="#D4AF37" /><span style={{ color: "#92740d", fontSize: "12px", fontWeight: 600 }}>Print Receipt</span>
              </button>
            </div>
          </>
        ) : (
          /* ====================================================================
             TAB NỘI DUNG: NHẬP HÀNG (REFILL CART)
             ==================================================================== */
          <div className="flex flex-col flex-1 min-h-0 bg-white">
            <div className="px-4 py-3 bg-red-50 border-b border-red-100 flex items-center gap-2">
               <Package size={16} color="#dc2626" />
               <span style={{color: "#dc2626", fontSize: "12px", fontWeight: 600}}>Gửi yêu cầu Kế toán mua hàng</span>
            </div>
            
            <div className="flex-1 overflow-y-auto px-4 py-3" style={{ scrollbarWidth: "thin" }}>
              {refillCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full" style={{ opacity: 0.5 }}>
                  <Package size={36} color="#dc2626" strokeWidth={1} />
                  <p style={{ color: "#9d6b7a", fontSize: "13px", marginTop: 12 }}>Chưa chọn mặt hàng nào</p>
                  <p style={{ color: "#c9a0b0", fontSize: "11px", marginTop: 4 }}>Click sản phẩm bên trái để xin nhập</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {refillCart.map((item) => (
                    <div key={item.id} className="flex gap-3 p-3 rounded-xl border border-gray-100 shadow-sm">
                      <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-gray-200">
                        <ImageWithFallback src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1">
                        <p style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 700, lineHeight: 1.2 }}>{item.name}</p>
                        <p style={{ color: "#9d6b7a", fontSize: "10px", marginTop: 2 }}>Tồn kho: <strong className={item.stock === 0 ? "text-red-500" : ""}>{item.stock}</strong></p>
                        
                        <div className="flex items-center gap-2 mt-2">
                          <span style={{ fontSize: "11px", color: "#666" }}>Xin nhập:</span>
                          <div className="flex items-center rounded-md border border-gray-200 overflow-hidden bg-gray-50">
                            <button onClick={() => updateRefillQty(item.id, -1)} className="px-2 py-1 hover:bg-gray-200"><Minus size={10} /></button>
                            <input
                              type="number"
                              min="1"
                              value={item.qty === 0 ? "" : item.qty}
                              onChange={(e) => {
                                const val = parseInt(e.target.value);
                                let newQty = isNaN(val) ? 1 : val; // Nhập hàng thì không giới hạn số lượng max
                                setRefillCart((prev) => prev.map((i) => (i.id === item.id ? { ...i, qty: newQty } : i)));
                              }}
                              style={{ width: "36px", background: "transparent", border: "none", outline: "none", color: "#3d1a2e", fontSize: "12px", fontWeight: 700, textAlign: "center", MozAppearance: "textfield" }}
                              className="[&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <button onClick={() => updateRefillQty(item.id, 1)} className="px-2 py-1 hover:bg-gray-200"><Plus size={10} /></button>
                          </div>
                          <button onClick={() => removeFromRefill(item.id)} className="ml-auto p-1 text-red-500 hover:bg-red-50 rounded"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-4 border-t bg-gray-50">
               <label className="flex items-center gap-1.5 mb-2" style={{ color: "#3d1a2e", fontSize: "12px", fontWeight: 600 }}>
                 <MessageSquare size={14} color="#D4AF37"/> Ghi chú (Lý do)
               </label>
               <textarea 
                  value={refillNote}
                  onChange={e => setRefillNote(e.target.value)}
                  placeholder="VD: Khách dặn mua, Cần cho cuối tuần..."
                  className="w-full p-2 rounded-lg border border-gray-200 outline-none text-[12px] mb-3 resize-none h-16"
               />
               <button
                onClick={submitRefillRequest}
                disabled={refillCart.length === 0}
                className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ background: refillCart.length > 0 ? "#dc2626" : "#ccc", color: "white", fontSize: "14px", fontWeight: 700 }}
              >
                <Send size={16} /> Gửi Phiếu Yêu Cầu
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── QR Modal ─────────────────────────────────────────────────────────── */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(61,26,46,0.6)", backdropFilter: "blur(6px)" }}>
          <div
            className="rounded-2xl p-8 text-center"
            style={{ background: "white", width: 340, boxShadow: "0 24px 60px rgba(61,26,46,0.3)" }}
          >
            <div className="flex items-center gap-2 justify-center mb-4">
              <QrCode size={20} color="#D4AF37" />
              <h2 style={{ color: "#3d1a2e", fontSize: "16px", fontWeight: 700 }}>Bank Transfer</h2>
            </div>
            <div
              className="w-44 h-44 rounded-2xl overflow-hidden mx-auto mb-4"
              style={{ border: "3px solid rgba(212,175,55,0.3)" }}
            >
              <ImageWithFallback
                src="https://images.unsplash.com/photo-1595079836278-25b7ad6d5ddb?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=300"
                alt="QR Code"
                className="w-full h-full object-cover"
              />
            </div>
            <p style={{ color: "#9d6b7a", fontSize: "12px", marginBottom: 4 }}>Lumière Beauty Studio</p>
            <p style={{ color: "#3d1a2e", fontSize: "18px", fontWeight: 800, marginBottom: 2 }}>VCB — 123 456 789 000</p>
            <p style={{ color: "#D4AF37", fontSize: "22px", fontWeight: 800, marginBottom: 16 }}>{total.toFixed(2)} ₫</p>
            <p style={{ color: "#9d6b7a", fontSize: "11px", marginBottom: 16 }}>Content: INV-{Date.now().toString().slice(-6)}</p>
            
            <button
              onClick={confirmBankPayment}
              disabled={isProcessing}
              className="w-full py-3 rounded-xl transition-all"
              style={{ 
                background: isProcessing ? "#9ca3af" : "linear-gradient(135deg, #D4AF37, #C9A94E)", 
                color: "white", 
                fontWeight: 700, 
                fontSize: "14px", 
                boxShadow: isProcessing ? "none" : "0 6px 20px rgba(212,175,55,0.4)",
                cursor: isProcessing ? "not-allowed" : "pointer"
              }}
            >
              {isProcessing ? "Đang kết nối CSDL..." : "✓ Confirm Payment Received"}
            </button>

            <button
              onClick={() => setShowQR(false)}
              disabled={isProcessing}
              className="w-full mt-2 py-2.5 rounded-xl transition-all"
              style={{ 
                background: "rgba(244,63,94,0.08)", 
                color: "#dc2626", 
                fontWeight: 600, 
                fontSize: "13px",
                cursor: isProcessing ? "not-allowed" : "pointer",
                opacity: isProcessing ? 0.5 : 1 
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* ── Success Modal ─────────────────────────────────────────────────────── */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(61,26,46,0.5)", backdropFilter: "blur(6px)" }}>
          <div
            className="rounded-2xl p-10 text-center"
            style={{ background: "white", width: 320, boxShadow: "0 24px 60px rgba(61,26,46,0.3)" }}
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ background: "linear-gradient(135deg, #4ade80, #22c55e)", boxShadow: "0 8px 24px rgba(34,197,94,0.4)" }}
            >
              <CheckCircle2 size={32} color="white" />
            </div>
            <h2 style={{ color: "#3d1a2e", fontSize: "18px", fontWeight: 700, marginBottom: 6 }}>Payment Successful!</h2>
            <p style={{ color: "#D4AF37", fontSize: "22px", fontWeight: 800, marginBottom: 4 }}>{total.toFixed(2)} ₫</p>
            <p style={{ color: "#9d6b7a", fontSize: "12px" }}>Transaction complete. Thank you!</p>
          </div>
        </div>
      )}

      {/* --- CUSTOM TOAST NOTIFICATION --- */}
      {toastMessage && (
        <div 
          className="fixed bottom-10 right-10 z-[100] flex items-center gap-4 px-6 py-4 rounded-2xl shadow-2xl transition-all duration-300"
          style={{ background: "#3d1a2e", border: "1px solid rgba(212,175,55,0.4)" }}
        >
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: "rgba(212,175,55,0.2)" }}>
            <Package size={20} color="#D4AF37" />
          </div>
          <div>
            <h4 style={{ color: "#D4AF37", fontSize: "14px", fontWeight: 700 }}>Thông báo hệ thống</h4>
            <p style={{ color: "rgba(255,255,255,0.9)", fontSize: "12px", marginTop: 2, maxWidth: "250px" }} className="line-clamp-2">
              {toastMessage}
            </p>
          </div>
          <button onClick={() => setToastMessage("")} style={{ color: "#9d6b7a", marginLeft: 10 }} className="hover:text-white transition-colors cursor-pointer">
            <XCircle size={18} />
          </button>
        </div>
      )}

    </div>
  );
}