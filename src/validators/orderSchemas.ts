import { z } from 'zod';

/**
 * Order Item Schema
 */
export const orderItemSchema = z.object({
  productId: z.string().cuid('Invalid product ID'),
  quantity: z.number().int().positive('Quantity must be positive'),
  unitPrice: z.number().positive('Unit price must be positive'),
});

/**
 * Create Order Schema
 */
export const createOrderSchema = z.object({
  contactId: z.string().cuid('Invalid contact ID'),
  items: z.array(orderItemSchema).min(1, 'Order must have at least one item'),
  deliveryAddress: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryState: z.string().optional(),
  deliveryPincode: z.string().optional(),
  expectedDeliveryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional(),
});

/**
 * Update Order Status Schema
 */
export const updateOrderStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REJECTED',
  ]),
  actualDeliveryDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  notes: z.string().optional(),
});

/**
 * Order Query Schema
 */
export const orderQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  status: z.enum([
    'PENDING',
    'APPROVED',
    'PROCESSING',
    'SHIPPED',
    'DELIVERED',
    'CANCELLED',
    'REJECTED',
  ]).optional(),
  contactId: z.string().optional(),
  startDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
  endDate: z.string().optional().transform(val => val ? new Date(val) : undefined),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>;
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>;
export type OrderQueryInput = z.infer<typeof orderQuerySchema>;
