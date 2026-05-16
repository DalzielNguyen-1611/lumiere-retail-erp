import { AppDataSource } from '../../config/database';
import { TaiKhoanNhanVien } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

dotenv.config();

export class AuthService {
  private userRepository = AppDataSource.getRepository(TaiKhoanNhanVien);

  async login(username: string, passwordRaw: string) {
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new Error('Tài khoản không tồn tại trong hệ thống!');
    }

    if (user.trangThai === 0) {
      throw new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ Admin!');
    }

    const isPasswordValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu không chính xác!');
    }

    // --- LOGIC LẤY CHỨC VỤ (ROLE) TỪ DATABASE ---
    let role = 'staff'; 
    try {
      // Dùng Raw Query của TypeORM để lấy quyền mới nhất
      const roleRes = await AppDataSource.query(
        `SELECT VT.TENVAITRO 
         FROM PHAN_QUYEN_NHAN_VIEN PQ 
         JOIN VAI_TRO VT ON PQ.MAVAITRO = VT.MAVAITRO 
         WHERE PQ.MANHANVIEN = ${user.maNhanVien} 
         ORDER BY PQ.NGAYGAN DESC 
         FETCH FIRST 1 ROWS ONLY`
      );

      if (roleRes && roleRes.length > 0) {
        const roleName = String(roleRes[0].TENVAITRO).toLowerCase();
        
        // Map tên tiếng Việt sang tiếng Anh cho Frontend hiểu
        if (roleName.includes('admin')) role = 'admin';
        else if (roleName.includes('manager') || roleName.includes('quản lý') || roleName.includes('quan ly')) role = 'manager';
        else if (roleName.includes('sales') || roleName.includes('bán hàng')) role = 'sales';
        else if (roleName.includes('kho')) role = 'warehouse';
        else if (roleName.includes('kế toán') || roleName.includes('ke toan') || roleName.includes('ketoan')) role = 'accounting';
      } else if (user.username.toLowerCase() === 'admin') {
         role = 'admin'; // Backup nếu admin chưa được gán quyền
      }
    } catch (error) {
      console.error("Lỗi khi lấy Role từ Database:", error);
    }

    // Cập nhật lần đăng nhập cuối
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('Lỗi Server: Chưa cấu hình JWT_SECRET trong file .env');
    }

    // Nhét 'role' vào Token
    const token = jwt.sign(
      { maNhanVien: user.maNhanVien, username: user.username, role },
      secretKey,
      { expiresIn: '8h' }
    );

    return {
      token,
      user: {
        maNhanVien: user.maNhanVien,
        username: user.username,
        role // BẮT BUỘC PHẢI TRẢ ROLE VỀ CHO FRONTEND
      }
    };
  }
}