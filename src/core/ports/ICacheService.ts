/**
 * Cache Service Interface (Port)
 * Platform-agnostic interface for caching operations
 * Implementations: CloudflareKVCacheService, RedisCacheService (AWS), etc.
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds
  namespace?: string; // Optional namespace for key isolation
}

export interface ICacheService {
  /**
   * Get a value from cache
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set a value in cache
   * @param key Cache key
   * @param value Value to cache (will be JSON serialized)
   * @param options Cache options (TTL, namespace)
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete a value from cache
   * @param key Cache key
   */
  delete(key: string): Promise<void>;

  /**
   * Check if a key exists in cache
   * @param key Cache key
   * @returns true if key exists and not expired
   */
  has(key: string): Promise<boolean>;

  /**
   * Delete all keys matching a pattern (useful for invalidation)
   * @param pattern Key pattern (e.g., "user:*")
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Increment a numeric value (useful for rate limiting, counters)
   * @param key Cache key
   * @param amount Amount to increment (default: 1)
   * @param options Cache options
   * @returns New value after increment
   */
  increment(key: string, amount?: number, options?: CacheOptions): Promise<number>;
}
