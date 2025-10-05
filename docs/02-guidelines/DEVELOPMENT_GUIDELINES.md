# Development Guidelines - Field Force CRM

**Version**: 1.0
**Last Updated**: 2025-10-05
**Status**: Active - Follow for all code contributions

---

## Table of Contents

1. [Project Structure](#1-project-structure)
2. [TypeScript Standards](#2-typescript-standards)
3. [Frontend Guidelines (React)](#3-frontend-guidelines-react)
4. [Backend Guidelines (Node.js)](#4-backend-guidelines-nodejs)
5. [Database Guidelines (PostgreSQL + Prisma)](#5-database-guidelines-postgresql--prisma)
6. [Security Standards](#6-security-standards)
7. [API Design Standards](#7-api-design-standards)
8. [UI/UX Guidelines](#8-uiux-guidelines)
9. [Error Handling](#9-error-handling)
10. [Testing Requirements](#10-testing-requirements)
11. [Performance Standards](#11-performance-standards)
12. [Git Workflow](#12-git-workflow)
13. [Documentation Rules](#13-documentation-rules)
14. [Code Review Checklist](#14-code-review-checklist)
15. [Logging & Monitoring](#15-logging--monitoring)
16. [Caching Strategy](#16-caching-strategy)

---

## 1. Project Structure

### 1.1 Folder Organization

```
medical-CRM/
├── api/                          # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/         # Request handlers (200-500 lines)
│   │   ├── services/            # Business logic (300-600 lines)
│   │   ├── middleware/          # Express middleware
│   │   ├── routes/              # Route definitions (100-300 lines)
│   │   ├── utils/               # Helper functions (200-400 lines)
│   │   ├── types/               # TypeScript types/interfaces
│   │   ├── jobs/                # Background jobs (Week 2+)
│   │   └── server.ts            # App entry point (150-400 lines)
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   ├── migrations/          # DB migrations (never delete!)
│   │   └── seed.ts              # Seed data
│   ├── tests/                   # Test files
│   │   ├── unit/
│   │   ├── integration/
│   │   └── fixtures/
│   ├── .env.example             # Environment template
│   ├── package.json
│   └── tsconfig.json
│
├── web/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/               # Page components
│   │   ├── components/          # Reusable components
│   │   ├── contexts/            # React contexts (auth, theme, etc.)
│   │   ├── hooks/               # Custom hooks
│   │   ├── utils/               # Helper functions
│   │   ├── types/               # TypeScript types
│   │   ├── styles/              # Global styles (if needed)
│   │   ├── assets/              # Images, SVGs, fonts
│   │   ├── App.tsx              # App root
│   │   └── main.tsx             # Entry point
│   ├── public/                  # Static files
│   ├── tests/                   # Test files
│   ├── .env.example
│   ├── package.json
│   ├── vite.config.ts
│   └── tsconfig.json
│
└── docs/                         # Documentation
    ├── 00_MASTER_IMPLEMENTATION_PLAN.md
    ├── DAY_01_*.md
    ├── DEVELOPMENT_GUIDELINES.md (this file)
    ├── OPERATIONAL_GUIDELINES.md
    ├── FEATURE_GUIDELINES.md
    └── ONBOARDING_GUIDE.md
```

### 1.2 File Naming Conventions

**Backend (Node.js)**:
- Controllers: `users.ts`, `contacts.ts` (plural, lowercase)
- Services: `emailService.ts`, `authService.ts` (camelCase + Service suffix)
- Middleware: `auth.ts`, `errorHandler.ts` (camelCase)
- Utils: `crypto.ts`, `dateFormatter.ts` (camelCase)
- Types: `User.types.ts`, `Contact.types.ts` (PascalCase + .types suffix)

**Frontend (React)**:
- Components: `Login.tsx`, `ContactForm.tsx` (PascalCase)
- Pages: `Dashboard.tsx`, `Contacts.tsx` (PascalCase)
- Hooks: `useAuth.ts`, `useLocalStorage.ts` (camelCase, use prefix)
- Utils: `formatDate.ts`, `validateEmail.ts` (camelCase)
- Contexts: `AuthContext.tsx` (PascalCase + Context suffix)

**Tests**:
- Unit: `users.test.ts`, `Login.test.tsx` (.test suffix)
- Integration: `auth.integration.test.ts`
- E2E: `login.e2e.test.ts`

### 1.3 File Size Standards

**CRITICAL - From Global Guidelines**:
- **Controllers**: 200-500 lines (complex business logic acceptable)
- **Routes**: 100-300 lines (declarative only, no inline logic)
- **Services**: 300-600 lines (domain logic with multiple methods)
- **Utilities**: 200-400 lines (focused helper functions)
- **Server Files**: 150-400 lines (Express setup with middleware)
- **Components**: 150-300 lines (split if larger)

**Principle**: Focus on **Single Responsibility Principle** over line count

**Exception**: Document WHY if file exceeds guidelines but serves one clear purpose

### 1.4 Module Organization

✅ **Good - Separated Concerns**:
```typescript
// api/src/controllers/users.ts
export const getUsers = async (req, res) => { ... };
export const getUser = async (req, res) => { ... };
export const createUser = async (req, res) => { ... };

// api/src/services/userService.ts
export const findUserById = async (id) => { ... };
export const createNewUser = async (data) => { ... };
```

❌ **Bad - Mixed Concerns**:
```typescript
// api/src/users.ts - Everything in one file!
export const getUsers = async (req, res) => { ... };
const sendWelcomeEmail = () => { ... }; // Should be in emailService
const hashPassword = () => { ... }; // Should be in utils/crypto
```

---

## 2. TypeScript Standards

### 2.1 Strict Mode Configuration

**tsconfig.json** (Backend & Frontend):
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

### 2.2 Type Safety

✅ **Good - Explicit Types**:
```typescript
interface User {
  id: string;
  email: string;
  name: string;
  role: 'super_admin' | 'admin' | 'manager' | 'sales_rep';
}

const getUser = async (id: string): Promise<User | null> => {
  const user = await prisma.user.findUnique({ where: { id } });
  return user;
};
```

❌ **Bad - Implicit `any`**:
```typescript
const getUser = async (id) => { // Implicit any
  const user = await prisma.user.findUnique({ where: { id } });
  return user; // Return type unknown
};
```

### 2.3 Interface vs Type

**Use `interface` for**:
- Object shapes that might be extended
- API contracts
- Component props

```typescript
interface ContactFormProps {
  contactId?: string;
  onSubmit: (data: ContactData) => void;
  onCancel: () => void;
}

interface Contact {
  id: string;
  name: string;
  email: string;
}
```

**Use `type` for**:
- Union types
- Intersection types
- Utility types

```typescript
type UserRole = 'super_admin' | 'admin' | 'manager' | 'sales_rep';
type PaymentMode = 'cash' | 'upi' | 'neft' | 'rtgs' | 'cheque' | 'card';
type ApiResponse<T> = { data: T } | { error: string };
```

### 2.4 Avoiding `any`

✅ **Good - Use `unknown` or Generic**:
```typescript
// Instead of any, use unknown
const parseJSON = (jsonString: string): unknown => {
  return JSON.parse(jsonString);
};

// Or use generics
const parseJSON = <T>(jsonString: string): T => {
  return JSON.parse(jsonString) as T;
};
```

❌ **Bad - Using `any`**:
```typescript
const parseJSON = (jsonString: string): any => {
  return JSON.parse(jsonString); // Loses type safety
};
```

### 2.5 Null vs Undefined

**Rule**: Use `null` for intentional absence, `undefined` for uninitialized

```typescript
interface User {
  id: string;
  name: string;
  phone: string | null; // Explicitly no phone
  managerId?: string;   // May not be set yet
}
```

### 2.6 Enums vs Union Types

**Prefer Union Types** (smaller bundle size):
```typescript
type OrderStatus = 'pending_approval' | 'approved' | 'rejected' | 'completed';
```

**Use Enums only if**:
- Need reverse mapping
- Need to iterate over values

```typescript
enum UserRole {
  SuperAdmin = 'super_admin',
  Admin = 'admin',
  Manager = 'manager',
  SalesRep = 'sales_rep'
}
```

---

## 3. Frontend Guidelines (React)

### 3.1 Component Structure

**Always use Functional Components** (no class components):

```typescript
// ✅ Good - Functional Component with TypeScript
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ContactFormProps {
  contactId?: string;
  onSuccess?: () => void;
}

export default function ContactForm({ contactId, onSuccess }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (contactId) {
      fetchContact();
    }
  }, [contactId]);

  const fetchContact = async () => {
    // Implementation
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* JSX */}
    </div>
  );
}
```

### 3.2 Component File Organization

```typescript
// 1. Imports (React, third-party, local)
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

// 2. Types/Interfaces
interface Props { ... }

// 3. Constants (inside component or outside if reusable)
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

// 4. Component
export default function ComponentName({ ...props }: Props) {
  // 4a. Hooks (useState, useEffect, custom hooks)
  const [state, setState] = useState();
  const { user } = useAuth();

  // 4b. Event handlers
  const handleSubmit = () => { ... };

  // 4c. useEffect
  useEffect(() => { ... }, []);

  // 4d. Render helpers (if complex)
  const renderHeader = () => { ... };

  // 4e. Return JSX
  return <div>...</div>;
}
```

### 3.3 Props Typing

✅ **Good - Explicit Props Interface**:
```typescript
interface ButtonProps {
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  className?: string;
}

function Button({
  label,
  onClick,
  variant = 'primary',
  disabled = false,
  className = ''
}: ButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-${variant} ${className}`}
    >
      {label}
    </button>
  );
}
```

### 3.4 State Management

**Use React Context for**:
- Authentication state
- Theme/settings
- Global UI state (modals, toasts)

**Use Local State for**:
- Form inputs
- Component-specific UI state
- Temporary data

```typescript
// Good - Context for auth
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
```

### 3.5 Custom Hooks

**Naming**: Always start with `use`

✅ **Good - Reusable Logic**:
```typescript
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      return initialValue;
    }
  });

  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### 3.6 Performance Optimization

**Use React.memo for**:
- Components that re-render frequently
- Pure components (same props = same output)

```typescript
import { memo } from 'react';

interface ContactCardProps {
  contact: Contact;
  onEdit: (id: string) => void;
}

const ContactCard = memo(({ contact, onEdit }: ContactCardProps) => {
  return (
    <div className="card">
      <h3>{contact.name}</h3>
      <button onClick={() => onEdit(contact.id)}>Edit</button>
    </div>
  );
});

export default ContactCard;
```

**Use useMemo for**:
- Expensive calculations
- Derived data from props/state

```typescript
const expensiveValue = useMemo(() => {
  return contacts.filter(c => c.type === 'doctor').length;
}, [contacts]);
```

**Use useCallback for**:
- Callback functions passed to child components
- Dependencies in useEffect

```typescript
const handleDelete = useCallback((id: string) => {
  setContacts(prev => prev.filter(c => c.id !== id));
}, []); // No dependencies = stable reference
```

### 3.7 Code Splitting & Lazy Loading

```typescript
import { lazy, Suspense } from 'react';

// Lazy load heavy components
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));

function App() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
      </Routes>
    </Suspense>
  );
}
```

### 3.8 Form Handling

**Use Controlled Components**:

```typescript
function ContactForm() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate and submit
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      {/* ... */}
    </form>
  );
}
```

---

## 4. Backend Guidelines (Cloudflare Workers + Hono)

**Architecture**: We use **Cloudflare Workers** with **Hono framework** for edge computing.

**Why Cloudflare Workers?**
- Zero cold starts (unlike Lambda)
- Global edge network (275+ cities)
- Lower latency in India (10-50ms)
- 90% cheaper than traditional serverless
- Scales automatically

### 4.1 Route Handler Pattern (Hono)

**Route handlers should ONLY**:
- Parse request (c.req.json(), c.req.param(), c.req.query())
- Call service layer
- Return response (c.json(), c.text())

✅ **Good - Thin Route Handler**:
```typescript
// api/src/routes/contacts.ts
import { Hono } from 'hono';
import { authMiddleware } from '../middleware/auth';
import { getPrisma } from '../utils/db';
import { contactService } from '../services/contactService';
import { Bindings } from '../index';

const contacts = new Hono<{ Bindings: Bindings }>();

// Apply auth middleware to all routes
contacts.use('/*', authMiddleware);

// GET /api/contacts
contacts.get('/', async (c) => {
  try {
    const { type, search } = c.req.query();
    const user = c.get('user'); // From auth middleware

    const prisma = getPrisma(c.env.DATABASE_URL);
    const results = await contactService.findContacts(prisma, {
      type,
      search,
      userId: user.id
    });

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return c.json({ success: false, error: error.message }, 500);
  }
});

// POST /api/contacts
contacts.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const user = c.get('user');

    const prisma = getPrisma(c.env.DATABASE_URL);
    const contact = await contactService.createContact(prisma, {
      ...body,
      createdBy: user.id
    });

    return c.json({ success: true, data: contact }, 201);
  } catch (error) {
    console.error('Error creating contact:', error);
    return c.json({ success: false, error: error.message }, 400);
  }
});

export default contacts;
```

❌ **Bad - Business Logic in Route Handler**:
```typescript
// ❌ Don't put validation, database queries directly in handlers
contacts.post('/', async (c) => {
  const body = await c.req.json();

  // ❌ Validation in handler (should be in service)
  if (!body.name || body.name.length < 3) {
    return c.json({ error: 'Invalid name' }, 400);
  }

  // ❌ Direct database access (should be in service)
  const prisma = getPrisma(c.env.DATABASE_URL);
  const contact = await prisma.contact.create({
    data: body
  });

  return c.json({ contact });
});
```

### 4.2 Legacy Pattern (Express - for reference only)

**Note**: We're migrating from Express to Hono. Keep this for reference.

```typescript
// api/src/controllers/contacts.ts (Express - legacy)
import { Request, Response } from 'express';
import { contactService } from '../services/contactService';

export const getContacts = async (req: Request, res: Response) => {
  try {
    const { type, assignedTo, search } = req.query;

    const contacts = await contactService.findContacts({
      type: type as string,
      assignedTo: assignedTo as string,
      search: search as string
    });

    res.json({ contacts });
  } catch (error) {
    console.error('Get contacts error:', error);
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};
```

❌ **Bad - Fat Controller**:
```typescript
export const getContacts = async (req: Request, res: Response) => {
  try {
    const { type, assignedTo, search } = req.query;

    // ❌ Business logic in controller!
    const where: any = {};
    if (type) where.type = type;
    if (assignedTo) where.assignedTo = assignedTo;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } }
      ];
    }

    const contacts = await prisma.contact.findMany({ where });
    res.json({ contacts });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch contacts' });
  }
};
```

### 4.2 Service Layer Pattern

**Services should contain**:
- Business logic
- Database queries
- Data validation
- External API calls

```typescript
// api/src/services/contactService.ts
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface FindContactsParams {
  type?: string;
  assignedTo?: string;
  search?: string;
}

export const contactService = {
  async findContacts(params: FindContactsParams) {
    const where: any = {};

    if (params.type) {
      where.type = params.type;
    }

    if (params.assignedTo) {
      where.assignedTo = params.assignedTo;
    }

    if (params.search) {
      where.OR = [
        { name: { contains: params.search, mode: 'insensitive' } },
        { phone: { contains: params.search } },
        { email: { contains: params.search, mode: 'insensitive' } }
      ];
    }

    return prisma.contact.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
  },

  async findById(id: string) {
    return prisma.contact.findUnique({ where: { id } });
  },

  async create(data: CreateContactData) {
    // Validation
    if (!data.name || !data.type) {
      throw new Error('Name and type are required');
    }

    return prisma.contact.create({ data });
  }
};
```

### 4.3 Middleware Organization

```typescript
// api/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/auth';

export const authenticateToken = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = verifyToken(token);
    (req as any).user = decoded;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

### 4.4 Route Organization

**Routes should be**:
- Declarative only
- No business logic
- Clean and readable

```typescript
// api/src/routes/contacts.ts
import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getContacts,
  getContact,
  createContact,
  updateContact,
  deleteContact
} from '../controllers/contacts';

const router = Router();

// All routes require authentication
router.use(authenticateToken);

router.get('/', getContacts);
router.get('/:id', getContact);
router.post('/', createContact);
router.put('/:id', updateContact);
router.delete('/:id', deleteContact);

export default router;
```

### 4.5 Async/Await Best Practices

✅ **Good - Proper Error Handling**:
```typescript
export const getUser = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const user = await userService.findById(id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
};
```

❌ **Bad - No Error Handling**:
```typescript
export const getUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const user = await userService.findById(id); // Unhandled promise rejection!
  res.json({ user });
};
```

### 4.6 Input Validation

**Always validate and sanitize user input**:

```typescript
import { body, validationResult } from 'express-validator';

export const createContactValidation = [
  body('type').isIn(['doctor', 'retailer', 'wholesaler', 'dealer', 'other']),
  body('name').trim().isLength({ min: 2, max: 100 }),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10}$/)
];

export const createContact = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  // Proceed with creation
};
```

---

## 5. Database Guidelines (PostgreSQL + Prisma)

### 5.1 Schema Design Principles

**Follow these rules**:
- Use UUIDs for primary keys (not auto-increment integers)
- Use snake_case for column names
- Use PascalCase for model names
- Add indexes on foreign keys
- Add indexes on frequently queried columns
- Use timestamps (createdAt, updatedAt)

```prisma
model Contact {
  id           String   @id @default(uuid())
  type         String   // doctor, retailer, wholesaler
  name         String
  phone        String?
  email        String?
  latitude     Decimal?
  longitude    Decimal?
  assignedTo   String?  @map("assigned_to")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@index([assignedTo])
  @@index([type])
  @@index([email])
  @@map("contacts")
}
```

### 5.2 Migration Strategy

**CRITICAL RULES**:
- **NEVER reset the database** (`prisma migrate reset` is FORBIDDEN in production)
- Always create migrations for schema changes
- Test migrations on staging before production
- Migrations are append-only (never edit existing migrations)
- Name migrations descriptively

```bash
# ✅ Good - Create new migration
npx prisma migrate dev --name add_contacts_table

# ✅ Good - Apply migrations to production
npx prisma migrate deploy

# ❌ FORBIDDEN - Never run in production!
npx prisma migrate reset
npx prisma db push # Only for dev
```

### 5.3 Query Optimization

✅ **Good - Select Only Needed Fields**:
```typescript
const users = await prisma.user.findMany({
  select: {
    id: true,
    name: true,
    email: true
  }
});
```

❌ **Bad - Select All Fields**:
```typescript
const users = await prisma.user.findMany(); // Returns password_hash too!
```

**Use Indexes**:
```prisma
model Visit {
  id        String   @id @default(uuid())
  userId    String   @map("user_id")
  contactId String   @map("contact_id")
  createdAt DateTime @default(now())

  @@index([userId]) // For queries by user
  @@index([contactId]) // For queries by contact
  @@index([createdAt]) // For date range queries
}
```

### 5.4 Prevent N+1 Queries

✅ **Good - Use `include`**:
```typescript
const orders = await prisma.order.findMany({
  include: {
    contact: true,
    items: true
  }
});
```

❌ **Bad - N+1 Query**:
```typescript
const orders = await prisma.order.findMany();
for (const order of orders) {
  const contact = await prisma.contact.findUnique({ where: { id: order.contactId } });
  const items = await prisma.orderItem.findMany({ where: { orderId: order.id } });
}
```

### 5.5 Transaction Handling

**Use transactions for**:
- Multiple related writes
- Data consistency requirements

```typescript
await prisma.$transaction(async (tx) => {
  const order = await tx.order.create({
    data: {
      orderNumber: 'ORD-001',
      contactId: 'contact-id',
      totalAmount: 1000
    }
  });

  await tx.orderItem.createMany({
    data: [
      { orderId: order.id, productId: 'prod-1', quantity: 10 },
      { orderId: order.id, productId: 'prod-2', quantity: 5 }
    ]
  });

  await tx.payment.create({
    data: {
      orderId: order.id,
      amount: 1000,
      paymentMode: 'cash'
    }
  });
});
```

### 5.6 Connection Pooling

```typescript
// api/src/utils/prisma.ts
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error']
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
```

---

## 6. Security Standards

### 6.1 Authentication (JWT)

**JWT Configuration**:
```typescript
// api/src/utils/auth.ts
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRY = '7d';
const BCRYPT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const generateToken = (payload: {
  userId: string;
  email: string;
  role: string;
}): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): any => {
  return jwt.verify(token, JWT_SECRET);
};
```

### 6.2 Authorization (Role-Based Access Control)

```typescript
// api/src/middleware/authorize.ts
export const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ error: 'Not authenticated' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    next();
  };
};

// Usage
router.put('/orders/:id/approve',
  authenticateToken,
  authorize(['manager', 'admin', 'super_admin']),
  approveOrder
);
```

### 6.3 Input Validation & Sanitization

**Always validate and sanitize**:
```typescript
import { body, param, query } from 'express-validator';
import validator from 'validator';

export const createContactValidation = [
  body('name')
    .trim()
    .escape() // Prevent XSS
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be 2-100 characters'),

  body('email')
    .optional()
    .isEmail()
    .normalizeEmail()
    .custom((value) => {
      if (!validator.isEmail(value)) {
        throw new Error('Invalid email format');
      }
      return true;
    }),

  body('phone')
    .optional()
    .matches(/^[0-9]{10}$/)
    .withMessage('Phone must be 10 digits')
];
```

### 6.4 SQL Injection Prevention

**Prisma protects against SQL injection by default**. Never use raw queries with user input:

✅ **Good - Parameterized Query**:
```typescript
const users = await prisma.user.findMany({
  where: {
    email: userInput.email // Prisma sanitizes this
  }
});
```

❌ **Bad - Raw SQL with User Input**:
```typescript
await prisma.$queryRaw`
  SELECT * FROM users WHERE email = ${userInput.email}
`; // Vulnerable to SQL injection!
```

### 6.5 XSS Prevention

**Frontend**: Sanitize user-generated content before rendering

```typescript
import DOMPurify from 'dompurify';

function DisplayUserContent({ content }: { content: string }) {
  const sanitized = DOMPurify.sanitize(content);
  return <div dangerouslySetInnerHTML={{ __html: sanitized }} />;
}
```

### 6.6 CSRF Protection

**Use CSRF tokens for state-changing operations**:

```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.use(csrfProtection);

router.post('/orders', csrfProtection, createOrder);
```

### 6.7 Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // 5 login attempts per 15 minutes
  skipSuccessfulRequests: true
});

app.use('/api', apiLimiter);
app.use('/auth/login', authLimiter);
```

### 6.8 Environment Variables Security

**Never commit secrets**:

```bash
# ✅ Good - .env (gitignored)
JWT_SECRET=your-super-secret-key-change-in-production
DATABASE_URL=postgresql://user:password@localhost:5432/db

# ✅ Good - .env.example (committed)
JWT_SECRET=your-jwt-secret
DATABASE_URL=postgresql://user:password@localhost:5432/fieldforce_crm
```

**Validate env vars on startup**:
```typescript
// api/src/utils/validateEnv.ts
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV'
];

export const validateEnv = () => {
  for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
      throw new Error(`Missing required environment variable: ${envVar}`);
    }
  }
};

// In server.ts
validateEnv();
```

### 6.9 Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet()); // Adds security headers
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // For Tailwind
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:']
  }
}));
```

---

## 7. API Design Standards

### 7.1 RESTful Conventions

**HTTP Methods**:
- `GET` - Retrieve resource(s)
- `POST` - Create resource
- `PUT` - Update entire resource
- `PATCH` - Update partial resource
- `DELETE` - Delete resource

**URL Structure**:
```
GET    /contacts          - List all contacts
GET    /contacts/:id      - Get single contact
POST   /contacts          - Create contact
PUT    /contacts/:id      - Update contact
DELETE /contacts/:id      - Delete contact

GET    /contacts/:id/visits - Nested resource
```

### 7.2 Response Format

**Success Response**:
```json
{
  "data": { ... },
  "message": "Optional success message"
}

// Or just the data for simple responses
{
  "contacts": [ ... ]
}
```

**Error Response**:
```json
{
  "error": "User-friendly error message",
  "code": "VALIDATION_ERROR",
  "details": [
    {
      "field": "email",
      "message": "Invalid email format"
    }
  ]
}
```

### 7.3 Status Codes

**Common Status Codes**:
- `200 OK` - Successful GET, PUT, PATCH
- `201 Created` - Successful POST
- `204 No Content` - Successful DELETE
- `400 Bad Request` - Invalid request data
- `401 Unauthorized` - Missing/invalid authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `409 Conflict` - Duplicate resource
- `422 Unprocessable Entity` - Validation error
- `429 Too Many Requests` - Rate limit exceeded
- `500 Internal Server Error` - Server error

### 7.4 Pagination

**Standard pagination response**:
```json
{
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "totalPages": 5,
    "totalCount": 100,
    "hasNext": true,
    "hasPrev": false
  }
}
```

**Implementation**:
```typescript
export const getContacts = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const pageSize = parseInt(req.query.pageSize as string) || 20;
  const skip = (page - 1) * pageSize;

  const [contacts, totalCount] = await Promise.all([
    prisma.contact.findMany({
      skip,
      take: pageSize,
      orderBy: { createdAt: 'desc' }
    }),
    prisma.contact.count()
  ]);

  res.json({
    contacts,
    pagination: {
      page,
      pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
      totalCount,
      hasNext: page * pageSize < totalCount,
      hasPrev: page > 1
    }
  });
};
```

### 7.5 Filtering and Sorting

**Query parameters**:
```
GET /contacts?type=doctor&assignedTo=user-123&sortBy=createdAt&order=desc
```

**Implementation**:
```typescript
const { type, assignedTo, sortBy = 'createdAt', order = 'desc' } = req.query;

const where: any = {};
if (type) where.type = type;
if (assignedTo) where.assignedTo = assignedTo;

const contacts = await prisma.contact.findMany({
  where,
  orderBy: { [sortBy]: order }
});
```

---

## 8. UI/UX Guidelines

### 8.1 Color Palette

**PRIMARY COLORS** (From Global Guidelines):
- **Teal**: Primary brand color (buttons, links, highlights)
  - `teal-50`: #f0fdfa
  - `teal-100`: #ccfbf1
  - `teal-500`: #14b8a6
  - `teal-600`: #0d9488 (Primary)
  - `teal-700`: #0f766e

- **Amber**: Secondary/accent color
  - `amber-50`: #fffbeb
  - `amber-100`: #fef3c7
  - `amber-500`: #f59e0b
  - `amber-600`: #d97706 (Secondary)

**NEUTRAL COLORS**:
- `gray-50` to `gray-900` for backgrounds, text, borders

### 8.2 No Emojis - Use SVG Logos

**CRITICAL RULE**: Never use emojis (🚀, ✅, ❌). Always use professional SVG icons/logos.

✅ **Good - SVG Icons**:
```tsx
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/solid';

<CheckCircleIcon className="w-5 h-5 text-green-600" />
<XCircleIcon className="w-5 h-5 text-red-600" />
```

❌ **Bad - Emojis**:
```tsx
<span>✅ Success</span> {/* NEVER DO THIS */}
<span>❌ Error</span>   {/* NEVER DO THIS */}
```

**Recommended Icon Libraries**:
- **Heroicons** (free, Tailwind-friendly)
- **Lucide React** (open source)
- Custom SVG icons in `/web/src/assets/icons/`

### 8.3 Typography

```css
/* Tailwind classes */
.text-xs     /* 12px */
.text-sm     /* 14px */
.text-base   /* 16px - body text */
.text-lg     /* 18px */
.text-xl     /* 20px */
.text-2xl    /* 24px - section headers */
.text-3xl    /* 30px - page titles */
.text-4xl    /* 36px - hero text */

/* Font weights */
.font-normal  /* 400 */
.font-medium  /* 500 - UI elements */
.font-semibold /* 600 - headings */
.font-bold    /* 700 - emphasis */
```

### 8.4 Spacing & Layout

**Consistent spacing using Tailwind's scale**:
```tsx
<div className="p-4">      {/* padding: 1rem (16px) */}
<div className="p-6">      {/* padding: 1.5rem (24px) */}
<div className="p-8">      {/* padding: 2rem (32px) */}

<div className="mb-4">     {/* margin-bottom: 1rem */}
<div className="gap-4">    {/* grid/flex gap: 1rem */}
```

### 8.5 Responsive Design

**Mobile-first approach**:
```tsx
<div className="
  w-full           {/* Mobile: full width */}
  md:w-1/2         {/* Tablet: 50% width */}
  lg:w-1/3         {/* Desktop: 33% width */}
  p-4              {/* Mobile: 1rem padding */}
  md:p-6           {/* Tablet+: 1.5rem padding */}
">
  Content
</div>
```

**Breakpoints**:
- `sm`: 640px (phone landscape)
- `md`: 768px (tablet)
- `lg`: 1024px (desktop)
- `xl`: 1280px (large desktop)
- `2xl`: 1536px (extra large)

### 8.6 Component Styling Patterns

**Button Variants**:
```tsx
// Primary button (Teal)
<button className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 disabled:opacity-50">
  Primary Action
</button>

// Secondary button (Amber)
<button className="bg-amber-600 text-white px-4 py-2 rounded-lg hover:bg-amber-700">
  Secondary Action
</button>

// Outline button
<button className="border-2 border-teal-600 text-teal-600 px-4 py-2 rounded-lg hover:bg-teal-50">
  Outline
</button>

// Danger button
<button className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700">
  Delete
</button>
```

**Status Badges**:
```tsx
// Success
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
  Approved
</span>

// Warning
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
  Pending
</span>

// Error
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
  Rejected
</span>
```

### 8.7 Accessibility (A11y)

**ARIA Labels**:
```tsx
<button aria-label="Close dialog">
  <XMarkIcon className="w-5 h-5" />
</button>

<input
  type="text"
  aria-describedby="email-help"
  aria-invalid={errors.email ? 'true' : 'false'}
/>
```

**Keyboard Navigation**:
```tsx
const handleKeyDown = (e: React.KeyboardEvent) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleClick();
  }
};

<div
  role="button"
  tabIndex={0}
  onKeyDown={handleKeyDown}
  onClick={handleClick}
>
  Clickable div
</div>
```

**Focus States**:
```tsx
<input className="
  border border-gray-300
  focus:outline-none
  focus:ring-2
  focus:ring-teal-500
  focus:border-teal-500
" />
```

---

## 9. Error Handling

### 9.1 Custom Error Classes

```typescript
// api/src/utils/errors.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public code?: string
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}
```

### 9.2 Global Error Handler

```typescript
// api/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  console.error('Error:', err);

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code
    });
  }

  // Prisma errors
  if (err.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      error: 'Database operation failed',
      code: 'DATABASE_ERROR'
    });
  }

  // Default error
  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
};

// In server.ts
app.use(errorHandler);
```

### 9.3 Frontend Error Boundaries

```typescript
// web/src/components/ErrorBoundary.tsx
import { Component, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Error boundary caught:', error, errorInfo);
    // Send to Sentry in production
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">
              Something went wrong
            </h1>
            <button
              onClick={() => window.location.reload()}
              className="bg-teal-600 text-white px-4 py-2 rounded-lg"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
```

---

## 10. Testing Requirements

### 10.1 Test Coverage Targets

- **Backend**: 70%+ code coverage
- **Frontend**: 60%+ code coverage
- **Critical paths**: 100% coverage (auth, payments, orders)

### 10.2 Backend Testing (Jest)

```typescript
// api/tests/unit/services/userService.test.ts
import { userService } from '../../../src/services/userService';
import { prismaMock } from '../../mocks/prisma';

describe('UserService', () => {
  describe('findById', () => {
    it('should return user when found', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'sales_rep'
      };

      prismaMock.user.findUnique.mockResolvedValue(mockUser);

      const result = await userService.findById('user-123');

      expect(result).toEqual(mockUser);
      expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
        where: { id: 'user-123' }
      });
    });

    it('should return null when user not found', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);

      const result = await userService.findById('nonexistent');

      expect(result).toBeNull();
    });
  });
});
```

### 10.3 Frontend Testing (Vitest + React Testing Library)

```typescript
// web/tests/components/Login.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Login from '../../src/pages/Login';
import { AuthProvider } from '../../src/contexts/AuthContext';

describe('Login Component', () => {
  it('should render login form', () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
  });

  it('should show error on invalid credentials', async () => {
    render(
      <BrowserRouter>
        <AuthProvider>
          <Login />
        </AuthProvider>
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: 'invalid@example.com' }
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'wrongpassword' }
    });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid email or password/i)).toBeInTheDocument();
    });
  });
});
```

---

## 11. Performance Standards

### 11.1 Performance Targets

- **API Response Time**: <200ms (p95)
- **Page Load Time**: <3s (Time to Interactive)
- **First Contentful Paint**: <1.5s
- **Lighthouse Score**: >90
- **Bundle Size**: <500KB (gzipped)

### 11.2 Database Performance

**Use Indexes**:
```prisma
model Visit {
  id        String   @id @default(uuid())
  userId    String
  contactId String
  createdAt DateTime @default(now())

  @@index([userId, createdAt]) // Composite index for common query
  @@index([contactId])
}
```

**Limit Result Sets**:
```typescript
// Always paginate large datasets
const visits = await prisma.visit.findMany({
  take: 20, // Limit to 20 results
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
});
```

### 11.3 Frontend Performance

**Code Splitting**:
```typescript
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Analytics = lazy(() => import('./pages/Analytics'));
```

**Image Optimization**:
```tsx
<img
  src={imageUrl}
  alt="Description"
  loading="lazy" // Lazy load images
  width={400}
  height={300}
/>
```

**Debounce Search Inputs**:
```typescript
const [searchTerm, setSearchTerm] = useState('');

const debouncedSearch = useMemo(
  () =>
    debounce((value: string) => {
      fetchResults(value);
    }, 500),
  []
);

const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchTerm(e.target.value);
  debouncedSearch(e.target.value);
};
```

---

## 12. Git Workflow

### 12.1 Branch Naming

```
main                     - Production-ready code
develop                  - Integration branch (Week 2+)
feature/auth-system      - New features
bugfix/login-error       - Bug fixes
hotfix/security-patch    - Urgent fixes for production
```

### 12.2 Commit Message Format

```
type(scope): short description

Longer description if needed

type: feat, fix, docs, style, refactor, test, chore
scope: auth, contacts, visits, orders, payments, etc.

Examples:
feat(auth): add JWT token refresh
fix(contacts): resolve GPS capture on iOS
docs(readme): update setup instructions
refactor(orders): extract validation to service layer
test(visits): add unit tests for check-in logic
```

### 12.3 Pull Request Requirements

**PR Template**:
```markdown
## Description
What does this PR do?

## Type of Change
- [ ] New feature
- [ ] Bug fix
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex logic
- [ ] Documentation updated
- [ ] No console.log() left in code
- [ ] TypeScript types are correct
```

---

## 13. Documentation Rules

### 13.1 Code Comments

**When to comment**:
- Complex business logic
- Non-obvious solutions
- Edge cases
- TODOs

**When NOT to comment**:
- Obvious code (let the code speak)
- Instead of refactoring (clean code > comments)

✅ **Good Comments**:
```typescript
// Calculate distance using Haversine formula
// Required for GPS verification within 100m radius
function calculateDistance(lat1, lon1, lat2, lon2) { ... }

// TODO(raunak): Add support for bulk contact import by Day 10
// See: https://github.com/org/repo/issues/123
```

❌ **Bad Comments**:
```typescript
// Get user - OBVIOUS, DON'T COMMENT
const user = await getUser();

// This is a loop - USELESS COMMENT
for (let i = 0; i < 10; i++) { ... }
```

### 13.2 JSDoc for Functions

```typescript
/**
 * Creates a new contact and assigns to user
 *
 * @param data - Contact data including name, type, and coordinates
 * @param assignedTo - User ID to assign contact to
 * @returns Created contact with ID
 * @throws ValidationError if name or type is missing
 */
async function createContact(
  data: CreateContactData,
  assignedTo: string
): Promise<Contact> {
  // Implementation
}
```

---

## 14. Code Review Checklist

### 14.1 Reviewer Checklist

- [ ] Code follows TypeScript strict mode
- [ ] No `any` types (unless justified)
- [ ] File size within limits (controllers 200-500 lines, etc.)
- [ ] Single Responsibility Principle followed
- [ ] All functions have proper error handling
- [ ] Input validation present
- [ ] No SQL injection vulnerabilities
- [ ] No XSS vulnerabilities
- [ ] Tests added/updated
- [ ] No console.log() in production code
- [ ] Performance considered (N+1 queries, etc.)
- [ ] Accessibility considered (ARIA labels, keyboard nav)
- [ ] No emojis used (SVG icons instead)
- [ ] Teal/Amber color scheme followed
- [ ] Database migrations never reset

### 14.2 Security Review Triggers

**Require security review if PR includes**:
- Authentication/authorization changes
- Database schema changes
- Payment processing
- File uploads
- User input handling
- API endpoint changes
- Environment variable changes

---

## 15. Logging & Monitoring

### 15.1 Structured Logging

```typescript
// api/src/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

// Usage
logger.info('User logged in', { userId: user.id, email: user.email });
logger.error('Payment failed', { orderId, error: error.message });
```

### 15.2 What NOT to Log

**NEVER log**:
- Passwords
- JWT tokens
- Credit card numbers
- API keys
- Personal Identifiable Information (PII) in production

---

## 16. Caching Strategy

### 16.1 Redis Caching

```typescript
// api/src/utils/cache.ts
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cache = {
  async get<T>(key: string): Promise<T | null> {
    const value = await redis.get(key);
    return value ? JSON.parse(value) : null;
  },

  async set(key: string, value: any, ttl: number = 3600): Promise<void> {
    await redis.setex(key, ttl, JSON.stringify(value));
  },

  async del(key: string): Promise<void> {
    await redis.del(key);
  }
};

// Usage - Cache product catalog
const getCachedProducts = async () => {
  const cached = await cache.get('products:all');
  if (cached) return cached;

  const products = await prisma.product.findMany();
  await cache.set('products:all', products, 3600); // 1 hour TTL
  return products;
};
```

---

## Quick Reference Checklist

Use this before every commit:

- [ ] TypeScript strict mode enabled
- [ ] No `any` types
- [ ] File size within limits
- [ ] All errors handled (try-catch)
- [ ] Input validated and sanitized
- [ ] Tests added/updated (70% backend, 60% frontend)
- [ ] No console.log() left
- [ ] No emojis (use SVG icons)
- [ ] Teal/Amber colors used
- [ ] Database never reset
- [ ] Performance considered
- [ ] Accessibility considered
- [ ] Documentation updated
- [ ] Git commit message formatted correctly

---

**End of Development Guidelines v1.0**

*For operational guidelines (deployment, monitoring, etc.), see OPERATIONAL_GUIDELINES.md*
*For feature-specific guidelines (PWA, i18n, etc.), see FEATURE_GUIDELINES.md*
