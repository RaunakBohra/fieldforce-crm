/**
 * Cache Service Interface
 *
 * Platform-agnostic interface for key-value caching
 * Implementations: Cloudflare KV, Redis, Memcached
 */

export interface ICacheService {
  /**
   * Get value from cache
   * @param key - Cache key
   * @returns Cached value or null if not found
   */
  get<T = any>(key: string): Promise<T | null>;

  /**
   * Set value in cache
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in seconds (optional)
   */
  set(key: string, value: any, ttl?: number): Promise<void>;

  /**
   * Delete value from cache
   * @param key - Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if key exists
   * @param key - Cache key
   */
  has(key: string): Promise<boolean>;

  /**
   * Set value with expiry
   * @param key - Cache key
   * @param value - Value to cache
   * @param expiresAt - Expiry timestamp
   */
  setWithExpiry(key: string, value: any, expiresAt: Date): Promise<void>;

  /**
   * Increment counter
   * @param key - Cache key
   * @param amount - Amount to increment (default: 1)
   */
  increment(key: string, amount?: number): Promise<number>;

  /**
   * Get multiple values
   * @param keys - Array of cache keys
   */
  getMany<T = any>(keys: string[]): Promise<(T | null)[]>;

  /**
   * Set multiple values
   * @param entries - Key-value pairs
   * @param ttl - Time to live in seconds (optional)
   */
  setMany(entries: Record<string, any>, ttl?: number): Promise<void>;

  /**
   * Clear all cache (use with caution!)
   */
  flush(): Promise<void>;
}

export interface CacheOptions {
  ttl?: number;
  namespace?: string;
}
