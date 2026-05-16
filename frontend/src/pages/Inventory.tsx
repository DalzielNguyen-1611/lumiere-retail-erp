import { useState, useEffect, useMemo } from "react";
import { Search, Plus, AlertTriangle, Package, X, ShoppingCart, Trash2, Minus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const glassCard = {
  background: "rgba(255,255,255,0.72)",
  backdropFilter: "blur(20px)",
  WebkitBackdropFilter: "blur(20px)",
  border: "1px solid rgba(255,255,255,0.9)",
  boxShadow: "0 8px 32px rgba(61,26,46,0.06)",
  borderRadius: "20px",
};

const statusStyle: Record<string, { bg: string; color: string; dot: string }> = {
  "In Stock": { bg: "rgba(74,222,128,0.12)", color: "#16a34a", dot: "#4ade80" },
  "Low Stock": { bg: "rgba(212,175,55,0.15)", color: "#92740d", dot: "#D4AF37" },
  "Out of Stock": { bg: "rgba(244,63,94,0.1)", color: "#dc2626", dot: "#f43f5e" },
};

const BACKEND_URL = "http://localhost:5000";

const getImageUrl = (imagePath: string) => {
  if (!imagePath) return "/placeholder.png";
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

export function Inventory() {
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  // States cho tính năng cũ
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const [newProduct, setNewProduct] = useState({
    name: "", sku: "", category: "Sữa rửa mặt", price: "", stock: "", isSellable: true
  });

  // ==========================================
  // THÊM MỚI: STATES CHO REFILL CART (SLIDEBAR)
  // ==========================================
  const [refillCart, setRefillCart] = useState<any[]>([]);
  const [isRefillSidebarOpen, setIsRefillSidebarOpen] = useState(false);
  const [refillNote, setRefillNote] = useState("");

  const fetchInventory = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/inventory/products'); 
      const json = await response.json();
      if (json.status === 'success') {
        setProducts(json.data);
      }
    } catch (error) {
      console.error("Lỗi kết nối database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleSaveProduct = async () => {
    if (!newProduct.name || !newProduct.price) {
      alert("Vui lòng nhập Tên và Giá sản phẩm!");
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch('http://localhost:5000/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProduct)
      });
      const json = await response.json();
      if (json.status === 'success') {
        setIsModalOpen(false); 
        setNewProduct({ name: "", sku: "", category: "Sữa rửa mặt", price: "", stock: "", isSellable: true }); 
        fetchInventory(); 
      } else {
        alert("Lỗi từ DB: " + json.message);
      }
    } catch (error) {
      alert("Lỗi kết nối máy chủ!");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Hàm thêm sản phẩm vào Giỏ Refill
  const handleAddToRefill = (product: any) => {
    const existing = refillCart.find(item => item.id === product.id);
    if (!existing) {
      setRefillCart([...refillCart, { ...product, requestQty: 10 }]); // Mặc định xin nhập 10 cái
      setToastMessage(`Đã thêm ${product.name} vào danh sách chờ Refill`);
      setTimeout(() => setToastMessage(""), 3000);
    } else {
      setIsRefillSidebarOpen(true); // Nếu có rồi thì mở khay ra luôn
    }
  };

  // Hàm thay đổi số lượng trong Giỏ Refill
  const updateRefillQty = (id: number, delta: number) => {
    setRefillCart(refillCart.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.requestQty + delta); // Tối thiểu là 1
        return { ...item, requestQty: newQty };
      }
      return item;
    }));
  };

  // Hàm xóa khỏi Giỏ Refill
  const removeFromRefill = (id: number) => {
    setRefillCart(refillCart.filter(item => item.id !== id));
  };

  // Hàm Gửi yêu cầu mua hàng
  const handleSubmitRefillRequest = () => {
    if (refillCart.length === 0) return;
    
    // Tạm thời giả lập thành công (Sau này sẽ gọi API tạo Hóa đơn mua hàng ở đây)
    setIsRefillSidebarOpen(false);
    setRefillCart([]);
    setRefillNote("");
    setToastMessage("Đã gửi Yêu cầu nhập kho thành công tới phòng Kế toán!");
    setTimeout(() => setToastMessage(""), 4000);
  };

  const stats = useMemo(() => {
    let inStock = 0, lowStock = 0, outOfStock = 0;
    products.forEach(p => {
      if (p.status === "In Stock") inStock++;
      else if (p.status === "Low Stock") lowStock++;
      else if (p.status === "Out of Stock") outOfStock++;
    });
    return [
      { label: "Total Products", value: products.length.toString(), icon: Package, color: "#D4AF37" },
      { label: "In Stock", value: inStock.toString(), icon: Package, color: "#4ade80" },
      { label: "Low Stock", value: lowStock.toString(), icon: AlertTriangle, color: "#D4AF37" },
      { label: "Out of Stock", value: outOfStock.toString(), icon: AlertTriangle, color: "#f43f5e" },
    ];
  }, [products]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const safeName = p.name ? String(p.name) : "";
      const safeSku = p.sku ? String(p.sku) : "";
      return safeName.toLowerCase().includes(searchQuery.toLowerCase()) || safeSku.toLowerCase().includes(searchQuery.toLowerCase());
    });
  }, [products, searchQuery]);

  return (
    <div className="p-8 min-h-screen relative overflow-hidden">
      {/* --- HEADER --- */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <p style={{ color: "#9d6b7a", fontSize: "13px", fontWeight: 500, letterSpacing: "0.05em" }}>Product Management</p>
          <h1 style={{ color: "#3d1a2e", fontSize: "26px", fontWeight: 700, marginTop: 2 }}>Inventory</h1>
        </div>
        
        <div className="flex items-center gap-4">
          {/* NÚT MỞ GIỎ HÀNG REFILL */}
          <button
            onClick={() => setIsRefillSidebarOpen(true)}
            className="relative flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:scale-105 cursor-pointer"
            style={{ background: "white", border: "1px solid rgba(212,175,55,0.4)", color: "#92740d", fontSize: "13px", fontWeight: 600, boxShadow: "0 6px 20px rgba(61,26,46,0.05)" }}
          >
            <ShoppingCart size={16} /> 
            Refill Cart
            {refillCart.length > 0 && (
              <span className="absolute -top-2 -right-2 flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold text-white" style={{ background: "#dc2626" }}>
                {refillCart.length}
              </span>
            )}
          </button>

          {/* NÚT THÊM SẢN PHẨM (Tạm giữ theo ý bạn) */}
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl transition-all hover:scale-105 cursor-pointer"
            style={{ background: "linear-gradient(135deg, #D4AF37, #C9A94E)", boxShadow: "0 6px 20px rgba(212,175,55,0.4)", color: "white", fontSize: "13px", fontWeight: 600 }}
          >
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-5 mb-6">
        {stats.map((s) => (
          <div key={s.label} style={glassCard} className="p-5 flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ background: `${s.color}20` }}>
              <s.icon size={22} color={s.color} strokeWidth={1.8} />
            </div>
            <div>
              <p style={{ color: "#9d6b7a", fontSize: "12px" }}>{s.label}</p>
              <p style={{ color: "#3d1a2e", fontSize: "22px", fontWeight: 700 }}>{isLoading ? "..." : s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={glassCard}>
        <div className="p-6 pb-4">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl" style={{ background: "rgba(255,255,255,0.6)", border: "1px solid rgba(212,175,55,0.2)" }}>
              <Search size={15} color="#9d6b7a" />
              <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search inventory..." style={{ border: "none", outline: "none", background: "transparent", color: "#3d1a2e", fontSize: "13px", width: "220px" }} />
            </div>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr style={{ borderBottom: "1px solid rgba(212,175,55,0.15)" }}>
                  {["Product Info", "Category", "Price", "Stock", "Status", ""].map((h, index) => (
                    <th key={index} style={{ color: "#9d6b7a", fontSize: "11px", fontWeight: 600, letterSpacing: "0.08em", padding: "10px 12px", textAlign: h === "" ? "right" : "left" }}>
                      {h.toUpperCase()}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#9d6b7a]">Đang tải dữ liệu từ Database...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-10 text-[#9d6b7a]">Không tìm thấy sản phẩm nào.</td></tr>
                ) : (
                  filteredProducts.map((p) => {
                    const isInCart = refillCart.some(item => item.id === p.id); // Kiểm tra xem SP đã chọn chưa

                    return (
                      <tr key={p.id} style={{ borderBottom: "1px solid rgba(212,175,55,0.08)" }} className={`transition-all hover:bg-[rgba(212,175,55,0.03)] ${isInCart ? "bg-[rgba(212,175,55,0.05)]" : ""}`}>
                        <td style={{ padding: "12px" }}>
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0" style={{ border: isInCart ? "2px solid #D4AF37" : "1px solid rgba(212,175,55,0.2)" }}>
                              <ImageWithFallback src={getImageUrl(p.img)} alt={p.name} className="w-full h-full object-cover" />
                            </div>
                            <div className="flex flex-col justify-center">
                              <span style={{ color: "#3d1a2e", fontSize: "13px", fontWeight: 600, lineHeight: "1.2" }} className="line-clamp-2 max-w-[250px]">{p.name}</span>
                              <span style={{ color: "#9d6b7a", fontSize: "11px", fontFamily: "monospace", marginTop: "4px" }}>SKU: {p.sku}</span>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="px-2.5 py-1 rounded-full" style={{ background: "rgba(212,175,55,0.1)", color: "#92740d", fontSize: "11px", fontWeight: 600 }}>
                            {p.category}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ color: "#3d1a2e", fontSize: "13px", fontWeight: 700 }}>
                            {Number(p.price).toLocaleString('vi-VN')} đ
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span style={{ color: p.stock === 0 ? "#dc2626" : p.stock < 50 ? "#92740d" : "#3d1a2e", fontSize: "13px", fontWeight: 600 }}>
                            {p.stock}
                          </span>
                        </td>
                        <td style={{ padding: "12px" }}>
                          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full w-fit" style={{ background: statusStyle[p.status]?.bg || "#eee", color: statusStyle[p.status]?.color || "#333", fontSize: "11px", fontWeight: 600 }}>
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusStyle[p.status]?.dot || "#999" }} />{p.status}
                          </span>
                        </td>
                        
                        {/* NÚT THÊM VÀO GIỎ REFILL */}
                        <td style={{ padding: "12px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleAddToRefill(p)}
                            className="px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all hover:scale-105 cursor-pointer flex items-center justify-end ml-auto gap-1.5" 
                            style={{ 
                              background: isInCart ? "#D4AF37" : (p.stock <= 0 ? "#dc2626" : "rgba(212,175,55,0.1)"), 
                              color: isInCart ? "white" : (p.stock <= 0 ? "white" : "#92740d"),
                              boxShadow: (p.stock <= 0 && !isInCart) ? "0 4px 10px rgba(220,38,38,0.2)" : (isInCart ? "0 4px 10px rgba(212,175,55,0.3)" : "none")
                            }}
                          >
                            {isInCart ? "✓ In List" : "+ Refill"}
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* =========================================================
          SLIDEBAR: REFILL CART (GIỎ HÀNG YÊU CẦU NHẬP)
          ========================================================= */}
      {isRefillSidebarOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Nền đen mờ (Click để đóng) */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm cursor-pointer transition-opacity" onClick={() => setIsRefillSidebarOpen(false)} />
          
          {/* Nội dung Slidebar trượt từ phải sang */}
          <div className="relative w-full max-w-md h-full flex flex-col shadow-2xl transition-transform transform translate-x-0" style={{ background: "#fdfbfcb3", backdropFilter: "blur(20px)" }}>
            
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b" style={{ borderColor: "rgba(212,175,55,0.15)", background: "white" }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: "rgba(212,175,55,0.1)" }}>
                  <ShoppingCart size={18} color="#D4AF37" />
                </div>
                <div>
                  <h2 style={{ color: "#3d1a2e", fontSize: "16px", fontWeight: 700 }}>Refill Request Cart</h2>
                  <p style={{ color: "#9d6b7a", fontSize: "12px" }}>{refillCart.length} items selected</p>
                </div>
              </div>
              <button onClick={() => setIsRefillSidebarOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors">
                <X size={18} color="#9d6b7a" />
              </button>
            </div>

            {/* Body (Danh sách sản phẩm) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {refillCart.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center opacity-60">
                  <Package size={48} color="#D4AF37" className="mb-4" />
                  <p style={{ color: "#3d1a2e", fontSize: "14px", fontWeight: 600 }}>Giỏ yêu cầu trống</p>
                  <p style={{ color: "#9d6b7a", fontSize: "12px", marginTop: 4 }}>Hãy chọn sản phẩm bên ngoài để thêm vào đây.</p>
                </div>
              ) : (
                refillCart.map((item) => (
                  <div key={item.id} className="flex gap-4 p-4 rounded-2xl bg-white border" style={{ borderColor: "rgba(212,175,55,0.15)", boxShadow: "0 4px 15px rgba(61,26,46,0.03)" }}>
                    <div className="w-16 h-16 rounded-xl overflow-hidden shrink-0" style={{ border: "1px solid rgba(212,175,55,0.2)" }}>
                      <ImageWithFallback src={getImageUrl(item.img)} alt={item.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <h4 style={{ color: "#3d1a2e", fontSize: "13px", fontWeight: 700, lineHeight: 1.3 }} className="line-clamp-2">{item.name}</h4>
                      <p style={{ color: "#9d6b7a", fontSize: "11px", marginTop: 2 }}>Tồn kho hiện tại: <strong className={item.stock === 0 ? "text-red-500" : ""}>{item.stock}</strong></p>
                      
                      {/* Cụm input tăng giảm số lượng */}
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: "rgba(212,175,55,0.2)", background: "rgba(253,242,248,0.5)" }}>
                          <button onClick={() => updateRefillQty(item.id, -1)} className="w-8 h-7 flex items-center justify-center hover:bg-[rgba(212,175,55,0.1)] transition-colors"><Minus size={12} color="#9d6b7a" /></button>
                          <input 
                            type="number" 
                            value={item.requestQty} 
                            onChange={(e) => {
                              const val = parseInt(e.target.value) || 1;
                              setRefillCart(refillCart.map(i => i.id === item.id ? { ...i, requestQty: val } : i));
                            }}
                            className="w-10 text-center text-[12px] font-bold bg-transparent outline-none" 
                            style={{ color: "#3d1a2e" }}
                          />
                          <button onClick={() => updateRefillQty(item.id, 1)} className="w-8 h-7 flex items-center justify-center hover:bg-[rgba(212,175,55,0.1)] transition-colors"><Plus size={12} color="#9d6b7a" /></button>
                        </div>
                        <button onClick={() => removeFromRefill(item.id)} className="w-7 h-7 rounded-lg flex items-center justify-center ml-auto transition-colors hover:bg-red-50">
                          <Trash2 size={14} color="#ef4444" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            <div className="p-6 bg-white border-t" style={{ borderColor: "rgba(212,175,55,0.15)" }}>
              <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>Ghi chú gửi Kế toán (Tùy chọn)</label>
              <textarea 
                value={refillNote}
                onChange={(e) => setRefillNote(e.target.value)}
                placeholder="VD: Cần gấp lô mặt nạ cho event cuối tuần..."
                className="w-full mt-2 p-3 rounded-xl outline-none resize-none h-20" 
                style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }}
              />
              <button 
                onClick={handleSubmitRefillRequest}
                disabled={refillCart.length === 0}
                className="w-full mt-4 py-4 rounded-xl font-bold transition-all flex items-center justify-center gap-2"
                style={{ 
                  background: refillCart.length === 0 ? "#e5e7eb" : "linear-gradient(135deg, #D4AF37, #C9A94E)", 
                  color: refillCart.length === 0 ? "#9ca3af" : "white", 
                  boxShadow: refillCart.length === 0 ? "none" : "0 8px 24px rgba(212,175,55,0.4)" 
                }}
              >
                Gửi yêu cầu ({refillCart.length} món)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL THÊM SẢN PHẨM (Tạm giữ nguyên như cũ) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center" style={{ background: "rgba(61,26,46,0.6)", backdropFilter: "blur(6px)" }}>
          <div className="p-8 rounded-3xl w-full max-w-md relative" style={{ background: "white", boxShadow: "0 24px 60px rgba(61,26,46,0.2)" }}>
            <button onClick={() => setIsModalOpen(false)} className="absolute top-6 right-6 cursor-pointer" style={{ color: "#9d6b7a" }}><X size={20} /></button>
            <h2 style={{ color: "#3d1a2e", fontSize: "20px", fontWeight: 700, marginBottom: 20 }}>Add New Product</h2>
            
            <div className="space-y-4">
              <div>
                <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>Product Name *</label>
                <input value={newProduct.name} onChange={e => setNewProduct({...newProduct, name: e.target.value})} className="w-full mt-1 p-3 rounded-xl outline-none" style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }} placeholder="Enter product name..." />
              </div>
              
              <div className="flex gap-4">
                <div className="flex-1">
                  <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>Category</label>
                  <select 
                    value={newProduct.category} 
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})} 
                    className="w-full mt-1 p-3 rounded-xl outline-none" 
                    style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }}
                  >
                    <option value="Sữa rửa mặt">Sữa rửa mặt</option>
                    <option value="Dưỡng ẩm">Dưỡng ẩm</option>
                    <option value="Mặt nạ giấy">Mặt nạ giấy</option>
                    <option value="Kem chống nắng">Kem chống nắng</option>
                    <option value="Sản phẩm nội bộ">Sản phẩm nội bộ</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>SKU / Barcode</label>
                  <input value={newProduct.sku} onChange={e => setNewProduct({...newProduct, sku: e.target.value})} className="w-full mt-1 p-3 rounded-xl outline-none" style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }} placeholder="Auto-generated if empty" />
                </div>
              </div>

              <div className="flex gap-4">
                <div className="flex-1">
                  <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>Price ($) *</label>
                  <input type="number" value={newProduct.price} onChange={e => setNewProduct({...newProduct, price: e.target.value})} className="w-full mt-1 p-3 rounded-xl outline-none" style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }} placeholder="0" />
                </div>
                <div className="flex-1">
                  <label style={{ color: "#9d6b7a", fontSize: "12px", fontWeight: 600 }}>Initial Stock</label>
                  <input type="number" value={newProduct.stock} onChange={e => setNewProduct({...newProduct, stock: e.target.value})} className="w-full mt-1 p-3 rounded-xl outline-none" style={{ background: "rgba(253,242,248,0.5)", border: "1px solid rgba(212,175,55,0.2)", color: "#3d1a2e", fontSize: "13px" }} placeholder="0" />
                </div>
              </div>

              <label className="flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all mt-4" style={{ background: newProduct.isSellable ? "rgba(212,175,55,0.08)" : "rgba(253,242,248,0.5)", border: newProduct.isSellable ? "1px solid rgba(212,175,55,0.3)" : "1px solid rgba(212,175,55,0.1)" }}>
                <div className="relative flex items-center justify-center shrink-0">
                  <input
                    type="checkbox"
                    checked={newProduct.isSellable}
                    onChange={e => setNewProduct({...newProduct, isSellable: e.target.checked})}
                    className="peer appearance-none w-5 h-5 rounded border-2 transition-all cursor-pointer"
                    style={{ borderColor: newProduct.isSellable ? "#D4AF37" : "#c9a0b0", background: newProduct.isSellable ? "#D4AF37" : "transparent" }}
                  />
                  <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p style={{ color: "#3d1a2e", fontSize: "13px", fontWeight: 700 }}>Can be sold (Sản phẩm thương mại)</p>
                  <p style={{ color: "#9d6b7a", fontSize: "11px", marginTop: "2px" }}>Đánh dấu để hiển thị trên màn hình POS.</p>
                </div>
              </label>

              <button 
                onClick={handleSaveProduct}
                disabled={isSubmitting}
                className="w-full mt-4 py-3.5 rounded-xl font-bold transition-all cursor-pointer"
                style={{ background: isSubmitting ? "#ccc" : "linear-gradient(135deg, #D4AF37, #C9A94E)", color: "white", boxShadow: isSubmitting ? "none" : "0 8px 24px rgba(212,175,55,0.4)" }}
              >
                {isSubmitting ? "Saving..." : "Save Product"}
              </button>
            </div>
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
            <X size={18} />
          </button>
        </div>
      )}

    </div>
  );
}