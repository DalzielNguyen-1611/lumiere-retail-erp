const oracledb = require('oracledb');
require('dotenv').config();

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection({
      user: process.env.DB_USERNAME,
      password: process.env.DB_PASSWORD,
      connectString: process.env.DB_HOST + ':' + process.env.DB_PORT + '/' + process.env.DB_SERVICE_NAME
    });
    
    const result = await connection.execute("SELECT MAHOADONMUA FROM HOA_DON_MUA_HANG WHERE TRANGTHAI_THANHTOAN = 'Chưa thanh toán' FETCH FIRST 1 ROWS ONLY");
    if (result.rows.length > 0) {
      const id = result.rows[0][0];
      await connection.execute("BEGIN SP_THANH_TOAN_HOA_DON_MUA(:id, 111, 'Tiền mặt'); END;", { id }, { autoCommit: true });
      console.log('Thanh toán test thành công cho ID:', id);
    } else {
      console.log('Không có hóa đơn chưa thanh toán để test.');
    }
  } catch (err) {
    console.error('Lỗi test thanh toán:', err.message);
  } finally {
    if (connection) await connection.close();
  }
}
run();
