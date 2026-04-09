import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string().email('Invalid email format').max(255),
  password: z.string().min(8, 'Password must be at least 8 characters').max(255),
  first_name: z.string().min(2, 'First name is required').max(100),
  last_name: z.string().min(2, 'Last name is required').max(100),
  currency_code: z.string().length(3, 'Currency code must be exactly 3 characters').default('USD'),
  language: z.string().length(2, 'Language code must be exactly 2 characters').default('en'),
  monthly_budget: z.number().positive('Monthly budget must be positive').optional(),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters').max(255),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});
