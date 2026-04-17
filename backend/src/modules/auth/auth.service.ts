import { AppDataSource } from '../../config/database';
import { TaiKhoanNhanVien } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import * as dotenv from 'dotenv';

// Đảm bảo Node.js đọc được file .env
dotenv.config();

export class AuthService {
  // Lấy kết nối đến bảng TAI_KHOAN_NHAN_VIEN
  private userRepository = AppDataSource.getRepository(TaiKhoanNhanVien);

  async login(username: string, passwordRaw: string) {
    // 1. Kiểm tra xem user có tồn tại trong Oracle không
    const user = await this.userRepository.findOne({ where: { username } });

    if (!user) {
      throw new Error('Tài khoản không tồn tại trong hệ thống!');
    }

    // 2. Kiểm tra trạng thái tài khoản (1 = Hoạt động, 0 = Khóa)
    if (user.trangThai === 0) {
      throw new Error('Tài khoản này đã bị khóa. Vui lòng liên hệ Admin!');
    }

    // 3. So sánh mật khẩu (So sánh password gửi lên với PASSWORDHASH trong DB)
    const isPasswordValid = await bcrypt.compare(passwordRaw, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Mật khẩu không chính xác!');
    }

    // 4. (Tùy chọn) Cập nhật LAST_LOGIN vào Oracle
    user.lastLogin = new Date();
    await this.userRepository.save(user);

    // 5. Lấy Secret Key từ file .env
    const secretKey = process.env.JWT_SECRET;
    if (!secretKey) {
      throw new Error('Lỗi Server: Chưa cấu hình JWT_SECRET trong file .env');
    }

    // 6. Ký và tạo chuỗi Token (Giấy thông hành)
    const token = jwt.sign(
      { 
        maNhanVien: user.maNhanVien, 
        username: user.username 
        // Sau này khi team bạn xử lý xong bảng VAI_TRO, bạn sẽ thêm logic lấy mảng JSON Quyền Hạn và nhét vào đây
      },
      secretKey,
      { expiresIn: '8h' } // Token có giá trị trong 8 tiếng làm việc
    );

    // 7. Trả dữ liệu về cho Controller
    return {
      token,
      user: {
        maNhanVien: user.maNhanVien,
        username: user.username,
      }
    };
  }
}