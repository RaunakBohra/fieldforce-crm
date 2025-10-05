# 🚀 Deployment

**Production deployment guides and procedures**

---

## 📄 Files in This Folder

### [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./CLOUDFLARE_DEPLOYMENT_GUIDE.md)
**Size**: ~3,000 lines
**Estimated Time**: 2-3 hours (first time)
**Content**: Complete step-by-step deployment guide

#### Table of Contents:
1. **Prerequisites** - Accounts, tools, local setup
2. **Architecture Overview** - Network topology, latency breakdown
3. **Account Setup** - Cloudflare, Neon, AWS SES
4. **Database Setup (Neon)** - Project creation, connection strings
5. **Backend Setup (Workers)** - Hono, Prisma, dependencies
6. **Frontend Setup (Pages)** - Vite configuration
7. **Storage Setup (R2)** - Bucket creation, public access
8. **Email Setup (AWS SES)** - SES verification, templates
9. **Environment Variables** - Secrets management
10. **Deployment** - Deploy to production
11. **Custom Domains** - DNS configuration
12. **Monitoring & Analytics** - Sentry, Better Stack
13. **Cost Optimization** - Caching, query optimization
14. **Troubleshooting** - Common issues and fixes

**When to use**:
- First-time production deployment
- Setting up new environments (staging, production)
- Troubleshooting deployment issues

---

## 🎯 Deployment Timeline

### First Deployment (Week 1 End)
**Duration**: 2-3 hours
**Prerequisites**: Day 1-5 complete
**Steps**:
1. Create Cloudflare account (5 min)
2. Create Neon database (5 min)
3. Deploy backend to Workers (30 min)
4. Deploy frontend to Pages (20 min)
5. Configure custom domain (30 min)
6. Setup monitoring (20 min)
7. Test everything (30 min)

### Subsequent Deployments
**Duration**: 5-10 minutes
**Command**: `git push` (with CI/CD setup)

---

## 📊 Deployment Checklist

### Pre-Deployment
- [ ] All tests passing (`npm test`)
- [ ] TypeScript compiles (`npx tsc --noEmit`)
- [ ] Database migrations ready
- [ ] Environment variables documented
- [ ] No secrets in code
- [ ] Dependencies up to date

### Deployment
- [ ] Cloudflare Workers deployed
- [ ] Cloudflare Pages deployed
- [ ] Database migrations applied
- [ ] Environment variables set
- [ ] Health check passing

### Post-Deployment
- [ ] Custom domain configured
- [ ] SSL certificate active
- [ ] Monitoring enabled
- [ ] Logs accessible
- [ ] Backup verified
- [ ] Team notified

---

## 🌐 Infrastructure Setup

### Cloudflare (All-in-one)
```
✅ Workers (Backend)
✅ Pages (Frontend)
✅ R2 (Storage)
✅ KV (Cache)
✅ Queues (Background jobs)
✅ DNS (Domain management)
✅ CDN (Global delivery)
```

**Cost**: ~$5-10/month

### Neon (Database)
```
✅ PostgreSQL 15
✅ Serverless
✅ Auto-scaling
✅ Branching
✅ Mumbai region
```

**Cost**: $19/month (Starter)

### AWS SES (Email)
```
✅ Mumbai region
✅ High deliverability
✅ Templates
```

**Cost**: $0.10 per 1,000 emails

---

## 🔧 Deployment Methods

### Method 1: Manual Deployment (Recommended for First Time)
```bash
# Backend
cd api
wrangler deploy

# Frontend
cd web
npm run build
npx wrangler pages deploy dist
```

### Method 2: GitHub Actions (CI/CD)
```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - run: npm install
      - run: npm test
      - run: wrangler deploy
```

### Method 3: Git Push (Cloudflare Pages Auto-Deploy)
```bash
git push origin main
# Cloudflare Pages auto-deploys!
```

---

## 📈 Deployment Stages

### 1. Local Development
```
http://localhost:8787 (API)
http://localhost:5173 (Frontend)
Local PostgreSQL or Neon dev branch
```

### 2. Staging (Optional)
```
https://staging.yourapp.com
Neon staging branch
Separate Cloudflare environment
```

### 3. Production
```
https://yourapp.com
Neon production database
Cloudflare Workers + Pages
Custom domain with SSL
```

---

## 🔐 Security Checklist

### Secrets Management
- [ ] No secrets in Git
- [ ] Use `wrangler secret put`
- [ ] Environment variables documented
- [ ] Rotate secrets regularly

### Database
- [ ] Connection string uses SSL
- [ ] Database password strong
- [ ] Connection pooling enabled
- [ ] Backups configured

### API
- [ ] CORS configured correctly
- [ ] Rate limiting enabled
- [ ] JWT secret strong
- [ ] Input validation everywhere

### Frontend
- [ ] No API keys in code
- [ ] Environment variables prefixed with `VITE_`
- [ ] CSP headers configured

---

## 📊 Monitoring Setup

### 1. Cloudflare Analytics (Built-in)
```
Dashboard → Workers → Metrics
- Requests per second
- Success rate
- CPU time
- Errors
```

### 2. Sentry (Error Tracking)
```bash
npm install @sentry/browser @sentry/node
```

### 3. Better Stack (Uptime)
```
Monitor: https://api.yourapp.com/health
Check: Every 1 minute
Alert: Email + Slack
```

---

## 💰 Cost Breakdown

### Production (10K users, 1M API calls/month)

| Service | Cost | Details |
|---------|------|---------|
| Cloudflare Workers | $5 | 10M requests included |
| Cloudflare Pages | $0 | Unlimited bandwidth |
| Cloudflare R2 | $1.50 | 100GB storage |
| Neon PostgreSQL | $19 | Starter plan |
| AWS SES | $5 | 50K emails |
| **Total** | **$30.50/month** | ~₹2,535/month |

**Scales to**:
- 10M requests/month: +$5
- 1TB storage: +$15
- 1M emails: +$100

---

## 🔄 Rollback Procedure

### Quick Rollback (< 5 minutes)
```bash
# Workers
wrangler deployments list
wrangler rollback <deployment-id>

# Pages
Dashboard → Pages → Deployments → Rollback
```

### Database Rollback
```bash
# Neon Point-in-Time Recovery
neon branch create main --timestamp "2024-01-15T10:00:00Z"
# Test, then promote to main
```

---

## 🐛 Common Issues

### Issue: Worker deployment fails
```bash
# Check bundle size
wrangler publish --dry-run

# Check for syntax errors
npx tsc --noEmit

# View detailed logs
wrangler tail
```

### Issue: Database connection timeout
```bash
# Verify connection string includes ?sslmode=require
# Use pooled connection URL (not direct)
# Check Neon is in correct region (ap-south-1)
```

### Issue: Frontend shows old version
```bash
# Clear Cloudflare cache
Dashboard → Caching → Purge Everything

# Force rebuild
cd web
rm -rf dist node_modules
npm install
npm run build
npx wrangler pages deploy dist
```

---

## 📚 Related Documentation

**Before deploying**:
- [Architecture Overview](../01-architecture/TECHNICAL_ARCHITECTURE.md)
- [Operational Guidelines](../02-guidelines/OPERATIONAL_GUIDELINES.md)

**During deployment**:
- This guide!
- [Portable Architecture](../01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md) (if switching platforms)

**After deployment**:
- [Monitoring Guide](../02-guidelines/OPERATIONAL_GUIDELINES.md#monitoring--alerting)
- [Incident Response](../02-guidelines/OPERATIONAL_GUIDELINES.md#incident-response)

---

## 🎉 Post-Deployment

### Verify Deployment
```bash
# Health check
curl https://api.yourapp.com/health

# Test authentication
curl -X POST https://api.yourapp.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"password123"}'

# Test frontend
open https://yourapp.com
```

### Enable Monitoring
1. Cloudflare Analytics → Enable
2. Sentry → Add DSN to code
3. Better Stack → Add health check monitor

### Share with Team
1. Send deployment URL
2. Share login credentials (securely!)
3. Document any issues
4. Celebrate! 🎉

---

## 📝 Next Deployments

### Regular Deployments (After CI/CD Setup)
```bash
# 1. Make changes
# 2. Commit
git add .
git commit -m "feat: new feature"

# 3. Push
git push origin main

# 4. GitHub Actions auto-deploys!
# 5. Verify at https://yourapp.com
```

---

## 📞 Support

**Deployment issues?**
→ Read troubleshooting section in CLOUDFLARE_DEPLOYMENT_GUIDE.md

**Platform migration?**
→ Check [Portable Architecture Guide](../01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md)

**Operational questions?**
→ Check [Operational Guidelines](../02-guidelines/OPERATIONAL_GUIDELINES.md)

---

**Last Updated**: 2025-10-05
**Estimated First Deployment**: 2-3 hours
**Subsequent Deployments**: 5-10 minutes
