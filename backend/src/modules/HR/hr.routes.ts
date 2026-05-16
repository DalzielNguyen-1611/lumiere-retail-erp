// File: src/modules/HR/hr.routes.ts
import { Router, Request, Response } from 'express';
import oracledb from 'oracledb';
import bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();
const router = Router();
const dbConfig = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`
};

// ============================================================================
// 1. LẤY DANH SÁCH NHÂN SỰ TỪ DATABASE
// ============================================================================
router.get('/staff', async (req: Request, res: Response): Promise<any> => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const query = `
      SELECT 
        'EMP-' || n.MANHANVIEN AS "id",
        n.HOTEN AS "name",
        NVL(vt.TENVAITRO, 'Nhân viên') AS "role",
        CASE 
          WHEN LOWER(vt.TENVAITRO) LIKE '%admin%' OR LOWER(vt.TENVAITRO) LIKE '%manage%' THEN 'Quản lý'
          WHEN LOWER(vt.TENVAITRO) LIKE '%kho%' THEN 'Kho vận'
          WHEN LOWER(vt.TENVAITRO) LIKE '%sale%' THEN 'Bán hàng'
          WHEN LOWER(vt.TENVAITRO) LIKE '%toan%' THEN 'Kế toán'
          ELSE 'Nhân viên' 
        END AS "dept",
        'HQ' AS "store",
        NVL(n.SDT, 'Chưa cập nhật') AS "phone",
        NVL(n.EMAIL, 'Chưa cập nhật') AS "email",
        'https://images.unsplash.com/photo-1745434159123-5b99b94206ca?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=200' AS "img",
        NVL(n.TRANGTHAI, 'Đang làm việc') AS "status",
        TO_CHAR(n.NGAYVAOLAM, 'DD/MM/YYYY') AS "joined"
      FROM NHANVIEN n
      LEFT JOIN PHAN_QUYEN_NHAN_VIEN pq ON n.MANHANVIEN = pq.MANHANVIEN
      LEFT JOIN VAI_TRO vt ON pq.MAVAITRO = vt.MAVAITRO
      ORDER BY n.MANHANVIEN DESC
    `;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 2. THÊM NHÂN VIÊN MỚI & TỰ ĐỘNG TẠO TÀI KHOẢN
// ============================================================================
router.post('/staff', async (req: Request, res: Response): Promise<any> => {
  // ... (Giữ nguyên logic thêm nhân sự cũ của em) ...
  let connection;
  try {
    const { name, phone, email, roleCode } = req.body;
    if (!name || !phone) return res.status(400).json({ status: 'error', message: 'Tên và Số điện thoại là bắt buộc' });

    connection = await oracledb.getConnection(dbConfig);
    const hashedPassword = await bcrypt.hash('123456', 10);
    const prefix = roleCode || 'sales'; 

    const sql = `
      DECLARE
        v_id NUMBER; v_username VARCHAR2(50); v_role_id NUMBER;
      BEGIN
        INSERT INTO NHANVIEN (MACUAHANG, HOTEN, SDT, EMAIL, NGAYVAOLAM, TRANGTHAI)
        VALUES (1, :name, :phone, :email, SYSDATE, 'Active') RETURNING MANHANVIEN INTO v_id;
        
        v_username := :prefix || v_id;

        INSERT INTO TAI_KHOAN_NHAN_VIEN (MANHANVIEN, USERNAME, PASSWORDHASH, PASSWORDHASHHISTORY, TRANG_THAI, NGAYTAO, LAST_LOGIN)
        VALUES (v_id, v_username, :hash, :hash, 1, SYSDATE, SYSDATE);

        BEGIN
            IF :prefix = 'manager' THEN SELECT MIN(MAVAITRO) INTO v_role_id FROM VAI_TRO WHERE LOWER(TENVAITRO) LIKE '%manager%' OR LOWER(TENVAITRO) LIKE '%admin%';
            ELSIF :prefix = 'sales' THEN SELECT MIN(MAVAITRO) INTO v_role_id FROM VAI_TRO WHERE LOWER(TENVAITRO) LIKE '%sales%';
            ELSIF :prefix = 'kho' THEN SELECT MIN(MAVAITRO) INTO v_role_id FROM VAI_TRO WHERE LOWER(TENVAITRO) LIKE '%kho%';
            ELSIF :prefix = 'ketoan' THEN SELECT MIN(MAVAITRO) INTO v_role_id FROM VAI_TRO WHERE LOWER(TENVAITRO) LIKE '%toan%';
            END IF;
            
            IF v_role_id IS NOT NULL THEN
                INSERT INTO PHAN_QUYEN_NHAN_VIEN (MAVAITRO, MANHANVIEN, NGAYGAN) VALUES (v_role_id, v_id, SYSDATE);
            END IF;
        EXCEPTION WHEN OTHERS THEN NULL; 
        END;

        :out_user := v_username;
      END;
    `;
    
    const result = await connection.execute(sql, { 
      name, phone, email: email || '', prefix, hash: hashedPassword,
      out_user: { dir: oracledb.BIND_OUT, type: oracledb.STRING }
    }, { autoCommit: true });

    res.json({ status: 'success', message: 'Đã thêm nhân sự!', account: { username: (result.outBinds as any).out_user, password: '123456' }});
  } catch (err: any) { res.status(500).json({ status: 'error', message: err.message });
  } finally { if (connection) await connection.close(); }
});

// ============================================================================
// 3. LẤY DỮ LIỆU CHẤM CÔNG THỰC TẾ (API MỚI)
// ============================================================================
router.get('/attendance', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // Lấy dữ liệu của tuần hiện tại (Từ thứ 2)
    const query = `
      SELECT 
        N.MANHANVIEN, N.HOTEN, C.NGAY, 
        TO_CHAR(C.NGAY, 'D') AS NGAY_TRONG_TUAN, 
        C.TRANGTHAI, NVL(C.TANGCA, 0) AS TANGCA
      FROM NHANVIEN N
      LEFT JOIN CHAM_CONG C 
        ON N.MANHANVIEN = C.MANHANVIEN AND C.NGAY >= TRUNC(SYSDATE, 'IW')
      ORDER BY N.MANHANVIEN, C.NGAY
    `;
    const result = await connection.execute(query, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    
    // Gom nhóm dữ liệu cho Frontend
    const empMap = new Map();
    (result.rows || []).forEach((row: any) => {
      if (!empMap.has(row.MANHANVIEN)) {
        empMap.set(row.MANHANVIEN, {
          name: row.HOTEN,
          days: ["Nghỉ", "Nghỉ", "Nghỉ", "Nghỉ", "Nghỉ", "Nghỉ", "Nghỉ"], // Mặc định là nghỉ
          ot: 0
        });
      }
      
      if (row.NGAY) {
        const emp = empMap.get(row.MANHANVIEN);
        // Oracle 'D' trả về 1=CN, 2=T2... Ta chuyển về index 0=T2, ..., 6=CN
        let dayIndex = parseInt(row.NGAY_TRONG_TUAN) - 2;
        if (dayIndex === -1) dayIndex = 6; 
        
        let status = row.TRANGTHAI;
        // Đổi tên trạng thái cho khớp với mảng màu Frontend
        if (status === 'Đang làm việc' || status === 'Hoàn thành ca') status = 'Đi làm';
        
        if (dayIndex >= 0 && dayIndex <= 6) emp.days[dayIndex] = status;
        emp.ot += row.TANGCA;
      }
    });

    res.json({ status: 'success', data: Array.from(empMap.values()) });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 4. LẤY DANH SÁCH ĐƠN XIN NGHỈ CHỜ DUYỆT (API MỚI)
// ============================================================================
router.get('/leaves/pending', async (req: Request, res: Response) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(`
      SELECT 
        D.MADON as "id", N.HOTEN as "empName", D.LOAINGHI as "type", 
        TO_CHAR(D.TUNGAY, 'DD/MM/YYYY') as "fromDate", 
        TO_CHAR(D.DENNGAY, 'DD/MM/YYYY') as "toDate", 
        D.SONGAY as "days", D.LYDO as "reason"
      FROM DON_XIN_NGHI_PHEP D
      JOIN NHANVIEN N ON D.MANHANVIEN = N.MANHANVIEN
      WHERE D.TRANGTHAI = 'Chờ duyệt'
      ORDER BY D.MADON DESC
    `, [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    res.json({ status: 'success', data: result.rows || [] });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

// ============================================================================
// 5. DUYỆT HOẶC TỪ CHỐI ĐƠN NGHỈ PHÉP (API MỚI)
// ============================================================================
router.put('/leaves/:id/status', async (req: Request, res: Response) => {
  let connection;
  try {
    const { id } = req.params;
    const { status } = req.body; // Bắn lên 'Đã duyệt' hoặc 'Từ chối'
    connection = await oracledb.getConnection(dbConfig);
    
    await connection.execute(`
      UPDATE DON_XIN_NGHI_PHEP SET TRANGTHAI = :status WHERE MADON = :id
    `, { status, id }, { autoCommit: true });
    
    res.json({ status: 'success', message: 'Cập nhật trạng thái đơn thành công!' });
  } catch (err: any) {
    res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) await connection.close();
  }
});

export default router;