import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import { logger } from '../../utils/logger';

/**
 * MSG91 Email Service Implementation
 * Implements IEmailService using MSG91 Email API
 * Platform: Cloud-agnostic (REST API)
 *
 * MSG91 Email API: https://control.msg91.com/api/v5/email/send
 */
export class MSG91EmailService implements IEmailService {
  private authKey: string;
  private defaultFrom: { email: string; name: string };
  private domain: string;

  constructor(
    authKey: string,
    fromEmail: string,
    fromName: string,
    domain: string = 'qtoedo.mailer91.com'
  ) {
    this.authKey = authKey;
    this.defaultFrom = { email: fromEmail, name: fromName };
    this.domain = domain;
  }

  /**
   * Send an email via MSG91 Email API
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const url = 'https://control.msg91.com/api/v5/email/send';

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authkey': this.authKey,
      };

      // Parse from email
      const from = options.from || `${this.defaultFrom.name} <${this.defaultFrom.email}>`;
      const fromParts = from.match(/(?:"?([^"]*)"?\s)?<?([^@<]+@[^>]+)>?/);
      const fromEmail = fromParts?.[2] || this.defaultFrom.email;
      const fromName = fromParts?.[1] || this.defaultFrom.name;

      // Parse recipients
      const recipients = (Array.isArray(options.to) ? options.to : [options.to]).map(to => {
        const parts = to.match(/(?:"?([^"]*)"?\s)?<?([^@<]+@[^>]+)>?/);
        return {
          email: parts?.[2] || to,
          name: parts?.[1] || parts?.[2] || to,
        };
      });

      const body = {
        recipients: [
          {
            to: recipients,
            variables: {}, // Add template variables if needed
          },
        ],
        from: {
          email: fromEmail,
          name: fromName,
        },
        domain: this.domain,
        subject: options.subject,
        body: {
          type: 'html',
          data: options.html || options.text || '',
        },
      };

      logger.info('[MSG91Email] Sending email', {
        to: recipients.map(r => r.email),
        subject: options.subject,
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91Email] Send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send email via MSG91',
        };
      }

      logger.info('[MSG91Email] Email sent successfully', {
        requestId: data.request_id,
      });

      return {
        success: true,
        messageId: data.request_id || data.message_id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email via MSG91';
      logger.error('[MSG91Email] Send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send a templated email using MSG91 templates
   *
   * @param templateId - MSG91 template ID from dashboard
   * @param to - Recipient email
   * @param variables - Template variables
   */
  async sendTemplatedEmail(
    templateId: string,
    to: string,
    variables: Record<string, unknown>
  ): Promise<EmailResponse> {
    try {
      const url = 'https://control.msg91.com/api/v5/email/send';

      const headers = {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'authkey': this.authKey,
      };

      // Parse recipient
      const parts = to.match(/(?:"?([^"]*)"?\s)?<?([^@<]+@[^>]+)>?/);
      const email = parts?.[2] || to;
      const name = parts?.[1] || parts?.[2] || to;

      // Convert variables to MSG91 format ({VARIABLE_NAME}: value)
      const msg91Variables: Record<string, string> = {};
      for (const [key, value] of Object.entries(variables)) {
        msg91Variables[`{${key.toUpperCase()}}`] = String(value);
      }

      const body = {
        recipients: [
          {
            to: [{ email, name }],
            variables: msg91Variables,
          },
        ],
        from: {
          email: this.defaultFrom.email,
          name: this.defaultFrom.name,
        },
        domain: this.domain,
        template_id: templateId,
      };

      logger.info('[MSG91Email] Sending templated email', {
        to: email,
        templateId,
        variables: Object.keys(msg91Variables),
      });

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        logger.error('[MSG91Email] Template send failed', {
          status: response.status,
          error: data,
        });
        return {
          success: false,
          error: data.message || 'Failed to send templated email via MSG91',
        };
      }

      logger.info('[MSG91Email] Templated email sent successfully', {
        requestId: data.request_id,
      });

      return {
        success: true,
        messageId: data.request_id || data.message_id,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send templated email via MSG91';
      logger.error('[MSG91Email] Template send error', { error: message });
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Verify MSG91 email service connectivity
   * MSG91 doesn't have a verify endpoint, so we just check if authKey is set
   */
  async verifyConnection(): Promise<boolean> {
    try {
      if (!this.authKey || this.authKey === '') {
        logger.error('[MSG91Email] Auth key not configured');
        return false;
      }

      // Optionally: could make a test API call to verify credentials
      logger.info('[MSG91Email] Service configured', {
        domain: this.domain,
        fromEmail: this.defaultFrom.email,
      });

      return true;
    } catch (error: unknown) {
      logger.error('[MSG91Email] Verification failed', {
        error: error instanceof Error ? error.message : error
      });
      return false;
    }
  }
}
