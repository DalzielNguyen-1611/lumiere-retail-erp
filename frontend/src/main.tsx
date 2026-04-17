import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
// Sửa dòng import CSS cũ thành đường dẫn trỏ vào thư mục bạn vừa tạo
import './styles/index.css' 

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)