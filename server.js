const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Khởi tạo và kết nối SQLite DB (máy tự tạo file database.sqlite)
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Lỗi kết nối CSDL:', err.message);
    } else {
        console.log('Đã kết nối thành công tới SQLite DB.');
    }
});

// Tạo bảng lưu trữ phản ánh nếu chưa tồn tại
db.run(`
    CREATE TABLE IF NOT EXISTS phan_anh (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        ho_ten TEXT NOT NULL,
        so_nha TEXT NOT NULL,
        tieu_de TEXT NOT NULL,
        noi_dung TEXT NOT NULL,
        trang_thai TEXT DEFAULT 'Chờ xử lý',
        phan_hoi TEXT DEFAULT 'Chưa có phản hồi',
        ngay_tao DATETIME DEFAULT CURRENT_TIMESTAMP
    )
`);

// API 1: Hộ dân gửi phản ánh mới
app.post('/api/phan-anh', (req, res) => {
    const { ho_ten, so_nha, tieu_de, noi_dung } = req.body;
    if (!ho_ten || !so_nha || !tieu_de || !noi_dung) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin!' });
    }

    const sql = `INSERT INTO phan_anh (ho_ten, so_nha, tieu_de, noi_dung) VALUES (?, ?, ?, ?)`;
    db.run(sql, [ho_ten, so_nha, tieu_de, noi_dung], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Gửi phản ánh thành công!', id: this.lastID });
    });
});

// API 2: Lấy danh sách toàn bộ phản ánh
app.get('/api/phan-anh', (req, res) => {
    const sql = `SELECT * FROM phan_anh ORDER BY id DESC`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(rows);
    });
});

// API 3: Ban quản lý phản hồi & cập nhật trạng thái phản ánh
app.put('/api/phan-anh/:id/phan-hoi', (req, res) => {
    const { id } = req.params;
    const { phan_hoi, trang_thai } = req.body;

    if (!phan_hoi || !trang_thai) {
        return res.status(400).json({ error: 'Vui lòng nhập nội dung phản hồi và trạng thái!' });
    }

    const sql = `UPDATE phan_anh SET phan_hoi = ?, trang_thai = ? WHERE id = ?`;
    db.run(sql, [phan_hoi, trang_thai, id], function (err) {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ message: 'Đã cập nhật phản hồi thành công!' });
    });
});

// Khởi chạy Server
app.listen(PORT, () => {
    console.log(`Server đang chạy tại địa chỉ: http://localhost:${PORT}`);
});
// Hàm lọc danh sách phản ánh theo tên hộ dân
function filterHistory() {
  const keyword = document.getElementById('searchName').value.toLowerCase().trim();
  const allCards = document.querySelectorAll('.feedback-card'); // Đổi tên class card tương ứng với code của bạn

  allCards.forEach(card => {
    // Lấy tên hộ dân từ card dữ liệu
    const nameText = card.querySelector('.household-name')?.textContent.toLowerCase() || '';
    
    if (nameText.includes(keyword)) {
      card.style.display = 'block';
    } else {
      card.style.display = 'none';
    }
  });
}