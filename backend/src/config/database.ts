import { DataSource } from 'typeorm';
import { TaiKhoanNhanVien } from '../modules/users/user.entity';
import * as dotenv from 'dotenv';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'oracle',
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '1521'), 
  username: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD, 
  
  // ĐIỂM QUAN TRỌNG NHẤT: Dùng serviceName thay cho sid
  serviceName: process.env.DB_SERVICE_NAME, 
  
  synchronize: false,
  logging: true,
  entities: [TaiKhoanNhanVien],
});