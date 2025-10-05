/**
 * Dependency Injection Factory
 *
 * Creates platform-specific implementations of service interfaces
 * Enables easy switching between Cloudflare, AWS, or other platforms
 */

import { IStorageService } from '../core/ports/IStorageService';
import { IQueueService, QueueName } from '../core/ports/IQueueService';
import { IEmailService } from '../core/ports/IEmailService';
import { ICacheService } from '../core/ports/ICacheService';

// Cloudflare implementations
import { R2StorageService } from '../infrastructure/storage/R2StorageService';
import { CloudflareQueueService } from '../infrastructure/queues/CloudflareQueueService';
import { CloudflareKVCacheService } from '../infrastructure/cache/CloudflareKVCacheService';

// AWS implementations
import { S3StorageService } from '../infrastructure/storage/S3StorageService';
import { SQSQueueService } from '../infrastructure/queues/SQSQueueService';
import { RedisCacheService } from '../infrastructure/cache/RedisCacheService';

// Shared implementations
import { SESEmailService } from '../infrastructure/email/SESEmailService';

export type Platform = 'cloudflare' | 'aws' | 'local';

export interface Dependencies {
  storage: IStorageService;
  queue: IQueueService;
  email: IEmailService;
  cache: ICacheService;
}

/**
 * Cloudflare environment bindings
 */
export interface CloudflareEnv {
  // R2 Storage
  BUCKET: R2Bucket;

  // KV Cache
  KV: KVNamespace;

  // Queues
  EMAIL_QUEUE: Queue;
  PAYMENT_REMINDERS_QUEUE: Queue;
  SMS_QUEUE: Queue;
  WHATSAPP_QUEUE: Queue;
  ANALYTICS_EVENTS_QUEUE: Queue;

  // Secrets
  DATABASE_URL: string;
  JWT_SECRET: string;
  AWS_SES_KEY: string;
  AWS_SES_SECRET: string;

  // Config
  ENVIRONMENT: string;
  CDN_URL: string;
}

/**
 * AWS environment variables
 */
export interface AWSEnv {
  // S3
  AWS_S3_BUCKET: string;
  AWS_REGION: string;
  AWS_ACCESS_KEY_ID: string;
  AWS_SECRET_ACCESS_KEY: string;

  // SQS Queue URLs
  EMAIL_QUEUE_URL: string;
  PAYMENT_REMINDERS_QUEUE_URL: string;
  SMS_QUEUE_URL: string;
  WHATSAPP_QUEUE_URL: string;
  ANALYTICS_EVENTS_QUEUE_URL: string;

  // Redis/Elasticache
  REDIS_URL: string;

  // SES
  AWS_SES_KEY: string;
  AWS_SES_SECRET: string;

  // Database
  DATABASE_URL: string;
  JWT_SECRET: string;

  // Config
  ENVIRONMENT: string;
  CDN_URL?: string;
}

/**
 * Create dependencies for Cloudflare Workers
 */
export function createCloudfareDependencies(env: CloudflareEnv): Dependencies {
  // Storage: R2
  const storage = new R2StorageService(env.BUCKET, env.CDN_URL);

  // Queue: Cloudflare Queues
  const queue = new CloudflareQueueService({
    'email-queue': env.EMAIL_QUEUE,
    'payment-reminders': env.PAYMENT_REMINDERS_QUEUE,
    'sms-queue': env.SMS_QUEUE,
    'whatsapp-queue': env.WHATSAPP_QUEUE,
    'analytics-events': env.ANALYTICS_EVENTS_QUEUE,
  });

  // Email: AWS SES (works everywhere)
  const email = new SESEmailService(
    env.AWS_SES_KEY,
    env.AWS_SES_SECRET,
    'ap-south-1'
  );

  // Cache: Cloudflare KV
  const cache = new CloudflareKVCacheService(env.KV, 'app');

  return {
    storage,
    queue,
    email,
    cache,
  };
}

/**
 * Create dependencies for AWS Lambda
 */
export function createAWSDependencies(env: AWSEnv): Dependencies {
  // Storage: S3
  const storage = new S3StorageService(
    env.AWS_S3_BUCKET,
    env.AWS_REGION,
    env.AWS_ACCESS_KEY_ID,
    env.AWS_SECRET_ACCESS_KEY,
    env.CDN_URL
  );

  // Queue: SQS
  const queue = new SQSQueueService(
    env.AWS_REGION,
    {
      'email-queue': env.EMAIL_QUEUE_URL,
      'payment-reminders': env.PAYMENT_REMINDERS_QUEUE_URL,
      'sms-queue': env.SMS_QUEUE_URL,
      'whatsapp-queue': env.WHATSAPP_QUEUE_URL,
      'analytics-events': env.ANALYTICS_EVENTS_QUEUE_URL,
    },
    env.AWS_ACCESS_KEY_ID,
    env.AWS_SECRET_ACCESS_KEY
  );

  // Email: AWS SES (same as Cloudflare)
  const email = new SESEmailService(
    env.AWS_SES_KEY,
    env.AWS_SES_SECRET,
    env.AWS_REGION
  );

  // Cache: Redis (Elasticache)
  const cache = new RedisCacheService(env.REDIS_URL, 'app');

  return {
    storage,
    queue,
    email,
    cache,
  };
}

/**
 * Create dependencies for local development
 * Uses minimal implementations for testing
 */
export function createLocalDependencies(): Dependencies {
  // For local dev, use in-memory or mock implementations
  // This is just a placeholder - implement as needed

  return {
    storage: new MockStorageService(),
    queue: new MockQueueService(),
    email: new MockEmailService(),
    cache: new MockCacheService(),
  };
}

/**
 * Auto-detect platform and create dependencies
 */
export function createDependencies(env: any): Dependencies {
  // Detect platform by environment variables
  if (env.BUCKET && env.KV) {
    // Cloudflare Workers environment
    return createCloudfareDependencies(env as CloudflareEnv);
  } else if (env.AWS_S3_BUCKET && env.REDIS_URL) {
    // AWS Lambda environment
    return createAWSDependencies(env as AWSEnv);
  } else {
    // Local development
    return createLocalDependencies();
  }
}

// Mock implementations for local development
class MockStorageService implements IStorageService {
  async uploadFile() {
    return 'http://localhost:8787/mock-file.jpg';
  }
  async deleteFile() {}
  async getSignedUrl() {
    return 'http://localhost:8787/mock-signed-url';
  }
  getPublicUrl(key: string) {
    return `http://localhost:8787/${key}`;
  }
  async fileExists() {
    return true;
  }
  async listFiles() {
    return [];
  }
}

class MockQueueService implements IQueueService {
  async sendMessage(queueName: QueueName, message: any) {
    console.log(`[Mock Queue] ${queueName}:`, message);
  }
  async sendBatch(queueName: QueueName, messages: any[]) {
    console.log(`[Mock Queue Batch] ${queueName}:`, messages.length, 'messages');
  }
  async scheduleMessage(queueName: QueueName, message: any, delaySeconds: number) {
    console.log(
      `[Mock Queue Schedule] ${queueName} (delay ${delaySeconds}s):`,
      message
    );
  }
}

class MockEmailService implements IEmailService {
  async sendEmail(params: any) {
    console.log('[Mock Email]', params);
    return { messageId: 'mock-123', success: true };
  }
  async sendTemplateEmail(params: any) {
    console.log('[Mock Template Email]', params);
    return { messageId: 'mock-123', success: true };
  }
  async sendBatch(emails: any[]) {
    console.log('[Mock Email Batch]', emails.length, 'emails');
    return emails.map(() => ({ messageId: 'mock-123', success: true }));
  }
}

class MockCacheService implements ICacheService {
  private cache = new Map<string, any>();

  async get<T>(key: string): Promise<T | null> {
    return this.cache.get(key) || null;
  }
  async set(key: string, value: any) {
    this.cache.set(key, value);
  }
  async delete(key: string) {
    this.cache.delete(key);
  }
  async has(key: string) {
    return this.cache.has(key);
  }
  async setWithExpiry(key: string, value: any) {
    this.cache.set(key, value);
  }
  async increment(key: string, amount: number = 1) {
    const current = (this.cache.get(key) as number) || 0;
    const newValue = current + amount;
    this.cache.set(key, newValue);
    return newValue;
  }
  async getMany<T>(keys: string[]) {
    return keys.map((k) => this.cache.get(k) || null);
  }
  async setMany(entries: Record<string, any>) {
    for (const [key, value] of Object.entries(entries)) {
      this.cache.set(key, value);
    }
  }
  async flush() {
    this.cache.clear();
  }
}
