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
    
    const result = await connection.execute("SELECT trigger_body FROM user_triggers WHERE trigger_name = 'TRG_UPDATE_BANK_BALANCE'");
    console.log('Trigger Body:', result.rows[0][0]);
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
