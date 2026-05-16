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
    
    const result = await connection.execute("SELECT TEXT FROM USER_SOURCE WHERE NAME = 'SP_THANH_TOAN_DON_HANG'");
    let fullText = '';
    for(let r of result.rows) fullText += r[0];
    console.log(fullText.substring(fullText.length - 800));
  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
