import { Context, Next } from 'hono';
import { logger } from '../utils/logger';

/**
 * Rate Limiting Middleware
 * Simple in-memory rate limiter for authentication endpoints
 * In production with multiple workers, use Cloudflare KV or Redis
 */

interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  max: number; // Max requests per window
  message?: string; // Custom error message
  keyGenerator?: (c: Context) => string; // Custom key generator (default: IP)
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (use Cloudflare KV or Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Clean up expired entries on-demand
 * Called during rate limit check to avoid memory leaks
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Rate limiting middleware factory
 * @param config Rate limit configuration
 * @returns Hono middleware function
 */
export function rateLimiter(config: RateLimitConfig) {
  const {
    windowMs,
    max,
    message = 'Too many requests, please try again later',
    keyGenerator = (c: Context) => {
      // Try to get IP from various headers (for proxies)
      return (
        c.req.header('cf-connecting-ip') || // Cloudflare
        c.req.header('x-forwarded-for')?.split(',')[0] ||
        c.req.header('x-real-ip') ||
        'unknown'
      );
    },
  } = config;

  return async (c: Context, next: Next) => {
    const key = `ratelimit:${c.req.path}:${keyGenerator(c)}`;
    const now = Date.now();

    // Clean up expired entries occasionally (10% chance)
    if (Math.random() < 0.1) {
      cleanupExpiredEntries();
    }

    // Get current rate limit entry
    let entry = rateLimitStore.get(key);

    // Create new entry if doesn't exist or window expired
    if (!entry || now > entry.resetTime) {
      entry = {
        count: 0,
        resetTime: now + windowMs,
      };
      rateLimitStore.set(key, entry);
    }

    // Increment request count
    entry.count++;

    // Add rate limit headers
    c.header('X-RateLimit-Limit', max.toString());
    c.header('X-RateLimit-Remaining', Math.max(0, max - entry.count).toString());
    c.header('X-RateLimit-Reset', new Date(entry.resetTime).toISOString());

    // Check if rate limit exceeded
    if (entry.count > max) {
      const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
      c.header('Retry-After', retryAfter.toString());

      logger.warn('Rate limit exceeded', {
        path: c.req.path,
        key: keyGenerator(c),
        count: entry.count,
        max,
      });

      return c.json(
        {
          success: false,
          error: message,
          retryAfter,
        },
        429
      );
    }

    await next();
  };
}

/**
 * Pre-configured rate limiters for common use cases
 */

// Strict rate limit for login endpoint (prevent brute force)
export const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per 15 minutes
  message: 'Too many login attempts. Please try again in 15 minutes.',
});

// Moderate rate limit for signup endpoint (prevent spam)
export const signupRateLimiter = rateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 signups per hour
  message: 'Too many signup attempts. Please try again in 1 hour.',
});

// General API rate limit (prevent abuse)
export const apiRateLimiter = rateLimiter({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many API requests. Please slow down.',
});
