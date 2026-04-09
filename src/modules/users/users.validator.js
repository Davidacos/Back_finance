import { z } from 'zod';

export const updateUserSchema = z.object({
  first_name: z.string().min(2, 'First name must be at least 2 characters').max(100).optional(),
  last_name: z.string().min(2, 'Last name must be at least 2 characters').max(100).optional(),
  currency_code: z.string().length(3, 'Currency code must be exactly 3 characters').optional(),
  language: z.string().length(2, 'Language code must be exactly 2 characters').optional(),
  monthly_budget: z.number().positive('Monthly budget must be positive').nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});
