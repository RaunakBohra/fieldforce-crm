import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { logger, getLogContext } from '../utils/logger';
import type { Bindings } from '../index';
import type { Dependencies } from '../config/dependencies';

/**
 * Reports Routes
 * Generate reports for visits, orders, and payments with filtering and export
 * Follows hexagonal architecture - routes only handle HTTP
 */

const reports = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: { userId: string; email: string; role: string } } }>();

// All report routes require authentication
reports.use('/*', authMiddleware);

/**
 * GET /api/reports/visits
 * Generate visits report with filters
 */
reports.get('/visits', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Generate visits report request', getLogContext(c));

    // Get query parameters
    const startDate = c.req.query('startDate'); // ISO date
    const endDate = c.req.query('endDate'); // ISO date
    const status = c.req.query('status'); // SCHEDULED, COMPLETED, CANCELLED
    const fieldRepId = c.req.query('fieldRepId');
    const contactId = c.req.query('contactId');
    const format = c.req.query('format') || 'json'; // json or csv

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (user.role === 'FIELD_REP') {
      where.fieldRepId = user.userId;
    } else if (fieldRepId) {
      where.fieldRepId = fieldRepId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Fetch visits with relations
    const visits = await deps.prisma.visit.findMany({
      where,
      include: {
        contact: {
          select: {
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        fieldRep: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Get summary stats
    const totalVisits = visits.length;
    const completed = visits.filter(v => v.status === 'COMPLETED').length;
    const scheduled = visits.filter(v => v.status === 'SCHEDULED').length;
    const cancelled = visits.filter(v => v.status === 'CANCELLED').length;

    logger.info('Visits report generated successfully', {
      ...getLogContext(c),
      totalVisits,
      completed,
      scheduled,
      cancelled,
    });

    // Return CSV if requested
    if (format === 'csv') {
      const csv = generateVisitsCSV(visits);
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="visits_report_${new Date().toISOString().split('T')[0]}.csv"`,
      });
    }

    // Return JSON
    return c.json({
      success: true,
      data: {
        visits,
        summary: {
          total: totalVisits,
          completed,
          scheduled,
          cancelled,
          completionRate: totalVisits > 0 ? Math.round((completed / totalVisits) * 100) : 0,
        },
        filters: {
          startDate,
          endDate,
          status,
          fieldRepId,
          contactId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Generate visits report error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to generate visits report',
    }, 500);
  }
});

/**
 * GET /api/reports/orders
 * Generate orders report with filters
 */
reports.get('/orders', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Generate orders report request', getLogContext(c));

    // Get query parameters
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const status = c.req.query('status'); // PENDING, APPROVED, DELIVERED, CANCELLED
    const paymentStatus = c.req.query('paymentStatus'); // UNPAID, PARTIAL, PAID
    const fieldRepId = c.req.query('fieldRepId');
    const contactId = c.req.query('contactId');
    const format = c.req.query('format') || 'json';

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (user.role === 'FIELD_REP') {
      where.createdById = user.userId;
    } else if (fieldRepId) {
      where.createdById = fieldRepId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdAt.lte = end;
      }
    }

    // Status filter
    if (status) {
      where.status = status;
    }

    // Payment status filter
    if (paymentStatus) {
      where.paymentStatus = paymentStatus;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Fetch orders with relations
    const orders = await deps.prisma.order.findMany({
      where,
      include: {
        contact: {
          select: {
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        createdBy: {
          select: {
            name: true,
            email: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                sku: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Calculate summary stats
    const totalOrders = orders.length;
    const totalRevenue = orders.reduce((sum, o) => sum + Number(o.totalAmount), 0);
    const pending = orders.filter(o => o.status === 'PENDING').length;
    const approved = orders.filter(o => o.status === 'APPROVED').length;
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    const cancelled = orders.filter(o => o.status === 'CANCELLED').length;
    const unpaidCount = orders.filter(o => o.paymentStatus === 'UNPAID').length;
    const partialCount = orders.filter(o => o.paymentStatus === 'PARTIAL').length;
    const paidCount = orders.filter(o => o.paymentStatus === 'PAID').length;

    logger.info('Orders report generated successfully', {
      ...getLogContext(c),
      totalOrders,
      totalRevenue,
    });

    // Return CSV if requested
    if (format === 'csv') {
      const csv = generateOrdersCSV(orders);
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="orders_report_${new Date().toISOString().split('T')[0]}.csv"`,
      });
    }

    // Return JSON
    return c.json({
      success: true,
      data: {
        orders,
        summary: {
          total: totalOrders,
          totalRevenue: Number(totalRevenue.toFixed(2)),
          averageOrderValue: totalOrders > 0 ? Number((totalRevenue / totalOrders).toFixed(2)) : 0,
          byStatus: {
            pending,
            approved,
            delivered,
            cancelled,
          },
          byPaymentStatus: {
            unpaid: unpaidCount,
            partial: partialCount,
            paid: paidCount,
          },
        },
        filters: {
          startDate,
          endDate,
          status,
          paymentStatus,
          fieldRepId,
          contactId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Generate orders report error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to generate orders report',
    }, 500);
  }
});

/**
 * GET /api/reports/payments
 * Generate payments report with filters
 */
reports.get('/payments', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    logger.info('Generate payments report request', getLogContext(c));

    // Get query parameters
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const paymentMode = c.req.query('paymentMode'); // CASH, CHEQUE, UPI, etc.
    const fieldRepId = c.req.query('fieldRepId');
    const contactId = c.req.query('contactId');
    const format = c.req.query('format') || 'json';

    // Build filter
    const where: any = {};

    // Role-based filtering
    if (user.role === 'FIELD_REP') {
      where.recordedById = user.userId;
    } else if (fieldRepId) {
      where.recordedById = fieldRepId;
    }

    // Date range filter
    if (startDate || endDate) {
      where.paymentDate = {};
      if (startDate) where.paymentDate.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.paymentDate.lte = end;
      }
    }

    // Payment mode filter
    if (paymentMode) {
      where.paymentMode = paymentMode;
    }

    // Contact filter
    if (contactId) {
      where.contactId = contactId;
    }

    // Fetch payments with relations
    const payments = await deps.prisma.payment.findMany({
      where,
      include: {
        contact: {
          select: {
            name: true,
            email: true,
            phone: true,
            company: true,
          },
        },
        order: {
          select: {
            orderNumber: true,
            totalAmount: true,
          },
        },
        recordedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
      orderBy: { paymentDate: 'desc' },
    });

    // Calculate summary stats
    const totalPayments = payments.length;
    const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);
    const byPaymentMode = payments.reduce((acc, p) => {
      acc[p.paymentMode] = (acc[p.paymentMode] || 0) + Number(p.amount);
      return acc;
    }, {} as Record<string, number>);

    logger.info('Payments report generated successfully', {
      ...getLogContext(c),
      totalPayments,
      totalAmount,
    });

    // Return CSV if requested
    if (format === 'csv') {
      const csv = generatePaymentsCSV(payments);
      return c.text(csv, 200, {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="payments_report_${new Date().toISOString().split('T')[0]}.csv"`,
      });
    }

    // Return JSON
    return c.json({
      success: true,
      data: {
        payments,
        summary: {
          total: totalPayments,
          totalAmount: Number(totalAmount.toFixed(2)),
          averagePayment: totalPayments > 0 ? Number((totalAmount / totalPayments).toFixed(2)) : 0,
          byPaymentMode: Object.entries(byPaymentMode).map(([mode, amount]) => ({
            mode,
            amount: Number(amount.toFixed(2)),
            count: payments.filter(p => p.paymentMode === mode).length,
          })),
        },
        filters: {
          startDate,
          endDate,
          paymentMode,
          fieldRepId,
          contactId,
        },
      },
    });
  } catch (error: any) {
    logger.error('Generate payments report error', {
      ...getLogContext(c),
      error: error.message,
      stack: error.stack,
    });
    return c.json({
      success: false,
      error: error.message || 'Failed to generate payments report',
    }, 500);
  }
});

/**
 * Helper: Generate CSV for visits
 */
function generateVisitsCSV(visits: any[]): string {
  const headers = [
    'Date',
    'Contact Name',
    'Company',
    'Contact Email',
    'Contact Phone',
    'Field Rep',
    'Status',
    'Visit Type',
    'Purpose',
    'Notes',
    'Latitude',
    'Longitude',
  ];

  const rows = visits.map(v => [
    new Date(v.createdAt).toLocaleString(),
    v.contact?.name || '',
    v.contact?.company || '',
    v.contact?.email || '',
    v.contact?.phone || '',
    v.fieldRep?.name || '',
    v.status,
    v.visitType || '',
    v.purpose || '',
    (v.notes || '').replace(/\n/g, ' ').replace(/,/g, ';'),
    v.latitude || '',
    v.longitude || '',
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

/**
 * Helper: Generate CSV for orders
 */
function generateOrdersCSV(orders: any[]): string {
  const headers = [
    'Order Number',
    'Order Date',
    'Contact Name',
    'Company',
    'Contact Email',
    'Contact Phone',
    'Sales Rep',
    'Status',
    'Payment Status',
    'Total Amount',
    'Items Count',
    'Notes',
  ];

  const rows = orders.map(o => [
    o.orderNumber,
    new Date(o.createdAt).toLocaleDateString(),
    o.contact?.name || '',
    o.contact?.company || '',
    o.contact?.email || '',
    o.contact?.phone || '',
    o.createdBy?.name || '',
    o.status,
    o.paymentStatus,
    Number(o.totalAmount).toFixed(2),
    o.items?.length || 0,
    (o.notes || '').replace(/\n/g, ' ').replace(/,/g, ';'),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

/**
 * Helper: Generate CSV for payments
 */
function generatePaymentsCSV(payments: any[]): string {
  const headers = [
    'Payment Date',
    'Contact Name',
    'Company',
    'Contact Email',
    'Contact Phone',
    'Order Number',
    'Amount',
    'Payment Mode',
    'Reference Number',
    'Recorded By',
    'Notes',
  ];

  const rows = payments.map(p => [
    new Date(p.paymentDate).toLocaleDateString(),
    p.contact?.name || '',
    p.contact?.company || '',
    p.contact?.email || '',
    p.contact?.phone || '',
    p.order?.orderNumber || '',
    Number(p.amount).toFixed(2),
    p.paymentMode,
    p.referenceNumber || '',
    p.recordedBy?.name || '',
    (p.notes || '').replace(/\n/g, ' ').replace(/,/g, ';'),
  ]);

  return [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');
}

export default reports;
