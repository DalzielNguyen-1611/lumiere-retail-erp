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

// [GET] /api/dashboard -> Lấy toàn bộ dữ liệu thống kê cho Dashboard
router.get('/', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // 1. LẤY SỐ LIỆU KPI (Tháng này)
    const kpiSql = `
      SELECT 
        (SELECT NVL(SUM(TONGTIENTAMTINH), 0) FROM DON_HANG) AS TOTAL_REVENUE,
        (SELECT COUNT(MADONHANG) FROM DON_HANG) AS NEW_ORDERS,
        (SELECT COUNT(MADOITAC) FROM DOI_TAC WHERE LOAIDOITAC = 'Khách hàng') AS TOTAL_CUSTOMERS
      FROM DUAL
    `;
    const kpiRes = await connection.execute(kpiSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const kpiData = (kpiRes.rows as any[])[0] || { TOTAL_REVENUE: 0, NEW_ORDERS: 0, TOTAL_CUSTOMERS: 0 };

    // 2. LẤY DOANH THU 6 THÁNG GẦN NHẤT
    const revSql = `
      SELECT TO_CHAR(NGAYTAO, 'MM/YYYY') as "name", SUM(TONGTIENTAMTINH) as "value"
      FROM DON_HANG
      GROUP BY TO_CHAR(NGAYTAO, 'MM/YYYY'), TRUNC(NGAYTAO, 'MM')
      ORDER BY TRUNC(NGAYTAO, 'MM') DESC
      FETCH FIRST 6 ROWS ONLY
    `;
    const revRes = await connection.execute(revSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const revenueData = (revRes.rows || []).reverse();

    // 3. CƠ CẤU NGÀNH HÀNG (Tỷ trọng theo Thương hiệu)
    const catSql = `
      SELECT NVL(sp.THUONGHIEU, 'Khác') as "name", SUM(ct.THANHTIEN) as "value"
      FROM CHI_TIET_DON_HANG ct
      JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
      GROUP BY sp.THUONGHIEU
      ORDER BY "value" DESC
      FETCH FIRST 4 ROWS ONLY
    `;
    const catRes = await connection.execute(catSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const categoryData = catRes.rows || [];

    // 4. LƯỢNG ĐƠN HÀNG TRONG TUẦN (Từ T2 đến CN tuần này)
    const weekSql = `
      SELECT TO_CHAR(NGAYTAO, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH') as DAY_CODE, COUNT(*) as "orders"
      FROM DON_HANG
      GROUP BY TO_CHAR(NGAYTAO, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH')
    `;
    const weekRes = await connection.execute(weekSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Đưa vào mảng chuẩn T2 -> CN
    const weeklyData = [
      { name: 'T2', orders: 0 }, { name: 'T3', orders: 0 }, { name: 'T4', orders: 0 },
      { name: 'T5', orders: 0 }, { name: 'T6', orders: 0 }, { name: 'T7', orders: 0 }, { name: 'CN', orders: 0 }
    ];
    
    const dayMap: Record<string, number> = { 'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6 };
    (weekRes.rows || []).forEach((r: any) => {
        const idx = dayMap[r.DAY_CODE];
        if (idx !== undefined) weeklyData[idx].orders = r.orders;
    });

    // 5. HOẠT ĐỘNG GẦN ĐÂY (Lấy từ 3 bảng: Đơn hàng, Phiếu Kho, Giao dịch tiền)
    const actSql = `
      SELECT N'order' as "type", N'Đơn hàng mới' as "title", N'Đơn hàng POS trị giá ' || TO_CHAR(TONGTIENTAMTINH) as "desc", CAST(NGAYTAO AS TIMESTAMP) as "time" FROM DON_HANG
      UNION ALL
      SELECT N'import' as "type", N'Nhập kho' as "title", N'Phiếu kho ' || TO_NCHAR(SOPHIEU) || N' đã xử lý' as "desc", CAST(NGAYLAP AS TIMESTAMP) as "time" FROM PHIEU_KHO
      UNION ALL
      SELECT N'payment' as "type", N'Giao dịch thu/chi' as "title", TO_NCHAR(GHICHU) as "desc", CAST(NGAYGIAODICH AS TIMESTAMP) as "time" FROM GIAO_DICH_TIEN
      ORDER BY "time" DESC FETCH FIRST 5 ROWS ONLY
    `;
    const actRes = await connection.execute(actSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    res.json({
      status: 'success',
      data: {
        kpi: {
          totalRevenue: kpiData.TOTAL_REVENUE,
          newOrders: kpiData.NEW_ORDERS,
          totalCustomers: kpiData.TOTAL_CUSTOMERS,
          conversionRate: 68.4 // Tạm giữ tĩnh vì phụ thuộc vào Traffic web (nếu có)
        },
        revenueData,
        categoryData,
        weeklyData,
        recentActivities: actRes.rows || []
      }
    });

  } catch (err: any) {
    console.error("Dashboard Error:", err.message);
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;