import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../utils/db';
import { AuthService } from '../services/authService';
import { ContactService } from '../services/contactService';
import { Bindings } from '../index';
import { IEmailService } from '../core/ports/IEmailService';
import { ICacheService } from '../core/ports/ICacheService';
import { IStorageService } from '../core/ports/IStorageService';
import { IQueueService } from '../core/ports/IQueueService';
import { SESEmailService } from '../infrastructure/email/SESEmailService';
import { CloudflareKVCacheService } from '../infrastructure/cache/CloudflareKVCacheService';
import { R2StorageService } from '../infrastructure/storage/R2StorageService';
import { SQSQueueService } from '../infrastructure/queues/SQSQueueService';

/**
 * Dependency Injection Factory
 * Creates and manages service instances with their dependencies
 * Following hexagonal architecture principles
 */

export interface Dependencies {
  prisma: PrismaClient;
  authService: AuthService;
  contactService: ContactService;
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

  // Infrastructure layer - Email (AWS SES via SMTP)
  const email = new SESEmailService(
    env.AWS_SES_SMTP_HOST || 'email-smtp.ap-south-1.amazonaws.com',
    parseInt(env.AWS_SES_SMTP_PORT || '587', 10),
    env.AWS_SES_SMTP_USER || '',
    env.AWS_SES_SMTP_PASSWORD || '',
    env.EMAIL_FROM || 'noreply@fieldforce.com'
  );

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

  // Optional: AWS SQS Queue Service (free tier: 1M requests/month)
  let queue: IQueueService | undefined;
  if (env.AWS_SQS_REGION && env.AWS_SQS_QUEUE_URLS) {
    try {
      const queueUrls = JSON.parse(env.AWS_SQS_QUEUE_URLS);
      queue = new SQSQueueService(env.AWS_SQS_REGION, queueUrls);
    } catch (error: unknown) {
      console.warn('Failed to initialize SQS queue service:', error);
    }
  }

  return {
    prisma,
    authService,
    contactService,
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
