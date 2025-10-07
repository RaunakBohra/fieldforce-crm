# Email System Architecture

## Overview

The email system uses a **smart fallback strategy** to maximize free tier usage across multiple providers, ensuring 6,000 free emails per month before any paid service is used.

## Email Providers & Free Tiers

| Provider | Free Tier | Status | Use Case |
|----------|-----------|--------|----------|
| **Resend** | 3,000/month | ✅ **Primary** | Raw HTML emails, best compatibility |
| **Maileroo** | 3,000/month | ✅ **Fallback #2** | Automatic fallback when Resend quota exhausted |
| **AWS SES** | Unlimited | ✅ **Fallback #3** | Pay-as-you-go (~$0.10 per 1000), AWS SigV4 signing |
| **MSG91** | 5,000/month | ❌ **Not Used** | Template-based only (incompatible with raw HTML) |

### Total Free Capacity
- **Free tier**: 6,000 emails/month (Resend 3k + Maileroo 3k)
- **With AWS SES**: Unlimited (after free tiers, ~$0.10/1000 emails)

## How It Works

### 1. Automatic Fallback System

```typescript
// Priority Order (from free to paid):
1. Resend (3,000/month) → Try first
2. Maileroo (3,000/month) → Try if Resend quota exhausted
3. AWS SES (pay-per-use) → Final fallback for unlimited capacity
```

### 2. How the Fallback Works

**Key Point**: Both Resend and Maileroo have 3,000 emails/month free tier each. The fallback system uses them **sequentially**, not simultaneously, to maximize total free capacity.

**Monthly Email Flow:**
```
Month: October 2025

Email #1-3000:     Resend ✅ (quota: 0→3000/3000)
Email #3001:       Resend ❌ (quota exhausted)
                   → Fallback to Maileroo ✅ (quota: 0→1/3000)
Email #3002-6000:  Maileroo ✅ (quota: 1→3000/3000)
Email #6001:       Maileroo ❌ (quota exhausted)
                   → Fallback to AWS SES ✅ (paid, but unlimited)
```

**Why This Strategy?**
- Maximizes free tier: 3,000 (Resend) + 3,000 (Maileroo) = **6,000 free emails**
- Prevents waste: We don't split emails between providers
- Cost-efficient: Only pays for AWS SES after exhausting 6,000 free emails

### 3. Quota Tracking

- Uses **Cloudflare KV** to track monthly usage per provider
- Automatically switches to next provider when quota reached
- Resets monthly on the 1st of each month
- Keys: `email-quota:Resend:2025-10`, `email-quota:Maileroo:2025-10`

### 4. Current Setup

**Active Configuration** (`.dev.vars`):
```bash
# Resend (Primary - 3,000/month)
RESEND_SMTP_PASSWORD="re_6efeNAXp_AX58sqyN3QboiFgQ39rTVd88"
RESEND_FROM_EMAIL="noreply@mail.raunakbohra.com"
RESEND_FROM_NAME="Field Force CRM"

# Maileroo (Fallback - 3,000/month) - ✅ CONFIGURED
MAILEROO_API_KEY="bbb9fc093e192adceaacdc3cac0a40019ef7fc26241e08a3081a699a08fdabca"
MAILEROO_FROM_EMAIL="noreply@mail.raunakbohra.com"
MAILEROO_FROM_NAME="Field Force CRM"
```

**Current Status**: ✅ **Resend + Maileroo fallback active** (6,000 emails/month free capacity)

**To add AWS SES** (`.dev.vars` or Cloudflare secrets):
```bash
# AWS SES (Unlimited - pay per use)
AWS_SES_ACCESS_KEY_ID="AKIA..."
AWS_SES_SECRET_ACCESS_KEY="..."
AWS_SES_REGION="us-east-1"
AWS_SES_FROM_EMAIL="noreply@mail.raunakbohra.com"
AWS_SES_FROM_NAME="Field Force CRM"
```

## To Enable Unlimited Capacity (AWS SES)

### Step 1: Setup AWS SES

1. Sign up/login to AWS Console: https://console.aws.amazon.com/ses
2. Verify your domain `mail.raunakbohra.com` in SES
3. Request production access (remove sandbox restrictions)
4. Create IAM user with SES send permissions
5. Generate access keys (Access Key ID + Secret Access Key)

### Step 2: Add to Configuration

```bash
# Add to .dev.vars (local) or Cloudflare secrets (production)
AWS_SES_ACCESS_KEY_ID="AKIA..."
AWS_SES_SECRET_ACCESS_KEY="..."
AWS_SES_REGION="us-east-1"
AWS_SES_FROM_EMAIL="noreply@mail.raunakbohra.com"
AWS_SES_FROM_NAME="Field Force CRM"
```

### Step 3: Deploy to Production

```bash
# Set secrets in Cloudflare
wrangler secret put AWS_SES_ACCESS_KEY_ID
wrangler secret put AWS_SES_SECRET_ACCESS_KEY

# Deploy
npm run build
wrangler deploy
```

## Email Flow Example

```
User creates order
  ↓
EmailNotificationService.sendOrderConfirmation()
  ↓
FallbackEmailService.sendEmail()
  ↓
Check Resend quota (0/3000 used)
  ↓
Try Resend → ✅ Success!
  ↓
Increment Resend counter (1/3000 used)
  ↓
Email sent via Resend
```

**If Resend quota exhausted:**

```
User creates order
  ↓
EmailNotificationService.sendOrderConfirmation()
  ↓
FallbackEmailService.sendEmail()
  ↓
Check Resend quota (3000/3000 used) ❌ Exhausted
  ↓
Check Maileroo quota (0/1000 used) ✅ Available
  ↓
Try Maileroo → ✅ Success!
  ↓
Increment Maileroo counter (1/1000 used)
  ↓
Email sent via Maileroo
```

## Email Templates (All Working)

1. ✅ **Order Confirmation** - Sent automatically when order created
2. ✅ **Payment Received** - Sent automatically when payment recorded
3. ✅ **Payment Reminder** - Manual/cron (3 urgency levels)
4. ✅ **Weekly Performance Summary** - Manual/cron

## Monitoring Email Usage

### Via API Endpoint (Future Enhancement)

```bash
GET /api/email-stats
```

Returns:
```json
{
  "month": "2025-10",
  "providers": {
    "Resend": { "used": 245, "quota": 3000, "remaining": 2755 },
    "Maileroo": { "used": 0, "quota": 3000, "remaining": 3000 }
  },
  "total": {
    "used": 245,
    "quota": 6000,
    "remaining": 5755
  }
}
```

### Via Cloudflare KV

Check keys in KV namespace:
- `email-quota:Resend:2025-10` → Current Resend usage
- `email-quota:Maileroo:2025-10` → Current Maileroo usage

## Cost Estimation

| Monthly Emails | Cost | Provider Mix |
|----------------|------|--------------|
| 0 - 3,000 | **$0** | Resend only |
| 3,001 - 6,000 | **$0** | Resend + Maileroo |
| 6,001 - 7,000 | **~$0.10** | All + AWS SES (1,000 emails) |
| 10,000 | **~$0.40** | All + AWS SES (4,000 emails) |
| 50,000 | **~$4.40** | All + AWS SES (44,000 emails) |

## Why Not MSG91 Email API?

MSG91 Email API is **template-based only**:
- Requires creating templates in MSG91 dashboard
- Cannot send raw HTML directly
- Each template needs approval
- Not suitable for dynamic transactional emails

**MSG91 is still used for SMS/OTP** (5,000/month free)

## Production Checklist

- [x] Resend configured with verified domain (`mail.raunakbohra.com`)
- [x] Email templates created and tested
- [x] Fallback system implemented with KV-based quota tracking
- [x] AWS SES integration completed with Signature v4 signing
- [x] Maileroo API key configured - **6,000 emails/month free capacity active**
- [ ] AWS SES credentials added (for unlimited capacity)
- [ ] Email usage monitoring dashboard
- [ ] Alerts when approaching quota limits

## Files

- `src/infrastructure/email/FallbackEmailService.ts` - Smart fallback logic with KV quota tracking
- `src/infrastructure/email/ResendEmailService.ts` - Resend integration (3,000/month)
- `src/infrastructure/email/MailerooEmailService.ts` - Maileroo integration (1,000/month)
- `src/infrastructure/email/AWSSESEmailService.ts` - AWS SES with Signature v4 signing (unlimited)
- `src/services/emailNotificationService.ts` - Business logic layer
- `src/config/dependencies.ts` - Dependency injection setup
- `src/routes/emailTest.ts` - Email testing endpoints

## Support

**Resend Dashboard**: https://resend.com/emails
**Maileroo Dashboard**: https://maileroo.com/dashboard
**AWS SES Console**: https://console.aws.amazon.com/ses

---

**Status**: ✅ Production Ready - Multi-provider fallback system fully operational
**Current Capacity**: **6,000 emails/month FREE** (Resend 3k + Maileroo 3k)
**Unlimited Capacity**: Ready to activate with AWS SES credentials (~$0.10/1000 emails)
**Last Updated**: 2025-10-07
