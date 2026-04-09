import { z } from 'zod';

export const createTransactionSchema = z.object({
  category_id: z.union([z.number(), z.string()]).optional().nullable(),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be either income or expense' }),
  amount: z.number().positive('Amount must be positive'),
  description: z.string().max(255).optional(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)'),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other'])
});

export const updateTransactionSchema = z.object({
  category_id: z.union([z.number(), z.string()]).optional(),
  type: z.enum(['income', 'expense']).optional(),
  amount: z.number().positive('Amount must be positive').optional(),
  description: z.string().max(255).optional().nullable(),
  transaction_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (YYYY-MM-DD)').optional(),
  payment_method: z.enum(['cash', 'credit_card', 'debit_card', 'bank_transfer', 'other']).optional()
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});

export const getTransactionsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  type: z.enum(['income', 'expense']).optional(),
  categoryId: z.union([z.number(), z.string()]).optional(),
});
