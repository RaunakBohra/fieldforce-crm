# Infrastructure Setup Guide

This guide explains how to set up the infrastructure adapters for the Field Force CRM.

## Free Tier Resources (Cloudflare)

### 1. Cloudflare KV (Cache Service)

**Free Tier**: 100,000 reads/day, 1,000 writes/day

**Setup:**
```bash
# Create KV namespace for production
wrangler kv:namespace create "KV"

# Create KV namespace for development
wrangler kv:namespace create "KV" --env dev

# Update wrangler.toml with the namespace IDs returned
```

**Update `wrangler.toml`:**
```toml
[[kv_namespaces]]
binding = "KV"
id = "<NAMESPACE_ID_FROM_COMMAND>"

[env.dev]
kv_namespaces = [{ binding = "KV", id = "<DEV_NAMESPACE_ID>" }]
```

---

### 2. Cloudflare R2 (Storage Service)

**Free Tier**: 10 GB storage, 1 million Class A operations, 10 million Class B operations per month

**Setup:**
```bash
# Create R2 bucket for production
wrangler r2 bucket create fieldforce-crm-storage

# Create R2 bucket for development
wrangler r2 bucket create fieldforce-crm-storage-dev

# Already configured in wrangler.toml
```

**Optional**: Configure R2 custom domain for CDN URLs (requires Cloudflare domain)

---

### 3. AWS SQS (Queue Service - FREE TIER AVAILABLE)

**Free Tier**: 1 million requests/month (Standard Queue)

**Setup:**

1. **Create SQS Queue**:
```bash
# Using AWS CLI
aws sqs create-queue --queue-name email-queue --region ap-south-1
aws sqs create-queue --queue-name notification-queue --region ap-south-1

# Get queue URLs
aws sqs list-queues --region ap-south-1
```

2. **Set Environment Variables**:
```bash
# Set SQS region
echo "ap-south-1" | wrangler secret put AWS_SQS_REGION

# Set queue URLs as JSON (multiple queues)
echo '{"email-queue":"https://sqs.ap-south-1.amazonaws.com/123456789/email-queue","notification-queue":"https://sqs.ap-south-1.amazonaws.com/123456789/notification-queue"}' | wrangler secret put AWS_SQS_QUEUE_URLS
```

3. **IAM Permissions**:
Ensure your AWS credentials have these SQS permissions:
- `sqs:SendMessage`
- `sqs:SendMessageBatch`
- `sqs:ReceiveMessage`
- `sqs:DeleteMessage`
- `sqs:GetQueueAttributes`

**Usage Example**:
```typescript
// Send message to queue
if (deps.queue) {
  await deps.queue.sendMessage('email-queue', {
    to: 'user@example.com',
    subject: 'Welcome',
    body: 'Welcome to Field Force CRM'
  });
}

// Process messages (in a worker/cron job)
const messages = await deps.queue.receiveMessages('email-queue', 10);
for (const msg of messages) {
  await sendEmail(msg.body);
  await deps.queue.deleteMessage('email-queue', msg.receiptHandle);
}
```

**Alternative: Cloudflare Queues** (Requires Workers Paid plan $5/month)
- If you upgrade to paid plan, you can use CloudflareQueueService instead
- The implementation is already available in `src/infrastructure/queues/CloudflareQueueService.ts`

---

## AWS Resources (Optional)

### 4. AWS SES (Email Service)

**Free Tier**: 62,000 emails/month when sending from EC2 or Lambda

**Setup:**

1. **Verify Email Address** (for testing):
```bash
aws ses verify-email-identity --email-address noreply@fieldforce.com
```

2. **Get SMTP Credentials**:
   - Go to AWS Console → SES → SMTP Settings
   - Create SMTP credentials
   - Note down: SMTP Host, Port, Username, Password

3. **Set Secrets** (via Wrangler):
```bash
# Set AWS SES SMTP credentials
echo "email-smtp.ap-south-1.amazonaws.com" | wrangler secret put AWS_SES_SMTP_HOST
echo "587" | wrangler secret put AWS_SES_SMTP_PORT
echo "YOUR_SMTP_USERNAME" | wrangler secret put AWS_SES_SMTP_USER
echo "YOUR_SMTP_PASSWORD" | wrangler secret put AWS_SES_SMTP_PASSWORD
```

4. **Move Out of Sandbox** (for production):
   - Request production access in SES Console
   - Can send to any email address (not just verified ones)

---

## Environment Variables

### Required Secrets (Set via Wrangler)

```bash
# Database
echo "postgresql://..." | wrangler secret put DATABASE_URL

# JWT
echo "your-strong-random-secret-here" | wrangler secret put JWT_SECRET

# AWS SES (optional, for email functionality)
echo "YOUR_SMTP_USER" | wrangler secret put AWS_SES_SMTP_USER
echo "YOUR_SMTP_PASSWORD" | wrangler secret put AWS_SES_SMTP_PASSWORD
```

### Public Variables (Already in `wrangler.toml`)

- `ENVIRONMENT`: production / development
- `JWT_EXPIRES_IN`: 15m
- `EMAIL_FROM`: noreply@fieldforce.com
- `AWS_SES_SMTP_HOST`: email-smtp.ap-south-1.amazonaws.com
- `AWS_SES_SMTP_PORT`: 587

---

## Testing Infrastructure Adapters

### Test Email Service

```typescript
// In your route or service
const result = await deps.email.sendEmail({
  to: 'test@example.com',
  subject: 'Test Email',
  text: 'This is a test email from Field Force CRM',
  html: '<p>This is a test email from Field Force CRM</p>',
});

console.log('Email sent:', result);
```

### Test Cache Service

```typescript
// Set cache
await deps.cache.set('test-key', { hello: 'world' }, { ttl: 3600 });

// Get cache
const value = await deps.cache.get('test-key');
console.log('Cached value:', value);

// Delete cache
await deps.cache.delete('test-key');
```

### Test Storage Service

```typescript
// Upload file
const result = await deps.storage.uploadFile(
  'test/hello.txt',
  Buffer.from('Hello World'),
  { contentType: 'text/plain' }
);

console.log('File uploaded:', result);

// Check if exists
const exists = await deps.storage.fileExists('test/hello.txt');
console.log('File exists:', exists);

// Delete file
await deps.storage.deleteFile('test/hello.txt');
```

### Test Queue Service (SQS)

```typescript
// Send message
if (deps.queue) {
  const messageId = await deps.queue.sendMessage('email-queue', {
    to: 'test@example.com',
    subject: 'Test',
    body: 'Testing SQS'
  });
  console.log('Message sent:', messageId);

  // Receive messages
  const messages = await deps.queue.receiveMessages('email-queue', 1);
  console.log('Received messages:', messages);

  // Delete message
  if (messages.length > 0) {
    await deps.queue.deleteMessage('email-queue', messages[0].receiptHandle);
  }

  // Get queue stats
  const stats = await deps.queue.getQueueStats('email-queue');
  console.log('Queue stats:', stats);
}
```

---

## Cost Estimates

### Free Tier (Cloudflare + AWS)

- **Cloudflare Workers**: 100,000 requests/day (FREE)
- **Cloudflare KV**: 100,000 reads/day, 1,000 writes/day (FREE)
- **Cloudflare R2**: 10GB storage, 1M Class A ops (FREE)
- **Neon PostgreSQL**: 0.5 GB storage, 191 hours compute (FREE)
- **AWS SES**: 62,000 emails/month (FREE with AWS compute)
- **AWS SQS**: 1 million requests/month (FREE)

**Total Cost**: $0/month (within free tier limits)

### Paid Tier (with Cloudflare Queues)

- **Cloudflare Workers Paid**: $5/month (includes Queues)
- **Cloudflare KV**: $0.50/million reads
- **Cloudflare R2**: $0.015/GB-month storage
- **Neon PostgreSQL**: $19/month (Scale plan)
- **AWS SES**: $0.10/1000 emails

**Estimated Cost**: ~$30-50/month (for moderate usage)

---

## Production Checklist

- [ ] Create KV namespace and update wrangler.toml
- [ ] Create R2 bucket and update wrangler.toml
- [ ] Set up AWS SES and verify email/domain
- [ ] Create AWS SQS queues (optional, for async jobs)
- [ ] Set all secrets via `wrangler secret put`
- [ ] Test email sending functionality
- [ ] Test cache operations
- [ ] Test file uploads to R2
- [ ] Test queue operations (if SQS configured)
- [ ] Move AWS SES out of sandbox (production access)
- [ ] Configure R2 custom domain (optional, for CDN URLs)
- [ ] Monitor usage to stay within free tier limits

---

## Notes

- **Queue Service**: AWS SQS is used for free tier (1M requests/month). Cloudflare Queues available if you upgrade to Workers Paid plan ($5/month).
- **Email Templates**: Currently use simple string replacement. For production, consider using a proper template engine or AWS SES templates.
- **Signed URLs**: R2 doesn't natively support signed URLs like S3. For production, implement signed tokens via Cloudflare Workers.
- **Cache Atomicity**: KV increment() is not truly atomic. For production counters, consider using Durable Objects.
- **SQS Polling**: For processing SQS messages, set up a cron job or use Cloudflare Workers Cron Triggers to poll the queue regularly.
