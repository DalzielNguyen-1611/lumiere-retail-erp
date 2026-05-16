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
      SELECT 
        g.MAGIAODICH as "id", 
        g.GHICHU as "desc", 
        g.SOTIEN as "amount", 
        g.LOAIGIAODICH as "type",
        TO_CHAR(g.NGAYGIAODICH, 'DD/MM/YYYY HH24:MI') as "date", 
        t.TENTAIKHOAN as "accountName"
      FROM GIAO_DICH_TIEN g 
      JOIN TAI_KHOAN t ON g.MATAIKHOAN = t.MATAIKHOAN 
      ORDER BY g.NGAYGIAODICH DESC 
      FETCH FIRST 20 ROWS ONLY`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const processedTransactions = (txResult.rows as any[]).map(tx => {
      // Logic xác định dấu: Nếu là các loại CHI hoặc Trả nợ thì mang dấu ÂM
      const isNegative = tx.type && (
        tx.type.toUpperCase().includes('CHI') || 
        tx.type.includes('Tất toán') ||
        tx.type.includes('Giảm')
      );
      return {
        ...tx,
        amount: isNegative ? -tx.amount : tx.amount
      };
    });

    res.json({ status: 'success', data: { accounts: accountsResult.rows || [], transactions: processedTransactions } });
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
    const { accountId, type } = req.body; 
    
    // Đảm bảo chỉ nhận 111 (Tiền mặt) hoặc 112 (Chuyển khoản)
    const validAccountId = accountId === 112 ? 112 : 111;
    const phuongThuc = validAccountId === 112 ? 'Chuyển khoản' : 'Tiền mặt';

    connection = await oracledb.getConnection(dbConfig);
    
    if (type === 'LUONG') {
      // Gọi Procedure chi lương
      await connection.execute(
        `BEGIN SP_THANH_TOAN_LUONG(:id, :acc, :note); END;`,
        { 
          id: Number(id), 
          acc: validAccountId, 
          note: `Chi trả lương nhân viên - Phiếu SAL-${id} (${phuongThuc})` 
        },
        { autoCommit: true }
      );
    } else {
      // Gọi Procedure chi trả hóa đơn mua hàng
      await connection.execute(
        `BEGIN SP_THANH_TOAN_HOA_DON_MUA(:id, :acc, :pt); END;`,
        { id: Number(id), acc: validAccountId, pt: phuongThuc },
        { autoCommit: true }
      );
    }

    res.json({ status: 'success', message: 'Thanh toán thành công!' });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 4. [GET] /finance/payment-history -> Lấy lịch sử chi tiền (Phân loại)
// ============================================================================
router.get('/finance/payment-history', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `
      SELECT 
        g.MAGIAODICH as "id",
        g.SOTIEN as "amount",
        TO_CHAR(g.NGAYGIAODICH, 'DD/MM/YYYY HH24:MI') as "date",
        g.GHICHU as "desc",
        t.TENTAIKHOAN as "accountName",
        CASE 
          WHEN g.MAPHIEULUONG IS NOT NULL THEN 'LUONG'
          WHEN g.MAHOADONMUA IS NOT NULL THEN 'MUA'
          ELSE 'KHAC'
        END as "type"
      FROM GIAO_DICH_TIEN g
      JOIN TAI_KHOAN t ON g.MATAIKHOAN = t.MATAIKHOAN
      WHERE g.LOAIGIAODICH = 'CHI'
      ORDER BY g.NGAYGIAODICH DESC
      FETCH FIRST 50 ROWS ONLY
    `;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;