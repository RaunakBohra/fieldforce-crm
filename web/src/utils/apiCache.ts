/**
 * API Response Cache with Stale-While-Revalidate Pattern
 * Provides lightning-fast dashboard loads by serving cached data immediately
 * while fetching fresh data in the background
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

interface CacheConfig {
  ttl: number; // Time to live in milliseconds
  staleTime: number; // Time after which data is considered stale but still usable
}

const DEFAULT_CONFIG: CacheConfig = {
  ttl: 5 * 60 * 1000, // 5 minutes
  staleTime: 2 * 60 * 1000, // 2 minutes
};

class ApiCache {
  private cache = new Map<string, CacheEntry<any>>();
  private pendingRequests = new Map<string, Promise<any>>();

  /**
   * Get cached data if available, otherwise fetch fresh data
   * Implements stale-while-revalidate: returns stale data immediately
   * and triggers background refresh
   */
  async get<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<T> {
    const { ttl, staleTime } = { ...DEFAULT_CONFIG, ...config };
    const now = Date.now();
    const cached = this.cache.get(key);

    // Check if we have a pending request for this key
    const pending = this.pendingRequests.get(key);
    if (pending) {
      // If there's already a request in flight, wait for it
      return pending;
    }

    // If we have fresh data, return it immediately
    if (cached && now < cached.expiresAt) {
      return cached.data;
    }

    // If we have stale data, return it and fetch fresh in background
    if (cached && now < cached.timestamp + ttl) {
      // Return stale data immediately
      const staleData = cached.data;

      // Fetch fresh data in background (don't await)
      this.fetchAndCache(key, fetcher, ttl, staleTime).catch(console.error);

      return staleData;
    }

    // No cache or expired - fetch fresh data and wait for it
    return this.fetchAndCache(key, fetcher, ttl, staleTime);
  }

  /**
   * Fetch data and update cache
   */
  private async fetchAndCache<T>(
    key: string,
    fetcher: () => Promise<T>,
    _ttl: number,
    staleTime: number
  ): Promise<T> {
    const promise = fetcher();
    this.pendingRequests.set(key, promise);

    try {
      const data = await promise;
      const now = Date.now();

      this.cache.set(key, {
        data,
        timestamp: now,
        expiresAt: now + staleTime,
      });

      return data;
    } finally {
      this.pendingRequests.delete(key);
    }
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Invalidate all cache entries matching a pattern
   */
  invalidatePattern(pattern: RegExp): void {
    for (const key of this.cache.keys()) {
      if (pattern.test(key)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.pendingRequests.clear();
  }

  /**
   * Prefetch data and store in cache
   */
  async prefetch<T>(
    key: string,
    fetcher: () => Promise<T>,
    config: Partial<CacheConfig> = {}
  ): Promise<void> {
    try {
      await this.get(key, fetcher, config);
    } catch (error) {
      console.error(`Prefetch failed for ${key}:`, error);
    }
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Export singleton instance
export const apiCache = new ApiCache();

// Cache key generators for common endpoints
export const cacheKeys = {
  dashboardStats: () => 'dashboard:stats',
  recentActivity: () => 'dashboard:activity',
  topPerformers: () => 'dashboard:performers',
  territoryPerformance: () => 'dashboard:territory',
  upcomingVisits: (days: number) => `contacts:upcoming:${days}`,
  overdueVisits: () => 'contacts:overdue',
  contacts: (page: number, limit: number, filters?: string) =>
    `contacts:list:${page}:${limit}:${filters || 'all'}`,
  visits: (page: number, limit: number) => `visits:list:${page}:${limit}`,
  orders: (page: number, limit: number) => `orders:list:${page}:${limit}`,
  payments: (page: number, limit: number) => `payments:list:${page}:${limit}`,
};

// Helper to invalidate dashboard cache
export const invalidateDashboardCache = () => {
  apiCache.invalidatePattern(/^dashboard:/);
  apiCache.invalidatePattern(/^contacts:(upcoming|overdue)/);
};

// Helper to invalidate all cache on logout
export const clearAllCache = () => {
  apiCache.clear();
};
