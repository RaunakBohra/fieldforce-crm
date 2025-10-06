import { Context, Next } from 'hono';
import { Bindings } from '../index';

/**
 * CSRF Protection Middleware
 * Implements Double Submit Cookie pattern for CSRF protection
 *
 * How it works:
 * 1. On GET requests, generate a CSRF token and set it in a cookie
 * 2. On state-changing requests (POST, PUT, DELETE), verify the token from header matches cookie
 * 3. Uses HMAC to prevent token forgery
 */

const CSRF_COOKIE_NAME = 'csrf_token';
const CSRF_HEADER_NAME = 'x-csrf-token';
const CSRF_TOKEN_LENGTH = 32;

/**
 * Generate random bytes using Web Crypto API
 */
function generateRandomBytes(length: number): string {
  const bytes = new Uint8Array(length);
  crypto.getRandomValues(bytes);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/**
 * Generate HMAC-SHA256 signature using Web Crypto API
 */
async function createHmacSignature(data: string, secret: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(data);

  const key = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign('HMAC', key, messageData);
  const hashArray = Array.from(new Uint8Array(signature));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically secure CSRF token
 */
async function generateCsrfToken(secret: string): Promise<string> {
  const randomToken = generateRandomBytes(CSRF_TOKEN_LENGTH);
  const signature = await createHmacSignature(randomToken, secret);
  return `${randomToken}.${signature}`;
}

/**
 * Verify CSRF token authenticity
 */
async function verifyCsrfToken(token: string, secret: string): Promise<boolean> {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [randomToken, signature] = parts;
  const expectedSignature = await createHmacSignature(randomToken, secret);

  return signature === expectedSignature;
}

/**
 * CSRF Protection Middleware
 * Exempt GET, HEAD, OPTIONS (safe methods)
 * Validate POST, PUT, PATCH, DELETE (state-changing methods)
 */
export async function csrfProtection(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const method = c.req.method;
  const secret = c.env.JWT_SECRET; // Reuse JWT secret for CSRF HMAC

  // Safe methods: just set the token cookie
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) {
    const token = await generateCsrfToken(secret);

    // Set CSRF token in cookie (HttpOnly=false so JS can read it)
    c.header('Set-Cookie',
      `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=3600`
    );

    // Also expose in response header for SPA to access
    c.header(CSRF_HEADER_NAME, token);

    await next();
    return;
  }

  // State-changing methods: verify token
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
    const cookieToken = c.req.cookie(CSRF_COOKIE_NAME);
    const headerToken = c.req.header(CSRF_HEADER_NAME);

    // Both tokens must be present
    if (!cookieToken || !headerToken) {
      return c.json(
        {
          success: false,
          error: 'CSRF token missing. Please refresh the page.'
        },
        403
      );
    }

    // Tokens must match
    if (cookieToken !== headerToken) {
      return c.json(
        {
          success: false,
          error: 'CSRF token mismatch. Please refresh the page.'
        },
        403
      );
    }

    // Token must be valid (HMAC verification)
    const isValid = await verifyCsrfToken(headerToken, secret);
    if (!isValid) {
      return c.json(
        {
          success: false,
          error: 'Invalid CSRF token. Please refresh the page.'
        },
        403
      );
    }

    // Token is valid, proceed
    await next();
    return;
  }

  // Unknown method, proceed
  await next();
}

/**
 * CSRF Token Endpoint
 * Provides a dedicated endpoint to fetch CSRF token
 * Useful for SPAs that need to fetch the token before making requests
 */
export async function getCsrfToken(c: Context<{ Bindings: Bindings }>) {
  const secret = c.env.JWT_SECRET;
  const token = await generateCsrfToken(secret);

  // Set cookie
  c.header('Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=3600`
  );

  return c.json({
    success: true,
    data: { csrfToken: token }
  });
}
