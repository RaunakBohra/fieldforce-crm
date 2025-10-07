import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { createDependencies, Dependencies } from './config/dependencies';
import { securityHeaders } from './middleware/securityHeaders';
import { csrfProtection, getCsrfToken } from './middleware/csrf';
import { logger } from './utils/logger';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import visitRoutes from './routes/visits';
import productRoutes from './routes/products';
import orderRoutes from './routes/orders';
import paymentRoutes from './routes/payments';
import dashboardRoutes from './routes/dashboard';
import analyticsRoutes from './routes/analytics';
import userRoutes from './routes/users';
import reportRoutes from './routes/reports';
import territoryRoutes from './routes/territories';
import otpRoutes from './routes/otp';
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

  // MSG91 Services (Email + SMS/OTP)
  MSG91_AUTH_KEY?: string;
  MSG91_EMAIL_DOMAIN?: string;
  MSG91_EMAIL_FROM?: string;
  MSG91_EMAIL_FROM_NAME?: string;
  MSG91_TEMPLATE_ID?: string; // Optional: for OTP template
  COMPANY_NAME?: string; // Company name for emails

  // Cache service (Cloudflare KV - free tier available)
  KV: KVNamespace;

  // Storage service (Cloudflare R2 - free tier: 10GB)
  BUCKET: R2Bucket;
  CDN_URL?: string;

  // Queue service (AWS SQS - free tier: 1M requests/month)
  AWS_SQS_REGION?: string;
  AWS_SQS_QUEUE_URLS?: string; // JSON string: {"email-queue": "https://sqs..."}
};

export interface UserContext {
  userId: string;
  email: string;
  role: string;
}

const app = new Hono<{ Bindings: Bindings; Variables: { deps: Dependencies; user: UserContext } }>();

/**
 * Global Middleware
 */

// Security headers (OWASP best practices)
app.use('/*', securityHeaders);

// CORS configuration (environment-aware)
app.use(
  '/*',
  cors({
    origin: (origin, c) => {
      // Production origins (only HTTPS)
      const productionOrigins = [
        'https://crm.raunakbohra.com',
        'https://crm-api.raunakbohra.com',
      ];

      // Development origins (HTTP allowed)
      const developmentOrigins = [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:5174',
        'http://localhost:8787',
      ];

      // Get environment from env vars
      const environment = c?.env?.ENVIRONMENT || 'development';
      const isProduction = environment === 'production';

      // In production, only allow HTTPS origins
      if (isProduction) {
        // Allow Cloudflare Pages preview deployments (*.pages.dev)
        if (origin && origin.match(/^https:\/\/.*\.pages\.dev$/)) {
          return origin;
        }

        // Check production whitelist
        if (productionOrigins.includes(origin || '')) {
          return origin;
        }

        // Reject HTTP in production
        return productionOrigins[0];
      }

      // In development, allow both HTTP and HTTPS
      const allAllowedOrigins = [...productionOrigins, ...developmentOrigins];

      if (allAllowedOrigins.includes(origin || '')) {
        return origin;
      }

      // Allow pages.dev in development
      if (origin && origin.match(/^https:\/\/.*\.pages\.dev$/)) {
        return origin;
      }

      return developmentOrigins[1]; // fallback to localhost:5173
    },
    credentials: true,
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization', 'x-csrf-token'],
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
app.use('/api/contacts/*', csrfProtection);
app.use('/api/visits/*', csrfProtection);
app.use('/api/orders/*', csrfProtection);
app.use('/api/products/*', csrfProtection);
app.use('/api/payments/*', csrfProtection);
app.use('/api/territories/*', csrfProtection);
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

// Database connectivity test (removed for production security)
// VULN-005: Public endpoint exposes system information
// Use /health endpoint for basic health checks instead

/**
 * API Routes
 */

// Authentication routes (public)
app.route('/api/auth', authRoutes);

// OTP verification routes (public - for phone authentication)
app.route('/api/otp', otpRoutes);

// CSRF token endpoint (public - no auth required)
app.get('/api/csrf-token', getCsrfToken);

// Contact management routes (protected)
app.route('/api/contacts', contactRoutes);

// Visit management routes (protected)
app.route('/api/visits', visitRoutes);

// Product catalog routes (protected)
app.route('/api/products', productRoutes);

// Order management routes (protected)
app.route('/api/orders', orderRoutes);

// Payment tracking routes (protected)
app.route('/api/payments', paymentRoutes);

// Dashboard routes (protected)
app.route('/api/dashboard', dashboardRoutes);

// Analytics routes (protected)
app.route('/api/analytics', analyticsRoutes);

// User management routes (protected, admin/manager only)
app.route('/api/users', userRoutes);

// Reports routes (protected)
app.route('/api/reports', reportRoutes);

// Territory management routes (protected, admin/manager only)
app.route('/api/territories', territoryRoutes);

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
      status as any
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

/**
 * Cloudflare Workers Export
 * Default export for HTTP requests and scheduled events
 */
export default {
  async fetch(request: Request, env: Bindings, ctx: ExecutionContext) {
    return app.fetch(request, env, ctx);
  },

  async scheduled(event: ScheduledEvent, env: Bindings, ctx: ExecutionContext) {
    // Import payment reminders job
    const { sendPaymentReminders } = await import('./jobs/paymentReminders');
    const { createDependencies } = await import('./config/dependencies');

    try {
      logger.info('[Cron] Starting payment reminders job', {
        scheduledTime: new Date(event.scheduledTime).toISOString(),
        cron: event.cron,
      });

      // Create dependencies
      const deps = createDependencies(env);

      // Run payment reminders job
      const result = await sendPaymentReminders(deps.prisma, env);

      logger.info('[Cron] Payment reminders job completed', {
        totalOverdueOrders: result.totalOverdueOrders,
        remindersSent: result.remindersSent,
        errors: result.errors,
      });

      // Disconnect Prisma client
      await deps.prisma.$disconnect();
    } catch (error) {
      logger.error('[Cron] Payment reminders job failed', error);
      throw error;
    }
  },
};
