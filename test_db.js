import pkg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'Postgres2026*',
  database: process.env.DB_NAME || 'finance_app',
});

async function test() {
  try {
    const users = await pool.query('SELECT * FROM users');
    const transactions = await pool.query('SELECT * FROM transactions');
    const summary = await pool.query('SELECT * FROM v_monthly_summary');
    console.log(JSON.stringify({
      usersCount: users.rowCount,
      transactionsCount: transactions.rowCount,
      summary: summary.rows
    }, null, 2));
  } catch(e) {
    console.error("DB Error:", e);
  } finally {
    pool.end();
  }
}
test();
