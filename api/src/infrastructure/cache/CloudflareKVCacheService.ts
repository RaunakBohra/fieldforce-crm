/**
 * Cloudflare KV Cache Service Implementation
 *
 * Production-ready implementation of ICacheService for Cloudflare KV
 */

import { ICacheService } from '../../core/ports/ICacheService';

export class CloudflareKVCacheService implements ICacheService {
  private kv: KVNamespace;
  private namespace: string;

  constructor(kv: KVNamespace, namespace: string = 'app') {
    this.kv = kv;
    this.namespace = namespace;
  }

  private getKey(key: string): string {
    return `${this.namespace}:${key}`;
  }

  async get<T = any>(key: string): Promise<T | null> {
    try {
      const value = await this.kv.get(this.getKey(key), 'json');
      return value as T | null;
    } catch (error) {
      console.error('KV get error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      await this.kv.put(this.getKey(key), JSON.stringify(value), {
        expirationTtl: ttl,
      });
    } catch (error) {
      console.error('KV set error:', error);
      throw new Error(`Failed to set cache: ${error.message}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await this.kv.delete(this.getKey(key));
    } catch (error) {
      console.error('KV delete error:', error);
      throw new Error(`Failed to delete cache: ${error.message}`);
    }
  }

  async has(key: string): Promise<boolean> {
    try {
      const value = await this.kv.get(this.getKey(key));
      return value !== null;
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
      const current = (await this.get<number>(key)) || 0;
      const newValue = current + amount;
      await this.set(key, newValue);
      return newValue;
    } catch (error) {
      console.error('KV increment error:', error);
      throw new Error(`Failed to increment: ${error.message}`);
    }
  }

  async getMany<T = any>(keys: string[]): Promise<(T | null)[]> {
    try {
      return Promise.all(keys.map((key) => this.get<T>(key)));
    } catch (error) {
      console.error('KV getMany error:', error);
      throw new Error(`Failed to get many: ${error.message}`);
    }
  }

  async setMany(entries: Record<string, any>, ttl?: number): Promise<void> {
    try {
      await Promise.all(
        Object.entries(entries).map(([key, value]) => this.set(key, value, ttl))
      );
    } catch (error) {
      console.error('KV setMany error:', error);
      throw new Error(`Failed to set many: ${error.message}`);
    }
  }

  async flush(): Promise<void> {
    // KV doesn't support flush all
    // Would need to maintain a list of keys separately
    console.warn('KV flush not implemented - use with caution');
  }
}
