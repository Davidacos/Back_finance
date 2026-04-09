import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: process.env.DB_PORT,
});

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('🚀 Starting migration...');
    
    // Add biweekly to frequency_type enum
    // Note: ALTER TYPE ... ADD VALUE cannot be executed inside a transaction block in some PG versions
    try {
        await client.query("ALTER TYPE frequency_type ADD VALUE IF NOT EXISTS 'biweekly'");
        console.log('✅ frequency_type updated with biweekly');
    } catch (e) {
        if (e.code === '42710') {
            console.log('ℹ️ biweekly already exists in frequency_type');
        } else {
            throw e;
        }
    }

    // Create fixed_expense_payments table
    await client.query(`
      CREATE TABLE IF NOT EXISTS fixed_expense_payments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          fixed_expense_id UUID NOT NULL,
          transaction_id UUID NOT NULL,
          payment_date DATE NOT NULL,
          period_year INT NOT NULL,
          period_month INT NOT NULL,
          period_type VARCHAR(20) DEFAULT 'monthly',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (fixed_expense_id) REFERENCES fixed_expenses(id) ON DELETE CASCADE,
          FOREIGN KEY (transaction_id) REFERENCES transactions(id) ON DELETE CASCADE
      );
    `);
    console.log('✅ fixed_expense_payments table created');

    console.log('🎉 Migration completed successfully!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
