# Day 1: Project Setup & Authentication (Cloudflare Stack)

**Goal**: Complete project scaffolding with Cloudflare Workers + Hono + Neon PostgreSQL, portable architecture setup, and working authentication (signup/login)

**Duration**: 8 hours (9:00 AM - 5:30 PM)

**Updated**: 2025-10-05 (Cloudflare + Portable Architecture)

---

## 9:00 AM - 9:30 AM: Repository & Accounts Setup

### Tasks:
- [ ] Create GitHub repository
- [ ] Create Cloudflare account
- [ ] Create Neon account
- [ ] Initialize local project
- [ ] Setup folder structure

### Commands:
```bash
# Create project directory
cd ~/Desktop
mkdir medical-CRM
cd medical-CRM

# Initialize git
git init
git branch -M main

# Create folder structure
mkdir api web docs

# Create README
touch README.md
```

### README.md Content:
```markdown
# Field Force CRM

A modern SaaS CRM for field sales teams to track visits, orders, and payments with GPS verification.

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Cloudflare Workers + Hono + TypeScript + Prisma ORM
- **Database**: Neon PostgreSQL (serverless)
- **Storage**: Cloudflare R2
- **Email**: AWS SES (Mumbai)
- **Authentication**: JWT with bcrypt

## Architecture

**Portable Architecture** - Can switch between Cloudflare and AWS in 5-7 days

## Project Structure

```
medical-CRM/
├── api/                    # Backend (Cloudflare Workers + Hono)
│   ├── src/
│   │   ├── core/          # Platform-agnostic business logic
│   │   ├── infrastructure/ # Platform-specific implementations
│   │   ├── config/        # Dependency injection
│   │   └── services/      # Business services
│   ├── prisma/            # Database schema
│   └── wrangler.toml      # Cloudflare config
├── web/                   # Frontend (React + Vite)
└── docs/                  # Documentation
```

## Getting Started

See Day 1-5 implementation docs in `/docs` for detailed setup instructions.

## License

Proprietary - IWISHBAG PTE LTD (Singapore)
```

### Create .gitignore:
```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
.pnp/

# Environment
.env
.env.local
.env*.local
.dev.vars

# Build
dist/
build/
*.tsbuildinfo
.wrangler/

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations/*
!prisma/migrations/.gitkeep
EOF
```

### Create Accounts:

**Cloudflare**:
```bash
# 1. Go to https://dash.cloudflare.com/sign-up
# 2. Sign up with email
# 3. Enable Workers Paid Plan ($5/month)
# 4. Save credentials
```

**Neon**:
```bash
# 1. Go to https://neon.tech
# 2. Sign up with GitHub
# 3. Create project: "fieldforce-crm"
# 4. Region: AWS ap-south-1 (Mumbai)
# 5. Copy connection strings (pooled + direct)
```

### Create GitHub repo and push:
```bash
# Create repo on GitHub (via gh CLI)
gh repo create medical-CRM --private --source=. --remote=origin

# Initial commit
git add .
git commit -m "Initial commit: Project structure with Cloudflare stack

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin main
```

### Success Criteria:
- [ ] Repository created on GitHub
- [ ] Cloudflare account created (Workers Paid enabled)
- [ ] Neon account created (project in Mumbai region)
- [ ] Folder structure in place
- [ ] README.md exists
- [ ] .gitignore configured
- [ ] Initial commit pushed

---

## 9:30 AM - 10:30 AM: Backend Setup (Cloudflare Workers + Hono + Portable Architecture)

### Tasks:
- [ ] Install Wrangler CLI
- [ ] Initialize Worker project
- [ ] Setup portable architecture structure
- [ ] Install dependencies
- [ ] Configure TypeScript

### Commands:
```bash
cd api

# Initialize Node.js
npm init -y

# Install Wrangler CLI globally
npm install -g wrangler

# Login to Cloudflare
wrangler login

# Install production dependencies
npm install hono @hono/node-server
npm install @prisma/client @prisma/adapter-neon
npm install @neondatabase/serverless
npm install bcryptjs jsonwebtoken
npm install @aws-sdk/client-ses

# Install dev dependencies
npm install -D wrangler typescript @types/node
npm install -D @cloudflare/workers-types
npm install -D prisma
npm install -D @types/bcryptjs @types/jsonwebtoken
```

### Configure TypeScript (tsconfig.json):
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ES2022",
    "lib": ["ES2022"],
    "moduleResolution": "node",
    "types": ["@cloudflare/workers-types"],
    "jsx": "react",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Create wrangler.toml:
```toml
name = "fieldforce-crm-api"
main = "src/index.ts"
compatibility_date = "2024-01-01"
node_compat = true

# Environment variables (non-secret)
[vars]
ENVIRONMENT = "development"
JWT_EXPIRES_IN = "7d"

# R2 Bucket binding (Week 3)
# [[r2_buckets]]
# binding = "BUCKET"
# bucket_name = "fieldforce-uploads-dev"
```

### Create portable architecture structure:
```bash
# Create directory structure
mkdir -p src/{core/ports,infrastructure/{storage,queues,cache,email},config,services,routes,middleware,utils,types}

# Create .gitkeep files
touch src/core/ports/.gitkeep
touch src/infrastructure/storage/.gitkeep
touch src/infrastructure/queues/.gitkeep
touch src/infrastructure/cache/.gitkeep
touch src/infrastructure/email/.gitkeep
```

### Update package.json scripts:
```json
{
  "scripts": {
    "dev": "wrangler dev --local",
    "deploy": "wrangler deploy",
    "tail": "wrangler tail",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev",
    "prisma:studio": "prisma studio"
  }
}
```

### Create .env (for local development):
```bash
cat > .env << 'EOF'
# Neon Database (get from Neon dashboard)
DATABASE_URL="postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require"
DIRECT_URL="postgresql://user:password@ep-xxx.ap-south-1.aws.neon.tech/neondb?sslmode=require"

# JWT Secret (generate: openssl rand -base64 32)
JWT_SECRET="your-super-secret-jwt-key-change-in-production"

# AWS SES (Week 5 - leave blank for now)
AWS_SES_KEY=""
AWS_SES_SECRET=""

# Environment
ENVIRONMENT=development
EOF
```

### Create basic Worker entry point (src/index.ts):
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS middleware
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    platform: 'cloudflare-workers',
    environment: c.env?.ENVIRONMENT || 'local',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
```

### Set Cloudflare secrets (for production):
```bash
# Generate JWT secret
openssl rand -base64 32

# Set secrets in Cloudflare
wrangler secret put DATABASE_URL
# Paste Neon pooled connection URL

wrangler secret put JWT_SECRET
# Paste generated secret
```

### Test Worker locally:
```bash
npm run dev

# Expected output:
# ⛅️ wrangler 3.x.x
# ---------------------------
# Your worker is listening on http://localhost:8787

# Test health endpoint (in another terminal):
curl http://localhost:8787/health

# Expected response:
# {
#   "status": "ok",
#   "platform": "cloudflare-workers",
#   "environment": "local",
#   "timestamp": "2025-10-05T..."
# }
```

### Success Criteria:
- [ ] Wrangler CLI installed and logged in
- [ ] npm packages installed
- [ ] TypeScript configured
- [ ] Portable architecture structure created
- [ ] Worker runs locally without errors
- [ ] Health endpoint responds correctly

---

## 10:30 AM - 10:45 AM: Break

---

## 10:45 AM - 11:45 AM: Database Setup (Neon + Prisma)

### Tasks:
- [ ] Initialize Prisma
- [ ] Create database schema
- [ ] Run migrations
- [ ] Generate Prisma Client

### Initialize Prisma:
```bash
cd api

# Initialize Prisma
npx prisma init
```

### Create Prisma Schema (prisma/schema.prisma):
```prisma
generator client {
  provider = "prisma-client-js"
  previewFeatures = ["driverAdapters"]
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  phone     String?
  role      UserRole @default(SALES_REP)
  companyId String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
  @@map("users")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  MANAGER
  SALES_REP
}

model Company {
  id        String   @id @default(uuid())
  name      String
  email     String   @unique
  phone     String
  address   String?
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("companies")
}
```

### Run migration:
```bash
# Create migration
npx prisma migrate dev --name init

# Generate Prisma Client
npx prisma generate

# Open Prisma Studio to verify
npx prisma studio
# Opens at http://localhost:5555
```

### Create database utility (src/utils/db.ts):
```typescript
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

export function getPrisma(databaseUrl: string) {
  const prisma = new PrismaClient({
    datasourceUrl: databaseUrl,
  }).$extends(withAccelerate());

  return prisma;
}
```

### Test database connection:
```typescript
// Add to src/index.ts

import { getPrisma } from './utils/db';

app.get('/db-test', async (c) => {
  try {
    const prisma = getPrisma(c.env.DATABASE_URL);
    const userCount = await prisma.user.count();

    return c.json({
      success: true,
      message: 'Database connected',
      userCount,
    });
  } catch (error) {
    return c.json({
      success: false,
      error: error.message,
    }, 500);
  }
});
```

### Test:
```bash
# Restart worker
npm run dev

# Test database
curl http://localhost:8787/db-test

# Expected:
# {"success":true,"message":"Database connected","userCount":0}
```

### Success Criteria:
- [ ] Prisma initialized
- [ ] Database schema created
- [ ] Migration applied successfully
- [ ] Prisma Client generated
- [ ] Database connection verified
- [ ] Prisma Studio opens successfully

---

## 11:45 AM - 12:30 PM: Authentication Routes (Signup & Login)

### Create JWT utilities (src/utils/jwt.ts):
```typescript
import { sign, verify } from 'hono/jwt';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export async function generateToken(
  payload: JWTPayload,
  secret: string,
  expiresIn: string = '7d'
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60); // 7 days

  return await sign(
    {
      ...payload,
      exp,
    },
    secret
  );
}

export async function verifyToken(
  token: string,
  secret: string
): Promise<JWTPayload> {
  try {
    const payload = await verify(token, secret);
    return payload as JWTPayload;
  } catch (error) {
    throw new Error('Invalid token');
  }
}
```

### Create auth middleware (src/middleware/auth.ts):
```typescript
import { Context, Next } from 'hono';
import { verifyToken } from '../utils/jwt';
import { Bindings } from '../index';

export async function authMiddleware(
  c: Context<{ Bindings: Bindings }>,
  next: Next
) {
  const authHeader = c.req.header('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.substring(7);

  try {
    const payload = await verifyToken(token, c.env.JWT_SECRET);
    c.set('user', payload);
    await next();
  } catch (error) {
    return c.json({ error: 'Invalid token' }, 401);
  }
}
```

### Create auth routes (src/routes/auth.ts):
```typescript
import { Hono } from 'hono';
import { hash, compare } from 'bcryptjs';
import { getPrisma } from '../utils/db';
import { generateToken } from '../utils/jwt';
import { Bindings } from '../index';

const auth = new Hono<{ Bindings: Bindings }>();

// Signup
auth.post('/signup', async (c) => {
  try {
    const { email, password, name, phone } = await c.req.json();

    // Validation
    if (!email || !password || !name) {
      return c.json({ error: 'Email, password, and name are required' }, 400);
    }

    if (password.length < 8) {
      return c.json({ error: 'Password must be at least 8 characters' }, 400);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return c.json({ error: 'User already exists' }, 400);
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        phone,
      },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    // Generate token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET,
      c.env.JWT_EXPIRES_IN
    );

    return c.json(
      {
        success: true,
        message: 'User created successfully',
        data: {
          user,
          token,
        },
      },
      201
    );
  } catch (error) {
    console.error('Signup error:', error);
    return c.json({ error: error.message || 'Signup failed' }, 500);
  }
});

// Login
auth.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    // Validation
    if (!email || !password) {
      return c.json({ error: 'Email and password are required' }, 400);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Verify password
    const isValid = await compare(password, user.password);

    if (!isValid) {
      return c.json({ error: 'Invalid credentials' }, 401);
    }

    // Check if active
    if (!user.isActive) {
      return c.json({ error: 'Account is deactivated' }, 403);
    }

    // Generate token
    const token = await generateToken(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
      },
      c.env.JWT_SECRET,
      c.env.JWT_EXPIRES_IN
    );

    return c.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          phone: user.phone,
          role: user.role,
        },
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ error: error.message || 'Login failed' }, 500);
  }
});

// Get current user
auth.get('/me', async (c) => {
  try {
    const user = c.get('user');

    if (!user) {
      return c.json({ error: 'Unauthorized' }, 401);
    }

    const prisma = getPrisma(c.env.DATABASE_URL);

    const currentUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
    });

    if (!currentUser) {
      return c.json({ error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: currentUser,
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json({ error: error.message || 'Failed to get user' }, 500);
  }
});

export default auth;
```

### Update main index.ts:
```typescript
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import authRoutes from './routes/auth';
import { authMiddleware } from './middleware/auth';

export type Bindings = {
  DATABASE_URL: string;
  JWT_SECRET: string;
  JWT_EXPIRES_IN: string;
  ENVIRONMENT: string;
};

const app = new Hono<{ Bindings: Bindings }>();

// CORS
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'],
  credentials: true,
}));

// Health check
app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    platform: 'cloudflare-workers',
    environment: c.env?.ENVIRONMENT || 'local',
    timestamp: new Date().toISOString(),
  });
});

// Auth routes (public)
app.route('/api/auth', authRoutes);

// Protected route example
app.get('/api/protected', authMiddleware, (c) => {
  const user = c.get('user');
  return c.json({
    message: 'This is a protected route',
    user,
  });
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ error: err.message || 'Internal server error' }, 500);
});

export default app;
```

### Test authentication:
```bash
# Restart worker
npm run dev

# Test signup
curl -X POST http://localhost:8787/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "name": "Admin User",
    "phone": "9876543210"
  }'

# Expected: {"success":true,"message":"User created successfully","data":{...,"token":"..."}}

# Save token from response, then test login
curl -X POST http://localhost:8787/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'

# Test protected route
curl http://localhost:8787/api/protected \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: {"message":"This is a protected route","user":{...}}
```

### Success Criteria:
- [ ] Signup endpoint works
- [ ] Login endpoint works
- [ ] JWT token generated
- [ ] Protected route requires auth
- [ ] Invalid token rejected
- [ ] User data returned without password

---

## 12:30 PM - 1:30 PM: Lunch Break

---

## 1:30 PM - 3:00 PM: Frontend Setup (React + Vite + Tailwind)

### Initialize Vite project:
```bash
cd ../web

# Create Vite project with React + TypeScript
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p

# Install additional dependencies
npm install react-router-dom
npm install localforage  # For offline support later
```

### Configure Tailwind (tailwind.config.js):
```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#eff6ff',   // blue-50 - light background
          100: '#dbeafe',  // blue-100
          200: '#bfdbfe',  // blue-200
          300: '#93c5fd',  // blue-300
          500: '#3b82f6',  // blue-500
          600: '#2563eb',  // blue-600 - primary (Neutral Corporate)
          700: '#1d4ed8',  // blue-700 - darker blue
          800: '#1e40af',  // blue-800 - navy
          900: '#1e3a8a',  // blue-900
        },
        accent: {
          500: '#64748b',  // slate-500 - steel
          600: '#0ea5e9',  // sky-600 - accent cyan
          700: '#0284c7',  // sky-700
        },
        neutral: {
          50: '#f9fafb',   // gray-50
          100: '#f3f4f6',  // gray-100 - surface background
          200: '#e5e7eb',  // gray-200
          800: '#1f2937',  // gray-800
          900: '#111827',  // gray-900 - text primary
        }
      },
    },
  },
  plugins: [],
}
```

### Update src/index.css:
```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-neutral-100 text-neutral-900;
  }
}

@layer components {
  .btn-primary {
    @apply bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .btn-secondary {
    @apply bg-accent-500 hover:bg-accent-600 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed;
  }

  .input-field {
    @apply w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-600 focus:border-transparent;
  }
}
```

### Create .env:
```bash
cat > .env << 'EOF'
VITE_API_URL=http://localhost:8787/api
EOF
```

### Create folder structure:
```bash
mkdir -p src/{pages,components,contexts,hooks,services,types,utils}
```

### Create API service (src/services/api.ts):
```typescript
const API_URL = import.meta.env.VITE_API_URL;

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupData {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  phone: string | null;
  role: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}

class ApiService {
  private getHeaders(includeAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (includeAuth) {
      const token = localStorage.getItem('token');
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async signup(data: SignupData): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/signup`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(data),
    });

    return response.json();
  }

  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthResponse>> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(credentials),
    });

    return response.json();
  }

  async getCurrentUser(): Promise<ApiResponse<User>> {
    const response = await fetch(`${API_URL}/auth/me`, {
      headers: this.getHeaders(true),
    });

    return response.json();
  }
}

export const api = new ApiService();
```

### Create Auth Context (src/contexts/AuthContext.tsx):
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api, User } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name: string, phone?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token on mount
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      loadUser();
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.getCurrentUser();
      if (response.success && response.data) {
        setUser(response.data);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to load user:', error);
      localStorage.removeItem('token');
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await api.login({ email, password });

    if (response.success && response.data) {
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    } else {
      throw new Error(response.error || 'Login failed');
    }
  };

  const signup = async (email: string, password: string, name: string, phone?: string) => {
    const response = await api.signup({ email, password, name, phone });

    if (response.success && response.data) {
      setUser(response.data.user);
      setToken(response.data.token);
      localStorage.setItem('token', response.data.token);
    } else {
      throw new Error(response.error || 'Signup failed');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
```

### Create Login Page (src/pages/Login.tsx):
```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-primary-800">
            Field Force CRM
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Sign in to your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                type="email"
                required
                className="input-field mt-1"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                className="input-field mt-1"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="text-primary-800 hover:text-primary-700 font-medium">
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### Create Signup Page (src/pages/Signup.tsx):
```typescript
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Signup() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await signup(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-xl shadow-lg">
        <div>
          <h2 className="text-3xl font-bold text-center text-primary-800">
            Field Force CRM
          </h2>
          <p className="mt-2 text-center text-gray-600">
            Create your account
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                id="name"
                name="name"
                type="text"
                required
                className="input-field mt-1"
                placeholder="John Doe"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="input-field mt-1"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number (Optional)
              </label>
              <input
                id="phone"
                name="phone"
                type="tel"
                className="input-field mt-1"
                placeholder="9876543210"
                value={formData.phone}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="input-field mt-1"
                placeholder="••••••••"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                required
                className="input-field mt-1"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating account...' : 'Sign up'}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="text-primary-800 hover:text-primary-700 font-medium">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
```

### Create Dashboard Page (src/pages/Dashboard.tsx):
```typescript
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-primary-800 text-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold">Field Force CRM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm">{user?.name}</span>
              <button
                onClick={handleLogout}
                className="bg-primary-700 hover:bg-primary-600 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome, {user?.name}!
            </h2>
            <div className="space-y-2 text-gray-600">
              <p><strong>Email:</strong> {user?.email}</p>
              <p><strong>Phone:</strong> {user?.phone || 'Not provided'}</p>
              <p><strong>Role:</strong> {user?.role}</p>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Contacts</h3>
              <p className="text-3xl font-bold text-primary-800">0</p>
              <p className="text-sm text-gray-500 mt-1">Coming in Day 2</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visits</h3>
              <p className="text-3xl font-bold text-primary-800">0</p>
              <p className="text-sm text-gray-500 mt-1">Coming in Day 3</p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Orders</h3>
              <p className="text-3xl font-bold text-primary-800">0</p>
              <p className="text-sm text-gray-500 mt-1">Coming in Day 4</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
```

### Update App.tsx:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';

function PrivateRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  return user ? children : <Navigate to="/login" />;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Test frontend:
```bash
# Start frontend dev server
npm run dev

# Opens at http://localhost:5173

# Test signup flow:
# 1. Go to http://localhost:5173/signup
# 2. Fill form and submit
# 3. Should redirect to dashboard
# 4. Logout
# 5. Login with same credentials
```

### Success Criteria:
- [ ] Vite project initialized
- [ ] Tailwind CSS configured
- [ ] Auth context working
- [ ] Login page works
- [ ] Signup page works
- [ ] Dashboard shows user info
- [ ] Logout works
- [ ] Protected routes work

---

## 3:00 PM - 3:15 PM: Break

---

## 3:15 PM - 4:30 PM: Integration Testing & Bug Fixes

### Test Complete Auth Flow:

```bash
# 1. Start backend
cd api
npm run dev
# Runs at http://localhost:8787

# 2. Start frontend (in another terminal)
cd web
npm run dev
# Runs at http://localhost:5173

# 3. Test signup:
# - Go to http://localhost:5173/signup
# - Create account
# - Should auto-login and show dashboard

# 4. Test logout:
# - Click logout button
# - Should redirect to login

# 5. Test login:
# - Login with created account
# - Should show dashboard

# 6. Test protected route:
# - Open browser console
# - Clear localStorage
# - Try accessing /dashboard directly
# - Should redirect to /login

# 7. Test invalid credentials:
# - Try logging in with wrong password
# - Should show error message

# 8. Test token persistence:
# - Login successfully
# - Refresh page
# - Should stay logged in
```

### Common Issues & Fixes:

**Issue 1: CORS errors**
```typescript
// In api/src/index.ts
app.use('/*', cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // ← Add both
  credentials: true,
}));
```

**Issue 2: Database connection fails**
```bash
# Check Neon connection string
# Should include ?sslmode=require

# Verify in .env:
DATABASE_URL="postgresql://...?sslmode=require"
```

**Issue 3: JWT verification fails**
```bash
# Make sure JWT_SECRET matches in both .env and Cloudflare secrets

# Local: check .env
# Production: check wrangler secret list
```

**Issue 4: Module not found errors**
```bash
# Re-install dependencies
cd api
rm -rf node_modules package-lock.json
npm install

cd ../web
rm -rf node_modules package-lock.json
npm install
```

### Success Criteria:
- [ ] Signup flow works end-to-end
- [ ] Login flow works end-to-end
- [ ] Logout works
- [ ] Protected routes work
- [ ] Token persists across refreshes
- [ ] Error messages display correctly
- [ ] No console errors

---

## 4:30 PM - 5:00 PM: Deployment Prep & Documentation

### Deploy to Cloudflare (Optional - can do later):

```bash
cd api

# Deploy to Cloudflare Workers
wrangler deploy

# Expected output:
# Total Upload: xx.xx KiB / gzip: xx.xx KiB
# Uploaded field force-crm-api (x.xx sec)
# Published fieldforce-crm-api (x.xx sec)
#   https://fieldforce-crm-api.your-subdomain.workers.dev

# Test deployed worker
curl https://fieldforce-crm-api.your-subdomain.workers.dev/health
```

### Create Day 1 Summary:

```bash
cat > ../docs/DAY_01_SUMMARY.md << 'EOF'
# Day 1 Summary - Project Setup & Authentication

## ✅ Completed

### Backend
- [x] Cloudflare Workers setup with Hono
- [x] Neon PostgreSQL database
- [x] Prisma ORM with migrations
- [x] Portable architecture structure
- [x] JWT authentication
- [x] Signup/Login endpoints
- [x] Password hashing with bcrypt
- [x] Auth middleware

### Frontend
- [x] React 18 + Vite + TypeScript
- [x] Tailwind CSS styling
- [x] React Router v6
- [x] Auth Context
- [x] Login page
- [x] Signup page
- [x] Dashboard page
- [x] Protected routes

### API Endpoints
- `GET /health` - Health check
- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user (protected)

## 📊 Stats

- Backend: ~500 lines of code
- Frontend: ~600 lines of code
- Database: 2 tables (users, companies)
- Time spent: 8 hours

## 🚀 Next Steps (Day 2)

- Contacts CRUD with GPS
- Contact types (Doctor, Retailer, Wholesaler)
- Contact list with filtering
- Contact details page

## 🐛 Known Issues

- None

## 📝 Notes

- Using Cloudflare Workers for zero cold starts
- Neon PostgreSQL in Mumbai region for low latency
- Portable architecture allows switching to AWS if needed
EOF
```

### Git commit:
```bash
cd ..

git add .
git commit -m "Day 1 complete: Authentication with Cloudflare Workers

- Setup Cloudflare Workers with Hono framework
- Neon PostgreSQL with Prisma ORM
- Portable architecture with interfaces
- JWT authentication (signup/login)
- React frontend with Tailwind CSS
- Auth context and protected routes

✅ All Day 1 objectives achieved

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push
```

### Success Criteria:
- [ ] Code committed to GitHub
- [ ] Day 1 summary documented
- [ ] All tests passing
- [ ] Ready for Day 2

---

## 5:00 PM - 5:30 PM: Review & Wrap-up

### Final Checklist:

**Backend:**
- [ ] Cloudflare Worker runs locally
- [ ] Database schema created
- [ ] Migrations applied
- [ ] Signup endpoint works
- [ ] Login endpoint works
- [ ] JWT tokens generated
- [ ] Auth middleware works

**Frontend:**
- [ ] Vite dev server runs
- [ ] Tailwind CSS styling works
- [ ] Signup page functional
- [ ] Login page functional
- [ ] Dashboard shows user info
- [ ] Protected routes work
- [ ] Logout works

**Integration:**
- [ ] Backend & frontend communicate
- [ ] CORS configured correctly
- [ ] Tokens persist in localStorage
- [ ] Error handling works

**Documentation:**
- [ ] Code committed to Git
- [ ] Day 1 summary created
- [ ] README updated

**Optional (if time permits):**
- [ ] Deploy to Cloudflare Workers production
- [ ] Setup custom domain
- [ ] Deploy frontend to Cloudflare Pages

---

## 📚 Advanced: Portable Entry Point Pattern (Optional Reading)

**Note**: The `export default app` pattern we used today works great for Cloudflare Workers. However, for **maximum portability** across platforms (Workers, Lambda, Cloud Functions, Node.js), consider the following pattern for future refactoring:

### Current Pattern (Day 1 - Works on Cloudflare Workers):
```typescript
// src/index.ts
const app = new Hono();
// ... setup
export default app;
```

**Pros**: Simple, works perfectly for Cloudflare Workers
**Cons**: Cloudflare-specific export

### Portable Pattern (For Multi-Platform Support):

```typescript
// src/app.ts - Platform agnostic
import { Hono } from 'hono';

export function createApp(dependencies?) {
  const app = new Hono();
  // ... setup app with routes, middleware
  return app;
}

// src/index.cloudflare.ts - Cloudflare Workers specific
import { createApp } from './app';

export default createApp();  // or with DI: createApp(createCloudfareDependencies(env))
```

```typescript
// src/index.lambda.ts - AWS Lambda specific
import { handle } from 'hono/aws-lambda';
import { createApp } from './app';

export const handler = handle(createApp());
```

```typescript
// src/index.node.ts - Traditional Node.js
import { serve } from '@hono/node-server';
import { createApp } from './app';

serve({ fetch: createApp().fetch, port: 3000 });
```

**Benefits**:
- Same `app.ts` works on ALL platforms
- Only entry point file changes (~20-50 lines)
- Migration time: 4-6 hours to switch platforms
- Clean separation of concerns

**When to Refactor**:
- ✅ After Week 1 MVP (if needed)
- ✅ When considering platform migration
- ✅ When team is comfortable with architecture

**Learn More**:
- [COMPUTE_PORTABILITY_GUIDE.md](../01-architecture/COMPUTE_PORTABILITY_GUIDE.md) - Complete guide to frontend & backend compute portability
- [PORTABLE_ARCHITECTURE_GUIDE.md](../01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md) - Infrastructure portability patterns

**For Day 1**: Stick with the simple pattern. We can refactor later if needed.

---

## 🎉 Day 1 Complete!

You now have:
- ✅ Cloudflare Workers backend running
- ✅ Neon PostgreSQL database
- ✅ Portable architecture foundation
- ✅ Working authentication system
- ✅ React frontend with routing
- ✅ Foundation for Day 2-5

**Tomorrow (Day 2)**: Contacts module with GPS coordinates

---

**Total Time**: 8 hours
**Lines of Code**: ~1,100
**Commits**: 1-2
**Deployment**: Optional (can deploy later)
