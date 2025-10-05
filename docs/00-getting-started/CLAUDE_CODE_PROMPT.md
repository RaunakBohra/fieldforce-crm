# Claude Code - Project Context Prompt

**Copy and paste this entire prompt at the start of each new chat session**

---

## 📋 Project Context

I'm building **Field Force CRM**, a SaaS platform for managing sales teams with GPS-verified visit tracking.

**Location**: `/Users/raunakbohra/Desktop/medical-CRM`

**Company**: IWISHBAG PTE LTD
**Founder**: Raunak Bohra
**Target Market**: Indian & Nepal SMBs (Pharma, FMCG, Distribution)
**Pricing**: ₹4,999 - ₹24,999/month (60% cheaper than competitors)

---

## 💻 Tech Stack

**Frontend**: React 18 + TypeScript + Vite + Tailwind CSS + Shadcn/UI
**Backend**: Cloudflare Workers + Hono + TypeScript + Prisma ORM
**Database**: Neon PostgreSQL (serverless)
**Hosting**: Cloudflare Pages (frontend) + Cloudflare Workers (backend)
**Storage**: Cloudflare R2
**Email**: AWS SES (Mumbai region)

**Key Libraries**:
- State: React Context API
- Routing: React Router v6
- Auth: JWT + bcrypt
- Testing: Vitest (frontend & backend)
- Offline: IndexedDB (localforage)
- i18n: React i18next (Hindi, Nepali, English)
- Queue: Cloudflare Queues
- Edge Framework: Hono (for Workers)

---

## 🚨 CRITICAL RULES (MUST FOLLOW)

### ❌ NEVER:
1. **Reset database** - `prisma migrate reset` is FORBIDDEN (especially in production)
2. **Use emojis** - Always use professional SVG logos/icons instead (Heroicons, Lucide)
3. **Commit secrets** - Never commit .env files, API keys, passwords
4. **Use `any` type** - Use `unknown` or proper TypeScript types
5. **Skip tests** - 70% backend coverage, 60% frontend coverage required
6. **Exceed file size limits** without documenting why:
   - Controllers: 200-500 lines
   - Services: 300-600 lines
   - Routes: 100-300 lines
   - Utilities: 200-400 lines
   - Components: 150-300 lines

### ✅ ALWAYS:
1. **Use teal/amber color scheme** - Teal (#0d9488) primary, Amber (#d97706) secondary
2. **TypeScript strict mode** - No implicit any, strict null checks
3. **Validate user input** - Sanitize and validate all inputs
4. **Follow Single Responsibility Principle** - One purpose per file/function
5. **Write tests** - For all new features before merging
6. **Use proper error handling** - try-catch, custom error classes
7. **Optimize performance** - API <200ms, Page load <3s, Bundle <500KB

---

## 📚 Documentation Structure

**I have comprehensive guidelines at** `/Users/raunakbohra/Desktop/medical-CRM/docs/`:

### Core Guidelines (Read when relevant):
1. **DEVELOPMENT_GUIDELINES.md** (2,052 lines) - Daily coding standards
   - Project structure, TypeScript, React patterns, Backend architecture
   - Database optimization, Security, API design, UI/UX
   - Error handling, Testing, Performance, Git workflow

2. **OPERATIONAL_GUIDELINES.md** (1,400+ lines) - DevOps & production
   - CI/CD, Deployment, Multi-tenancy, Background jobs
   - Security, Compliance, Backups, Monitoring, Incident response

3. **FEATURE_GUIDELINES.md** (1,200+ lines) - Feature-specific
   - PWA, Offline mode, i18n, Voice input, SMS/Email/WhatsApp
   - Feature flags, Accessibility, Analytics, Search, File upload

4. **ONBOARDING_GUIDE.md** (800+ lines) - Team onboarding
   - Quick start, Architecture, Common commands, Troubleshooting

### Implementation Plans:
- **00_MASTER_IMPLEMENTATION_PLAN.md** - 90-day roadmap overview
- **DAY_01_SETUP_AND_AUTH.md** through **DAY_05_PAYMENTS_IMPLEMENTATION.md** - Hour-by-hour Week 1 plans
- **WEEK_02_TO_12_ROADMAP.md** - Long-term feature roadmap

---

## 🎯 How to Help Me

### When I ask you to code:
1. **Check if it follows guidelines** - Reference DEVELOPMENT_GUIDELINES.md
2. **Use TypeScript strict mode** - No `any` types
3. **Follow file size limits** - Keep controllers thin, services focused
4. **Write tests** - Include tests with code
5. **No emojis** - Use SVG icons (Heroicons/Lucide)
6. **Use teal/amber colors** - Follow design system
7. **Validate inputs** - Always sanitize user data
8. **Optimize queries** - Prevent N+1, use indexes
9. **Handle errors** - try-catch, proper error responses
10. **Check security** - No SQL injection, XSS, CSRF vulnerabilities

### When I ask about architecture/design:
- Reference **00_MASTER_IMPLEMENTATION_PLAN.md** for overall roadmap
- Reference **TECHNICAL_ARCHITECTURE.md** (if exists)
- Suggest patterns from **DEVELOPMENT_GUIDELINES.md**

### When I ask about deployment/DevOps:
- Reference **OPERATIONAL_GUIDELINES.md**
- Check CI/CD, monitoring, backup procedures

### When I ask about specific features (PWA, i18n, etc.):
- Reference **FEATURE_GUIDELINES.md**
- Follow implementation patterns documented there

---

## 🔧 Current Project Status

**Week 1 MVP** (Days 1-5): ✅ Planned (ready to implement)
- Day 1: Project setup + Authentication (JWT)
- Day 2: Contacts CRUD with GPS
- Day 3: Visit tracking with photo uploads
- Day 4: Order management with approval workflow
- Day 5: Payment tracking with reminders

**Database Schema** (8 core tables):
1. `users` - Authentication & roles
2. `companies` - Multi-tenant (for V2)
3. `contacts` - Doctors, retailers, wholesalers
4. `visits` - GPS check-ins with photos
5. `products` - Product catalog
6. `orders` - Sales orders with approval
7. `order_items` - Order line items
8. `payments` - Payment records

**Current Phase**: Ready to start Day 1 implementation

---

## ✅ Pre-Commit Checklist

Before committing code, verify:
- [ ] TypeScript compiles with no errors (`npx tsc --noEmit`)
- [ ] No `any` types used
- [ ] File size within limits (or documented why)
- [ ] Tests written and passing (70% backend, 60% frontend)
- [ ] No `console.log()` left in code (use logger)
- [ ] User input validated and sanitized
- [ ] No emojis (SVG icons used instead)
- [ ] Teal/amber color scheme followed
- [ ] Database migrations never reset
- [ ] No secrets committed
- [ ] Error handling implemented
- [ ] Performance considered (query optimization, bundle size)
- [ ] Accessibility considered (ARIA labels, keyboard nav)

---

## 📝 Code Style Preferences

**TypeScript**:
```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'sales_rep';
}

const getUser = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { id } });
};

// ❌ Bad
const getUser = async (id) => { // No types
  return await prisma.user.findUnique({ where: { id } });
};
```

**React**:
```tsx
// ✅ Good - Functional component with types
interface ContactFormProps {
  contactId?: string;
  onSuccess: () => void;
}

export default function ContactForm({ contactId, onSuccess }: ContactFormProps) {
  const [loading, setLoading] = useState(false);
  // ...
}

// ❌ Bad - No types, class component
export default class ContactForm extends React.Component {
  // Don't use class components
}
```

**Colors**:
```tsx
// ✅ Good - Teal/Amber theme
<button className="bg-teal-600 hover:bg-teal-700 text-white">Primary</button>
<button className="bg-amber-600 hover:bg-amber-700 text-white">Secondary</button>

// ❌ Bad - Other colors without justification
<button className="bg-blue-600">Button</button>
```

**Icons (NO EMOJIS)**:
```tsx
// ✅ Good - SVG icon
import { CheckCircleIcon } from '@heroicons/react/24/solid';
<CheckCircleIcon className="w-5 h-5 text-green-600" />

// ❌ Bad - Emoji
<span>✅ Success</span>
```

---

## 🚀 Quick Commands Reference

**Backend**:
```bash
cd /Users/raunakbohra/Desktop/medical-CRM/api
npm run dev              # Start dev server
npx prisma studio        # Database GUI
npx prisma migrate dev   # Run migrations
npm test                 # Run tests
```

**Frontend**:
```bash
cd /Users/raunakbohra/Desktop/medical-CRM/web
npm run dev              # Start dev server
npm test                 # Run tests
npm run build            # Build for production
```

---

## 💡 When to Read Detailed Guidelines

**Read DEVELOPMENT_GUIDELINES.md when**:
- Writing new code (controllers, services, components)
- Unsure about file structure or naming
- Need security, validation, or error handling patterns
- Setting up tests
- Optimizing performance
- Designing APIs

**Read OPERATIONAL_GUIDELINES.md when**:
- Deploying to production
- Setting up CI/CD
- Configuring monitoring
- Handling incidents
- Managing multi-tenancy
- Setting up background jobs

**Read FEATURE_GUIDELINES.md when**:
- Implementing PWA/offline mode
- Adding internationalization (Hindi, Nepali)
- Integrating SMS/Email/WhatsApp
- Adding voice input
- Implementing analytics
- Building accessibility features

**Read ONBOARDING_GUIDE.md when**:
- Setting up project for first time
- Troubleshooting common issues
- Need quick command reference

---

## 🎯 Expected Behavior

**When you help me**:
1. Follow all guidelines above
2. Reference specific guideline docs when relevant (e.g., "Per DEVELOPMENT_GUIDELINES.md section 3.2...")
3. Provide code that passes the pre-commit checklist
4. Include tests with new features
5. Point out if my request violates guidelines (e.g., "This would reset the database, which is forbidden")
6. Suggest better alternatives when needed
7. Be concise but thorough
8. Include examples (good vs bad patterns)

**Code Quality**:
- Production-ready code (not just POC)
- TypeScript strict mode compliant
- Tested (70% backend, 60% frontend)
- Secure (OWASP Top 10 compliant)
- Performant (API <200ms, Page <3s)
- Accessible (WCAG 2.1 AA)

---

## 📞 Support

If you need to read the full guidelines:
```bash
# All docs are here
ls -la /Users/raunakbohra/Desktop/medical-CRM/docs/

# Core guidelines
open /Users/raunakbohra/Desktop/medical-CRM/docs/DEVELOPMENT_GUIDELINES.md
open /Users/raunakbohra/Desktop/medical-CRM/docs/OPERATIONAL_GUIDELINES.md
open /Users/raunakbohra/Desktop/medical-CRM/docs/FEATURE_GUIDELINES.md
```

---

**I'm ready! What would you like me to help you build today?**

---

_Copy everything above this line and paste at the start of new chat sessions_
