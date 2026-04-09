import { Router } from 'express';
import { FixedExpensesController } from './fixedExpenses.controller.js';
import { FixedExpensesService } from './fixedExpenses.service.js';
import { FixedExpensesRepository } from './fixedExpenses.repository.js';
import { CategoriesRepository } from '../categories/categories.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createFixedExpenseSchema, updateFixedExpenseSchema, getFixedExpensesQuerySchema } from './fixedExpenses.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const createFixedExpensesRoutes = (pool, env) => {
  const router = Router();
  
  const fxRepository = new FixedExpensesRepository(pool);
  const catRepository = new CategoriesRepository(pool);
  
  const service = new FixedExpensesService(fxRepository, catRepository);
  const controller = new FixedExpensesController(service);

  router.use(authMiddleware(env));

  router.get(
    '/',
    validate(getFixedExpensesQuerySchema, 'query'),
    controller.getAll.bind(controller)
  );
  
  router.post(
    '/',
    validate(createFixedExpenseSchema),
    controller.create.bind(controller)
  );
  
  router.put(
    '/:id',
    validate(updateFixedExpenseSchema),
    controller.update.bind(controller)
  );
  
  router.delete('/:id', controller.delete.bind(controller));
  
  // Payment tracking
  router.post('/:id/pay', controller.markAsPaid.bind(controller));
  router.get('/history/payments', controller.getPayments.bind(controller));

  return router;
};
