console.log("BẮT ĐẦU CHẠY FILE MAIN.TS...");
import 'reflect-metadata';
import * as dotenv from 'dotenv';
import path from 'path';
dotenv.config();

import express from 'express';
import { AppDataSource } from './config/database';
import { AuthController } from './modules/auth/auth.controller';
import cors from 'cors';
import oracledb from 'oracledb';

// 1. IMPORT CÁC MODULE ROUTES BẠN VỪA TẠO
import posRoutes from './modules/POS/pos';
import inventoryRoutes from './modules/Inventory/inventory.routes';
import customerRoutes from './modules/Customer/customer.routes';
import financeRoutes from './modules/Finance/finance.routes';
import returnRoutes from './modules/Return/return.routes';
import hrRoutes from './modules/HR/hr.routes';
import procurementRoutes from './modules/Procurement/procurement.routes';
import logisticsRoutes from './modules/Tranfer/logistics.routes';
import tmRoutes from './modules/TimeManagement/tm.routes';
import dashboardRoutes from './modules/Dashboard/dashboard.routes'; // Thêm ở đầu file

const app = express();
app.use(cors());
app.use(express.json());

// Bật CORS cho tất cả các port để tránh việc Frontend (chạy ở port 5173, 5174...) bị chặn
app.use(cors());
app.use(express.json());
app.use('/img', express.static(path.join(__dirname, '..', '..', 'database', 'img')));

// Tự động biến đổi CLOB thành String để JSON không bị lỗi (Kế thừa từ server.js cũ)
oracledb.fetchAsString = [oracledb.CLOB];

// --- ĐỊNH TUYẾN (ROUTING) ---

// 1. API Đăng nhập (Dùng TypeORM Controller)
const authController = new AuthController();
app.post('/api/auth/login', (req, res) => authController.login(req, res));

// 2. Gắn các API từ các Module vào hệ thống
app.use('/api', posRoutes);            // Bao gồm: /api/products (POS), /api/orders/charge
app.use('/api', inventoryRoutes);      // Bao gồm: /api/inventory/products, /api/products (POST)
app.use('/api', customerRoutes);       // Bao gồm: /api/customers/search, /api/partners, /api/customers (POST)
app.use('/api', financeRoutes);        // Bao gồm: /api/finance
app.use('/api/returns', returnRoutes); // Bao gồm: /api/returns/invoice/:id và /api/returns (POST)
app.use('/api/hr', hrRoutes);
app.use('/api/procurement', procurementRoutes);
app.use('/api/logistics', logisticsRoutes);
app.use('/api/tm', tmRoutes);
app.use('/api/dashboard', dashboardRoutes); // Thêm route Dashboard vào đây

// Route mặc định kiểm tra server
app.get('/', (req, res) => {
  res.send('🚀 Backend ERP Lumière (TypeScript & Module-based) đang chạy rất mượt mà!');
});

// Khởi động hệ thống
const PORT = process.env.PORT || 5000;

AppDataSource.initialize()
  .then(() => {
    console.log('✅ Đã kết nối thành công tới Oracle Database (TypeORM)!');
    
    app.listen(PORT, () => {
      console.log(`🚀 Backend Server đang chạy tại http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.log('❌ Lỗi kết nối Oracle TypeORM. Vui lòng kiểm tra lại file .env!');
    console.error(error);
  });