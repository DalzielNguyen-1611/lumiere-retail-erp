DECLARE
    v_macuahang NUMBER;
    v_manhanvien NUMBER;
BEGIN
    -- 1. Tạm thời tắt ràng buộc để tránh vòng lặp (Nếu cần)
    -- Ở đây chúng ta sẽ lách bằng cách insert Cửa hàng với quản lý tạm thời là 0
    
    -- Bước 1: Tạo Cửa hàng gốc (Tạm để QUANLY = 0 vì chưa có nhân viên)
    INSERT INTO CUA_HANG (TENCUAHANG, DIACHI, SODIENTHOAI, QUANLY) 
    VALUES ('Lumiere Main Store', '702 Nguyen Van Linh, District 7', '0123456789', 0)
    RETURNING MACUAHANG INTO v_macuahang;

    -- Bước 2: Tạo Nhân viên gốc thuộc Cửa hàng vừa tạo
    INSERT INTO NHANVIEN (MACUAHANG, HOTEN, SDT, EMAIL, NGAYVAOLAM, TRANGTHAI) 
    VALUES (v_macuahang, 'Admin Quan Tri', '0987654321', 'admin@lumiere.com', SYSDATE, 'Active')
    RETURNING MANHANVIEN INTO v_manhanvien;

    -- Bước 3: Cập nhật lại Quản lý thực sự cho Cửa hàng
    UPDATE CUA_HANG SET QUANLY = v_manhanvien WHERE MACUAHANG = v_macuahang;

    -- Bước 4: Tạo Tài khoản với mật khẩu '123456'
    INSERT INTO TAI_KHOAN_NHAN_VIEN 
        (MANHANVIEN, USERNAME, PASSWORDHASH, PASSWORDHASHHISTORY, NGAYTAO, LAST_LOGIN, TRANG_THAI)
    VALUES (
        v_manhanvien,
        'admin',
        '$2b$10$ZQ0Da.LWUp3yN9F8diBf7.B6Xdq8Yvp/uY5LSCLMXZYjpHp1BAM7q', 
        '$2b$10$ZQ0Da.LWUp3yN9F8diBf7.B6Xdq8Yvp/uY5LSCLMXZYjpHp1BAM7q',
        SYSDATE,
        SYSTIMESTAMP,
        1
    );

    COMMIT;
    DBMS_OUTPUT.PUT_LINE('🎉 Chuc mung Hieu! Tai khoan admin (123456) da san sang.');
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        DBMS_OUTPUT.PUT_LINE('❌ Loi: ' || SQLERRM);
END;
/

select * from TAI_KHOAN_NHAN_VIEN;