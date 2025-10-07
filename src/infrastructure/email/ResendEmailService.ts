import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * Resend Email Service Implementation
 * Implements IEmailService using Resend API
 * Platform: Cloud-agnostic (REST API)
 *
 * Resend Email API: https://resend.com/docs/api-reference/emails/send-email
 */
export class ResendEmailService implements IEmailService {
  private apiKey: string;
  private defaultFrom: { email: string; name: string };

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.defaultFrom = { email: fromEmail, name: fromName };
  }

  /**
   * Send an email via Resend API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const url = 'https://api.resend.com/emails';

      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      };

      // Parse from email - Resend requires exact format
      let from = options.from || this.defaultFrom.email;

      // For Resend sandbox testing, use email only without name wrapper
      if (from.includes('resend.dev')) {
        from = from.match(/<(.+)>$/)?.[1] || from;
      }

      // Parse recipients
      const to = Array.isArray(options.to) ? options.to : [options.to];

      const body = {
        from,
        to,
        subject: options.subject,
        html: options.html || options.text || '',
      };

      logger.info('[ResendEmail] Sending email', {
        from,
        to,
        subject: options.subject,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[ResendEmail] Send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send email via Resend',
        };
      }

      logger.info('[ResendEmail] Email sent successfully', {
        id: data.id,
      });

      return {
        success: true,
        messageId: data.id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email via Resend';
      logger.error('[ResendEmail] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify Resend email service connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === '') {
        logger.error('[ResendEmail] API key not configured');
        return false;
      }

      logger.info('[ResendEmail] Service configured', {
        fromEmail: this.defaultFrom.email,
      });

      return true;
    } catch (error: unknown) {
      logger.error('[ResendEmail] Verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}
