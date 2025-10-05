import { ICacheService, CacheOptions } from '../../core/ports/ICacheService';

/**
 * Cloudflare KV Cache Service Implementation
 * Implements ICacheService using Cloudflare Workers KV
 * Platform: Cloudflare Workers
 */
export class CloudflareKVCacheService implements ICacheService {
  constructor(
    private kv: KVNamespace,
    private namespace: string = 'app'
  ) {}

  /**
   * Generate namespaced key
   */
  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  /**
   * Get a value from KV cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(this.getKey(key), 'json');
      return value as T | null;
    } catch (error: unknown) {
      console.error('KV get error:', error);
      return null;
    }
  }

  /**
   * Set a value in KV cache
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const kvOptions: KVNamespacePutOptions = {};

      if (options?.ttl) {
        kvOptions.expirationTtl = options.ttl;
      }

      await this.kv.put(
        this.getKey(key),
        JSON.stringify(value),
        kvOptions
      );
    } catch (error: unknown) {
      console.error('KV set error:', error);
      throw error;
    }
  }

  /**
   * Delete a value from KV cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(this.getKey(key));
    } catch (error: unknown) {
      console.error('KV delete error:', error);
      throw error;
    }
  }

  /**
   * Check if a key exists in KV cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.kv.get(this.getKey(key));
      return value !== null;
    } catch (error: unknown) {
      console.error('KV has error:', error);
      return false;
    }
  }

  /**
   * Delete all keys matching a pattern
   * Note: KV doesn't support pattern matching natively
   * This is a basic implementation using list + delete
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      // Convert pattern to prefix (e.g., "user:*" -> "user:")
      const prefix = this.getKey(pattern.replace('*', ''));

      let count = 0;
      let cursor: string | undefined;

      do {
        const list = await this.kv.list({ prefix, cursor });

        for (const key of list.keys) {
          await this.kv.delete(key.name);
          count++;
        }

        cursor = list.cursor;
      } while (cursor);

      return count;
    } catch (error: unknown) {
      console.error('KV deletePattern error:', error);
      return 0;
    }
  }

  /**
   * Increment a numeric value
   * KV doesn't support atomic increment, so this is a basic implementation
   * For production, consider using Durable Objects for atomic operations
   */
  async increment(key: string, amount: number = 1, options?: CacheOptions): Promise<number> {
    try {
      const current = await this.get<number>(key);
      const newValue = (current || 0) + amount;
      await this.set(key, newValue, options);
      return newValue;
    } catch (error: unknown) {
      console.error('KV increment error:', error);
      throw error;
    }
  }
}
