import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { logger } from './utils/logger.js';
import { generalLimiter } from './middlewares/rateLimiter.middleware.js';
import { loggerMiddleware } from './middlewares/logger.middleware.js';
import { errorMiddleware, notFoundMiddleware } from './middlewares/error.middleware.js';

// Route imports
import { createAuthRoutes } from './modules/auth/auth.routes.js';
import { createUsersRoutes } from './modules/users/users.routes.js';
import { createTransactionsRoutes } from './modules/transactions/transactions.routes.js';
import { createCategoriesRoutes } from './modules/categories/categories.routes.js';
import { createFixedExpensesRoutes } from './modules/fixedExpenses/fixedExpenses.routes.js';
import { createReportsRoutes } from './modules/reports/reports.routes.js';

/**
 * Factory function — injects pool and env into all modules
 */
export const createApp = (pool, env) => {
  const app = express();

  // ── Security ────────────────────────────────────────────
  app.use(helmet());
  app.use(
    cors({
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'Cookie'],
      credentials: true,
    })
  );

  // ── Parsers ──────────────────────────────────────────────
  app.use(cookieParser());

  // ── Core Middleware ──────────────────────────────────────
  app.use(express.json({ limit: '10kb' }));
  app.use(express.urlencoded({ extended: true, limit: '10kb' }));

  // ── Rate Limiting ────────────────────────────────────────
  app.use('/api/', generalLimiter(env));

  // ── Request Logger ───────────────────────────────────────
  app.use(loggerMiddleware);

  // ── Health Check ─────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({ success: true, message: 'Finance API is running', timestamp: new Date().toISOString() });
  });

  // ── API Routes ───────────────────────────────────────────
  const API = '/api/v1';
  app.use(`${API}/auth`, createAuthRoutes(pool, env));
  app.use(`${API}/users`, createUsersRoutes(pool, env));
  app.use(`${API}/transactions`, createTransactionsRoutes(pool, env));
  app.use(`${API}/categories`, createCategoriesRoutes(pool, env));
  app.use(`${API}/fixed-expenses`, createFixedExpensesRoutes(pool, env));
  app.use(`${API}/reports`, createReportsRoutes(pool, env));

  // ── 404 & Error Handlers ─────────────────────────────────
  app.use(notFoundMiddleware);
  app.use(errorMiddleware(env));

  return app;
};
