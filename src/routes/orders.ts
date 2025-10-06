import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { ZodError } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  orderQuerySchema,
} from '../validators/orderSchemas';
import type { Bindings } from '../index';
import { getOrSetCache, getUserStatsCacheKey } from '../utils/cache';
import type { Dependencies } from '../config/dependencies';

/**
 * Order Routes
 * Handles all order management endpoints
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const orders = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All order routes require authentication
orders.use('/*', authMiddleware);

/**
 * GET /api/orders
 * Get all orders with pagination and filtering
 */
orders.get('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    // Parse and validate query parameters
    const query = orderQuerySchema.parse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      status: c.req.query('status'),
      contactId: c.req.query('contactId'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
    });

    logger.info('Get orders request', {
      ...getLogContext(c),
      query,
    });

    // Build where clause
    const where: {
      createdById: string;
      status?: string;
      contactId?: string;
      createdAt?: {
        gte?: string;
        lte?: string;
      };
    } = {
      createdById: user.userId, // Only show user's own orders
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.contactId) {
      where.contactId = query.contactId;
    }

    if (query.startDate || query.endDate) {
      where.createdAt = {};
      if (query.startDate) {
        where.createdAt.gte = new Date(query.startDate).toISOString();
      }
      if (query.endDate) {
        where.createdAt.lte = new Date(query.endDate).toISOString();
      }
    }

    // Calculate pagination
    const skip = (query.page - 1) * query.limit;

    // Get orders
    const [data, total] = await Promise.all([
      deps.prisma.order.findMany({
        where: where as any,
        skip,
        take: query.limit,
        include: {
          contact: {
            select: {
              id: true,
              name: true,
              phone: true,
              email: true,
              contactType: true,
            },
          },
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      deps.prisma.order.count({ where: where as any }),
    ]);

    return c.json({
      success: true,
      data: {
        orders: data,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    }, 200);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Invalid query parameters',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Get orders failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/orders/stats
 * Get order statistics for the current user
 */
orders.get('/stats', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get order stats request', getLogContext(c));

    // Use cache with 5 minute TTL
    const cacheKey = getUserStatsCacheKey('orders', user.userId);
    const stats = await getOrSetCache(
      deps.kv,
      cacheKey,
      async () => {
        const [
          totalOrders,
          pendingOrders,
          approvedOrders,
          deliveredOrders,
          totalRevenue,
        ] = await Promise.all([
          deps.prisma.order.count({
            where: { createdById: user.userId },
          }),
          deps.prisma.order.count({
            where: { createdById: user.userId, status: 'PENDING' },
          }),
          deps.prisma.order.count({
            where: { createdById: user.userId, status: 'APPROVED' },
          }),
          deps.prisma.order.count({
            where: { createdById: user.userId, status: 'DELIVERED' },
          }),
          deps.prisma.order.aggregate({
            where: { createdById: user.userId },
            _sum: { totalAmount: true },
          }),
        ]);

        return {
          totalOrders,
          pendingOrders,
          approvedOrders,
          deliveredOrders,
          totalRevenue: totalRevenue._sum.totalAmount || 0,
        };
      },
      { ttl: 300 } // 5 minutes
    );

    return c.json({
      success: true,
      data: stats,
    }, 200);
  } catch (error: unknown) {
    logger.error('Get order stats failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/orders/:id
 * Get a single order by ID
 */
orders.get('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const orderId = c.req.param('id');

  try {
    logger.info('Get order by ID request', {
      ...getLogContext(c),
      orderId,
    });

    const order = await deps.prisma.order.findFirst({
      where: {
        id: orderId,
        createdById: user.userId, // Only allow access to user's own orders
      },
      include: {
        contact: true,
        items: {
          include: {
            product: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    return c.json({ success: true, data: order }, 200);
  } catch (error: unknown) {
    logger.error('Get order by ID failed', error, {
      ...getLogContext(c),
      orderId,
    });
    throw error;
  }
});

/**
 * POST /api/orders
 * Create a new order
 */
orders.post('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const input = createOrderSchema.parse(body);

    logger.info('Create order request', {
      ...getLogContext(c),
      contactId: input.contactId,
      itemCount: input.items.length,
    });

    // Calculate total amount
    const totalAmount = input.items.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0
    );

    // Generate order number
    const orderNumber = `ORD-${Date.now()}-${user.userId.slice(-4).toUpperCase()}`;

    // Create order with items in a transaction
    const order = await deps.prisma.order.create({
      data: {
        orderNumber,
        contactId: input.contactId,
        createdById: user.userId,
        totalAmount,
        deliveryAddress: input.deliveryAddress,
        deliveryCity: input.deliveryCity,
        deliveryState: input.deliveryState,
        deliveryPincode: input.deliveryPincode,
        expectedDeliveryDate: input.expectedDeliveryDate,
        notes: input.notes,
        items: {
          create: input.items.map(item => ({
            productId: item.productId,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.quantity * item.unitPrice,
          })),
        },
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        contact: true,
      },
    });

    logger.info('Order created successfully', {
      orderId: order.id,
      orderNumber: order.orderNumber,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Order created successfully',
        data: order,
      },
      201
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Create order failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * PUT /api/orders/:id/status
 * Update order status
 */
orders.put('/:id/status', requireManager, async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const orderId = c.req.param('id');

  try {
    const body = await c.req.json();
    const input = updateOrderStatusSchema.parse(body);

    logger.info('Update order status request', {
      ...getLogContext(c),
      orderId,
      newStatus: input.status,
    });

    // Check if order exists and belongs to user
    const existingOrder = await deps.prisma.order.findFirst({
      where: {
        id: orderId,
        createdById: user.userId,
      },
    });

    if (!existingOrder) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    // Update order
    const order = await deps.prisma.order.update({
      where: { id: orderId },
      data: {
        status: input.status,
        actualDeliveryDate: input.actualDeliveryDate,
        notes: input.notes ? `${existingOrder.notes || ''}\n${input.notes}`.trim() : existingOrder.notes,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        contact: true,
      },
    });

    logger.info('Order status updated successfully', {
      orderId,
      newStatus: input.status,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Order status updated successfully',
        data: order,
      },
      200
    );
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json(
        {
          success: false,
          error: error.errors[0]?.message || 'Validation failed',
          details: error.errors,
        },
        400
      );
    }

    logger.error('Update order status failed', error, {
      ...getLogContext(c),
      orderId,
    });
    throw error;
  }
});

/**
 * DELETE /api/orders/:id
 * Cancel an order (soft delete by setting status to CANCELLED)
 */
orders.delete('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const orderId = c.req.param('id');

  try {
    logger.info('Cancel order request', {
      ...getLogContext(c),
      orderId,
    });

    // Check if order exists and belongs to user
    const existingOrder = await deps.prisma.order.findFirst({
      where: {
        id: orderId,
        createdById: user.userId,
      },
    });

    if (!existingOrder) {
      return c.json({ success: false, error: 'Order not found' }, 404);
    }

    // Only allow cancellation of PENDING or APPROVED orders
    if (!['PENDING', 'APPROVED'].includes(existingOrder.status)) {
      return c.json(
        {
          success: false,
          error: 'Only pending or approved orders can be cancelled',
        },
        400
      );
    }

    // Update status to CANCELLED
    await deps.prisma.order.update({
      where: { id: orderId },
      data: { status: 'CANCELLED' },
    });

    logger.info('Order cancelled successfully', {
      orderId,
      userId: user.userId,
    });

    return c.json(
      {
        success: true,
        message: 'Order cancelled successfully',
      },
      200
    );
  } catch (error: unknown) {
    logger.error('Cancel order failed', error, {
      ...getLogContext(c),
      orderId,
    });
    throw error;
  }
});

export default orders;
