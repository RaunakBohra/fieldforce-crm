import { z } from 'zod';

/**
 * Visit Validation Schemas
 * Zod schemas for validating visit-related requests
 */

// Visit Types from Prisma enum
export const VisitTypeEnum = z.enum([
  'FIELD_VISIT',
  'FOLLOW_UP',
  'EMERGENCY',
  'PLANNED',
  'COLD_CALL',
  'VIRTUAL',
  'EVENT',
]);

// Visit Status from Prisma enum
export const VisitStatusEnum = z.enum([
  'PLANNED',
  'IN_PROGRESS',
  'COMPLETED',
  'CANCELLED',
  'POSTPONED',
  'NO_SHOW',
]);

// Visit Outcome from Prisma enum
export const VisitOutcomeEnum = z.enum([
  'SUCCESSFUL',
  'PARTIAL',
  'UNSUCCESSFUL',
  'FOLLOW_UP_NEEDED',
  'ORDER_PLACED',
  'SAMPLE_GIVEN',
  'INFORMATION_ONLY',
]);

/**
 * Create Visit Schema
 */
export const createVisitSchema = z.object({
  // Required fields
  contactId: z.string().min(1, 'Contact ID is required'),
  visitDate: z.string().datetime().optional(), // ISO date string
  visitType: VisitTypeEnum.default('FIELD_VISIT'),
  status: VisitStatusEnum.default('COMPLETED'),

  // Optional GPS location
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationName: z.string().max(255).optional(),

  // Visit details
  purpose: z.string().max(500).optional(),
  notes: z.string().max(2000).optional(),
  outcome: VisitOutcomeEnum.default('SUCCESSFUL'),
  duration: z.number().int().min(1).max(1440).optional(), // Max 24 hours in minutes
  nextVisitDate: z.string().datetime().optional(),

  // Products and samples
  products: z.array(z.string()).default([]),
  samplesGiven: z.record(z.number()).optional(), // { "productName": quantity }
  marketingMaterials: z.array(z.string()).optional(),

  // Follow-up
  followUpRequired: z.boolean().default(false),
  followUpNotes: z.string().max(1000).optional(),

  // Attachments (R2 object keys)
  attachments: z.array(z.string()).default([]),
  photos: z.array(z.string()).default([]),
});

export type CreateVisitInput = z.infer<typeof createVisitSchema>;

/**
 * Update Visit Schema
 */
export const updateVisitSchema = createVisitSchema.partial();

export type UpdateVisitInput = z.infer<typeof updateVisitSchema>;

/**
 * Visit Query Schema (for filtering/pagination)
 */
export const visitQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val) : 1)),
  limit: z.string().optional().transform((val) => (val ? parseInt(val) : 20)),
  contactId: z.string().optional(),
  fieldRepId: z.string().optional(),
  visitType: VisitTypeEnum.optional(),
  status: VisitStatusEnum.optional(),
  outcome: VisitOutcomeEnum.optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  search: z.string().optional(), // Search in notes, purpose, location
});

export type VisitQueryInput = z.infer<typeof visitQuerySchema>;
