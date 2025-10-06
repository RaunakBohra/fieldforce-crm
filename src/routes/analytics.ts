import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logger, getLogContext } from '../utils/logger';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Analytics Routes
 * Handles analytics endpoints for charts and data visualization
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const analytics = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All analytics routes require authentication
analytics.use('/*', authMiddleware);

/**
 * GET /api/analytics/visit-trends
 * Get visit trends over time (last 30 days, grouped by day)
 * Query params: startDate, endDate (optional)
 */
analytics.get('/visit-trends', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get visit trends request', getLogContext(c));

    // Parse date range from query params
    const startDateParam = c.req.query('startDate');
    const endDateParam = c.req.query('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter by user role
    const visitFilter = user.role === 'FIELD_REP' ? { fieldRepId: user.userId } : {};

    // Fetch all visits in date range
    const visits = await deps.prisma.visit.findMany({
      where: {
        ...visitFilter,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const visitsMap = new Map<string, { date: string; total: number; completed: number; cancelled: number }>();

    visits.forEach((visit) => {
      const dateKey = visit.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!visitsMap.has(dateKey)) {
        visitsMap.set(dateKey, {
          date: dateKey,
          total: 0,
          completed: 0,
          cancelled: 0,
        });
      }

      const dayData = visitsMap.get(dateKey)!;
      dayData.total += 1;

      if (visit.status === 'COMPLETED') {
        dayData.completed += 1;
      } else if (visit.status === 'CANCELLED') {
        dayData.cancelled += 1;
      }
    });

    // Fill in missing dates with zero values
    const result: Array<{ date: string; total: number; completed: number; cancelled: number }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push(
        visitsMap.get(dateKey) || {
          date: dateKey,
          total: 0,
          completed: 0,
          cancelled: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info('Visit trends retrieved successfully', {
      ...getLogContext(c),
      count: result.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return c.json({
      success: true,
      data: {
        trends: result,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Get visit trends error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch visit trends',
    }, 500);
  }
});

/**
 * GET /api/analytics/orders-revenue
 * Get orders and revenue trends over time (last 30 days, grouped by day)
 * Query params: startDate, endDate (optional)
 */
analytics.get('/orders-revenue', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get orders revenue request', getLogContext(c));

    // Parse date range from query params
    const startDateParam = c.req.query('startDate');
    const endDateParam = c.req.query('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter by user role
    const orderFilter = user.role === 'FIELD_REP' ? { createdById: user.userId } : {};

    // Fetch all orders in date range
    const orders = await deps.prisma.order.findMany({
      where: {
        ...orderFilter,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        createdAt: true,
        status: true,
        totalAmount: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    // Group by date
    const ordersMap = new Map<string, {
      date: string;
      totalOrders: number;
      deliveredOrders: number;
      totalRevenue: number;
      deliveredRevenue: number;
    }>();

    orders.forEach((order) => {
      const dateKey = order.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD

      if (!ordersMap.has(dateKey)) {
        ordersMap.set(dateKey, {
          date: dateKey,
          totalOrders: 0,
          deliveredOrders: 0,
          totalRevenue: 0,
          deliveredRevenue: 0,
        });
      }

      const dayData = ordersMap.get(dateKey)!;
      dayData.totalOrders += 1;
      dayData.totalRevenue += Number(order.totalAmount);

      if (order.status === 'DELIVERED') {
        dayData.deliveredOrders += 1;
        dayData.deliveredRevenue += Number(order.totalAmount);
      }
    });

    // Fill in missing dates with zero values
    const result: Array<{
      date: string;
      totalOrders: number;
      deliveredOrders: number;
      totalRevenue: number;
      deliveredRevenue: number;
    }> = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split('T')[0];
      result.push(
        ordersMap.get(dateKey) || {
          date: dateKey,
          totalOrders: 0,
          deliveredOrders: 0,
          totalRevenue: 0,
          deliveredRevenue: 0,
        }
      );
      currentDate.setDate(currentDate.getDate() + 1);
    }

    logger.info('Orders revenue retrieved successfully', {
      ...getLogContext(c),
      count: result.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return c.json({
      success: true,
      data: {
        trends: result,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Get orders revenue error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch orders revenue',
    }, 500);
  }
});

/**
 * GET /api/analytics/payment-modes
 * Get payment modes breakdown with percentages
 * Query params: startDate, endDate (optional)
 */
analytics.get('/payment-modes', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get payment modes request', getLogContext(c));

    // Parse date range from query params
    const startDateParam = c.req.query('startDate');
    const endDateParam = c.req.query('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Filter by user role
    const paymentFilter = user.role === 'FIELD_REP' ? { recordedById: user.userId } : {};

    // Fetch all payments in date range
    const payments = await deps.prisma.payment.findMany({
      where: {
        ...paymentFilter,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      select: {
        paymentMode: true,
        amount: true,
      },
    });

    // Group by payment mode
    const paymentModesMap = new Map<string, { mode: string; total: number; count: number }>();
    let grandTotal = 0;

    payments.forEach((payment) => {
      const mode = payment.paymentMode;
      const amount = Number(payment.amount);

      if (!paymentModesMap.has(mode)) {
        paymentModesMap.set(mode, {
          mode,
          total: 0,
          count: 0,
        });
      }

      const modeData = paymentModesMap.get(mode)!;
      modeData.total += amount;
      modeData.count += 1;
      grandTotal += amount;
    });

    // Calculate percentages
    const result = Array.from(paymentModesMap.values()).map((item) => ({
      mode: item.mode,
      total: item.total,
      count: item.count,
      percentage: grandTotal > 0 ? (item.total / grandTotal) * 100 : 0,
    })).sort((a, b) => b.total - a.total);

    logger.info('Payment modes retrieved successfully', {
      ...getLogContext(c),
      count: result.length,
      grandTotal,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    });

    return c.json({
      success: true,
      data: {
        paymentModes: result,
        grandTotal,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
  } catch (error: any) {
    logger.error('Get payment modes error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch payment modes',
    }, 500);
  }
});

export default analytics;
