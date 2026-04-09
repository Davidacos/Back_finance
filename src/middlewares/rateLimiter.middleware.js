import rateLimit from 'express-rate-limit';
import { sendError } from '../utils/response.js';

const rateLimitHandler = (req, res) => {
  sendError(res, 'Too many requests, please try again later.', 429, 'RATE_LIMIT_EXCEEDED');
};

/**
 * General API rate limiter
 */
export const generalLimiter = (env) =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });

/**
 * Strict limiter for auth endpoints to prevent brute-force
 */
export const authLimiter = (env) =>
  rateLimit({
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    max: env.AUTH_RATE_LIMIT_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    handler: rateLimitHandler,
  });
