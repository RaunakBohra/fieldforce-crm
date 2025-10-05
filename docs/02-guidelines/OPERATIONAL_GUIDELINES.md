# Operational Guidelines - Field Force CRM

**Version**: 1.0
**Last Updated**: 2025-10-05
**Purpose**: DevOps, deployment, and production operations

---

## Table of Contents

1. [Deployment & CI/CD](#1-deployment--cicd)
2. [Environment Management](#2-environment-management)
3. [Multi-Tenancy Operations](#3-multi-tenancy-operations)
4. [Background Jobs & Queues](#4-background-jobs--queues)
5. [Rate Limiting & Security](#5-rate-limiting--security)
6. [Data Privacy & Compliance](#6-data-privacy--compliance)
7. [Backup & Disaster Recovery](#7-backup--disaster-recovery)
8. [Monitoring & Alerting](#8-monitoring--alerting)
9. [Incident Response](#9-incident-response)
10. [Cost Optimization](#10-cost-optimization)
11. [Third-Party Integrations](#11-third-party-integrations)
12. [Release Management](#12-release-management)

---

## 1. Deployment & CI/CD

### 1.1 Deployment Checklist

**Before Every Deployment**:
- [ ] All tests passing (70% backend, 60% frontend coverage)
- [ ] No TypeScript errors (`tsc --noEmit`)
- [ ] No ESLint errors
- [ ] Database migrations tested on staging
- [ ] Environment variables configured
- [ ] Secrets rotated (if needed)
- [ ] Performance tested (Lighthouse score >90)
- [ ] Security scan passed (npm audit)
- [ ] Rollback plan ready
- [ ] Team notified

### 1.2 GitHub Actions CI/CD Pipeline

**`.github/workflows/ci.yml`** (Backend + Frontend):
```yaml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./api
        run: npm ci

      - name: Run TypeScript check
        working-directory: ./api
        run: npx tsc --noEmit

      - name: Run tests
        working-directory: ./api
        run: npm test -- --coverage
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/test_db
          JWT_SECRET: test-secret

      - name: Upload coverage
        uses: codecov/codecov-action@v3

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'

      - name: Install dependencies
        working-directory: ./web
        run: npm ci

      - name: Run TypeScript check
        working-directory: ./web
        run: npx tsc --noEmit

      - name: Run tests
        working-directory: ./web
        run: npm test -- --coverage

      - name: Build
        working-directory: ./web
        run: npm run build

  deploy-production:
    needs: [backend-test, frontend-test]
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v3

      - name: Deploy to Vercel (Frontend)
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'
          working-directory: ./web

      - name: Deploy to Railway (Backend)
        run: |
          npm install -g @railway/cli
          railway up --service backend
        env:
          RAILWAY_TOKEN: ${{ secrets.RAILWAY_TOKEN }}
        working-directory: ./api
```

### 1.3 Environment Promotion

**Workflow**:
```
Local Dev → Staging → Production
```

**Staging Environment**:
- Same configuration as production
- Real data (anonymized if sensitive)
- Test migrations before production
- Performance testing ground

**Production Deployment**:
```bash
# 1. Merge to main after PR approval
git checkout main
git pull origin main

# 2. CI/CD auto-deploys to production
# Monitor deployment in GitHub Actions

# 3. Run smoke tests
curl https://api.yourapp.com/health
# Expected: {"status":"ok"}

# 4. Monitor for 15 minutes
# Check Sentry for errors
# Check logs for anomalies

# 5. Rollback if issues (within 5 minutes)
vercel rollback  # Frontend
railway rollback # Backend
```

### 1.4 Zero-Downtime Deployment

**Database Migrations**:
```bash
# ✅ Good - Backward-compatible migration
# 1. Add new column (nullable)
# 2. Deploy code that writes to both old and new
# 3. Backfill data
# 4. Deploy code that only uses new
# 5. Remove old column

# ❌ Bad - Breaking migration
# ALTER TABLE users DROP COLUMN old_field; -- Breaks running code!
```

**Blue-Green Deployment** (for critical updates):
```
1. Deploy new version (green) alongside old (blue)
2. Route 10% traffic to green
3. Monitor for errors
4. Gradually increase to 50%, then 100%
5. Keep blue running for 1 hour as fallback
6. Decommission blue
```

---

## 2. Environment Management

### 2.1 Environment Variables

**Development (Local)**:
```bash
# api/.env
NODE_ENV=development
PORT=5000
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fieldforce_crm
JWT_SECRET=dev-secret-change-in-production
REDIS_URL=redis://localhost:6379
LOG_LEVEL=debug

# Disable external services in dev
ENABLE_SMS=false
ENABLE_EMAIL=false
```

**Staging**:
```bash
NODE_ENV=staging
PORT=5000
DATABASE_URL=postgresql://user:pass@staging-db.railway.app:5432/staging_db
JWT_SECRET=<strong-random-secret>
REDIS_URL=redis://staging-redis.railway.app:6379
LOG_LEVEL=info

# Enable with test credentials
ENABLE_SMS=true
SMS_API_KEY=test_api_key
ENABLE_EMAIL=true
EMAIL_API_KEY=test_api_key
```

**Production**:
```bash
NODE_ENV=production
PORT=5000
DATABASE_URL=postgresql://user:pass@prod-db.railway.app:5432/prod_db
JWT_SECRET=<strong-random-secret-rotate-every-90-days>
REDIS_URL=redis://prod-redis.railway.app:6379
LOG_LEVEL=warn

# Real credentials (stored in Railway secrets)
AWS_ACCESS_KEY_ID=<secret>
AWS_SECRET_ACCESS_KEY=<secret>
SMS_API_KEY=<secret>
EMAIL_API_KEY=<secret>
WHATSAPP_API_KEY=<secret>

# Security
RATE_LIMIT_WINDOW_MS=900000  # 15 minutes
RATE_LIMIT_MAX=100

# Monitoring
SENTRY_DSN=<sentry-url>
```

### 2.2 Secret Management

**Never commit secrets to git**:
```bash
# ✅ Good - .env (gitignored)
JWT_SECRET=actual-secret-here

# ✅ Good - .env.example (committed)
JWT_SECRET=your-jwt-secret-here

# ❌ Bad - Committed to git
JWT_SECRET=supersecret123 # IN CODE FILE!
```

**Rotate secrets every 90 days**:
```bash
# Generate strong secrets
openssl rand -base64 32

# Update in Railway/Vercel
railway variables set JWT_SECRET=<new-secret>

# Rolling restart (zero downtime)
railway up --service backend
```

---

## 3. Multi-Tenancy Operations

### 3.1 Tenant Isolation (Schema-Per-Tenant)

**Architecture**:
```
Database: fieldforce_crm
├── public schema (shared)
│   └── companies table
├── company_1 schema (tenant 1)
│   ├── users
│   ├── contacts
│   ├── visits
│   └── ...
└── company_2 schema (tenant 2)
    ├── users
    ├── contacts
    └── ...
```

**Tenant Context Middleware**:
```typescript
// api/src/middleware/tenantContext.ts
import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

export const setTenantContext = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const user = (req as any).user; // From auth middleware

  if (!user || !user.companyId) {
    return res.status(401).json({ error: 'No tenant context' });
  }

  // Get company schema name
  const company = await prisma.company.findUnique({
    where: { id: user.companyId },
    select: { schemaName: true }
  });

  if (!company) {
    return res.status(404).json({ error: 'Company not found' });
  }

  // Set Prisma schema for this request
  (req as any).tenantSchema = company.schemaName;

  next();
};
```

### 3.2 Tenant Provisioning

**Create New Tenant** (Week 2+):
```typescript
async function provisionTenant(companyData: {
  name: string;
  email: string;
  adminName: string;
  adminEmail: string;
  adminPassword: string;
}) {
  // 1. Create company in public schema
  const company = await prisma.company.create({
    data: {
      name: companyData.name,
      email: companyData.email,
      schemaName: `company_${uuid()}`,
      plan: 'trial',
      planStatus: 'active'
    }
  });

  // 2. Create tenant schema
  await prisma.$executeRaw`
    CREATE SCHEMA ${company.schemaName};
  `;

  // 3. Run migrations for tenant schema
  await runMigrationsForTenant(company.schemaName);

  // 4. Create admin user in tenant schema
  const passwordHash = await hashPassword(companyData.adminPassword);

  await prisma.$executeRaw`
    INSERT INTO ${company.schemaName}.users (id, name, email, password_hash, role)
    VALUES (${uuid()}, ${companyData.adminName}, ${companyData.adminEmail}, ${passwordHash}, 'super_admin');
  `;

  // 5. Send welcome email
  await sendWelcomeEmail(companyData.email);

  return company;
}
```

### 3.3 Cross-Tenant Data Access Prevention

**CRITICAL - Prevent Data Leaks**:
```typescript
// ✅ Good - Scoped to tenant
export const getContacts = async (req: Request, res: Response) => {
  const tenantSchema = (req as any).tenantSchema;

  // Query scoped to tenant's schema automatically
  const contacts = await prisma.contact.findMany({
    // Prisma already scoped to tenantSchema from middleware
  });

  res.json({ contacts });
};

// ❌ Bad - Could access other tenant's data
export const getContacts = async (req: Request, res: Response) => {
  const contacts = await prisma.contact.findMany(); // Global query!
  res.json({ contacts });
};
```

---

## 4. Background Jobs & Queues

### 4.1 Job Queue Setup (BullMQ + Redis)

**Install**:
```bash
npm install bullmq ioredis
```

**Queue Configuration**:
```typescript
// api/src/jobs/queues.ts
import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';

const connection = new Redis(process.env.REDIS_URL);

// Payment reminders queue
export const paymentRemindersQueue = new Queue('payment-reminders', {
  connection
});

// Email queue
export const emailQueue = new Queue('emails', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 1000 // Start with 1s, then 2s, then 4s
    }
  }
});

// SMS queue
export const smsQueue = new Queue('sms', {
  connection
});
```

### 4.2 Job Processors

```typescript
// api/src/jobs/workers/paymentReminderWorker.ts
import { Worker } from 'bullmq';
import { sendPaymentReminder } from '../../services/notificationService';

const paymentReminderWorker = new Worker(
  'payment-reminders',
  async (job) => {
    const { orderId, contactPhone, amount } = job.data;

    try {
      await sendPaymentReminder({
        phone: contactPhone,
        amount,
        orderId
      });

      return { success: true };
    } catch (error) {
      console.error('Payment reminder failed:', error);
      throw error; // Will retry based on job options
    }
  },
  {
    connection: new Redis(process.env.REDIS_URL),
    concurrency: 10 // Process 10 jobs concurrently
  }
);

paymentReminderWorker.on('completed', (job) => {
  console.log(`Payment reminder sent for order ${job.data.orderId}`);
});

paymentReminderWorker.on('failed', (job, err) => {
  console.error(`Payment reminder failed for order ${job?.data?.orderId}:`, err);
});
```

### 4.3 Scheduling Jobs (Cron)

```typescript
// api/src/jobs/schedulers/dailyPaymentReminders.ts
import cron from 'node-cron';
import { paymentRemindersQueue } from '../queues';
import { prisma } from '../../utils/prisma';

// Run every day at 10 AM
export const scheduleDailyPaymentReminders = () => {
  cron.schedule('0 10 * * *', async () => {
    console.log('Running daily payment reminders...');

    // Get overdue orders (>15 days)
    const overdueOrders = await prisma.order.findMany({
      where: {
        status: 'approved',
        paymentStatus: { in: ['unpaid', 'partial'] },
        createdAt: {
          lte: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
        }
      },
      include: {
        contact: { select: { phone: true } }
      }
    });

    // Queue reminders
    for (const order of overdueOrders) {
      await paymentRemindersQueue.add('send-reminder', {
        orderId: order.id,
        contactPhone: order.contact.phone,
        amount: order.totalAmount
      });
    }

    console.log(`Queued ${overdueOrders.length} payment reminders`);
  });
};
```

### 4.4 Monitoring Jobs

```typescript
// Dashboard to monitor queue health
import { Queue } from 'bullmq';

export const getQueueStats = async (queueName: string) => {
  const queue = new Queue(queueName, { connection });

  const [waiting, active, completed, failed] = await Promise.all([
    queue.getWaitingCount(),
    queue.getActiveCount(),
    queue.getCompletedCount(),
    queue.getFailedCount()
  ]);

  return {
    waiting,
    active,
    completed,
    failed
  };
};
```

---

## 5. Rate Limiting & Security

### 5.1 API Rate Limiting

```typescript
// api/src/middleware/rateLimiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

// General API rate limit
export const apiLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:api:'
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false
});

// Strict rate limit for auth endpoints
export const authLimiter = rateLimit({
  store: new RedisStore({
    client: redis,
    prefix: 'rl:auth:'
  }),
  windowMs: 15 * 60 * 1000,
  max: 5, // Only 5 login attempts per 15 minutes
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again after 15 minutes'
});

// In server.ts
app.use('/api', apiLimiter);
app.use('/auth/login', authLimiter);
app.use('/auth/signup', authLimiter);
```

### 5.2 DDoS Protection

```typescript
// api/src/middleware/ddosProtection.ts
import slowDown from 'express-slow-down';

export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 50, // Allow 50 requests at full speed
  delayMs: 500 // Add 500ms delay per request after delayAfter
});

// In server.ts
app.use(speedLimiter);
```

### 5.3 IP Blacklisting/Whitelisting

```typescript
// api/src/middleware/ipFilter.ts
const BLACKLISTED_IPS = process.env.BLACKLISTED_IPS?.split(',') || [];
const WHITELISTED_IPS = process.env.WHITELISTED_IPS?.split(',') || [];

export const ipFilter = (req: Request, res: Response, next: NextFunction) => {
  const clientIp = req.ip || req.connection.remoteAddress;

  if (BLACKLISTED_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied' });
  }

  // For admin routes, require whitelisted IP
  if (req.path.startsWith('/admin') && !WHITELISTED_IPS.includes(clientIp)) {
    return res.status(403).json({ error: 'Access denied - admin routes require whitelisted IP' });
  }

  next();
};
```

---

## 6. Data Privacy & Compliance

### 6.1 GDPR Compliance (Right to Deletion)

```typescript
// api/src/controllers/gdpr.ts
export const deleteUserData = async (req: Request, res: Response) => {
  const { userId } = req.params;

  // Verify user is requesting their own data or is admin
  const requestingUser = (req as any).user;
  if (requestingUser.userId !== userId && requestingUser.role !== 'super_admin') {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  // Delete user and all related data
  await prisma.$transaction(async (tx) => {
    // Delete visits
    await tx.visit.deleteMany({ where: { userId } });

    // Delete orders
    await tx.order.deleteMany({ where: { userId } });

    // Delete payments
    await tx.payment.deleteMany({ where: { recordedBy: userId } });

    // Finally delete user
    await tx.user.delete({ where: { id: userId } });
  });

  // Log deletion for audit trail
  logger.info('User data deleted (GDPR request)', { userId });

  res.json({ message: 'User data deleted successfully' });
};
```

### 6.2 DPDP Act 2023 (India Data Protection)

**Data Localization**:
- Store Indian user data in Indian region (if required)
- Use AWS Mumbai region or Indian data centers

**Consent Management**:
```typescript
interface UserConsent {
  userId: string;
  dataProcessing: boolean;
  marketing: boolean;
  analytics: boolean;
  consentDate: Date;
  ipAddress: string;
}

// Store consent record
await prisma.userConsent.create({
  data: {
    userId: user.id,
    dataProcessing: true,
    marketing: req.body.marketingConsent,
    analytics: req.body.analyticsConsent,
    consentDate: new Date(),
    ipAddress: req.ip
  }
});
```

### 6.3 PII (Personal Identifiable Information) Handling

**Encrypt sensitive data**:
```typescript
// api/src/utils/encryption.ts
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY!; // 32-byte key
const ALGORITHM = 'aes-256-gcm';

export const encrypt = (text: string): string => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');

  const authTag = cipher.getAuthTag();

  return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
};

export const decrypt = (encrypted: string): string => {
  const [ivHex, authTagHex, encryptedText] = encrypted.split(':');

  const iv = Buffer.from(ivHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv(ALGORITHM, Buffer.from(ENCRYPTION_KEY, 'hex'), iv);

  decipher.setAuthTag(authTag);

  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');

  return decrypted;
};

// Usage
const encryptedPhone = encrypt(user.phone);
const decryptedPhone = decrypt(encryptedPhone);
```

---

## 7. Backup & Disaster Recovery

### 7.1 Database Backup Strategy

**Automated Daily Backups** (Railway PostgreSQL):
```bash
# Railway automatically backs up daily
# Retention: 30 days

# Manual backup
railway database backup create

# List backups
railway database backup list

# Restore from backup
railway database restore <backup-id>
```

**Custom Backup Script**:
```bash
#!/bin/bash
# scripts/backup-db.sh

DATE=$(date +%Y-%m-%d_%H-%M-%S)
BACKUP_FILE="backup_$DATE.sql"

# Dump database
pg_dump $DATABASE_URL > $BACKUP_FILE

# Compress
gzip $BACKUP_FILE

# Upload to S3
aws s3 cp $BACKUP_FILE.gz s3://your-backups-bucket/

# Keep only last 30 days locally
find . -name "backup_*.sql.gz" -mtime +30 -delete

echo "Backup completed: $BACKUP_FILE.gz"
```

**Schedule daily backups**:
```bash
# crontab -e
0 2 * * * /path/to/backup-db.sh
```

### 7.2 Point-in-Time Recovery (PITR)

**Enable WAL (Write-Ahead Logging)**:
```sql
-- PostgreSQL config
wal_level = replica
archive_mode = on
archive_command = 'aws s3 cp %p s3://your-wal-bucket/%f'
```

### 7.3 Disaster Recovery Plan

**RTO/RPO Targets**:
- **RTO (Recovery Time Objective)**: 4 hours
- **RPO (Recovery Point Objective)**: 24 hours (daily backups)

**Recovery Procedure**:
1. **Detect**: Monitoring alerts trigger incident
2. **Assess**: Determine severity (partial vs total failure)
3. **Notify**: Alert team via Slack/PagerDuty
4. **Restore Database**:
   ```bash
   # Restore from latest backup
   railway database restore <latest-backup-id>

   # Or manual restore
   gunzip backup_latest.sql.gz
   psql $DATABASE_URL < backup_latest.sql
   ```
5. **Redeploy Services**:
   ```bash
   railway up --service backend
   vercel deploy --prod
   ```
6. **Verify**: Run smoke tests
7. **Monitor**: Watch for errors for 1 hour
8. **Post-Mortem**: Document incident and lessons learned

---

## 8. Monitoring & Alerting

### 8.1 Sentry Error Tracking

```typescript
// api/src/utils/sentry.ts
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of transactions
  beforeSend(event, hint) {
    // Don't send sensitive data
    if (event.request) {
      delete event.request.headers?.authorization;
      delete event.request.cookies;
    }
    return event;
  }
});

// In server.ts
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.errorHandler());
```

### 8.2 Performance Monitoring (APM)

```typescript
// Track slow queries
import { prisma } from './utils/prisma';

prisma.$use(async (params, next) => {
  const before = Date.now();
  const result = await next(params);
  const after = Date.now();

  const duration = after - before;

  if (duration > 1000) { // Slow query (>1s)
    logger.warn('Slow query detected', {
      model: params.model,
      action: params.action,
      duration: `${duration}ms`
    });
  }

  return result;
});
```

### 8.3 Uptime Monitoring (Better Stack)

**Setup**:
- Monitor: `https://api.yourapp.com/health`
- Frequency: Every 1 minute
- Alert if: >2 failures in 5 minutes
- Notification: Email + Slack

**Health Check Endpoint**:
```typescript
// api/src/routes/health.ts
export const healthCheck = async (req: Request, res: Response) => {
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    // Check Redis connection
    await redis.ping();

    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      error: error.message
    });
  }
};
```

### 8.4 Alerting Rules

**Critical Alerts** (Page immediately):
- API down (health check fails)
- Database down
- Error rate >10% (5xx errors)
- Response time >5s (p95)

**Warning Alerts** (Email/Slack):
- Error rate >5%
- Response time >2s (p95)
- Disk usage >80%
- Memory usage >85%

**Info Alerts** (Log only):
- Slow queries (>1s)
- High traffic (>1000 req/min)

---

## 9. Incident Response

### 9.1 Incident Severity Levels

**SEV-1 (Critical)** - Page immediately:
- Complete service outage
- Data breach
- Payment processing down
- Database corruption

**SEV-2 (High)** - Respond within 1 hour:
- Partial service degradation
- High error rate (>10%)
- Security vulnerability

**SEV-3 (Medium)** - Respond within 4 hours:
- Non-critical feature broken
- Performance degradation
- Minor bugs affecting some users

**SEV-4 (Low)** - Handle during business hours:
- Cosmetic issues
- Feature requests
- Documentation updates

### 9.2 Incident Response Procedure

**1. Detection & Alert**:
- Monitoring alert triggers
- User reports issue
- Team member notices problem

**2. Acknowledgment**:
- Acknowledge alert in PagerDuty/Slack
- Create incident ticket
- Notify team in #incidents channel

**3. Investigation**:
- Check Sentry for errors
- Review logs in Railway/Vercel
- Check database status
- Identify root cause

**4. Mitigation**:
- Apply immediate fix (hotfix)
- Or rollback to previous version
- Communicate with users (status page)

**5. Resolution**:
- Verify fix deployed
- Monitor for 1 hour
- Update status page
- Close incident ticket

**6. Post-Mortem** (within 48 hours):
- Document timeline
- Identify root cause
- List action items
- Share learnings with team

### 9.3 Incident Communication

**Status Page Updates**:
```
[2025-01-15 14:30] Investigating - We're investigating reports of slow API responses.

[2025-01-15 14:45] Identified - We've identified a database connection pool issue.

[2025-01-15 15:00] Monitoring - A fix has been deployed. We're monitoring the situation.

[2025-01-15 15:30] Resolved - The issue has been resolved. All systems are operational.
```

---

## 10. Cost Optimization

### 10.1 Database Cost Optimization

**Query Optimization**:
- Add indexes on frequently queried columns
- Use `select` to fetch only needed fields
- Implement pagination (don't fetch all records)
- Use database-level aggregations (not in-memory)

**Connection Pooling**:
```typescript
// Limit connections to avoid overage charges
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  pool: {
    min: 2,
    max: 10 // Adjust based on plan
  }
});
```

### 10.2 Storage Cost Optimization

**S3 Lifecycle Policies**:
```json
{
  "Rules": [{
    "Id": "Move old visit photos to Glacier",
    "Status": "Enabled",
    "Transitions": [{
      "Days": 90,
      "StorageClass": "GLACIER"
    }],
    "Expiration": {
      "Days": 365
    }
  }]
}
```

**Image Compression**:
```typescript
// Compress images before uploading to S3
import sharp from 'sharp';

const compressImage = async (buffer: Buffer): Promise<Buffer> => {
  return sharp(buffer)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 80 })
    .toBuffer();
};
```

### 10.3 Monitoring Costs

**Set Budget Alerts**:
- AWS Budget: Alert if cost >$100/month
- Railway: Alert if usage >80% of plan
- Vercel: Monitor bandwidth usage

**Cost Dashboard**:
```typescript
// Track costs per tenant
export const getTenantCosts = async (companyId: string) => {
  const [dbQueries, storageUsed, apiCalls] = await Promise.all([
    getDbQueriesCount(companyId),
    getStorageUsed(companyId),
    getApiCallsCount(companyId)
  ]);

  return {
    estimatedMonthlyCost: calculateCost({
      dbQueries,
      storageUsed,
      apiCalls
    })
  };
};
```

---

## 11. Third-Party Integrations

### 11.1 Webhook Signature Verification

**Verify incoming webhooks**:
```typescript
// api/src/middleware/verifyWebhook.ts
import crypto from 'crypto';

export const verifyRazorpayWebhook = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const signature = req.headers['x-razorpay-signature'];
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(400).json({ error: 'Invalid signature' });
  }

  next();
};

// Usage
router.post('/webhooks/razorpay', verifyRazorpayWebhook, handlePaymentWebhook);
```

### 11.2 Retry with Exponential Backoff

**For external API calls**:
```typescript
async function callExternalAPI<T>(
  fn: () => Promise<T>,
  maxRetries: number = 3
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      if (i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError!;
}

// Usage
const smsResult = await callExternalAPI(() =>
  sendSMS({ to: phone, message })
);
```

### 11.3 Circuit Breaker Pattern

```typescript
// api/src/utils/circuitBreaker.ts
class CircuitBreaker {
  private failures = 0;
  private lastFailureTime?: Date;
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';

  constructor(
    private threshold: number = 5,
    private timeout: number = 60000 // 1 minute
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime!.getTime() > this.timeout) {
        this.state = 'HALF_OPEN';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  private onSuccess() {
    this.failures = 0;
    this.state = 'CLOSED';
  }

  private onFailure() {
    this.failures++;
    this.lastFailureTime = new Date();

    if (this.failures >= this.threshold) {
      this.state = 'OPEN';
    }
  }
}

// Usage
const smsCircuitBreaker = new CircuitBreaker();

export const sendSMS = async (data: SMSData) => {
  return smsCircuitBreaker.execute(() =>
    msg91Client.send(data)
  );
};
```

---

## 12. Release Management

### 12.1 Semantic Versioning

**Format**: `MAJOR.MINOR.PATCH` (e.g., `1.2.3`)

- **MAJOR**: Breaking changes (e.g., API v2)
- **MINOR**: New features (backward-compatible)
- **PATCH**: Bug fixes

**Examples**:
- `1.0.0` → `1.0.1`: Bug fix (patch)
- `1.0.1` → `1.1.0`: New feature (minor)
- `1.1.0` → `2.0.0`: Breaking API change (major)

### 12.2 Changelog Format

**CHANGELOG.md**:
```markdown
# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.2.0] - 2025-01-20

### Added
- Multi-language support (Hindi, Nepali)
- Voice input for notes
- WhatsApp integration for reminders

### Changed
- Improved GPS accuracy for visit tracking
- Updated dashboard UI with new charts

### Fixed
- Fixed iOS camera permission issue
- Resolved timezone bug in reports

### Security
- Updated JWT token expiry to 7 days
- Added rate limiting to login endpoint

## [1.1.0] - 2025-01-10

### Added
- Payment reminders automation
- Export to CSV feature

### Fixed
- Fixed pagination bug in contacts list
```

### 12.3 Release Checklist

**Before Release**:
- [ ] All tests passing
- [ ] Changelog updated
- [ ] Version bumped in package.json
- [ ] Migration tested on staging
- [ ] Security vulnerabilities addressed
- [ ] Performance benchmarks met
- [ ] Documentation updated
- [ ] Release notes drafted

**During Release**:
- [ ] Create git tag: `git tag -a v1.2.0 -m "Release 1.2.0"`
- [ ] Push tag: `git push origin v1.2.0`
- [ ] Deploy to production
- [ ] Monitor for 1 hour

**After Release**:
- [ ] Verify production working
- [ ] Send release announcement
- [ ] Update status page
- [ ] Close milestone in GitHub

---

**End of Operational Guidelines v1.0**

*For development guidelines, see DEVELOPMENT_GUIDELINES.md*
*For feature-specific guidelines, see FEATURE_GUIDELINES.md*
