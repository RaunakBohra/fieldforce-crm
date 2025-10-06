import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { ZodError, z } from 'zod';
import { logger, getLogContext } from '../utils/logger';
import { getOrSetCache, getUserStatsCacheKey } from '../utils/cache';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Payment Routes
 * Handles all payment recording and tracking endpoints
 */

const payments = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All payment routes require authentication
payments.use('/*', authMiddleware);

// Payment creation schema
const createPaymentSchema = z.object({
  orderId: z.string().optional(),
  contactId: z.string().optional(),
  amount: z.number().positive(),
  paymentMode: z.enum(['CASH', 'UPI', 'NEFT', 'RTGS', 'CHEQUE', 'CARD', 'OTHER']),
  paymentDate: z.string().datetime().optional(),
  referenceNumber: z.string().optional(),
  notes: z.string().optional(),
});

// Payment query schema
const paymentQuerySchema = z.object({
  page: z.string().optional().transform(val => val ? parseInt(val) : 1),
  limit: z.string().optional().transform(val => val ? parseInt(val) : 20),
  orderId: z.string().optional(),
  contactId: z.string().optional(),
  paymentMode: z.string().optional(),
  status: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

/**
 * POST /api/payments
 * Create a new payment record
 */
payments.post('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const data = createPaymentSchema.parse(body);

    logger.info('Create payment request', {
      ...getLogContext(c),
      orderId: data.orderId,
      amount: data.amount,
    });

    // Generate payment number
    const paymentCount = await deps.prisma.payment.count();
    const paymentNumber = `PAY-${String(paymentCount + 1).padStart(6, '0')}`;

    // Validate order exists if orderId provided
    let order = null;
    if (data.orderId) {
      order = await deps.prisma.order.findFirst({
        where: { id: data.orderId, createdById: user.userId },
      });

      if (!order) {
        return c.json({ success: false, error: 'Order not found' }, 404);
      }
    }

    // Create payment
    const payment = await deps.prisma.payment.create({
      data: {
        paymentNumber,
        orderId: data.orderId,
        contactId: data.contactId,
        amount: data.amount,
        paymentMode: data.paymentMode,
        paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
        referenceNumber: data.referenceNumber,
        notes: data.notes,
        recordedById: user.userId,
        status: 'COMPLETED',
      },
      include: {
        order: {
          include: {
            contact: { select: { name: true } },
          },
        },
      },
    });

    // Update order payment status if linked to order
    if (order) {
      const payments = await deps.prisma.payment.findMany({
        where: { orderId: data.orderId, status: 'COMPLETED' },
      });

      const totalPaid = payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      let paymentStatus: 'UNPAID' | 'PARTIAL' | 'PAID' = 'UNPAID';
      if (totalPaid >= parseFloat(order.totalAmount.toString())) {
        paymentStatus = 'PAID';
      } else if (totalPaid > 0) {
        paymentStatus = 'PARTIAL';
      }

      await deps.prisma.order.update({
        where: { id: data.orderId },
        data: { paymentStatus },
      });
    }

    logger.info('Payment recorded successfully', {
      paymentId: payment.id,
      paymentNumber: payment.paymentNumber,
      userId: user.userId,
    });

    return c.json({
      success: true,
      message: 'Payment recorded successfully',
      data: payment,
    }, 201);
  } catch (error: unknown) {
    if (error instanceof ZodError) {
      return c.json({
        success: false,
        error: error.errors[0]?.message || 'Validation failed',
        details: error.errors,
      }, 400);
    }

    logger.error('Create payment failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/payments
 * Get all payments with filtering
 */
payments.get('/', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const query = paymentQuerySchema.parse({
      page: c.req.query('page'),
      limit: c.req.query('limit'),
      orderId: c.req.query('orderId'),
      contactId: c.req.query('contactId'),
      paymentMode: c.req.query('paymentMode'),
      status: c.req.query('status'),
      startDate: c.req.query('startDate'),
      endDate: c.req.query('endDate'),
    });

    logger.info('Get payments request', { ...getLogContext(c), query });

    const where: {
      recordedById: string;
      orderId?: string;
      contactId?: string;
      paymentMode?: string;
      status?: string;
      paymentDate?: { gte?: Date; lte?: Date };
    } = {
      recordedById: user.userId,
    };

    if (query.orderId) where.orderId = query.orderId;
    if (query.contactId) where.contactId = query.contactId;
    if (query.paymentMode) where.paymentMode = query.paymentMode as any;
    if (query.status) where.status = query.status as any;

    if (query.startDate || query.endDate) {
      where.paymentDate = {};
      if (query.startDate) where.paymentDate.gte = new Date(query.startDate);
      if (query.endDate) where.paymentDate.lte = new Date(query.endDate);
    }

    const skip = (query.page - 1) * query.limit;

    const [data, total] = await Promise.all([
      deps.prisma.payment.findMany({
        where: where as any,
        skip,
        take: query.limit,
        include: {
          order: {
            include: {
              contact: { select: { name: true } },
            },
          },
        },
        orderBy: { paymentDate: 'desc' },
      }),
      deps.prisma.payment.count({ where: where as any }),
    ]);

    return c.json({
      success: true,
      data: {
        payments: data,
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
      return c.json({
        success: false,
        error: error.errors[0]?.message || 'Invalid query parameters',
        details: error.errors,
      }, 400);
    }

    logger.error('Get payments failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/payments/stats
 * Get payment statistics
 */
payments.get('/stats', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');

    logger.info('Get payment stats request', getLogContext(c));

    const cacheKey = getUserStatsCacheKey('payments', user.userId);
    const stats = await getOrSetCache(
      deps.kv,
      cacheKey,
      async () => {
        const where: {
          recordedById: string;
          status: string;
          paymentDate?: { gte?: Date; lte?: Date };
        } = {
          recordedById: user.userId,
          status: 'COMPLETED',
        };

        if (startDate || endDate) {
          where.paymentDate = {};
          if (startDate) where.paymentDate.gte = new Date(startDate);
          if (endDate) where.paymentDate.lte = new Date(endDate);
        }

        const [totalPayments, payments, outstandingOrders] = await Promise.all([
          deps.prisma.payment.count({ where: where as any }),
          deps.prisma.payment.findMany({
            where: where as any,
            select: { amount: true, paymentMode: true },
          }),
          deps.prisma.order.findMany({
            where: {
              createdById: user.userId,
              status: 'APPROVED',
              paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
            } as any,
            select: { totalAmount: true },
          }),
        ]);

        const totalAmount = payments.reduce(
          (sum, p) => sum + parseFloat(p.amount.toString()),
          0
        );

        const paymentModes = payments.reduce((acc, p) => {
          const mode = p.paymentMode;
          if (!acc[mode]) acc[mode] = 0;
          acc[mode] += parseFloat(p.amount.toString());
          return acc;
        }, {} as Record<string, number>);

        const totalOutstanding = outstandingOrders.reduce(
          (sum, o) => sum + parseFloat(o.totalAmount.toString()),
          0
        );

        return {
          totalPayments,
          totalAmount,
          averagePayment: totalPayments > 0 ? (totalAmount / totalPayments).toFixed(2) : 0,
          paymentModes,
          totalOutstanding,
          outstandingCount: outstandingOrders.length,
        };
      },
      { ttl: 300 }
    );

    return c.json({ success: true, data: stats }, 200);
  } catch (error: unknown) {
    logger.error('Get payment stats failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/payments/pending
 * Get pending payments (orders with unpaid/partial status)
 */
payments.get('/pending', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get pending payments request', getLogContext(c));

    const orders = await deps.prisma.order.findMany({
      where: {
        createdById: user.userId,
        status: 'APPROVED',
        paymentStatus: { in: ['UNPAID', 'PARTIAL'] },
      } as any,
      include: {
        contact: { select: { name: true, phone: true } },
        payments: {
          where: { status: 'COMPLETED' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const pendingOrders = orders.map(order => {
      const totalPaid = order.payments.reduce(
        (sum, p) => sum + parseFloat(p.amount.toString()),
        0
      );

      const totalAmount = parseFloat(order.totalAmount.toString());
      const pendingAmount = totalAmount - totalPaid;
      const daysPending = Math.floor(
        (new Date().getTime() - new Date(order.createdAt).getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        ...order,
        totalPaid,
        pendingAmount,
        daysPending,
      };
    });

    return c.json({
      success: true,
      data: { pendingOrders },
    }, 200);
  } catch (error: unknown) {
    logger.error('Get pending payments failed', error, getLogContext(c));
    throw error;
  }
});

/**
 * GET /api/payments/:id
 * Get a single payment by ID
 */
payments.get('/:id', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');
  const paymentId = c.req.param('id');

  try {
    logger.info('Get payment by ID request', {
      ...getLogContext(c),
      paymentId,
    });

    const payment = await deps.prisma.payment.findFirst({
      where: {
        id: paymentId,
        recordedById: user.userId,
      },
      include: {
        order: {
          include: {
            contact: true,
            items: true,
          },
        },
      },
    });

    if (!payment) {
      return c.json({ success: false, error: 'Payment not found' }, 404);
    }

    return c.json({ success: true, data: payment }, 200);
  } catch (error: unknown) {
    logger.error('Get payment by ID failed', error, {
      ...getLogContext(c),
      paymentId,
    });
    throw error;
  }
});

export default payments;
