import { z } from 'zod';

export const updateUserSchema = z.object({
  first_name: z.string().min(1, 'First name must be at least 1 character').max(100).optional(),
  last_name: z.string().min(1, 'Last name must be at least 1 character').max(100).optional(),
  currency_code: z.string().length(3, 'Currency code must be exactly 3 characters').optional(),
  language: z.string().length(2, 'Language code must be exactly 2 characters').optional(),
  monthly_budget: z.number().nonnegative('Monthly budget must be zero or positive').nullable().optional(),
}).refine(data => Object.keys(data).length > 0, {
  message: "At least one field must be provided to update",
});
