-- ============================================================
-- TỔNG HỢP PROCEDURES (25 Items)
-- ============================================================

-- 1. SP_CAP_NHAT_DOI_TAC
CREATE OR REPLACE PROCEDURE SP_CAP_NHAT_DOI_TAC (
    p_id      IN NUMBER,
    p_name    IN NVARCHAR2,
    p_phone   IN NVARCHAR2,
    p_email   IN NVARCHAR2,
    p_address IN NVARCHAR2
) AS
BEGIN
    UPDATE DOI_TAC 
    SET TENDOITAC = p_name,
        SODIENTHOAI = p_phone,
        EMAIL = p_email,
        DIACHI = p_address
    WHERE MADOITAC = p_id;

    COMMIT;
END;
/

-- 2. SP_THANH_TOAN_DON_HANG
CREATE OR REPLACE PROCEDURE SP_THANH_TOAN_DON_HANG (
    p_MADONHANG IN NUMBER,
    p_PHUONGTHUCTHANHTHOAN IN NVARCHAR2
) AS
    v_MADOITAC NUMBER;
    v_MACUAHANG NUMBER;
    v_MANHANVIEN NUMBER;
    v_TONGTIENTAMTINH NUMBER;
    v_DIEMMUONDUNG NUMBER;
    v_DIEMTICHDUOC NUMBER;
    v_MAHOADON NUMBER;
    v_MATAIKHOAN NUMBER;
    v_MAKHO NUMBER;
    v_SOPHIEUXUAT NVARCHAR2(100);
BEGIN
    SELECT MADOITAC, MACUAHANG, MANHANVIEN, TONGTIENTAMTINH, DIEMMUONDUNG
    INTO v_MADOITAC, v_MACUAHANG, v_MANHANVIEN, v_TONGTIENTAMTINH, v_DIEMMUONDUNG
    FROM DON_HANG
    WHERE MADONHANG = p_MADONHANG;
    v_DIEMTICHDUOC := TRUNC(NVL(v_TONGTIENTAMTINH, 0) / 1000);
    IF p_PHUONGTHUCTHANHTHOAN = 'Tiền mặt' THEN
        v_MATAIKHOAN := 111;
    ELSE
        v_MATAIKHOAN := 112;
    END IF;
    BEGIN
        SELECT MAKHO
        INTO v_MAKHO
        FROM (
            SELECT MAKHO FROM KHO WHERE MACUAHANG = v_MACUAHANG AND MAKHO IS NOT NULL
        )
        WHERE ROWNUM = 1;
    EXCEPTION
        WHEN NO_DATA_FOUND THEN
            RAISE_APPLICATION_ERROR(-20001, 'Lỗi hệ thống: Cửa hàng ' || v_MACUAHANG || ' chưa cấu hình kho xuất hàng.');
    END;
    INSERT INTO HOA_DON_BAN_HANG (
        MADOITAC, MADONHANG, MACUAHANG, NGAYBAN, TONGTIEN,
        DIEMTICHDUOC, DIEMSUDUNG, PHUONGTHUCTHANHTHOAN, MANHANVIEN
    ) VALUES (
        v_MADOITAC, p_MADONHANG, v_MACUAHANG, SYSTIMESTAMP, v_TONGTIENTAMTINH,
        v_DIEMTICHDUOC, v_DIEMMUONDUNG, p_PHUONGTHUCTHANHTHOAN, v_MANHANVIEN
    ) RETURNING MAHOADON INTO v_MAHOADON;
    INSERT INTO CHI_TIET_HOA_DON_BAN_HANG (
        MASANPHAM, MAHOADON, SOLUONG, DONGIA, THANHTIEN
    )
    SELECT MASANPHAM, v_MAHOADON, SOLUONG, DONGIA, THANHTIEN
    FROM CHI_TIET_DON_HANG
    WHERE MADONHANG = p_MADONHANG;
    v_SOPHIEUXUAT := 'PXK-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MI') || '-' || v_MAHOADON;

    INSERT INTO PHIEU_KHO (
        SOPHIEU, LOAIPHIEU, MAHOADON, NGAYLAP, NGAYTHUCPHE, 
        KHODI, KHODEN, DOITAC, TONGGIATRIPHIEU, NGUOIPHUTRACH, TRANGTHAI
    ) VALUES (
        v_SOPHIEUXUAT, 'Xuất kho bán hàng', v_MAHOADON, SYSTIMESTAMP, SYSTIMESTAMP,
        v_MAKHO, NULL, v_MADOITAC, v_TONGTIENTAMTINH, v_MANHANVIEN, 'Đã xuất'
    );
    FOR rec IN (
        SELECT MASANPHAM, SOLUONG, DONGIA, THANHTIEN
        FROM CHI_TIET_DON_HANG
        WHERE MADONHANG = p_MADONHANG
    ) LOOP
        INSERT INTO CHI_TIET_PHIEU (
            SOPHIEU, MASANPHAM, SOLUONG, DONGIA, THANHTIEN
        ) VALUES (
            v_SOPHIEUXUAT, rec.MASANPHAM, rec.SOLUONG, rec.DONGIA, rec.THANHTIEN
        );
    END LOOP;
    UPDATE DON_HANG
    SET TRANGTHAI = 'Đã thanh toán'
    WHERE MADONHANG = p_MADONHANG;
    UPDATE KHACH_HANG
    SET DIEMTICHLUY = NVL(DIEMTICHLUY,0) + v_DIEMTICHDUOC - NVL(v_DIEMMUONDUNG,0)
    WHERE MADOITAC = v_MADOITAC;
    
    DECLARE
        v_doanhthu NUMBER;
        v_thuevat NUMBER;
    BEGIN
        v_doanhthu := ROUND(v_TONGTIENTAMTINH / 1.1);
        v_thuevat := v_TONGTIENTAMTINH - v_doanhthu;

        -- 1. Ghi nhận Nợ TK 111/112
        INSERT INTO GIAO_DICH_TIEN (
            MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAHOADONBAN, GHICHU
        ) VALUES (
            v_MACUAHANG, v_MATAIKHOAN, 'Thu tiền bán hàng', v_TONGTIENTAMTINH, SYSTIMESTAMP, v_MAHOADON, 'Khách thanh toán POS (Đơn #' || TO_CHAR(p_MADONHANG) || ')'
        );
        UPDATE TAI_KHOAN SET SODUHIENTAI = NVL(SODUHIENTAI,0) + v_TONGTIENTAMTINH WHERE MATAIKHOAN = v_MATAIKHOAN;

        -- 2. Ghi nhận Có TK 5111
        INSERT INTO GIAO_DICH_TIEN (
            MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAHOADONBAN, GHICHU
        ) VALUES (
            v_MACUAHANG, 5111, 'Ghi nhận doanh thu', v_doanhthu, SYSTIMESTAMP, v_MAHOADON, 'Doanh thu bán hàng POS (Chưa VAT) (Đơn #' || TO_CHAR(p_MADONHANG) || ')'
        );
        UPDATE TAI_KHOAN SET SODUHIENTAI = NVL(SODUHIENTAI,0) + v_doanhthu WHERE MATAIKHOAN = 5111;

        -- 3. Ghi nhận Có TK 3331
        IF v_thuevat > 0 THEN
            INSERT INTO GIAO_DICH_TIEN (
                MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAHOADONBAN, GHICHU
            ) VALUES (
                v_MACUAHANG, 3331, 'Ghi nhận thuế VAT', v_thuevat, SYSTIMESTAMP, v_MAHOADON, 'Thuế GTGT 10% đầu ra (Đơn #' || TO_CHAR(p_MADONHANG) || ')'
            );
            UPDATE TAI_KHOAN SET SODUHIENTAI = NVL(SODUHIENTAI,0) + v_thuevat WHERE MATAIKHOAN = 3331;
        END IF;
    END;
    COMMIT;

EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_THANH_TOAN_DON_HANG;
/

-- 3. SP_THEM_DOI_TAC
CREATE OR REPLACE PROCEDURE SP_THEM_DOI_TAC (
    p_name IN NVARCHAR2,
    p_phone IN NVARCHAR2,
    p_email IN NVARCHAR2,
    p_address IN NVARCHAR2,
    p_type IN NVARCHAR2,
    p_new_id OUT NUMBER -- Trả về ID vừa tạo
) AS
BEGIN
    INSERT INTO DOI_TAC (TENDOITAC, SODIENTHOAI, EMAIL, DIACHI, LOAIDOITAC)
    VALUES (p_name, p_phone, p_email, p_address, p_type)
    RETURNING MADOITAC INTO p_new_id;
    IF p_type = 'Khách hàng' THEN
        INSERT INTO KHACH_HANG (MADOITAC, DIEMTICHLUY, NGAYTHAMGIA, LOAIKHACHHANG)
        VALUES (p_new_id, 0, SYSDATE, 'Thường');
    END IF;
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END SP_THEM_DOI_TAC;
/

-- 4. SP_CHUYEN_KHO
CREATE OR REPLACE PROCEDURE SP_CHUYEN_KHO (
    p_masanpham NUMBER, 
    p_kho_di NUMBER, 
    p_kho_den NUMBER, 
    p_soluong NUMBER, 
    p_nguoiphutrach NUMBER
) AS
    v_tonkhodi NUMBER;
    v_sophieu NVARCHAR2(100);
    v_machitiet NUMBER;
BEGIN 
    SELECT SOLUONGTON 
    INTO v_tonkhodi 
    FROM TON_KHO 
    WHERE MASANPHAM = p_masanpham 
      AND MAKHO = p_kho_di;
      
    IF v_tonkhodi < p_soluong THEN 
        RAISE_APPLICATION_ERROR(-20003, 'Kho xuất không đủ số lượng để chuyển!'); 
    END IF;

    UPDATE TON_KHO 
    SET SOLUONGTON = SOLUONGTON - p_soluong 
    WHERE MASANPHAM = p_masanpham 
      AND MAKHO = p_kho_di;

    MERGE INTO TON_KHO TK 
    USING (SELECT p_masanpham AS SP, p_kho_den AS KHO FROM DUAL) src
    ON (TK.MASANPHAM = src.SP AND TK.MAKHO = src.KHO)
    WHEN MATCHED THEN 
        UPDATE SET SOLUONGTON = SOLUONGTON + p_soluong
    WHEN NOT MATCHED THEN 
        INSERT (MASANPHAM, MAKHO, SOLUONGTON, NGAYCAPNHAP) 
        VALUES (p_masanpham, p_kho_den, p_soluong, SYSTIMESTAMP);

    v_sophieu := 'PCK-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MI');
    
    INSERT INTO PHIEU_KHO (
        SOPHIEU, LOAIPHIEU, NGAYLAP, NGAYTHUCPHE, KHODI, KHODEN, 
        DOITAC, TONGGIATRIPHIEU, NGUOIPHUTRACH, TRANGTHAI
    ) 
    VALUES (
        v_sophieu, 'Chuyển kho nội bộ', SYSDATE, SYSDATE, p_kho_di, p_kho_den, 
        0, 0, p_nguoiphutrach, 'Đã hoàn tất'
    );
    
    SELECT NVL(MAX(MACHITIET), 0) + 1 INTO v_machitiet FROM CHI_TIET_PHIEU;

    INSERT INTO CHI_TIET_PHIEU (
        MACHITIET, SOPHIEU, MASANPHAM, SOLUONG, DONGIA, THANHTIEN
    ) 
    VALUES (
        v_machitiet, v_sophieu, p_masanpham, p_soluong, 0, 0
    );
    
    COMMIT; 
END; 
/

-- 5. SP_CHOT_LUONG_THANG
CREATE OR REPLACE PROCEDURE SP_CHOT_LUONG_THANG (
    p_thangnam NVARCHAR2
) AS
    v_maphieu NUMBER;
BEGIN 
    FOR rec IN (
        SELECT NV.MANHANVIEN, HSL.MUCLUONG 
        FROM NHANVIEN NV 
        JOIN HO_SO_LUONG HSL ON NV.MANHANVIEN = HSL.MANHANVIEN
    ) LOOP
        SELECT NVL(MAX(MAPHIEU), 0) + 1 INTO v_maphieu FROM PHIEU_LUONG;

        INSERT INTO PHIEU_LUONG (
            MAPHIEU, MANHANVIEN, THANGNAM, LUONG, 
            TONGBAOHIEMNV, TONGTHUETNCN, THUCLINH, TRANGTHAI
        ) 
        VALUES (
            v_maphieu, rec.MANHANVIEN, p_thangnam, rec.MUCLUONG, 
            rec.MUCLUONG * 0.105, 0, (rec.MUCLUONG * 0.895), 'Chờ duyệt'
        );
    END LOOP;
    
    COMMIT; 
END; 
/

-- 6. SP_XUAT_HUY_HANG_HET_DATE
CREATE OR REPLACE PROCEDURE SP_XUAT_HUY_HANG_HET_DATE (
    p_makho NUMBER, 
    p_masanpham NUMBER, 
    p_soluong NUMBER, 
    p_nguoiphutrach NUMBER
) AS
    v_sophieu NVARCHAR2(100) := 'PXH-' || TO_CHAR(SYSTIMESTAMP, 'YYYYMMDDHH24MI');
    v_machitiet NUMBER;
BEGIN 
    UPDATE TON_KHO 
    SET SOLUONGTON = SOLUONGTON - p_soluong 
    WHERE MASANPHAM = p_masanpham 
      AND MAKHO = p_makho;
      
    INSERT INTO PHIEU_KHO (
        SOPHIEU, LOAIPHIEU, NGAYLAP, NGAYTHUCPHE, KHODI, 
        DOITAC, TONGGIATRIPHIEU, NGUOIPHUTRACH, TRANGTHAI
    )
    VALUES (
        v_sophieu, 'Xuất hủy', SYSDATE, SYSDATE, p_makho, 
        0, 0, p_nguoiphutrach, 'Đã hủy'
    );
    
    SELECT NVL(MAX(MACHITIET), 0) + 1 INTO v_machitiet FROM CHI_TIET_PHIEU;

    INSERT INTO CHI_TIET_PHIEU (
        MACHITIET, SOPHIEU, MASANPHAM, SOLUONG, DONGIA, THANHTIEN
    ) 
    VALUES (
        v_machitiet, v_sophieu, p_masanpham, p_soluong, 0, 0
    );
    
    COMMIT; 
END; 
/

-- 7. SP_NHAP_HANG_TU_NCC
CREATE OR REPLACE PROCEDURE SP_NHAP_HANG_TU_NCC (
    p_mahoadon NUMBER, 
    p_makho NUMBER, 
    p_nguoiphutrach NUMBER
) AS
    v_sophieu NVARCHAR2(100) := 'PNK-' || TO_CHAR(p_mahoadon);
    v_machitiet NUMBER;
BEGIN 
    INSERT INTO PHIEU_KHO (
        SOPHIEU, LOAIPHIEU, MAHOADON, NGAYLAP, NGAYTHUCPHE, 
        KHODEN, DOITAC, TONGGIATRIPHIEU, NGUOIPHUTRACH, TRANGTHAI
    )
    SELECT v_sophieu, 'Nhập kho mua hàng', MAHOADONMUA, SYSDATE, SYSDATE, 
           p_makho, MADOITAC, TONGTIEN, p_nguoiphutrach, 'Đã nhập'
    FROM HOA_DON_MUA_HANG 
    WHERE MAHOADONMUA = p_mahoadon;

    FOR rec IN (
        SELECT MASANPHAM, SOLUONG, DONGIA, THANHTIEN 
        FROM CHI_TIET_HOA_DON_MUA_HANG 
        WHERE MAHOADONMUA = p_mahoadon
    ) LOOP
        SELECT NVL(MAX(MACHITIET), 0) + 1 INTO v_machitiet FROM CHI_TIET_PHIEU;
        
        INSERT INTO CHI_TIET_PHIEU (
            MACHITIET, SOPHIEU, MASANPHAM, SOLUONG, DONGIA, THANHTIEN
        )
        VALUES (
            v_machitiet, v_sophieu, rec.MASANPHAM, 
            rec.SOLUONG, rec.DONGIA, rec.THANHTIEN
        );
    END LOOP;
    
    COMMIT; 
END; 
/

-- 8. SP_DUYET_DON_XIN_NGHI_PHEP
CREATE OR REPLACE PROCEDURE SP_DUYET_DON_XIN_NGHI_PHEP (
    p_madon NUMBER, 
    p_nguoiduyet NUMBER
) AS
BEGIN 
    UPDATE DON_XIN_NGHI_PHEP 
    SET TRANGTHAI = 'Đã duyệt', 
        NGUOIDUYET = p_nguoiduyet 
    WHERE MADON = p_madon;
    
    COMMIT; 
END; 
/

-- 9. SP_KHOA_TAI_KHOAN_NHAN_VIEN
CREATE OR REPLACE PROCEDURE SP_KHOA_TAI_KHOAN_NHAN_VIEN (
    p_manhanvien NUMBER
) AS
BEGIN 
    UPDATE TAI_KHOAN_NHAN_VIEN 
    SET TRANG_THAI = 0 
    WHERE MANHANVIEN = p_manhanvien;
    
    UPDATE NHANVIEN 
    SET TRANGTHAI = 'Đã nghỉ việc' 
    WHERE MANHANVIEN = p_manhanvien;
    
    COMMIT; 
END; 
/

-- 10. SP_CAP_NHAT_GIA_THEO_DANH_MUC
CREATE OR REPLACE PROCEDURE SP_CAP_NHAT_GIA_THEO_DANH_MUC (
    p_madanhmuc NUMBER, 
    p_phantram NUMBER
) AS
BEGIN 
    UPDATE SAN_PHAM SP
    SET GIANIEMYET = GIANIEMYET + (GIANIEMYET * p_phantram / 100)
    WHERE EXISTS (
        SELECT 1 
        FROM SAN_PHAM_DANH_MUC SDM 
        WHERE SDM.MASANPHAM = SP.MASANPHAM 
          AND SDM.MADANHMUC = p_madanhmuc
    );
    
    COMMIT; 
END; 
/

-- 11. SP_HOAN_TIEN_KHACH_HANG
CREATE OR REPLACE PROCEDURE SP_HOAN_TIEN_KHACH_HANG (
    p_maphieu NUMBER, 
    p_sotien NUMBER, 
    p_taikhoan NUMBER, 
    p_cuahang NUMBER
) AS
    v_magiaodich NUMBER;
BEGIN 
    SELECT NVL(MAX(MAGIAODICH), 0) + 1 INTO v_magiaodich FROM GIAO_DICH_TIEN;

    INSERT INTO GIAO_DICH_TIEN (
        MAGIAODICH, MACUAHANG, MATAIKHOAN, LOAIGIAODICH, 
        SOTIEN, NGAYGIAODICH, GHICHU
    )
    VALUES (
        v_magiaodich, p_cuahang, p_taikhoan, 'Chi hoàn tiền khách hàng', 
        p_sotien, SYSTIMESTAMP, 'Hoàn tiền cho phiếu ĐT ' || p_maphieu
    );
    
    UPDATE TAI_KHOAN 
    SET SODUHIENTAI = SODUHIENTAI - p_sotien 
    WHERE MATAIKHOAN = p_taikhoan;
    
    COMMIT; 
END; 
/

-- 12. SP_TRA_HANG_CHO_NCC
CREATE OR REPLACE PROCEDURE SP_TRA_HANG_CHO_NCC (
    p_makho NUMBER, 
    p_mancc NUMBER, 
    p_masanpham NUMBER, 
    p_soluong NUMBER
) AS
BEGIN 
    UPDATE TON_KHO 
    SET SOLUONGTON = SOLUONGTON - p_soluong 
    WHERE MASANPHAM = p_masanpham 
      AND MAKHO = p_makho;
    COMMIT; 
END; 
/

-- 13. SP_KIEM_KE_VA_DIEU_CHINH_KHO
CREATE OR REPLACE PROCEDURE SP_KIEM_KE_VA_DIEU_CHINH_KHO (
    p_makiemke NUMBER
) AS
    v_makho NUMBER;
BEGIN 
    UPDATE KIEM_KE 
    SET TRANGTHAI = 'Hoàn tất' 
    WHERE MAKIEMKE = p_makiemke;
    
    SELECT MAKHO INTO v_makho 
    FROM KIEM_KE 
    WHERE MAKIEMKE = p_makiemke;
    
    FOR rec IN (
        SELECT MASANPHAM, SLTHUCTE 
        FROM CHI_TIET_KIEM_KE 
        WHERE MAKIEMKE = p_makiemke
    ) LOOP
        UPDATE TON_KHO 
        SET SOLUONGTON = rec.SLTHUCTE 
        WHERE MASANPHAM = rec.MASANPHAM 
          AND MAKHO = v_makho;
    END LOOP;
    
    COMMIT; 
END; 
/

-- 14. SP_CAP_NHAT_NGAY_PHEP_NAM
CREATE OR REPLACE PROCEDURE SP_CAP_NHAT_NGAY_PHEP_NAM (
    p_nam NUMBER
) AS
BEGIN
    INSERT INTO QUAN_LY_PHEP (
        IDPHEP, MANHANVIEN, NAM, TONGPHEP, DADUNG, CONLAI
    )
    SELECT (SELECT NVL(MAX(IDPHEP), 0) FROM QUAN_LY_PHEP) + ROWNUM, 
           MANHANVIEN, p_nam, 12, 0, 12 
    FROM NHANVIEN 
    WHERE TRANGTHAI = 'Đang làm việc';
    
    COMMIT;
END; 
/

-- 15. SP_QUYET_TOAN_THUE_CUOI_NAM
CREATE OR REPLACE PROCEDURE SP_QUYET_TOAN_THUE_CUOI_NAM (
    p_nam NUMBER
) AS
BEGIN 
    NULL; 
END; 
/

-- 16. SP_TAO_DON_HANG
CREATE OR REPLACE PROCEDURE SP_TAO_DON_HANG (
    p_cuahang NUMBER, 
    p_khachhang NUMBER, 
    p_nhanvien NUMBER, 
    p_donhang OUT NUMBER
) AS
BEGIN 
    SELECT NVL(MAX(MADONHANG), 0) + 1 INTO p_donhang FROM DON_HANG;

    INSERT INTO DON_HANG (
        MADONHANG, MACUAHANG, MADOITAC, MANHANVIEN, 
        NGAYTAO, TONGTIENTAMTINH, DIEMMUONDUNG, TRANGTHAI
    ) 
    VALUES (
        p_donhang, p_cuahang, p_khachhang, p_nhanvien, 
        SYSTIMESTAMP, 0, 0, 'Chờ xử lý'
    ); 
    
    COMMIT; 
END; 
/

-- 17. SP_HUY_DON_HANG
CREATE OR REPLACE PROCEDURE SP_HUY_DON_HANG (
    p_madonhang NUMBER
) AS
BEGIN 
    UPDATE DON_HANG 
    SET TRANGTHAI = 'Đã hủy' 
    WHERE MADONHANG = p_madonhang; 
    COMMIT; 
END; 
/

-- 18. SP_CHOT_CA_BAN_HANG
CREATE OR REPLACE PROCEDURE SP_CHOT_CA_BAN_HANG (
    p_manhanvien NUMBER, 
    p_macuahang NUMBER, 
    p_sotienthuc NUMBER
) AS
BEGIN 
    NULL; 
END; 
/

-- 19. SP_CAN_TRU_CONG_NO_NCC
CREATE OR REPLACE PROCEDURE SP_CAN_TRU_CONG_NO_NCC (
    p_madoitac NUMBER, 
    p_sotien NUMBER, 
    p_taikhoan NUMBER
) AS
BEGIN 
    NULL; 
END; 
/

-- 20. SP_CAP_NHAT_HANG_KHACH_HANG_HANG_LOAT
CREATE OR REPLACE PROCEDURE SP_CAP_NHAT_HANG_KHACH_HANG_HANG_LOAT AS
BEGIN 
    UPDATE KHACH_HANG 
    SET LOAIKHACHHANG = FUNC_TINH_HANG_THE(DIEMTICHLUY); 
    
    COMMIT; 
END; 
/

-- 21. SP_XOA_DANH_MUC_AN_TOAN
CREATE OR REPLACE PROCEDURE SP_XOA_DANH_MUC_AN_TOAN (
    p_madanhmuc NUMBER
) AS
BEGIN 
    UPDATE SAN_PHAM_DANH_MUC 
    SET MADANHMUC = 0 
    WHERE MADANHMUC = p_madanhmuc; 
    
    DELETE FROM DANH_MUC 
    WHERE MADANHMUC = p_madanhmuc; 
    
    COMMIT; 
END; 
/

-- 22. SP_KET_CHUYEN_SO_DU_CUOI_THANG
CREATE OR REPLACE PROCEDURE SP_KET_CHUYEN_SO_DU_CUOI_THANG (
    p_thang NUMBER, 
    p_nam NUMBER
) AS
BEGIN 
    NULL; 
END; 
/

-- 23. SP_PHUC_HOI_NHAN_VIEN
CREATE OR REPLACE PROCEDURE SP_PHUC_HOI_NHAN_VIEN (
    p_manhanvien NUMBER
) AS
BEGIN 
    UPDATE NHANVIEN 
    SET TRANGTHAI = 'Đang làm việc' 
    WHERE MANHANVIEN = p_manhanvien; 
    
    UPDATE TAI_KHOAN_NHAN_VIEN 
    SET TRANG_THAI = 1 
    WHERE MANHANVIEN = p_manhanvien; 
    
    COMMIT; 
END; 
/


-- 24. SP_THANH_TOAN_HOA_DON_MUA
CREATE OR REPLACE PROCEDURE SP_THANH_TOAN_HOA_DON_MUA (
    p_mahoadon NUMBER,
    p_mataikhoan NUMBER,
    p_phuongthuc NVARCHAR2
) AS
    v_tongtien NUMBER;
    v_sohoadon NVARCHAR2(100);
    v_count NUMBER;
BEGIN
    -- 1. Kiểm tra hóa đơn tồn tại và lấy số tiền
    SELECT COUNT(*) INTO v_count FROM HOA_DON_MUA_HANG WHERE MAHOADONMUA = p_mahoadon;
    IF v_count = 0 THEN
        RAISE_APPLICATION_ERROR(-20026, 'Không tìm thấy hóa đơn cần thanh toán!');
    END IF;

    SELECT TONGTIEN, SOHOADON_VAT INTO v_tongtien, v_sohoadon 
    FROM HOA_DON_MUA_HANG WHERE MAHOADONMUA = p_mahoadon;

    -- 2. Cập nhật trạng thái hóa đơn
    UPDATE HOA_DON_MUA_HANG 
    SET TRANGTHAI_THANHTOAN = 'Đã thanh toán', 
        PHUONGTHUCTHANHTOAN = p_phuongthuc 
    WHERE MAHOADONMUA = p_mahoadon;

    -- 3. Tạo phiếu chi tiền tự động (Âm tiền)
    INSERT INTO GIAO_DICH_TIEN (
        MACUAHANG, MATAIKHOAN, LOAIGIAODICH, 
        SOTIEN, NGAYGIAODICH, GHICHU
    ) VALUES (
        1, p_mataikhoan, 'Chi trả NCC', 
        -v_tongtien, SYSTIMESTAMP, 'Thanh toán hóa đơn nhập hàng: ' || NVL(v_sohoadon, TO_CHAR(p_mahoadon))
    );

    -- LƯU Ý: Không cần UPDATE TAI_KHOAN ở đây nếu bạn đã có 
    -- Trigger TRG_UPDATE_BANK_BALANCE tự động cập nhật số dư khi có Giao dịch tiền.
    
    COMMIT;
EXCEPTION
    WHEN OTHERS THEN
        ROLLBACK;
        RAISE;
END;
/

-- 2. Procedure lấy danh sách công nợ (Trả về Cursor)
-- Thay thế hoàn toàn cho API [GET] /finance/payables

-- 25. SP_GET_DANH_SACH_CONG_NO
CREATE OR REPLACE PROCEDURE SP_GET_DANH_SACH_CONG_NO (
    p_cursor OUT SYS_REFCURSOR
) AS
BEGIN
    OPEN p_cursor FOR
        SELECT 
            hd.MAHOADONMUA AS "id",
            NVL(hd.SOHOADON_VAT, 'PO-' || TO_CHAR(hd.MAHOADONMUA)) AS "code",
            NVL(dt.TENDOITAC, 'Nhà cung cấp lẻ') AS "supplier",
            TO_CHAR(hd.NGAYLAP, 'DD/MM/YYYY') AS "date",
            NVL(hd.TONGTIEN, 0) AS "amount",
            NVL(hd.TRANGTHAI_THANHTOAN, 'Chưa thanh toán') AS "status"
        FROM HOA_DON_MUA_HANG hd
        LEFT JOIN DOI_TAC dt ON hd.MADOITAC = dt.MADOITAC
        ORDER BY CASE WHEN NVL(hd.TRANGTHAI_THANHTOAN, 'Chưa thanh toán') = 'Chưa thanh toán' THEN 0 ELSE 1 END, 
                 hd.NGAYLAP DESC;
END;
/
