
import oracledb from 'oracledb';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const dbConfig = {
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  connectString: `${process.env.DB_HOST}:${process.env.DB_PORT}/${process.env.DB_SERVICE_NAME}`
};

async function checkData() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("Connected to database");
    
    const stores = await connection.execute("SELECT * FROM CUA_HANG", [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log("STORES DATA:");
    console.log(JSON.stringify(stores.rows, null, 2));
    
    const managers = await connection.execute("SELECT * FROM QUAN_LY_CHI_NHANH", [], { outFormat: oracledb.OUT_FORMAT_OBJECT });
    console.log("BRANCH MANAGERS DATA:");
    console.log(JSON.stringify(managers.rows, null, 2));

  } catch (err) {
    console.error(err);
  } finally {
    if (connection) {
      await connection.close();
    }
  }
}

checkData();
