# Technical Architecture - Field Force CRM

**Cloud-Agnostic Serverless Architecture with Cloudflare Edge**

**Last Updated**: 2025-10-05
**Architecture Version**: 2.0 (Cloudflare-first)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Technology Decisions](#2-technology-decisions)
3. [System Components](#3-system-components)
4. [Data Flow](#4-data-flow)
5. [Security Architecture](#5-security-architecture)
6. [Scalability Strategy](#6-scalability-strategy)
7. [Offline-First Architecture](#7-offline-first-architecture)
8. [Multi-Tenancy Design](#8-multi-tenancy-design)
9. [Performance Optimization](#9-performance-optimization)
10. [Disaster Recovery](#10-disaster-recovery)

---

## 1. Architecture Overview

### 1.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    End Users (India)                         │
│         Mobile Devices (iOS/Android) + Desktop               │
└────────────┬────────────────────────────────────────────────┘
             │
             │ HTTPS
             │
┌────────────▼────────────────────────────────────────────────┐
│                  Cloudflare Global Network                   │
│                    (275+ Cities Worldwide)                   │
│                                                              │
│  ┌──────────────────────┐      ┌──────────────────────┐    │
│  │  Cloudflare Pages    │      │ Cloudflare Workers   │    │
│  │    (React 18 PWA)    │      │   (Hono + Prisma)    │    │
│  │                      │      │                      │    │
│  │  - React Router      │      │  - JWT Auth          │    │
│  │  - Offline Support   │      │  - Business Logic    │    │
│  │  - IndexedDB         │      │  - API Endpoints     │    │
│  └──────────────────────┘      └──────┬───────────────┘    │
│                                        │                     │
└────────────────────────────────────────┼─────────────────────┘
                                         │
                    ┌────────────────────┼────────────────────┐
                    │                    │                    │
                    ▼                    ▼                    ▼
            ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
            │    Neon      │     │ Cloudflare  │     │   AWS SES    │
            │  PostgreSQL  │     │     R2      │     │   (Mumbai)   │
            │  (Mumbai)    │     │  (Storage)  │     │              │
            │              │     │             │     │              │
            │ - Prisma ORM │     │ - Visit     │     │ - Email      │
            │ - Serverless │     │   Photos    │     │ - Reminders  │
            │ - Connection │     │ - Documents │     │ - Invoices   │
            │   Pooling    │     │             │     │              │
            └──────────────┘     └─────────────┘     └──────────────┘
```

### 1.2 Network Topology

```
User (Mumbai) → Cloudflare Edge (Mumbai) → Workers (Mumbai)
                                         ↓
                                    Neon DB (Mumbai)
                                         ↓
                                    Response (10-50ms)

User (Delhi) → Cloudflare Edge (Delhi) → Workers (Delhi)
                                        ↓
                                    Neon DB (Mumbai)
                                        ↓
                                    Response (20-60ms)
```

**Latency Breakdown**:
- User → Edge: 5-10ms
- Edge → Workers: 0ms (same location)
- Workers → Neon: 5-15ms (within region)
- Processing: 5-15ms
- **Total: 15-50ms** ✅

### 1.3 Edge Computing Benefits

| Traditional (Railway + Vercel) | Cloudflare Edge |
|-------------------------------|-----------------|
| Cold starts: 2-5 seconds | No cold starts |
| Response time: 100-200ms | Response time: 15-50ms |
| Single region (Oregon/Mumbai) | 275+ global locations |
| Cost: $50-100/month | Cost: $30/month |
| Scaling: Manual | Scaling: Automatic |

---

## 2. Technology Decisions

### 2.1 Why Cloudflare Workers?

**Pros**:
- ✅ **Zero cold starts**: Instant response
- ✅ **Global edge**: Deployed to 275+ cities
- ✅ **Low latency**: 10-50ms in India
- ✅ **Cost-effective**: $5/month for 10M requests
- ✅ **Auto-scaling**: Handles traffic spikes automatically
- ✅ **V8 isolates**: More efficient than containers
- ✅ **Built-in security**: DDoS protection, WAF

**Cons**:
- ⚠️ **CPU limits**: 50ms CPU time (free), unlimited (paid)
- ⚠️ **Bundle size**: 1MB (free), 10MB (paid)
- ⚠️ **Learning curve**: Different from Express/Node.js
- ⚠️ **Limited Node.js APIs**: Can't use `fs`, `child_process`, etc.

**Mitigations**:
- Use Hono (lightweight framework)
- Tree-shake dependencies
- Use Cloudflare-compatible packages

### 2.2 Why Neon PostgreSQL?

**Pros**:
- ✅ **Serverless**: Pay only for what you use
- ✅ **PostgreSQL**: Standard SQL, Prisma compatible
- ✅ **Branching**: Instant dev/staging environments
- ✅ **Auto-scaling**: 0 to 1000s of connections
- ✅ **Located in Mumbai**: Low latency to India
- ✅ **Connection pooling**: Built-in
- ✅ **Point-in-time recovery**: Restore to any second

**Comparison**:

| Database | Cost (10GB) | Latency | Prisma Support | Branching |
|----------|-------------|---------|----------------|-----------|
| **Neon** | $19/month | 5-15ms | ✅ Full | ✅ Yes |
| RDS | $50/month | 10-20ms | ✅ Full | ❌ No |
| DynamoDB | $25/month | 5-10ms | ⚠️ Limited | ❌ No |
| Cloudflare D1 | $0 | 5-10ms | ❌ No | ❌ No |

### 2.3 Why Cloudflare R2?

**Pros**:
- ✅ **Zero egress fees**: S3 charges $0.09/GB
- ✅ **90% cheaper**: $0.015/GB vs S3 $0.023/GB
- ✅ **S3 compatible**: Same API, easy migration
- ✅ **Same edge network**: Fast access from Workers

**Cost Example** (100GB storage + 500GB downloads):
- S3: $2.30 + $45 = **$47.30/month**
- R2: $1.50 + $0 = **$1.50/month**
- **Savings**: $45.80/month = ₹3,800/month

### 2.4 Why AWS SES (not Cloudflare Email)?

**Pros**:
- ✅ **Cheapest**: $0.10 per 1000 emails
- ✅ **High deliverability**: 98%+ inbox rate
- ✅ **Mumbai region**: ap-south-1
- ✅ **Mature service**: Battle-tested

**Cons**:
- ⚠️ **Requires AWS account**: Additional account to manage
- ⚠️ **Sandbox mode**: Need to request production access

---

## 3. System Components

### 3.1 Frontend (Cloudflare Pages)

**Technology**: React 18 + TypeScript + Vite + Tailwind CSS

**Architecture Pattern**: Offline-first PWA

```
web/
├── src/
│   ├── pages/              # Route pages
│   │   ├── Dashboard.tsx
│   │   ├── Contacts.tsx
│   │   ├── Visits.tsx
│   │   └── Orders.tsx
│   │
│   ├── components/         # Reusable components
│   │   ├── layout/
│   │   ├── forms/
│   │   └── shared/
│   │
│   ├── contexts/           # React Context API
│   │   ├── AuthContext.tsx
│   │   ├── OfflineContext.tsx
│   │   └── ThemeContext.tsx
│   │
│   ├── hooks/              # Custom hooks
│   │   ├── useAuth.ts
│   │   ├── useOfflineSync.ts
│   │   └── useGeolocation.ts
│   │
│   ├── services/           # API clients
│   │   ├── api.ts
│   │   ├── offlineStorage.ts
│   │   └── syncService.ts
│   │
│   └── utils/              # Helpers
│       ├── formatters.ts
│       └── validators.ts
│
├── public/                 # Static assets
│   ├── manifest.json
│   ├── service-worker.js
│   └── icons/
│
└── vite.config.ts
```

**Key Features**:
1. **PWA (Progressive Web App)**
   - Installable on mobile/desktop
   - Offline support with service workers
   - Background sync

2. **Offline-First**
   - IndexedDB for local storage
   - Queue API calls when offline
   - Auto-sync when online

3. **Performance**
   - Code splitting (React.lazy)
   - Image optimization
   - Bundle size < 500KB

**Portability Note**: Our frontend builds to **static files** (HTML, CSS, JS) that work on ANY hosting platform (Cloudflare Pages, Vercel, Netlify, AWS S3, Amplify). Migration between platforms takes 5-10 minutes (just change API URL and redeploy). For complete details on frontend hosting portability, see [COMPUTE_PORTABILITY_GUIDE.md](./COMPUTE_PORTABILITY_GUIDE.md).

### 3.2 Backend (Cloudflare Workers)

**Technology**: Hono + TypeScript + Prisma

**Architecture Pattern**: Clean Architecture (Ports & Adapters)

```
api/
├── src/
│   ├── index.ts            # Worker entry point
│   │
│   ├── routes/             # API routes (Hono)
│   │   ├── auth.ts
│   │   ├── contacts.ts
│   │   ├── visits.ts
│   │   ├── orders.ts
│   │   └── payments.ts
│   │
│   ├── middleware/         # Request middleware
│   │   ├── auth.ts         # JWT verification
│   │   ├── cors.ts         # CORS configuration
│   │   ├── rateLimit.ts    # Rate limiting
│   │   └── logger.ts       # Request logging
│   │
│   ├── services/           # Business logic
│   │   ├── authService.ts
│   │   ├── contactService.ts
│   │   ├── visitService.ts
│   │   ├── orderService.ts
│   │   ├── emailService.ts
│   │   └── uploadService.ts
│   │
│   ├── utils/              # Helpers
│   │   ├── db.ts           # Prisma client
│   │   ├── jwt.ts          # JWT helpers
│   │   ├── validation.ts   # Input validation
│   │   └── errors.ts       # Custom errors
│   │
│   └── types/              # TypeScript types
│       ├── env.d.ts
│       └── bindings.d.ts
│
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── migrations/         # Migration history
│
└── wrangler.toml           # Worker configuration
```

**Key Features**:
1. **Hono Framework**
   - Lightweight (12KB)
   - Fast routing
   - TypeScript-first
   - Express-like API
   - **Platform-agnostic** (works on Workers, Lambda, Node.js, Cloud Functions)

2. **Prisma ORM**
   - Type-safe database queries
   - Migrations
   - Edge-compatible

3. **JWT Authentication**
   - Stateless auth
   - No sessions
   - Refresh tokens

**Portability Note**: Our backend uses Hono framework which enables **compute portability** across platforms. The same Hono app code works on Cloudflare Workers, AWS Lambda, Google Cloud Functions, or traditional Node.js with minimal changes (only the entry point file changes). For complete details on backend compute portability, migration patterns, and platform comparisons, see [COMPUTE_PORTABILITY_GUIDE.md](./COMPUTE_PORTABILITY_GUIDE.md).

### 3.3 Database (Neon PostgreSQL)

**Schema Design**: Normalized (3NF)

**Key Tables**:
1. `users` - Authentication & authorization
2. `companies` - Multi-tenant support
3. `contacts` - Doctors, retailers, wholesalers
4. `visits` - GPS check-ins with photos
5. `products` - Product catalog
6. `orders` - Sales orders
7. `order_items` - Order line items
8. `payments` - Payment records

**Indexes**:
```sql
-- Frequently queried fields
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_contacts_company ON contacts(company_id);
CREATE INDEX idx_visits_date ON visits(visited_at DESC);
CREATE INDEX idx_orders_status ON orders(status);

-- Composite indexes for common queries
CREATE INDEX idx_contacts_company_type ON contacts(company_id, type);
CREATE INDEX idx_visits_user_date ON visits(user_id, visited_at DESC);
```

**Connection Pooling**:
```typescript
// Neon provides built-in connection pooling
// No need for additional pooling logic
const prisma = new PrismaClient({
  datasourceUrl: env.DATABASE_URL // Pooled connection
});
```

### 3.4 Storage (Cloudflare R2)

**Use Cases**:
1. Visit photos
2. Product images
3. Document uploads
4. Profile pictures

**Organization**:
```
r2://fieldforce-uploads/
├── visits/
│   ├── {visit-id}/
│   │   ├── {timestamp}-photo1.jpg
│   │   └── {timestamp}-photo2.jpg
│
├── products/
│   ├── {product-id}/
│   │   └── image.jpg
│
├── documents/
│   └── invoices/
│       └── {order-id}.pdf
│
└── avatars/
    └── {user-id}.jpg
```

**Access Control**:
- Public: Product images, avatars
- Private: Visit photos (require auth)

### 3.5 Email (AWS SES)

**Templates**:
1. Welcome email (new user)
2. Password reset
3. Payment reminder
4. Order confirmation
5. Visit summary (daily digest)

**Configuration**:
```typescript
// Mumbai region for low latency
const ses = new SESClient({
  region: 'ap-south-1',
  credentials: {
    accessKeyId: env.AWS_SES_KEY,
    secretAccessKey: env.AWS_SES_SECRET
  }
});
```

---

## 4. Data Flow

### 4.1 Authentication Flow

```
1. User enters email + password
   ↓
2. Frontend → POST /api/auth/login
   ↓
3. Worker validates credentials (bcrypt)
   ↓
4. Generate JWT (7-day expiry)
   ↓
5. Return { token, user }
   ↓
6. Frontend stores token in localStorage
   ↓
7. All subsequent requests include:
   Authorization: Bearer {token}
```

### 4.2 Visit Creation Flow (GPS Check-in)

```
1. User clicks "Check In" on contact
   ↓
2. Get GPS coordinates (Geolocation API)
   ↓
3. Take photo (Camera API)
   ↓
4. Frontend → POST /api/visits
   {
     contactId,
     latitude,
     longitude,
     notes,
     photo (File)
   }
   ↓
5. Worker:
   a. Verify JWT
   b. Validate GPS coordinates
   c. Upload photo to R2
   d. Create visit record in DB
   e. Return visit data
   ↓
6. Frontend shows success
   ↓
7. If offline:
   a. Store in IndexedDB
   b. Queue for sync
   c. Sync when online
```

### 4.3 Order Creation Flow

```
1. User selects contact & products
   ↓
2. Frontend → POST /api/orders
   {
     contactId,
     items: [
       { productId, quantity, price }
     ],
     totalAmount
   }
   ↓
3. Worker:
   a. Verify JWT
   b. Validate products exist
   c. Calculate total
   d. Create order (status: PENDING)
   e. Create order_items
   f. Return order
   ↓
4. Manager reviews & approves
   ↓
5. Frontend → PATCH /api/orders/{id}
   { status: 'APPROVED' }
   ↓
6. Worker:
   a. Update order status
   b. Queue email notification
   c. Return updated order
```

### 4.4 Offline Sync Flow

```
1. User is offline
   ↓
2. User creates visit/order
   ↓
3. Frontend:
   a. Save to IndexedDB
   b. Add to sync queue
   c. Show "Pending sync" indicator
   ↓
4. User comes online
   ↓
5. Sync service detects connectivity
   ↓
6. Process sync queue:
   For each pending item:
     a. POST to API
     b. On success: Remove from queue
     c. On error: Keep in queue, retry later
   ↓
7. Update UI with synced data
```

---

## 5. Security Architecture

### 5.1 Authentication & Authorization

**JWT Structure**:
```typescript
{
  userId: "uuid",
  email: "user@example.com",
  role: "SALES_REP",
  companyId: "uuid",
  iat: 1234567890,
  exp: 1234567890 + (7 * 24 * 60 * 60) // 7 days
}
```

**Role-Based Access Control**:
```typescript
enum UserRole {
  SUPER_ADMIN,  // Full system access
  ADMIN,        // Company-level access
  MANAGER,      // Team management
  SALES_REP     // Own data only
}

// Middleware
if (user.role === 'SALES_REP') {
  // Can only see own visits/orders
  query.where.userId = user.id;
}
```

### 5.2 Input Validation

**Strategy**: Validate everything at the edge

```typescript
import { z } from 'zod';

// Schema
const createContactSchema = z.object({
  name: z.string().min(3).max(100),
  type: z.enum(['DOCTOR', 'RETAILER', 'WHOLESALER']),
  phone: z.string().regex(/^[6-9]\d{9}$/), // Indian phone
  email: z.string().email().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

// Validate
const result = createContactSchema.safeParse(body);
if (!result.success) {
  return c.json({ error: result.error }, 400);
}
```

### 5.3 SQL Injection Prevention

**Prisma ORM prevents SQL injection automatically**:

```typescript
// ✅ Safe - Prisma parameterizes queries
const user = await prisma.user.findUnique({
  where: { email: userInput } // Automatically escaped
});

// ❌ Never do this - Raw SQL with user input
const users = await prisma.$queryRaw`
  SELECT * FROM users WHERE email = '${userInput}'
`; // Vulnerable to SQL injection!
```

### 5.4 XSS Prevention

**React escapes by default**:

```tsx
// ✅ Safe - React escapes HTML
<div>{userInput}</div>

// ❌ Dangerous - Can inject HTML
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

**Additional Protection**:
```typescript
import DOMPurify from 'isomorphic-dompurify';

// Sanitize before storing
const clean = DOMPurify.sanitize(userInput);
```

### 5.5 CORS Configuration

```typescript
app.use('/*', cors({
  origin: [
    'https://yourapp.com',
    'https://www.yourapp.com',
    // No localhost in production!
  ],
  credentials: true,
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
  allowHeaders: ['Content-Type', 'Authorization']
}));
```

### 5.6 Rate Limiting

```typescript
// Cloudflare Workers KV for rate limiting
const rateLimit = async (c: Context, key: string, limit: number) => {
  const count = await c.env.KV.get(key);
  const current = parseInt(count || '0');

  if (current >= limit) {
    return c.json({ error: 'Too many requests' }, 429);
  }

  await c.env.KV.put(key, (current + 1).toString(), {
    expirationTtl: 60 // 1 minute
  });

  return null;
};

// Usage
app.post('/api/auth/login', async (c) => {
  const ip = c.req.header('CF-Connecting-IP');
  const limitError = await rateLimit(c, `login:${ip}`, 5); // 5 per minute

  if (limitError) return limitError;

  // Continue with login...
});
```

---

## 6. Scalability Strategy

### 6.1 Horizontal Scaling

**Cloudflare Workers scale automatically**:
- No manual configuration needed
- Handles 0 to millions of requests
- Pay only for what you use

**Database Scaling (Neon)**:
```
Connections: 0-1000 (auto-scales)
Storage: 10GB → 1TB (auto-scales)
Compute: Scales with load
```

### 6.2 Caching Strategy

**Multi-Layer Caching**:

1. **Cloudflare Edge Cache** (CDN)
```typescript
// Cache static assets
// Automatic for:
// - Images (*.jpg, *.png)
// - JavaScript (*.js)
// - CSS (*.css)

// Custom cache rules
cache-control: public, max-age=31536000 // 1 year
```

2. **API Response Cache** (Workers KV)
```typescript
// Cache product catalog (changes infrequently)
const products = await c.env.KV.get('products:all');

if (!products) {
  const data = await prisma.product.findMany();
  await c.env.KV.put('products:all', JSON.stringify(data), {
    expirationTtl: 300 // 5 minutes
  });
  return data;
}

return JSON.parse(products);
```

3. **Database Query Cache** (Prisma Accelerate)
```typescript
const products = await prisma.product.findMany({
  cacheStrategy: { ttl: 300 } // 5 minutes
});
```

4. **Client-Side Cache** (IndexedDB)
```typescript
// Offline support + performance
const cachedContacts = await localforage.getItem('contacts');

if (cachedContacts && !forceRefresh) {
  return cachedContacts;
}
```

### 6.3 Database Optimization

**Connection Pooling**:
- Neon handles automatically
- Max 1000 concurrent connections

**Query Optimization**:
```typescript
// ✅ Good - Select only needed fields
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});

// ❌ Bad - Fetches all fields
const users = await prisma.user.findMany();
```

**Avoid N+1 Queries**:
```typescript
// ✅ Good - Single query with include
const visits = await prisma.visit.findMany({
  include: {
    contact: true,
    user: true
  }
});

// ❌ Bad - N+1 queries
const visits = await prisma.visit.findMany();
for (const visit of visits) {
  const contact = await prisma.contact.findUnique({
    where: { id: visit.contactId }
  });
}
```

---

## 7. Offline-First Architecture

### 7.1 Progressive Web App (PWA)

**Service Worker**:
```typescript
// Cache-first strategy for static assets
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('/api/')) {
    // Network-first for API
    event.respondWith(networkFirst(event.request));
  } else {
    // Cache-first for assets
    event.respondWith(cacheFirst(event.request));
  }
});
```

### 7.2 Offline Data Storage

**IndexedDB Schema**:
```typescript
{
  contacts: {
    id: string,
    name: string,
    ...
    syncStatus: 'synced' | 'pending' | 'failed'
  },

  visits: {
    id: string,
    contactId: string,
    ...
    syncStatus: 'synced' | 'pending' | 'failed'
  },

  syncQueue: {
    id: string,
    type: 'create' | 'update' | 'delete',
    resource: 'contacts' | 'visits' | 'orders',
    data: any,
    timestamp: number,
    attempts: number
  }
}
```

### 7.3 Sync Strategy

**Background Sync**:
```typescript
// Register sync when online
navigator.serviceWorker.ready.then((registration) => {
  registration.sync.register('sync-data');
});

// Handle sync event
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-data') {
    event.waitUntil(syncPendingData());
  }
});
```

**Conflict Resolution**:
```
Server timestamp > Local timestamp:
  → Server wins, update local

Local timestamp > Server timestamp:
  → Local wins, update server

Same timestamp:
  → Merge changes (if possible)
  → Otherwise, show conflict UI
```

---

## 8. Multi-Tenancy Design

**Strategy**: Schema-per-tenant (for V2)

```sql
-- V1: Single tenant (Week 1-4)
All data in single schema

-- V2: Multi-tenant (Week 8+)
CREATE SCHEMA company_abc123;
CREATE SCHEMA company_xyz456;

-- Prisma middleware sets schema per request
prisma.$use(async (params, next) => {
  const schema = getSchemaFromContext();
  return next({ ...params, schema });
});
```

**Benefits**:
- Data isolation (security)
- Easy backup/restore per company
- Custom configuration per tenant

**Trade-offs**:
- More complex migrations
- Higher database costs

---

## 9. Performance Optimization

### 9.1 Frontend Optimization

**Bundle Size**:
```bash
# Target: <500KB gzipped
npm run build
npx vite-bundle-visualizer

# Tree-shaking
import { Button } from '@/components/ui/button'; # ✅
import * as UI from '@/components/ui'; # ❌
```

**Code Splitting**:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
```

**Image Optimization**:
```typescript
// Compress before upload
import imageCompression from 'browser-image-compression';

const compressed = await imageCompression(file, {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920
});
```

### 9.2 Backend Optimization

**Worker Execution Time**:
```typescript
// Target: <50ms per request
app.use('*', async (c, next) => {
  const start = Date.now();
  await next();
  const duration = Date.now() - start;

  if (duration > 50) {
    console.warn(`Slow request: ${c.req.path} (${duration}ms)`);
  }
});
```

**Database Query Optimization**:
```typescript
// Use indexes
// Add pagination
const contacts = await prisma.contact.findMany({
  take: 20,
  skip: page * 20,
  orderBy: { createdAt: 'desc' }
});
```

---

## 10. Disaster Recovery

### 10.1 Backup Strategy

**Database (Neon)**:
- **Automatic backups**: Every day
- **Point-in-time recovery**: Last 7 days (free), 30 days (paid)
- **Branch creation**: Instant copy for testing

**R2 Storage**:
- **Versioning**: Enable for critical files
- **Cross-region replication**: Optional

### 10.2 Recovery Procedures

**Database Restore**:
```bash
# Restore to specific point in time
neon branch create main --timestamp "2024-01-15T10:00:00Z"

# Test restored data
# If OK, promote to main
```

**R2 Restore**:
```bash
# List versions
wrangler r2 object versions fieldforce-uploads/visits/photo.jpg

# Restore specific version
wrangler r2 object restore fieldforce-uploads/visits/photo.jpg --version-id xxx
```

### 10.3 Incident Response

**Severity Levels**:
- **P0 (Critical)**: System down, data loss
- **P1 (High)**: Major feature broken
- **P2 (Medium)**: Minor feature broken
- **P3 (Low)**: Cosmetic issue

**Response Times**:
- P0: 15 minutes
- P1: 1 hour
- P2: 4 hours
- P3: 24 hours

---

## Architecture Decision Records (ADRs)

### ADR-001: Cloudflare Workers over AWS Lambda

**Date**: 2025-10-05
**Status**: Accepted

**Context**: Need serverless backend with low latency in India

**Decision**: Use Cloudflare Workers

**Rationale**:
- Zero cold starts vs Lambda's 2-5s
- 10-50ms latency vs Lambda's 100-200ms
- $5/month vs Lambda's $20+/month
- Global edge vs single region

**Consequences**:
- Learning curve for team
- Some Node.js APIs unavailable
- Vendor lock-in (mitigated by clean architecture)

### ADR-002: Neon over AWS RDS/Aurora

**Date**: 2025-10-05
**Status**: Accepted

**Context**: Need serverless PostgreSQL

**Decision**: Use Neon PostgreSQL

**Rationale**:
- Serverless pricing (pay-per-use)
- Instant branching for dev/staging
- Built-in connection pooling
- Located in Mumbai (low latency)
- $19/month vs RDS $50+/month

**Consequences**:
- Newer service (less mature than RDS)
- Migration path exists (standard PostgreSQL)

### ADR-003: Cloudflare R2 over AWS S3

**Date**: 2025-10-05
**Status**: Accepted

**Context**: Need object storage for images/files

**Decision**: Use Cloudflare R2

**Rationale**:
- Zero egress fees (S3 charges $0.09/GB)
- 90% cheaper ($1.50 vs $47/month for 100GB + 500GB egress)
- S3-compatible API (easy migration)

**Consequences**:
- Newer service
- Easy migration to S3 if needed

---

**Last Updated**: 2025-10-05
**Next Review**: 2025-11-05
**Maintainer**: @raunak
