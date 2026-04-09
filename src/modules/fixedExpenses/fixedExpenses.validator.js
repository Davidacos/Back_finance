import { z } from 'zod';

export const createFixedExpenseSchema = z.object({
  category_id: z.union([z.number(), z.string()], { required_error: 'Category ID is required' }),
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  amount: z.number().positive('Amount must be positive'),
  frequency: z.enum(['monthly', 'yearly', 'biweekly'], { required_error: 'Frequency must be monthly, yearly or biweekly' }),
  day_of_month: z.number().min(1).max(31, 'Day must be between 1 and 31').optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format').nullable().optional(),
  description: z.string().max(255).optional().nullable()
});

export const updateFixedExpenseSchema = z.object({
  category_id: z.union([z.number(), z.string()]).optional(),
  name: z.string().min(2).max(100).optional(),
  amount: z.number().positive().optional(),
  frequency: z.enum(['monthly', 'yearly', 'biweekly']).optional(),
  day_of_month: z.number().min(1).max(31).nullable().optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable().optional(),
  description: z.string().max(255).nullable().optional(),
  is_active: z.boolean().optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});

export const getFixedExpensesQuerySchema = z.object({
  includeInactive: z.string().transform(val => val === 'true').optional()
});
