import { Router } from 'express';
import { TransactionsController } from './transactions.controller.js';
import { TransactionsService } from './transactions.service.js';
import { TransactionsRepository } from './transactions.repository.js';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createTransactionSchema, updateTransactionSchema, getTransactionsQuerySchema } from './transactions.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const createTransactionsRoutes = (pool, env) => {
  const router = Router();
  
  const txRepository = new TransactionsRepository(pool);
  const catRepository = new CategoriesRepository(pool);
  
  const service = new TransactionsService(txRepository, catRepository);
  const controller = new TransactionsController(service);

  router.use(authMiddleware(env));

  router.get(
    '/',
    validate(getTransactionsQuerySchema, 'query'),
    controller.getAll
  );
  
  router.post(
    '/',
    validate(createTransactionSchema),
    controller.create
  );
  
  router.put(
    '/:id',
    validate(updateTransactionSchema),
    controller.update
  );
  
  router.delete('/:id', controller.delete);

  return router;
};
