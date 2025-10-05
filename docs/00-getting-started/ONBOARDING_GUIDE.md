# Onboarding Guide - Field Force CRM

**Welcome to the team!** 🎉

This guide will help you get up to speed with our Field Force CRM codebase, architecture, and development practices.

---

## Table of Contents

1. [Quick Start](#1-quick-start)
2. [Project Overview](#2-project-overview)
3. [Architecture](#3-architecture)
4. [Development Workflow](#4-development-workflow)
5. [Common Commands](#5-common-commands)
6. [Code Navigation](#6-code-navigation)
7. [Troubleshooting](#7-troubleshooting)
8. [Getting Help](#8-getting-help)

---

## 1. Quick Start

### 1.1 First Day Setup (30 minutes)

**Prerequisites**:
- Node.js 20+ installed
- PostgreSQL 15+ installed
- Git configured
- VS Code (recommended) or your preferred editor

**Setup Steps**:

```bash
# 1. Clone the repository
git clone https://github.com/yourorg/medical-CRM.git
cd medical-CRM

# 2. Install dependencies
cd api && npm install
cd ../web && npm install
cd ..

# 3. Setup environment variables
cp api/.env.example api/.env
cp web/.env.example web/.env

# 4. Configure your .env files (ask team for credentials)
# Edit api/.env with your local database URL

# 5. Create database
createdb fieldforce_crm

# 6. Run database migrations
cd api
npx prisma migrate dev
npx prisma generate

# 7. Seed database (optional)
npx tsx prisma/seed.ts

# 8. Start backend
npm run dev
# Should see: 🚀 Server running on http://localhost:5000

# 9. In another terminal, start frontend
cd web
npm run dev
# Should see: Local: http://localhost:3000

# 10. Open http://localhost:3000 in browser
# You should see the login page
```

**Success Criteria**:
- [ ] Backend running on http://localhost:5000
- [ ] Frontend running on http://localhost:3000
- [ ] Can create an account and login
- [ ] Can see the contacts page

---

## 2. Project Overview

### 2.1 What We're Building

**Field Force CRM** is a SaaS platform for managing sales teams in the field.

**Core Features**:
- **GPS-Verified Visit Tracking**: Sales reps check in/out with GPS proof
- **Order Management**: Create orders with approval workflows
- **Payment Tracking**: Record payments with automated reminders
- **Offline-First**: Works without internet, syncs when online
- **Multi-Language**: English, Hindi, Nepali support
- **Multi-Tenant**: Each company gets isolated data

**Target Market**: Indian & Nepal SMBs in Pharma, FMCG, Distribution

**Tech Stack**:
- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS
- **Backend**: Node.js 20 + Express + TypeScript
- **Database**: PostgreSQL 15 + Prisma ORM
- **Hosting**: Vercel (frontend) + Railway (backend)
- **Storage**: AWS S3 / Cloudflare R2

### 2.2 Product Roadmap

**Week 1 (MVP - DONE)**:
- Authentication
- Contacts CRUD
- Visit tracking
- Order management
- Payment tracking

**Week 2-4 (In Progress)**:
- Dashboard & analytics
- Mobile PWA
- Reports & export

**Week 5-12 (Planned)**:
- Multi-language (Hindi, Nepali)
- WhatsApp integration
- AI insights & gamification
- Launch!

---

## 3. Architecture

### 3.1 High-Level Architecture

```
┌─────────────┐     HTTPS      ┌──────────────┐
│   React     │ ◄────────────► │   Express    │
│   Frontend  │                │   Backend    │
│  (Vercel)   │                │  (Railway)   │
└─────────────┘                └──────────────┘
                                      │
                                      ▼
                                ┌──────────────┐
                                │  PostgreSQL  │
                                │  (Railway)   │
                                └──────────────┘
```

### 3.2 Folder Structure

```
medical-CRM/
├── api/                    # Backend (Node.js + Express)
│   ├── src/
│   │   ├── controllers/   # Route handlers (thin)
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API routes
│   │   ├── middleware/    # Express middleware
│   │   ├── utils/         # Helper functions
│   │   └── server.ts      # Entry point
│   ├── prisma/
│   │   ├── schema.prisma  # Database schema
│   │   └── migrations/    # DB migrations
│   └── tests/             # Tests
│
├── web/                    # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── contexts/      # React contexts
│   │   ├── hooks/         # Custom hooks
│   │   └── utils/         # Helper functions
│   └── public/            # Static files
│
└── docs/                   # Documentation
    ├── 00_MASTER_IMPLEMENTATION_PLAN.md
    ├── DEVELOPMENT_GUIDELINES.md (read this!)
    ├── OPERATIONAL_GUIDELINES.md
    ├── FEATURE_GUIDELINES.md
    └── ONBOARDING_GUIDE.md (this file)
```

### 3.3 Data Flow

**Example: Creating a Contact**

1. **Frontend**: User fills form, clicks "Create Contact"
   ```tsx
   // web/src/pages/ContactForm.tsx
   const handleSubmit = async () => {
     await fetch('/api/contacts', {
       method: 'POST',
       headers: { 'Authorization': `Bearer ${token}` },
       body: JSON.stringify(formData)
     });
   };
   ```

2. **Backend Route**: Receives request, calls controller
   ```typescript
   // api/src/routes/contacts.ts
   router.post('/', authenticateToken, createContact);
   ```

3. **Controller**: Validates, calls service
   ```typescript
   // api/src/controllers/contacts.ts
   export const createContact = async (req, res) => {
     const contact = await contactService.create(req.body);
     res.json({ contact });
   };
   ```

4. **Service**: Contains business logic
   ```typescript
   // api/src/services/contactService.ts
   export const create = async (data) => {
     return prisma.contact.create({ data });
   };
   ```

5. **Database**: Stores contact
   ```sql
   INSERT INTO contacts (id, name, type, ...) VALUES (...);
   ```

---

## 4. Development Workflow

### 4.1 Daily Workflow

**Morning**:
1. Pull latest code: `git pull origin main`
2. Check for updates: `cd api && npm install && cd ../web && npm install`
3. Run migrations: `cd api && npx prisma migrate dev`
4. Start servers:
   ```bash
   # Terminal 1: Backend
   cd api && npm run dev

   # Terminal 2: Frontend
   cd web && npm run dev
   ```

**During Development**:
1. Create feature branch: `git checkout -b feature/your-feature-name`
2. Make changes, commit frequently
3. Write tests for new features
4. Test manually in browser

**End of Day**:
1. Commit changes: `git add . && git commit -m "feat: description"`
2. Push branch: `git push origin feature/your-feature-name`
3. Create Pull Request on GitHub
4. Request review from team

### 4.2 Git Workflow

**Branch Naming**:
```
feature/add-sms-integration
bugfix/fix-login-error
hotfix/security-patch
```

**Commit Messages** (follow conventional commits):
```
feat(auth): add JWT token refresh
fix(contacts): resolve GPS capture on iOS
docs(readme): update setup instructions
refactor(orders): extract validation to service
test(visits): add unit tests for check-in
```

**Pull Request Process**:
1. Create PR with descriptive title and description
2. Ensure all tests pass (CI/CD checks)
3. Request review from at least 1 team member
4. Address review comments
5. Merge after approval (squash commits)

### 4.3 Code Review Guidelines

**As a Reviewer**:
- Check code follows [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md)
- Verify tests are included
- Look for security issues (SQL injection, XSS, etc.)
- Check performance (N+1 queries, large bundle size)
- Be constructive and kind in feedback

**As an Author**:
- Keep PRs small (<400 lines changed)
- Provide context in PR description
- Respond to feedback promptly
- Update code based on suggestions
- Thank your reviewers!

---

## 5. Common Commands

### 5.1 Backend Commands

```bash
# Development
cd api
npm run dev              # Start dev server with hot reload

# Database
npx prisma studio        # Open database GUI
npx prisma migrate dev   # Create & run migration
npx prisma generate      # Generate Prisma client
npx prisma db push       # Push schema changes (dev only)

# Testing
npm test                 # Run all tests
npm test -- --watch      # Run tests in watch mode
npm test -- --coverage   # Run tests with coverage

# Linting & Type Checking
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check without emitting

# Build
npm run build            # Build for production
npm start                # Start production server
```

### 5.2 Frontend Commands

```bash
# Development
cd web
npm run dev              # Start dev server

# Testing
npm test                 # Run all tests
npm test -- --watch      # Run tests in watch mode
npm test -- --coverage   # Run tests with coverage

# Linting & Type Checking
npm run lint             # Run ESLint
npx tsc --noEmit         # Type check

# Build
npm run build            # Build for production
npm run preview          # Preview production build locally
```

### 5.3 Database Management

```bash
# Create database
createdb fieldforce_crm

# Connect to database
psql fieldforce_crm

# Backup database
pg_dump fieldforce_crm > backup.sql

# Restore database
psql fieldforce_crm < backup.sql

# Drop database (CAREFUL!)
dropdb fieldforce_crm

# List databases
psql -l
```

---

## 6. Code Navigation

### 6.1 Finding Things

**"Where is the login logic?"**
- Frontend: `web/src/pages/Login.tsx`
- Auth Context: `web/src/contexts/AuthContext.tsx`
- Backend: `api/src/controllers/auth.ts`

**"Where are contacts managed?"**
- Frontend Pages: `web/src/pages/Contacts.tsx`, `ContactForm.tsx`
- Backend Controller: `api/src/controllers/contacts.ts`
- Backend Service: `api/src/services/contactService.ts`
- Database Schema: `api/prisma/schema.prisma` (Contact model)

**"How do I add a new API endpoint?"**
1. Create controller in `api/src/controllers/`
2. Create route in `api/src/routes/`
3. Register route in `api/src/server.ts`
4. (Optional) Create service in `api/src/services/`

**"How do I add a new page?"**
1. Create component in `web/src/pages/`
2. Add route in `web/src/App.tsx`
3. Add navigation link in `web/src/components/Layout.tsx` (or MobileNav)

### 6.2 Key Files to Know

**Backend**:
- `api/src/server.ts` - Express app setup, middleware, routes
- `api/prisma/schema.prisma` - Database schema (source of truth)
- `api/src/utils/auth.ts` - JWT token generation/verification
- `api/src/middleware/auth.ts` - Authentication middleware

**Frontend**:
- `web/src/App.tsx` - React Router configuration
- `web/src/contexts/AuthContext.tsx` - Global auth state
- `web/src/components/Layout.tsx` - Navigation wrapper
- `web/tailwind.config.js` - Tailwind CSS configuration

**Docs**:
- `docs/DEVELOPMENT_GUIDELINES.md` - **READ THIS FIRST!**
- `docs/00_MASTER_IMPLEMENTATION_PLAN.md` - Overall roadmap
- `docs/DAY_01_SETUP_AND_AUTH.md` through `DAY_05_*.md` - Implementation details

---

## 7. Troubleshooting

### 7.1 Common Issues

**Issue: "Module not found" errors**
```bash
# Solution: Reinstall dependencies
cd api && rm -rf node_modules package-lock.json && npm install
cd ../web && rm -rf node_modules package-lock.json && npm install
```

**Issue: "Port 5000 already in use"**
```bash
# Solution: Kill process on port 5000
lsof -ti:5000 | xargs kill -9

# Or change port in api/.env
PORT=5001
```

**Issue: "Database connection error"**
```bash
# Solution 1: Ensure PostgreSQL is running
brew services start postgresql@15

# Solution 2: Check DATABASE_URL in api/.env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/fieldforce_crm

# Solution 3: Recreate database
dropdb fieldforce_crm && createdb fieldforce_crm
cd api && npx prisma migrate dev
```

**Issue: "Prisma Client not generated"**
```bash
# Solution: Generate Prisma Client
cd api && npx prisma generate
```

**Issue: "TypeScript errors but code works"**
```bash
# Solution: Restart TypeScript server in VS Code
# Cmd+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild TypeScript
npm run build
```

**Issue: "CORS error in browser"**
```bash
# Solution: Ensure backend CORS middleware is configured
# Check api/src/server.ts has:
app.use(cors());
```

### 7.2 Debugging Tips

**Backend Debugging**:
```typescript
// Use console.log (but remove before committing!)
console.log('User data:', user);

// Use debugger statement
debugger; // Pauses execution in Node.js inspector

// Use logger (preferred)
import { logger } from '../utils/logger';
logger.info('User logged in', { userId: user.id });
logger.error('Login failed', { error: error.message });
```

**Frontend Debugging**:
```tsx
// React DevTools (install browser extension)
// Inspect component state and props

// Console logging
console.log('Form data:', formData);

// Debugger statement
debugger; // Pauses execution in browser DevTools

// Network tab
// Check API requests/responses in browser DevTools → Network
```

**Database Debugging**:
```bash
# Open Prisma Studio to view/edit data
cd api && npx prisma studio
# Opens at http://localhost:5555

# Or connect with psql
psql fieldforce_crm

# View all contacts
SELECT * FROM contacts;

# View schema
\d contacts
```

---

## 8. Getting Help

### 8.1 Resources

**Documentation**:
1. **Development Guidelines** (`docs/DEVELOPMENT_GUIDELINES.md`) - Code standards, patterns, best practices
2. **Operational Guidelines** (`docs/OPERATIONAL_GUIDELINES.md`) - Deployment, monitoring, CI/CD
3. **Feature Guidelines** (`docs/FEATURE_GUIDELINES.md`) - PWA, i18n, SMS, etc.
4. **Day Plans** (`docs/DAY_0X_*.md`) - Detailed implementation guides

**External Resources**:
- [React Docs](https://react.dev/)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express Docs](https://expressjs.com/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)

### 8.2 Who to Ask

**Code Questions**:
- Review [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) first
- Search existing GitHub issues
- Ask in team Slack channel (#dev)
- Tag `@raunak` for clarification

**Architecture Questions**:
- Review [00_MASTER_IMPLEMENTATION_PLAN.md](./00_MASTER_IMPLEMENTATION_PLAN.md)
- Review [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md) (if exists)
- Ask `@raunak` or tech lead

**Deployment/DevOps Questions**:
- Review [OPERATIONAL_GUIDELINES.md](./OPERATIONAL_GUIDELINES.md)
- Ask DevOps team (or `@raunak` in early stage)

**Product Questions**:
- Ask Product Manager (or `@raunak` for MVP)
- Check product roadmap in GitHub Projects

---

## 9. First Tasks

### 9.1 Beginner Tasks (Week 1)

**Goal**: Get familiar with codebase

**Tasks**:
1. **Fix a small bug**: Check "good first issue" label on GitHub
2. **Add a small feature**:
   - Add a "Phone" column to Contacts table
   - Add a "Total" row to Orders list
   - Add a "Copy" button to order number
3. **Write tests**: Add tests for existing untested functions
4. **Improve UI**: Fix a UI alignment issue or improve a component

**Learning Path**:
- Day 1-2: Setup, explore codebase, read docs
- Day 3-4: Fix first bug, submit PR
- Day 5: Add small feature, write tests
- Week 2+: Take on larger features

### 9.2 Intermediate Tasks (Week 2-4)

**After you're comfortable with the codebase**:
- Implement a new page (e.g., Analytics dashboard)
- Add a new API endpoint with tests
- Integrate a third-party service (SMS, email)
- Optimize performance (reduce bundle size, query optimization)
- Improve accessibility (add ARIA labels, keyboard navigation)

### 9.3 Advanced Tasks (Month 2+)

**When you're a code ninja**:
- Design and implement a major feature (PWA, i18n, offline mode)
- Refactor a large module for better performance
- Setup CI/CD pipeline improvements
- Mentor new team members
- Lead a feature from design to deployment

---

## 10. Cultural Guidelines

### 10.1 Team Values

**Lean and Clean**:
- Write simple, readable code
- Avoid over-engineering
- Follow Single Responsibility Principle
- Delete code that's no longer needed

**Test-Driven**:
- Write tests for new features (70% backend, 60% frontend coverage)
- Run tests before committing
- Fix failing tests immediately

**Documentation**:
- Update docs when changing APIs
- Add code comments for complex logic
- Keep README up to date

**Security-First**:
- Never commit secrets
- Always validate user input
- Follow security guidelines in [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md)

**Collaboration**:
- Review PRs promptly
- Be kind and constructive in reviews
- Ask questions when unclear
- Share knowledge with the team

### 10.2 Code Style

**Strict Rules** (enforced):
- No emojis in code (use SVG icons)
- Use teal/amber color scheme
- Never reset database in production
- File size limits: Controllers 200-500 lines, Services 300-600 lines
- TypeScript strict mode enabled
- No `any` types (use `unknown` or proper types)

**Preferences** (flexible):
- Single quotes vs double quotes (Prettier handles this)
- Arrow functions vs function declarations (be consistent)
- Lodash vs native methods (prefer native unless complex)

---

## 11. Cheat Sheet

### 11.1 Quick Commands

```bash
# Start everything
cd api && npm run dev &
cd web && npm run dev

# Run tests
cd api && npm test
cd web && npm test

# Database
cd api && npx prisma studio    # GUI
cd api && npx prisma migrate dev  # Migrate

# Type check
npx tsc --noEmit

# Lint
npm run lint

# Format
npm run format (if configured)
```

### 11.2 Useful Snippets

**Create API Endpoint**:
```typescript
// 1. Controller (api/src/controllers/resource.ts)
export const getResources = async (req: Request, res: Response) => {
  try {
    const resources = await prisma.resource.findMany();
    res.json({ resources });
  } catch (error) {
    console.error('Get resources error:', error);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
};

// 2. Route (api/src/routes/resource.ts)
import { Router } from 'express';
import { getResources } from '../controllers/resource';
import { authenticateToken } from '../middleware/auth';

const router = Router();
router.use(authenticateToken);
router.get('/', getResources);
export default router;

// 3. Register (api/src/server.ts)
import resourceRoutes from './routes/resource';
app.use('/resources', resourceRoutes);
```

**Create React Page**:
```tsx
// web/src/pages/ResourceList.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

interface Resource {
  id: string;
  name: string;
}

export default function ResourceList() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const { token } = useAuth();

  useEffect(() => {
    fetchResources();
  }, []);

  const fetchResources = async () => {
    try {
      const response = await fetch('http://localhost:5000/resources', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setResources(data.resources);
    } catch (error) {
      console.error('Failed to fetch resources:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <Layout>
      <div className="max-w-7xl mx-auto p-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-6">Resources</h1>
        <div className="grid gap-4">
          {resources.map(resource => (
            <div key={resource.id} className="bg-white p-4 rounded-lg shadow">
              {resource.name}
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
```

---

## Congratulations! 🎉

You're now ready to contribute to Field Force CRM. Remember:

1. **Read** [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) before writing code
2. **Ask questions** when unsure (better to ask than assume)
3. **Write tests** for your code (future you will thank you)
4. **Keep learning** (we're building something amazing together!)

**Welcome to the team! Let's build an amazing product.** 🚀

---

*For questions or suggestions about this onboarding guide, contact @raunak*
