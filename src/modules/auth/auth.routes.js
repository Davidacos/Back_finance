import { Router } from 'express';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { AuthRepository } from './auth.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';
import { registerSchema, loginSchema, changePasswordSchema, refreshTokenSchema } from './auth.validator.js';
import { authLimiter } from '../../middlewares/rateLimiter.middleware.js';

export const createAuthRoutes = (pool, env) => {
  const router = Router();
  
  // Dependency Injection setup
  const repository = new AuthRepository(pool);
  const service = new AuthService(repository, env);
  const controller = new AuthController(service);

  // Apply strict rate limiting for auth endpoints
  router.use(authLimiter(env));

  router.post(
    '/register',
    validate(registerSchema),
    controller.register
  );

  router.post(
    '/login',
    validate(loginSchema),
    controller.login
  );

  router.post(
    '/refresh-token',
    validate(refreshTokenSchema),
    controller.refreshToken
  );

  router.post(
    '/logout',
    validate(refreshTokenSchema),
    controller.logout
  );

  router.put(
    '/change-password',
    authMiddleware(env),
    validate(changePasswordSchema),
    controller.changePassword
  );

  return router;
};
