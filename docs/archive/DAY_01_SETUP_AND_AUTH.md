# Day 1: Project Setup & Authentication

**Goal**: Complete project scaffolding, backend/frontend setup, database initialization, and working authentication (signup/login)

**Duration**: 8 hours (9:00 AM - 5:30 PM)

---

## 9:00 AM - 9:30 AM: Repository Setup

### Tasks:
- [ ] Create GitHub repository
- [ ] Initialize local project
- [ ] Setup folder structure
- [ ] Create README.md

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
- **Backend**: Node.js 20 + Express + TypeScript + Prisma ORM
- **Database**: PostgreSQL 15
- **Authentication**: JWT with bcrypt

## Project Structure

```
medical-CRM/
├── api/          # Backend (Express + Prisma)
├── web/          # Frontend (React + Vite)
└── docs/         # Documentation
```

## Getting Started

See Day 1-5 implementation docs in `/docs` for detailed setup instructions.

## License

Proprietary - Raunak Bohra (Singapore PTE LTD)
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

# Build
dist/
build/
*.tsbuildinfo

# IDE
.vscode/
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Prisma
prisma/migrations/
!prisma/migrations/.gitkeep
EOF
```

### Create GitHub repo and push:
```bash
# Create repo on GitHub (via gh CLI)
gh repo create medical-CRM --private --source=. --remote=origin

# Initial commit
git add .
git commit -m "Initial commit: Project structure

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push -u origin main
```

### Success Criteria:
- [ ] Repository created on GitHub
- [ ] Folder structure in place
- [ ] README.md exists
- [ ] .gitignore configured
- [ ] Initial commit pushed

---

## 9:30 AM - 10:15 AM: Backend Setup (Express + TypeScript + Prisma)

### Tasks:
- [ ] Initialize Node.js project
- [ ] Install dependencies
- [ ] Configure TypeScript
- [ ] Setup Prisma
- [ ] Create basic Express server

### Commands:
```bash
cd api

# Initialize Node.js
npm init -y

# Install production dependencies
npm install express cors dotenv @prisma/client bcryptjs jsonwebtoken

# Install dev dependencies
npm install -D typescript @types/express @types/cors @types/bcryptjs @types/jsonwebtoken @types/node tsx nodemon prisma

# Initialize TypeScript
npx tsc --init
```

### Configure tsconfig.json:
```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules"]
}
```

### Create package.json scripts:
```json
{
  "scripts": {
    "dev": "nodemon --exec tsx src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js"
  }
}
```

### Create src folder structure:
```bash
mkdir -p src/{controllers,routes,middleware,utils}
```

### Create basic server.ts:
```typescript
// api/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Field Force CRM API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### Create .env:
```bash
cat > .env << 'EOF'
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldforce_crm"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
NODE_ENV=development
EOF
```

### Test server:
```bash
npm run dev

# Expected output:
# 🚀 Server running on http://localhost:5000

# Test health endpoint (in another terminal):
curl http://localhost:5000/health
# Expected: {"status":"ok","message":"Field Force CRM API is running"}
```

### Success Criteria:
- [ ] npm packages installed
- [ ] TypeScript configured
- [ ] Express server runs without errors
- [ ] Health endpoint responds correctly

---

## 10:15 AM - 10:30 AM: Break

---

## 10:30 AM - 11:15 AM: Frontend Setup (React + Vite + Tailwind)

### Tasks:
- [ ] Initialize Vite project
- [ ] Install dependencies
- [ ] Configure Tailwind CSS
- [ ] Setup routing
- [ ] Create basic folder structure

### Commands:
```bash
cd ../web

# Create Vite project
npm create vite@latest . -- --template react-ts

# Install dependencies
npm install

# Install additional packages
npm install react-router-dom

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

### Configure tailwind.config.js:
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
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
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

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen',
    'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue',
    sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
```

### Create folder structure:
```bash
mkdir -p src/{pages,components,contexts,utils}
```

### Create basic App.tsx:
```typescript
// web/src/App.tsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-gray-50">
        <h1 className="text-4xl font-bold text-teal-600 text-center py-12">
          Field Force CRM
        </h1>
      </div>
    </BrowserRouter>
  );
}

export default App;
```

### Update vite.config.ts:
```typescript
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      }
    }
  }
})
```

### Test frontend:
```bash
npm run dev

# Expected output:
# VITE v5.x.x  ready in xxx ms
# ➜  Local:   http://localhost:3000/
```

### Success Criteria:
- [ ] Vite dev server runs
- [ ] Tailwind CSS working (teal color visible)
- [ ] React Router configured
- [ ] No console errors

---

## 11:15 AM - 12:00 PM: Database Setup (PostgreSQL + Prisma)

### Tasks:
- [ ] Install PostgreSQL (if not already)
- [ ] Create database
- [ ] Initialize Prisma
- [ ] Create initial schema
- [ ] Run first migration

### Install PostgreSQL (macOS):
```bash
# Using Homebrew
brew install postgresql@15
brew services start postgresql@15

# Create database
createdb fieldforce_crm
```

### Initialize Prisma:
```bash
cd api
npx prisma init
```

### Create Prisma Schema:
```prisma
// api/prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// User model for authentication
model User {
  id           String   @id @default(uuid())
  email        String   @unique
  passwordHash String   @map("password_hash")
  name         String
  phone        String?
  role         String   @default("sales_rep") // super_admin, admin, manager, sales_rep
  managerId    String?  @map("manager_id")
  territory    String?
  isActive     Boolean  @default(true) @map("is_active")
  createdAt    DateTime @default(now()) @map("created_at")
  updatedAt    DateTime @updatedAt @map("updated_at")

  @@map("users")
}

// Company model (for multi-tenancy - V2)
model Company {
  id         String   @id @default(uuid())
  name       String
  email      String   @unique
  schemaName String   @unique @map("schema_name")
  plan       String   @default("free") // free, starter, growth, enterprise
  planStatus String   @default("trial") @map("plan_status") // trial, active, suspended
  createdAt  DateTime @default(now()) @map("created_at")
  updatedAt  DateTime @updatedAt @map("updated_at")

  @@map("companies")
}
```

### Create first migration:
```bash
npx prisma migrate dev --name init

# Expected output:
# ✔ Generated Prisma Client
# ✔ Applied migration: init
```

### Generate Prisma Client:
```bash
npx prisma generate
```

### Test Prisma Studio:
```bash
npx prisma studio

# Opens at http://localhost:5555
# Verify that 'users' and 'companies' tables exist
```

### Success Criteria:
- [ ] PostgreSQL running
- [ ] Database `fieldforce_crm` created
- [ ] Prisma schema defined
- [ ] Migration applied successfully
- [ ] Prisma Client generated
- [ ] Prisma Studio shows tables

---

## 12:00 PM - 1:00 PM: Lunch Break

---

## 1:00 PM - 2:00 PM: Authentication Backend (JWT + bcrypt)

### Tasks:
- [ ] Create auth utilities
- [ ] Create auth controller
- [ ] Create auth routes
- [ ] Test signup and login

### Create auth utilities:
```typescript
// api/src/utils/auth.ts
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
const JWT_EXPIRY = '7d';

export const hashPassword = async (password: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

export const comparePassword = async (
  password: string,
  hashedPassword: string
): Promise<boolean> => {
  return bcrypt.compare(password, hashedPassword);
};

export const generateToken = (payload: any): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRY });
};

export const verifyToken = (token: string): any => {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};
```

### Create auth controller:
```typescript
// api/src/controllers/auth.ts
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { hashPassword, comparePassword, generateToken } from '../utils/auth';

const prisma = new PrismaClient();

// POST /auth/signup - Create new user
export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password, phone, role } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required' });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User with this email already exists' });
    }

    // Hash password
    const passwordHash = await hashPassword(password);

    // Create user
    const user = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        phone,
        role: role || 'sales_rep'
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdAt: true
      }
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    res.status(201).json({ user, token });
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

// POST /auth/login - User login
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }

    // Verify password
    const isValidPassword = await comparePassword(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Return user without password
    const { passwordHash, ...userWithoutPassword } = user;

    res.json({ user: userWithoutPassword, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Failed to login' });
  }
};

// GET /auth/me - Get current user (protected route)
export const getCurrentUser = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        territory: true,
        createdAt: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
};
```

### Create auth middleware:
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
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

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

### Create auth routes:
```typescript
// api/src/routes/auth.ts
import { Router } from 'express';
import { signup, login, getCurrentUser } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/signup', signup);
router.post('/login', login);
router.get('/me', authenticateToken, getCurrentUser);

export default router;
```

### Update server.ts:
```typescript
// api/src/server.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Field Force CRM API is running' });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
```

### Test authentication:
```bash
# Test signup
curl -X POST http://localhost:5000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"password123"}'

# Expected: { "user": {...}, "token": "eyJ..." }

# Test login
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Expected: { "user": {...}, "token": "eyJ..." }

# Test protected route
curl http://localhost:5000/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Expected: { "user": {...} }
```

### Success Criteria:
- [ ] Signup creates user with hashed password
- [ ] Login returns JWT token
- [ ] Token verification works
- [ ] Protected route requires valid token
- [ ] Invalid credentials rejected

---

## 2:00 PM - 3:00 PM: Frontend Authentication Context & Login Page

### Create AuthContext:
```typescript
// web/src/contexts/AuthContext.tsx
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing token in localStorage
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      fetchCurrentUser(storedToken);
    } else {
      setLoading(false);
    }
  }, []);

  const fetchCurrentUser = async (authToken: string) => {
    try {
      const response = await fetch('http://localhost:5000/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch('http://localhost:5000/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const signup = async (name: string, email: string, password: string) => {
    const response = await fetch('http://localhost:5000/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Signup failed');
    }

    const data = await response.json();
    setUser(data.user);
    setToken(data.token);
    localStorage.setItem('token', data.token);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, signup, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
```

### Create Login page:
```typescript
// web/src/pages/Login.tsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.name, formData.email, formData.password);
      }
      navigate('/contacts');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-teal-600 mb-2">Field Force CRM</h1>
          <p className="text-gray-600">Track visits, orders, and payments with ease</p>
        </div>

        <div className="bg-white p-8 rounded-lg shadow-lg">
          <div className="flex mb-6 bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                isLogin
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-2 px-4 rounded-md font-medium transition ${
                !isLogin
                  ? 'bg-teal-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg text-sm">
                {error}
              </div>
            )}

            {!isLogin && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Full Name
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                  required={!isLogin}
                />
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-teal-600 text-white py-2 px-4 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-semibold"
            >
              {loading ? 'Please wait...' : isLogin ? 'Sign In' : 'Create Account'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          &copy; 2025 Field Force CRM - Raunak Bohra (Singapore PTE LTD)
        </p>
      </div>
    </div>
  );
}
```

### Update App.tsx with routing:
```typescript
// web/src/App.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
```

### Update main.tsx:
```typescript
// web/src/main.tsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
```

### Success Criteria:
- [ ] Login page renders
- [ ] Login/Signup toggle works
- [ ] Form validation working
- [ ] Successful login stores token
- [ ] Error messages display correctly
- [ ] Tailwind styling applied

---

## 3:00 PM - 3:30 PM: Testing Authentication Flow

### Manual Test Checklist:
1. [ ] Open http://localhost:3000
2. [ ] Click "Sign Up" tab
3. [ ] Create account with name, email, password
4. [ ] Verify token stored in localStorage (DevTools → Application → Local Storage)
5. [ ] Logout (clear localStorage manually for now)
6. [ ] Click "Login" tab
7. [ ] Login with created credentials
8. [ ] Verify user data returned
9. [ ] Test invalid email/password (should show error)
10. [ ] Test duplicate email signup (should show error)

### Browser DevTools Check:
```javascript
// In browser console
localStorage.getItem('token')
// Should show JWT token after login
```

---

## 3:30 PM - 4:00 PM: Git Commit

### Commands:
```bash
cd ..  # Back to project root
git add .
git commit -m "Day 1: Complete authentication and project setup

Backend:
- Express + TypeScript server with Prisma ORM
- PostgreSQL database with users table
- JWT authentication with bcrypt password hashing
- Auth routes: signup, login, getCurrentUser

Frontend:
- React + Vite + TypeScript + Tailwind CSS
- AuthContext for global auth state
- Login/Signup page with form validation
- Token persistence in localStorage

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

---

## 4:00 PM - 5:00 PM: Documentation & Setup Guide

### Create setup guide:
```bash
touch docs/SETUP_GUIDE.md
```

### SETUP_GUIDE.md content:
```markdown
# Setup Guide

## Prerequisites

- Node.js 20+ (https://nodejs.org/)
- PostgreSQL 15+ (https://www.postgresql.org/)
- Git (https://git-scm.com/)

## Backend Setup

```bash
cd api

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update DATABASE_URL in .env with your PostgreSQL credentials

# Run Prisma migrations
npx prisma migrate dev

# Start development server
npm run dev
```

Server will run at http://localhost:5000

## Frontend Setup

```bash
cd web

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will run at http://localhost:3000

## Database Setup

```bash
# Create PostgreSQL database
createdb fieldforce_crm

# Apply migrations
cd api
npx prisma migrate dev

# (Optional) Open Prisma Studio to view data
npx prisma studio
```

## Testing

1. Open http://localhost:3000
2. Click "Sign Up" to create an account
3. Login with your credentials
4. You should be authenticated and ready to use the app

## Troubleshooting

### Port already in use
```bash
# Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000
lsof -ti:3000 | xargs kill -9
```

### Database connection failed
- Verify PostgreSQL is running: `brew services list`
- Check DATABASE_URL in api/.env
- Ensure database exists: `psql -l | grep fieldforce`

### Prisma Client errors
```bash
cd api
npx prisma generate
npx prisma migrate reset  # WARNING: This deletes all data
```
```

### Create .env.example files:
```bash
# api/.env.example
PORT=5000
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/fieldforce_crm"
JWT_SECRET="change-this-to-a-random-secret-in-production"
NODE_ENV=development
```

---

## 5:00 PM - 5:30 PM: Day 1 Review & Day 2 Planning

### Day 1 Checklist:
- [x] GitHub repository created
- [x] Backend (Express + TypeScript + Prisma)
- [x] Frontend (React + Vite + Tailwind)
- [x] PostgreSQL database setup
- [x] User authentication (JWT + bcrypt)
- [x] Login/Signup page
- [x] Documentation

### Deliverables:
- **Backend**: 8 files (~400 lines)
- **Frontend**: 6 files (~300 lines)
- **Database**: 2 tables (users, companies)
- **API Endpoints**: 3 endpoints
- **Features**: Full auth system ✓

### Day 2 Preview:
Tomorrow we will build:
- Contacts CRUD module (backend + frontend)
- Contact list with search/filter
- Contact form (create/edit)
- GPS location capture
- Contact assignment to sales reps

### Known Issues / Tech Debt:
- Protected routes not implemented (add in Day 2)
- No loading states on login (add in Day 2)
- No email validation regex (add in Day 2)
- No logout button yet (add with dashboard in Day 2)

---

## End of Day 1

**Total Time**: 8 hours (includes 1h lunch + 30min break)
**Status**: Authentication complete ✓
**Next**: Day 2 - Contacts Module
