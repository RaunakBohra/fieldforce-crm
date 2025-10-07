# Production Deployment Guide - Field Force CRM

## 📋 Current Status

### ✅ Already Configured
- **Cloudflare Account**: rnkbohra@gmail.com (Account ID: 610762493d34333f1a6d72a037b345cf)
- **Pages Project**: `fieldforce-crm` → https://crm.raunakbohra.com
- **Workers API**: `fieldforce-crm-api` → https://fieldforce-crm-api.rnkbohra.workers.dev
- **KV Namespace**: `KV` (ID: 07ea4a2def1d4fd1826f37551207ad46)
- **R2 Bucket**: `fieldforce-crm-storage`
- **Database**: Neon PostgreSQL (already configured)

### ✅ Secrets Already Set
- `DATABASE_URL` - Neon PostgreSQL connection
- `JWT_SECRET` - JWT signing key
- `AWS_SES_SMTP_USER` - Email service
- `AWS_SES_SMTP_PASSWORD` - Email service

---

## 🚀 Deployment Steps

### Step 1: Build Frontend

```bash
cd /Users/raunakbohra/Desktop/medical-CRM/web
npm run build
```

**This creates**: `web/dist/` directory with optimized production build

### Step 2: Deploy Backend (Workers API)

```bash
cd /Users/raunakbohra/Desktop/medical-CRM

# Deploy to Cloudflare Workers
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler deploy
```

**Result**: API deployed to https://fieldforce-crm-api.rnkbohra.workers.dev

### Step 3: Deploy Frontend (Cloudflare Pages)

```bash
cd /Users/raunakbohra/Desktop/medical-CRM

# Deploy to Cloudflare Pages
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler pages deploy web/dist --project-name=fieldforce-crm --commit-dirty=true
```

**Result**: Frontend deployed to https://crm.raunakbohra.com

---

## ⚙️ Environment Variables to Check

### Backend (Workers) - Already Set ✅
All required secrets are already configured. Verify they're correct:

```bash
# List all secrets
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler secret list
```

If you need to update any secret:

```bash
# Example: Update JWT_SECRET
echo "your-new-secret-value" | npx wrangler secret put JWT_SECRET
```

### Frontend (Pages) - Environment Variables

The frontend uses `.env.production` which is already configured:
- `VITE_API_URL=https://fieldforce-crm-api.rnkbohra.workers.dev`

This is automatically bundled during build. No additional Pages env vars needed.

---

## 🔧 Additional Configuration Needed

### 1. MSG91 API Keys (Day 18 - Notifications)

**Currently Missing** - Add these if you want SMS/WhatsApp notifications:

```bash
# Set MSG91 API key
echo "your-msg91-api-key" | CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler secret put MSG91_API_KEY

# Set MSG91 Sender ID
echo "YOUR-SENDER-ID" | CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler secret put MSG91_SENDER_ID

# Set MSG91 WhatsApp Number
echo "919999999999" | CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler secret put MSG91_WHATSAPP_NUMBER
```

### 2. R2 Bucket Configuration

**Already Created** but needs to be publicly accessible for product images:

```bash
# Make R2 bucket public (if needed for direct image access)
# Or configure custom domain for R2
```

**Alternative**: Images are uploaded to R2 but served through Workers API (already implemented)

### 3. CORS Configuration

Check that your Workers API allows requests from your frontend domain:

File: `src/index.ts` - Lines 66-122

Already configured to allow:
- ✅ `https://crm.raunakbohra.com`
- ✅ `https://fieldforce-crm-new.pages.dev` (Pages preview)

---

## 📝 Pre-Deployment Checklist

### Backend
- [x] Prisma migrations applied to production DB
- [x] All secrets configured
- [x] KV namespace created
- [x] R2 bucket created
- [x] CORS origins configured
- [ ] Test API endpoint: `curl https://fieldforce-crm-api.rnkbohra.workers.dev/health`

### Frontend
- [x] `.env.production` configured
- [x] API_URL points to correct Workers endpoint
- [x] Build succeeds (`npm run build`)
- [ ] Test build locally: `npm run preview`

---

## 🚦 Deployment Commands (All-in-One)

Run these commands in order:

```bash
# 1. Navigate to project root
cd /Users/raunakbohra/Desktop/medical-CRM

# 2. Build frontend
cd web && npm run build && cd ..

# 3. Deploy backend (Workers)
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler deploy

# 4. Deploy frontend (Pages)
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler pages deploy web/dist --project-name=fieldforce-crm --commit-dirty=true
```

---

## 🧪 Post-Deployment Testing

### 1. Test Backend API

```bash
# Health check
curl https://fieldforce-crm-api.rnkbohra.workers.dev/health

# Expected response:
# {"status":"ok","platform":"cloudflare-workers","environment":"production","timestamp":"...","version":"1.0.0"}

# Test login endpoint
curl -X POST https://fieldforce-crm-api.rnkbohra.workers.dev/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"prodtest@example.com","password":"Test123456!"}'
```

### 2. Test Frontend

1. Open https://crm.raunakbohra.com in browser
2. Login with test credentials:
   - Email: `prodtest@example.com`
   - Password: `Test123456!`
3. Verify:
   - Dashboard loads
   - Contacts list works
   - Products table displays
   - Create/edit functionality works

### 3. Test New Features (Days 16-19)

- [ ] Product SKU generation
- [ ] Barcode scanner (requires HTTPS for camera access)
- [ ] Product image upload to R2
- [ ] Order workflow (DRAFT → PENDING → APPROVED → DISPATCHED)
- [ ] Order cancellation
- [ ] Visit planning (upcoming/overdue visits)

---

## 🔍 Monitoring & Logs

### View Workers Logs

```bash
# Tail production logs
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler tail --format pretty
```

### View Pages Deployment

```bash
# List deployments
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler pages deployment list --project-name=fieldforce-crm
```

### Cloudflare Dashboard

- Workers: https://dash.cloudflare.com/610762493d34333f1a6d72a037b345cf/workers/services/view/fieldforce-crm-api
- Pages: https://dash.cloudflare.com/610762493d34333f1a6d72a037b345cf/pages/view/fieldforce-crm
- R2: https://dash.cloudflare.com/610762493d34333f1a6d72a037b345cf/r2/buckets

---

## ⚠️ Known Issues & Limitations

### 1. Cron Jobs (Payment Reminders)
- **Status**: Configured in `wrangler.toml` (line 51)
- **Requirement**: Paid Workers plan ($5/month)
- **Schedule**: 3:30 AM UTC (9:00 AM IST) daily
- **Action**: Cron triggers will be enabled automatically once on paid plan

### 2. MSG91 Notifications
- **Status**: Endpoints exist but not configured
- **Requirement**: MSG91 API keys (see section above)
- **Features affected**: Payment reminders (SMS/WhatsApp), Product launch notifications

### 3. R2 Public Access
- **Status**: Bucket created, images uploaded via API
- **Current**: Images served through Workers API
- **Optional**: Configure custom domain for direct R2 access

---

## 🆘 Troubleshooting

### Build Fails

```bash
# Clear cache and reinstall
cd web
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Deployment Fails

```bash
# Re-login to Cloudflare
npx wrangler login

# Verify account
CLOUDFLARE_ACCOUNT_ID=610762493d34333f1a6d72a037b345cf npx wrangler whoami
```

### API Not Responding

1. Check Workers logs: `npx wrangler tail`
2. Verify secrets are set: `npx wrangler secret list`
3. Check database connection (DATABASE_URL)

### Frontend Shows API Error

1. Verify `VITE_API_URL` in `.env.production`
2. Check CORS settings in `src/index.ts`
3. Ensure Workers deployed successfully

---

## 💰 Cost Estimate

**Current Setup (Free Tier):**
- Workers: 100,000 requests/day (FREE)
- Pages: Unlimited requests (FREE)
- KV: 100,000 reads/day (FREE)
- R2: 10GB storage (FREE)
- Neon DB: 0.5GB storage (FREE)

**To Enable All Features:**
- Workers Paid: $5/month (unlocks Cron triggers)
- MSG91: Variable (pay-per-SMS/WhatsApp)

**Total**: $5/month for full functionality

---

## 📞 Support

- Cloudflare Workers Docs: https://developers.cloudflare.com/workers/
- Wrangler CLI Docs: https://developers.cloudflare.com/workers/wrangler/
- Neon Database Docs: https://neon.tech/docs/introduction

---

## ✅ Deployment Completed Checklist

After running deployment commands:

- [ ] Backend deployed successfully
- [ ] Frontend deployed successfully
- [ ] Health check passes
- [ ] Login works on production
- [ ] Test user can access dashboard
- [ ] Products CRUD works
- [ ] Orders workflow works
- [ ] Images upload to R2
- [ ] DNS resolves correctly (crm.raunakbohra.com)
- [ ] HTTPS certificate active
- [ ] Monitoring/logs accessible

---

**Ready to deploy?** Run the commands in the "Deployment Commands" section above!
