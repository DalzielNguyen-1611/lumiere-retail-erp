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
    
    const result = await connection.execute("SELECT line, position, text FROM user_errors WHERE name = 'SP_GET_DANH_SACH_CONG_NO' ORDER BY line");
    console.log('Lỗi Compile:', JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
