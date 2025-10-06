# RBAC Testing Guide

## 🎯 What is RBAC?

**Role-Based Access Control (RBAC)** restricts system access based on user roles. Instead of managing permissions per user, we assign users to roles, and roles have predefined permissions.

---

## 📊 Our RBAC Model

### Role Hierarchy

```
┌──────────┐
│  ADMIN   │  ← Full system access
└────┬─────┘
     │
┌────▼──────┐
│ MANAGER   │  ← Team management + approvals
└────┬──────┘
     │
┌────▼──────┐
│ FIELD_REP │  ← Own data only
└───────────┘
```

### Role Permissions Matrix

| Feature | FIELD_REP | MANAGER | ADMIN |
|---------|-----------|---------|-------|
| **Users** |
| List users | ❌ No | ✅ Yes | ✅ Yes |
| Create user | ❌ No | ❌ No | ✅ Yes |
| Edit user | ❌ No | ❌ No | ✅ Yes |
| Delete user | ❌ No | ❌ No | ✅ Yes |
| **Territories** |
| View territories | ✅ Yes | ✅ Yes | ✅ Yes |
| Create territory | ❌ No | ✅ Yes | ✅ Yes |
| Edit territory | ❌ No | ✅ Yes | ✅ Yes |
| Delete territory | ❌ No | ✅ Yes | ✅ Yes |
| **Products** |
| View products | ✅ Yes | ✅ Yes | ✅ Yes |
| Create product | ❌ No | ✅ Yes | ✅ Yes |
| Edit product | ❌ No | ✅ Yes | ✅ Yes |
| **Orders** |
| Create order | ✅ Yes | ✅ Yes | ✅ Yes |
| View own orders | ✅ Yes | ✅ Yes | ✅ Yes |
| View all orders | ❌ No | ✅ Yes | ✅ Yes |
| Approve/Reject | ❌ No | ✅ Yes | ✅ Yes |
| **Visits** |
| Create visit | ✅ Yes | ✅ Yes | ✅ Yes |
| View own visits | ✅ Yes | ✅ Yes | ✅ Yes |
| View all visits | ❌ No | ✅ Yes | ✅ Yes |

---

## 🔧 How It Works (Technical)

### 1. Middleware Chain

```typescript
// In src/routes/users.ts
import { authMiddleware } from '../middleware/auth';
import { requireAdmin, requireManager } from '../middleware/rbac';

const users = new Hono();

// Step 1: All routes require authentication
users.use('/*', authMiddleware);

// Step 2: Specific routes require specific roles
users.get('/', requireManager, async (c) => {
  // Only ADMIN and MANAGER can reach here
});

users.post('/', requireAdmin, async (c) => {
  // Only ADMIN can reach here
});
```

### 2. Authentication Flow

```
┌─────────────────┐
│  1. Client      │  POST /api/users
│     Request     │  Authorization: Bearer <JWT>
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  2. Auth        │  authMiddleware:
│     Middleware  │  - Verify JWT signature
│                 │  - Check expiration
│                 │  - Extract: { userId, email, role }
│                 │  - Store: c.set('user', {...})
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  3. RBAC        │  requireAdmin(['ADMIN']):
│     Middleware  │  - Get: user = c.get('user')
│                 │  - Check: user.role in ['ADMIN']?
│                 │  - If NO: Return 403 Forbidden
│                 │  - If YES: Continue
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  4. Route       │  async (c) => {
│     Handler     │    // Business logic here
│                 │    await createUser(...)
│                 │    return c.json({ success: true })
│                 │  }
└─────────────────┘
```

### 3. Code Example

**RBAC Middleware (`src/middleware/rbac.ts`):**

```typescript
export const requireRole = (allowedRoles: UserRole[]) => {
  return async (c: Context, next: Next) => {
    const user = c.get('user');

    // Check authentication
    if (!user || !user.id) {
      logger.warn('Unauthorized access attempt');
      return c.json({ error: 'Unauthorized' }, 401);
    }

    // Check authorization
    if (!allowedRoles.includes(user.role as UserRole)) {
      logger.warn('Forbidden access attempt', {
        userId: user.id,
        userRole: user.role,
        requiredRoles: allowedRoles,
        path: c.req.path,
      });

      return c.json({
        error: 'Forbidden',
        message: `Access denied. Required role: ${allowedRoles.join(' or ')}`,
        userRole: user.role,
        requiredRoles: allowedRoles,
      }, 403);
    }

    // Authorization successful
    await next();
  };
};

// Convenience helpers
export const requireAdmin = requireRole(['ADMIN']);
export const requireManager = requireRole(['ADMIN', 'MANAGER']);
```

---

## 🧪 Manual Testing Instructions

### Prerequisites

1. **Start the backend server:**
   ```bash
   cd /Users/raunakbohra/Desktop/medical-CRM
   npm run dev
   ```

2. **Ensure test users exist in database:**
   - Check if users with different roles exist
   - If not, create them via database or signup endpoint

---

### Test Scenarios

#### Test 1: Unauthenticated Access (Should Fail with 401)

```bash
# Try to list users without token
curl -X GET http://localhost:8787/api/users
```

**Expected Response:**
```json
{
  "error": "Unauthorized",
  "message": "No authorization header provided"
}
```
**HTTP Status:** `401 Unauthorized`

---

#### Test 2: Get JWT Tokens

```bash
# Login as ADMIN
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "your_password"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "abc-123",
    "email": "admin@example.com",
    "role": "ADMIN"
  }
}
```

**Save the token:**
```bash
# For easy testing, store tokens in variables
ADMIN_TOKEN="<paste_token_here>"
MANAGER_TOKEN="<paste_manager_token_here>"
FIELD_REP_TOKEN="<paste_field_rep_token_here>"
```

---

#### Test 3: ADMIN Access (Should Succeed)

```bash
# ADMIN lists users (requireManager - allows ADMIN + MANAGER)
curl -X GET "http://localhost:8787/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {...}
}
```
**HTTP Status:** `200 OK`

---

```bash
# ADMIN creates user (requireAdmin - ADMIN only)
curl -X POST http://localhost:8787/api/users \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "newuser@example.com",
    "name": "New User",
    "password": "SecurePass123",
    "role": "FIELD_REP"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "data": {
    "id": "new-user-id",
    "email": "newuser@example.com",
    "role": "FIELD_REP"
  }
}
```
**HTTP Status:** `201 Created`

---

#### Test 4: MANAGER Access (Mixed Results)

```bash
# MANAGER lists users (requireManager - should SUCCEED)
curl -X GET "http://localhost:8787/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $MANAGER_TOKEN"
```

**Expected:** `200 OK` ✅

---

```bash
# MANAGER tries to create user (requireAdmin - should FAIL)
curl -X POST http://localhost:8787/api/users \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "blocked@example.com",
    "name": "Blocked User",
    "password": "Pass123",
    "role": "FIELD_REP"
  }'
```

**Expected Response:**
```json
{
  "error": "Forbidden",
  "message": "Access denied. Required role: ADMIN",
  "userRole": "MANAGER",
  "requiredRoles": ["ADMIN"]
}
```
**HTTP Status:** `403 Forbidden` ✅

---

#### Test 5: FIELD_REP Access (Most Restrictive)

```bash
# FIELD_REP tries to list users (requireManager - should FAIL)
curl -X GET "http://localhost:8787/api/users?page=1&limit=10" \
  -H "Authorization: Bearer $FIELD_REP_TOKEN"
```

**Expected Response:**
```json
{
  "error": "Forbidden",
  "message": "Access denied. Required role: ADMIN or MANAGER",
  "userRole": "FIELD_REP",
  "requiredRoles": ["ADMIN", "MANAGER"]
}
```
**HTTP Status:** `403 Forbidden` ✅

---

```bash
# FIELD_REP creates order (no RBAC - should SUCCEED)
curl -X POST http://localhost:8787/api/orders \
  -H "Authorization: Bearer $FIELD_REP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contactId": "<valid-contact-id>",
    "items": [
      {
        "productId": "<valid-product-id>",
        "quantity": 5,
        "price": 100
      }
    ]
  }'
```

**Expected:** `201 Created` ✅

---

#### Test 6: Order Approval (MANAGER Only)

```bash
# FIELD_REP tries to approve order (requireManager - should FAIL)
curl -X PUT http://localhost:8787/api/orders/<order-id>/status \
  -H "Authorization: Bearer $FIELD_REP_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

**Expected:** `403 Forbidden` ✅

---

```bash
# MANAGER approves order (requireManager - should SUCCEED)
curl -X PUT http://localhost:8787/api/orders/<order-id>/status \
  -H "Authorization: Bearer $MANAGER_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "APPROVED"}'
```

**Expected:** `200 OK` ✅

---

## 📋 Test Checklist

Use this checklist to verify RBAC is working:

### User Management (`/api/users`)
- [ ] ❌ Unauthenticated → 401 Unauthorized
- [ ] ✅ ADMIN can list users → 200 OK
- [ ] ✅ MANAGER can list users → 200 OK
- [ ] ❌ FIELD_REP cannot list users → 403 Forbidden
- [ ] ✅ ADMIN can create user → 201 Created
- [ ] ❌ MANAGER cannot create user → 403 Forbidden
- [ ] ❌ FIELD_REP cannot create user → 403 Forbidden

### Territory Management (`/api/territories`)
- [ ] ✅ FIELD_REP can view territories → 200 OK (read access)
- [ ] ✅ MANAGER can create territory → 201 Created
- [ ] ❌ FIELD_REP cannot create territory → 403 Forbidden

### Product Management (`/api/products`)
- [ ] ✅ FIELD_REP can view products → 200 OK (read access)
- [ ] ✅ MANAGER can create product → 201 Created
- [ ] ❌ FIELD_REP cannot create product → 403 Forbidden

### Order Management (`/api/orders`)
- [ ] ✅ FIELD_REP can create order → 201 Created
- [ ] ✅ MANAGER can approve order → 200 OK
- [ ] ❌ FIELD_REP cannot approve order → 403 Forbidden

---

## 🐛 Troubleshooting

### Issue 1: Always getting 401 Unauthorized

**Cause:** JWT token expired or invalid

**Solution:**
```bash
# Login again to get fresh token
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"your@email.com","password":"your_password"}'
```

---

### Issue 2: Getting 403 even with correct role

**Possible causes:**
1. **Middleware not applied:** Check route definition has `requireAdmin` or `requireManager`
2. **User role incorrect:** Verify user role in database
3. **JWT claims wrong:** Decode JWT to check role claim

**Debug:**
```bash
# Check your JWT claims at https://jwt.io
# Paste your token and verify "role" field
```

---

### Issue 3: RBAC not blocking access

**Possible causes:**
1. **Middleware order wrong:** Auth must come before RBAC
2. **Route not protected:** Check if `requireRole` middleware is applied
3. **Bypass logic:** Check for inline role checks that might override RBAC

**Solution:** Review route file and ensure middleware chain is correct:
```typescript
users.use('/*', authMiddleware);  // 1. Auth first
users.post('/', requireAdmin, ...); // 2. Then RBAC
```

---

## 📊 Logs to Watch

When testing, monitor backend logs for:

```
# Successful authorization
[DEBUG] Role authorization successful
  userId: "123"
  userRole: "ADMIN"
  allowedRoles: ["ADMIN"]

# Failed authorization
[WARN] Forbidden access attempt - insufficient permissions
  userId: "456"
  userRole: "FIELD_REP"
  requiredRoles: ["ADMIN"]
  path: "/api/users"
  method: "POST"
```

---

## ✅ Success Criteria

Your RBAC is working correctly if:

1. ✅ Unauthenticated requests return 401
2. ✅ ADMIN can access all endpoints
3. ✅ MANAGER can access manager-level endpoints, blocked from admin-only
4. ✅ FIELD_REP can only access their own data and read-only endpoints
5. ✅ Forbidden requests return clear error messages with role info
6. ✅ All authorization attempts are logged

---

## 📚 Related Files

- **RBAC Middleware:** [src/middleware/rbac.ts](../../src/middleware/rbac.ts)
- **Auth Middleware:** [src/middleware/auth.ts](../../src/middleware/auth.ts)
- **Protected Routes:**
  - [src/routes/users.ts](../../src/routes/users.ts)
  - [src/routes/territories.ts](../../src/routes/territories.ts)
  - [src/routes/products.ts](../../src/routes/products.ts)
  - [src/routes/orders.ts](../../src/routes/orders.ts)
- **Flow Diagram:** [docs/diagrams/rbac-flow.md](../diagrams/rbac-flow.md)
