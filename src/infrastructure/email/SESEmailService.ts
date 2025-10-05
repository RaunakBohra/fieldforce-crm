import { IEmailService, EmailOptions, EmailResponse } from '../../core/ports/IEmailService';
import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';

/**
 * AWS SES Email Service Implementation
 * Implements IEmailService using AWS SES via SMTP
 * Platform: AWS (can be used with Cloudflare Workers via node_compat)
 */
export class SESEmailService implements IEmailService {
  private transporter: Transporter;
  private defaultFrom: string;

  constructor(
    smtpHost: string,
    smtpPort: number,
    smtpUser: string,
    smtpPassword: string,
    defaultFrom: string
  ) {
    this.defaultFrom = defaultFrom;

    // Create SMTP transporter for AWS SES
    this.transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort,
      secure: smtpPort === 465, // true for 465, false for other ports
      auth: {
        user: smtpUser,
        pass: smtpPassword,
      },
    });
  }

  /**
   * Send an email via AWS SES
   */
  async sendEmail(options: EmailOptions): Promise<EmailResponse> {
    try {
      const info = await this.transporter.sendMail({
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments?.map((att) => ({
          filename: att.filename,
          content: att.content,
          contentType: att.contentType,
        })),
      });

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to send email';
      return {
        success: false,
        error: message,
      };
    }
  }

  /**
   * Send a templated email
   * For now, uses simple string replacement
   * In production, integrate with AWS SES templates or a template engine
   */
  async sendTemplatedEmail(
    templateName: string,
    to: string,
    data: Record<string, unknown>
  ): Promise<EmailResponse> {
    // Template definitions (in production, load from database or files)
    const templates: Record<string, { subject: string; html: string }> = {
      welcome: {
        subject: 'Welcome to Field Force CRM',
        html: `
          <h1>Welcome {{name}}!</h1>
          <p>Your account has been created successfully.</p>
          <p>Email: {{email}}</p>
        `,
      },
      passwordReset: {
        subject: 'Reset Your Password',
        html: `
          <h1>Password Reset Request</h1>
          <p>Hi {{name}},</p>
          <p>Click the link below to reset your password:</p>
          <a href="{{resetLink}}">Reset Password</a>
          <p>This link expires in 1 hour.</p>
        `,
      },
      visitReminder: {
        subject: 'Visit Reminder',
        html: `
          <h1>Upcoming Visit</h1>
          <p>Hi {{repName}},</p>
          <p>You have a scheduled visit with {{doctorName}} on {{date}}.</p>
          <p>Location: {{location}}</p>
        `,
      },
    };

    const template = templates[templateName];
    if (!template) {
      return {
        success: false,
        error: `Template '${templateName}' not found`,
      };
    }

    // Simple string replacement (use a proper template engine in production)
    let html = template.html;
    let subject = template.subject;

    for (const [key, value] of Object.entries(data)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      html = html.replace(regex, String(value));
      subject = subject.replace(regex, String(value));
    }

    return this.sendEmail({
      to,
      subject,
      html,
    });
  }

  /**
   * Verify email service connectivity
   */
  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error: unknown) {
      console.error('Email service verification failed:', error);
      return false;
    }
  }
}
