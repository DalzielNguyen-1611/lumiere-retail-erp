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



// [GET] /api/products -> Lấy sản phẩm cho màn hình POS
router.get('/products', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const query = `
      SELECT sp.MASANPHAM AS "id", sp.TENSANPHAM AS "name", sp.MAVACH AS "sku", sp.MAVACH AS "barcode",
             sp.GIANIEMYET AS "price", sp.THUONGHIEU AS "category", sp.HINHANH AS "img", NVL(tk.SOLUONGTON, 0) AS "stock"
      FROM SAN_PHAM sp
      LEFT JOIN TON_KHO tk ON sp.MASANPHAM = tk.MASANPHAM
      WHERE sp.COTHEBAN = 1 AND sp.POS = 1
    `;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const rows = (result.rows as any[]) || [];
    const products = rows.map(row => ({
      ...row,
      img: row.img || 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200',
      status: row.stock > 10 ? 'In Stock' : (row.stock > 0 ? 'Low Stock' : 'Out of Stock')
    }));
    res.json({ status: 'success', data: products });
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message }); } 
  finally { if (connection) await connection.close(); }
});

// [POST] /api/orders/charge -> Thanh toán đơn hàng
router.post('/orders/charge', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    const { cart, total, customerId, phuongThuc } = req.body;
    if (!cart || !Array.isArray(cart) || cart.length === 0) return res.status(400).json({ status: 'error', message: 'Giỏ hàng rỗng' });

    connection = await oracledb.getConnection(dbConfig);
    connection.autoCommit = false;

    const finalCustomerId = (customerId && customerId !== 'GUEST') ? parseInt(customerId) : 1;
    await connection.execute(`
      INSERT INTO DON_HANG (MACUAHANG, MADOITAC, MANHANVIEN, NGAYTAO, TONGTIENTAMTINH, DIEMMUONDUNG, TRANGTHAI, GHICHU)
      VALUES (1, :p_khachhang, 1, SYSDATE, :p_tongtien, 0, N'Chờ thanh toán', N'Thanh toán tại POS')
    `, { p_khachhang: finalCustomerId, p_tongtien: Math.round(total) });

    const resultGetId = await connection.execute(`SELECT MAX(MADONHANG) as newId FROM DON_HANG`, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const newOrderId = (resultGetId.rows as any[])[0]?.NEWID;

    for (const item of cart) {
      await connection.execute(`
        INSERT INTO CHI_TIET_DON_HANG (MASANPHAM, MADONHANG, SOLUONG, DONGIA, THANHTIEN) VALUES (:masp, :madh, :sl, :gia, :thanhtien)
      `, { masp: item.id, madh: newOrderId, sl: item.qty, gia: item.price, thanhtien: Math.round(item.price * item.qty) });
    }

    const paymentMethodStr = phuongThuc === 'cash' ? 'Tiền mặt' : 'Chuyển khoản';
    try {
      await connection.execute(`BEGIN SP_THANH_TOAN_DON_HANG(:p_MADONHANG, :p_PHUONGTHUCTHANHTHOAN); END;`, { p_MADONHANG: newOrderId, p_PHUONGTHUCTHANHTHOAN: paymentMethodStr });
    } catch (procErr: any) { console.warn("Lỗi Procedure:", procErr.message); }

    await connection.commit();
    res.json({ status: 'success', message: 'Thanh toán thành công!', orderId: newOrderId });
  } catch (err: any) {
    if (connection) await connection.rollback();
    res.status(500).json({ status: 'error', message: err.message });
  } finally { if (connection) await connection.close(); }
});

export default router;