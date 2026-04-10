# TÊN DỰ ÁN CỦA BẠN (Ví dụ: PetSmart ERP)

## Giới thiệu
Mô tả ngắn gọn về dự án, mục đích và đối tượng sử dụng.

## Cấu trúc thư mục
```text
petsmart-erp/ (Thư mục gốc của dự án)
├── frontend/               # Toàn bộ code Next.js (Cấu hình như đã bàn)
│   │
│   ├──.next/               # Chứa mã nguồn đã biên dịch. [TUYỆT ĐỐI KHÔNG SỬA]
│   │
│   ├── app/                # Hệ thống Router, giao diện trang và bố cục chính. (Nơi viết code chính).
│   │
│   ├── components/         # Các thành phần UI tái sử dụng (Button, Table, Navbar). (Nơi viết code chính).
│   │
│   ├── hooks/              # Các hàm xử lý logic giao diện và trạng thái (State) riêng biệt. (Nơi viết code chính).
│   │
│   ├── lib/                # Các hàm tiện ích dùng chung và cấu hình thư viện. (Nơi viết code chính).
│   │
│   ├── node_modules/       # Thư mục lưu trữ các thư viện phụ thuộc. [TUYỆT ĐỐI KHÔNG SỬA]
│   │
│   ├── services/           # Tầng giao tiếp và gọi API từ thư mục Backend. (Nơi viết code chính).
│   │
│   ├── types/              # Định nghĩa kiểu dữ liệu và cấu trúc thực thể. (Nơi viết code chính).
│   │
│   ├── .gitignore
│   ├── AGENTS.md
│   ├── eslint.config.mjs
│   ├── next-env.d.ts
│   ├── next.config.ts
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.mjs
│   ├── README.md
│   └── tsconfig.json
├── backend/                # Toàn bộ code xử lý Server & Oracle
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/       # Logic nghiệp vụ
│   │   ├── repository/     # Truy vấn SQL/PL-SQL
│   │   └── app.ts
│   ├── package.json
│   └── .env                # Lưu kết nối Oracle (DATABASE_URL=...)
├── database/               # Nơi lưu trữ tài liệu về DB cho môn IS210
│   ├── schema.sql          # Các lệnh CREATE TABLE, SEQUENCE
│   ├── procedures.sql      # Các Stored Procedures trong Oracle
│   └── diagrams/           # File thiết kế ERD, BPMN
├── docs/                   # Tài liệu dự án (SRS, Bản mô tả 10 tỷ VNĐ)
├── .gitignore              # Quan trọng: Chặn đẩy node_modules và .env lên GitHub
└── README.md               # Hướng dẫn chạy cả 2 phần Front & Back

## Công nghệ sử dụng
* **Frontend:** Next.js (TypeScript)
* **Database:** Oracle 21c
* **UI Library:** Tailwind CSS

## Hướng dẫn cài đặt
1. Clone dự án: `git clone https://github.com/DalzielNguyen-1611/IS210-Database-Management-System.git`
2. Cài đặt thư viện: `npm install`
3. Chạy môi trường dev: `npm run dev`

## Thành viên thực hiện
* Nguyễn Đoàn Đức Hiếu - 24520500 (Nhóm trưởng)