/**
 * Cloudflare Workers Entry Point
 *
 * Example showing how to use portable architecture on Cloudflare
 */

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

import {
  createCloudfareDependencies,
  CloudflareEnv,
} from './config/dependencies';
import { VisitService } from './services/visitService';

const app = new Hono<{ Bindings: CloudflareEnv }>();

// CORS
app.use('/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', platform: 'cloudflare' });
});

// Create visit endpoint
app.post('/api/visits', async (c) => {
  try {
    // 1. Get dependencies (automatically uses Cloudflare implementations)
    const deps = createCloudfareDependencies(c.env);

    // 2. Create Prisma client
    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    // 3. Create service with injected dependencies
    const visitService = new VisitService(
      prisma,
      deps.storage,  // R2StorageService
      deps.queue,    // CloudflareQueueService
      deps.cache     // CloudflareKVCacheService
    );

    // 4. Parse request
    const body = await c.req.json();
    const user = c.get('user'); // From auth middleware

    // 5. Call business logic (platform-agnostic!)
    const visit = await visitService.createVisit({
      ...body,
      userId: user.id,
    });

    // 6. Return response
    return c.json({ success: true, data: visit }, 201);
  } catch (error) {
    console.error('Create visit error:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

// Get user visits
app.get('/api/visits', async (c) => {
  try {
    const deps = createCloudfareDependencies(c.env);

    const prisma = new PrismaClient({
      datasourceUrl: c.env.DATABASE_URL,
    }).$extends(withAccelerate());

    const visitService = new VisitService(
      prisma,
      deps.storage,
      deps.queue,
      deps.cache
    );

    const user = c.get('user');
    const page = parseInt(c.req.query('page') || '1');

    // Business logic works the same on any platform!
    const visits = await visitService.getUserVisits(user.id, page);

    return c.json({ success: true, data: visits });
  } catch (error) {
    console.error('Get visits error:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

export default app;
