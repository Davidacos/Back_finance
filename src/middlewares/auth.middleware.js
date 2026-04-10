import jwt from 'jsonwebtoken';
import { sendError } from '../utils/response.js';

/**
 * Verifies JWT token and attaches decoded user to req.user
 */
export const authMiddleware = (env) => (req, res, next) => {
  let token = req.cookies?.accessToken;

  // Fallback to Header for non-browser clients (like native mobile apps)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    }
  }

  if (!token) {
    return sendError(res, 'Authorization token required', 401);
  }

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET);
    req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return sendError(res, 'Token expired', 401, 'TOKEN_EXPIRED');
    }
    return sendError(res, 'Invalid token', 401, 'INVALID_TOKEN');
  }
};
