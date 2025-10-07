/**
 * Email Notification Service
 * Handles all transactional emails for the CRM
 * Uses MSG91 Email Service for delivery
 */

import { IEmailService } from '../core/ports/IEmailService';
import { logger } from '../utils/logger';
import { renderOrderConfirmationEmail } from '../templates/emails/orderConfirmation';
import { renderPaymentReceivedEmail } from '../templates/emails/paymentReceived';
import { renderPaymentReminderEmail } from '../templates/emails/paymentReminder';
import { renderWeeklySummaryEmail } from '../templates/emails/weeklySummary';

export interface OrderEmailData {
  orderNumber: string;
  orderDate: string;
  contactName: string;
  contactEmail: string;
  totalAmount: string;
  paymentStatus: string;
  deliveryAddress: string;
  notes?: string;
  items: Array<{
    productName: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
  }>;
  repName: string;
  repPhone: string;
  companyName: string;
  orderUrl: string;
}

export interface PaymentEmailData {
  paymentNumber: string;
  paymentDate: string;
  contactName: string;
  contactEmail: string;
  amount: string;
  paymentMode: string;
  transactionRef?: string;
  orderNumber?: string;
  totalOutstanding: string;
  remainingBalance: string;
  repName: string;
  repPhone: string;
  companyName: string;
}

export interface PaymentReminderData {
  orderNumber: string;
  orderDate: string;
  dueDate: string;
  daysOverdue: number;
  contactName: string;
  contactEmail: string;
  overdueAmount: string;
  urgencyLevel: 'polite' | 'followup' | 'urgent';
  bankDetails: string;
  upiId: string;
  repName: string;
  repPhone: string;
  repEmail: string;
  companyName: string;
  paymentUrl: string;
}

export interface WeeklySummaryData {
  repName: string;
  repEmail: string;
  weekRange: string;
  visitsCount: number;
  ordersCount: number;
  salesAmount: string;
  paymentsCollected: string;
  contactsAdded: number;
  avgVisitDuration: string;
  highlights: string[];
  upcomingVisitsCount: number;
  upcomingVisitsSummary: string;
  overduePaymentsCount: number;
  pendingOrdersCount: number;
  missedVisitsCount: number;
  managerName: string;
  companyName: string;
}

export class EmailNotificationService {
  private emailService: IEmailService;
  private fromEmail: string;
  private fromName: string;
  private companyName: string;

  constructor(
    emailService: IEmailService,
    fromEmail: string = 'noreply@fieldforce.com',
    fromName: string = 'Field Force CRM',
    companyName: string = 'Your Company'
  ) {
    this.emailService = emailService;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
    this.companyName = companyName;
  }

  /**
   * Send order confirmation email
   */
  async sendOrderConfirmation(data: OrderEmailData): Promise<boolean> {
    try {
      logger.info('[EmailNotification] Sending order confirmation', {
        orderNumber: data.orderNumber,
        to: data.contactEmail,
      });

      const html = renderOrderConfirmationEmail(data);

      const result = await this.emailService.sendEmail({
        to: `${data.contactName} <${data.contactEmail}>`,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `Order Confirmation - ${data.orderNumber}`,
        html,
      });

      if (!result.success) {
        logger.error('[EmailNotification] Order confirmation failed', {
          orderNumber: data.orderNumber,
          error: result.error,
        });
        return false;
      }

      logger.info('[EmailNotification] Order confirmation sent', {
        orderNumber: data.orderNumber,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('[EmailNotification] Order confirmation error', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Send payment received confirmation email
   */
  async sendPaymentReceived(data: PaymentEmailData): Promise<boolean> {
    try {
      logger.info('[EmailNotification] Sending payment confirmation', {
        paymentNumber: data.paymentNumber,
        to: data.contactEmail,
      });

      const html = renderPaymentReceivedEmail(data);

      const result = await this.emailService.sendEmail({
        to: `${data.contactName} <${data.contactEmail}>`,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `Payment Received - ${data.paymentNumber}`,
        html,
      });

      if (!result.success) {
        logger.error('[EmailNotification] Payment confirmation failed', {
          paymentNumber: data.paymentNumber,
          error: result.error,
        });
        return false;
      }

      logger.info('[EmailNotification] Payment confirmation sent', {
        paymentNumber: data.paymentNumber,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('[EmailNotification] Payment confirmation error', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Send payment overdue reminder email
   */
  async sendPaymentReminder(data: PaymentReminderData): Promise<boolean> {
    try {
      logger.info('[EmailNotification] Sending payment reminder', {
        orderNumber: data.orderNumber,
        to: data.contactEmail,
        urgency: data.urgencyLevel,
      });

      const html = renderPaymentReminderEmail(data);

      const subjectPrefix =
        data.urgencyLevel === 'urgent' ? 'URGENT: ' :
        data.urgencyLevel === 'followup' ? 'Follow-up: ' : '';

      const result = await this.emailService.sendEmail({
        to: `${data.contactName} <${data.contactEmail}>`,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `${subjectPrefix}Payment Reminder - ${data.orderNumber}`,
        html,
      });

      if (!result.success) {
        logger.error('[EmailNotification] Payment reminder failed', {
          orderNumber: data.orderNumber,
          error: result.error,
        });
        return false;
      }

      logger.info('[EmailNotification] Payment reminder sent', {
        orderNumber: data.orderNumber,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('[EmailNotification] Payment reminder error', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }

  /**
   * Send weekly performance summary to field rep
   */
  async sendWeeklySummary(data: WeeklySummaryData): Promise<boolean> {
    try {
      logger.info('[EmailNotification] Sending weekly summary', {
        to: data.repEmail,
        weekRange: data.weekRange,
      });

      const html = renderWeeklySummaryEmail(data);

      const result = await this.emailService.sendEmail({
        to: `${data.repName} <${data.repEmail}>`,
        from: `${this.fromName} <${this.fromEmail}>`,
        subject: `Your Weekly Performance Summary - ${data.weekRange}`,
        html,
      });

      if (!result.success) {
        logger.error('[EmailNotification] Weekly summary failed', {
          repEmail: data.repEmail,
          error: result.error,
        });
        return false;
      }

      logger.info('[EmailNotification] Weekly summary sent', {
        repEmail: data.repEmail,
        messageId: result.messageId,
      });

      return true;
    } catch (error) {
      logger.error('[EmailNotification] Weekly summary error', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}
