import { Router } from 'express';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';
import { CategoriesRepository } from './categories.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCategorySchema, updateCategorySchema } from './categories.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const createCategoriesRoutes = (pool, env) => {
  const router = Router();
  
  const repository = new CategoriesRepository(pool);
  const service = new CategoriesService(repository);
  const controller = new CategoriesController(service);

  router.use(authMiddleware(env));

  router.get('/', controller.getAll);
  
  router.post(
    '/',
    validate(createCategorySchema),
    controller.create
  );
  
  router.put(
    '/:id',
    validate(updateCategorySchema),
    controller.update
  );
  
  router.delete('/:id', controller.delete);

  return router;
};
