import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { requireManager } from '../middleware/rbac';
import { rateLimiter } from '../middleware/rateLimiter';
import { logger, getLogContext } from '../utils/logger';
import { memoryCache } from '../utils/memoryCache';
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

// Rate limiting for analytics endpoints (100 requests/minute per user)
analytics.use('/*', rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many analytics requests, please try again in a minute',
}));

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

/**
 * GET /api/analytics/territory-performance
 * Get performance metrics grouped by territory
 * Returns: territories with order count, revenue, visit count, contact count
 * Query params: startDate, endDate (optional)
 * Authorization: ADMIN or MANAGER only
 */
analytics.get('/territory-performance', requireManager, async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get territory performance request', getLogContext(c));

    // Parse date range from query params
    const startDateParam = c.req.query('startDate');
    const endDateParam = c.req.query('endDate');

    const endDate = endDateParam ? new Date(endDateParam) : new Date();
    const startDate = startDateParam ? new Date(startDateParam) : new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Create cache key based on date range
    const cacheKey = `territory-performance:${startDate.toISOString()}:${endDate.toISOString()}`;

    // Tier 1: Check in-memory cache (< 1ms, 1-minute TTL)
    const memCached = memoryCache.get(cacheKey);
    if (memCached) {
      logger.info('Territory performance served from memory cache', getLogContext(c));
      return c.json({
        success: true,
        data: memCached,
        cached: true,
        cacheSource: 'memory',
      });
    }

    // Tier 2: Check KV cache (~10-50ms, 5-minute TTL)
    const kvCached = await deps.cache.get<any>(cacheKey);
    if (kvCached) {
      logger.info('Territory performance served from KV cache', getLogContext(c));
      // Store in memory cache for next request
      memoryCache.set(cacheKey, kvCached, 60); // 1 minute
      return c.json({
        success: true,
        data: kvCached,
        cached: true,
        cacheSource: 'kv',
      });
    }

    // Cache miss: Query database
    logger.info('Territory performance cache miss, querying database', getLogContext(c));

    // Optimized: Use database aggregation to avoid N+1 queries
    // Execute all queries in parallel using Promise.all
    const [territories, contactCounts, orderAggregates, visitCounts] = await Promise.all([
      // 1. Get all active territories
      deps.prisma.territory.findMany({
        where: { isActive: true },
        select: { id: true, name: true, code: true, type: true },
        orderBy: { name: 'asc' },
      }),

      // 2. Get contact counts per territory (single query with GROUP BY)
      deps.prisma.contact.groupBy({
        by: ['territoryId'],
        where: { isActive: true, territoryId: { not: null } },
        _count: { id: true },
      }),

      // 3. Get order aggregates per territory (single query with GROUP BY)
      deps.prisma.order.groupBy({
        by: ['contactId'],
        where: {
          contact: { territoryId: { not: null } },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
        _sum: { totalAmount: true },
      }).then(async (orderGroups) => {
        // Get contactId -> territoryId mapping
        const contactIds = orderGroups.map(g => g.contactId);
        const contacts = await deps.prisma.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, territoryId: true },
        });
        const contactToTerritory = new Map(contacts.map(c => [c.id, c.territoryId]));

        // Group by territory
        const territoryMap = new Map<string, { orderCount: number; totalRevenue: number; deliveredOrders: number }>();

        for (const group of orderGroups) {
          const territoryId = contactToTerritory.get(group.contactId);
          if (!territoryId) continue;

          const existing = territoryMap.get(territoryId) || { orderCount: 0, totalRevenue: 0, deliveredOrders: 0 };
          existing.orderCount += (group._count?.id || group._count || 0);
          existing.totalRevenue += Number(group._sum?.totalAmount || 0);
          territoryMap.set(territoryId, existing);
        }

        // Get delivered order counts
        const deliveredCounts = await deps.prisma.order.groupBy({
          by: ['contactId'],
          where: {
            contact: { territoryId: { not: null } },
            createdAt: { gte: startDate, lte: endDate },
            status: 'DELIVERED',
          },
          _count: { id: true },
        });

        for (const group of deliveredCounts) {
          const territoryId = contactToTerritory.get(group.contactId);
          if (!territoryId) continue;
          const existing = territoryMap.get(territoryId);
          if (existing) {
            existing.deliveredOrders += (group._count?.id || group._count || 0);
          }
        }

        return territoryMap;
      }),

      // 4. Get visit counts per territory (single query with GROUP BY)
      deps.prisma.visit.groupBy({
        by: ['contactId'],
        where: {
          contact: { territoryId: { not: null } },
          createdAt: { gte: startDate, lte: endDate },
        },
        _count: { id: true },
      }).then(async (visitGroups) => {
        // Get contactId -> territoryId mapping
        const contactIds = visitGroups.map(g => g.contactId);
        const contacts = await deps.prisma.contact.findMany({
          where: { id: { in: contactIds } },
          select: { id: true, territoryId: true },
        });
        const contactToTerritory = new Map(contacts.map(c => [c.id, c.territoryId]));

        // Group by territory
        const territoryMap = new Map<string, number>();
        for (const group of visitGroups) {
          const territoryId = contactToTerritory.get(group.contactId);
          if (!territoryId) continue;
          territoryMap.set(territoryId, (territoryMap.get(territoryId) || 0) + (group._count?.id || group._count || 0));
        }
        return territoryMap;
      }),
    ]);

    // Build performance data from aggregated results
    const contactCountMap = new Map(contactCounts.map(c => [c.territoryId!, c._count.id]));

    const performanceData = territories.map(territory => ({
      territoryId: territory.id,
      territoryName: territory.name,
      territoryCode: territory.code,
      territoryType: territory.type,
      contactCount: contactCountMap.get(territory.id) || 0,
      orderCount: orderAggregates.get(territory.id)?.orderCount || 0,
      deliveredOrders: orderAggregates.get(territory.id)?.deliveredOrders || 0,
      totalRevenue: orderAggregates.get(territory.id)?.totalRevenue || 0,
      visitCount: visitCounts.get(territory.id) || 0,
    }));

    // Sort by total revenue (descending)
    performanceData.sort((a, b) => b.totalRevenue - a.totalRevenue);

    // Calculate totals
    const totals = performanceData.reduce(
      (acc, item) => ({
        contacts: acc.contacts + item.contactCount,
        orders: acc.orders + item.orderCount,
        revenue: acc.revenue + item.totalRevenue,
        visits: acc.visits + item.visitCount,
      }),
      { contacts: 0, orders: 0, revenue: 0, visits: 0 }
    );

    // Prepare response data
    const responseData = {
      territories: performanceData,
      totals,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };

    // Store in both cache tiers
    memoryCache.set(cacheKey, responseData, 60); // Memory: 1 minute TTL
    await deps.cache.set(cacheKey, responseData, { ttl: 300 }); // KV: 5 minutes TTL

    logger.info('Territory performance retrieved successfully', {
      ...getLogContext(c),
      territoryCount: performanceData.length,
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      cached: false,
    });

    return c.json({
      success: true,
      data: responseData,
      cached: false,
    });
  } catch (error: any) {
    logger.error('Get territory performance error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch territory performance',
    }, 500);
  }
});

export default analytics;
