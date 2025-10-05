import { PrismaClient } from '@prisma/client';
import { getPrisma } from '../utils/db';
import { AuthService } from '../services/authService';
import { Bindings } from '../index';

/**
 * Dependency Injection Factory
 * Creates and manages service instances with their dependencies
 * Following hexagonal architecture principles
 */

export interface Dependencies {
  prisma: PrismaClient;
  authService: AuthService;
  // Future services will be added here:
  // storage: IStorageService;
  // email: IEmailService;
  // cache: ICacheService;
  // queue: IQueueService;
}

/**
 * Create dependencies for Cloudflare Workers environment
 * @param env Cloudflare environment bindings
 * @returns Dependency container with all services
 */
export function createDependencies(env: Bindings): Dependencies {
  // Infrastructure layer - Database
  const prisma = getPrisma(env.DATABASE_URL);

  // Service layer - Business logic
  const authService = new AuthService(
    prisma,
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN
  );

  // Future: Infrastructure adapters
  // const storage = new R2StorageService(env.BUCKET, env.CDN_URL);
  // const email = new SESEmailService(env.AWS_SES_KEY, env.AWS_SES_SECRET, 'ap-south-1');
  // const cache = new CloudflareKVCacheService(env.KV, 'app');
  // const queue = new CloudflareQueueService(env.QUEUE);

  return {
    prisma,
    authService,
    // storage,
    // email,
    // cache,
    // queue,
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
