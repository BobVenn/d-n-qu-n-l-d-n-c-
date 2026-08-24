# Đồ Án: Web Quản Lý Tổ Dân Phố

## 1. Phân Công Công Việc
- **Nguyễn Thành Nam (Trưởng nhóm):** `pages/ho-khau.html`, `js/services/hoKhauService.js`, `js/auth.js`, `login.html`, `js/firebase-config.js`
  - Nhiệm vụ: Cấu hình Firebase & Auth, Quản lý Hộ khẩu, Tạm trú/Tạm vắng.
- **Hoàng Phú Nam Khánh:** `pages/nhan-khau.html`, `js/services/nhanKhauService.js`, `css/`
  - Nhiệm vụ: Thiết kế khung layout (Navbar/Sidebar), Quản lý Nhân khẩu, Lọc theo Hộ khẩu.
- **Lương Văn Long:** `pages/thu-phi.html`, `js/services/thuPhiService.js`
  - Nhiệm vụ: Quản lý danh mục phí, đóng góp quỹ theo hộ, cập nhật trạng thái thu tiền.
- **Nguyễn Thị Lan:** `pages/phan-anh.html`, `js/services/phanAnhService.js`, `index.html`, `js/dashboard.js`
  - Nhiệm vụ: Tiếp nhận/xử lý phản ánh, Dashboard biểu đồ thống kê, Kiểm thử & Tài liệu.

---

## 2. Quy Ước Cấu Trúc Database (Firestore Collections)

### 2.1. Collection `hoKhau` (Nam)
- `maHoKhau`: `"HK001"` (String - Khóa liên kết)
- `chuHo`: `"Nguyễn Văn A"`
- `cccdChuHo`: `"031..."`
- `diaChi`: `"Số 12, Ngõ 34..."`
- `soThanhVien`: `4` (Number)
- `trangThai`: `"Thường trú"` / `"Tạm trú"`

### 2.2. Collection `nhanKhau` (Khánh)
- `maHoKhau`: `"HK001"` (Khóa ngoại nối với `hoKhau`)
- `hoTen`: `"Nguyễn Văn B"`
- `cccd`: `"031..."`
- `ngaySinh`: `"2002-05-15"`
- `gioiTinh`: `"Nam"` / `"Nữ"`
- `quanHeVoiChuHo`: `"Con trai"` / `"Vợ"` / `"Chủ hộ"`

### 2.3. Collection `thuPhi` (Long)
- `maHoKhau`: `"HK001"` (Khóa ngoại nối với `hoKhau`)
- `tenKhoanThu`: `"Phí vệ sinh môi trường"`
- `soTien`: `60000` (Number)
- `ngayDong`: `"2026-08-24"`
- `trangThai`: `"Đã nộp"` / `"Chưa nộp"`

### 2.4. Collection `phanAnh` (Lan)
- `nguoiGui`: `"Nguyễn Văn A"`
- `tieuDe`: `"Hỏng đèn đường ngõ 34"`
- `noiDung`: `"Đèn bị chập chờn..."`
- `ngayGui`: `"2026-08-24"`
- `trangThai`: `"Chờ xử lý"` / `"Đã giải quyết"`

---

## 3. Hướng Dẫn Git Cho Nhóm
1. Clone dự án: `git clone <link-repo>`
2. Tạo nhánh riêng:
   - Nam: `git checkout -b feature/ho-khau`
   - Khánh: `git checkout -b feature/nhan-khau`
   - Long: `git checkout -b feature/thu-phi`
   - Lan: `git checkout -b feature/phan-anh`
3. Lưu & Đẩy code:
   ```bash
   git add .
   git commit -m "hoan thanh chuc nang xyz"
   git push origin <ten-nhanh-cua-minh>
