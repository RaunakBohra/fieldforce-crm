# Portable Architecture Guide

**How to switch between Cloudflare and AWS in 5-7 days**

**Last Updated**: 2025-10-05

---

## Table of Contents

1. [Overview](#1-overview)
2. [Architecture Pattern](#2-architecture-pattern)
3. [How It Works](#3-how-it-works)
4. [Writing Portable Code](#4-writing-portable-code)
5. [Migration Guide](#5-migration-guide)
6. [Testing Strategy](#6-testing-strategy)
7. [Best Practices](#7-best-practices)

---

## 1. Overview

This project uses **Hexagonal Architecture** (Ports & Adapters) to ensure **platform independence**.

### What This Means

```
✅ Your business logic works on ANY platform
✅ Switch from Cloudflare to AWS in 5-7 days
✅ Run locally with mock services
✅ Test without external dependencies
✅ No vendor lock-in
```

### What Changes vs What Stays

```
┌─────────────────────────────────────────────────┐
│         ✅ NEVER CHANGES (90% of code)          │
│                                                  │
│  - Business logic (services)                    │
│  - Database schema & queries                    │
│  - Frontend components                          │
│  - TypeScript types                             │
│  - Validation logic                             │
│  - All tests                                    │
└─────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────┐
│         ⚠️ CHANGES (10% of code)                │
│                                                  │
│  - Entry point (Workers/Lambda)                 │
│  - Dependency injection (which implementations) │
│  - Deployment config                            │
└─────────────────────────────────────────────────┘
```

---

## 2. Architecture Pattern

### Hexagonal Architecture

```
┌──────────────────────────────────────────────────┐
│              ADAPTERS (Platform)                  │
│  ┌──────────────┐         ┌──────────────┐      │
│  │  Cloudflare  │         │     AWS      │      │
│  │   Workers    │         │   Lambda     │      │
│  └──────┬───────┘         └──────┬───────┘      │
└─────────┼────────────────────────┼───────────────┘
          │                        │
          └────────────┬───────────┘
                       │
        ┌──────────────▼──────────────┐
        │    APPLICATION CORE         │
        │  (Platform-Agnostic)        │
        │                             │
        │  ┌───────────────────────┐  │
        │  │  Business Logic       │  │
        │  │  (Services)           │  │
        │  └───────────────────────┘  │
        │                             │
        │  Uses interfaces only:      │
        │  - IStorageService          │
        │  - IQueueService            │
        │  - IEmailService            │
        │  - ICacheService            │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │    INFRASTRUCTURE PORTS     │
        │    (Interfaces)             │
        └──────────────┬──────────────┘
                       │
        ┌──────────────▼──────────────┐
        │    IMPLEMENTATIONS          │
        │                             │
        │  Cloudflare:    AWS:        │
        │  - R2           - S3        │
        │  - Queues       - SQS       │
        │  - KV           - Redis     │
        │  - SES          - SES       │
        └─────────────────────────────┘
```

### Directory Structure

```
api/
├── src/
│   ├── core/                    # ✅ Platform-agnostic
│   │   └── ports/               # Interfaces
│   │       ├── IStorageService.ts
│   │       ├── IQueueService.ts
│   │       ├── IEmailService.ts
│   │       └── ICacheService.ts
│   │
│   ├── infrastructure/          # ⚠️ Platform-specific
│   │   ├── storage/
│   │   │   ├── R2StorageService.ts       # Cloudflare
│   │   │   └── S3StorageService.ts       # AWS
│   │   ├── queues/
│   │   │   ├── CloudflareQueueService.ts # Cloudflare
│   │   │   └── SQSQueueService.ts        # AWS
│   │   ├── cache/
│   │   │   ├── CloudflareKVCacheService.ts # Cloudflare
│   │   │   └── RedisCacheService.ts        # AWS
│   │   └── email/
│   │       └── SESEmailService.ts        # Both!
│   │
│   ├── config/
│   │   └── dependencies.ts      # ⚠️ DI factory
│   │
│   ├── services/                # ✅ Platform-agnostic
│   │   ├── visitService.ts
│   │   ├── orderService.ts
│   │   └── contactService.ts
│   │
│   ├── index-cloudflare.ts      # ⚠️ Cloudflare entry
│   └── index-aws.ts             # ⚠️ AWS entry
```

---

## 3. How It Works

### Step 1: Define Interfaces (Ports)

```typescript
// api/src/core/ports/IStorageService.ts

export interface IStorageService {
  uploadFile(key: string, file: Buffer, options?: UploadOptions): Promise<string>;
  deleteFile(key: string): Promise<void>;
  getSignedUrl(key: string, expiresIn?: number): Promise<string>;
  // ... other methods
}
```

**Key Point**: Business logic depends on THIS interface, not on R2 or S3!

### Step 2: Implement for Each Platform

**Cloudflare R2**:
```typescript
// api/src/infrastructure/storage/R2StorageService.ts

export class R2StorageService implements IStorageService {
  constructor(private bucket: R2Bucket) {}

  async uploadFile(key: string, file: Buffer): Promise<string> {
    await this.bucket.put(key, file);
    return `https://cdn.yourapp.com/${key}`;
  }
  // ... other methods
}
```

**AWS S3**:
```typescript
// api/src/infrastructure/storage/S3StorageService.ts

export class S3StorageService implements IStorageService {
  constructor(private s3: S3Client, private bucket: string) {}

  async uploadFile(key: string, file: Buffer): Promise<string> {
    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: file
    }));
    return `https://${this.bucket}.s3.amazonaws.com/${key}`;
  }
  // ... other methods
}
```

**Key Point**: Both implement the SAME interface!

### Step 3: Write Business Logic Using Interfaces

```typescript
// api/src/services/visitService.ts

export class VisitService {
  constructor(
    private prisma: PrismaClient,
    private storage: IStorageService,  // ← Interface, not R2 or S3!
    private queue: IQueueService,      // ← Interface, not Queues or SQS!
    private cache: ICacheService       // ← Interface, not KV or Redis!
  ) {}

  async createVisit(data: CreateVisitDTO): Promise<Visit> {
    // Upload photo to storage
    const photoUrl = await this.storage.uploadFile(key, buffer);
    // ☝️ Works with R2, S3, or ANY storage that implements interface!

    // Create visit in DB
    const visit = await this.prisma.visit.create({ /* ... */ });

    // Queue notification
    await this.queue.sendMessage('analytics-events', { /* ... */ });
    // ☝️ Works with Cloudflare Queues, SQS, or ANY queue!

    // Invalidate cache
    await this.cache.delete(`visits:${userId}`);
    // ☝️ Works with KV, Redis, or ANY cache!

    return visit;
  }
}
```

**Key Point**: This code NEVER changes, regardless of platform!

### Step 4: Dependency Injection Factory

```typescript
// api/src/config/dependencies.ts

export function createCloudfareDependencies(env: CloudflareEnv) {
  return {
    storage: new R2StorageService(env.BUCKET),
    queue: new CloudflareQueueService(env.QUEUE),
    cache: new CloudflareKVCacheService(env.KV)
  };
}

export function createAWSDependencies(env: AWSEnv) {
  return {
    storage: new S3StorageService(s3Client, env.S3_BUCKET),
    queue: new SQSQueueService(sqsClient, queueUrls),
    cache: new RedisCacheService(env.REDIS_URL)
  };
}
```

### Step 5: Platform-Specific Entry Points

**Cloudflare Workers**:
```typescript
// api/src/index-cloudflare.ts

app.post('/api/visits', async (c) => {
  const deps = createCloudfareDependencies(c.env);  // ← Cloudflare!

  const visitService = new VisitService(
    prisma,
    deps.storage,  // R2StorageService
    deps.queue,    // CloudflareQueueService
    deps.cache     // CloudflareKVCacheService
  );

  const visit = await visitService.createVisit(data);
  return c.json({ visit });
});
```

**AWS Lambda**:
```typescript
// api/src/index-aws.ts

export async function handler(event) {
  const deps = createAWSDependencies(process.env);  // ← AWS!

  const visitService = new VisitService(
    prisma,
    deps.storage,  // S3StorageService
    deps.queue,    // SQSQueueService
    deps.cache     // RedisCacheService
  );

  const visit = await visitService.createVisit(data);
  return { statusCode: 201, body: JSON.stringify({ visit }) };
}
```

**Key Point**: SAME VisitService, different implementations injected!

---

## 4. Writing Portable Code

### ✅ DO: Depend on Interfaces

```typescript
// ✅ Good
class OrderService {
  constructor(
    private storage: IStorageService,    // Interface
    private email: IEmailService         // Interface
  ) {}
}
```

### ❌ DON'T: Depend on Implementations

```typescript
// ❌ Bad - Locked to R2
class OrderService {
  constructor(
    private bucket: R2Bucket,            // Cloudflare-specific!
    private ses: SESClient               // AWS-specific!
  ) {}
}
```

### ✅ DO: Use Dependency Injection

```typescript
// ✅ Good - Dependencies injected
const service = new VisitService(
  prisma,
  deps.storage,  // Injected
  deps.queue     // Injected
);
```

### ❌ DON'T: Instantiate Inside

```typescript
// ❌ Bad - Hard-coded to R2
class VisitService {
  constructor() {
    this.storage = new R2StorageService(/* ... */);  // Locked!
  }
}
```

### ✅ DO: Keep Platform Logic in Adapters

```typescript
// ✅ Good - In adapter
class R2StorageService implements IStorageService {
  async uploadFile(key: string, file: Buffer) {
    await this.bucket.put(key, file);  // R2-specific here
    return this.getPublicUrl(key);
  }
}
```

### ❌ DON'T: Put Platform Logic in Services

```typescript
// ❌ Bad - R2 logic in service
class VisitService {
  async createVisit(data: CreateVisitDTO) {
    await this.r2Bucket.put(key, file);  // R2-specific in business logic!
  }
}
```

---

## 5. Migration Guide

### Cloudflare → AWS Migration

**Timeline**: 5-7 days

#### Day 1: Database (2-3 hours)

```bash
# 1. Create RDS instance
aws rds create-db-instance \
  --db-instance-identifier fieldforce-crm \
  --engine postgres

# 2. Export from Neon
pg_dump $NEON_URL > backup.sql

# 3. Import to RDS
psql $RDS_URL < backup.sql

# 4. Update .env
DATABASE_URL="postgresql://user:pass@rds-endpoint/db"

# ✅ Zero code changes needed!
```

#### Day 2: Storage (3-4 hours)

```bash
# 1. Create S3 bucket
aws s3 mb s3://fieldforce-uploads

# 2. Sync files R2 → S3
rclone sync r2:fieldforce-uploads s3:fieldforce-uploads

# 3. No code changes needed - already using interface!
# Just change dependency injection:
```

```typescript
// Before
const storage = new R2StorageService(env.BUCKET);

// After
const storage = new S3StorageService(s3Client, 'fieldforce-uploads');
```

#### Day 3: Queue (4-5 hours)

```bash
# 1. Create SQS queues
aws sqs create-queue --queue-name email-queue
aws sqs create-queue --queue-name payment-reminders

# 2. No code changes needed - already using interface!
# Just change dependency injection:
```

```typescript
// Before
const queue = new CloudflareQueueService(env.QUEUE);

// After
const queue = new SQSQueueService(sqsClient, queueUrls);
```

#### Day 4-5: Backend (1-2 days)

```typescript
// Option A: Use Hono on Lambda (faster)
import { handle } from 'hono/aws-lambda';
export const handler = handle(app);  // That's it!

// Option B: Convert to Express (more work)
// Convert each route from Hono to Express syntax
```

#### Day 6: Frontend (2-3 hours)

```bash
# Deploy to S3 + CloudFront instead of Pages
npm run build
aws s3 sync dist/ s3://yourapp-frontend
```

#### Day 7: Testing & Cutover

```bash
# 1. Test all endpoints
# 2. Update DNS
# 3. Monitor for issues
# 4. Decommission Cloudflare (or keep as backup)
```

---

## 6. Testing Strategy

### Unit Testing (No External Dependencies)

```typescript
// tests/services/visitService.test.ts

describe('VisitService', () => {
  let visitService: VisitService;
  let mockStorage: IStorageService;
  let mockQueue: IQueueService;
  let mockCache: ICacheService;

  beforeEach(() => {
    // Create mocks implementing interfaces
    mockStorage = {
      uploadFile: jest.fn().mockResolvedValue('https://mock.com/photo.jpg'),
      deleteFile: jest.fn(),
      // ... other methods
    };

    mockQueue = {
      sendMessage: jest.fn(),
      // ... other methods
    };

    mockCache = {
      get: jest.fn(),
      set: jest.fn(),
      delete: jest.fn(),
      // ... other methods
    };

    // Inject mocks
    visitService = new VisitService(
      mockPrisma,
      mockStorage,
      mockQueue,
      mockCache
    );
  });

  it('should create visit with photo upload', async () => {
    const visit = await visitService.createVisit({
      contactId: '123',
      userId: '456',
      latitude: 19.0760,
      longitude: 72.8777,
      address: 'Mumbai',
      photos: [mockPhoto]
    });

    // Verify storage was called
    expect(mockStorage.uploadFile).toHaveBeenCalledWith(
      expect.stringContaining('visits/123'),
      expect.any(Buffer)
    );

    // Verify queue was called
    expect(mockQueue.sendMessage).toHaveBeenCalledWith(
      'analytics-events',
      expect.objectContaining({ type: 'VISIT_CREATED' })
    );

    // Verify cache was invalidated
    expect(mockCache.delete).toHaveBeenCalledWith('visits:user:456');
  });
});
```

**Key Point**: Tests work on ALL platforms because they use mocks!

### Integration Testing

```typescript
// tests/integration/cloudflare.test.ts

describe('Cloudflare Integration', () => {
  it('should work with real R2, Queues, KV', async () => {
    const deps = createCloudfareDependencies(testEnv);
    // Test with real Cloudflare services
  });
});

// tests/integration/aws.test.ts

describe('AWS Integration', () => {
  it('should work with real S3, SQS, Redis', async () => {
    const deps = createAWSDependencies(testEnv);
    // Test with real AWS services
  });
});
```

---

## 7. Best Practices

### 1. Interface-First Design

```typescript
// ✅ Always define interface first
export interface IPaymentService {
  processPayment(orderId: string, amount: number): Promise<PaymentResult>;
}

// Then implement
export class StripePaymentService implements IPaymentService { /* ... */ }
export class RazorpayPaymentService implements IPaymentService { /* ... */ }
```

### 2. Small, Focused Interfaces

```typescript
// ✅ Good - Single responsibility
export interface IEmailService {
  sendEmail(params: EmailParams): Promise<void>;
}

export interface ISMSService {
  sendSMS(phone: string, message: string): Promise<void>;
}

// ❌ Bad - Too broad
export interface INotificationService {
  sendEmail(...): Promise<void>;
  sendSMS(...): Promise<void>;
  sendWhatsApp(...): Promise<void>;
  sendPush(...): Promise<void>;
}
```

### 3. Explicit Dependencies

```typescript
// ✅ Good - All dependencies in constructor
class OrderService {
  constructor(
    private prisma: PrismaClient,
    private storage: IStorageService,
    private queue: IQueueService,
    private email: IEmailService
  ) {}
}

// ❌ Bad - Hidden dependencies
class OrderService {
  async createOrder() {
    // Where did this come from?
    await global.storage.upload(...);
  }
}
```

### 4. No Platform-Specific Code in Business Logic

```typescript
// ✅ Good
class VisitService {
  async uploadPhoto(key: string, file: Buffer) {
    return this.storage.uploadFile(key, file);  // Platform-agnostic
  }
}

// ❌ Bad
class VisitService {
  async uploadPhoto(key: string, file: Buffer) {
    if (process.env.PLATFORM === 'cloudflare') {
      return this.r2.put(key, file);
    } else {
      return this.s3.send(new PutObjectCommand({ /* ... */ }));
    }
  }
}
```

### 5. Test with Mocks

```typescript
// ✅ Easy to test
const mockStorage: IStorageService = {
  uploadFile: jest.fn(),
  // ...
};

const service = new VisitService(prisma, mockStorage, mockQueue, mockCache);

// ❌ Hard to test
const service = new VisitService(realR2Bucket, realQueues, realKV);
```

---

## Summary

### What You Get

✅ **Flexibility**: Switch platforms in days, not months
✅ **Testability**: Mock all external dependencies
✅ **No Lock-In**: Never married to one vendor
✅ **Future-Proof**: Easy to add new platforms
✅ **Clean Code**: Business logic stays clean

### What It Costs

⚠️ **More abstraction**: Extra interfaces
⚠️ **Learning curve**: Team needs to understand pattern
⚠️ **Initial setup**: Takes time upfront

### When to Use

- ✅ Building SaaS product
- ✅ Uncertain about platform
- ✅ Need to support enterprise customers
- ✅ Want flexibility

### When to Skip

- ❌ Proof of concept
- ❌ Internal tool
- ❌ Fully committed to one platform
- ❌ Very small team

---

## 📚 Related Documentation

### For Compute Portability (Frontend & Backend Hosting)

See **[COMPUTE_PORTABILITY_GUIDE.md](./COMPUTE_PORTABILITY_GUIDE.md)** for:
- **Frontend hosting portability** (Cloudflare Pages → Vercel → Netlify → AWS)
- **Backend compute portability** (Workers → Lambda → Cloud Functions → Node.js)
- **Entry point abstraction patterns** (How to structure index.ts for portability)
- **Hono framework strategy** (Same code, different platforms)
- **Platform-specific entry points** (Cloudflare, AWS, Google Cloud, Node.js)
- **Migration time estimates** (4-6 hours per platform)
- **Deployment comparisons** (Cost, performance, complexity)

**Key Difference**:
- **This guide** (PORTABLE_ARCHITECTURE_GUIDE) → Infrastructure portability (Storage, Queue, Cache, Email)
- **COMPUTE_PORTABILITY_GUIDE** → Compute portability (Frontend hosting, Backend runtime)

**Together**: Complete portability across all layers

### For System Architecture

See **[TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)** for:
- Overall system design
- Technology choices
- Security architecture
- Performance optimization

### For Implementation

See **[Day 1-5 Implementation Plans](../03-implementation-plans/)** for:
- Step-by-step build guide
- Code examples
- Testing procedures

---

**For Field Force CRM**: We're using this architecture from Day 1 because:
1. Starting with Cloudflare for cost savings
2. May need AWS for enterprise customers later
3. Flexibility is worth the small extra effort
4. Clean architecture anyway

---

**Last Updated**: 2025-10-05
**Next Review**: After Week 4 MVP
**Maintainer**: @raunak
