import { z } from 'zod';

export const createCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  type: z.enum(['income', 'expense'], { required_error: 'Type must be either income or expense' }),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100).optional(),
  icon: z.string().max(50).optional(),
  color: z.string().max(20).optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});
