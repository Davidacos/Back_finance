import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';
import { ReportsRepository } from './reports.repository.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { monthlyReportQuerySchema } from './reports.validator.js';
import { authMiddleware } from '../../middlewares/auth.middleware.js';

export const createReportsRoutes = (pool, env) => {
  const router = Router();
  
  const repository = new ReportsRepository(pool);
  const service = new ReportsService(repository);
  const controller = new ReportsController(service);

  router.use(authMiddleware(env));

  router.get(
    '/monthly',
    validate(monthlyReportQuerySchema, 'query'),
    controller.getMonthlyReport
  );

  return router;
};
