import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import { router } from './routes/index'; // Trỏ đúng vào file chứa createBrowserRouter của bạn
import { AuthProvider } from './context/AuthContext';
import './index.css'; // Đảm bảo đã có file CSS chứa Tailwind

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  </React.StrictMode>
);