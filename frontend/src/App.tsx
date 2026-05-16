import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from "sonner";
// 1. Sửa phần Layout (Bọc trong ngoặc nhọn)
import { Layout } from './components/layout/layout';

// 2. Sửa phần Pages (Thay thế các import cũ bằng cái này)
import { Dashboard } from './pages/Dashboard';
import { POS } from './pages/POS';
import { Inventory } from './pages/Inventory';
import { Customers } from './pages/Partners'; // Chỗ này giữ nguyên tên file Partners của bạn
import { Login } from './pages/Login';
import { TimeManagement } from './pages/TimeManagement';

// Import 8 trang mới tách
import { HR } from './pages/HR';
//import { Payroll } from './pages/Payroll';
import { MultiStore } from './pages/MultiStore';
import { Logistics } from './pages/Logistics';
import { Procurement } from './pages/Procurement';
import { Finance } from './pages/Finance.tsx';
import { Returns } from './pages/Returns';
import { Settings } from './pages/Settings';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        {/* Protected / app routes inside layout  */}
        <Route path="/" element={<Layout />}>
          {/* default route */}
          <Route index element={<Navigate to="/dashboard" replace />} />

          <Route path="dashboard" element={<Dashboard />} />
          <Route path="pos" element={<POS />} />
          <Route path="inventory" element={<Inventory />} />
          <Route path="customers" element={<Customers />} />
          <Route path="time-management" element={<TimeManagement />} />
          
          {/* 8 Routes mới tách */}
          <Route path="hr" element={<HR />} />
          <Route path="multi-store" element={<MultiStore />} />
          <Route path="logistics" element={<Logistics />} />
          <Route path="procurement" element={<Procurement />} />
          <Route path="finance" element={<Finance />} />
          <Route path="returns" element={<Returns />} />
          <Route path="settings" element={<Settings />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;