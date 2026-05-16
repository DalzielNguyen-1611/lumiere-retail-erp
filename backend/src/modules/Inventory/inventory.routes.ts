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

// [GET] /api/inventory/products -> Lấy toàn bộ hàng trong kho
router.get('/inventory/products', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const query = `
      SELECT sp.MASANPHAM AS "id", sp.TENSANPHAM AS "name", sp.MAVACH AS "sku", sp.THUONGHIEU AS "category",
             sp.GIANIEMYET AS "price", sp.HINHANH AS "img", sp.COTHEBAN AS "isSellable", NVL(tk.SOLUONGTON, 0) AS "stock"
      FROM SAN_PHAM sp LEFT JOIN TON_KHO tk ON sp.MASANPHAM = tk.MASANPHAM`;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = (result.rows as any[]) || [];
    const processedData = rows.map(row => ({
      ...row, status: row.stock > 10 ? 'In Stock' : (row.stock > 0 ? 'Low Stock' : 'Out of Stock')
    }));
    res.json({ status: 'success', data: processedData });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [POST] /api/products -> Thêm sản phẩm mới vào DB
router.post('/products', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { name, sku, category, price, stock, img, isSellable } = req.body;
    if (!name || !price) return res.status(400).json({ status: 'error', message: 'Tên và Giá là bắt buộc' });

    connection = await oracledb.getConnection(dbConfig);
    const plsql = `
      DECLARE v_id NUMBER;
      BEGIN
        INSERT INTO SAN_PHAM (TENSANPHAM, MAVACH, THUONGHIEU, GIANIEMYET, HINHANH, COTHEBAN, POS, COTHEMUA, DONVITINH, THUE, XUATXU, PHUHOP, THANHPHAN, HUONGDAN, MOTA)
        VALUES (:name, :sku, :category, :price, :img, :canSell, :canSell, 1, 'Cái', 0.1, 'Đang cập nhật', 'Mọi đối tượng', 'Đang cập nhật', 'Đang cập nhật', 'Đang cập nhật')
        RETURNING MASANPHAM INTO v_id;
        INSERT INTO TON_KHO (MASANPHAM, MAKHO, SOLUONGTON, NGAYCAPNHAP) VALUES (v_id, 1, :stock, SYSTIMESTAMP);
        :out_id := v_id;
      END;`;
    const result = await connection.execute(plsql, {
      name, sku: sku || `SKU-${Date.now()}`, category: category || 'Khác', price: parseInt(price), img: img || '/img/default-product.png',
      canSell: isSellable ? 1 : 0, stock: parseInt(stock) || 0, out_id: { dir: oracledb.BIND_OUT, type: oracledb.NUMBER }
    }, { autoCommit: true });
    res.json({ status: 'success', message: 'Thêm sản phẩm thành công', id: result.outBinds?.out_id });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [GET] /api/san-pham -> API cũ dự phòng
router.get('/san-pham', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT * FROM SAN_PHAM`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json(result.rows || []);
  } catch (err: any) { res.status(500).json({ error: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [GET] /api/inventory/warehouses -> Lấy danh sách kho hàng
router.get('/inventory/warehouses', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`SELECT MAKHO as \"id\", TENKHO as \"name\", DIACHI as \"address\" FROM KHO`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

export default router;
