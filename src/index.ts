import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { getPrisma } from './utils/db';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    platform: 'cloudflare-workers',
    environment: c.env?.ENVIRONMENT || 'local',
    timestamp: new Date().toISOString(),
  });
});

// Database test
app.get('/db-test', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userCount = await prisma.user.count();

    return c.json({
      success: true,
      message: 'Database connected',
      userCount,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Database connection failed';
    return c.json({
      success: false,
      error: message,
    }, 500);
  }
});

// Auth routes (public)
app.route('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected route',
    user,
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
