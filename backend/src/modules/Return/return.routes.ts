// File: src/modules/Return/return.routes.ts
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
// 1. LẤY THÔNG TIN HÓA ĐƠN GỐC
// ============================================================================
router.get('/invoice/:id', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const rawId = req.params.id as string;
    const madonhang = rawId.replace(/\D/g, ''); 

    if (!madonhang) return res.status(400).json({ status: 'error', message: 'Mã hóa đơn không hợp lệ' });

    connection = await oracledb.getConnection(dbConfig);
    const orderResult = await connection.execute(`
      SELECT dh.MADONHANG, TO_CHAR(dh.NGAYTAO, 'Mon DD, YYYY') as "date", dt.TENDOITAC as "customer"
      FROM DON_HANG dh LEFT JOIN DOI_TAC dt ON dh.MADOITAC = dt.MADOITAC WHERE dh.MADONHANG = :id
    `, [madonhang], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const orderRows = (orderResult.rows as any[]) || [];
    if (orderRows.length === 0) return res.status(404).json({ status: 'not_found', message: 'Không tìm thấy hóa đơn này' });

    const itemsResult = await connection.execute(`
      SELECT sp.MASANPHAM AS "id", sp.TENSANPHAM AS "name", sp.MAVACH AS "sku", ct.DONGIA AS "price", ct.SOLUONG AS "qty", sp.HINHANH AS "img"
      FROM CHI_TIET_DON_HANG ct JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM WHERE ct.MADONHANG = :id
    `, [madonhang], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    res.json({ status: 'success', data: { customer: orderRows[0].customer || 'Khách vãng lai', date: orderRows[0].date, items: itemsResult.rows || [] } });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// ============================================================================
// 2. POS: TẠO YÊU CẦU TRẢ HÀNG (CHỜ DUYỆT)
// ============================================================================
router.post('/', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { invoiceId, items, totalRefund, reason } = req.body;
    const madonhang = String(invoiceId).replace(/\D/g, '');

    if (!madonhang || !items || items.length === 0) return res.status(400).json({ status: 'error', message: 'Dữ liệu không hợp lệ' });

    connection = await oracledb.getConnection(dbConfig);
    connection.autoCommit = false;

    const insertPhieu = `
      INSERT INTO PHIEU_DOI_TRA (MADONHANG, MACUAHANG, MADOITAC, MANHANVIEN_TAO, LOAI_PHIEU, TRANG_THAI, TONGTIEN_HOAN, LYDO)
      VALUES (:madh, 1, 1, 1, 'Trả hàng', 'Chờ duyệt', :tienhoan, :lydo)
      RETURNING MAPHIEU INTO :maphieu
    `;
    const resultPhieu = await connection.execute(insertPhieu, {
      madh: madonhang, tienhoan: totalRefund, lydo: reason || 'Chờ xác nhận', maphieu: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    });
    
    const outBinds = resultPhieu.outBinds as any;
    const maPhieuMoi = outBinds.maphieu[0] || outBinds.maphieu;

    for (const item of items) {
      if (item.returnQty > 0) {
        await connection.execute(`
          INSERT INTO CHI_TIET_DOI_TRA (MAPHIEU, MASANPHAM_TRA, SOLUONG_TRA, DONGIA_TRA, GIATRI_CHENH_LECH)
          VALUES (:maphieu, :masp, :sl, :gia, :chenhlech)
        `, { maphieu: maPhieuMoi, masp: item.id, sl: item.returnQty, gia: item.price, chenhlech: -(item.returnQty * item.price) });
      }
    }

    await connection.commit();
    res.json({ status: 'success', message: 'Đã gửi yêu cầu trả hàng cho Quản lý!' });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally { if (connection) await connection.close(); }
});

// ============================================================================
// 3. MANAGER: DUYỆT YÊU CẦU TRẢ HÀNG (ĐÃ HOÀN TẤT)
// ============================================================================
router.put('/:id/approve', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const maphieu = String(req.params.id).replace(/\D/g, '');
    connection = await oracledb.getConnection(dbConfig);
    connection.autoCommit = false;

    const phieuRes = await connection.execute(`SELECT TONGTIEN_HOAN, MADONHANG FROM PHIEU_DOI_TRA WHERE MAPHIEU = :id`, [maphieu], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const phieu = (phieuRes.rows as any[])[0];

    if (!phieu) return res.status(404).json({ status: 'error', message: 'Không tìm thấy phiếu' });

    const itemsRes = await connection.execute(`SELECT MASANPHAM_TRA, SOLUONG_TRA FROM CHI_TIET_DOI_TRA WHERE MAPHIEU = :id`, [maphieu], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const items = itemsRes.rows as any[];
    
    // Cộng kho (Mặc định kho 1)
    for(const item of items) {
      await connection.execute(`UPDATE TON_KHO SET SOLUONGTON = SOLUONGTON + :sl WHERE MASANPHAM = :masp AND MAKHO = 1`, { sl: item.SOLUONG_TRA, masp: item.MASANPHAM_TRA });
    }

    // Trừ sổ quỹ
    await connection.execute(`
      INSERT INTO GIAO_DICH_TIEN (MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, GHICHU)
      VALUES (1, 111, 'Chi tiền mặt', :tien, SYSTIMESTAMP, :ghichu)
    `, { tien: -phieu.TONGTIEN_HOAN, ghichu: `Hoàn tiền khách trả hàng (Phiếu RET-${maphieu}, HĐ INV-${phieu.MADONHANG})` });

    // Đổi trạng thái -> Đã hoàn tất
    await connection.execute(`UPDATE PHIEU_DOI_TRA SET TRANG_THAI = 'Đã hoàn tất' WHERE MAPHIEU = :id`, [maphieu]);

    await connection.commit();
    res.json({ status: 'success', message: 'Đã duyệt và hoàn tiền thành công!' });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally { if (connection) await connection.close(); }
});

// ============================================================================
// 4. MANAGER: TỪ CHỐI YÊU CẦU
// ============================================================================
router.put('/:id/reject', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const maphieu = String(req.params.id).replace(/\D/g, '');
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`UPDATE PHIEU_DOI_TRA SET TRANG_THAI = 'Từ chối' WHERE MAPHIEU = :id`, [maphieu], { autoCommit: true });
    res.json({ status: 'success', message: 'Đã từ chối phiếu trả hàng!' });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// ============================================================================
// 5. LẤY LỊCH SỬ ĐỔI TRẢ
// ============================================================================
router.get('/recent', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`
      SELECT 
        'RET-' || p.MAPHIEU AS "id", NVL(dt.TENDOITAC, 'Khách vãng lai') AS "customer", 'INV-' || p.MADONHANG AS "invoice",
        (SELECT SUM(SOLUONG_TRA) FROM CHI_TIET_DOI_TRA WHERE MAPHIEU = p.MAPHIEU) AS "items",
        p.TONGTIEN_HOAN AS "refund", TO_CHAR(p.NGAYTAO, 'Mon DD, YYYY') AS "date", p.LYDO AS "reason", p.TRANG_THAI AS "status"
      FROM PHIEU_DOI_TRA p LEFT JOIN DON_HANG dh ON p.MADONHANG = dh.MADONHANG LEFT JOIN DOI_TAC dt ON dh.MADOITAC = dt.MADOITAC
      ORDER BY CASE WHEN p.TRANG_THAI = 'Chờ duyệt' THEN 1 ELSE 2 END, p.NGAYTAO DESC
      FETCH FIRST 15 ROWS ONLY
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

export default router;