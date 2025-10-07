/**
 * Payment Reminders Cron Job
 * Sends automatic payment reminders for overdue orders
 * Runs daily at 9 AM IST (3:30 AM UTC)
 */

import { PrismaClient } from '@prisma/client';
import { sendSMS, getMSG91Config } from '../utils/msg91';
import { differenceInDays, startOfDay } from 'date-fns';

export interface PaymentReminderResult {
  totalOverdueOrders: number;
  remindersSent: number;
  errors: number;
  details: Array<{
    orderId: string;
    orderNumber: string;
    contactName: string;
    amount: number;
    daysPending: number;
    success: boolean;
    error?: string;
  }>;
}

/**
 * Send payment reminders for overdue orders
 * Sends reminder every 7 days for overdue payments
 */
export async function sendPaymentReminders(
  prisma: PrismaClient,
  env: any
): Promise<PaymentReminderResult> {
  const result: PaymentReminderResult = {
    totalOverdueOrders: 0,
    remindersSent: 0,
    errors: 0,
    details: [],
  };

  try {
    const today = startOfDay(new Date());

    // Find overdue orders
    // Orders where: dueDate < today AND status = DELIVERED AND outstanding > 0
    const overdueOrders = await prisma.order.findMany({
      where: {
        dueDate: {
          lt: today,
        },
        status: 'DELIVERED',
        paymentStatus: {
          in: ['UNPAID', 'PARTIAL'],
        },
      },
      include: {
        contact: true,
        payments: true,
      },
    });

    result.totalOverdueOrders = overdueOrders.length;

    const msg91Config = getMSG91Config(env);

    // Process each overdue order
    for (const order of overdueOrders) {
      if (!order.dueDate) continue;

      // Calculate days pending
      const daysPending = differenceInDays(today, order.dueDate);

      // Send reminder only if days pending is a multiple of 7
      // (i.e., send on day 7, 14, 21, 28, etc.)
      if (daysPending <= 0 || daysPending % 7 !== 0) {
        continue;
      }

      // Calculate outstanding amount
      const totalPaid = order.payments.reduce(
        (sum, payment) => sum + Number(payment.amount),
        0
      );
      const outstandingAmount = Number(order.totalAmount) - totalPaid;

      if (outstandingAmount <= 0) continue;

      // Prepare message
      const contactName = order.contact.name;
      const message = `Hi ${contactName}, payment of Rs.${outstandingAmount.toFixed(
        2
      )} for Order ${order.orderNumber} is overdue by ${daysPending} days. Please pay soon. -FieldForce CRM`;

      // Send SMS
      let reminderSuccess = false;
      let reminderError: string | undefined;

      if (order.contact.phone && msg91Config.apiKey) {
        const smsResult = await sendSMS(order.contact.phone, message, msg91Config);
        reminderSuccess = smsResult.success;
        reminderError = smsResult.success ? undefined : smsResult.message;

        // Create PaymentReminder record
        await prisma.paymentReminder.create({
          data: {
            orderId: order.id,
            channel: 'SMS',
            sentAt: new Date(),
            delivered: smsResult.success,
            response: smsResult.response || {},
          },
        });

        if (smsResult.success) {
          result.remindersSent++;
        } else {
          result.errors++;
        }
      } else {
        reminderError = 'Missing phone number or MSG91 API key';
        result.errors++;
      }

      result.details.push({
        orderId: order.id,
        orderNumber: order.orderNumber,
        contactName: contactName,
        amount: outstandingAmount,
        daysPending,
        success: reminderSuccess,
        error: reminderError,
      });
    }

    console.log('[Payment Reminders] Job completed:', {
      totalOverdue: result.totalOverdueOrders,
      sent: result.remindersSent,
      errors: result.errors,
    });

    return result;
  } catch (error) {
    console.error('[Payment Reminders] Job failed:', error);
    throw error;
  }
}
