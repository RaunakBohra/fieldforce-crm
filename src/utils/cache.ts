/**
 * Cache utility for Cloudflare KV
 * Provides simple caching with TTL support
 */

export interface CacheOptions {
  ttl?: number; // Time to live in seconds (default: 5 minutes)
}

/**
 * Get data from cache or execute function if not cached
 * @param kv - Cloudflare KV namespace
 * @param key - Cache key
 * @param fn - Function to execute if cache miss
 * @param options - Cache options
 * @returns Cached or fresh data
 */
export async function getOrSetCache<T>(
  kv: KVNamespace | null,
  key: string,
  fn: () => Promise<T>,
  options: CacheOptions = {}
): Promise<T> {
  const { ttl = 300 } = options; // Default 5 minutes

  // If no KV namespace, skip caching
  if (!kv) {
    return fn();
  }

  try {
    // Try to get from cache
    const cached = await kv.get(key, 'json');
    if (cached !== null) {
      return cached as T;
    }
  } catch (error) {
    console.error('Cache read error:', error);
    // Continue to fetch fresh data
  }

  // Cache miss or error - execute function
  const data = await fn();

  // Store in cache (async, don't wait)
  try {
    await kv.put(key, JSON.stringify(data), {
      expirationTtl: ttl,
    });
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't fail the request if cache write fails
  }

  return data;
}

/**
 * Invalidate cache for a specific key
 * @param kv - Cloudflare KV namespace
 * @param key - Cache key to invalidate
 */
export async function invalidateCache(
  kv: KVNamespace | null,
  key: string
): Promise<void> {
  if (!kv) return;

  try {
    await kv.delete(key);
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
}

/**
 * Invalidate multiple cache keys by pattern
 * @param kv - Cloudflare KV namespace
 * @param pattern - Pattern to match keys (e.g., "stats:user:*")
 */
export async function invalidateCachePattern(
  kv: KVNamespace | null,
  pattern: string
): Promise<void> {
  if (!kv) return;

  try {
    // KV doesn't support pattern deletion directly
    // For now, we'll invalidate specific known keys
    // In production, you might want to maintain a key registry
    const keys = pattern.split(':');
    const baseKey = keys[0];

    // List and delete matching keys
    const list = await kv.list({ prefix: baseKey });
    const deletePromises = list.keys.map((key) => kv.delete(key.name));
    await Promise.all(deletePromises);
  } catch (error) {
    console.error('Cache pattern invalidation error:', error);
  }
}

/**
 * Generate cache key for user-specific stats
 * @param type - Stats type (orders, visits, contacts)
 * @param userId - User ID
 * @returns Cache key
 */
export function getUserStatsCacheKey(type: string, userId: string): string {
  return `stats:${type}:${userId}`;
}
