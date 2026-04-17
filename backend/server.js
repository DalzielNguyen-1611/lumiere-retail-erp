const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Tự động biến đổi CLOB thành String để JSON không bị lỗi
oracledb.fetchAsString = [ oracledb.CLOB ];

const dbConfig = {
  user          : "PROJECT_IS_210",
  password      : "123456", 
  connectString : "localhost:1521/DMSandITPM"
};

// Hàm lấy danh sách sản phẩm
app.get('/api/san-pham', async (req, res) => {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    // outFormat giúp trả về dạng { TENSANPHAM: '...' } thay vì mảng [ '...' ]
    const result = await connection.execute(
      `SELECT * FROM SAN_PHAM`, 
      [], 
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});

app.listen(5000, () => {
  console.log('🚀 Backend đồ án đang chạy tại http://localhost:5000');
});


// Thêm đoạn này để xử lý khi người dùng vào đường dẫn gốc (http://localhost:5000)
app.get('/', (req, res) => {
  res.send('🚀 Backend ERP Lumière đang chạy rất mượt mà!');
});

// Auth login endpoint (minimal implementation, uses PASSWORDHASH from TAI_KHOAN_NHAN_VIEN)
app.post('/api/auth/login', async (req, res) => {
  let connection;
  try {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ status: 'error', message: 'Missing username or password' });

    connection = await oracledb.getConnection(dbConfig);
    const result = await connection.execute(
      `SELECT MANHANVIEN, USERNAME, PASSWORDHASH, TRANG_THAI FROM TAI_KHOAN_NHAN_VIEN WHERE USERNAME = :u`,
      [username],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );

    const row = result.rows && result.rows[0];
    if (!row) return res.status(401).json({ status: 'error', message: 'Tài khoản không tồn tại' });

    if (row.TRANG_THAI === 0) return res.status(403).json({ status: 'error', message: 'Tài khoản đã bị khóa' });

    const hash = row.PASSWORDHASH;
    const ok = await bcrypt.compare(password, hash);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Mật khẩu không chính xác' });

    // create token
    const secret = process.env.JWT_SECRET || 'dev-secret';
    const token = jwt.sign({ maNhanVien: row.MANHANVIEN, username: row.USERNAME }, secret, { expiresIn: '8h' });

    // minimal role mapping: if username === 'admin' -> admin, otherwise staff
    const role = (row.USERNAME && row.USERNAME.toLowerCase() === 'admin') ? 'admin' : 'staff';

    return res.json({ status: 'success', data: { token, user: { maNhanVien: row.MANHANVIEN, username: row.USERNAME, role } } });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ status: 'error', message: err.message });
  } finally {
    if (connection) {
      try { await connection.close(); } catch (e) { console.error(e); }
    }
  }
});
