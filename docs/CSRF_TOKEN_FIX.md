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
const API_URL = import.meta.env.VITE_API_URL || 'https://crm-api.raunakbohra.com';
```

**After:**
```typescript
function getApiUrl(): string {
  const apiUrl = import.meta.env.VITE_API_URL;

  if (!apiUrl) {
    throw new Error(
      'VITE_API_URL is not configured. Please set it in your .env file.\n' +
      'Local: VITE_API_URL=http://localhost:8787\n' +
      'Production: VITE_API_URL=https://fieldforce-crm-api.rnkbohra.workers.dev'
    );
  }

  return apiUrl;
}
```

**Benefits:**
- ✅ No hardcoded fallback URL
- ✅ Clear error message if environment variable is missing
- ✅ Forces proper configuration
- ✅ Consistent behavior across environments

### Backend Changes (`src/middleware/csrf.ts`)

**Added Environment-Aware Cookie Configuration:**

```typescript
function getCookieAttributes(env?: string): string {
  const isProduction = env === 'production';

  if (isProduction) {
    // Production: Cross-domain cookies with explicit domain
    // SameSite=None requires Secure flag (HTTPS only)
    return 'Path=/; SameSite=None; Secure; Max-Age=3600';
  } else {
    // Development: Same-site cookies (localhost)
    // SameSite=Lax works for localhost without Secure flag
    return 'Path=/; SameSite=Lax; Max-Age=3600';
  }
}
```

**Updated CSRF Middleware:**

```typescript
export async function csrfProtection(c: Context, next: Next) {
  const environment = c.env.ENVIRONMENT || 'development';
  const cookieAttributes = getCookieAttributes(environment);

  // Set CSRF token in cookie
  c.header('Set-Cookie', `${CSRF_COOKIE_NAME}=${token}; ${cookieAttributes}`);
  // ...
}
```

**Benefits:**
- ✅ Local development uses `SameSite=Lax` (works with HTTP)
- ✅ Production uses `SameSite=None; Secure` (works cross-domain with HTTPS)
- ✅ Cookies work correctly in both environments
- ✅ No manual configuration needed

## Testing

### Local Development (HTTP)
```bash
curl -i http://localhost:8787/api/csrf-token

# Response:
Set-Cookie: csrf_token=...; Path=/; SameSite=Lax; Max-Age=3600
```

### Production (HTTPS)
```bash
curl -i https://fieldforce-crm-api.rnkbohra.workers.dev/api/csrf-token

# Response:
Set-Cookie: csrf_token=...; Path=/; SameSite=None; Secure; Max-Age=3600
```

## Environment Variables

### Local (`.env`)
```bash
VITE_API_URL=http://localhost:8787
```

### Production (`.env.production`)
```bash
VITE_API_URL=https://fieldforce-crm-api.rnkbohra.workers.dev
```

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
- Cookie: `SameSite=None; Secure` (cross-origin allowed)
- Requires HTTPS
- Frontend and backend can be on different domains

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

2. **Production (None + Secure)**:
   - Frontend: `https://crm.raunakbohra.com` (Cloudflare Pages)
   - Backend: `https://fieldforce-crm-api.rnkbohra.workers.dev` (Workers)
   - Different origins, requires `SameSite=None`
   - HTTPS required for `Secure` flag

## Troubleshooting

### Issue: "CSRF token missing"

**Cause:** Cookie not being set or read

**Fix:**
1. Check `VITE_API_URL` is set correctly
2. Verify cookie is set: Check browser DevTools → Application → Cookies
3. Ensure `credentials: 'include'` in fetch requests

### Issue: "CSRF token mismatch"

**Cause:** Cookie domain mismatch

**Fix:**
1. Verify frontend and backend are using correct domains
2. Check cookie attributes match environment (Lax vs None)
3. Clear browser cookies and refresh

### Issue: CSRF works locally but fails in production

**Cause:** Cookie `SameSite` policy mismatch

**Fix:**
1. Ensure `ENVIRONMENT=production` is set in Cloudflare
2. Verify production uses `SameSite=None; Secure`
3. Check frontend is on HTTPS

## Manual Fix (If Needed)

If you encounter CSRF issues, you can manually configure:

### 1. Check Environment Variable
```bash
# In Cloudflare Workers
wrangler secret list

# Should show ENVIRONMENT="production"
```

### 2. Update Cookie Attributes
```typescript
// For specific domain requirements
function getCookieAttributes(env?: string): string {
  return 'Path=/; SameSite=None; Secure; Max-Age=3600; Domain=.raunakbohra.com';
}
```

### 3. Disable CSRF (NOT RECOMMENDED)
```typescript
// ONLY for debugging - remove after testing
app.use('/api/*', async (c, next) => {
  await next(); // Skip CSRF protection
});
```

## Files Modified

1. ✅ `web/src/utils/csrf.ts` - Fixed API URL handling
2. ✅ `src/middleware/csrf.ts` - Added environment-aware cookies
3. ✅ `web/src/pages/SignupWithEmailOTP.tsx` - Fixed TypeScript errors
4. ✅ `web/src/pages/SignupWithOTP.tsx` - Fixed TypeScript errors

## Deployment

```bash
# Deploy backend
wrangler deploy --env=""

# Build and deploy frontend
cd web && npm run build
# Then deploy dist/ to Cloudflare Pages
```

---

**Last Updated:** 2025-10-07
**Status:** ✅ Fixed and Tested
**Environments:** Local (HTTP) + Production (HTTPS)
