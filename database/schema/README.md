# LƯU Ý QUAN TRỌNG

** Để hệ thống không bị lỗi, bạn cần tuân thủ duy nhất quy tắc sau:

** KHÔNG chạy các file đơn lẻ trong từng thư mục.
** CHỈ CHẠY DUY NHẤT FILE: main.sql

** Lý do:
* File main.sql đã được cấu hình chạy theo thứ tự logic:
  1. Khởi tạo các bảng (Tables).
  2. Thiết lập các ràng buộc (Constraints).
  3. Tạo khóa ngoại (Foreign Keys) cuối cùng để tránh lỗi "bảng không tồn tại".

** Cách thực hiện:
* Kết nối vào Database.
* Mở file main.sql.
* Nhấn F5 (hoặc nút Run Script) để thực thi toàn bộ dự án.