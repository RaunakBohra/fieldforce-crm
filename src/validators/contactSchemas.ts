import { z } from 'zod';

/**
 * Validation Schemas for Contact Management
 * Using Zod for runtime type validation
 */

// Phone validation (Indian format)
const indianPhoneRegex = /^[6-9]\d{9}$/;

// Pincode validation (Indian format)
const indianPincodeRegex = /^\d{6}$/;

/**
 * Contact Category Enum (Primary Classification)
 */
export const ContactCategoryEnum = z.enum([
  'DISTRIBUTION',  // B2B: Wholesalers, Retailers, etc.
  'MEDICAL',       // B2C: Doctors, Hospitals, etc.
]);

/**
 * Distribution Contact Types
 */
export const DistributionTypeEnum = z.enum([
  'SUPER_ADMIN',   // Top-level company administrators
  'SUB_SUPER',     // Regional/state managers (Nepal, etc.)
  'WHOLESALER',    // Bulk distributors
  'RETAILER',      // End retailers
]);

/**
 * Medical Contact Types
 */
export const MedicalTypeEnum = z.enum([
  'DOCTOR',        // For donations, ROI tracking
  'HOSPITAL',      // Institutional contacts
  'CLINIC',        // Smaller medical facilities
  'PHARMACIST',    // Pharmacy contacts
]);

/**
 * Combined Contact Type Enum (for backward compatibility)
 */
export const ContactTypeEnum = z.enum([
  'SUPER_ADMIN',
  'SUB_SUPER',
  'WHOLESALER',
  'RETAILER',
  'DOCTOR',
  'HOSPITAL',
  'CLINIC',
  'PHARMACIST',
  'OTHER',
]);

/**
 * Visit Frequency Enum
 */
export const VisitFrequencyEnum = z.enum([
  'DAILY',
  'WEEKLY',
  'BIWEEKLY',
  'MONTHLY',
  'QUARTERLY',
  'CUSTOM',
]);

/**
 * Create Contact Schema
 */
export const createContactSchema = z.object({
  // Primary Classification
  contactCategory: ContactCategoryEnum.default('MEDICAL'),

  // Basic Information (required)
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),

  contactType: ContactTypeEnum.default('DOCTOR'),

  // Optional Basic Information
  designation: z
    .string()
    .max(100, 'Designation must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  specialty: z
    .string()
    .max(100, 'Specialty must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Contact Details
  phone: z
    .string()
    .regex(indianPhoneRegex, 'Phone must be 10 digits starting with 6-9')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),

  alternatePhone: z
    .string()
    .regex(indianPhoneRegex, 'Alternate phone must be 10 digits starting with 6-9')
    .optional()
    .or(z.literal('')),

  // Address Information
  address: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'City must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  state: z
    .string()
    .max(100, 'State must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  pincode: z
    .string()
    .regex(indianPincodeRegex, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),

  // Professional Details (Medical)
  hospitalName: z
    .string()
    .max(200, 'Hospital name must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  clinicName: z
    .string()
    .max(200, 'Clinic name must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  licenseNumber: z
    .string()
    .max(50, 'License number must not exceed 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Distribution-specific fields
  territory: z
    .string()
    .max(100, 'Territory must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  territoryId: z
    .string()
    .cuid('Invalid territory ID')
    .optional()
    .or(z.literal('')),

  creditLimit: z
    .number()
    .positive('Credit limit must be positive')
    .optional(),

  paymentTerms: z
    .string()
    .max(200, 'Payment terms must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Visit Planning
  visitFrequency: VisitFrequencyEnum.default('MONTHLY'),

  preferredDay: z
    .string()
    .max(20, 'Preferred day must not exceed 20 characters')
    .optional()
    .or(z.literal('')),

  preferredTime: z
    .string()
    .max(20, 'Preferred time must not exceed 20 characters')
    .optional()
    .or(z.literal('')),

  nextVisitDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal('')),

  // Additional Information
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional()
    .default([]),

  isActive: z.boolean().optional().default(true),
});

/**
 * Update Contact Schema
 * All fields are optional for partial updates
 */
export const updateContactSchema = z.object({
  // Basic Information
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim()
    .optional(),

  contactType: ContactTypeEnum.optional(),

  designation: z
    .string()
    .max(100, 'Designation must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  specialty: z
    .string()
    .max(100, 'Specialty must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Contact Details
  phone: z
    .string()
    .regex(indianPhoneRegex, 'Phone must be 10 digits starting with 6-9')
    .optional()
    .or(z.literal('')),

  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim()
    .optional()
    .or(z.literal('')),

  alternatePhone: z
    .string()
    .regex(indianPhoneRegex, 'Alternate phone must be 10 digits starting with 6-9')
    .optional()
    .or(z.literal('')),

  // Address Information
  address: z
    .string()
    .max(500, 'Address must not exceed 500 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  city: z
    .string()
    .max(100, 'City must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  state: z
    .string()
    .max(100, 'State must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  pincode: z
    .string()
    .regex(indianPincodeRegex, 'Pincode must be 6 digits')
    .optional()
    .or(z.literal('')),

  // Professional Details (Medical)
  hospitalName: z
    .string()
    .max(200, 'Hospital name must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  clinicName: z
    .string()
    .max(200, 'Clinic name must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  licenseNumber: z
    .string()
    .max(50, 'License number must not exceed 50 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Distribution-specific fields
  territory: z
    .string()
    .max(100, 'Territory must not exceed 100 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  territoryId: z
    .string()
    .cuid('Invalid territory ID')
    .optional()
    .or(z.literal('')),

  creditLimit: z
    .number()
    .positive('Credit limit must be positive')
    .optional(),

  paymentTerms: z
    .string()
    .max(200, 'Payment terms must not exceed 200 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  // Visit Planning
  visitFrequency: VisitFrequencyEnum.optional(),

  preferredDay: z
    .string()
    .max(20, 'Preferred day must not exceed 20 characters')
    .optional()
    .or(z.literal('')),

  preferredTime: z
    .string()
    .max(20, 'Preferred time must not exceed 20 characters')
    .optional()
    .or(z.literal('')),

  lastVisitDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal('')),

  nextVisitDate: z
    .string()
    .datetime()
    .optional()
    .or(z.literal('')),

  // Additional Information
  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .trim()
    .optional()
    .or(z.literal('')),

  tags: z
    .array(z.string().max(50))
    .max(10, 'Maximum 10 tags allowed')
    .optional(),

  isActive: z.boolean().optional(),
});

/**
 * Contact Query Parameters Schema
 */
export const contactQuerySchema = z.object({
  // Pagination
  page: z
    .string()
    .regex(/^\d+$/, 'Page must be a number')
    .transform(Number)
    .refine((val) => val >= 1, 'Page must be at least 1')
    .optional()
    .default('1'),

  limit: z
    .string()
    .regex(/^\d+$/, 'Limit must be a number')
    .transform(Number)
    .refine((val) => val >= 1 && val <= 100, 'Limit must be between 1 and 100')
    .optional()
    .default('20'),

  // Filters
  contactCategory: ContactCategoryEnum.optional(),

  contactType: ContactTypeEnum.optional(),

  city: z.string().trim().optional(),

  territoryId: z.string().cuid('Invalid territory ID').optional(),

  isActive: z
    .string()
    .transform((val) => val === 'true')
    .optional(),

  // Search
  search: z
    .string()
    .max(100, 'Search query must not exceed 100 characters')
    .trim()
    .optional(),
});

/**
 * TypeScript types inferred from schemas
 */
export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
export type ContactQueryParams = z.infer<typeof contactQuerySchema>;
