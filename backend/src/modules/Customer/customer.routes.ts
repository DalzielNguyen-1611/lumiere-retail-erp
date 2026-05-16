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

// [GET] /api/customers/search -> Tìm khách hàng theo SĐT (POS dùng)
router.get('/customers/search', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const phone = req.query.phone as string;
    if (!phone) return res.status(400).json({ status: 'error', message: 'Vui lòng cung cấp số điện thoại' });
    connection = await oracledb.getConnection(dbConfig);
    const query = `
      SELECT dt.MADOITAC AS "id", dt.TENDOITAC AS "name", dt.SODIENTHOAI AS "phone", kh.LOAIKHACHHANG AS "tier", kh.DIEMTICHLUY AS "points"
      FROM DOI_TAC dt JOIN KHACH_HANG kh ON dt.MADOITAC = kh.MADOITAC WHERE dt.SODIENTHOAI = :phone`;
    const result = await connection.execute(query, [phone], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = (result.rows as any[]) || [];
    if (rows.length > 0) return res.json({ status: 'success', data: rows[0] });
    return res.json({ status: 'not_found', message: 'Không tìm thấy khách hàng' });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [POST] /api/customers -> Thêm khách hàng nhanh (POS dùng)
router.post('/customers', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { name, phone } = req.body;
    if (!name || !phone) return res.status(400).json({ status: 'error', message: 'Thiếu tên hoặc SĐT' });
    connection = await oracledb.getConnection(dbConfig);
    const plsql = `
      DECLARE v_id NUMBER;
      BEGIN
        INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, LOAIDOITAC) VALUES (:name, :phone, 'Khách hàng') RETURNING MADOITAC INTO v_id;
        INSERT INTO KHACH_HANG (MADOITAC, DIEMTICHLUY, NGAYTHAMGIA, LOAIKHACHHANG) VALUES (v_id, 0, SYSDATE, 'Silver');
        :out_id := v_id;
      END;`;
    const result = await connection.execute(plsql, { name, phone, out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER } }, { autoCommit: true });
    res.json({ status: 'success', data: { id: result.outBinds?.out_id } });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [GET] /api/partners -> Lấy toàn bộ danh sách đối tác
router.get('/partners', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const sql = `
      SELECT d.MADOITAC AS "id", d.TENDOITAC AS "name", d.SODIENTHOAI AS "phone", d.EMAIL AS "email", d.DIACHI AS "address", TRIM(d.LOAIDOITAC) AS "type",
             NVL(k.LOAIKHACHHANG, 'Thường') AS "tier", NVL(k.DIEMTICHLUY, 0) AS "points", TO_CHAR(k.NGAYTHAMGIA, 'DD/MM/YYYY') AS "createdAt"
      FROM DOI_TAC d LEFT JOIN KHACH_HANG k ON d.MADOITAC = k.MADOITAC ORDER BY d.MADOITAC DESC`;
    const result = await connection.execute(sql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [POST] /api/partners -> Tạo mới đối tác bằng Procedure
router.post('/partners', async (req: Request, res: Response) => {
  let connection;
  try {
    const { name, phone, email, address, type } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN SP_THEM_DOI_TAC(:name, :phone, :email, :address, :type, :id); END;`, {
      name, phone: phone || '', email: email || '', address: address || '', type, id: { type: oracledb.NUMBER, dir: oracledb.BIND_OUT }
    });
    res.json({ status: 'success', message: 'Thêm đối tác thành công!' });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [PUT] /api/partners/:id -> Cập nhật thông tin đối tác
router.put('/partners/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params; const { name, phone, email, address } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    await connection.execute(`BEGIN SP_CAP_NHAT_DOI_TAC(:id, :name, :phone, :email, :address); END;`, {
      id, name, phone: phone || '', email: email || '', address: address || ''
    });
    res.json({ status: 'success', message: 'Cập nhật thành công!' });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

export default router;