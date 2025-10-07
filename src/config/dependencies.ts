import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../utils/db';
import { AuthService } from '../services/authService';
import { ContactService } from '../services/contactService';
import { VisitService } from '../services/visitService';
import { EmailNotificationService } from '../services/emailNotificationService';
import { Bindings } from '../index';
import { IEmailService } from '../core/ports/IEmailService';
import { ICacheService } from '../core/ports/ICacheService';
import { IStorageService } from '../core/ports/IStorageService';
import { IQueueService } from '../core/ports/IQueueService';
import { logger } from '../utils/logger';
// SESEmailService disabled - nodemailer not compatible with Cloudflare Workers
// import { SESEmailService } from '../infrastructure/email/SESEmailService';
import { MSG91EmailService } from '../infrastructure/email/MSG91EmailService';
import { ResendEmailService } from '../infrastructure/email/ResendEmailService';
import { MailerooEmailService } from '../infrastructure/email/MailerooEmailService';
import { BrevoEmailService } from '../infrastructure/email/BrevoEmailService';
import { AWSSESEmailService } from '../infrastructure/email/AWSSESEmailService';
import { FallbackEmailService } from '../infrastructure/email/FallbackEmailService';
import { CloudflareKVCacheService } from '../infrastructure/cache/CloudflareKVCacheService';
import { R2StorageService } from '../infrastructure/storage/R2StorageService';
// SQS import moved to dynamic import to avoid global scope issues

/**
 * Dependency Injection Factory
 * Creates and manages service instances with their dependencies
 * Following hexagonal architecture principles
 */

export interface Dependencies {
  prisma: PrismaClient;
  authService: AuthService;
  contactService: ContactService;
  visitService: VisitService;
  email: IEmailService;
  emailNotifications: EmailNotificationService;
  cache: ICacheService;
  storage: IStorageService;
  queue?: IQueueService; // Optional: AWS SQS (free tier: 1M requests/month)
  kv: KVNamespace | null; // Cloudflare KV for direct access
}

/**
 * Create dependencies for Cloudflare Workers environment
 * @param env Cloudflare environment bindings
 * @returns Dependency container with all services
 */
export function createDependencies(env: Bindings): Dependencies {
  // Infrastructure layer - Database
  const prisma = getPrisma(env.DATABASE_URL);

  // Infrastructure layer - Cache (must be initialized before email services)
  const cache = new CloudflareKVCacheService(
    env.KV, // KV namespace binding
    'fieldforce-crm'   // Namespace prefix
  );

  // Infrastructure layer - Email with Fallback System
  // Automatically switches between providers based on monthly quotas
  let email: IEmailService;

  // Build list of available email providers
  const providers: Array<{
    name: string;
    service: IEmailService;
    monthlyQuota: number;
  }> = [];

  // Provider 1: Brevo (9,000/month free - 300/day)
  if (env.BREVO_API_KEY && env.BREVO_FROM_EMAIL) {
    providers.push({
      name: 'Brevo',
      service: new BrevoEmailService(
        env.BREVO_API_KEY,
        env.BREVO_FROM_EMAIL,
        env.BREVO_FROM_NAME || 'Field Force CRM'
      ),
      monthlyQuota: 9000,
    });
  }

  // Provider 2: Resend (3,000/month free)
  if (env.RESEND_SMTP_PASSWORD && env.RESEND_FROM_EMAIL) {
    providers.push({
      name: 'Resend',
      service: new ResendEmailService(
        env.RESEND_SMTP_PASSWORD,
        env.RESEND_FROM_EMAIL,
        env.RESEND_FROM_NAME || 'Field Force CRM'
      ),
      monthlyQuota: 3000,
    });
  }

  // Provider 3: Maileroo (3,000/month free)
  if (env.MAILEROO_API_KEY && env.MAILEROO_FROM_EMAIL) {
    providers.push({
      name: 'Maileroo',
      service: new MailerooEmailService(
        env.MAILEROO_API_KEY,
        env.MAILEROO_FROM_EMAIL,
        env.MAILEROO_FROM_NAME || 'Field Force CRM'
      ),
      monthlyQuota: 3000,
    });
  }

  // Provider 4: AWS SES (unlimited, pay-per-use: ~$0.10/1000)
  if (env.AWS_SES_ACCESS_KEY_ID && env.AWS_SES_SECRET_ACCESS_KEY && env.AWS_SES_REGION && env.AWS_SES_FROM_EMAIL) {
    providers.push({
      name: 'AWS SES',
      service: new AWSSESEmailService(
        env.AWS_SES_ACCESS_KEY_ID,
        env.AWS_SES_SECRET_ACCESS_KEY,
        env.AWS_SES_REGION,
        env.AWS_SES_FROM_EMAIL,
        env.AWS_SES_FROM_NAME || 'Field Force CRM'
      ),
      monthlyQuota: 999999, // Effectively unlimited
    });
  }

  // Use fallback system if multiple providers available
  if (providers.length > 1) {
    email = new FallbackEmailService(providers, cache);
    logger.info(`[Dependencies] Fallback Email Service initialized with ${providers.length} providers`, {
      providers: providers.map(p => `${p.name} (${p.monthlyQuota}/month)`),
    });
  } else if (providers.length === 1) {
    // Single provider - use directly
    email = providers[0].service;
    logger.info(`[Dependencies] ${providers[0].name} Email Service initialized (${providers[0].monthlyQuota}/month)`);
  } else {
    // No email service configured
    logger.warn('[Dependencies] No email service configured');
    email = {
      async sendEmail() {
        logger.warn('Email service not configured');
        return { success: false, error: 'Email service not available' };
      },
      async verifyConnection() {
        return false;
      },
    };
  }

  // Infrastructure layer - Storage (Cloudflare R2 - free tier: 10GB storage)
  const storage = new R2StorageService(
    env.BUCKET,  // R2 bucket binding
    env.CDN_URL  // Optional CDN URL for public files
  );

  // Service layer - Business logic
  const authService = new AuthService(
    prisma,
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );

  const contactService = new ContactService(prisma);

  const visitService = new VisitService(prisma);

  // Email notifications service
  const emailNotifications = new EmailNotificationService(
    email,
    env.RESEND_FROM_EMAIL || env.MSG91_EMAIL_FROM || 'noreply@fieldforce.com',
    env.RESEND_FROM_NAME || env.MSG91_EMAIL_FROM_NAME || 'Field Force CRM',
    env.COMPANY_NAME || 'Your Company'
  );

  // Optional: AWS SQS Queue Service (free tier: 1M requests/month)
  // Note: SQS disabled for now due to Cloudflare Workers global scope restrictions
  // AWS SDK initialization causes "Disallowed operation in global scope" error
  // TODO: Implement lazy loading or use Cloudflare Queues instead
  let queue: IQueueService | undefined;

  return {
    prisma,
    authService,
    contactService,
    visitService,
    email,
    emailNotifications,
    cache,
    storage,
    queue,
    kv: env.KV || null,
  };
}

/**
 * For AWS Lambda environment (future)
 * This demonstrates platform portability - just swap implementations
 */
export function createAWSDependencies(env: Record<string, string>): Dependencies {
  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: env.DATABASE_URL,
      },
    },
  });

  const authService = new AuthService(
    prisma,
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );

  // AWS-specific implementations:
  // const storage = new S3StorageService(env.S3_BUCKET, env.S3_REGION);
  // const email = new SESEmailService(env.AWS_SES_KEY, env.AWS_SES_SECRET, env.AWS_REGION);
  // const cache = new RedisCacheService(env.REDIS_URL);
  // const queue = new SQSQueueService(env.SQS_QUEUE_URL);

  // Note: Simplified example - would need full implementation
  return {
    prisma,
    authService,
    contactService: new ContactService(prisma),
    visitService: new VisitService(prisma),
    email: {} as IEmailService,
    emailNotifications: {} as EmailNotificationService,
    cache: {} as ICacheService,
    storage: {} as IStorageService,
    kv: null,
  };
}
