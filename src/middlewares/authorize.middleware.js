import { sendError } from '../utils/response.js';

/**
 * Middleware para restringir por rol y asegurar seguridad empresarial.
 * @param {string[]} allowedRoles Array de roles permitidos ('user', 'admin')
 */
export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    // Requires authMiddleware to run first so req.user exists
    if (!req.user || !req.user.role) {
      return sendError(res, 'Insufficient permissions (Unknown role)', 403);
    }

    if (!allowedRoles.includes(req.user.role)) {
      return sendError(res, 'Insufficient permissions to access this endpoint', 403, 'FORBIDDEN');
    }

    next();
  };
};
