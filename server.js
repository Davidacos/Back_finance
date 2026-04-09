import 'dotenv/config';
import { validateEnv } from './src/config/env.js';
import { createPool } from './src/config/database.js';
import { createApp } from './src/app.js';
import { logger } from './src/utils/logger.js';

// Validate environment variables before anything else
const env = validateEnv();

const start = async () => {
  try {
    // Initialize database connection pool
    const pool = await createPool(env);

    // Create Express app
    const app = createApp(pool, env);

    const server = app.listen(env.PORT, () => {
      logger.info(
        { port: env.PORT, env: env.NODE_ENV },
        '🚀 Finance API server started'
      );
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info({ signal }, 'Shutdown signal received');
      server.close(async () => {
        await pool.end();
        logger.info('Database pool closed. Server shut down gracefully.');
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (err) {
    logger.fatal({ err }, 'Fatal error during startup');
    process.exit(1);
  }
};

start();
