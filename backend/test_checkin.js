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
    
    await connection.execute(`
      INSERT INTO CHAM_CONG (MANHANVIEN, NGAY, GIOVAO, GIORA, SOGIOLAM, TANGCA, TRANGTHAI, GHICHU) 
      VALUES (1, TRUNC(SYSDATE), CURRENT_TIMESTAMP, NULL, 0, 0, 'Đang làm việc', 'Đã điểm danh vào ca')
    `, [], { autoCommit: true });
    
    console.log('Check-in success with NULL!');
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
