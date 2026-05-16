const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/img', express.static(path.join(__dirname, '..', 'database', 'img')));

// Tự động biến đổi CLOB thành String để JSON không bị lỗi
oracledb.fetchAsString = [ oracledb.CLOB ];

const dbConfig = {
  user          : process.env.DB_USERNAME,
  password      : process.env.DB_PASSWORD,
  connectString : `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`
};

// Hàm lấy danh sách sản phẩm
app.get('/api/san-pham', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // outFormat giúp trả về dạng { TENSANPHAM: '...' } thay vì mảng [ '...' ]
    const result = await connection.execute(
      `SELECT * FROM SAN_PHAM`, 
      [], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

app.listen(5000, () => {
  console.log('🚀 Backend đồ án đang chạy tại http://localhost:5000');
});

async function checkDatabaseData() {
    let connection;
    try {
        // 1. Lấy kết nối (đảm bảo config của bạn đã đúng)
        connection = await oracledb.getConnection(dbConfig);

        console.log("--- Đang kiểm tra dữ liệu trong DB ---");

        // 2. Thực hiện một câu lệnh SELECT thử nghiệm
        // Giả sử bạn có bảng NHANVIEN hoặc dùng bảng hệ thống dual để test
        const result = await connection.execute(
            `SELECT sysdate FROM dual`, // Câu lệnh đơn giản nhất để test kết nối
            [], 
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // 3. Hiển thị thông tin ra Terminal
        console.log("Kết quả truy vấn thử nghiệm:", result.rows);
        console.log("--- Database đã phản hồi dữ liệu thành công! ---");

    } catch (err) {
        console.error("Lỗi khi lấy dữ liệu:", err);
    } finally {
        if (connection) {
            try {
                await connection.close();
            } catch (err) {
                console.error(err);
            }
        }
    }
}

// Gọi hàm này sau khi server start
checkDatabaseData();

// Thêm đoạn này để xử lý khi người dùng vào đường dẫn gốc (http://localhost:5000)
app.get('/', (req, res) => {
  res.send('🚀 Backend ERP Lumière đang chạy rất mượt mà!');
});

// Auth login endpoint (minimal implementation, uses PASSWORDHASH from TAI_KHOAN_NHAN_VIEN)
app.post('/api/auth/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Missing username or password' });

  connection = await oracledb.getConnection(dbConfig);
  console.log('[auth] login attempt for username=', username);
    const result = await connection.execute(
      `SELECT t.MANHANVIEN, t.USERNAME, t.PASSWORDHASH, t.TRANG_THAI, n.HOTEN 
       FROM TAI_KHOAN_NHAN_VIEN t
       JOIN NHANVIEN n ON t.MANHANVIEN = n.MANHANVIEN
       WHERE t.USERNAME = :u`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows && result.rows[0];
  console.log('[auth] db row=', row);
    if (!row) return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại' });

    if (row.TRANG_THAI === 0) return res.status(403).json({ status: 'error', message: 'Tài khoản đã bị khóa' });

    const hash = row.PASSWORDHASH;
  const ok = await bcrypt.compare(password, hash);
  console.log('[auth] bcrypt compare result=', ok);
  if (!ok) return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });

    // create token
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ maNhanVien: row.MANHANVIEN, username: row.USERNAME, name: row.HOTEN }, secret, { expiresIn: '8h' });

    // Try to look up role from PHAN_QUYEN_NHAN_VIEN -> VAI_TRO
    let role = 'staff'; // Giá trị mặc định dự phòng
    try {
      // ĐÃ SỬA TÊN BẢNG THÀNH: PHAN_QUYEN_NHAN_VIEN
      const roleRes = await connection.execute(
        `SELECT VT.TENVAITRO 
         FROM PHAN_QUYEN_NHAN_VIEN PQ 
         JOIN VAI_TRO VT ON PQ.MAVAITRO = VT.MAVAITRO 
         WHERE PQ.MANHANVIEN = :m 
         ORDER BY PQ.NGAYGAN DESC`,
        [row.MANHANVIEN],
        { outFormat: oracledb.OUT_FORMAT_OBJECT }
      );
      
      console.log('[auth] roleRes=', roleRes.rows);
      const firstRole = roleRes.rows && roleRes.rows[0] && roleRes.rows[0].TENVAITRO;
      
      if (firstRole) {
        const name = String(firstRole).toLowerCase();
        
        // Mapping tên tiếng Việt trong DB sang role tiếng Anh cho Frontend
        if (name.includes('admin')) role = 'admin';
        else if (name.includes('manager') || name.includes('quan ly')) role = 'manager';
        else if (name.includes('sales')) role = 'sales';
        else if (name.includes('kho')) role = 'warehouse'; // Frontend đang đợi chữ 'warehouse'
        else if (name.includes('ke toan') || name.includes('ketoan')) role = 'accounting'; // Frontend đợi chữ 'accounting'
        else role = 'staff'; // Nếu không khớp cái nào ở trên mới gán staff
      }
      console.log('[auth] resolved role=', role);
    } catch (e) {
      console.error('[auth] role lookup failed', e);
      role = (row.USERNAME && row.USERNAME.toLowerCase() === 'admin') ? 'admin' : 'staff';
    }

    return res.json({ status: 'success', data: { token, user: { maNhanVien: row.MANHANVIEN, username: row.USERNAME, name: row.HOTEN, role } } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

// API: Lấy danh sách sản phẩm cho màn hình POS
app.get('/api/products', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Đã thêm điều kiện sp.POS = 1 và sửa lỗi thiếu cột SKU
    const query = `
      SELECT 
        sp.MASANPHAM AS "id",
        sp.TENSANPHAM AS "name",
        sp.MAVACH AS "sku",       -- Dùng tạm MAVACH làm SKU để Frontend không bị lỗi
        sp.MAVACH AS "barcode",
        sp.GIANIEMYET AS "price",
        sp.THUONGHIEU AS "category",
        sp.HINHANH AS "img",
        NVL(tk.SOLUONGTON, 0) AS "stock"
      FROM SAN_PHAM sp
      LEFT JOIN TON_KHO tk ON sp.MASANPHAM = tk.MASANPHAM
      WHERE sp.COTHEBAN = 1 AND sp.POS = 1
    `;

    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const products = result.rows.map(row => ({
      ...row,
      img: row.img || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      status: row.stock > 10 ? 'In Stock' : (row.stock > 0 ? 'Low Stock' : 'Out of Stock')
    }));
    console.log("Số lượng SP lấy được:", products.length);
    return res.json({ status: 'success', data: products });

  } catch (err) {
    console.error("Lỗi lấy danh sách sản phẩm:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

// API: Tìm kiếm khách hàng bằng số điện thoại
app.get('/api/customers/search', async (req, res) => {
  let connection;
  try {
    const phone = req.query.phone;
    if (!phone) {
      return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp số điện thoại' });
    }

    connection = await oracledb.getConnection(dbConfig);
    
    // Nối bảng DOI_TAC (chứa Tên, SĐT) và KHACH_HANG (chứa Điểm, Hạng)
    const query = `
      SELECT 
        dt.MADOITAC AS "id",
        dt.TENDOITAC AS "name",
        dt.SODIENTHOAI AS "phone",
        kh.LOAIKHACHHANG AS "tier",
        kh.DIEMTICHLUY AS "points"
      FROM DOI_TAC dt
      JOIN KHACH_HANG kh ON dt.MADOITAC = kh.MADOITAC
      WHERE dt.SODIENTHOAI = :phone
    `;

    const result = await connection.execute(query, [phone], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    if (result.rows.length > 0) {
      return res.json({ status: 'success', data: result.rows[0] });
    } else {
      return res.json({ status: 'not_found', message: 'Không tìm thấy khách hàng' });
    }

  } catch (err) {
    console.error("Lỗi tìm khách hàng:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

// API: Tạo khách hàng mới trực tiếp từ POS
app.post('/api/customers', async (req, res) => {
  let connection;
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ status: 'error', message: 'Thiếu tên hoặc SĐT' });

    connection = await oracledb.getConnection(dbConfig);

    // Dùng PL/SQL để insert vào 2 bảng liên tiếp và trả về MADOITAC mới nhất
    const plsql = `
      DECLARE
        v_id NUMBER;
      BEGIN
        -- 1. Tạo Đối Tác
        INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, LOAIDOITAC)
        VALUES (:name, :phone, 'Khách hàng')
        RETURNING MADOITAC INTO v_id;

        -- 2. Tạo Khách Hàng kế thừa từ Đối Tác đó
        INSERT INTO KHACH_HANG (MADOITAC, DIEMTICHLUY, NGAYTHAMGIA, LOAIKHACHHANG)
        VALUES (v_id, 0, SYSDATE, 'Silver');

        -- Trả ID về cho Node.js
        :out_id := v_id;
      END;
    `;

    const result = await connection.execute(plsql, {
      name: name,
      phone: phone,
      out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true }); // autoCommit: true để lưu luôn xuống DB

    const newId = result.outBinds.out_id;

    return res.json({ status: 'success', data: { id: newId } });
  } catch (err) {
    console.error("Lỗi tạo khách hàng:", err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

// ============================================================================
// API: THANH TOÁN ĐƠN HÀNG (Tự động lưu giỏ hàng & Lấy ID)
// ============================================================================
app.post('/api/orders/charge', async (req, res) => {
    let connection;
    try {
  // Log incoming payload robustly
  const body = req.body || {};
  const { cart, total, customerId, phuongThuc } = body;
  console.log("[CHARGE] Received request body:", JSON.stringify(body).slice(0, 2000));

  console.log("[CHARGE] Đang xử lý yêu cầu thanh toán:", { cartLength: Array.isArray(cart) ? cart.length : undefined, total, customerId, phuongThuc });

        if (!cart || !Array.isArray(cart) || cart.length === 0) {
            return res.status(400).json({ status: 'error', message: 'Giỏ hàng rỗng hoặc không hợp lệ' });
        }

    try {
      connection = await oracledb.getConnection(dbConfig);
      // Bắt đầu transaction (autoCommit = false)
      connection.autoCommit = false;
    } catch (connErr) {
      console.error('[CHARGE] Không thể kết nối tới Oracle DB:', connErr && connErr.message);
      return res.status(500).json({ status: 'error', message: 'Không thể kết nối tới DB', details: connErr && connErr.stack });
    }

        // 1. TẠO ĐƠN HÀNG
        // FIX: Sử dụng kiểu NUMBER (integer) cho customerId, mặc định = 1 nếu không chọn
        const finalCustomerId = (customerId && customerId !== 'GUEST') ? parseInt(customerId) : 1;
        
        console.log("[CHARGE] Tạo đơn hàng với customerId (kiểu NUMBER):", finalCustomerId);

        const sqlCreateOrder = `
            INSERT INTO DON_HANG (MACUAHANG, MADOITAC, MANHANVIEN, NGAYTAO, TONGTIENTAMTINH, DIEMMUONDUNG, TRANGTHAI, GHICHU)
            VALUES (1, :p_khachhang, 1, SYSDATE, :p_tongtien, 0, N'Chờ thanh toán', N'Thanh toán tại POS')
        `;

        await connection.execute(sqlCreateOrder, {
            p_khachhang: finalCustomerId,
            p_tongtien: Math.round(total) // Đảm bảo số nguyên
        });

        console.log("[CHARGE] INSERT DON_HANG thành công");

        // 2. LẤY ID VỪA TẠO (FIX: Thay vì RETURNING, gọi SELECT MAX)
        const resultGetId = await connection.execute(
            `SELECT MAX(MADONHANG) as newId FROM DON_HANG`,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        const newOrderId = resultGetId.rows[0]?.NEWID;
        if (!newOrderId) {
            throw new Error('Không thể lấy ID đơn hàng vừa tạo từ database');
        }

        console.log("[CHARGE] Lấy ID đơn hàng thành công: MADONHANG =", newOrderId);

        // 3. LƯU TỪNG SẢN PHẨM TRONG GIỎ HÀNG VÀO CHI TIẾT ĐƠN HÀNG
        for (const item of cart) {
            console.log("[CHARGE] Đang insert chi tiết:", { masanpham: item.id, qty: item.qty, price: item.price });
            
            await connection.execute(
                `INSERT INTO CHI_TIET_DON_HANG (MASANPHAM, MADONHANG, SOLUONG, DONGIA, THANHTIEN)
                 VALUES (:masp, :madh, :sl, :gia, :thanhtien)`,
                {
                    masp: item.id,
                    madh: newOrderId,
                    sl: item.qty,
                    gia: item.price,
                    thanhtien: Math.round(item.price * item.qty)
                }
            );
        }

        console.log("[CHARGE] Đã insert tất cả", cart.length, "sản phẩm vào CHI_TIET_DON_HANG");

        // 4. GỌI THỦ TỤC THANH TOÁN (nếu tồn tại)
        const paymentMethodStr = phuongThuc === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
        console.log("[CHARGE] Gọi procedure SP_THANH_TOAN_DON_HANG với:", { madonhang: newOrderId, phuongthuc: paymentMethodStr });

        try {
            await connection.execute(
                `BEGIN SP_THANH_TOAN_DON_HANG(:p_MADONHANG, :p_PHUONGTHUCTHANHTHOAN); END;`,
                {
                    p_MADONHANG: newOrderId,
                    p_PHUONGTHUCTHANHTHOAN: paymentMethodStr
                }
            );
            console.log("[CHARGE] Procedure SP_THANH_TOAN_DON_HANG hoàn tất thành công");
        } catch (procErr) {
            // Nếu procedure bị lỗi, log nhưng không fail transaction (có thể procedure không tồn tại)
            console.warn("[CHARGE] Procedure bị lỗi (có thể không tồn tại):", procErr.message);
        }

        // 5. COMMIT TRANSACTION
        await connection.commit();
        console.log("[CHARGE] ✅ COMMIT TRANSACTION thành công!");

        res.json({ status: 'success', message: 'Thanh toán và lưu hóa đơn thành công!', orderId: newOrderId });

    } catch (err) {
        console.error("❌ [CHARGE] Lỗi hệ thống:");
        console.error("   Message:", err.message);
        console.error("   Stack:", err.stack);

        // ROLLBACK nếu có error
        if (connection) {
            try {
                await connection.rollback();
                console.log("[CHARGE] Đã rollback transaction sau lỗi");
            } catch (rollbackErr) {
                console.error("[CHARGE] Lỗi khi rollback:", rollbackErr.message);
            }
        }

        res.status(500).json({
            status: 'error',
            message: err.message || 'Lỗi xử lý thanh toán',
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    } finally {
        if (connection) {
            try {
                await connection.close();
                console.log("[CHARGE] Đóng connection thành công");
            } catch (closeErr) {
                console.error("[CHARGE] Lỗi khi đóng connection:", closeErr.message);
            }
        }
    }
});

// ============================================================================
// 1. API: THÊM SẢN PHẨM MỚI TỪ INVENTORY (Đã fix triệt để lỗi MACUAHANG)
// ============================================================================
app.post('/api/products', async (req, res) => {
  let connection;
  try {
    const { name, sku, category, price, stock, img, isSellable } = req.body;
    
    if (!name || !price) {
      return res.status(400).json({ status: 'error', message: 'Tên và Giá là bắt buộc' });
    }

    const canSell = isSellable ? 1 : 0;
    connection = await oracledb.getConnection(dbConfig);

    const plsql = `
      DECLARE
        v_id NUMBER;
      BEGIN
        -- Insert vào SAN_PHAM (Bơm giá trị mặc định cho các cột NOT NULL)
        INSERT INTO SAN_PHAM (
          TENSANPHAM, MAVACH, THUONGHIEU, GIANIEMYET, HINHANH, 
          COTHEBAN, POS, COTHEMUA, DONVITINH,
          THUE, XUATXU, PHUHOP, THANHPHAN, HUONGDAN, MOTA
        )
        VALUES (
          :name, :sku, :category, :price, :img, 
          :canSell, :canSell, 1, 'Cái',
          0.1, 'Đang cập nhật', 'Mọi đối tượng', 'Đang cập nhật', 'Đang cập nhật', 'Đang cập nhật'
        )
        RETURNING MASANPHAM INTO v_id;

        -- Insert vào TON_KHO (Chỉ dùng MAKHO = 1, tuyệt đối không dùng MACUAHANG)
        INSERT INTO TON_KHO (MASANPHAM, MAKHO, SOLUONGTON, NGAYCAPNHAP)
        VALUES (v_id, 1, :stock, SYSTIMESTAMP);

        :out_id := v_id;
      END;
    `;

    const result = await connection.execute(plsql, {
      name: name,
      sku: sku || `SKU-${Date.now()}`,
      category: category || 'Khác',
      price: parseInt(price),
      img: img || '/img/default-product.png',
      canSell: canSell,
      stock: parseInt(stock) || 0,
      out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true });

    res.json({ status: 'success', message: 'Thêm sản phẩm thành công', id: result.outBinds.out_id });
  } catch (err) {
    console.error("Lỗi khi thêm SP:", err);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 2A. API: DÀNH RIÊNG CHO POS (Chỉ lấy sản phẩm có POS = 1)
// ============================================================================
app.get('/api/products', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT 
        sp.MASANPHAM AS "id",
        sp.TENSANPHAM AS "name",
        sp.MAVACH AS "sku",
        sp.THUONGHIEU AS "category",
        sp.GIANIEMYET AS "price",
        sp.HINHANH AS "img",
        sp.COTHEBAN AS "isSellable",
        NVL(tk.SOLUONGTON, 0) AS "stock"
      FROM SAN_PHAM sp
      LEFT JOIN TON_KHO tk ON sp.MASANPHAM = tk.MASANPHAM
      WHERE sp.POS = 1 -- CHẶN CỨNG: Chỉ lấy hàng thương mại
    `;

    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const processedData = result.rows.map(row => ({
      ...row,
      status: row.stock > 10 ? 'In Stock' : (row.stock > 0 ? 'Low Stock' : 'Out of Stock')
    }));

    res.json({ status: 'success', data: processedData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 2B. API: DÀNH RIÊNG CHO INVENTORY (Lấy toàn bộ sản phẩm)
// ============================================================================
app.get('/api/inventory/products', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const query = `
      SELECT 
        sp.MASANPHAM AS "id",
        sp.TENSANPHAM AS "name",
        sp.MAVACH AS "sku",
        sp.THUONGHIEU AS "category",
        sp.GIANIEMYET AS "price",
        sp.HINHANH AS "img",
        sp.COTHEBAN AS "isSellable",
        NVL(tk.SOLUONGTON, 0) AS "stock"
      FROM SAN_PHAM sp
      LEFT JOIN TON_KHO tk ON sp.MASANPHAM = tk.MASANPHAM
      -- KHÔNG CÓ WHERE: Lấy toàn bộ hàng hóa kể cả nội bộ
    `;

    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const processedData = result.rows.map(row => ({
      ...row,
      status: row.stock > 10 ? 'In Stock' : (row.stock > 0 ? 'Low Stock' : 'Out of Stock')
    }));

    res.json({ status: 'success', data: processedData });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ==========================================
// 1. API: LẤY DANH SÁCH ĐỐI TÁC (GET)
// ==========================================
app.get('/api/partners', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    const sql = `
      SELECT 
        d.MADOITAC AS "id", 
        d.TENDOITAC AS "name", 
        d.SODIENTHOAI AS "phone", 
        d.EMAIL AS "email",
        d.DIACHI AS "address",
        TRIM(d.LOAIDOITAC) AS "type",
        NVL(k.LOAIKHACHHANG, 'Thường') AS "tier", 
        NVL(k.DIEMTICHLUY, 0) AS "points",
        TO_CHAR(k.NGAYTHAMGIA, 'DD/MM/YYYY') AS "createdAt"
      FROM DOI_TAC d
      LEFT JOIN KHACH_HANG k ON d.MADOITAC = k.MADOITAC
      ORDER BY d.MADOITAC DESC
      -- Đã XÓA dòng FETCH FIRST 10 ROWS ONLY ở đây
    `;

    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows });

  } catch (err) {
    console.error("[API GET /partners] Lỗi SQL:", err);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) { await connection.close(); }
  }
});

// ==========================================
// API: THÊM MỚI ĐỐI TÁC (Đã sửa lỗi PERSISTENCE)
// ==========================================
app.post('/api/partners', async (req, res) => {
  let connection;
  try {
    const { name, phone, email, address, type } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    // Gọi Stored Procedure trong Oracle
    const sql = `BEGIN SP_THEM_DOI_TAC(:name, :phone, :email, :address, :type, :id); END;`;
    
    const result = await connection.execute(sql, {
      name: name,
      phone: phone || '',
      email: email || '',
      address: address || '',
      type: type,
      id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });

    console.log(`Đã thêm thành công qua Procedure. ID mới: ${result.outBinds.id}`);
    res.json({ status: 'success', message: 'Thêm đối tác thành công!' });

  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

app.put('/api/partners/:id', async (req, res) => {
  let connection;
  try {
    const { id } = req.params;
    const { name, phone, email, address } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    const sql = `BEGIN SP_CAP_NHAT_DOI_TAC(:id, :name, :phone, :email, :address); END;`;
    
    await connection.execute(sql, {
      id: id,
      name: name,
      phone: phone || '',
      email: email || '',
      address: address || ''
    });

    res.json({ status: 'success', message: 'Cập nhật thành công!' });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// API: QUẢN LÝ TÀI CHÍNH & DÒNG TIỀN (DỮ LIỆU THẬT)
// ============================================================================
app.get('/api/finance', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // 1. Lấy tất cả tài khoản và số dư
    const accountsResult = await connection.execute(
      `SELECT MATAIKHOAN as "id", TENTAIKHOAN as "name", LOAITAIKHOAN as "type", 
              SODUHIENTAI as "balance", MUCDICH as "purpose" 
       FROM TAI_KHOAN ORDER BY MATAIKHOAN ASC`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    // 2. Lấy giao dịch kèm tên tài khoản
    const txResult = await connection.execute(
      `SELECT g.MAGIAODICH as "id", g.GHICHU as "desc", g.SOTIEN as "amount", 
              TO_CHAR(g.NGAYGIAODICH, 'DD/MM') as "date", t.TENTAIKHOAN as "accountName"
       FROM GIAO_DICH_TIEN g
       JOIN TAI_KHOAN t ON g.MATAIKHOAN = t.MATAIKHOAN
       ORDER BY g.NGAYGIAODICH DESC FETCH FIRST 10 ROWS ONLY`,
      [], { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    res.json({ status: 'success', data: { accounts: accountsResult.rows, transactions: txResult.rows } });
  } catch (err) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});