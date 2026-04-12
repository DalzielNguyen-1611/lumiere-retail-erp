-- =============================================================================
-- MASTER SCRIPT: CHẠY TOÀN BỘ HỆ THỐNG DATABASE PROJECT_IS_210
-- Thứ tự: Module độc lập -> Module phụ thuộc -> Khóa ngoại (Foreign Keys)
-- =============================================================================

-- 1. Thiết lập môi trường và Schema (Nếu cần)
-- ALTER SESSION SET CURRENT_SCHEMA = PROJECT_IS_210;
SET ECHO ON;
SET FEEDBACK ON;

-- 2. Chạy các file tạo bảng (Tables) theo thứ tự logic
-- Lưu ý: Đảm bảo đường dẫn file chính xác với thư mục của bạn

PROMPT --- Đang khởi tạo Module Tổ chức và Nhân sự ---
@schema/ModuleOrganizationManagement.sql
@schema/ModuleHRM.sql
@schema/ModulePayroll.sql

PROMPT --- Đang khởi tạo Module Thuế và Bảo hiểm ---
@schema/ModuleTax&Insurance.sql

PROMPT --- Đang khởi tạo Module Sản phẩm và Kho ---
@schema/ModuleProductManagement.sql
@schema/ModuleInventoryManagement.sql

PROMPT --- Đang khởi tạo Module Mua hàng và Bán hàng ---
@schema/ModulePurchasing.sql
@schema/ModuleSales&CRM.sql

PROMPT --- Đang khởi tạo Module Tài chính và Kế toán ---
@schema/ModuleFinance&Accounting.sql

PROMPT --- Đang khởi tạo Module Hệ thống ---
@schema/ModuleSystemAdministration.sql

-- 3. Chạy file tạo Khóa ngoại cuối cùng để tránh lỗi cha-con
PROMPT --- Đang thiết lập các ràng buộc Khóa ngoại (Foreign Keys) ---
@schema/foreign_keys.sql

PROMPT =========================================================================
PROMPT  HOÀN TẤT CÀI ĐẶT DATABASE
PROMPT =========================================================================

COMMIT;