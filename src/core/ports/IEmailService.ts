/**
 * Email Service Interface (Port)
 * Platform-agnostic interface for email operations
 * Implementations: SESEmailService (AWS), SendGridEmailService, etc.
 */

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html?: string;
  text?: string;
  from?: string;
  attachments?: EmailAttachment[];
}

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResponse {
  success: boolean;
  messageId?: string;
  error?: string;
}

export interface IEmailService {
  /**
   * Send an email
   * @param options Email configuration
   * @returns Promise with send result
   */
  sendEmail(options: EmailOptions): Promise<EmailResponse>;

  /**
   * Send a templated email (for password reset, welcome emails, etc.)
   * @param templateName Template identifier
   * @param to Recipient email
   * @param data Template variables
   */
  sendTemplatedEmail(
    templateName: string,
    to: string,
    data: Record<string, unknown>
  ): Promise<EmailResponse>;

  /**
   * Verify email service connectivity
   * @returns true if service is accessible
   */
  verifyConnection(): Promise<boolean>;
}
