# TÊN DỰ ÁN CỦA BẠN (Ví dụ: PetSmart ERP)

## Giới thiệu
Mô tả ngắn gọn về dự án, mục đích và đối tượng sử dụng.

## Cấu trúc thư mục
```text
petsmart-erp/ (Thư mục gốc của dự án)
│  
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
│   ├── .gitignore          # Danh sách tệp tin không đẩy lên kho lưu trữ Git.
│   │
│   ├── AGENTS.md    
│   │
│   ├── eslint.config.mjs   # Cấu hình bộ kiểm tra chuẩn code. (Ít khi phải sửa).
│   │
│   ├── next-env.d.ts       # Tệp khai báo kiểu dữ liệu hệ thống cho Next.js. [KHÔNG NÊN SỬA] - Next.js tự quản lý để đồng bộ với TypeScript.
│   │
│   ├── next.config.ts      # Tệp điều chỉnh thông số vận hành Framework. (Sửa khi cần cấu hình đặc biệt).
│   │
│   ├── package-lock.json   # Bản chốt chi tiết phiên bản của các thư viện. [TUYỆT ĐỐI KHÔNG SỬA] - File này tự cập nhật theo package.json.
│   │
│   ├── package.json        # Thông tin dự án và danh sách thư viện. (Chỉ sửa khi cần thêm script hoặc đổi thông tin dự án).
│   │
│   ├── postcss.config.mjs  # Cấu hình bộ tiền xử lý để tối ưu mã CSS. (Ít khi phải sửa).
│   │
│   ├── README.md           # Tài liệu hướng dẫn và mô tả tổng quan dự án. (Nên sửa để làm báo cáo).
│   │
│   └── tsconfig.json       # Cấu hình các quy tắc biên dịch TypeScript. (Ít khi phải sửa).
│
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
```
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
* Nguyễn Nữ Trà Giang -
* Lê Thị Bích Duyên -
* Hồ Thị Thùy Dung - 