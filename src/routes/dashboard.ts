import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logger, getLogContext } from '../utils/logger';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Dashboard Routes
 * Handles dashboard stats, recent activity, and analytics endpoints
 * Follows hexagonal architecture - routes only handle HTTP, business logic in service
 */

const dashboard = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All dashboard routes require authentication
dashboard.use('/*', authMiddleware);

/**
 * GET /api/dashboard/stats
 * Get dashboard statistics (visits, orders, payments, revenue)
 */
dashboard.get('/stats', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get dashboard stats request', getLogContext(c));

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - now.getDay());
    startOfWeek.setHours(0, 0, 0, 0);
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Filter by user role (field reps see only their data)
    const visitFilter = user.role === 'FIELD_REP' ? { fieldRepId: user.userId } : {};
    const orderFilter = user.role === 'FIELD_REP' ? { createdById: user.userId } : {};
    const paymentFilter = user.role === 'FIELD_REP' ? { recordedById: user.userId } : {};

    // Optimized: Run all DB queries in parallel
    const [
      visitStats,
      orderStats,
      revenueStats,
      paymentStats,
    ] = await Promise.all([
      // Visit counts by date range (3 counts combined)
      Promise.all([
        deps.prisma.visit.count({
          where: { ...visitFilter, createdAt: { gte: startOfToday } },
        }),
        deps.prisma.visit.count({
          where: { ...visitFilter, createdAt: { gte: startOfWeek } },
        }),
        deps.prisma.visit.count({
          where: { ...visitFilter, createdAt: { gte: startOfMonth } },
        }),
      ]),
      // Order counts by status (4 counts combined)
      Promise.all([
        deps.prisma.order.count({ where: { ...orderFilter, status: 'PENDING' } }),
        deps.prisma.order.count({ where: { ...orderFilter, status: 'APPROVED' } }),
        deps.prisma.order.count({ where: { ...orderFilter, status: 'DELIVERED' } }),
        deps.prisma.order.count({ where: { ...orderFilter, status: 'CANCELLED' } }),
      ]),
      // Revenue from delivered orders
      deps.prisma.order.aggregate({
        where: { ...orderFilter, status: 'DELIVERED' },
        _sum: { totalAmount: true },
      }),
      // Payment stats (collected and outstanding)
      Promise.all([
        deps.prisma.payment.aggregate({
          where: paymentFilter,
          _sum: { amount: true },
          _count: true,
        }),
        deps.prisma.order.aggregate({
          where: { ...orderFilter, paymentStatus: { in: ['UNPAID', 'PARTIAL'] } },
          _sum: { totalAmount: true },
        }),
      ]),
    ]);

    const [todayVisits, weekVisits, monthVisits] = visitStats;
    const [pendingOrders, approvedOrders, deliveredOrders, cancelledOrders] = orderStats;
    const totalOrders = pendingOrders + approvedOrders + deliveredOrders + cancelledOrders;
    const totalRevenue = revenueStats._sum.totalAmount || 0;
    const [totalPaid, outstandingPayments] = paymentStats;
    const totalCollected = totalPaid._sum?.amount || 0;
    const totalOutstanding = outstandingPayments._sum.totalAmount || 0;
    const totalPayments = totalPaid._count;

    logger.info('Dashboard stats retrieved successfully', {
      ...getLogContext(c),
      stats: { todayVisits, weekVisits, monthVisits, totalOrders, totalRevenue },
    });

    return c.json({
      success: true,
      data: {
        visits: {
          today: todayVisits,
          thisWeek: weekVisits,
          thisMonth: monthVisits,
        },
        orders: {
          total: totalOrders,
          pending: pendingOrders,
          approved: approvedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
        },
        revenue: {
          total: Number(totalRevenue),
          collected: Number(totalCollected),
          outstanding: Number(totalOutstanding),
        },
        payments: {
          total: totalPayments,
          collected: Number(totalCollected),
          outstanding: Number(totalOutstanding),
        },
      },
    });
  } catch (error: any) {
    logger.error('Get dashboard stats error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch dashboard stats',
    }, 500);
  }
});

/**
 * GET /api/dashboard/recent-activity
 * Get recent activity (visits, orders, payments)
 */
dashboard.get('/recent-activity', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Get recent activity request', getLogContext(c));

    // Filter by user role
    const visitFilter = user.role === 'FIELD_REP' ? { fieldRepId: user.userId } : {};
    const orderFilter = user.role === 'FIELD_REP' ? { createdById: user.userId } : {};
    const paymentFilter = user.role === 'FIELD_REP' ? { recordedById: user.userId } : {};

    // Optimized: Fetch fewer items and less data per item (7 instead of 15)
    const [recentVisits, recentOrders, recentPayments] = await Promise.all([
      deps.prisma.visit.findMany({
        where: visitFilter,
        take: 3,  // Reduced from 5
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          status: true,
          createdAt: true,
          contact: {
            select: {
              name: true,
            },
          },
        },
      }),
      deps.prisma.order.findMany({
        where: orderFilter,
        take: 3,  // Reduced from 5
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          orderNumber: true,
          status: true,
          totalAmount: true,
          createdAt: true,
          contact: {
            select: {
              name: true,
            },
          },
        },
      }),
      deps.prisma.payment.findMany({
        where: paymentFilter,
        take: 3,  // Reduced from 5
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          amount: true,
          paymentMode: true,
          createdAt: true,
          order: {
            select: {
              orderNumber: true,
              contact: {
                select: {
                  name: true,
                },
              },
            },
          },
          contact: {
            select: {
              name: true,
            },
          },
        },
      }),
    ]);

    // Merge and sort all activities
    const activities = [
      ...recentVisits.map(v => ({
        id: v.id,
        type: 'visit' as const,
        title: `Visit to ${v.contact?.name || 'Unknown'}`,
        status: v.status,
        timestamp: v.createdAt,
      })),
      ...recentOrders.map(o => ({
        id: o.id,
        type: 'order' as const,
        title: `Order ${o.orderNumber} for ${o.contact?.name || 'Unknown'}`,
        status: o.status,
        amount: Number(o.totalAmount),
        timestamp: o.createdAt,
      })),
      ...recentPayments.map(p => ({
        id: p.id,
        type: 'payment' as const,
        title: `Payment for Order ${p.order?.orderNumber || p.contact?.name || 'Unknown'}`,
        amount: Number(p.amount),
        paymentMode: p.paymentMode,
        contactName: p.order?.contact?.name || p.contact?.name || 'Unknown',
        timestamp: p.createdAt,
      })),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
     .slice(0, 10);  // Reduced from 20 to 10 for faster rendering

    logger.info('Recent activity retrieved successfully', {
      ...getLogContext(c),
      count: activities.length,
    });

    return c.json({
      success: true,
      data: {
        activities,
      },
    });
  } catch (error: any) {
    logger.error('Get recent activity error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch recent activity',
    }, 500);
  }
});

/**
 * GET /api/dashboard/top-performers
 * Get top performing sales reps (admin/manager only)
 */
dashboard.get('/top-performers', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    // Only admins and managers can see top performers
    if (user.role === 'FIELD_REP') {
      return c.json({
        success: false,
        error: 'Unauthorized: Only admins and managers can view top performers',
      }, 403);
    }

    logger.info('Get top performers request', getLogContext(c));

    // Get current month date range
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Aggregate orders by field rep
    const topPerformers = await deps.prisma.order.groupBy({
      by: ['createdById'],
      where: {
        status: 'DELIVERED',
        createdAt: { gte: startOfMonth },
      },
      _sum: {
        totalAmount: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: {
          totalAmount: 'desc',
        },
      },
      take: 10,
    });

    // Fetch user details
    const userIds = topPerformers.map(p => p.createdById);
    const users = await deps.prisma.user.findMany({
      where: {
        id: { in: userIds },
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    const usersMap = new Map(users.map(u => [u.id, u]));

    const performersWithDetails = topPerformers.map(p => ({
      userId: p.createdById,
      user: usersMap.get(p.createdById) || null,
      totalRevenue: Number(p._sum.totalAmount || 0),
      totalOrders: p._count.id,
    })).filter(p => p.user !== null);

    logger.info('Top performers retrieved successfully', {
      ...getLogContext(c),
      count: performersWithDetails.length,
    });

    return c.json({
      success: true,
      data: {
        performers: performersWithDetails,
        period: 'This Month',
        startDate: startOfMonth,
      },
    });
  } catch (error: any) {
    logger.error('Get top performers error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to fetch top performers',
    }, 500);
  }
});

export default dashboard;
