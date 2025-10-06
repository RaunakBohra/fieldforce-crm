import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDependencies, Dependencies } from './config/dependencies';
import { securityHeaders } from './middleware/securityHeaders';
import { csrfProtection, getCsrfToken } from './middleware/csrf';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import visitRoutes from './routes/visits';
import { authMiddleware } from './middleware/auth';

/**
 * Main Application Entry Point
 * Follows hexagonal architecture with dependency injection
 */

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENVIRONMENT: string;

  // Email service (AWS SES via SMTP)
  AWS_SES_SMTP_HOST?: string;
  AWS_SES_SMTP_PORT?: string;
  AWS_SES_SMTP_USER?: string;
  AWS_SES_SMTP_PASSWORD?: string;
  EMAIL_FROM?: string;

  // Cache service (Cloudflare KV - free tier available)
  KV: KVNamespace;

  // Storage service (Cloudflare R2 - free tier: 10GB)
  BUCKET: R2Bucket;
  CDN_URL?: string;

  // Queue service (AWS SQS - free tier: 1M requests/month)
  AWS_SQS_REGION?: string;
  AWS_SQS_QUEUE_URLS?: string; // JSON string: {"email-queue": "https://sqs..."}
};

const app = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies } }>();

/**
 * Global Middleware
 */

// Security headers (OWASP best practices)
app.use('/*', securityHeaders);

// CORS configuration
app.use(
  '/*',
  cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://crm.raunakbohra.com',
      'https://fieldforce-crm.pages.dev',
    ],
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
    exposeHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400,
  })
);

// Dependency injection middleware - creates services for each request
app.use('/*', async (c, next) => {
  const deps = createDependencies(c.env);
  c.set('deps', deps);
  await next();
});

// CSRF protection middleware (after dependency injection)
// Protects against Cross-Site Request Forgery attacks
// TODO: Re-enable after adding CSRF token support to frontend
// app.use('/api/contacts/*', csrfProtection);
// app.use('/api/visits/*', csrfProtection);
// Add other protected routes here as needed

/**
 * Public Routes
 */

// Health check endpoint
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    platform: 'cloudflare-workers',
    environment: c.env?.ENVIRONMENT || 'local',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// Database connectivity test
app.get('/db-test', async (c) => {
  try {
    const deps = c.get('deps');
    const userCount = await deps.prisma.user.count();

    return c.json({
      success: true,
      message: 'Database connected',
      userCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    logger.error('Database test failed', error);
    return c.json(
      {
        success: false,
        error: message,
      },
      500
    );
  }
});

/**
 * API Routes
 */

// Authentication routes (public)
app.route('/api/auth', authRoutes);

// CSRF token endpoint (public - no auth required)
app.get('/api/csrf-token', getCsrfToken);

// Contact management routes (protected)
app.route('/api/contacts', contactRoutes);

// Visit management routes (protected)
app.route('/api/visits', visitRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected route',
    user,
  });
});

/**
 * Error Handlers
 */

// 404 handler
app.notFound((c) => {
  logger.warn('Route not found', { path: c.req.path, method: c.req.method });
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Global error handler
app.onError((err, c) => {
  // Handle validation errors (from zValidator)
  if (err.name === 'HTTPException') {
    const httpErr = err as { status?: number; message: string };
    const status = httpErr.status || 400;

    logger.warn('Validation error', {
      path: c.req.path,
      method: c.req.method,
      error: err.message,
    });

    return c.json(
      {
        success: false,
        error: err.message || 'Validation failed',
      },
      status
    );
  }

  // Handle other errors
  logger.error('Unhandled error', err, {
    path: c.req.path,
    method: c.req.method,
  });

  return c.json(
    {
      success: false,
      error: c.env?.ENVIRONMENT === 'production'
        ? 'Internal server error'
        : err.message || 'Internal server error',
    },
    500
  );
});

export default app;
