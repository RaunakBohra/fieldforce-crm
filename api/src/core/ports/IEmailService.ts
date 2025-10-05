/**
 * Email Service Interface
 *
 * Platform-agnostic interface for sending emails
 * Implementations: AWS SES, SendGrid, Resend, Mailgun
 */

export interface IEmailService {
  /**
   * Send single email
   * @param params - Email parameters
   */
  sendEmail(params: EmailParams): Promise<EmailResult>;

  /**
   * Send templated email
   * @param params - Template email parameters
   */
  sendTemplateEmail(params: TemplateEmailParams): Promise<EmailResult>;

  /**
   * Send batch emails
   * @param emails - Array of email parameters
   */
  sendBatch(emails: EmailParams[]): Promise<EmailResult[]>;
}

export interface EmailParams {
  to: string | string[];
  from?: string;
  subject: string;
  html?: string;
  text?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface TemplateEmailParams {
  to: string | string[];
  from?: string;
  template: EmailTemplate;
  variables: Record<string, any>;
  cc?: string | string[];
  bcc?: string | string[];
}

export type EmailTemplate =
  | 'welcome'
  | 'password-reset'
  | 'payment-reminder'
  | 'order-confirmation'
  | 'visit-summary'
  | 'invoice';

export interface EmailAttachment {
  filename: string;
  content: Buffer | string;
  contentType?: string;
}

export interface EmailResult {
  messageId: string;
  success: boolean;
  error?: string;
}
