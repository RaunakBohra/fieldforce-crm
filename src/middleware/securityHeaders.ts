import { Context, Next } from 'hono';

/**
 * Security Headers Middleware
 * Adds essential security headers to protect against common vulnerabilities
 * Based on OWASP security best practices
 */

export async function securityHeaders(c: Context, next: Next) {
  // Set headers BEFORE calling next()
  // Prevent clickjacking attacks
  c.header('X-Frame-Options', 'DENY');

  // Prevent MIME type sniffing
  c.header('X-Content-Type-Options', 'nosniff');

  // Enable browser XSS protection (legacy browsers)
  c.header('X-XSS-Protection', '1; mode=block');

  // Content Security Policy - Restrict resource loading
  c.header(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline'", // For Vite dev mode
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "frame-ancestors 'none'",
    ].join('; ')
  );

  // Strict Transport Security - Force HTTPS (only in production)
  if (c.env?.ENVIRONMENT === 'production') {
    c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  }

  // Referrer Policy - Control referrer information
  c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

  // Permissions Policy - Disable unnecessary browser features
  c.header(
    'Permissions-Policy',
    [
      'geolocation=(self)',
      'microphone=()',
      'camera=()',
      'payment=()',
      'usb=()',
      'magnetometer=()',
    ].join(', ')
  );

  // Remove Server header to avoid information disclosure
  c.header('Server', '');

  await next();
}
