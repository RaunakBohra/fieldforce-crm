import { z } from 'zod';

/**
 * Zod validation schemas for authentication
 * Ensures type safety and comprehensive input validation
 */

// Password validation regex
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/;

// Indian phone number regex (10 digits starting with 6-9)
const indianPhoneRegex = /^[6-9]\d{9}$/;

/**
 * Signup request validation schema
 */
export const signupSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format')
    .min(5, 'Email must be at least 5 characters')
    .max(255, 'Email must not exceed 255 characters')
    .trim()
    .toLowerCase(),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must not exceed 128 characters')
    .regex(
      passwordRegex,
      'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)'
    ),

  name: z
    .string({
      required_error: 'Name is required',
      invalid_type_error: 'Name must be a string',
    })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .regex(/^[a-zA-Z\s]+$/, 'Name must contain only letters and spaces'),

  phone: z
    .string()
    .regex(indianPhoneRegex, 'Phone number must be 10 digits starting with 6-9')
    .optional()
    .or(z.literal('')),
});

/**
 * Login request validation schema
 */
export const loginSchema = z.object({
  email: z
    .string({
      required_error: 'Email is required',
      invalid_type_error: 'Email must be a string',
    })
    .email('Invalid email format')
    .trim()
    .toLowerCase(),

  password: z
    .string({
      required_error: 'Password is required',
      invalid_type_error: 'Password must be a string',
    })
    .min(1, 'Password is required'),
});

/**
 * TypeScript types inferred from Zod schemas
 * These provide compile-time type safety
 */
export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
