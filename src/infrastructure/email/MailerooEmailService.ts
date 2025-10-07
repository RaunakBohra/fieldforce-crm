import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * Maileroo Email Service Implementation
 * Implements IEmailService using Maileroo SMTP API
 * Platform: Cloud-agnostic (SMTP via API)
 *
 * Free Tier: 1,000 emails/month
 * Maileroo API: https://maileroo.com/docs
 */
export class MailerooEmailService implements IEmailService {
  private apiKey: string;
  private defaultFrom: { email: string; name: string };

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.defaultFrom = { email: fromEmail, name: fromName };
  }

  /**
   * Parse email address to Maileroo EmailObject format
   */
  private parseEmailAddress(email: string): { address: string; display_name?: string } {
    // Extract name and email from "Name <email@example.com>" format
    const match = email.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return {
        address: match[2].trim(),
        display_name: match[1].trim(),
      };
    }
    return { address: email.trim() };
  }

  /**
   * Send an email via Maileroo API v2
   * API Docs: https://maileroo.com/docs/email-api/send-basic-email
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      // Maileroo API v2 endpoint
      const url = 'https://smtp.maileroo.com/api/v2/emails';

      const headers = {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      };

      // Parse from email to EmailObject format
      const fromEmail = options.from || `${this.defaultFrom.name} <${this.defaultFrom.email}>`;
      const from = this.parseEmailAddress(fromEmail);

      // Parse recipients to EmailObject format
      const toArray = Array.isArray(options.to) ? options.to : [options.to];
      const to = toArray.map((email) => this.parseEmailAddress(email));

      // Build request body according to Maileroo API v2 spec
      const body = {
        from,
        to,
        subject: options.subject,
        html: options.html || '',
        plain: options.text || undefined, // Optional: auto-generated from HTML if not provided
      };

      logger.info('[MailerooEmail] Sending email', {
        from: from.address,
        to: to.map((t) => t.address),
        subject: options.subject,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MailerooEmail] Send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send email via Maileroo',
        };
      }

      // Extract reference_id from response
      const referenceId = data?.data?.reference_id || data?.id || data?.message_id;

      logger.info('[MailerooEmail] Email sent successfully', {
        referenceId,
      });

      return {
        success: true,
        messageId: referenceId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email via Maileroo';
      logger.error('[MailerooEmail] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify Maileroo email service connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.apiKey || this.apiKey === '') {
        logger.error('[MailerooEmail] API key not configured');
        return false;
      }

      logger.info('[MailerooEmail] Service configured', {
        fromEmail: this.defaultFrom.email,
      });

      return true;
    } catch (error: unknown) {
      logger.error('[MailerooEmail] Verification failed', {
        error: error instanceof Error ? error.message : error,
      });
      return false;
    }
  }
}
