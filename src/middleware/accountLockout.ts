import { Context } from 'hono';
import { logger } from '../utils/logger';

/**
 * Account Lockout Middleware (VULN-011 Fix)
 * Prevents brute-force attacks by locking accounts after 5 failed login attempts
 * Uses Cloudflare KV for distributed lockout tracking
 */

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 30 * 60 * 1000; // 30 minutes

interface LockoutEntry {
  failedAttempts: number;
  lockedUntil?: number;
  lastAttempt: number;
}

/**
 * Check if account is locked
 */
export async function isAccountLocked(kv: KVNamespace | undefined, email: string): Promise<{
  locked: boolean;
  lockedUntil?: number;
  remainingAttempts: number;
}> {
  const key = `lockout:${email.toLowerCase()}`;
  const now = Date.now();

  if (!kv) {
    // In development without KV, no lockout
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const value = await kv.get(key);
  if (!value) {
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const entry: LockoutEntry = JSON.parse(value);

  // Check if lockout expired
  if (entry.lockedUntil && now > entry.lockedUntil) {
    // Lockout expired, reset
    await kv.delete(key);
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  // Account is locked
  if (entry.lockedUntil) {
    return {
      locked: true,
      lockedUntil: entry.lockedUntil,
      remainingAttempts: 0,
    };
  }

  // Not locked yet, return remaining attempts
  return {
    locked: false,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts),
  };
}

/**
 * Record failed login attempt
 */
export async function recordFailedLogin(kv: KVNamespace | undefined, email: string): Promise<{
  locked: boolean;
  lockedUntil?: number;
  remainingAttempts: number;
}> {
  if (!kv) {
    // In development without KV, no lockout
    return { locked: false, remainingAttempts: MAX_FAILED_ATTEMPTS };
  }

  const key = `lockout:${email.toLowerCase()}`;
  const now = Date.now();

  const value = await kv.get(key);
  let entry: LockoutEntry;

  if (!value) {
    entry = {
      failedAttempts: 1,
      lastAttempt: now,
    };
  } else {
    entry = JSON.parse(value);
    entry.failedAttempts++;
    entry.lastAttempt = now;
  }

  // Lock account if max attempts reached
  if (entry.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    entry.lockedUntil = now + LOCKOUT_DURATION_MS;

    logger.warn('Account locked due to failed login attempts', {
      email,
      attempts: entry.failedAttempts,
      lockedUntil: new Date(entry.lockedUntil).toISOString(),
    });
  }

  // Save to KV with 1-hour TTL
  const ttl = 60 * 60; // 1 hour
  await kv.put(key, JSON.stringify(entry), { expirationTtl: ttl });

  return {
    locked: !!entry.lockedUntil,
    lockedUntil: entry.lockedUntil,
    remainingAttempts: Math.max(0, MAX_FAILED_ATTEMPTS - entry.failedAttempts),
  };
}

/**
 * Reset lockout on successful login
 */
export async function resetLockout(kv: KVNamespace | undefined, email: string): Promise<void> {
  if (!kv) return;

  const key = `lockout:${email.toLowerCase()}`;
  await kv.delete(key);

  logger.info('Account lockout reset after successful login', { email });
}

/**
 * Get lockout status for display
 */
export function getLockoutMessage(lockedUntil: number): string {
  const now = Date.now();
  const remainingMs = lockedUntil - now;

  if (remainingMs <= 0) {
    return 'Account lockout expired';
  }

  const minutes = Math.ceil(remainingMs / 60000);

  if (minutes < 60) {
    return `Account locked. Try again in ${minutes} minute${minutes !== 1 ? 's' : ''}`;
  }

  const hours = Math.ceil(minutes / 60);
  return `Account locked. Try again in ${hours} hour${hours !== 1 ? 's' : ''}`;
}
