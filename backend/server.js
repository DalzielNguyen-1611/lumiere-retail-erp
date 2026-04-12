const express = require('express');
const oracledb = require('oracledb');
const cors = require('cors');

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