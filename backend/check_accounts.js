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
    
    const result = await connection.execute("SELECT MATAIKHOAN, TENTAIKHOAN, SODUHIENTAI FROM TAI_KHOAN WHERE MATAIKHOAN IN (334, 3335, 3383, 3384, 3386)");
    console.log('Tài khoản kế toán:', result.rows);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
