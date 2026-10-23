const mysql = require('mysql2/promise');

const pool = mysql.createPool(
  process.env.DATABASE_URL || {
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'proveo',
    waitForConnections: true,
    connectionLimit: 10,
  }
);

const wrapClient = (connection) => ({
  query: async (sql, params = []) => {
    const [rows] = await connection.execute(sql, params);
    return { rows };
  },
});

module.exports = {
  query: async (sql, params = []) => {
    const [rows] = await pool.execute(sql, params);
    return { rows };
  },
  transaction: async (callback) => {
    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();
      const result = await callback(wrapClient(connection));
      await connection.commit();
      return result;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },
};