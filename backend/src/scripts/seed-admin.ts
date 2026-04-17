import { AppDataSource } from '../config/database';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

async function runSeed() {
  try {
    await AppDataSource.initialize();
    console.log('✅ Đã kết nối Oracle. Bắt đầu quá trình tạo dữ liệu theo chuỗi khóa ngoại...');

    // ====================================================================
    // BƯỚC 1: TẠO CỬA HÀNG GỐC (Ràng buộc 52)
    // ====================================================================
    console.log('⏳ Bước 1: Đang tạo Cửa hàng gốc...');
    try {
      // Giả định bảng CUA_HANG có cột MACUAHANG. 
      // Nếu bảng của bạn có thêm các cột NOT NULL khác (như TENCUAHANG, DIACHI), hãy thêm vào câu lệnh này.
      await AppDataSource.query(`
        INSERT INTO CUA_HANG (MACUAHANG) 
        VALUES (1)
      `);
      console.log('   -> Đã tạo Cửa hàng (MACUAHANG = 1)');
    } catch (e: any) {
      if (e.message.includes('ORA-00001')) {
        console.log('   -> Cửa hàng số 1 đã tồn tại, bỏ qua tạo mới.');
      } else {
        console.log('   -> Lỗi khi tạo Cửa hàng (Có thể do thiếu cột NOT NULL). Lỗi: ', e.message);
      }
    }

    // ====================================================================
    // BƯỚC 2: TẠO NHÂN VIÊN GỐC (Ràng buộc 21)
    // ====================================================================
    console.log('⏳ Bước 2: Đang tạo Nhân viên gốc...');
    try {
      // Giả định bảng NHANVIEN có MANHANVIEN và MACUAHANG.
      // Nếu có thêm cột như TENNHANVIEN bắt buộc, bạn nhớ bổ sung nhé.
      await AppDataSource.query(`
        INSERT INTO NHANVIEN (MANHANVIEN, MACUAHANG) 
        VALUES (1000, 1)
      `);
      console.log('   -> Đã tạo Nhân viên (MANHANVIEN = 1000 thuộc Cửa hàng 1)');
    } catch (e: any) {
      if (e.message.includes('ORA-00001')) {
        console.log('   -> Nhân viên số 1000 đã tồn tại, bỏ qua tạo mới.');
      } else {
        console.log('   -> Lỗi khi tạo Nhân viên: ', e.message);
      }
    }

    // ====================================================================
    // BƯỚC 3: TẠO TÀI KHOẢN ĐĂNG NHẬP
    // ====================================================================
    console.log('⏳ Bước 3: Đang tạo Tài khoản Đăng nhập...');
    
    // Kiểm tra xem user admin đã có chưa
    const checkUser = await AppDataSource.query(`SELECT * FROM TAI_KHOAN_NHAN_VIEN WHERE USERNAME = 'admin'`);
    if (checkUser.length > 0) {
      console.log('⚠️ Tài khoản admin đã tồn tại trong hệ thống!');
      process.exit(0);
    }

    // Mã hóa mật khẩu '123456'
    const hashedPassword = await bcrypt.hash('123456', 10);

    // Dùng tham số truyền vào (:1, :2...) để tránh lỗi SQL Injection và lỗi ký tự đặc biệt của Oracle
    await AppDataSource.query(`
      INSERT INTO TAI_KHOAN_NHAN_VIEN 
      (MANHANVIEN, USERNAME, PASSWORDHASH, PASSWORDHASHHISTORY, NGAYTAO, LAST_LOGIN, TRANG_THAI) 
      VALUES (:1, :2, :3, :4, CURRENT_DATE, CURRENT_TIMESTAMP, :5)
    `, [1000, 'admin', hashedPassword, hashedPassword, 1]);

    console.log('🎉 THÀNH CÔNG! Đã tạo tài khoản: admin / 123456');
    process.exit(0);

  } catch (error) {
    console.error('❌ QUÁ TRÌNH THẤT BẠI LỖI TỔNG:', error);
    process.exit(1);
  }
}

runSeed();