/**
 * Redis Cache Service Implementation
 *
 * Production-ready implementation of ICacheService for Redis
 * Works with AWS Elasticache, Upstash, or any Redis instance
 */

import { ICacheService } from '../../core/ports/ICacheService';

// Using ioredis for better TypeScript support
import Redis from 'ioredis';

export class RedisCacheService implements ICacheService {
  private redis: Redis;
  private namespace: string;

  constructor(
    redisUrl: string | Redis.RedisOptions,
    namespace: string = 'app'
  ) {
    this.redis =
      typeof redisUrl === 'string'
        ? new Redis(redisUrl)
        : new Redis(redisUrl);
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.redis.get(this.getKey(key));

      if (value === null) {
        return null;
      }

      return JSON.parse(value) as T;
    } catch (error) {
      console.error('Redis get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      const serialized = JSON.stringify(value);

      if (ttl) {
        await this.redis.setex(this.getKey(key), ttl, serialized);
      } else {
        await this.redis.set(this.getKey(key), serialized);
      }
    } catch (error) {
      console.error('Redis set error:', error);
      throw new Error(`Failed to set cache: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.redis.del(this.getKey(key));
    } catch (error) {
      console.error('Redis delete error:', error);
      throw new Error(`Failed to delete cache: ${error.message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const exists = await this.redis.exists(this.getKey(key));
      return exists === 1;
    } catch (error) {
      return false;
    }
  }

  async setWithExpiry(key: string, value: any, expiresAt: Date): Promise<void> {
    const ttl = Math.floor((expiresAt.getTime() - Date.now()) / 1000);
    await this.set(key, value, ttl);
  }

  async increment(key: string, amount: number = 1): Promise<number> {
    try {
      return await this.redis.incrby(this.getKey(key), amount);
    } catch (error) {
      console.error('Redis increment error:', error);
      throw new Error(`Failed to increment: ${error.message}`);
    }
  }

  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      if (keys.length === 0) {
        return [];
      }

      const redisKeys = keys.map((k) => this.getKey(k));
      const values = await this.redis.mget(...redisKeys);

      return values.map((value) => {
        if (value === null) {
          return null;
        }
        try {
          return JSON.parse(value) as T;
        } catch {
          return null;
        }
      });
    } catch (error) {
      console.error('Redis getMany error:', error);
      throw new Error(`Failed to get many: ${error.message}`);
    }
  }

  async setMany(entries: Record<string, any>, ttl?: number): Promise<void> {
    try {
      const pipeline = this.redis.pipeline();

      for (const [key, value] of Object.entries(entries)) {
        const serialized = JSON.stringify(value);
        const redisKey = this.getKey(key);

        if (ttl) {
          pipeline.setex(redisKey, ttl, serialized);
        } else {
          pipeline.set(redisKey, serialized);
        }
      }

      await pipeline.exec();
    } catch (error) {
      console.error('Redis setMany error:', error);
      throw new Error(`Failed to set many: ${error.message}`);
    }
  }

  async flush(): Promise<void> {
    try {
      // Use scan to find and delete keys with namespace
      const pattern = `${this.namespace}:*`;
      const stream = this.redis.scanStream({
        match: pattern,
        count: 100,
      });

      const pipeline = this.redis.pipeline();
      let count = 0;

      stream.on('data', (keys: string[]) => {
        for (const key of keys) {
          pipeline.del(key);
          count++;
        }
      });

      await new Promise((resolve, reject) => {
        stream.on('end', () => {
          pipeline.exec().then(resolve).catch(reject);
        });
        stream.on('error', reject);
      });

      console.log(`Flushed ${count} keys from namespace: ${this.namespace}`);
    } catch (error) {
      console.error('Redis flush error:', error);
      throw new Error(`Failed to flush cache: ${error.message}`);
    }
  }

  /**
   * Close Redis connection (call on shutdown)
   */
  async disconnect(): Promise<void> {
    await this.redis.quit();
  }
}
