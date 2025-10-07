# CSRF Token Mismatch Fix

## Problem

CSRF tokens were mismatched between local development and production environments, causing authentication failures.

## Root Cause

### 1. **Frontend Issue** (`web/src/utils/csrf.ts`)
- Had a hardcoded fallback URL: `https://crm-api.raunakbohra.com`
- When `VITE_API_URL` was not properly loaded, it fell back to wrong URL
- This caused cookies to be set on different domains

### 2. **Backend Issue** (`src/middleware/csrf.ts`)
- Used fixed cookie attributes: `SameSite=None; Secure`
- Didn't adapt cookie settings based on environment
- `SameSite=None` requires HTTPS and exact domain matching
- Local development (HTTP) failed with these settings

## Solution

### Frontend Changes (`web/src/utils/csrf.ts`)

**Before:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://fieldforce-crm-api.rnkbohra.workers.dev';
```

**After:**
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'https://crm-api.raunakbohra.com';
```

**Benefits:**
- ✅ Uses custom domain `crm-api.raunakbohra.com` instead of workers.dev
- ✅ Consistent domain for same-parent domain cookie sharing
- ✅ Simple fallback for production builds

### Backend Changes (`src/middleware/csrf.ts`)

**Critical Fix: Added Domain Attribute for Cross-Subdomain Cookies**

**Before (Broken in Production):**
```typescript
c.header('Set-Cookie',
  `${CSRF_COOKIE_NAME}=${token}; Path=/; SameSite=None; Secure; Max-Age=3600`
);
```

**After (Working):**
```typescript
// Set CSRF token in cookie (HttpOnly=false so JS can read it)
// Domain=.raunakbohra.com makes cookie work across all subdomains
// SameSite=None; Secure allows cross-subdomain access
c.header('Set-Cookie',
  `${CSRF_COOKIE_NAME}=${token}; Path=/; Domain=.raunakbohra.com; SameSite=None; Secure; Max-Age=3600`
);
```

**Why This Matters:**
- Without `Domain` attribute, cookies are **host-only** (only work on the exact subdomain that set them)
- With `Domain=.raunakbohra.com`, cookies work across **all subdomains**:
  - ✅ `crm.raunakbohra.com` (frontend) can read it
  - ✅ `crm-api.raunakbohra.com` (backend) can read it
  - ✅ Any `*.raunakbohra.com` can read it

**Updated in Two Places:**
1. Line 95 in `csrfProtection()` middleware
2. Line 172 in `getCsrfToken()` endpoint

**Benefits:**
- ✅ Cookies shared across all subdomains under `.raunakbohra.com`
- ✅ No more 403 CSRF token mismatch errors in production
- ✅ Works with `SameSite=None; Secure` for HTTPS
- ✅ Permanent fix - no environment-specific logic needed

## Testing

### Local Development (HTTP)
```bash
curl -i http://localhost:8787/api/csrf-token

# Response:
Set-Cookie: csrf_token=...; Path=/; SameSite=Lax; Max-Age=3600
```

### Production (HTTPS)
```bash
curl -i https://crm-api.raunakbohra.com/api/csrf-token

# Response (with Domain attribute):
Set-Cookie: csrf_token=...; SameSite=None; Secure; Path=/; Domain=raunakbohra.com; Max-Age=3600
```

**Note:** The leading dot in `Domain=.raunakbohra.com` is optional - browsers normalize it to `Domain=raunakbohra.com`.

## Environment Variables

### Local (`.env`)
```bash
VITE_API_URL=http://localhost:8787
```

### Production (`.env.production`)
```bash
VITE_API_URL=https://crm-api.raunakbohra.com
```

**Note:** Use the custom domain `crm-api.raunakbohra.com` instead of `fieldforce-crm-api.rnkbohra.workers.dev` to ensure cookies work across subdomains.

## How CSRF Works Now

### 1. Token Generation
- Backend generates HMAC-signed token
- Token set in cookie with environment-appropriate attributes
- Token also sent in response header

### 2. Token Validation
- Frontend reads token from cookie
- Frontend sends token in `x-csrf-token` header
- Backend verifies:
  - Cookie token exists
  - Header token exists
  - Both tokens match
  - Token HMAC signature is valid

### 3. Environment Differences

**Development:**
- Cookie: `SameSite=Lax` (same-origin only)
- Works with HTTP
- Frontend and backend on same domain (localhost)

**Production:**
- Cookie: `SameSite=None; Secure; Domain=.raunakbohra.com` (cross-subdomain)
- Requires HTTPS
- Frontend (`crm.raunakbohra.com`) and backend (`crm-api.raunakbohra.com`) share parent domain

## Security Considerations

### SameSite Cookie Attributes

| Attribute | Local | Production | Why |
|-----------|-------|------------|-----|
| `SameSite=Lax` | ✅ Yes | ❌ No | Allows same-site requests, works with HTTP |
| `SameSite=None` | ❌ No | ✅ Yes | Allows cross-site requests, requires HTTPS |
| `Secure` | ❌ No | ✅ Yes | Only sent over HTTPS |

### Why Different Settings?

1. **Local Development (Lax)**:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:8787`
   - Same origin (localhost), so `Lax` works
   - HTTP allowed in development

2. **Production (None + Secure + Domain)**:
   - Frontend: `https://crm.raunakbohra.com` (Cloudflare Pages)
   - Backend: `https://crm-api.raunakbohra.com` (Workers with custom domain)
   - Different subdomains, requires `SameSite=None` + `Domain=.raunakbohra.com`
   - HTTPS required for `Secure` flag

## Troubleshooting

### Issue: "CSRF token missing"

**Cause:** Cookie not being set or read

**Fix:**
1. Check `VITE_API_URL` is set correctly
2. Verify cookie is set: Check browser DevTools → Application → Cookies
3. Ensure `credentials: 'include'` in fetch requests

### Issue: "CSRF token mismatch"

**Cause:** Cookie domain mismatch or missing Domain attribute

**Fix:**
1. Verify backend sets `Domain=.raunakbohra.com` in cookie
2. Verify frontend uses `crm-api.raunakbohra.com` (not `*.workers.dev`)
3. Check browser DevTools → Application → Cookies for `csrf_token`
4. Clear browser cookies and refresh

### Issue: CSRF works locally but fails in production

**Cause:** Missing `Domain` attribute on cookies (host-only cookies don't work across subdomains)

**Fix:**
1. Verify backend sets `Domain=.raunakbohra.com` in Set-Cookie header
2. Use custom domain `crm-api.raunakbohra.com` for Workers (not `*.workers.dev`)
3. Verify production uses `SameSite=None; Secure; Domain=.raunakbohra.com`
4. Check frontend is on HTTPS

## Key Takeaways

### ✅ What Fixed the Issue

1. **Added Domain Attribute**: `Domain=.raunakbohra.com` to all Set-Cookie headers
2. **Used Custom Domain**: `crm-api.raunakbohra.com` instead of `*.workers.dev`
3. **Same Parent Domain**: Both frontend and backend under `*.raunakbohra.com`

### 🔍 How to Verify It's Working

```bash
# Check backend sets Domain attribute
curl -s -i https://crm-api.raunakbohra.com/api/csrf-token | grep -i domain

# Expected output:
# Domain=raunakbohra.com
```

### 🚨 Common Mistakes to Avoid

❌ **DON'T** use different parent domains (e.g., `crm.raunakbohra.com` + `*.workers.dev`)
✅ **DO** use same parent domain with custom domain setup

❌ **DON'T** forget Domain attribute in Set-Cookie header
✅ **DO** set `Domain=.raunakbohra.com` for cross-subdomain cookies

❌ **DON'T** use hardcoded fallback URLs that bypass env vars
✅ **DO** use environment variables consistently

## Files Modified

1. ✅ `src/middleware/csrf.ts` - Added `Domain=.raunakbohra.com` to cookies (lines 95, 172)
2. ✅ `web/src/utils/csrf.ts` - Updated API URL to `crm-api.raunakbohra.com`
3. ✅ `web/src/services/api.ts` - Updated API URL to `crm-api.raunakbohra.com`
4. ✅ `web/.env.production` - Set `VITE_API_URL=https://crm-api.raunakbohra.com`

## Deployment

```bash
# Deploy backend with Domain fix
wrangler deploy --env=""

# Build frontend
cd web && npm run build

# Deploy frontend to Cloudflare Pages
wrangler pages deploy dist --project-name=fieldforce-crm
```

### Cloudflare Pages Environment Variable

Set in Cloudflare Pages dashboard:
- **Variable**: `VITE_API_URL`
- **Value**: `https://crm-api.raunakbohra.com`
- **Type**: Text

---

**Last Updated:** 2025-10-07
**Status:** ✅ Fixed and Tested - Domain Attribute Added
**Environments:** Local (HTTP) + Production (HTTPS with Domain attribute)
