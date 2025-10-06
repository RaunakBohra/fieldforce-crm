import { Context, Next } from 'hono';
import { Bindings } from '../index';
import { createHmac, randomBytes } from 'crypto';

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
 * Generate a cryptographically secure CSRF token
 */
function generateCsrfToken(secret: string): string {
  const randomToken = randomBytes(CSRF_TOKEN_LENGTH).toString('hex');
  const hmac = createHmac('sha256', secret);
  hmac.update(randomToken);
  const signature = hmac.digest('hex');
  return `${randomToken}.${signature}`;
}

/**
 * Verify CSRF token authenticity
 */
function verifyCsrfToken(token: string, secret: string): boolean {
  const parts = token.split('.');
  if (parts.length !== 2) return false;

  const [randomToken, signature] = parts;
  const hmac = createHmac('sha256', secret);
  hmac.update(randomToken);
  const expectedSignature = hmac.digest('hex');

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
    const token = generateCsrfToken(secret);

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
    if (!verifyCsrfToken(headerToken, secret)) {
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
  const token = generateCsrfToken(secret);

  // Set cookie
  c.header('Set-Cookie',
    `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=Strict; Secure; Max-Age=3600`
  );

  return c.json({
    success: true,
    data: { csrfToken: token }
  });
}
