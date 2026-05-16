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
    
    const result = await connection.execute("SELECT column_name FROM user_tab_columns WHERE table_name = 'GIAO_DICH_TIEN'");
    console.log('Columns GIAO_DICH_TIEN:', result.rows.map(r => r[0]));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
