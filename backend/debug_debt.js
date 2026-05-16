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
    
    console.log('Đang gọi SP_GET_DANH_SACH_CONG_NO...');
    const result = await connection.execute(
      `BEGIN SP_GET_DANH_SACH_CONG_NO(:cursor); END;`,
      { cursor: { type: oracledb.CURSOR, dir: oracledb.BIND_OUT } },
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    
    const cursor = result.outBinds.cursor;
    const rows = await cursor.getRows();
    await cursor.close();
    
    console.log('Dữ liệu trả về:', rows.length, 'dòng');
    console.log('Dòng đầu tiên:', rows[0]);
  } catch (err) {
    console.error('LỖI DATABASE:', err.message);
  } finally {
    if (connection) await connection.close();
  }
}
run();
