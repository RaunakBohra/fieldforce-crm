import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../utils/db';
import { AuthService } from '../services/authService';
import { ContactService } from '../services/contactService';
import { VisitService } from '../services/visitService';
import { Bindings } from '../index';
import { IEmailService } from '../core/ports/IEmailService';
import { ICacheService } from '../core/ports/ICacheService';
import { IStorageService } from '../core/ports/IStorageService';
import { IQueueService } from '../core/ports/IQueueService';
import { logger } from '../utils/logger';
// SESEmailService disabled - nodemailer not compatible with Cloudflare Workers
// import { SESEmailService } from '../infrastructure/email/SESEmailService';
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
  cache: ICacheService;
  storage: IStorageService;
  queue?: IQueueService; // Optional: AWS SQS (free tier: 1M requests/month)
}

/**
 * Create dependencies for Cloudflare Workers environment
 * @param env Cloudflare environment bindings
 * @returns Dependency container with all services
 */
export function createDependencies(env: Bindings): Dependencies {
  // Infrastructure layer - Database
  const prisma = getPrisma(env.DATABASE_URL);

  // Infrastructure layer - Email (disabled - nodemailer not compatible with CF Workers)
  // TODO: Replace with Cloudflare Email Routing or Resend.com API
  const email: IEmailService = {
    async sendEmail() {
      logger.warn('Email service not configured');
      return { success: false, error: 'Email service not available' };
    },
    async sendTemplatedEmail() {
      logger.warn('Email service not configured');
      return { success: false, error: 'Email service not available' };
    },
    async verifyConnection() {
      return false;
    },
  };

  // Infrastructure layer - Cache (Cloudflare KV - free tier available)
  const cache = new CloudflareKVCacheService(
    env.KV, // KV namespace binding
    'app'   // Namespace prefix
  );

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
    cache,
    storage,
    queue,
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

  return {
    prisma,
    authService,
  };
}
