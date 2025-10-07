# Production Environment Setup Guide

Complete guide for setting up all environment variables and secrets for production deployment.

## 📋 Table of Contents
- [Overview](#overview)
- [Email Service Priority](#email-service-priority)
- [Required Secrets](#required-secrets)
- [Deployment Steps](#deployment-steps)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)

---

## Overview

The application uses **three email services** with automatic fallback:

1. **MSG91** (Primary) - For transactional emails and OTP
2. **AWS SES** (Secondary) - Fallback for general emails
3. **Resend** (Tertiary) - Alternative fallback

### Service Priority

```
MSG91 (Primary)
   ↓ (if fails)
AWS SES (Secondary)
   ↓ (if fails)
Resend (Tertiary)
```

---

## Required Secrets

### 1. Database
| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | Neon PostgreSQL connection string | `postgresql://user:pass@host/db` |

### 2. Authentication
| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | JWT signing secret (32+ chars) | Generate with: `openssl rand -base64 32` |
| `JWT_EXPIRES_IN` | Token expiry (in wrangler.toml) | `15m` |

### 3. MSG91 (Primary Email + OTP)
| Variable | Description | Example |
|----------|-------------|---------|
| `MSG91_AUTH_KEY` | MSG91 authentication key | From MSG91 dashboard |
| `MSG91_API_KEY` | MSG91 API key for SMS/WhatsApp | From MSG91 dashboard |
| `MSG91_EMAIL_DOMAIN` | Verified email domain | `yourdomain.mailer91.com` |
| `MSG91_EMAIL_FROM` | From email address | `no-reply@yourdomain.mailer91.com` |
| `MSG91_EMAIL_FROM_NAME` | From name | `Field Force CRM` |
| `MSG91_SENDER_ID` | SMS sender ID | `MSGIND` |
| `MSG91_WHATSAPP_NUMBER` | WhatsApp number (optional) | `919876543210` |
| `MSG91_WIDGET_ID` | OTP widget ID (optional) | From MSG91 widget settings |
| `MSG91_TOKEN_AUTH` | OTP widget token (optional) | From MSG91 widget settings |

### 4. AWS SES (Secondary Email)
| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | AWS SES SMTP endpoint | `email-smtp.us-east-1.amazonaws.com` |
| `SMTP_PORT` | SMTP port | `587` |
| `SMTP_SECURE` | Use TLS/SSL | `false` |
| `SMTP_USERNAME` | AWS IAM access key | `AKIAIOSFODNN7EXAMPLE` |
| `SMTP_PASSWORD` | AWS IAM secret key | From AWS IAM |
| `SMTP_FROM_EMAIL` | From email address | `noreply@yourdomain.com` |
| `SMTP_FROM_NAME` | From name | `Field Force CRM` |

### 5. Resend (Tertiary Email)
| Variable | Description | Example |
|----------|-------------|---------|
| `RESEND_SMTP_HOST` | Resend SMTP host | `smtp.resend.com` |
| `RESEND_SMTP_PORT` | Resend SMTP port | `465` |
| `RESEND_SMTP_SECURE` | Use SSL | `true` |
| `RESEND_SMTP_USERNAME` | Resend username | `resend` |
| `RESEND_SMTP_PASSWORD` | Resend API key | `re_xxxxxxxxxxxx` |
| `RESEND_FROM_EMAIL` | From email address | `noreply@yourdomain.com` |
| `RESEND_FROM_NAME` | From name | `Field Force CRM` |

---

## Deployment Steps

### Option 1: Automated Script (Recommended)

Run the deployment script to set up all secrets interactively:

```bash
# Make script executable (if not already)
chmod +x deploy-production-secrets.sh

# Run the script
./deploy-production-secrets.sh
```

The script will:
1. ✅ Check for wrangler CLI
2. ✅ Verify Cloudflare login
3. ✅ Guide you through setting each secret
4. ✅ Confirm successful setup

### Option 2: Manual Setup

Set each secret individually using wrangler:

```bash
# 1. Database
echo "your-database-url" | wrangler secret put DATABASE_URL

# 2. JWT
echo "your-jwt-secret" | wrangler secret put JWT_SECRET

# 3. MSG91 (repeat for each variable)
echo "your-msg91-auth-key" | wrangler secret put MSG91_AUTH_KEY
echo "your-msg91-api-key" | wrangler secret put MSG91_API_KEY
# ... etc

# 4. AWS SES (repeat for each variable)
echo "your-smtp-host" | wrangler secret put SMTP_HOST
# ... etc

# 5. Resend (repeat for each variable)
echo "smtp.resend.com" | wrangler secret put RESEND_SMTP_HOST
# ... etc
```

### Option 3: Bulk Import from .env

Create a `.env.production` file (DO NOT COMMIT):

```bash
DATABASE_URL=postgresql://...
JWT_SECRET=...
MSG91_AUTH_KEY=...
# ... all other variables
```

Then use this script to import:

```bash
#!/bin/bash
while IFS='=' read -r key value; do
  if [[ ! $key =~ ^# && -n $key ]]; then
    echo "$value" | wrangler secret put "$key"
  fi
done < .env.production
```

---

## Verification

### 1. List All Secrets

```bash
wrangler secret list
```

Expected output:
```
SECRET_NAME           UPDATED
DATABASE_URL          2025-10-07T12:00:00.000Z
JWT_SECRET            2025-10-07T12:00:00.000Z
MSG91_AUTH_KEY        2025-10-07T12:00:00.000Z
MSG91_API_KEY         2025-10-07T12:00:00.000Z
...
```

### 2. Test Deployment (Dry Run)

```bash
wrangler deploy --dry-run
```

### 3. Deploy to Production

```bash
wrangler deploy
```

### 4. Test Deployed Application

```bash
# Test health endpoint
curl https://your-worker.workers.dev/health

# Test with authentication
curl -X POST https://your-worker.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## Environment-Specific Configuration

### Development (.dev.vars)
```bash
# Local development - uses .dev.vars file
wrangler dev
```

### Staging
```bash
# Set staging secrets with --env flag
echo "staging-value" | wrangler secret put SECRET_NAME --env staging

# Deploy to staging
wrangler deploy --env staging
```

### Production
```bash
# Production secrets (default environment)
echo "production-value" | wrangler secret put SECRET_NAME

# Deploy to production
wrangler deploy
```

---

## Resend SMTP Setup Details

### Getting Resend API Key

1. Sign up at [https://resend.com](https://resend.com)
2. Go to **API Keys** section
3. Create a new API key
4. Copy the key (starts with `re_`)

### Resend Configuration

```bash
# Host (always the same)
RESEND_SMTP_HOST="smtp.resend.com"

# Port (use 465 for SSL or 587 for TLS)
RESEND_SMTP_PORT="465"

# Secure (true for port 465, false for 587)
RESEND_SMTP_SECURE="true"

# Username (always "resend")
RESEND_SMTP_USERNAME="resend"

# Password (your API key)
RESEND_SMTP_PASSWORD="re_6efeNAXp_AX58sqyN3QboiFgQ39rTVd88"

# From address (must be verified domain)
RESEND_FROM_EMAIL="noreply@yourdomain.com"
RESEND_FROM_NAME="Field Force CRM"
```

### Verify Domain in Resend

1. Go to Resend Dashboard → **Domains**
2. Click **Add Domain**
3. Enter your domain (e.g., `yourdomain.com`)
4. Add DNS records:
   - **SPF**: `v=spf1 include:_spf.resend.com ~all`
   - **DKIM**: Provided by Resend
   - **DMARC**: `v=DMARC1; p=none;`
5. Verify DNS propagation
6. Click **Verify Domain**

---

## Email Service Implementation

### Service Priority Logic

The email service automatically tries services in order:

```typescript
// 1. Try MSG91 (Primary)
try {
  await msg91EmailService.send(email);
  return { success: true, service: 'MSG91' };
} catch (error) {
  // 2. Try AWS SES (Secondary)
  try {
    await sesEmailService.send(email);
    return { success: true, service: 'AWS SES' };
  } catch (error) {
    // 3. Try Resend (Tertiary)
    try {
      await resendEmailService.send(email);
      return { success: true, service: 'Resend' };
    } catch (error) {
      return { success: false, error: 'All email services failed' };
    }
  }
}
```

### Creating Resend Email Service

Create `src/infrastructure/email/ResendEmailService.ts`:

```typescript
import nodemailer from 'nodemailer';
import { EmailService, EmailOptions } from './EmailService';
import { logger } from '../../utils/logger';

export class ResendEmailService implements EmailService {
  private transporter: nodemailer.Transporter;
  private fromEmail: string;
  private fromName: string;

  constructor(
    host: string,
    port: number,
    secure: boolean,
    username: string,
    password: string,
    fromEmail: string,
    fromName: string
  ) {
    this.fromEmail = fromEmail;
    this.fromName = fromName;

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure, // true for port 465, false for 587
      auth: {
        user: username,
        pass: password,
      },
    });

    logger.info('[ResendEmail] Service initialized', {
      host,
      port,
      secure,
      fromEmail,
    });
  }

  async send(options: EmailOptions): Promise<void> {
    try {
      const mailOptions = {
        from: `"${this.fromName}" <${this.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      };

      logger.info('[ResendEmail] Sending email', {
        to: options.to,
        subject: options.subject,
      });

      const info = await this.transporter.sendMail(mailOptions);

      logger.info('[ResendEmail] Email sent successfully', {
        messageId: info.messageId,
        to: options.to,
      });
    } catch (error) {
      logger.error('[ResendEmail] Failed to send email', {
        error,
        to: options.to,
      });
      throw error;
    }
  }

  async verify(): Promise<boolean> {
    try {
      await this.transporter.verify();
      logger.info('[ResendEmail] Connection verified');
      return true;
    } catch (error) {
      logger.error('[ResendEmail] Connection verification failed', { error });
      return false;
    }
  }
}
```

### Update Dependencies Configuration

In `src/config/dependencies.ts`:

```typescript
import { ResendEmailService } from '../infrastructure/email/ResendEmailService';

// Add Resend service initialization
let resendEmailService: ResendEmailService | undefined;

if (env.RESEND_SMTP_HOST && env.RESEND_SMTP_PASSWORD) {
  resendEmailService = new ResendEmailService(
    env.RESEND_SMTP_HOST,
    parseInt(env.RESEND_SMTP_PORT || '465'),
    env.RESEND_SMTP_SECURE === 'true',
    env.RESEND_SMTP_USERNAME || 'resend',
    env.RESEND_SMTP_PASSWORD,
    env.RESEND_FROM_EMAIL || 'noreply@yourdomain.com',
    env.RESEND_FROM_NAME || 'Field Force CRM'
  );
}

export { resendEmailService };
```

---

## Troubleshooting

### Issue: Secret Not Found

```bash
# Error: Secret "SECRET_NAME" not found
```

**Solution:**
```bash
# Verify secret exists
wrangler secret list

# If not exists, set it
echo "value" | wrangler secret put SECRET_NAME
```

### Issue: Resend Authentication Failed

```bash
# Error: 535 Authentication failed
```

**Solution:**
1. Check API key is correct (starts with `re_`)
2. Verify username is exactly `resend`
3. Ensure port matches secure setting (465 → secure=true, 587 → secure=false)

### Issue: Email Domain Not Verified

```bash
# Error: Domain not verified
```

**Solution:**
1. Add domain in Resend dashboard
2. Add DNS records (SPF, DKIM, DMARC)
3. Wait for DNS propagation (up to 48 hours)
4. Verify domain in Resend dashboard

### Issue: Worker Deployment Failed

```bash
# Error: Missing required secret
```

**Solution:**
```bash
# Check which secrets are required
grep -r "env\." src/ | grep -v node_modules

# Set missing secrets
echo "value" | wrangler secret put MISSING_SECRET
```

---

## Security Best Practices

### 1. Never Commit Secrets

Ensure these files are in `.gitignore`:
- `.dev.vars`
- `.env`
- `.env.production`
- `.env.local`
- `*.key`
- `*.pem`

### 2. Rotate Secrets Regularly

```bash
# Generate new JWT secret
openssl rand -base64 32

# Update production
echo "new-secret" | wrangler secret put JWT_SECRET
```

### 3. Use Different Secrets Per Environment

```bash
# Development (in .dev.vars)
JWT_SECRET="dev-secret-123"

# Staging
echo "staging-secret-456" | wrangler secret put JWT_SECRET --env staging

# Production
echo "prod-secret-789" | wrangler secret put JWT_SECRET
```

### 4. Audit Secret Access

```bash
# View secret metadata
wrangler secret list

# Check deployment logs
wrangler tail
```

---

## Quick Reference

### Essential Commands

```bash
# Login to Cloudflare
wrangler login

# List all secrets
wrangler secret list

# Set a secret
echo "value" | wrangler secret put SECRET_NAME

# Delete a secret
wrangler secret delete SECRET_NAME

# Deploy (dry run)
wrangler deploy --dry-run

# Deploy to production
wrangler deploy

# View logs
wrangler tail

# Check deployment status
wrangler deployments list
```

### Environment Variables Checklist

- [ ] DATABASE_URL
- [ ] JWT_SECRET
- [ ] MSG91_AUTH_KEY
- [ ] MSG91_API_KEY
- [ ] MSG91_EMAIL_DOMAIN
- [ ] MSG91_EMAIL_FROM
- [ ] MSG91_EMAIL_FROM_NAME
- [ ] SMTP_HOST
- [ ] SMTP_PORT
- [ ] SMTP_USERNAME
- [ ] SMTP_PASSWORD
- [ ] RESEND_SMTP_HOST
- [ ] RESEND_SMTP_PORT
- [ ] RESEND_SMTP_PASSWORD
- [ ] RESEND_FROM_EMAIL

---

## Resources

- [Cloudflare Workers Secrets Docs](https://developers.cloudflare.com/workers/configuration/secrets/)
- [Wrangler CLI Reference](https://developers.cloudflare.com/workers/wrangler/)
- [MSG91 Documentation](https://docs.msg91.com)
- [AWS SES Documentation](https://docs.aws.amazon.com/ses/)
- [Resend Documentation](https://resend.com/docs)

---

**Last Updated**: 2025-10-07
**Version**: 1.0.0
