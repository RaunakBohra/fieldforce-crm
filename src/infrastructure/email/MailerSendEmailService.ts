import { IEmailService, EmailOptions, EmailResponse } from '../../domain/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * MailerSend Email Service Implementation
 *
 * Free Tier: 3,000 emails/month (permanent)
 * API Documentation: https://developers.mailersend.com/api/v1/email.html
 *
 * Features:
 * - REST API with JSON requests
 * - 202 Accepted status for queued emails
 * - Returns x-message-id for tracking
 * - Supports HTML and plain text
 * - Max 50 recipients per email
 */
export class MailerSendEmailService implements IEmailService {
  private readonly apiKey: string;
  private readonly fromEmail: string;
  private readonly fromName: string;
  private readonly apiUrl = 'https://api.mailersend.com/v1/email';

  constructor(apiKey: string, fromEmail: string, fromName: string) {
    this.apiKey = apiKey;
    this.fromEmail = fromEmail;
    this.fromName = fromName;
  }

  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const fromEmail = options.from || this.fromEmail;

      // Parse recipient email addresses
      const toArray = Array.isArray(options.to) ? options.to : [options.to];

      // MailerSend API request body
      const body = {
        from: {
          email: fromEmail,
          name: this.fromName,
        },
        to: toArray.map((email) => this.parseEmailAddress(email)),
        subject: options.subject,
        html: options.html || '',
        text: options.text || undefined,
      };

      logger.info('[MailerSend] Sending email', {
        to: toArray,
        subject: options.subject,
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      const responseText = await response.text();

      if (!response.ok) {
        let errorData: any;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { message: responseText };
        }

        logger.error('[MailerSend] Send failed', {
          status: response.status,
          error: errorData,
        });

        return {
          success: false,
          error: `MailerSend API error: ${errorData.message || responseText}`,
        };
      }

      // MailerSend returns 202 Accepted for queued emails
      // Response body is typically empty, but x-message-id is in headers
      const messageId = response.headers.get('x-message-id') || 'unknown';

      logger.info('[MailerSend] Email sent successfully', {
        messageId,
        status: response.status,
      });

      return {
        success: true,
        messageId,
      };
    } catch (error) {
      logger.error('[MailerSend] Unexpected error', { error });
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Parse email address from string format
   * Handles both "email@domain.com" and "Name <email@domain.com>" formats
   */
  private parseEmailAddress(emailStr: string): { email: string; name?: string } {
    const match = emailStr.match(/^(.+?)\s*<(.+?)>$/);
    if (match) {
      return {
        name: match[1].trim(),
        email: match[2].trim(),
      };
    }
    return { email: emailStr.trim() };
  }
}
