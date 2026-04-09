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
    windowMs: 15 * 60 * 1000, // Fixed 15 minutes window for auth limits
    max: env.AUTH_RATE_LIMIT_MAX || 5, // Use environment variable or fallback to 5
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Prevent brute force by combining IP + email (if provided)
      return req.body?.email ? `${req.ip}_${req.body.email}` : req.ip;
    },
    handler: (req, res) => {
      sendError(res, 'Too many login attempts. Please try again in 15 minutes.', 429, 'RATE_LIMIT_EXCEEDED');
    },
  });
