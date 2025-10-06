# RBAC Request Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    1. HTTP Request                          │
│                                                             │
│   POST /api/users  (Create new user)                       │
│   Headers: { Authorization: "Bearer <JWT_TOKEN>" }         │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              2. Authentication Middleware                   │
│              (src/middleware/auth.ts)                       │
│                                                             │
│  • Verify JWT token is valid                               │
│  • Extract user info: { userId, email, role }              │
│  • Store in context: c.set('user', { ... })                │
│                                                             │
│  ❌ If invalid → 401 Unauthorized                           │
│  ✅ If valid → Continue to next middleware                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              3. RBAC Middleware                             │
│              (src/middleware/rbac.ts)                       │
│                                                             │
│  Example: requireAdmin(['ADMIN'])                           │
│                                                             │
│  Step 1: Get user from context                             │
│    const user = c.get('user')                              │
│    // { userId: '123', email: 'john@ex.com', role: 'FIELD_REP' }
│                                                             │
│  Step 2: Check if user has required role                   │
│    allowedRoles = ['ADMIN']                                │
│    user.role = 'FIELD_REP'                                 │
│                                                             │
│  Step 3: Decision                                          │
│    if (!allowedRoles.includes(user.role)) {                │
│      ❌ Return 403 Forbidden                                │
│      Log: "Forbidden access attempt"                       │
│    }                                                        │
│                                                             │
│  ✅ If authorized → Continue to route handler               │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              4. Route Handler                               │
│              (src/routes/users.ts)                          │
│                                                             │
│  users.post('/', requireAdmin, async (c) => {              │
│    // Only ADMIN users reach here                          │
│    const body = await c.req.json();                        │
│    // Create user in database...                           │
│    return c.json({ success: true });                       │
│  });                                                        │
└─────────────────────────────────────────────────────────────┘
```

---

## Example Scenarios

### Scenario 1: FIELD_REP tries to create user ❌

```
Request: POST /api/users
User: { role: 'FIELD_REP' }
RBAC Check: requireAdmin(['ADMIN'])

Flow:
1. ✅ Auth: JWT valid, user authenticated
2. ❌ RBAC: 'FIELD_REP' not in ['ADMIN']
3. Response: 403 Forbidden
   {
     "error": "Forbidden",
     "message": "Access denied. Required role: ADMIN",
     "userRole": "FIELD_REP",
     "requiredRoles": ["ADMIN"]
   }

Logs:
[WARN] Forbidden access attempt - insufficient permissions
  userId: "123"
  userRole: "FIELD_REP"
  requiredRoles: ["ADMIN"]
  path: "/api/users"
  method: "POST"
```

---

### Scenario 2: MANAGER approves order ✅

```
Request: PUT /api/orders/abc-123/status
User: { role: 'MANAGER' }
RBAC Check: requireManager(['ADMIN', 'MANAGER'])

Flow:
1. ✅ Auth: JWT valid, user authenticated
2. ✅ RBAC: 'MANAGER' in ['ADMIN', 'MANAGER']
3. ✅ Route handler: Process order approval
4. Response: 200 OK

Logs:
[DEBUG] Role authorization successful
  userId: "456"
  userRole: "MANAGER"
  allowedRoles: ["ADMIN", "MANAGER"]
```

---

### Scenario 3: ADMIN creates user ✅

```
Request: POST /api/users
User: { role: 'ADMIN' }
RBAC Check: requireAdmin(['ADMIN'])

Flow:
1. ✅ Auth: JWT valid, user authenticated
2. ✅ RBAC: 'ADMIN' in ['ADMIN']
3. ✅ Route handler: Create user in database
4. Response: 200 OK

Logs:
[DEBUG] Role authorization successful
  userId: "789"
  userRole: "ADMIN"
  allowedRoles: ["ADMIN"]
```

---

## Middleware Chain Order

```typescript
// Correct order (must be in this sequence):
app.use('/*', authMiddleware)      // 1. Authenticate first
users.post('/', requireAdmin, ...) // 2. Then authorize
```

**Why this order matters:**
- Authentication (authMiddleware) runs BEFORE authorization (RBAC)
- Auth sets `c.set('user', ...)` which RBAC reads
- If auth fails, RBAC never runs (request stops at 401)
