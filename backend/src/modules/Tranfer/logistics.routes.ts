// File: src/modules/Logistics/logistics.routes.ts
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
// 1. LẤY TẤT CẢ DANH SÁCH PHIẾU KHO (Nhập, Xuất, Chuyển)
// ============================================================================
router.get('/receipts', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `
      SELECT 
        pk.SOPHIEU AS "id",
        pk.LOAIPHIEU AS "type",
        TO_CHAR(pk.NGAYLAP, 'DD/MM/YYYY') AS "date",
        pk.TRANGTHAI AS "status",
        dt.TENDOITAC AS "partner",
        NVL(k1.TENKHO, 'N/A') AS "fromWarehouse",
        NVL(k2.TENKHO, 'N/A') AS "toWarehouse",
        pk.TONGGIATRIPHIEU AS "value"
      FROM PHIEU_KHO pk
      LEFT JOIN DOI_TAC dt ON pk.DOITAC = dt.MADOITAC
      LEFT JOIN KHO k1 ON pk.KHODI = k1.MAKHO
      LEFT JOIN KHO k2 ON pk.KHODEN = k2.MAKHO
      ORDER BY pk.NGAYLAP DESC
    `;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 2. XÁC NHẬN NHẬP KHO & CỘNG TỒN KHO
// ============================================================================
router.put('/approve/:ticketCode', async (req: Request, res: Response): Promise<any> => {
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
    if (currentStatus.status === 'Đã hoàn tất' || currentStatus.status === 'Đã nhập xong') {
        return res.status(400).json({ status: 'error', message: 'Phiếu này đã được duyệt trước đó' });
    }

    // 2. Lấy danh sách sản phẩm trong Phiếu kho
    const itemsSql = `SELECT MASANPHAM, SOLUONG FROM CHI_TIET_PHIEU WHERE SOPHIEU = :code`;
    const itemsRes = await connection.execute(itemsSql, [ticketCode], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const items = itemsRes.rows as any[];

    // 3. Cộng Tồn kho cho từng sản phẩm
    for (const item of items) {
      const checkTonKho = `SELECT SOLUONGTON FROM TON_KHO WHERE MASANPHAM = :spId AND MAKHO = :khoId`;
      const tonKhoRes = await connection.execute(checkTonKho, { spId: item.MASANPHAM, khoId: currentStatus.KHODEN });
      
      if (tonKhoRes.rows && tonKhoRes.rows.length > 0) {
          await connection.execute(`UPDATE TON_KHO SET SOLUONGTON = SOLUONGTON + :qty, NGAYCAPNHAP = SYSTIMESTAMP WHERE MASANPHAM = :spId AND MAKHO = :khoId`, { qty: item.SOLUONG, spId: item.MASANPHAM, khoId: currentStatus.KHODEN });
      } else {
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

// ============================================================================
// 3. TẠO PHIẾU XUẤT/CHUYỂN KHO NỘI BỘ
// ============================================================================
router.post('/transfer', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { fromWarehouseId, toWarehouseId, productId, quantity, staffId } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    await connection.execute(
      `BEGIN SP_CHUYEN_KHO(:k_di, :k_den, :sp, :qty, :nv); END;`,
      { 
        k_di: Number(fromWarehouseId), 
        k_den: Number(toWarehouseId), 
        sp: Number(productId), 
        qty: Number(quantity), 
        nv: Number(staffId) 
      },
      { autoCommit: true }
    );

    res.json({ status: 'success', message: 'Đã tạo phiếu chuyển kho và cập nhật tồn kho thành công!' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;