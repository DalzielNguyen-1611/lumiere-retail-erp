console.log("BẮT ĐẦU CHẠY FILE MAIN.TS...");
import 'reflect-metadata';
// ĐỌC BIẾN MÔI TRƯỜNG TRƯỚC TIÊN (QUAN TRỌNG)
import * as dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { AppDataSource } from './config/database';
import { AuthController } from './modules/auth/auth.controller';
import cors from 'cors'; // Thêm dòng import này lên đầu


const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));

app.use(express.json());

// Khởi tạo Controller
const authController = new AuthController();

// API Route Đăng nhập
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// Khởi động hệ thống
const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Đã kết nối thành công tới Oracle Database!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Lỗi kết nối Oracle. Vui lòng kiểm tra lại file .env!');
    console.error(error);
  });