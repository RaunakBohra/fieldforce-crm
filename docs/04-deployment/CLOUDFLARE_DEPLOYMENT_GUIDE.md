# Cloudflare Deployment Guide - Field Force CRM

**Complete setup guide for Cloudflare Workers + Pages + R2 + Neon PostgreSQL**

**Last Updated**: 2025-10-05
**Estimated Setup Time**: 2-3 hours

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Architecture Overview](#2-architecture-overview)
3. [Account Setup](#3-account-setup)
4. [Database Setup (Neon)](#4-database-setup-neon)
5. [Backend Setup (Workers)](#5-backend-setup-workers)
6. [Frontend Setup (Pages)](#6-frontend-setup-pages)
7. [Storage Setup (R2)](#7-storage-setup-r2)
8. [Email Setup (AWS SES)](#8-email-setup-aws-ses)
9. [Environment Variables](#9-environment-variables)
10. [Deployment](#10-deployment)
11. [Custom Domains](#11-custom-domains)
12. [Monitoring & Analytics](#12-monitoring--analytics)
13. [Cost Optimization](#13-cost-optimization)
14. [Troubleshooting](#14-troubleshooting)

---

## 1. Prerequisites

### Required Accounts
- [x] Cloudflare account (free tier works)
- [x] Neon account (free tier: 1 project)
- [x] AWS account (for SES)
- [x] GitHub account (for CI/CD)

### Local Development Tools
```bash
# Install Node.js 20+
node --version  # Should be v20+

# Install Wrangler CLI (Cloudflare)
npm install -g wrangler

# Verify installation
wrangler --version

# Login to Cloudflare
wrangler login
```

### Recommended VS Code Extensions
- Cloudflare Workers
- Prisma
- TypeScript
- ESLint
- Tailwind CSS IntelliSense

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    USERS (India)                     │
│              Mumbai, Delhi, Bangalore                │
└────────────┬────────────────────────────────────────┘
             │
       ┌─────┴─────┐
       │ Cloudflare │ (Global CDN - 275+ cities)
       │    Edge    │
       └─────┬─────┘
             │
    ┌────────┴────────┐
    │                 │
    ▼                 ▼
┌─────────┐      ┌─────────┐
│  Pages  │      │ Workers │
│ (React) │      │  (API)  │
└─────────┘      └────┬────┘
                      │
              ┌───────┼───────┐
              │       │       │
              ▼       ▼       ▼
          ┌──────┐ ┌───┐  ┌─────┐
          │ Neon │ │ R2│  │ SES │
          │  DB  │ │   │  │Email│
          └──────┘ └───┘  └─────┘
```

**Performance Targets**:
- API Response: <50ms (India)
- Page Load: <2s
- Cold Start: 0ms (Workers have no cold starts)

**Cost Estimate** (10K users):
- Workers: $5/month
- Pages: $0 (free)
- R2: $1.50/month
- Neon: $19/month
- SES: $5/month
- **Total: ~$30.50/month**

---

## 3. Account Setup

### 3.1 Cloudflare Account

1. Go to https://dash.cloudflare.com/sign-up
2. Create account with email
3. Verify email
4. Add payment method (required for Workers paid plan)
5. Navigate to **Workers & Pages**

### 3.2 Enable Workers Paid Plan

```
Dashboard → Workers & Pages → Plans
→ Select "Workers Paid" ($5/month)

Benefits:
- 10M requests/month included
- No CPU time limits
- KV, R2, Queues included
```

### 3.3 Create API Token

```
Dashboard → My Profile → API Tokens
→ Create Token → Edit Cloudflare Workers

Permissions:
- Account: Cloudflare Workers Scripts (Edit)
- Account: Cloudflare Pages (Edit)
- Account: R2 (Edit)
- Zone: Workers Routes (Edit)

Copy token and save securely!
```

---

## 4. Database Setup (Neon)

### 4.1 Create Neon Project

1. Go to https://neon.tech
2. Sign up with GitHub
3. Create new project:
   - **Name**: `fieldforce-crm`
   - **Region**: `AWS ap-south-1` (Mumbai) ✅
   - **PostgreSQL version**: 15

### 4.2 Get Connection Strings

Neon provides 2 connection strings:

```bash
# Connection Pooler (use for Workers - has connection pooling)
DATABASE_URL="postgresql://username:password@ep-xxx-123.ap-south-1.aws.neon.tech/neondb?sslmode=require"

# Direct Connection (use for migrations)
DIRECT_URL="postgresql://username:password@ep-xxx-123.ap-south-1.aws.neon.tech/neondb?sslmode=require"
```

**Save both URLs!**

### 4.3 Enable Prisma Accelerate (Optional)

For better performance with Workers:

1. Go to Neon Console → Settings
2. Enable Prisma Accelerate integration
3. Get Accelerate connection string
4. Use format: `prisma://accelerate.prisma-data.net/?api_key=xxx`

**Cost**: Free tier: 1M queries/month

---

## 5. Backend Setup (Workers)

### 5.1 Initialize Worker Project

```bash
cd /Users/raunakbohra/Desktop/medical-CRM

# Create worker project
mkdir api
cd api
npm init -y

# Install dependencies
npm install hono @hono/node-server
npm install @prisma/client @prisma/adapter-neon
npm install @neondatabase/serverless
npm install bcryptjs jsonwebtoken
npm install @aws-sdk/client-ses

# Dev dependencies
npm install -D wrangler typescript @types/node
npm install -D @cloudflare/workers-types
npm install -D prisma
npm install -D vitest
```

### 5.2 Initialize Prisma

```bash
npx prisma init

# This creates:
# - prisma/schema.prisma
# - .env
```

### 5.3 Configure Prisma for Neon

**prisma/schema.prisma**:
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

// Models
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  phone     String?
  role      UserRole @default(SALES_REP)
  companyId String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  company   Company?  @relation(fields: [companyId], references: [id])
  contacts  Contact[]
  visits    Visit[]
  orders    Order[]

  @@index([email])
  @@index([companyId])
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  SALES_REP
}

model Company {
  id          String   @id @default(uuid())
  name        String
  email       String   @unique
  phone       String
  address     String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  users       User[]
  contacts    Contact[]
  products    Product[]

  @@map("companies")
}

model Contact {
  id          String      @id @default(uuid())
  name        String
  type        ContactType
  phone       String
  email       String?
  address     String?
  latitude    Float?
  longitude   Float?
  specialty   String?
  notes       String?
  isActive    Boolean     @default(true)
  companyId   String
  createdBy   String
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relations
  company     Company     @relation(fields: [companyId], references: [id])
  creator     User        @relation(fields: [createdBy], references: [id])
  visits      Visit[]
  orders      Order[]

  @@index([companyId])
  @@index([createdBy])
  @@index([type])
  @@map("contacts")
}

enum ContactType {
  DOCTOR
  RETAILER
  WHOLESALER
  DISTRIBUTOR
}

model Visit {
  id          String   @id @default(uuid())
  contactId   String
  userId      String
  latitude    Float
  longitude   Float
  address     String
  notes       String?
  photos      String[] // Array of R2 URLs
  duration    Int?     // Minutes
  visitedAt   DateTime @default(now())
  createdAt   DateTime @default(now())

  // Relations
  contact     Contact  @relation(fields: [contactId], references: [id])
  user        User     @relation(fields: [userId], references: [id])

  @@index([contactId])
  @@index([userId])
  @@index([visitedAt])
  @@map("visits")
}

model Product {
  id          String   @id @default(uuid())
  name        String
  description String?
  sku         String   @unique
  price       Float
  unit        String   // "box", "strip", "tablet", etc.
  companyId   String
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relations
  company     Company     @relation(fields: [companyId], references: [id])
  orderItems  OrderItem[]

  @@index([companyId])
  @@index([sku])
  @@map("products")
}

model Order {
  id              String      @id @default(uuid())
  orderNumber     String      @unique
  contactId       String
  userId          String
  totalAmount     Float
  status          OrderStatus @default(PENDING)
  approvedBy      String?
  approvedAt      DateTime?
  notes           String?
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt

  // Relations
  contact         Contact     @relation(fields: [contactId], references: [id])
  user            User        @relation(fields: [userId], references: [id])
  items           OrderItem[]
  payments        Payment[]

  @@index([contactId])
  @@index([userId])
  @@index([status])
  @@index([orderNumber])
  @@map("orders")
}

enum OrderStatus {
  PENDING
  APPROVED
  REJECTED
  DELIVERED
  CANCELLED
}

model OrderItem {
  id          String   @id @default(uuid())
  orderId     String
  productId   String
  quantity    Int
  price       Float
  discount    Float    @default(0)
  total       Float
  createdAt   DateTime @default(now())

  // Relations
  order       Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])

  @@index([orderId])
  @@index([productId])
  @@map("order_items")
}

model Payment {
  id              String        @id @default(uuid())
  orderId         String
  amount          Float
  method          PaymentMethod
  referenceNumber String?
  notes           String?
  paidAt          DateTime      @default(now())
  createdAt       DateTime      @default(now())

  // Relations
  order           Order         @relation(fields: [orderId], references: [id])

  @@index([orderId])
  @@map("payments")
}

enum PaymentMethod {
  CASH
  CHEQUE
  UPI
  BANK_TRANSFER
  CREDIT_CARD
}
```

### 5.4 Create Wrangler Config

**wrangler.toml**:
```toml
name = "fieldforce-crm-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

# Environment variables (non-secret)
[vars]
ENVIRONMENT = "production"
JWT_EXPIRES_IN = "7d"

# Bindings will be added via dashboard or wrangler secret

# R2 Bucket binding
[[r2_buckets]]
binding = "BUCKET"
bucket_name = "fieldforce-uploads"
preview_bucket_name = "fieldforce-uploads-dev"

# Queue binding (for background jobs)
[[queues.producers]]
binding = "QUEUE"
queue = "email-queue"

[[queues.consumers]]
queue = "email-queue"
max_batch_size = 10
max_batch_timeout = 30
```

### 5.5 Create TypeScript Config

**tsconfig.json**:
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### 5.6 Project Structure

```
api/
├── src/
│   ├── index.ts              # Worker entry point
│   ├── routes/
│   │   ├── auth.ts           # Auth routes
│   │   ├── contacts.ts       # Contact routes
│   │   ├── visits.ts         # Visit routes
│   │   ├── orders.ts         # Order routes
│   │   └── payments.ts       # Payment routes
│   ├── middleware/
│   │   ├── auth.ts           # JWT verification
│   │   ├── cors.ts           # CORS config
│   │   └── logger.ts         # Request logging
│   ├── services/
│   │   ├── authService.ts    # Auth logic
│   │   ├── emailService.ts   # Email with SES
│   │   └── uploadService.ts  # R2 upload
│   ├── utils/
│   │   ├── jwt.ts            # JWT helpers
│   │   ├── validation.ts     # Input validation
│   │   └── errors.ts         # Custom errors
│   └── types/
│       └── env.d.ts          # Environment types
├── prisma/
│   ├── schema.prisma
│   └── migrations/
├── wrangler.toml
├── tsconfig.json
└── package.json
```

### 5.7 Worker Entry Point

**src/index.ts**:
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';
import { authRoutes } from './routes/auth';
import { contactRoutes } from './routes/contacts';
import { visitRoutes } from './routes/visits';
import { orderRoutes } from './routes/orders';

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  BUCKET: R2Bucket;
  QUEUE: Queue;
  AWS_SES_KEY: string;
  AWS_SES_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// Middleware
app.use('/*', cors({
  origin: ['https://yourapp.com', 'http://localhost:3000'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.route('/api/auth', authRoutes);
app.route('/api/contacts', contactRoutes);
app.route('/api/visits', visitRoutes);
app.route('/api/orders', orderRoutes);

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
```

### 5.8 Database Helper

**src/utils/db.ts**:
```typescript
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export function getPrisma(databaseUrl: string) {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate());

  return prisma;
}
```

### 5.9 Auth Middleware

**src/middleware/auth.ts**:
```typescript
import { Context, Next } from 'hono';
import { verify } from 'hono/jwt';
import { Bindings } from '../index';

export async function authMiddleware(c: Context<{ Bindings: Bindings }>, next: Next) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verify(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

---

## 6. Frontend Setup (Pages)

### 6.1 Configure Vite for Workers

**web/vite.config.ts**:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt'],
      manifest: {
        name: 'Field Force CRM',
        short_name: 'FFCRM',
        description: 'GPS-verified visit tracking',
        theme_color: '#0d9488',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ],
  build: {
    outDir: 'dist',
    sourcemap: true,
    minify: 'terser',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
        }
      }
    }
  }
});
```

### 6.2 Environment Variables

**web/.env.example**:
```bash
VITE_API_URL=https://api.yourapp.com
VITE_R2_PUBLIC_URL=https://cdn.yourapp.com
```

**web/.env.development**:
```bash
VITE_API_URL=http://localhost:8787
VITE_R2_PUBLIC_URL=http://localhost:8787/cdn
```

---

## 7. Storage Setup (R2)

### 7.1 Create R2 Buckets

```bash
# Production bucket
wrangler r2 bucket create fieldforce-uploads

# Development bucket
wrangler r2 bucket create fieldforce-uploads-dev
```

### 7.2 Configure Public Access

1. Go to Cloudflare Dashboard → R2
2. Select `fieldforce-uploads`
3. Settings → Public Access → **Allow**
4. Copy public bucket URL

### 7.3 Custom Domain for R2

```bash
# Add custom domain for CDN
wrangler r2 bucket domain add fieldforce-uploads --domain cdn.yourapp.com
```

**Result**: Images accessible at `https://cdn.yourapp.com/visits/photo.jpg`

### 7.4 Upload Service

**src/services/uploadService.ts**:
```typescript
import { Bindings } from '../index';

export class UploadService {
  constructor(private bucket: R2Bucket) {}

  async uploadVisitPhoto(
    visitId: string,
    file: File,
    userId: string
  ): Promise<string> {
    const timestamp = Date.now();
    const key = `visits/${visitId}/${timestamp}-${file.name}`;

    await this.bucket.put(key, await file.arrayBuffer(), {
      httpMetadata: {
        contentType: file.type,
      },
      customMetadata: {
        uploadedBy: userId,
        uploadedAt: new Date().toISOString(),
      },
    });

    return key;
  }

  async deleteFile(key: string): Promise<void> {
    await this.bucket.delete(key);
  }

  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    // R2 public buckets don't need signed URLs
    // Just return public URL
    return `https://cdn.yourapp.com/${key}`;
  }
}
```

---

## 8. Email Setup (AWS SES)

### 8.1 Create AWS Account

1. Go to https://aws.amazon.com
2. Create account
3. Verify email and phone

### 8.2 Setup SES in Mumbai Region

```bash
# Navigate to SES
Region: ap-south-1 (Mumbai)

# Verify your domain
Domain: yourapp.com
→ Add DNS records (TXT, CNAME, MX)

# Verify email address (for testing)
noreply@yourapp.com
→ Check inbox for verification email

# Request production access
→ Create support case to move out of sandbox
```

### 8.3 Create IAM User for SES

```bash
# Create IAM user
Name: ses-smtp-user
Access type: Programmatic access

# Attach policy: AmazonSESFullAccess

# Save credentials:
Access Key ID: AKIA...
Secret Access Key: xxx...
```

### 8.4 Email Service

**src/services/emailService.ts**:
```typescript
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';

export class EmailService {
  private ses: SESClient;

  constructor(accessKey: string, secretKey: string) {
    this.ses = new SESClient({
      region: 'ap-south-1',
      credentials: {
        accessKeyId: accessKey,
        secretAccessKey: secretKey,
      },
    });
  }

  async sendPaymentReminder(
    to: string,
    orderId: string,
    amount: number,
    dueDate: Date
  ) {
    const command = new SendEmailCommand({
      Source: 'noreply@yourapp.com',
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Subject: {
          Data: `Payment Reminder - Order #${orderId}`,
        },
        Body: {
          Html: {
            Data: `
              <html>
                <body>
                  <h2 style="color: #0d9488;">Payment Reminder</h2>
                  <p>Dear Customer,</p>
                  <p>This is a reminder for pending payment:</p>
                  <ul>
                    <li><strong>Order ID:</strong> ${orderId}</li>
                    <li><strong>Amount:</strong> ₹${amount}</li>
                    <li><strong>Due Date:</strong> ${dueDate.toLocaleDateString('en-IN')}</li>
                  </ul>
                  <p>Please process the payment at your earliest convenience.</p>
                  <p>Thank you!</p>
                </body>
              </html>
            `,
          },
        },
      },
    });

    await this.ses.send(command);
  }

  async sendWelcomeEmail(to: string, name: string) {
    // Implementation
  }
}
```

---

## 9. Environment Variables

### 9.1 Set Secrets in Wrangler

```bash
cd api

# Database
wrangler secret put DATABASE_URL
# Paste Neon connection URL (pooled)

# JWT
wrangler secret put JWT_SECRET
# Generate: openssl rand -base64 32

# AWS SES
wrangler secret put AWS_SES_KEY
# Paste AWS Access Key ID

wrangler secret put AWS_SES_SECRET
# Paste AWS Secret Access Key

# List secrets
wrangler secret list
```

### 9.2 Environment Variables Table

| Variable | Type | Where to Set | Example |
|----------|------|--------------|---------|
| `DATABASE_URL` | Secret | `wrangler secret` | `postgresql://...` |
| `DIRECT_URL` | Local only | `.env` | `postgresql://...` |
| `JWT_SECRET` | Secret | `wrangler secret` | `abc123...` |
| `AWS_SES_KEY` | Secret | `wrangler secret` | `AKIA...` |
| `AWS_SES_SECRET` | Secret | `wrangler secret` | `xxx...` |
| `ENVIRONMENT` | Var | `wrangler.toml` | `production` |
| `JWT_EXPIRES_IN` | Var | `wrangler.toml` | `7d` |

---

## 10. Deployment

### 10.1 Database Migrations

```bash
cd api

# Create migration
npx prisma migrate dev --name init

# Apply to Neon
npx prisma migrate deploy

# Generate Prisma Client
npx prisma generate
```

### 10.2 Deploy Backend (Workers)

```bash
cd api

# Development deploy
wrangler deploy --env development

# Production deploy
wrangler deploy

# Check deployment
wrangler tail  # View live logs
```

**Output**:
```
✨ Built successfully
🌎 Deployed to https://fieldforce-crm-api.yourname.workers.dev
```

### 10.3 Deploy Frontend (Pages)

**Option A: Wrangler CLI**
```bash
cd web

# Build
npm run build

# Deploy
npx wrangler pages deploy dist --project-name=fieldforce-crm

# Output: https://fieldforce-crm.pages.dev
```

**Option B: GitHub Integration** (Recommended)
```bash
# 1. Push to GitHub
git push origin main

# 2. Connect in Cloudflare Dashboard
Dashboard → Pages → Create Project
→ Connect to Git → Select repo

# Build settings:
Framework: Vite
Build command: npm run build
Build output: dist
Environment variables: VITE_API_URL=https://api.yourapp.com

# Auto-deploy on push! ✅
```

### 10.4 Verify Deployment

```bash
# Test backend
curl https://fieldforce-crm-api.yourname.workers.dev/health

# Expected response:
# {"status":"ok","timestamp":"2024-..."}

# Test frontend
open https://fieldforce-crm.pages.dev
```

---

## 11. Custom Domains

### 11.1 Add Domain to Cloudflare

1. Dashboard → Websites → Add Site
2. Enter domain: `yourapp.com`
3. Select Free plan
4. Update nameservers at domain registrar
5. Wait for activation (5-60 minutes)

### 11.2 Frontend Domain

```bash
# Pages custom domain
Dashboard → Pages → fieldforce-crm → Custom domains
→ Add domain: yourapp.com
→ Add domain: www.yourapp.com

# Cloudflare auto-provisions SSL certificate
```

### 11.3 Backend Domain

```bash
# Workers custom domain
Dashboard → Workers → fieldforce-crm-api → Triggers
→ Add Custom Domain: api.yourapp.com

# Or via CLI
wrangler publish --route api.yourapp.com/*
```

### 11.4 CDN Domain (R2)

```bash
# R2 custom domain (already done in section 7.3)
wrangler r2 bucket domain add fieldforce-uploads --domain cdn.yourapp.com
```

**Final URLs**:
- Frontend: `https://yourapp.com`
- API: `https://api.yourapp.com`
- CDN: `https://cdn.yourapp.com`

---

## 12. Monitoring & Analytics

### 12.1 Cloudflare Analytics (Built-in)

```
Dashboard → Workers → fieldforce-crm-api → Metrics

Available metrics:
- Requests per second
- Success rate
- CPU time
- Errors
- Bandwidth
```

### 12.2 Add Sentry (Error Tracking)

```bash
npm install @sentry/browser @sentry/node
```

**src/index.ts**:
```typescript
import * as Sentry from '@sentry/node';

// Initialize in worker
Sentry.init({
  dsn: 'https://xxx@sentry.io/xxx',
  environment: 'production',
  tracesSampleRate: 0.1,
});

// Error handler with Sentry
app.onError((err, c) => {
  Sentry.captureException(err);
  console.error('Error:', err);
  return c.json({ error: 'Internal server error' }, 500);
});
```

### 12.3 Add Better Stack (Uptime Monitoring)

1. Go to https://betterstack.com
2. Add monitor: `https://api.yourapp.com/health`
3. Check interval: 1 minute
4. Alert channels: Email, Slack

---

## 13. Cost Optimization

### 13.1 Enable Caching

**Cloudflare Cache Rules**:
```
Dashboard → Caching → Cache Rules

Rule 1: Cache static assets
- When: URI Path matches (*.js|*.css|*.png|*.jpg)
- Then: Cache for 1 year

Rule 2: Cache API responses
- When: URI Path matches /api/products*
- Then: Cache for 5 minutes
```

### 13.2 Database Optimization

**Use connection pooling** (Neon includes this):
```typescript
// Already configured via Neon pooled connection
```

**Use query caching**:
```typescript
// Enable Prisma Accelerate for query caching
const products = await prisma.product.findMany({
  cacheStrategy: { ttl: 300 }, // 5 minutes
});
```

### 13.3 R2 Lifecycle Rules

```bash
# Delete old uploaded files after 90 days
wrangler r2 bucket lifecycle add fieldforce-uploads \
  --rule-id delete-old-temp \
  --prefix temp/ \
  --expiration-days 90
```

### 13.4 Workers Optimization

**Reduce bundle size**:
```typescript
// Use tree-shaking
import { sign } from 'hono/jwt'; // ✅ Named import
// import * as jwt from 'hono/jwt'; // ❌ Imports everything
```

**Reuse connections**:
```typescript
// Initialize Prisma once, reuse across requests
let prisma: PrismaClient;

export default {
  async fetch(request, env) {
    if (!prisma) {
      prisma = getPrisma(env.DATABASE_URL);
    }
    // Use prisma...
  }
};
```

---

## 14. Troubleshooting

### 14.1 Common Issues

#### Issue: "Module not found: @prisma/client/edge"

**Solution**:
```bash
npm install @prisma/client@latest
npx prisma generate
```

#### Issue: "R2 bucket not found"

**Solution**:
```bash
# Verify bucket exists
wrangler r2 bucket list

# Create if missing
wrangler r2 bucket create fieldforce-uploads

# Update wrangler.toml binding name
```

#### Issue: "Database connection timeout"

**Solution**:
```bash
# Check Neon is in correct region (ap-south-1)
# Verify connection string includes ?sslmode=require
# Use pooled connection URL (not direct)
```

#### Issue: "CORS errors in frontend"

**Solution**:
```typescript
// Update CORS middleware in src/index.ts
app.use('/*', cors({
  origin: [
    'https://yourapp.com',
    'https://www.yourapp.com',
    'http://localhost:3000' // For development
  ],
  credentials: true,
}));
```

#### Issue: "Worker deployment fails"

**Solution**:
```bash
# Check for syntax errors
npx tsc --noEmit

# Check bundle size (max 1MB for free, 10MB for paid)
wrangler publish --dry-run

# View detailed logs
wrangler tail
```

### 14.2 Debug Mode

**Enable verbose logging**:
```bash
# Development
wrangler dev --local --log-level debug

# Production
wrangler tail --format pretty
```

**Add logging to Worker**:
```typescript
app.use('*', async (c, next) => {
  console.log(`${c.req.method} ${c.req.url}`);
  const start = Date.now();
  await next();
  console.log(`Response time: ${Date.now() - start}ms`);
});
```

### 14.3 Performance Testing

```bash
# Install Apache Bench
brew install httpd  # macOS

# Test API endpoint
ab -n 1000 -c 10 https://api.yourapp.com/health

# Expected results:
# - Requests per second: 500+
# - Mean response time: <50ms
# - Failed requests: 0
```

### 14.4 Rollback Deployment

```bash
# List deployments
wrangler deployments list

# Rollback to previous version
wrangler rollback <deployment-id>

# Verify
curl https://api.yourapp.com/health
```

---

## Deployment Checklist

**Before Going Live**:

- [ ] Neon database created (ap-south-1)
- [ ] All migrations applied
- [ ] Prisma schema generated
- [ ] R2 buckets created (production + dev)
- [ ] Custom domains added (app, api, cdn)
- [ ] SSL certificates active (auto via Cloudflare)
- [ ] All secrets set (`wrangler secret list`)
- [ ] AWS SES verified and out of sandbox
- [ ] Frontend deployed to Pages
- [ ] Backend deployed to Workers
- [ ] Health check passing (`/health`)
- [ ] CORS configured correctly
- [ ] Error tracking enabled (Sentry)
- [ ] Uptime monitoring enabled (Better Stack)
- [ ] Analytics enabled (Cloudflare + PostHog)
- [ ] Backup strategy documented
- [ ] Team has access to dashboards

**Post-Launch**:

- [ ] Monitor error rates (target: <0.1%)
- [ ] Monitor response times (target: <50ms)
- [ ] Monitor costs (target: <$35/month initially)
- [ ] Set up alerts for downtime
- [ ] Document incident response process
- [ ] Train team on deployment process

---

## Next Steps

1. **Week 1**: Complete local development with this architecture
2. **Week 2**: Deploy to staging (Cloudflare + Neon)
3. **Week 3**: Load testing and optimization
4. **Week 4**: Production launch

**Additional Resources**:
- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Neon Docs: https://neon.tech/docs
- Prisma Edge Docs: https://www.prisma.io/docs/guides/deployment/edge-computing
- Hono Docs: https://hono.dev/

---

**Last Updated**: 2025-10-05
**Maintainer**: @raunak
**Questions?**: Refer to troubleshooting section or team Slack #devops
