import { Router } from 'express';
import { UsersController } from './users.controller.js';
import { UsersService } from './users.service.js';
import { UsersRepository } from './users.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { updateUserSchema } from './users.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const createUsersRoutes = (pool, env) => {
  const router = Router();
  
  const repository = new UsersRepository(pool);
  const service = new UsersService(repository);
  const controller = new UsersController(service);

  // All user routes must be authenticated
  router.use(authMiddleware(env));

  router.get('/me', controller.getMe);
  
  router.put(
    '/me',
    validate(updateUserSchema),
    controller.updateMe
  );

  return router;
};
