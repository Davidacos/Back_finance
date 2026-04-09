import pg from 'pg';
import { logger } from '../utils/logger.js';

const { Pool } = pg;

/**
 * Creates and verifies a PostgreSQL connection pool.
 * @param {object} env - Validated environment config
 * @returns {pg.Pool}
 */
export const createPool = async (env) => {
  const pool = new Pool({
    host: env.DB_HOST,
    port: env.DB_PORT,
    user: env.DB_USER,
    password: env.DB_PASSWORD,
    database: env.DB_NAME,
    max: env.DB_CONNECTION_LIMIT,
  });

  // Verify connection on startup
  try {
    const client = await pool.connect();
    // Test the connection
    await client.query('SELECT 1');
    client.release();
    logger.info({ host: env.DB_HOST, db: env.DB_NAME }, '✅ Database connected');
  } catch (err) {
    logger.fatal({ err }, '❌ Could not connect to database');
    throw err;
  }

  return pool;
};

