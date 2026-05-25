# 🏆 Lumière ERP - Hệ Thống Quản Trị Doanh Nghiệp Chuỗi Bán Lẻ & Dịch Vụ Làm Đẹp

> **Hệ thống Quản lý Cơ sở Dữ liệu (DBMS - IS210)**  
> Dự án kết hợp công nghệ Frontend hiện đại, Backend bảo mật và Cơ sở dữ liệu Oracle Database mạnh mẽ để quản lý toàn diện chuỗi cửa hàng bán lẻ và dịch vụ làm đẹp cao cấp Lumière.

---

## 🌟 Tổng Quan Dự Án

**Lumière ERP** là một giải pháp quản trị doanh nghiệp toàn diện (Enterprise Resource Planning) được thiết kế đặc thù cho chuỗi cửa hàng bán lẻ mỹ phẩm, spa và chăm sóc sắc đẹp cao cấp. Hệ thống giải quyết các bài toán nghiệp vụ phức tạp từ khâu bán hàng (POS), luân chuyển kho hàng, mua sắm nhà cung cấp, đổi trả hàng hoàn tiền, chấm công nhân sự thời gian thực, cho đến tự động tính toán lương thuế TNCN và quản trị dòng tiền sổ cái kế toán theo tiêu chuẩn chuẩn mực VAS.

---

## 👥 Thành Viên Thực Hiện

* **Nguyễn Nữ Trà Giang** - *24520418* (Nhóm trưởng)
* **Nguyễn Đoàn Đức Hiếu** - *24520500*
* **Nguyễn Tấn Phát** - *24521307*
* **Trần Nhụy Tam Tử Phục** - *24521400*

---

## 🚀 Hướng Dẫn Cài Đặt & Khởi Chạy

### Bước 1: Cấu hình Cơ sở dữ liệu Oracle Database (Trực tiếp qua SQL Developer)
1. **Kết nối vào cơ sở dữ liệu bằng quyền quản trị tối cao:**
   * Mở ứng dụng **Oracle SQL Developer**.
   * Thiết lập một kết nối mới với tài khoản `SYS` (chọn Role là `SYSDBA`), kết nối đến database local của bạn (Host: `localhost`, Port: `1521`, SID: `xe` hoặc Service Name: `orcl`).
2. **Khởi tạo User mới và cấp đặc quyền quản trị:**
   Mở một cửa sổ SQL Worksheet của kết nối SYSDBA vừa tạo và thực thi đoạn lệnh sau để cấp quyền đầy đủ:
   ```sql
   -- Chuyển sang Pluggable Database (nếu sử dụng phiên bản Oracle Multitenant)
   ALTER SESSION SET CONTAINER = ORCLPDB1; 
   
   -- Tạo user và thiết lập mật khẩu truy cập
   CREATE USER PROJECT_IS_210 IDENTIFIED BY 123456;
   
   -- Cấp quyền kết nối, tài nguyên và đặc quyền quản trị (DBA)
   GRANT CONNECT, RESOURCE, DBA TO PROJECT_IS_210;
   
   -- Cấp hạn mức lưu trữ không giới hạn cho user trên Tablespace
   ALTER USER PROJECT_IS_210 QUOTA UNLIMITED ON USERS;
   ```
3. **Thực thi lần lượt các tệp lệnh SQL để tạo cấu trúc dữ liệu:**
   * Tạo một kết nối mới trong **SQL Developer** bằng User vừa tạo (`PROJECT_IS_210` / `123456`).
   * Mở và thực thi lần lượt các file script SQL trong thư mục `/database` trên Worksheet của kết nối mới này:
     * Chạy tệp `schema/db.sql` để khởi tạo cấu trúc bảng.
     * Chạy tệp `constraint.sql` để áp dụng các ràng buộc.
     * Chạy tệp `fuction.sql`, `trigger.sql` và `procedures.sql` để nạp các hàm, trigger nghiệp vụ.

### Bước 2: Cài đặt và Khởi chạy API Backend
1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc cơ bản:
   ```bash
   npm install
   ```
3. Cài đặt thư viện kết nối cơ sở dữ liệu Oracle (Oracledb) bắt buộc:
   ```bash
   npm install oracledb
   ```
4. Sao chép cấu hình môi trường: Tạo tệp `.env` trong thư mục `backend/` với nội dung:
   ```env
   PORT=5000
   JWT_SECRET=Lumiere_Secret_Key_2026
   DB_HOST=localhost
   DB_PORT=1521
   DB_USERNAME=PROJECT_IS_210
   DB_PASSWORD=123456
   DB_SERVICE_NAME=ORCLPDB1
   ```
5. Khởi chạy Server ở chế độ phát triển:
   ```bash
   npm run dev
   ```
   *(API chạy tại: `http://localhost:5000`)*

### Bước 3: Cài đặt và Khởi chạy Giao diện Frontend
1. Di chuyển vào thư mục frontend:
   ```bash
   cd ../frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy Client:
   ```bash
   npm run dev
   ```
   *(Giao diện chạy tại: `http://localhost:5173` hoặc `http://localhost:5174`)*

---

## 🛠️ Công Nghệ Sử Dụng

| Tầng (Layer) | Công Nghệ & Thư Viện | Vai Trò |
| :--- | :--- | :--- |
| **Frontend** | React 18, Vite, TypeScript, TailwindCSS, Lucide Icons, Sonner | Xây dựng giao diện Single Page Application (SPA) mượt mà, phản hồi nhanh, thiết kế sang trọng chuẩn SaaS. |
| **Backend** | Node.js, Express.js, `oracledb` driver, JWT, dotenv | API Gateway bảo mật, xử lý xác thực, điều hướng nghiệp vụ và giao tiếp với Oracle Database. |
| **Database** | Oracle Database 19c/21c | Lưu trữ dữ liệu quan hệ, thực thi ràng buộc toàn vẹn, Trigger, Function và Stored Procedure PL/SQL để đồng bộ hóa giao dịch. |

---

## 💼 Các Phân Hệ Nghiệp Vụ Chính (Modules)

### 1. 🛒 Bán Hàng Tại Quầy (POS & CRM)
* Hỗ trợ tìm kiếm nhanh sản phẩm qua mã vạch/tên, thanh toán đa phương thức (Tiền mặt, Chuyển khoản).
* Tích hợp cơ chế tích lũy điểm thưởng và nâng hạng khách hàng (`KHACH_HANG`) tự động qua Trigger.

### 2. 📦 Quản Lý Kho Hàng & Kiểm Kê (Inventory & Auditing)
* Theo dõi số lượng tồn kho thực tế (`TON_KHO`), cảnh báo hàng sắp hết hạn sử dụng.
* Quy trình kiểm kê kho chặt chẽ (`CHI_TIET_KIEM_KE`), tự động tính toán chênh lệch và cập nhật số lượng thực tế.

### 3. 🚚 Vận Chuyển & Luân Chuyển Kho (Logistics & Transfer)
* Tạo phiếu chuyển kho giữa các chi nhánh (`CUA_HANG`) và kho hàng (`KHO`).
* Theo dõi trạng thái giao nhận và tự động cập nhật số lượng xuất/nhập ở hai đầu kho chi nhánh.

### 4. 🤝 Mua Hàng & Đối Tác (Procurement & Supplier)
* Quản lý thông tin nhà cung cấp (`DOI_TAC`) chi tiết.
* Lập đơn đặt hàng mua (PO), quản lý tiến độ nhập kho và lưu trữ hóa đơn VAT nhập hàng.

### 5. 🔄 Đổi Trả Hàng Hóa (Returns Engine)
* Đảm bảo tính toàn vẹn: Mỗi hóa đơn chỉ được đổi trả tối đa số lượng sản phẩm đã mua.
* Sử dụng Stored Procedure Oracle **`SP_DUYET_PHIEU_DOI_TRA`** để xử lý đồng bộ giao dịch kế toán kép (VAS) và nhập lại kho hàng an toàn tuyệt đối.

### 6. 🕒 Nhân Sự & Trạm Chấm Công (HR & Time Clock)
* **Trạm Chấm Công (Action Clock)**: Thiết kế lớn, đậm, dùng font Monospace và đếm giây thời gian thực liên tục.
* Đóng gói card chấm công chuyên nghiệp, định vị chi nhánh, tự động ghi nhận lịch sử vào ca/kết ca.
* Quản lý đơn xin nghỉ phép (`DON_XIN_NGHI_PHEP`) tự động tìm quản lý chi nhánh để phê duyệt.

### 7. 💵 Bảng Lương & Biểu Thuế TNCN (Payroll & Taxes)
* Tự động tính toán lương nét (`PHIEU_LUONG`), trích đóng các khoản bảo hiểm (BHXH, BHYT, BHTN) theo đúng tỷ lệ luật định.
* Tự động áp dụng giảm trừ gia cảnh và tính thuế TNCN theo biểu thuế lũy tiến từng phần bằng hàm PL/SQL.

### 8. 📊 Tài Chính Kế Toán (Finance Ledger)
* Quản lý danh sách tài khoản kế toán doanh nghiệp (`TAI_KHOAN`).
* Nhật ký giao dịch kép (`GIAO_DICH_TIEN`) tự động ghi nhận khi phát sinh các sự kiện bán hàng, mua hàng, trả lương, hoàn tiền.

---
🇻🇳 *Bản quyền thuộc về Nhóm phát triển Dự án Hệ thống quản trị doanh nghiệp Lumière ERP - Đại học Công nghệ Thông tin - ĐHQG TP.HCM.*