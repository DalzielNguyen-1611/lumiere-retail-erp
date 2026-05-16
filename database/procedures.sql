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
        v_tong_thu_thuc_te NUMBER;
    BEGIN
        v_doanhthu := v_TONGTIENTAMTINH;
        v_thuevat := ROUND(v_doanhthu * 0.1);
        v_tong_thu_thuc_te := v_doanhthu + v_thuevat;

        -- 1. Ghi nhận Nợ TK 111/112 (Tổng tiền thu thực tế bao gồm VAT)
        INSERT INTO GIAO_DICH_TIEN (
            MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAHOADONBAN, GHICHU
        ) VALUES (
            v_MACUAHANG, v_MATAIKHOAN, 'Thu tiền bán hàng', v_tong_thu_thuc_te, SYSTIMESTAMP, v_MAHOADON, 'Khách thanh toán POS (Đơn #' || TO_CHAR(p_MADONHANG) || ')'
        );
        UPDATE TAI_KHOAN SET SODUHIENTAI = NVL(SODUHIENTAI,0) + v_tong_thu_thuc_te WHERE MATAIKHOAN = v_MATAIKHOAN;

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

        -- 4. Hạch toán Giá vốn (COGS) & Giảm kho (TK 156)
        DECLARE
            v_tong_gia_von NUMBER := 0;
            v_gia_von_don_vi NUMBER;
        BEGIN
            FOR item IN (SELECT MASANPHAM, SOLUONG, DONGIA FROM CHI_TIET_DON_HANG WHERE MADONHANG = p_MADONHANG) LOOP
                -- Tính giá vốn bình quân (Weighted Average Cost) từ lịch sử nhập hàng
                SELECT NVL(
                    (SELECT SUM(THANHTIEN) / SUM(SOLUONG) FROM CHI_TIET_HOA_DON_MUA_HANG WHERE MASANPHAM = item.MASANPHAM),
                    item.DONGIA * 0.6
                ) INTO v_gia_von_don_vi FROM DUAL;
                
                v_tong_gia_von := v_tong_gia_von + (v_gia_von_don_vi * item.SOLUONG);
            END LOOP;

            IF v_tong_gia_von > 0 THEN
                -- Ghi Nợ TK 632 (Giá vốn)
                INSERT INTO GIAO_DICH_TIEN (MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, GHICHU)
                VALUES (v_MACUAHANG, 632, 'Ghi nhận giá vốn', v_tong_gia_von, SYSTIMESTAMP, 'Giá vốn đơn hàng #' || p_MADONHANG);
                UPDATE TAI_KHOAN SET SODUHIENTAI = SODUHIENTAI + v_tong_gia_von WHERE MATAIKHOAN = 632;

                -- Ghi Có TK 156 (Giảm hàng hóa)
                INSERT INTO GIAO_DICH_TIEN (MACUAHANG, MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, GHICHU)
                VALUES (v_MACUAHANG, 156, 'CHI', v_tong_gia_von, SYSTIMESTAMP, 'Xuất kho bán hàng đơn #' || p_MADONHANG);
                -- Trigger TRG_UPDATE_BANK_BALANCE sẽ tự động giảm SODUHIENTAI của 156 vì LOAIGIAODICH = 'CHI'
            END IF;
        END;
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

    -- 3. Tạo phiếu chi tiền từ tài khoản Thanh toán (111/112)
    INSERT INTO GIAO_DICH_TIEN (
        MACUAHANG, MATAIKHOAN, LOAIGIAODICH, 
        SOTIEN, NGAYGIAODICH, GHICHU
    ) VALUES (
        1, p_mataikhoan, 'CHI', 
        v_tongtien, SYSTIMESTAMP, 'Chi trả NCC - Hóa đơn: ' || NVL(v_sohoadon, TO_CHAR(p_mahoadon))
    );

    -- 4. Ghi nhận giảm nợ phải trả trên TK 331 (Lưu lịch sử)
    INSERT INTO GIAO_DICH_TIEN (
        MACUAHANG, MATAIKHOAN, LOAIGIAODICH, 
        SOTIEN, NGAYGIAODICH, GHICHU
    ) VALUES (
        1, 331, 'CHI', 
        v_tongtien, SYSTIMESTAMP, 'Tất toán nợ NCC - Hóa đơn: ' || NVL(v_sohoadon, TO_CHAR(p_mahoadon))
    );

    -- LƯU Ý: Không cần UPDATE TAI_KHOAN 111/112 và 331 ở đây vì đã có 
    -- Trigger TRG_UPDATE_BANK_BALANCE tự động cập nhật số dư khi có Giao dịch tiền loại 'CHI'.
    
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
            CAST('MUA' AS NVARCHAR2(10)) AS "type",
            CAST(NVL(hd.SOHOADON_VAT, 'PO-' || TO_CHAR(hd.MAHOADONMUA)) AS NVARCHAR2(100)) AS "code",
            NVL(dt.TENDOITAC, N'Nhà cung cấp lẻ') AS "supplier",
            CAST(TO_CHAR(hd.NGAYLAP, 'DD/MM/YYYY') AS NVARCHAR2(20)) AS "date",
            NVL(hd.TONGTIEN, 0) AS "amount",
            NVL(hd.TRANGTHAI_THANHTOAN, N'Chưa thanh toán') AS "status"
        FROM HOA_DON_MUA_HANG hd
        LEFT JOIN DOI_TAC dt ON hd.MADOITAC = dt.MADOITAC
        WHERE NVL(hd.TRANGTHAI_THANHTOAN, N'Chưa thanh toán') = N'Chưa thanh toán'
        UNION ALL
        SELECT 
            pl.MAPHIEU AS "id",
            CAST('LUONG' AS NVARCHAR2(10)) AS "type",
            CAST('SAL-' || TO_CHAR(pl.MAPHIEU) AS NVARCHAR2(100)) AS "code",
            nv.HOTEN AS "supplier",
            pl.THANGNAM AS "date",
            pl.THUCLINH AS "amount",
            pl.TRANGTHAI AS "status"
        FROM PHIEU_LUONG pl
        JOIN NHANVIEN nv ON pl.MANHANVIEN = nv.MANHANVIEN
        WHERE pl.TRANGTHAI = N'Chưa thanh toán'
        ORDER BY 4 DESC; -- Sắp xếp theo supplier/tên
END;
/

--------------------------------------------------------------------------------
-- PROCEDURE: SP_LAP_PHIEU_LUONG
-- Lập phiếu lương và hạch toán kế toán (Tăng nợ phải trả)
--------------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_LAP_PHIEU_LUONG (
    p_manhanvien IN NUMBER,
    p_thangnam IN VARCHAR2,
    p_luong_thuc_nhan IN NUMBER -- Lương tính theo ngày công (Gross)
) AS
    v_mucluong NUMBER;
    v_giamtru NUMBER;
    v_ins_base NUMBER;
    -- NV đóng (10.5%)
    v_bhxh_nv NUMBER;
    v_bhyt_nv NUMBER;
    v_bhtn_nv NUMBER;
    -- DN đóng (21.5%)
    v_bhxh_dn NUMBER;
    v_bhyt_dn NUMBER;
    v_bhtn_dn NUMBER;
    
    v_thue_tncn NUMBER := 0;
    v_thuclinh NUMBER;
    v_maphieu NUMBER;
    v_count NUMBER;
    v_is_manager NUMBER := 0;
    v_total_expense NUMBER;
BEGIN
    -- 1. Lấy thông tin hồ sơ lương
    SELECT MUCLUONG, GIAMTRUBANTHAN INTO v_mucluong, v_giamtru 
    FROM HO_SO_LUONG WHERE MANHANVIEN = p_manhanvien;

    -- 2. Kiểm tra vai trò quản lý
    SELECT COUNT(*) INTO v_is_manager
    FROM PHAN_QUYEN_NHAN_VIEN pq
    JOIN VAI_TRO vt ON pq.MAVAITRO = vt.MAVAITRO
    WHERE pq.MANHANVIEN = p_manhanvien
    AND (LOWER(vt.TENVAITRO) LIKE '%manager%' OR LOWER(vt.TENVAITRO) LIKE '%admin%');

    -- 3. Xác định mức lương đóng bảo hiểm (Trần 36tr)
    v_ins_base := LEAST(v_mucluong, 36000000);

    -- 4. Tính bảo hiểm NLĐ (10.5%)
    v_bhxh_nv := ROUND(v_ins_base * 0.08);
    v_bhyt_nv := ROUND(v_ins_base * 0.015);
    v_bhtn_nv := ROUND(v_ins_base * 0.01);

    -- 5. Tính bảo hiểm DN (21.5%)
    v_bhxh_dn := ROUND(v_ins_base * 0.175); -- Bao gồm 14% hưu trí, 3% thai sản, 0.5% TNLĐ
    v_bhyt_dn := ROUND(v_ins_base * 0.03);
    v_bhtn_dn := ROUND(v_ins_base * 0.01);

    -- 6. Tính thuế TNCN (Tạm tính đơn giản: 5% phần vượt quá giảm trừ sau khi trừ BH NV)
    IF (p_luong_thuc_nhan - (v_bhxh_nv + v_bhyt_nv + v_bhtn_nv)) > v_giamtru THEN
        v_thue_tncn := ROUND((p_luong_thuc_nhan - (v_bhxh_nv + v_bhyt_nv + v_bhtn_nv) - v_giamtru) * 0.05);
    END IF;

    -- 7. Tính lương thực lĩnh (Phần nợ 334)
    v_thuclinh := p_luong_thuc_nhan - (v_bhxh_nv + v_bhyt_nv + v_bhtn_nv) - v_thue_tncn;
    
    -- 8. Tính tổng chi phí DN phải chịu
    v_total_expense := p_luong_thuc_nhan + (v_bhxh_dn + v_bhyt_dn + v_bhtn_dn);

    -- 9. Kiểm tra trùng lặp
    SELECT COUNT(*) INTO v_count FROM PHIEU_LUONG WHERE MANHANVIEN = p_manhanvien AND THANGNAM = p_thangnam;
    IF v_count > 0 THEN
        RAISE_APPLICATION_ERROR(-20001, 'Nhân viên đã được lập phiếu lương cho tháng này.');
    END IF;

    -- 10. Ghi vào bảng PHIEU_LUONG
    INSERT INTO PHIEU_LUONG (MANHANVIEN, THANGNAM, LUONG, TONGBAOHIEMNV, TONGTHUETNCN, THUCLINH, TRANGTHAI)
    VALUES (p_manhanvien, p_thangnam, p_luong_thuc_nhan, (v_bhxh_nv + v_bhyt_nv + v_bhtn_nv), v_thue_tncn, v_thuclinh, 'Chưa thanh toán')
    RETURNING MAPHIEU INTO v_maphieu;

    -- 11. Hạch toán kế toán (Lưu lịch sử qua GIAO_DICH_TIEN)
    -- Ghi nhận Chi phí (Nếu là quản lý ghi vào 642)
    IF v_is_manager > 0 THEN
        INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
        VALUES (642, 'THU', v_total_expense, SYSTIMESTAMP, v_maphieu, 'Chi phí lương quản lý tháng ' || p_thangnam);
    END IF;

    -- Ghi tăng nợ 334 (Lương thực trả)
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (334, 'THU', v_thuclinh, SYSTIMESTAMP, v_maphieu, 'Ghi nhận nợ lương tháng ' || p_thangnam);
    
    -- Ghi tăng nợ 3335 (Thuế TNCN)
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (3335, 'THU', v_thue_tncn, SYSTIMESTAMP, v_maphieu, 'Trích thuế TNCN tháng ' || p_thangnam);
    
    -- Ghi tăng nợ bảo hiểm (Cộng gộp phần NV và DN - Tổng 32%)
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (3383, 'THU', v_bhxh_nv + v_bhxh_dn, SYSTIMESTAMP, v_maphieu, 'Trích đóng BHXH (25.5%) tháng ' || p_thangnam);
    
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (3384, 'THU', v_bhyt_nv + v_bhyt_dn, SYSTIMESTAMP, v_maphieu, 'Trích đóng BHYT (4.5%) tháng ' || p_thangnam);
    
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (3386, 'THU', v_bhtn_nv + v_bhtn_dn, SYSTIMESTAMP, v_maphieu, 'Trích đóng BHTN (2%) tháng ' || p_thangnam);

    COMMIT;
END;
/

--------------------------------------------------------------------------------
-- PROCEDURE: SP_THANH_TOAN_LUONG
-- Thực hiện chi trả lương và tất toán nợ 334
--------------------------------------------------------------------------------
CREATE OR REPLACE PROCEDURE SP_THANH_TOAN_LUONG (
    p_maphieu IN NUMBER,
    p_mataikhoan IN NUMBER, -- 111 hoặc 112
    p_ghichu IN VARCHAR2
) AS
    v_sotien NUMBER;
BEGIN
    -- 1. Lấy số tiền cần trả
    SELECT THUCLINH INTO v_sotien FROM PHIEU_LUONG WHERE MAPHIEU = p_maphieu;

    -- 2. Cập nhật trạng thái phiếu lương
    UPDATE PHIEU_LUONG SET TRANGTHAI = 'Đã thanh toán' WHERE MAPHIEU = p_maphieu;

    -- 3. Hạch toán tất toán nợ 334 (Lưu lịch sử)
    -- Giảm nợ 334
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (334, 'CHI', v_sotien, SYSTIMESTAMP, p_maphieu, 'Tất toán nợ lương: ' || p_ghichu);

    -- 4. Tạo giao dịch tiền tại quỹ/ngân hàng (Phiếu chi thực tế)
    INSERT INTO GIAO_DICH_TIEN (MATAIKHOAN, LOAIGIAODICH, SOTIEN, NGAYGIAODICH, MAPHIEULUONG, GHICHU)
    VALUES (p_mataikhoan, 'CHI', v_sotien, SYSTIMESTAMP, p_maphieu, 'Chi tiền trả lương: ' || p_ghichu);

    COMMIT;
END;
/
