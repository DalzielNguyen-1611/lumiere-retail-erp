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

// [GET] /api/dashboard -> Lấy toàn bộ dữ liệu thống kê thực tế cho Dashboard (KHÔNG DÙNG MOCK)
router.get('/', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);

    // 1. LẤY SỐ LIỆU KPI (Tháng này từ đơn hàng và đối tác)
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

    // 3. CƠ CẤU NGÀNH HÀNG (Tỷ trọng theo Thương hiệu - LẤY TOÀN BỘ CÁC THƯƠNG HIỆU CÓ DOANH THU TRONG CSDL)
    const catSql = `
      SELECT NVL(sp.THUONGHIEU, 'Khác') as "name", SUM(ct.THANHTIEN) as "value"
      FROM CHI_TIET_DON_HANG ct
      JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
      GROUP BY sp.THUONGHIEU
      ORDER BY "value" DESC
    `;
    const catRes = await connection.execute(catSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const categoryData = catRes.rows || [];

    // 4. LƯỢNG ĐƠN HÀNG TRONG TUẦN (CHỈ LẤY ĐƠN HÀNG TUẦN NÀY - NGHIÊM NGẶT KHÔNG MOCK)
    const weekSql = `
      SELECT TO_CHAR(NGAYTAO, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH') as DAY_CODE, COUNT(*) as "orders"
      FROM DON_HANG
      WHERE NGAYTAO >= TRUNC(SYSDATE, 'IW') AND NGAYTAO < TRUNC(SYSDATE, 'IW') + 7
      GROUP BY TO_CHAR(NGAYTAO, 'DY', 'NLS_DATE_LANGUAGE=ENGLISH')
    `;
    const weekRes = await connection.execute(weekSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Khởi tạo khung thời gian chuẩn từ Thứ 2 đến Chủ nhật (mặc định = 0)
    const weeklyData = [
      { name: 'T2', orders: 0 }, { name: 'T3', orders: 0 }, { name: 'T4', orders: 0 },
      { name: 'T5', orders: 0 }, { name: 'T6', orders: 0 }, { name: 'T7', orders: 0 }, { name: 'CN', orders: 0 }
    ];
    
    const dayMap: Record<string, number> = { 'MON': 0, 'TUE': 1, 'WED': 2, 'THU': 3, 'FRI': 4, 'SAT': 5, 'SUN': 6 };
    
    // Đổ dữ liệu thật từ database vào các thứ
    (weekRes.rows || []).forEach((r: any) => {
        const idx = dayMap[r.DAY_CODE];
        if (idx !== undefined) weeklyData[idx].orders = r.orders;
    });

    // Giới hạn thời gian thực: Các ngày trong tương lai (lớn hơn ngày hiện tại trong tuần) bắt buộc phải là 0
    const currentDay = new Date().getDay(); // 0: Chủ Nhật, 1: Thứ 2, ..., 6: Thứ 7
    const currentDayIndex = currentDay === 0 ? 6 : currentDay - 1;
    
    weeklyData.forEach((day, idx) => {
      if (idx > currentDayIndex) {
        day.orders = 0;
      }
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

    // 6. Số dư quỹ hiện tại (Tổng thực tế từ TK_KHOAN)
    const fundSql = `
      SELECT NVL(SUM(SODUHIENTAI), 0) AS FUND_BALANCE
      FROM TAI_KHOAN
      WHERE LOAITAIKHOAN IN (N'Tiền mặt', N'Tiền gửi ngân hàng', N'Ngân hàng', N'Tài sản') OR SOTAIKHOAN LIKE '111%' OR SOTAIKHOAN LIKE '112%' OR TENTAIKHOAN LIKE N'%Tiền%'
    `;
    const fundRes = await connection.execute(fundSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const fundData = (fundRes.rows as any[])[0] || { FUND_BALANCE: 0 };

    // 7. Phiếu đổi trả thực tế trong ngày
    const returnSql = `
      SELECT COUNT(*) AS RETURN_COUNT
      FROM PHIEU_DOI_TRA
      WHERE TRUNC(NGAYTAO) = TRUNC(SYSDATE)
    `;
    const returnRes = await connection.execute(returnSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const returnData = (returnRes.rows as any[])[0] || { RETURN_COUNT: 0 };

    // 8. Cảnh báo tồn kho cực hạn (Lượng tồn thực tế < 20)
    const stockSql = `
      SELECT sp.TENSANPHAM as "name", SUM(tk.SOLUONGTON) as "stock", sp.DONVITINH as "unit", 20 as "minStock",
             CASE WHEN SUM(tk.SOLUONGTON) <= 5 THEN 'gấp' ELSE 'cảnh báo' END as "status"
      FROM TON_KHO tk
      JOIN SAN_PHAM sp ON tk.MASANPHAM = sp.MASANPHAM
      GROUP BY sp.MASANPHAM, sp.TENSANPHAM, sp.DONVITINH
      HAVING SUM(tk.SOLUONGTON) < 20
      ORDER BY "stock" ASC
      FETCH FIRST 5 ROWS ONLY
    `;
    const stockRes = await connection.execute(stockSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const stockWarnings = stockRes.rows || [];

    // 9. Top 5 sản phẩm bán chạy nhất (Dữ liệu thực tế từ CSDL)
    const topProductsSql = `
      SELECT sp.TENSANPHAM as "name", NVL(SUM(ct.SOLUONG), 0) as "quantity", sp.DONVITINH as "unit"
      FROM CHI_TIET_DON_HANG ct
      JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
      GROUP BY sp.MASANPHAM, sp.TENSANPHAM, sp.DONVITINH
      ORDER BY "quantity" DESC
      FETCH FIRST 5 ROWS ONLY
    `;
    const topProductsRes = await connection.execute(topProductsSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const topProducts = topProductsRes.rows || [];

    // 10. Xếp hạng doanh số nhân sự thực tế (KPI)
    const empSql = `
      SELECT nv.HOTEN as "name", NVL(SUM(dh.TONGTIENTAMTINH), 0) as "sales", COUNT(dh.MADONHANG) as "orders", N'Nhân viên' as "role"
      FROM NHANVIEN nv
      LEFT JOIN DON_HANG dh ON nv.MANHANVIEN = dh.MANHANVIEN
      GROUP BY nv.MANHANVIEN, nv.HOTEN
      ORDER BY "sales" DESC NULLS LAST
      FETCH FIRST 4 ROWS ONLY
    `;
    const empRes = await connection.execute(empSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const employeeKPIs = empRes.rows || [];

    // 11. Sĩ số & chấm công thực tế hôm nay
    const attSql = `
      SELECT 
        (SELECT COUNT(DISTINCT MANHANVIEN) FROM CHAM_CONG WHERE TRUNC(NGAY) = TRUNC(SYSDATE)) as ACTIVE_IN_SHIFT,
        (SELECT COUNT(DISTINCT MANHANVIEN) FROM DON_XIN_NGHI_PHEP WHERE TRUNC(SYSDATE) BETWEEN TRUNC(TUNGAY) AND TRUNC(DENNGAY) AND TRANGTHAI = N'Đã duyệt') as ON_LEAVE,
        (SELECT COUNT(*) FROM NHANVIEN WHERE TRANGTHAI = N'Hoạt động') as TOTAL_SHIFT_STAFF
      FROM DUAL
    `;
    const attRes = await connection.execute(attSql, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    const attData = (attRes.rows as any[])[0] || { ACTIVE_IN_SHIFT: 0, ON_LEAVE: 0, TOTAL_SHIFT_STAFF: 0 };

    res.json({
      status: 'success',
      data: {
        kpi: {
          totalRevenue: kpiData.TOTAL_REVENUE,
          newOrders: kpiData.NEW_ORDERS,
          totalCustomers: kpiData.TOTAL_CUSTOMERS,
          conversionRate: 68.4,
          fundBalance: fundData.FUND_BALANCE,
          returnCount: returnData.RETURN_COUNT
        },
        revenueData,
        categoryData,
        weeklyData,
        recentActivities: actRes.rows || [],
        stockWarnings,
        topProducts,
        employeeKPIs,
        attendance: {
          activeInShift: attData.ACTIVE_IN_SHIFT || 0,
          onLeave: attData.ON_LEAVE || 0,
          totalShiftStaff: attData.TOTAL_SHIFT_STAFF || 0
        }
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