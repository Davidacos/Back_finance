import { logger } from '../utils/logger.js';
import { sendError } from '../utils/response.js';

/**
 * Global Express error handler — must have 4 args to be recognized by Express
 */
// eslint-disable-next-line no-unused-vars
export const errorMiddleware = (env) => (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  const isDev = env.NODE_ENV === 'development';

  logger.error(
    {
      err: { message: err.message, stack: err.stack, code: err.code },
      req: { method: req.method, url: req.url, ip: req.ip },
    },
    'Unhandled error'
  );

  // Don't leak stack traces in production
  return sendError(
    res,
    err.message || 'Internal server error',
    statusCode,
    isDev ? err.stack : undefined
  );
};

/**
 * 404 handler — must be registered AFTER all routes
 */
export const notFoundMiddleware = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.url} not found`, 404, 'NOT_FOUND');
};
