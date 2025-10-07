/**
 * Email Testing Routes
 * For testing email templates in development
 * WARNING: Remove or protect this route in production
 */

import { Hono } from 'hono';
import { requireAuth } from '../middleware/auth';
import { logger } from '../utils/logger';
import { getLogContext } from '../utils/logger';

const emailTest = new Hono();

// Apply auth middleware to all routes
emailTest.use('/*', requireAuth);

/**
 * POST /api/email-test/order-confirmation
 * Test order confirmation email
 */
emailTest.post('/order-confirmation', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const { email } = await c.req.json();
    const testEmail = email || 'rnkbohra@gmail.com';

    logger.info('[EmailTest] Sending order confirmation test', {
      ...getLogContext(c),
      testEmail,
    });

    const result = await deps.emailNotifications.sendOrderConfirmation({
      orderNumber: 'ORD-TEST-001',
      orderDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      contactName: 'Test Customer',
      contactEmail: testEmail,
      totalAmount: '25,500.00',
      paymentStatus: 'UNPAID',
      deliveryAddress: '123 Test Street, Test City, Test State - 110001',
      notes: 'This is a test order for email template verification.',
      items: [
        {
          productName: 'Paracetamol 500mg',
          quantity: 100,
          unitPrice: '50.00',
          totalPrice: '5,000.00',
        },
        {
          productName: 'Azithromycin 250mg',
          quantity: 50,
          unitPrice: '150.00',
          totalPrice: '7,500.00',
        },
        {
          productName: 'Amoxicillin 500mg',
          quantity: 100,
          unitPrice: '80.00',
          totalPrice: '8,000.00',
        },
        {
          productName: 'Ciprofloxacin 500mg',
          quantity: 50,
          unitPrice: '100.00',
          totalPrice: '5,000.00',
        },
      ],
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      companyName: 'MedPharm Ltd',
      orderUrl: 'https://crm-api.raunakbohra.com/orders/test-001',
    });

    if (result) {
      return c.json({
        success: true,
        message: `Order confirmation email sent to ${testEmail}`,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to send email - check logs for details',
      }, 500);
    }
  } catch (error) {
    logger.error('[EmailTest] Order confirmation test failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/email-test/payment-received
 * Test payment received email
 */
emailTest.post('/payment-received', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const { email } = await c.req.json();
    const testEmail = email || 'rnkbohra@gmail.com';

    logger.info('[EmailTest] Sending payment received test', {
      ...getLogContext(c),
      testEmail,
    });

    const result = await deps.emailNotifications.sendPaymentReceived({
      paymentNumber: 'PAY-TEST-001',
      paymentDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      contactName: 'Test Customer',
      contactEmail: testEmail,
      amount: '15,000.00',
      paymentMode: 'BANK_TRANSFER',
      transactionRef: 'TXN123456789',
      orderNumber: 'ORD-TEST-001',
      totalOutstanding: '25,500.00',
      remainingBalance: '10,500.00',
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      companyName: 'MedPharm Ltd',
    });

    if (result) {
      return c.json({
        success: true,
        message: `Payment received email sent to ${testEmail}`,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to send email - check logs for details',
      }, 500);
    }
  } catch (error) {
    logger.error('[EmailTest] Payment received test failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/email-test/payment-reminder
 * Test payment reminder email
 */
emailTest.post('/payment-reminder', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const body = await c.req.json();
    const testEmail = body.email || 'rnkbohra@gmail.com';
    const urgencyLevel = (body.urgency || 'polite') as 'polite' | 'followup' | 'urgent';

    logger.info('[EmailTest] Sending payment reminder test', {
      ...getLogContext(c),
      testEmail,
      urgencyLevel,
    });

    const daysOverdue = urgencyLevel === 'polite' ? 7 : urgencyLevel === 'followup' ? 15 : 35;

    const result = await deps.emailNotifications.sendPaymentReminder({
      orderNumber: 'ORD-TEST-001',
      orderDate: '25 September 2025',
      dueDate: '5 October 2025',
      daysOverdue,
      contactName: 'Test Customer',
      contactEmail: testEmail,
      overdueAmount: '25,500.00',
      urgencyLevel,
      bankDetails: 'HDFC Bank, A/C: 12345678901234, IFSC: HDFC0001234',
      upiId: 'medpharm@okaxis',
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      repEmail: 'ravi.kumar@medpharm.com',
      companyName: 'MedPharm Ltd',
      paymentUrl: 'https://crm-api.raunakbohra.com/payments/pay/test-001',
    });

    if (result) {
      return c.json({
        success: true,
        message: `Payment reminder (${urgencyLevel}) email sent to ${testEmail}`,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to send email - check logs for details',
      }, 500);
    }
  } catch (error) {
    logger.error('[EmailTest] Payment reminder test failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/email-test/weekly-summary
 * Test weekly summary email
 */
emailTest.post('/weekly-summary', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const { email } = await c.req.json();
    const testEmail = email || 'rnkbohra@gmail.com';

    logger.info('[EmailTest] Sending weekly summary test', {
      ...getLogContext(c),
      testEmail,
    });

    const result = await deps.emailNotifications.sendWeeklySummary({
      repName: user.name || 'Ravi Kumar',
      repEmail: testEmail,
      weekRange: '30 Sep - 6 Oct 2025',
      visitsCount: 18,
      ordersCount: 15,
      salesAmount: '3,45,000',
      paymentsCollected: '2,75,000',
      contactsAdded: 5,
      avgVisitDuration: '35 min',
      highlights: [
        'Highest weekly sales this quarter! 🎉',
        'Successfully closed deal with City Hospital',
        'Added 5 new high-value contacts in premium territory',
      ],
      upcomingVisitsCount: 12,
      upcomingVisitsSummary: '3 visits on Monday, 4 on Tuesday, 2 on Wednesday, 3 on Thursday',
      overduePaymentsCount: 3,
      pendingOrdersCount: 2,
      missedVisitsCount: 1,
      managerName: 'Amit Sharma',
      companyName: 'MedPharm Ltd',
    });

    if (result) {
      return c.json({
        success: true,
        message: `Weekly summary email sent to ${testEmail}`,
      });
    } else {
      return c.json({
        success: false,
        error: 'Failed to send email - check logs for details',
      }, 500);
    }
  } catch (error) {
    logger.error('[EmailTest] Weekly summary test failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

/**
 * POST /api/email-test/all
 * Send all test emails at once
 */
emailTest.post('/all', async (c) => {
  const deps = c.get('deps');
  const user = c.get('user');

  try {
    const { email } = await c.req.json();
    const testEmail = email || 'rnkbohra@gmail.com';

    logger.info('[EmailTest] Sending all test emails', {
      ...getLogContext(c),
      testEmail,
    });

    const results = {
      orderConfirmation: false,
      paymentReceived: false,
      paymentReminderPolite: false,
      paymentReminderUrgent: false,
      weeklySummary: false,
    };

    // Send all emails with 2 second delay between each
    results.orderConfirmation = await deps.emailNotifications.sendOrderConfirmation({
      orderNumber: 'ORD-TEST-001',
      orderDate: new Date().toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
      contactName: 'Test Customer',
      contactEmail: testEmail,
      totalAmount: '25,500.00',
      paymentStatus: 'UNPAID',
      deliveryAddress: '123 Test Street, Test City, Test State - 110001',
      items: [
        {
          productName: 'Paracetamol 500mg',
          quantity: 100,
          unitPrice: '50.00',
          totalPrice: '5,000.00',
        },
        {
          productName: 'Azithromycin 250mg',
          quantity: 50,
          unitPrice: '150.00',
          totalPrice: '7,500.00',
        },
      ],
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      companyName: 'MedPharm Ltd',
      orderUrl: 'https://crm-api.raunakbohra.com/orders/test-001',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.paymentReceived = await deps.emailNotifications.sendPaymentReceived({
      paymentNumber: 'PAY-TEST-001',
      paymentDate: new Date().toLocaleDateString('en-IN'),
      contactName: 'Test Customer',
      contactEmail: testEmail,
      amount: '15,000.00',
      paymentMode: 'BANK_TRANSFER',
      transactionRef: 'TXN123456789',
      orderNumber: 'ORD-TEST-001',
      totalOutstanding: '25,500.00',
      remainingBalance: '10,500.00',
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      companyName: 'MedPharm Ltd',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.paymentReminderPolite = await deps.emailNotifications.sendPaymentReminder({
      orderNumber: 'ORD-TEST-001',
      orderDate: '25 September 2025',
      dueDate: '5 October 2025',
      daysOverdue: 7,
      contactName: 'Test Customer',
      contactEmail: testEmail,
      overdueAmount: '25,500.00',
      urgencyLevel: 'polite',
      bankDetails: 'HDFC Bank, A/C: 12345678901234',
      upiId: 'medpharm@okaxis',
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      repEmail: 'ravi@medpharm.com',
      companyName: 'MedPharm Ltd',
      paymentUrl: 'https://crm-api.raunakbohra.com/payments/pay/test-001',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.paymentReminderUrgent = await deps.emailNotifications.sendPaymentReminder({
      orderNumber: 'ORD-TEST-002',
      orderDate: '15 September 2025',
      dueDate: '25 September 2025',
      daysOverdue: 35,
      contactName: 'Test Customer',
      contactEmail: testEmail,
      overdueAmount: '50,000.00',
      urgencyLevel: 'urgent',
      bankDetails: 'HDFC Bank, A/C: 12345678901234',
      upiId: 'medpharm@okaxis',
      repName: user.name || 'Ravi Kumar',
      repPhone: '+91 98765 43210',
      repEmail: 'ravi@medpharm.com',
      companyName: 'MedPharm Ltd',
      paymentUrl: 'https://crm-api.raunakbohra.com/payments/pay/test-002',
    });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    results.weeklySummary = await deps.emailNotifications.sendWeeklySummary({
      repName: user.name || 'Ravi Kumar',
      repEmail: testEmail,
      weekRange: '30 Sep - 6 Oct 2025',
      visitsCount: 18,
      ordersCount: 15,
      salesAmount: '3,45,000',
      paymentsCollected: '2,75,000',
      contactsAdded: 5,
      avgVisitDuration: '35 min',
      highlights: [
        'Highest weekly sales this quarter!',
        'Successfully closed deal with City Hospital',
        'Added 5 new high-value contacts',
      ],
      upcomingVisitsCount: 12,
      upcomingVisitsSummary: '3 Monday, 4 Tuesday, 2 Wednesday, 3 Thursday',
      overduePaymentsCount: 3,
      pendingOrdersCount: 2,
      missedVisitsCount: 1,
      managerName: 'Amit Sharma',
      companyName: 'MedPharm Ltd',
    });

    const successCount = Object.values(results).filter((r) => r).length;

    return c.json({
      success: successCount === 5,
      message: `Sent ${successCount}/5 test emails to ${testEmail}`,
      results,
    });
  } catch (error) {
    logger.error('[EmailTest] All emails test failed', error, getLogContext(c));
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, 500);
  }
});

export default emailTest;
