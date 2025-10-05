/**
 * AWS SES Email Service Implementation
 *
 * Production-ready implementation of IEmailService for AWS SES
 * Works on both Cloudflare Workers and AWS Lambda
 */

import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import {
  IEmailService,
  EmailParams,
  TemplateEmailParams,
  EmailResult,
} from '../../core/ports/IEmailService';

export class SESEmailService implements IEmailService {
  private ses: SESClient;
  private defaultFrom: string;
  private templates: Map<string, EmailTemplateConfig>;

  constructor(
    accessKeyId: string,
    secretAccessKey: string,
    region: string = 'ap-south-1',
    defaultFrom: string = 'noreply@yourapp.com'
  ) {
    this.ses = new SESClient({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });
    this.defaultFrom = defaultFrom;
    this.templates = this.initializeTemplates();
  }

  async sendEmail(params: EmailParams): Promise<EmailResult> {
    try {
      const command = new SendEmailCommand({
        Source: params.from || this.defaultFrom,
        Destination: {
          ToAddresses: Array.isArray(params.to) ? params.to : [params.to],
          CcAddresses: params.cc
            ? Array.isArray(params.cc)
              ? params.cc
              : [params.cc]
            : undefined,
          BccAddresses: params.bcc
            ? Array.isArray(params.bcc)
              ? params.bcc
              : [params.bcc]
            : undefined,
        },
        Message: {
          Subject: {
            Data: params.subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: params.html
              ? {
                  Data: params.html,
                  Charset: 'UTF-8',
                }
              : undefined,
            Text: params.text
              ? {
                  Data: params.text,
                  Charset: 'UTF-8',
                }
              : undefined,
          },
        },
        ReplyToAddresses: params.replyTo ? [params.replyTo] : undefined,
      });

      const result = await this.ses.send(command);

      return {
        messageId: result.MessageId || 'unknown',
        success: true,
      };
    } catch (error) {
      console.error('SES send error:', error);
      return {
        messageId: '',
        success: false,
        error: error.message,
      };
    }
  }

  async sendTemplateEmail(params: TemplateEmailParams): Promise<EmailResult> {
    const template = this.templates.get(params.template);

    if (!template) {
      return {
        messageId: '',
        success: false,
        error: `Template not found: ${params.template}`,
      };
    }

    const html = this.renderTemplate(template.html, params.variables);
    const text = template.text
      ? this.renderTemplate(template.text, params.variables)
      : undefined;

    return this.sendEmail({
      to: params.to,
      from: params.from,
      subject: this.renderTemplate(template.subject, params.variables),
      html,
      text,
      cc: params.cc,
      bcc: params.bcc,
    });
  }

  async sendBatch(emails: EmailParams[]): Promise<EmailResult[]> {
    // SES doesn't have native batch API
    // Send in parallel (max 10 at a time to avoid rate limits)
    const chunkSize = 10;
    const results: EmailResult[] = [];

    for (let i = 0; i < emails.length; i += chunkSize) {
      const chunk = emails.slice(i, i + chunkSize);
      const chunkResults = await Promise.all(
        chunk.map((email) => this.sendEmail(email))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private renderTemplate(template: string, variables: Record<string, any>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      rendered = rendered.replace(regex, String(value));
    }

    return rendered;
  }

  private initializeTemplates(): Map<string, EmailTemplateConfig> {
    return new Map([
      [
        'welcome',
        {
          subject: 'Welcome to Field Force CRM - {{name}}',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Welcome to Field Force CRM!</h2>
                  <p>Hi {{name}},</p>
                  <p>Your account has been created successfully.</p>
                  <p><strong>Email:</strong> {{email}}</p>
                  <p><strong>Role:</strong> {{role}}</p>
                  <p>Get started by logging in at: <a href="{{loginUrl}}" style="color: #0d9488;">{{loginUrl}}</a></p>
                  <p>Best regards,<br>Field Force CRM Team</p>
                </div>
              </body>
            </html>
          `,
          text: `Welcome to Field Force CRM!\n\nHi {{name}},\n\nYour account has been created successfully.\n\nEmail: {{email}}\nRole: {{role}}\n\nGet started by logging in at: {{loginUrl}}\n\nBest regards,\nField Force CRM Team`,
        },
      ],
      [
        'password-reset',
        {
          subject: 'Password Reset Request',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Password Reset Request</h2>
                  <p>Hi {{name}},</p>
                  <p>You requested to reset your password. Click the link below to proceed:</p>
                  <p><a href="{{resetUrl}}" style="background: #0d9488; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a></p>
                  <p>This link will expire in 1 hour.</p>
                  <p>If you didn't request this, please ignore this email.</p>
                  <p>Best regards,<br>Field Force CRM Team</p>
                </div>
              </body>
            </html>
          `,
        },
      ],
      [
        'payment-reminder',
        {
          subject: 'Payment Reminder - Order #{{orderNumber}}',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #d97706;">Payment Reminder</h2>
                  <p>Dear {{contactName}},</p>
                  <p>This is a friendly reminder for the following pending payment:</p>
                  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
                    <tr style="background: #f3f4f6;">
                      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Order Number:</strong></td>
                      <td style="padding: 10px; border: 1px solid #ddd;">{{orderNumber}}</td>
                    </tr>
                    <tr>
                      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Amount Due:</strong></td>
                      <td style="padding: 10px; border: 1px solid #ddd;">₹{{amount}}</td>
                    </tr>
                    <tr style="background: #f3f4f6;">
                      <td style="padding: 10px; border: 1px solid #ddd;"><strong>Due Date:</strong></td>
                      <td style="padding: 10px; border: 1px solid #ddd;">{{dueDate}}</td>
                    </tr>
                  </table>
                  <p>Please process the payment at your earliest convenience.</p>
                  <p>Thank you for your business!</p>
                  <p>Best regards,<br>{{companyName}}</p>
                </div>
              </body>
            </html>
          `,
        },
      ],
      [
        'order-confirmation',
        {
          subject: 'Order Confirmation - #{{orderNumber}}',
          html: `
            <html>
              <body style="font-family: Arial, sans-serif; line-height: 1.6;">
                <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
                  <h2 style="color: #0d9488;">Order Confirmed!</h2>
                  <p>Dear {{contactName}},</p>
                  <p>Your order has been confirmed and is being processed.</p>
                  <p><strong>Order Number:</strong> {{orderNumber}}</p>
                  <p><strong>Total Amount:</strong> ₹{{totalAmount}}</p>
                  <p>We'll notify you once your order is ready for delivery.</p>
                  <p>Thank you for your order!</p>
                  <p>Best regards,<br>{{companyName}}</p>
                </div>
              </body>
            </html>
          `,
        },
      ],
    ]);
  }
}

interface EmailTemplateConfig {
  subject: string;
  html: string;
  text?: string;
}
