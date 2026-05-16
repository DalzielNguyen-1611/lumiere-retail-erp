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
// 1. [POST] /check-in -> Ghi nhận giờ vào làm
// ============================================================================
router.post('/check-in', async (req: Request, res: Response) => {
  let connection;
  try {
    const { employeeId } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    await connection.execute(`
      INSERT INTO CHAM_CONG (MANHANVIEN, NGAY, GIOVAO, GIORA, SOGIOLAM, TANGCA, TRANGTHAI, GHICHU) 
      VALUES (:empId, TRUNC(SYSDATE), CURRENT_TIMESTAMP, CURRENT_TIMESTAMP + interval '1' second, 0, 0, 'Đang làm việc', 'Đã điểm danh vào ca')
    `, [employeeId], { autoCommit: true });
    
    res.json({ status: 'success', message: 'Check-in thành công!' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 2. [GET] /attendance/:id -> Lấy lịch sử chấm công cá nhân
// ============================================================================
router.get('/attendance/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection(dbConfig);
    
    // Đã thay đổi: ORDER BY GIOVAO DESC để sắp xếp chính xác theo thời gian thực (gần nhất ở trên)
    const result = await connection.execute(`
      SELECT 
        TO_CHAR(NGAY, 'DD/MM/YYYY') as "date", 
        TO_CHAR(GIOVAO, 'HH24:MI:SS') as "checkIn", 
        TO_CHAR(GIORA, 'HH24:MI:SS') as "checkOut",
        SOGIOLAM as "workHours",
        TANGCA as "overtime",
        TRANGTHAI as "status",
        GHICHU as "notes"
      FROM CHAM_CONG 
      WHERE MANHANVIEN = :id 
      ORDER BY GIOVAO DESC FETCH FIRST 30 ROWS ONLY
    `, [id], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 3. [POST] /leave -> Tạo đơn xin nghỉ phép (Tự động tìm Quản lý chi nhánh)
// ============================================================================
router.post('/leave', async (req: Request, res: Response) => {
  let connection;
  try {
    const { employeeId, type, fromDate, toDate, days, reason } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    // BƯỚC 1: Tìm mã QUANLY của chi nhánh mà nhân viên đang thuộc về
    const managerResult = await connection.execute(`
      SELECT CH.QUANLY 
      FROM NHANVIEN NV
      JOIN CUA_HANG CH ON NV.MACUAHANG = CH.MACUAHANG
      WHERE NV.MANHANVIEN = :empId
    `, [employeeId], { outFormat: oracledb.OUT_FORMAT_OBJECT });

    const managerId = managerResult.rows && (managerResult.rows[0] as any)?.QUANLY;

    if (!managerId) {
      return res.status(400).json({ 
        status: 'error', 
        message: 'Không tìm thấy Quản lý cho chi nhánh của bạn. Vui lòng kiểm tra lại thông tin nhân sự!' 
      });
    }

    // BƯỚC 2: Thêm đơn vào bảng DON_XIN_NGHI_PHEP với NGUOIDUYET là mã quản lý vừa tìm được
    await connection.execute(`
      INSERT INTO DON_XIN_NGHI_PHEP (MANHANVIEN, LOAINGHI, TUNGAY, DENNGAY, SONGAY, LYDO, TRANGTHAI, NGUOIDUYET)
      VALUES (:empId, :type, TO_DATE(:fromDate, 'YYYY-MM-DD'), TO_DATE(:toDate, 'YYYY-MM-DD'), :days, :reason, 'Chờ duyệt', :managerId)
    `, {
      empId: employeeId, type, fromDate, toDate, days, reason, managerId
    }, { autoCommit: true });
    
    res.json({ status: 'success', message: 'Đã gửi đơn xin nghỉ phép đến Quản lý chi nhánh!' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 3.5 [GET] /leave-history/:id -> Lấy danh sách đơn nghỉ phép của nhân viên
// ============================================================================
router.get('/leave-history/:id', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`
      SELECT 
        LOAINGHI as "type",
        TO_CHAR(TUNGAY, 'DD/MM/YYYY') as "fromDate",
        TO_CHAR(DENNGAY, 'DD/MM/YYYY') as "toDate",
        SONGAY as "days",
        TRANGTHAI as "status"
      FROM DON_XIN_NGHI_PHEP
      WHERE MANHANVIEN = :id
      ORDER BY TUNGAY DESC
    `, [id], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 4. [PUT] /check-out -> Ghi nhận giờ ra (Kết ca)
// ============================================================================
router.put('/check-out', async (req: Request, res: Response) => {
  let connection;
  try {
    const { employeeId } = req.body;
    connection = await oracledb.getConnection(dbConfig);
    
    // TỰ ĐỘNG TÍNH TOÁN SOGIOLAM = GIORA - GIOVAO (Tính theo giờ, làm tròn 2 chữ số thập phân)
    const result = await connection.execute(`
      UPDATE CHAM_CONG 
      SET GIORA = CURRENT_TIMESTAMP, 
          TRANGTHAI = 'Hoàn thành ca',
          GHICHU = 'Đã kết ca',
          SOGIOLAM = ROUND(EXTRACT(DAY FROM (CURRENT_TIMESTAMP - GIOVAO)) * 24 + 
                           EXTRACT(HOUR FROM (CURRENT_TIMESTAMP - GIOVAO)) + 
                           EXTRACT(MINUTE FROM (CURRENT_TIMESTAMP - GIOVAO)) / 60, 2)
      WHERE MANHANVIEN = :empId 
        AND TRUNC(NGAY) = TRUNC(SYSDATE) 
        AND TRANGTHAI = 'Đang làm việc'
    `, [employeeId], { autoCommit: true });
    
    if (result.rowsAffected === 0) {
      return res.status(400).json({ status: 'error', message: 'Bạn chưa Vào Ca hôm nay hoặc đã Kết Ca rồi!' });
    }
    
    res.json({ status: 'success', message: 'Kết ca thành công!' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;