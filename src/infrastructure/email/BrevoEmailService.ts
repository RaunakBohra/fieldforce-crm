import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * Brevo (formerly Sendinblue) Email Service Implementation
 * Implements IEmailService using Brevo Transactional Email API
 * Platform: Cloud-agnostic (REST API)
 *
 * Free Tier: 300 emails/day (~9,000 emails/month)
 * Brevo API Docs: https://developers.brevo.com/reference/sendtransacemail
 */
export class BrevoEmailService implements IEmailService {
  private apiKey: string;
  private defaultFrom: { email: string; name: string };

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.defaultFrom = { email: fromEmail, name: fromName };
  }

  /**
   * Parse email address to Brevo format
   */
  private parseEmailAddress(email: string): { email: string; name?: string } {
    // Extract name and email from "Name <email@example.com>" format
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return {
        email: match[2].trim(),
        name: match[1].trim(),
      };
    }
    return { email: email.trim() };
  }

  /**
   * Send an email via Brevo API v3
   * API Docs: https://developers.brevo.com/reference/sendtransacemail
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Brevo API v3 endpoint
      const url = 'https://api.brevo.com/v3/smtp/email';

      const headers = {
        'accept': 'application/json',
        'api-key': this.apiKey,
        'content-type': 'application/json',
      };

      // Parse from email
      const fromEmail = options.from || `${this.defaultFrom.name} <${this.defaultFrom.email}>`;
      const sender = this.parseEmailAddress(fromEmail);

      // Parse recipients
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      const to = toArray.map((email) => this.parseEmailAddress(email));

      // Build request body according to Brevo API v3 spec
      const body = {
        sender,
        to,
        subject: options.subject,
        htmlContent: options.html || '',
        textContent: options.text || undefined,
      };

      logger.info('[BrevoEmail] Sending email', {
        from: sender.email,
        to: to.map((t) => t.email),
        subject: options.subject,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[BrevoEmail] Send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send email via Brevo',
        };
      }

      // Extract messageId from response
      const messageId = data?.messageId || data?.id;

      logger.info('[BrevoEmail] Email sent successfully', {
        messageId,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email via Brevo';
      logger.error('[BrevoEmail] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify Brevo email service connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === '') {
        logger.error('[BrevoEmail] API key not configured');
        return false;
      }

      logger.info('[BrevoEmail] Service configured', {
        fromEmail: this.defaultFrom.email,
      });

      return true;
    } catch (error: unknown) {
      logger.error('[BrevoEmail] Verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}
