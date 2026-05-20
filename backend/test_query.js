const oracledb = require('oracledb');
require('dotenv').config();

const dbConfig = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`
};

async function run() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("Connected!");
    
    // 1. Query from CHI_TIET_DON_HANG
    const res1 = await connection.execute(
      `SELECT sp.THUONGHIEU, SUM(ct.THANHTIEN) as value
       FROM CHI_TIET_DON_HANG ct
       JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
       GROUP BY sp.THUONGHIEU`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("From CHI_TIET_DON_HANG:", res1.rows);

    // 2. Query from CHI_TIET_HOA_DON_BAN_HANG
    const res2 = await connection.execute(
      `SELECT sp.THUONGHIEU, SUM(ct.THANHTIEN) as value
       FROM CHI_TIET_HOA_DON_BAN_HANG ct
       JOIN SAN_PHAM sp ON ct.MASANPHAM = sp.MASANPHAM
       GROUP BY sp.THUONGHIEU`,
      [],
      { outFormat: oracledb.OUT_FORMAT_OBJECT }
    );
    console.log("From CHI_TIET_HOA_DON_BAN_HANG:", res2.rows);

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) await connection.close();
  }
}
run();
