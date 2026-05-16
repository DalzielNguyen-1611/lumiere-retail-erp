// File: src/modules/Procurement/procurement.routes.ts
import { Router, Request, Response } from 'express';
import oracledb from 'oracledb';
import * as dotenv from 'dotenv';

dotenv.config();
const router = Router();
const dbConfig = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`
};

// ============================================================================
// 1. LẤY DANH SÁCH NHÀ CUNG CẤP (Đã gỡ bỏ cột NGAYTAO gây lỗi)
// ============================================================================
router.get('/suppliers', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    
    // Câu lệnh SQL mới khớp 100% với cấu trúc bảng của bạn
    const sql = `
      SELECT 
        MADOITAC AS "id", 
        TENDOITAC AS "name", 
        SODIENTHOAI AS "phone", 
        EMAIL AS "email", 
        DIACHI AS "address"
      FROM DOI_TAC 
      WHERE LOAIDOITAC = 'Nhà cung cấp' 
      ORDER BY MADOITAC DESC
    `;
    
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) { 
    console.error("Lỗi GET danh sách NCC:", err);
    res.status(500).json({ status: 'error', message: err.message }); 
  } finally { 
    if (connection) await connection.close(); 
  }
});

// ============================================================================
// 2. THÊM NHÀ CUNG CẤP MỚI (Cập nhật lưu Mã số thuế, Điều khoản thanh toán)
// ============================================================================
router.post('/suppliers', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    // Nhận thêm 3 trường mới từ Frontend
    const { name, phone, email, address, taxCode, paymentTerms, note } = req.body;
    
    if (!name) return res.status(400).json({ status: 'error', message: 'Tên nhà cung cấp không được để trống' });
    
    connection = await oracledb.getConnection(dbConfig);
    
    const plsql = `
      DECLARE 
        v_id NUMBER;
      BEGIN 
        -- Bước 1: Thêm thông tin chung vào bảng DOI_TAC
        INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, EMAIL, DIACHI, LOAIDOITAC) 
        VALUES (:name, :phone, :email, :address, 'Nhà cung cấp')
        RETURNING MADOITAC INTO v_id;

        -- Bước 2: Thêm thông tin chuyên biệt vào bảng NHA_CUNG_CAP
        INSERT INTO NHA_CUNG_CAP (MADOITAC, MASOTHEU, DIEUKHOANTHANHTOAN, GHICHU)
        VALUES (v_id, :taxCode, :paymentTerms, :note);

        :out_id := v_id;
      END;
    `;
    
    await connection.execute(plsql, { 
      name, 
      phone: phone || '', 
      email: email || '', 
      address: address || '',
      taxCode: taxCode || 'Chưa cung cấp',            // Fallback nếu trống
      paymentTerms: paymentTerms || 'Tiền mặt',       // Fallback nếu trống
      note: note || 'Tạo mới từ hệ thống Mua hàng',   // Fallback nếu trống
      out_id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT } 
    }, { autoCommit: true });
    
    res.json({ status: 'success', message: 'Thêm nhà cung cấp thành công!' });
  } catch (err: any) { 
    console.error("Lỗi Insert Database:", err);
    res.status(500).json({ status: 'error', message: err.message }); 
  } finally { 
    if (connection) await connection.close(); 
  }
});

// ============================================================================
// 3. LẤY DANH SÁCH SẢN PHẨM (Bổ sung HINHANH)
// ============================================================================
router.get('/products', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `
      SELECT 
        MASANPHAM AS "id", 
        TENSANPHAM AS "name", 
        GIANIEMYET AS "price",
        HINHANH AS "img" 
      FROM SAN_PHAM 
      WHERE COTHEMUA = 1
    `;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// ============================================================================
// 4. LẤY TẤT CẢ ĐƠN MUA HÀNG & PHIẾU KHO
// ============================================================================
router.get('/orders', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // Lấy thông tin từ HOA_DON_MUA_HANG và PHIEU_KHO tương ứng
    const sql = `
      SELECT 
        hd.MAHOADONMUA AS "id",
        'PO-' || TO_CHAR(hd.NGAYLAP, 'YYYY') || '-' || LPAD(hd.MAHOADONMUA, 3, '0') AS "code",
        dt.TENDOITAC AS "supplier",
        dt.MADOITAC AS "supplierId",
        TO_CHAR(hd.NGAYLAP, 'DD/MM/YYYY') AS "date",
        hd.TONGTIEN AS "value",
        pk.TRANGTHAI AS "status",
        pk.SOPHIEU AS "ticketCode"
      FROM HOA_DON_MUA_HANG hd
      JOIN DOI_TAC dt ON hd.MADOITAC = dt.MADOITAC
      LEFT JOIN PHIEU_KHO pk ON hd.MAHOADONMUA = pk.MAHOADON AND pk.LOAIPHIEU = 'Nhập kho'
      ORDER BY hd.NGAYLAP DESC, hd.MAHOADONMUA DESC
    `;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.json({ status: 'success', data: [] });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 5. TẠO HÓA ĐƠN MUA HÀNG & PHIẾU KHO (Đã cập nhật Mã NV và Kho = 1)
// ============================================================================
router.post('/orders', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    // NHẬN THÊM employeeId TỪ FRONTEND
    const { supplierId, note, items, totalValue, employeeId } = req.body;
    
    if (!supplierId || !items || items.length === 0) {
      return res.status(400).json({ status: 'error', message: 'Dữ liệu không hợp lệ' });
    }

    connection = await oracledb.getConnection(dbConfig);
    connection.autoCommit = false;

    // --- XỬ LÝ ID NHÂN VIÊN VÀ KHO ---
    // Lấy mã nhân viên người đang đăng nhập (nếu lỗi ko lấy được thì tạm fallback về 1)
    const empId = employeeId || 1; 
    // Gán cứng kho đến là 1 theo yêu cầu của bạn
    const khoId = 1; 

    // 1. Tạo HOA_DON_MUA_HANG (sử dụng empId)
    const insertHD = `
      INSERT INTO HOA_DON_MUA_HANG (MADOITAC, MANHANVIEN, SOHOADON_VAT, NGAYLAP, TONGTIEN, PHUONGTHUCTHANHTOAN, TRANGTHAI_THANHTOAN, GHICHU)
      VALUES (:supId, :empId, 'VAT-' || TO_CHAR(SYSDATE, 'YYYYMMDDHH24MISS'), SYSDATE, :total, 'Chuyển khoản', 'Chưa thanh toán', :note)
      RETURNING MAHOADONMUA INTO :hd_id
    `;
    const resultHD = await connection.execute(insertHD, {
      supId: supplierId, empId: empId, total: totalValue, note: note || 'Nhập hàng',
      hd_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    });
    const newHoaDonId = (resultHD.outBinds as any).hd_id[0];

    // 2. Tạo CHI_TIET_HOA_DON_MUA_HANG
    for (const item of items) {
      const insertCTHD = `
        INSERT INTO CHI_TIET_HOA_DON_MUA_HANG (MAHOADONMUA, MASANPHAM, SOLUONG, SOLUONGDANHAN, DONGIA, THANHTIEN)
        VALUES (:hdId, :spId, :qty, 0, :price, :total)
      `;
      await connection.execute(insertCTHD, {
        hdId: newHoaDonId, spId: item.productId, qty: item.quantity, price: item.price, total: item.quantity * item.price
      });
    }

    // 3. Tự động tạo PHIEU_KHO (Đổi trạng thái thành Chờ giao hàng)
    const phieuKhoCode = `PK-${newHoaDonId}-${Date.now().toString().slice(-4)}`;
    const insertPK = `
      INSERT INTO PHIEU_KHO (SOPHIEU, LOAIPHIEU, MAHOADON, NGAYLAP, NGAYTHUCPHE, KHODI, KHODEN, DOITAC, TONGGIATRIPHIEU, NGUOIPHUTRACH, TRANGTHAI)
      VALUES (:soPhieu, 'Nhập kho', :hdId, SYSDATE, SYSDATE, NULL, :khoId, :supId, :total, :empId, 'Chờ giao hàng') 
    `;
    await connection.execute(insertPK, {
      soPhieu: phieuKhoCode, hdId: newHoaDonId, khoId: khoId, supId: supplierId, total: totalValue, empId: empId
    });

    // 4. Tạo CHI_TIET_PHIEU
    for (const item of items) {
      const insertCTPK = `
        INSERT INTO CHI_TIET_PHIEU (SOPHIEU, MASANPHAM, SOLUONG, DONGIA, THANHTIEN)
        VALUES (:soPhieu, :spId, :qty, :price, :total)
      `;
      await connection.execute(insertCTPK, {
        soPhieu: phieuKhoCode, spId: item.productId, qty: item.quantity, price: item.price, total: item.quantity * item.price
      });
    }

    // 5. HẠCH TOÁN KẾ TOÁN (Ghi vào sổ cái và lưu lịch sử giao dịch)
    // - Nợ TK 156 (Hàng hóa): Tăng giá trị tồn kho
    await connection.execute(`
      INSERT INTO GIAO_DICH_TIEN (MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, GHICHU)
      VALUES (1, 156, 'Nhập hàng', :total, SYSTIMESTAMP, :note)
    `, { total: totalValue, note: 'Nhập hàng hóa từ PO-' + newHoaDonId });
    await connection.execute(`UPDATE TAI_KHOAN SET SODUHIENTAI = SODUHIENTAI + :total WHERE MATAIKHOAN = 156`, { total: totalValue });

    // - Có TK 331 (Phải trả người bán): Tăng nợ phải trả
    await connection.execute(`
      INSERT INTO GIAO_DICH_TIEN (MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, GHICHU)
      VALUES (1, 331, 'Ghi nhận nợ', :total, SYSTIMESTAMP, :note)
    `, { total: totalValue, note: 'Phải trả NCC từ PO-' + newHoaDonId });
    await connection.execute(`UPDATE TAI_KHOAN SET SODUHIENTAI = SODUHIENTAI + :total WHERE MATAIKHOAN = 331`, { total: totalValue });

    await connection.commit();
    res.json({ status: 'success', message: 'Tạo đơn nhập hàng và Phiếu kho thành công!' });
  } catch (err: any) {
    if (connection) await connection.rollback();
    console.error("Lỗi tạo PO:", err.message);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 6. QUẢN LÝ KHO: XÁC NHẬN PHIẾU KHO & CỘNG TỒN KHO
// ============================================================================
router.put('/warehouse/approve/:ticketCode', async (req: Request, res: Response): Promise<any> => {
    let connection;
    try {
      const { ticketCode } = req.params;
      connection = await oracledb.getConnection(dbConfig);
      connection.autoCommit = false;
  
      // 1. Kiểm tra trạng thái hiện tại
      const checkStatusSql = `SELECT TRANGTHAI, KHODEN FROM PHIEU_KHO WHERE SOPHIEU = :code`;
      const statusRes = await connection.execute(checkStatusSql, [ticketCode], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const currentStatus = (statusRes.rows as any[])[0];
      
      if (!currentStatus) return res.status(404).json({ status: 'error', message: 'Không tìm thấy Phiếu kho' });
      if (currentStatus.status === 'Đã hoàn tất') return res.status(400).json({ status: 'error', message: 'Phiếu này đã được duyệt trước đó' });
  
      // 2. Lấy danh sách sản phẩm trong Phiếu kho
      const itemsSql = `SELECT MASANPHAM, SOLUONG FROM CHI_TIET_PHIEU WHERE SOPHIEU = :code`;
      const itemsRes = await connection.execute(itemsSql, [ticketCode], { outFormat: oracledb.OUT_FORMAT_OBJECT });
      const items = itemsRes.rows as any[];
  
      // 3. Cộng Tồn kho cho từng sản phẩm
      for (const item of items) {
        // Kiểm tra xem sản phẩm đã có trong TON_KHO chưa
        const checkTonKho = `SELECT SOLUONGTON FROM TON_KHO WHERE MASANPHAM = :spId AND MAKHO = :khoId`;
        const tonKhoRes = await connection.execute(checkTonKho, { spId: item.MASANPHAM, khoId: currentStatus.KHODEN });
        
        if (tonKhoRes.rows && tonKhoRes.rows.length > 0) {
            // Đã có -> UPDATE cộng dồn
            await connection.execute(`UPDATE TON_KHO SET SOLUONGTON = SOLUONGTON + :qty, NGAYCAPNHAP = SYSTIMESTAMP WHERE MASANPHAM = :spId AND MAKHO = :khoId`, { qty: item.SOLUONG, spId: item.MASANPHAM, khoId: currentStatus.KHODEN });
        } else {
            // Chưa có -> INSERT mới
            await connection.execute(`INSERT INTO TON_KHO (MASANPHAM, MAKHO, SOLUONGTON, NGAYCAPNHAP) VALUES (:spId, :khoId, :qty, SYSTIMESTAMP)`, { spId: item.MASANPHAM, khoId: currentStatus.KHODEN, qty: item.SOLUONG });
        }
      }
  
      // 4. Cập nhật trạng thái Phiếu Kho thành "Đã hoàn tất"
      await connection.execute(`UPDATE PHIEU_KHO SET TRANGTHAI = 'Đã hoàn tất', NGAYTHUCPHE = SYSDATE WHERE SOPHIEU = :code`, [ticketCode]);
  
      await connection.commit();
      res.json({ status: 'success', message: 'Duyệt phiếu nhập kho thành công! Hàng đã được cộng vào tồn kho.' });
    } catch (err: any) {
      if (connection) await connection.rollback();
      res.status(500).json({ status: 'error', message: err.message });
    } finally {
      if (connection) await connection.close();
    }
  });

export default router;