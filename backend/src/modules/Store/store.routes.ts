
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

// 1. Lấy danh sách chi nhánh
router.get('/branches', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const query = `
      SELECT 
        c.MACUAHANG as "id",
        c.TENCUAHANG as "name",
        c.DIACHI as "address",
        c.SODIENTHOAI as "phone",
        c.QUANLY as "managerId",
        n.HOTEN as "managerName",
        (SELECT COUNT(*) FROM NHANVIEN WHERE MACUAHANG = c.MACUAHANG) as "staffCount",
        (SELECT COUNT(*) FROM KHO WHERE MACUAHANG = c.MACUAHANG) as "warehouseCount"
      FROM CUA_HANG c
      LEFT JOIN NHANVIEN n ON c.QUANLY = n.MANHANVIEN
      ORDER BY c.MACUAHANG ASC
    `;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// 2. Thêm chi nhánh mới
router.post('/branches', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { name, address, phone, managerId } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    const sql = `
      INSERT INTO CUA_HANG (TENCUAHANG, DIACHI, SODIENTHOAI, QUANLY)
      VALUES (:name, :address, :phone, :managerId)
    `;
    
    await connection.execute(sql, { name, address, phone, managerId }, { autoCommit: true });
    res.json({ status: 'success', message: 'Thêm chi nhánh thành công' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;
