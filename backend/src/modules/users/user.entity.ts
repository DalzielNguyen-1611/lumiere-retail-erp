import { Entity, Column, PrimaryColumn } from 'typeorm';

// @Entity phải trỏ chính xác tên bảng trong Oracle (Viết hoa)
@Entity('TAI_KHOAN_NHAN_VIEN') 
export class TaiKhoanNhanVien {
  
  @PrimaryColumn({ name: 'MANHANVIEN', type: 'number' })
  maNhanVien: number;

  @Column({ name: 'USERNAME', type: 'nvarchar2', length: 100, unique: true })
  username: string;

  // Đã sử dụng đúng tên cột PASSWORDHASH mà bạn đã dùng lệnh ALTER TABLE để sửa
  @Column({ name: 'PASSWORDHASH', type: 'nvarchar2', length: 255 })
  passwordHash: string;

  @Column({ name: 'PASSWORDHASHHISTORY', type: 'nvarchar2', length: 1000 })
  passwordHashHistory: string;

  @Column({ name: 'NGAYTAO', type: 'date' })
  ngayTao: Date;

  @Column({ name: 'LAST_LOGIN', type: 'timestamp' })
  lastLogin: Date;

  // Oracle dùng Number(1) để biểu diễn Boolean (0 = Khóa, 1 = Hoạt động)
  @Column({ name: 'TRANG_THAI', type: 'number', precision: 1 })
  trangThai: number;
}