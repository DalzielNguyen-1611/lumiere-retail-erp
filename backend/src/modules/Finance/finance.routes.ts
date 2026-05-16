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
// 1. [GET] /finance -> Lấy báo cáo dòng tiền (Sổ cái & Nhật ký)
// ============================================================================
router.get('/finance', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const accountsResult = await connection.execute(`
      SELECT MATAIKHOAN as "id", TENTAIKHOAN as "name", LOAITAIKHOAN as "type", SODUHIENTAI as "balance", MUCDICH as "purpose" 
      FROM TAI_KHOAN ORDER BY MATAIKHOAN ASC`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const txResult = await connection.execute(`
      SELECT g.MAGIAODICH as "id", g.GHICHU as "desc", g.SOTIEN as "amount", TO_CHAR(g.NGAYGIAODICH, 'DD/MM/YYYY HH24:MI') as "date", t.TENTAIKHOAN as "accountName"
      FROM GIAO_DICH_TIEN g JOIN TAI_KHOAN t ON g.MATAIKHOAN = t.MATAIKHOAN ORDER BY g.NGAYGIAODICH DESC FETCH FIRST 20 ROWS ONLY`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    res.json({ status: 'success', data: { accounts: accountsResult.rows || [], transactions: txResult.rows || [] } });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// ============================================================================
// 2. [GET] /finance/payables -> Lấy danh sách công nợ (Hóa đơn mua hàng)
// ============================================================================
router.get('/finance/payables', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `BEGIN SP_GET_DANH_SACH_CONG_NO(:cursor); END;`;
    const result = await connection.execute(sql, { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } }, { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Lấy dữ liệu từ Cursor trả về
    const cursor = (result.outBinds as any).cursor;
    const rows = await cursor.getRows();
    await cursor.close();

    res.json({ status: 'success', data: rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 3. [PUT] /finance/pay/:id -> Xử lý chi tiền thanh toán (Có chọn tài khoản)
// ============================================================================
router.put('/finance/pay/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    const { accountId } = req.body; 
    
    // Đảm bảo chỉ nhận 111 (Tiền mặt) hoặc 112 (Chuyển khoản)
    const validAccountId = accountId === 112 ? 112 : 111;
    const phuongThuc = validAccountId === 112 ? 'Chuyển khoản' : 'Tiền mặt';

    connection = await oracledb.getConnection(dbConfig);
    // Procedure trong Oracle tự động handle Commit/Rollback bên trong (hoặc gọi từ Node.js)
    
    // Gọi thẳng Procedure để xử lý thay vì viết 4 câu lệnh rời rạc
    await connection.execute(
      `BEGIN SP_THANH_TOAN_HOA_DON_MUA(:id, :acc, :pt); END;`,
      { id: Number(id), acc: validAccountId, pt: phuongThuc },
      { autoCommit: true } // Auto-commit luôn vì đã gói gọn trong 1 transaction
    );

    res.json({ status: 'success', message: 'Thanh toán thành công!' });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;