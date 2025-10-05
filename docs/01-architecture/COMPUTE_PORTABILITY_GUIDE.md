# Frontend & Backend Compute Portability Guide

**How we handle compute across platforms while staying highly adaptable**

---

## Overview

Our architecture makes both frontend and backend compute **platform-agnostic**, allowing you to switch between:

**Frontend Hosting**:
- Cloudflare Pages → Vercel → Netlify → AWS Amplify → S3+CloudFront

**Backend Compute**:
- Cloudflare Workers → AWS Lambda → Google Cloud Functions → Traditional Node.js

**Migration Time**: 4-6 hours per platform (frontend + backend)

---

## Part 1: Frontend Compute Portability

### Why Frontend is Easy to Port

Frontend builds to **static files** - just HTML, CSS, and JavaScript. No server-side rendering, no platform-specific APIs.

```
Build Output (Vite):
dist/
├── index.html
├── assets/
│   ├── index-abc123.js    (React app)
│   ├── index-def456.css   (Tailwind)
│   └── logo-xyz789.svg
└── favicon.ico
```

These static files work **anywhere**. The only difference between platforms is:
1. Where you upload files
2. What domain you use
3. Environment variables (API URL)

### Frontend Architecture Pattern

```typescript
// ✅ Platform-Agnostic Frontend Code

// 1. API URL from environment (different per platform)
const API_URL = import.meta.env.VITE_API_URL || 'https://api.yourapp.com';

// 2. Pure React components (work everywhere)
function LoginPage() {
  const [email, setEmail] = useState('');

  const handleLogin = async () => {
    // Call API (URL is platform-agnostic)
    const response = await fetch(`${API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await response.json();
    localStorage.setItem('token', data.token);
  };

  return (
    <form onSubmit={handleLogin}>
      {/* Pure HTML/React - works everywhere */}
    </form>
  );
}
```

**No platform-specific code!** This works on:
- Cloudflare Pages
- Vercel
- Netlify
- AWS S3 + CloudFront
- AWS Amplify
- GitHub Pages
- Your own Nginx server

### Frontend Deployment Comparison

| Platform | Deployment Command | Time | Cost |
|----------|-------------------|------|------|
| **Cloudflare Pages** | `wrangler pages deploy dist` | 30s | $0 |
| **Vercel** | `vercel deploy` | 45s | $0 (hobby) |
| **Netlify** | `netlify deploy` | 60s | $0 (starter) |
| **AWS S3+CloudFront** | `aws s3 sync dist/ s3://bucket && aws cloudfront create-invalidation` | 2-3 min | ~$5/month |
| **AWS Amplify** | `amplify publish` | 3-4 min | ~$10/month |

### Frontend Environment Variables

```bash
# .env.development (Local)
VITE_API_URL=http://localhost:8787

# .env.staging (Staging)
VITE_API_URL=https://api-staging.yourapp.com

# .env.production.cloudflare (Cloudflare)
VITE_API_URL=https://api.yourapp.workers.dev

# .env.production.aws (AWS Lambda)
VITE_API_URL=https://abc123.execute-api.ap-south-1.amazonaws.com

# .env.production.vercel (Vercel Functions)
VITE_API_URL=https://api.yourapp.vercel.app
```

**That's it!** Change one variable, rebuild, redeploy.

### Frontend Migration Steps

```bash
# From Cloudflare Pages to AWS S3+CloudFront

# 1. Update environment variable
echo "VITE_API_URL=https://abc123.execute-api.ap-south-1.amazonaws.com" > .env.production

# 2. Rebuild
npm run build

# 3. Deploy to S3
aws s3 sync dist/ s3://your-bucket --delete

# 4. Invalidate CloudFront cache
aws cloudfront create-invalidation --distribution-id E1234567890 --paths "/*"

# Done! (5-10 minutes)
```

---

## Part 2: Backend Compute Portability

### The Challenge

Different platforms have **different entry points**:

```typescript
// Cloudflare Workers Entry Point
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Handle request
  }
}

// AWS Lambda Entry Point
export const handler = async (event: APIGatewayEvent, context: Context) => {
  // Handle request
}

// Traditional Node.js Entry Point
const app = express();
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Solution**: Use a framework that **abstracts the entry point** (Hono) + **adapter pattern**.

### Why Hono Framework?

Hono works on **all platforms** with the same code:

```typescript
import { Hono } from 'hono';

// ✅ This exact code works on:
// - Cloudflare Workers
// - AWS Lambda
// - Vercel Functions
// - Node.js
// - Deno
// - Bun

const app = new Hono();

app.get('/api/health', (c) => {
  return c.json({ status: 'ok' });
});

app.post('/api/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  // Business logic (platform-agnostic)
  return c.json({ token: 'abc123' });
});

// Platform-specific exports below ↓
```

### Backend Architecture Pattern

Our backend has **3 layers**:

```
┌─────────────────────────────────────────┐
│  Platform Entry Point (CHANGES)         │  ← Cloudflare, Lambda, Express
├─────────────────────────────────────────┤
│  Hono App (SAME)                        │  ← Routes, middleware
├─────────────────────────────────────────┤
│  Business Logic + DI (SAME)             │  ← Services, adapters
└─────────────────────────────────────────┘
```

**Only the entry point changes** (< 50 lines). Everything else stays the same.

### Layer 1: Platform Entry Points

#### Cloudflare Workers Entry Point

```typescript
// api/src/index.cloudflare.ts

import { Hono } from 'hono';
import { createApp } from './app';
import { createCloudfareDependencies } from './config/dependencies';

export interface Env {
  DATABASE_URL: string;
  BUCKET: R2Bucket;
  KV: KVNamespace;
  EMAIL_QUEUE: Queue;
  // ... other Cloudflare bindings
}

export default {
  async fetch(
    request: Request,
    env: Env,
    ctx: ExecutionContext
  ): Promise<Response> {
    // Create dependencies for Cloudflare
    const dependencies = createCloudfareDependencies(env);

    // Create Hono app with dependencies
    const app = createApp(dependencies);

    // Handle request
    return app.fetch(request, env, ctx);
  },
};
```

#### AWS Lambda Entry Point

```typescript
// api/src/index.lambda.ts

import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { createApp } from './app';
import { createAWSDependencies } from './config/dependencies';

// Load environment variables
const dependencies = createAWSDependencies({
  AWS_REGION: process.env.AWS_REGION!,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET!,
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
  // ... other AWS config
});

// Create Hono app
const app = createApp(dependencies);

// Export Lambda handler
export const handler = handle(app);
```

#### Traditional Node.js Entry Point

```typescript
// api/src/index.node.ts

import { serve } from '@hono/node-server';
import { createApp } from './app';
import { createAWSDependencies } from './config/dependencies';

// Load environment variables
const dependencies = createAWSDependencies({
  AWS_REGION: process.env.AWS_REGION!,
  AWS_S3_BUCKET: process.env.AWS_S3_BUCKET!,
  DATABASE_URL: process.env.DATABASE_URL!,
  REDIS_URL: process.env.REDIS_URL!,
});

// Create Hono app
const app = createApp(dependencies);

// Start Node.js server
const port = 3000;
console.log(`Server running on http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});
```

### Layer 2: Hono App (Platform-Agnostic)

```typescript
// api/src/app.ts

import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { Dependencies } from './config/dependencies';
import authRoutes from './routes/auth';
import contactRoutes from './routes/contacts';
import visitRoutes from './routes/visits';

export function createApp(dependencies: Dependencies) {
  const app = new Hono();

  // Middleware (platform-agnostic)
  app.use('*', cors());
  app.use('*', logger());

  // Inject dependencies into context
  app.use('*', async (c, next) => {
    c.set('dependencies', dependencies);
    await next();
  });

  // Routes (platform-agnostic)
  app.route('/api/auth', authRoutes);
  app.route('/api/contacts', contactRoutes);
  app.route('/api/visits', visitRoutes);

  // Health check
  app.get('/health', (c) => {
    return c.json({ status: 'ok', platform: 'portable' });
  });

  return app;
}
```

**This `createApp` function is IDENTICAL** across all platforms!

### Layer 3: Business Logic (Platform-Agnostic)

```typescript
// api/src/routes/visits.ts

import { Hono } from 'hono';
import { VisitService } from '../services/visitService';

const app = new Hono();

app.post('/', async (c) => {
  // Get dependencies from context (injected by platform entry point)
  const { storage, queue, cache } = c.get('dependencies');
  const prisma = c.get('prisma');

  // Create service with injected dependencies
  const visitService = new VisitService(prisma, storage, queue, cache);

  // Business logic (platform-agnostic!)
  const data = await c.req.json();
  const visit = await visitService.createVisit(data);

  return c.json(visit, 201);
});

export default app;
```

### Dependency Injection (Already Covered)

```typescript
// api/src/config/dependencies.ts

export interface Dependencies {
  storage: IStorageService;
  queue: IQueueService;
  email: IEmailService;
  cache: ICacheService;
}

// Cloudflare implementation
export function createCloudfareDependencies(env: CloudflareEnv): Dependencies {
  return {
    storage: new R2StorageService(env.BUCKET, env.CDN_URL),
    queue: new CloudflareQueueService({ /* ... */ }),
    email: new SESEmailService(/* ... */),
    cache: new CloudflareKVCacheService(env.KV, 'app'),
  };
}

// AWS implementation
export function createAWSDependencies(env: AWSEnv): Dependencies {
  return {
    storage: new S3StorageService(/* ... */),
    queue: new SQSQueueService(/* ... */),
    email: new SESEmailService(/* ... */),
    cache: new RedisCacheService(env.REDIS_URL, 'app'),
  };
}
```

---

## Migration Breakdown: Cloudflare → AWS

### What Changes (10% of code):

#### 1. Entry Point (~50 lines)
```typescript
// FROM: index.cloudflare.ts
export default { fetch(request, env, ctx) { ... } }

// TO: index.lambda.ts
export const handler = handle(app);
```

#### 2. Dependency Factory (~100 lines)
```typescript
// FROM: createCloudfareDependencies()
storage: new R2StorageService(env.BUCKET)

// TO: createAWSDependencies()
storage: new S3StorageService(env.AWS_S3_BUCKET)
```

#### 3. Build Configuration (~20 lines)
```typescript
// FROM: wrangler.toml
main = "src/index.cloudflare.ts"

// TO: serverless.yml or SAM template
handler: dist/index.handler
```

#### 4. Deployment (~10 lines)
```bash
# FROM:
wrangler deploy

# TO:
sam deploy
```

### What Stays the Same (90% of code):

- **All routes** (`routes/*.ts`) - 100% same
- **All services** (`services/*.ts`) - 100% same
- **All business logic** - 100% same
- **Hono app** (`app.ts`) - 100% same
- **Database models** (Prisma) - 100% same
- **Frontend** - Just change API URL

---

## Migration Time Estimates

### Cloudflare Workers → AWS Lambda

| Task | Time | Complexity |
|------|------|------------|
| Create Lambda entry point | 1 hour | Easy |
| Setup API Gateway | 1 hour | Medium |
| Configure environment variables | 30 min | Easy |
| Test locally | 1 hour | Easy |
| Deploy to staging | 30 min | Easy |
| Test staging | 1 hour | Medium |
| **Total** | **5-6 hours** | **Low** |

### Cloudflare Workers → Traditional Node.js

| Task | Time | Complexity |
|------|------|------------|
| Create Node.js entry point | 30 min | Easy |
| Setup Docker container (optional) | 1 hour | Medium |
| Configure PM2/systemd | 30 min | Easy |
| Test locally | 30 min | Easy |
| Deploy to server | 1 hour | Medium |
| **Total** | **3-4 hours** | **Very Low** |

### AWS Lambda → Google Cloud Functions

| Task | Time | Complexity |
|------|------|------------|
| Create Cloud Function entry point | 1 hour | Easy |
| Swap S3 → Cloud Storage adapter | 2 hours | Medium |
| Swap SQS → Pub/Sub adapter | 2 hours | Medium |
| Configure environment | 30 min | Easy |
| Deploy and test | 1 hour | Easy |
| **Total** | **6-7 hours** | **Medium** |

---

## Platform Comparison

### Cloudflare Workers

**Pros**:
- ✅ Zero cold starts (0ms)
- ✅ Global edge network (300+ cities)
- ✅ Ultra-low latency (15-50ms in India)
- ✅ Cheap ($5/month for 10M requests)
- ✅ Built-in KV, R2, Queues, D1
- ✅ Simple deployment (`wrangler deploy`)

**Cons**:
- ❌ 10ms CPU limit per request (extended to 50ms on paid)
- ❌ Limited Node.js APIs
- ❌ Smaller ecosystem than AWS

**Best For**: APIs, lightweight compute, global apps

---

### AWS Lambda

**Pros**:
- ✅ Full Node.js runtime (no restrictions)
- ✅ Up to 15 min execution time
- ✅ Massive ecosystem (all AWS services)
- ✅ VPC support
- ✅ Mature monitoring (CloudWatch)

**Cons**:
- ❌ Cold starts (100-500ms)
- ❌ More expensive (~$20/month for same load)
- ❌ More complex setup (API Gateway, VPC, IAM)
- ❌ Slower in India (100-200ms)

**Best For**: Complex business logic, long-running tasks, AWS-native stacks

---

### Traditional Node.js (EC2/Fargate/Your Server)

**Pros**:
- ✅ Full control over environment
- ✅ No cold starts (always warm)
- ✅ No execution time limits
- ✅ Easy debugging
- ✅ WebSockets, long-polling, SSE

**Cons**:
- ❌ Expensive (EC2 = $50-100/month minimum)
- ❌ Manual scaling
- ❌ Ops overhead (updates, patches, monitoring)
- ❌ Single region (unless multi-region setup)

**Best For**: Stateful apps, WebSockets, legacy systems, special requirements

---

## Code Organization

```
api/
├── src/
│   ├── core/
│   │   └── ports/               # Interfaces (platform-agnostic)
│   │       ├── IStorageService.ts
│   │       ├── IQueueService.ts
│   │       ├── IEmailService.ts
│   │       └── ICacheService.ts
│   │
│   ├── infrastructure/          # Adapters (platform-specific)
│   │   ├── storage/
│   │   │   ├── R2StorageService.ts      # Cloudflare
│   │   │   ├── S3StorageService.ts      # AWS
│   │   │   └── GCSStorageService.ts     # Google Cloud
│   │   ├── queue/
│   │   │   ├── CloudflareQueueService.ts
│   │   │   ├── SQSQueueService.ts
│   │   │   └── PubSubQueueService.ts
│   │   └── cache/
│   │       ├── CloudflareKVCacheService.ts
│   │       ├── RedisCacheService.ts
│   │       └── MemcachedCacheService.ts
│   │
│   ├── services/                # Business logic (platform-agnostic)
│   │   ├── visitService.ts
│   │   ├── contactService.ts
│   │   └── orderService.ts
│   │
│   ├── routes/                  # API routes (platform-agnostic)
│   │   ├── auth.ts
│   │   ├── contacts.ts
│   │   └── visits.ts
│   │
│   ├── config/
│   │   └── dependencies.ts      # DI factory
│   │
│   ├── app.ts                   # Hono app (platform-agnostic)
│   │
│   └── index.*.ts               # Entry points (platform-specific)
│       ├── index.cloudflare.ts  # Cloudflare Workers
│       ├── index.lambda.ts      # AWS Lambda
│       ├── index.node.ts        # Node.js server
│       └── index.gcf.ts         # Google Cloud Functions
│
├── wrangler.toml                # Cloudflare config
├── serverless.yml               # AWS Lambda config (optional)
├── cloudbuild.yaml              # Google Cloud config (optional)
└── package.json
```

---

## Deployment Commands

### Local Development

```bash
# Works for any platform (uses Node.js entry point)
npm run dev

# Or for Cloudflare Workers specific
wrangler dev
```

### Cloudflare Workers

```bash
# Deploy
wrangler deploy

# Logs
wrangler tail

# Rollback
wrangler rollback
```

### AWS Lambda (via SAM)

```bash
# Build
sam build

# Deploy
sam deploy --guided

# Logs
sam logs -n YourFunction --tail

# Rollback
sam deploy --parameter-overrides Version=previous
```

### AWS Lambda (via Serverless Framework)

```bash
# Deploy
serverless deploy

# Logs
serverless logs -f api --tail

# Rollback
serverless rollback -t timestamp
```

### Traditional Node.js

```bash
# Build
npm run build

# Start with PM2
pm2 start dist/index.node.js --name api

# Logs
pm2 logs api

# Restart
pm2 restart api
```

---

## Environment Variables Strategy

### Shared Variables (All Platforms)

```bash
# .env.shared
DATABASE_URL=postgresql://...
JWT_SECRET=...
AWS_SES_KEY=...
AWS_SES_SECRET=...
```

### Platform-Specific Variables

```bash
# .env.cloudflare
# (Bindings configured in wrangler.toml, not .env)
# BUCKET = R2 Bucket binding
# KV = KV Namespace binding
# EMAIL_QUEUE = Queue binding

# .env.aws
AWS_REGION=ap-south-1
AWS_S3_BUCKET=my-app-uploads
REDIS_URL=redis://...
SQS_EMAIL_QUEUE_URL=https://sqs.ap-south-1...

# .env.node
AWS_REGION=ap-south-1
AWS_S3_BUCKET=my-app-uploads
REDIS_URL=redis://localhost:6379
PORT=3000
```

---

## Testing Strategy

### Unit Tests (Platform-Agnostic)

```typescript
// tests/services/visitService.test.ts

import { VisitService } from '../src/services/visitService';
import { MockStorageService } from './mocks/MockStorageService';
import { MockQueueService } from './mocks/MockQueueService';

describe('VisitService', () => {
  it('should create visit with photo upload', async () => {
    // Use mock implementations (platform-agnostic)
    const storage = new MockStorageService();
    const queue = new MockQueueService();
    const cache = new MockCacheService();
    const prisma = mockPrismaClient();

    const service = new VisitService(prisma, storage, queue, cache);

    const visit = await service.createVisit({
      contactId: '123',
      photo: Buffer.from('fake-image'),
      notes: 'Test visit',
    });

    expect(visit).toBeDefined();
    expect(storage.uploadFile).toHaveBeenCalled();
    expect(queue.sendMessage).toHaveBeenCalled();
  });
});
```

**Tests run the same** regardless of platform!

### Integration Tests (Platform-Specific)

```typescript
// tests/integration/cloudflare.test.ts

import { createApp } from '../src/app';
import { createCloudfareDependencies } from '../src/config/dependencies';

describe('Cloudflare Workers Integration', () => {
  it('should handle request in Cloudflare environment', async () => {
    const env = getMockCloudflareEnv();
    const dependencies = createCloudfareDependencies(env);
    const app = createApp(dependencies);

    const response = await app.fetch(new Request('http://localhost/health'));

    expect(response.status).toBe(200);
  });
});

// tests/integration/lambda.test.ts

import { handler } from '../src/index.lambda';

describe('AWS Lambda Integration', () => {
  it('should handle Lambda event', async () => {
    const event = mockAPIGatewayEvent('/health');
    const context = mockLambdaContext();

    const response = await handler(event, context);

    expect(response.statusCode).toBe(200);
  });
});
```

---

## Performance Comparison

### API Response Times (Mumbai, India)

| Platform | Cold Start | Warm Response | p95 | p99 |
|----------|-----------|---------------|-----|-----|
| **Cloudflare Workers** | 0ms | 15-30ms | 50ms | 80ms |
| **AWS Lambda (Mumbai)** | 100-300ms | 50-100ms | 150ms | 250ms |
| **AWS Lambda (Singapore)** | 100-300ms | 80-150ms | 200ms | 350ms |
| **EC2 Mumbai** | N/A | 30-60ms | 100ms | 180ms |
| **Traditional VPS** | N/A | 40-80ms | 120ms | 200ms |

**Winner for India**: Cloudflare Workers (3-4x faster)

---

## Cost Comparison

### 1 Million Requests/Month, 10K Users

| Platform | Compute | Database | Storage | Queue | Cache | **Total** |
|----------|---------|----------|---------|-------|-------|-----------|
| **Cloudflare + Neon** | $5 | $19 | $1.50 | $0 | $0 | **$25.50** |
| **AWS Lambda + RDS** | $20 | $60 | $5 | $2 | $15 | **$102** |
| **AWS Fargate + RDS** | $40 | $60 | $5 | $2 | $15 | **$122** |
| **EC2 + RDS** | $50 | $60 | $5 | N/A | $15 | **$130** |

**Winner for cost**: Cloudflare (75% cheaper)

---

## Decision Matrix: Which Platform?

### Choose Cloudflare Workers If:
- ✅ You want lowest cost ($25-30/month)
- ✅ You need global edge performance
- ✅ Your API is simple/moderate complexity
- ✅ You want simple deployment
- ✅ Cold starts are unacceptable

### Choose AWS Lambda If:
- ✅ You need full Node.js runtime
- ✅ You need VPC/private resources
- ✅ You have complex business logic
- ✅ You need >10ms CPU time
- ✅ You're already on AWS

### Choose Traditional Node.js If:
- ✅ You need WebSockets
- ✅ You need stateful connections
- ✅ You have special runtime requirements
- ✅ You want full control
- ✅ You have DevOps resources

---

## Our Recommendation

### Phase 1: Start with Cloudflare (Weeks 1-12)
- **Why**: Cheapest, fastest, simplest
- **Cost**: $30/month
- **Performance**: 15-50ms in India
- **Effort**: Low (1 week to setup)

### Phase 2: Evaluate at 10K Users (Month 3-6)
- **If satisfied**: Stay on Cloudflare (scales to 100K+ users)
- **If need more**: Migrate to AWS Lambda (1 week effort)
- **If need full control**: Migrate to EC2/Fargate (2 weeks effort)

### Phase 3: Scale Decision (Month 6-12)
- **If global**: Stay Cloudflare (best edge performance)
- **If India-only**: Consider AWS Lambda (more features)
- **If enterprise**: Hybrid (Cloudflare CDN + AWS Lambda)

---

## Migration Checklist

### Cloudflare → AWS Lambda

- [ ] Create `index.lambda.ts` entry point (1 hour)
- [ ] Update `dependencies.ts` to use AWS adapters (1 hour)
- [ ] Setup S3 bucket (15 min)
- [ ] Setup SQS queues (30 min)
- [ ] Setup ElastiCache Redis (30 min)
- [ ] Configure API Gateway (1 hour)
- [ ] Setup environment variables in Lambda (15 min)
- [ ] Test locally with SAM (1 hour)
- [ ] Deploy to staging (30 min)
- [ ] Run integration tests (1 hour)
- [ ] Update frontend API URL (5 min)
- [ ] Deploy frontend (10 min)
- [ ] Smoke test production (30 min)
- [ ] Monitor for 24 hours
- [ ] **Total: ~5-6 hours** ✅

---

## Summary

### Frontend Portability
- ✅ **100% portable** - static files work everywhere
- ✅ **Migration time**: 5-10 minutes (just change API URL)
- ✅ **Zero code changes** required

### Backend Portability
- ✅ **90% portable** - only entry point changes
- ✅ **Migration time**: 4-6 hours (new entry point + config)
- ✅ **Minimal code changes** (< 200 lines)

### Total Migration Time
- **Frontend + Backend**: 5-7 hours
- **Testing**: 2-3 hours
- **Total**: **1 working day** for complete platform switch

### Key Principles
1. **Depend on interfaces, not implementations**
2. **Use platform-agnostic frameworks (Hono)**
3. **Inject dependencies at entry point**
4. **Keep business logic pure**
5. **Abstract platform-specific APIs**

---

**Your compute layer is now highly adaptable!** 🚀

Switch platforms in hours, not weeks.
