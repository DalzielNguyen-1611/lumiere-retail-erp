# DANH SÁCH FUNCTIONS CHI TIẾT - LUMIÈRE ERP

Tài liệu này tổng hợp chi tiết toàn bộ **21 Functions** nghiệp vụ đang hoạt động trong hệ thống Lumière ERP. Dữ liệu dưới đây đã được đối chiếu thực tế 100% từ mã nguồn cơ sở dữ liệu PL/SQL tại tệp `database/fuction.sql`.

---

## I. BẢNG PHÂN TÍCH KỸ THUẬT 21 FUNCTIONS HỆ THỐNG

| STT | Tên Function | Thao tác CSDL (SQL/PL-SQL) | Các bảng liên quan | Nội dung & Logic nghiệp vụ thực tế |
| :--- | :--- | :--- | :--- | :--- |
| **1** | **`FUNC_TINH_HANG_THE`** | **Không truy vấn CSDL** (Logic rẽ nhánh ròng) | *Không có* | Phân loại hạng thẻ thành viên của khách hàng dựa trên điểm số (`p_diem`): Kim Cương (>=5000), Vàng (>=3000), Bạc (>=1000) và Thường (<1000). |
| **2** | **`FUNC_TINH_DOANH_THU_THANG`** | **`SELECT` (Gộp `SUM`, `EXTRACT`)** | `HOA_DON_BAN_HANG` | Lấy tổng tiền (`SUM(TONGTIEN)`) từ các hóa đơn bán lẻ thỏa mãn mã cửa hàng (`p_macuahang`) và trùng tháng/năm bán (`NGAYBAN`). |
| **3** | **`FUNC_GET_TON_KHO`** | **`SELECT` (Bẫy ngoại lệ `NO_DATA_FOUND`)** | `TON_KHO` | Truy xuất số lượng tồn kho của sản phẩm tại một kho cụ thể. Trả về `0` nếu sản phẩm chưa từng được khai báo tồn trong hệ thống. |
| **4** | **`FUNC_TINH_GIA_BAN_THUC_TE`** | **`SELECT` (Tính toán biểu thức số học)** | `SAN_PHAM` | Lấy giá niêm yết và thuế suất (%) của sản phẩm, tính toán đơn giá bán cuối cùng đã gồm thuế theo công thức: `GIANIEMYET * (1 + THUE/100)`. |
| **5** | **`FUNC_CHECK_QUYEN_NHAN_VIEN`** | **`SELECT` (Nối `JOIN`, gộp `COUNT(*)`, so sánh `LIKE`)** | `PHAN_QUYEN_NHAN_VIEN`, `VAI_TRO` | Nối bảng phân quyền với vai trò, đếm số bản ghi thỏa mãn điều kiện `VT.QUYENHAN LIKE '%' || p_quyenhan || '%'` để xác nhận quyền truy cập của nhân viên. Trả về 1 (nếu có) hoặc 0. |
| **6** | **`FUNC_CALC_THUE_TNCN_LUY_TIEN`** | **Không truy vấn CSDL** (Tính toán lũy tiến rẽ nhánh) | *Không có* | Áp dụng biểu thuế lũy tiến từng phần của luật Thuế TNCN Việt Nam (các mức thuế suất 5%, 10%, 15%) để tính số thuế phải trích đóng từ thu nhập chịu thuế. |
| **7** | **`FUNC_CALC_LOI_NHUAN_SP`** | **`SELECT` kép (Gộp `AVG` giá nhập, `NVL`)** | `SAN_PHAM`, `CHI_TIET_HOA_DON_MUA_HANG` | Lấy giá bán lẻ trừ đi giá nhập trung bình (`AVG(DONGIA)`) của sản phẩm đó trong lịch sử nhập hàng để tính toán biên lợi nhuận gộp. |
| **8** | **`FUNC_TINH_SO_NGAY_PHEP_CON_LAI`** | **`SELECT` lọc trực tiếp** | `QUAN_LY_PHEP` | Truy xuất số ngày phép năm còn lại (`CONLAI`) của nhân viên theo mã nhân viên và năm chỉ định. Trả về 0 nếu chưa được khởi tạo phép. |
| **9** | **`FUNC_GET_TONG_CHI_PHI_THANG`** | **`SELECT` kép (Gộp `SUM`, trích xuất ngày, nối chuỗi)** | `HOA_DON_MUA_HANG`, `PHIEU_LUONG` | Tính tổng chi phí hoạt động của doanh nghiệp trong tháng: Tổng tiền nhập hàng từ nhà cung cấp + Tổng quỹ lương thực trả của nhân viên trong tháng/năm chỉ định. |
| **10** | **`FUNC_CHECK_HSD_SAN_PHAM`** | **`SELECT` (Gộp `COUNT(*)`, so sánh `SYSDATE`)** | `CHI_TIET_PHIEU` | Đếm số lượng lô sản phẩm có ngày hết hạn cận kề trong vòng 30 ngày tới (`HANSUDUNG <= SYSDATE + 30`). Trả về 1 nếu có lô cận hạn, ngược lại trả về 0. |
| **11** | **`FUNC_GET_SO_DU_TAI_KHOAN`** | **`SELECT` trực tiếp** | `TAI_KHOAN` | Lấy số dư khả dụng hiện thời (`SODUHIENTAI`) của một tài khoản kế toán cụ thể (tiền mặt 111, ngân hàng 112, phải thu, phải trả...) qua mã tài khoản đầu vào. |
| **12** | **`FUNC_CALC_TONG_GIA_TRI_DON_HANG`** | **`SELECT` (Gộp `SUM`, `NVL`)** | `CHI_TIET_DON_HANG` | Tính tổng giá trị thanh toán của đơn hàng tạm bằng cách cộng dồn thành tiền (`SUM(THANHTIEN)`) của tất cả sản phẩm trong chi tiết đơn hàng. |
| **13** | **`FUNC_CALC_TIEN_HOAN_TRA`** | **`SELECT` (Hiệu số gộp `SUM`)** | `CHI_TIET_DOI_TRA` | Tính số tiền chênh lệch phải hoàn trả lại cho khách: `SUM(Tiền hàng trả lại) - SUM(Tiền hàng đổi mới)`. Nếu chênh lệch âm (khách phải bù tiền thêm), hàm trả về `0`. |
| **14** | **`FUNC_TONG_DOANH_THU_THEO_NV`** | **`SELECT` (Gộp `SUM`, `NVL`)** | `HOA_DON_BAN_HANG` | Lấy tổng doanh số bán lẻ tích lũy (`SUM(TONGTIEN)`) mà một nhân viên cụ thể đã thực hiện chốt hóa đơn tại quầy POS. |
| **15** | **`FUNC_CALC_GIA_VON_BINH_QUAN`** | **`SELECT` (Biểu thức trung bình gộp `SUM`, lọc `HAVING`)** | `CHI_TIET_HOA_DON_MUA_HANG` | Tính giá vốn bình quân gia quyền của sản phẩm: `SUM(SOLUONG * DONGIA) / SUM(SOLUONG)`. Dùng mệnh đề `HAVING` để lọc tổng số lượng > 0 nhằm tránh lỗi chia cho số không (division-by-zero). |
| **16** | **`FUNC_GET_NGAY_NHAP_GAN_NHAT`** | **`SELECT` (Gộp `MAX`, nối bảng `JOIN`, so sánh `LIKE`)** | `PHIEU_KHO`, `CHI_TIET_PHIEU` | Thực hiện `JOIN` phiếu kho và chi tiết phiếu kho để tìm ngày phê duyệt nhập kho gần nhất (`MAX(NGAYTHUCPHE)`) của sản phẩm, lọc theo loại phiếu nhập. |
| **17** | **`FUNC_CHECK_TON_KHO_TOI_THIEU`** | **`SELECT` (So sánh điều kiện, có bẫy ngoại lệ)** | `TON_KHO` | Truy xuất số lượng tồn kho thực tế của sản phẩm so sánh với định mức tối thiểu (`p_min`). Trả về 1 nếu tồn kho thực tế thấp hơn định mức hoặc sản phẩm chưa có dữ liệu tồn. |
| **18** | **`FUNC_TONG_NO_NCC`** | **`SELECT` (Gộp `SUM`, so sánh phủ định `!=`)** | `HOA_DON_MUA_HANG` | Tính tổng công nợ chưa trả đối với nhà cung cấp bằng cách cộng dồn tổng tiền hóa đơn mua hàng có trạng thái thanh toán khác 'Đã thanh toán'. |
| **19** | **`FUNC_TONG_DIEM_DA_DUNG`** | **`SELECT` (Gộp `SUM`, `NVL`)** | `HOA_DON_BAN_HANG` | Tính tổng số điểm tích lũy thành viên mà khách hàng đã từng tiêu dùng để giảm trừ trên các hóa đơn mua hàng trước đó. |
| **20** | **`FUNC_LAY_DUONG_DAN_DANH_MUC`** | **`SELECT` lặp đệ quy (Vòng lặp `WHILE`)** | `DANH_MUC` | Lấy tên danh mục, sử dụng vòng lặp `WHILE` để duyệt ngược từ danh mục hiện tại lên danh mục cha cho đến khi cha là `NULL` để tạo chuỗi phân cấp danh mục dạng `Mẹ > Con > Cháu`. |
| **21** | **`FUNC_BAO_CAO_DONG_TIEN`** | **`SELECT` kép (Gộp `SUM`, so sánh `LIKE`, lọc `BETWEEN`)** | `GIAO_DICH_TIEN` | Tính dòng tiền ròng của doanh nghiệp trong một giai đoạn: Lấy tổng tiền thu (`LOAIGIAODICH LIKE '%Thu%'`) trừ đi tổng tiền chi (`LOAIGIAODICH LIKE '%Chi%'`) phát sinh trong khoảng thời gian chỉ định. |

---

## II. PHÂN TÍCH CHUYÊN SÂU CÁC FUNCTIONS PHỨC TẠP BẬC NHẤT

### 1. Hàm tính thuế thu nhập lũy tiến (`FUNC_CALC_THUE_TNCN_LUY_TIEN`)
Hàm này mô phỏng chính xác thuật toán áp thuế suất lũy tiến từng phần của cơ quan thuế, giúp hệ thống nhân sự tự động khấu trừ thuế lương nhân viên:
* **Mức 1**: Thu nhập dưới 5 triệu đồng, áp thuế suất **5%**.
* **Mức 2**: Thu nhập từ 5 triệu đến 10 triệu đồng, áp thuế suất **10%** cho phần vượt 5 triệu cộng với phần thuế cố định bậc 1.
* **Mức 3**: Thu nhập trên 10 triệu đồng, áp thuế suất **15%** cho phần vượt 10 triệu cộng với phần thuế cố định của các bậc dưới.

### 2. Hàm duyệt danh mục đệ quy ngược (`FUNC_LAY_DUONG_DAN_DANH_MUC`)
Hàm này giải quyết bài toán biểu diễn cấu trúc cây phân cấp (Tree Hierarchy) của danh mục mỹ phẩm/sản phẩm:
* Sử dụng vòng lặp `WHILE v_parent IS NOT NULL` để duyệt ngược từ nút con lên gốc.
* Với mỗi vòng lặp, truy xuất tên danh mục cha và gán ngược lại cho biến liên kết: `v_kq := v_ten || ' > ' || v_kq`.
* Thuật toán này giúp sinh ra chuỗi đường dẫn (Breadcrumb) hoàn hảo cho SEO và bộ lọc người dùng trên giao diện ERP.

### 3. Hàm tính giá vốn trung bình gia quyền (`FUNC_CALC_GIA_VON_BINH_QUAN`)
Đóng vai trò nền tảng cho việc hạch toán Giá vốn hàng bán (COGS) chuẩn mực:
* Sử dụng phép toán `SUM(SOLUONG * DONGIA) / SUM(SOLUONG)` trên toàn bộ hóa đơn mua từ nhà cung cấp.
* Áp dụng mệnh đề `HAVING SUM(SOLUONG) > 0` để kiểm soát lỗi chia cho 0 trong đại số SQL khi mặt hàng đó chưa phát sinh bất kỳ giao dịch nhập kho nào.
