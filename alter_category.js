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

async function run() {
  try {
    await pool.query('ALTER TABLE transactions ALTER COLUMN category_id DROP NOT NULL;');
    console.log("Success: Dropped NOT NULL constraint on transacations.category_id");
  } catch(e) {
    console.error("Error:", e);
  } finally {
    pool.end();
  }
}

run();
