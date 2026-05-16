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
    
    const result = await connection.execute("SELECT trigger_name FROM user_triggers");
    console.log('Triggers:', result.rows.map(r => r[0]));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
