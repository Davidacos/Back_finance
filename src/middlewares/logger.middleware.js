import { logger } from '../utils/logger.js';

export const loggerMiddleware = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const responseTime = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      status: res.statusCode,
      responseTime: `${responseTime}ms`,
      userId: req.user ? req.user.id : 'unauthenticated',
      ip: req.ip
    };

    if (res.statusCode >= 500) {
      logger.error(logData, 'Server Error Request');
    } else if (res.statusCode >= 400) {
      logger.warn(logData, 'Client Error Request');
    } else {
      logger.info(logData, 'Processed Request');
    }
  });

  next();
};
