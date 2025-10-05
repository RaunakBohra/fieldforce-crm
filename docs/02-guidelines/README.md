# 📖 Development Guidelines

**Essential coding standards and best practices**

---

## 📄 Files in This Folder

### 1. [DEVELOPMENT_GUIDELINES.md](./DEVELOPMENT_GUIDELINES.md) ⭐
**Size**: 2,052 lines
**Importance**: **READ THIS FIRST**
**Content**: Daily coding standards for all developers

#### Sections (16 total):
1. **Project Structure** - Folder organization, file naming, size limits
2. **TypeScript Standards** - Strict mode, type safety, no `any`
3. **Frontend Guidelines (React)** - Components, hooks, performance
4. **Backend Guidelines (Hono)** - Route handlers, services, middleware
5. **Database Guidelines (Prisma)** - Schema, migrations, query optimization
6. **Security Standards** - JWT, RBAC, input validation, XSS/SQL prevention
7. **API Design** - REST conventions, response format, status codes
8. **UI/UX Guidelines** - Teal/Amber colors, NO EMOJIS, typography
9. **Error Handling** - Custom errors, global handlers, boundaries
10. **Testing Requirements** - 70% backend, 60% frontend coverage
11. **Performance Standards** - API <200ms, Page <3s, Bundle <500KB
12. **Git Workflow** - Branch naming, commit messages, PR process
13. **Documentation Rules** - When to comment, JSDoc format
14. **Code Review Checklist** - Security triggers, quality checks
15. **Logging & Monitoring** - Structured logging, what NOT to log
16. **Caching Strategy** - Redis/KV patterns, TTL strategies

**When to read**: BEFORE writing ANY code

**Key Rules**:
- ❌ NEVER: Reset DB, Use emojis, Use `any` type, Skip tests
- ✅ ALWAYS: Teal/Amber colors, TypeScript strict, Validate inputs, Test

---

### 2. [OPERATIONAL_GUIDELINES.md](./OPERATIONAL_GUIDELINES.md)
**Size**: 1,400+ lines
**For**: DevOps, senior developers, deployment
**Content**: Production operations and DevOps standards

#### Sections (12 total):
1. **Deployment & CI/CD** - GitHub Actions, deployment checklist
2. **Environment Management** - Dev/staging/prod configs, secrets
3. **Multi-Tenancy Operations** - Schema-per-tenant, provisioning
4. **Background Jobs & Queues** - Cloudflare Queues, job processors
5. **Rate Limiting & Security** - API limits, DDoS protection
6. **Data Privacy & Compliance** - GDPR, DPDP Act 2023, PII handling
7. **Backup & Disaster Recovery** - Daily backups, PITR, RTO/RPO
8. **Monitoring & Alerting** - Sentry, APM, uptime, alert rules
9. **Incident Response** - Severity levels, procedures, communication
10. **Cost Optimization** - Query optimization, storage lifecycle
11. **Third-Party Integrations** - Webhooks, retry logic, circuit breakers
12. **Release Management** - Semantic versioning, changelog, rollbacks

**When to read**:
- Before deploying to production
- Setting up CI/CD
- Configuring monitoring
- Handling incidents
- Managing costs

---

### 3. [FEATURE_GUIDELINES.md](./FEATURE_GUIDELINES.md)
**Size**: 1,200+ lines
**For**: Feature-specific implementations
**Content**: Standards for specific features

#### Sections (12 total):
1. **Mobile & PWA** - Progressive web app setup, manifest
2. **Offline Mode** - IndexedDB, background sync, queue management
3. **Internationalization (i18n)** - i18next setup, Hindi, Nepali
4. **Voice Input** - Web Speech API, voice-to-text
5. **SMS/Email/WhatsApp** - MSG91, SendGrid, Gupshup integrations
6. **Feature Flags** - Simple feature flag system
7. **Accessibility (A11y)** - Keyboard nav, ARIA labels, WCAG 2.1 AA
8. **Analytics & Tracking** - PostHog setup, event tracking
9. **Search & Filtering** - Debounced search, advanced filters
10. **File Upload** - Image compression, S3 presigned URLs
11. **Notifications** - Toast, push, email, multi-channel
12. **Maps & GPS** - Leaflet integration, geolocation

**When to read**: When implementing these specific features

---

## 🎯 Critical Rules (Must Follow)

### ❌ NEVER:
1. **Reset database** - `prisma migrate reset` is FORBIDDEN
2. **Use emojis** - Use professional SVG logos (Heroicons, Lucide)
3. **Commit secrets** - Never commit .env, API keys, passwords
4. **Use `any` type** - Use `unknown` or proper TypeScript types
5. **Skip tests** - 70% backend, 60% frontend coverage required
6. **Exceed file size limits** without documenting why:
   - Controllers: 200-500 lines
   - Services: 300-600 lines
   - Routes: 100-300 lines
   - Components: 150-300 lines

### ✅ ALWAYS:
1. **Use teal/amber color scheme** - Teal (#0d9488) primary, Amber (#d97706) secondary
2. **TypeScript strict mode** - No implicit any, strict null checks
3. **Validate user input** - Sanitize and validate ALL inputs
4. **Follow Single Responsibility** - One purpose per file/function
5. **Write tests** - For all new features before merging
6. **Use proper error handling** - try-catch, custom error classes
7. **Optimize performance** - API <200ms, Page <3s, Bundle <500KB

---

## 📋 Pre-Commit Checklist

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
- [ ] Performance considered
- [ ] Accessibility considered

---

## 📊 Quality Standards

### Code Quality
- TypeScript strict mode: 100%
- Backend test coverage: 70%+
- Frontend test coverage: 60%+
- Lighthouse score: >90
- Bundle size: <500KB gzipped

### Performance
- API response time: <200ms (p95)
- Page load time: <3s (Time to Interactive)
- First Contentful Paint: <1.5s

### Security
- Zero critical vulnerabilities
- OWASP Top 10 compliance
- GDPR/DPDP Act compliance

---

## 📚 Recommended Reading Order

### For All Developers (REQUIRED):
1. **DEVELOPMENT_GUIDELINES.md** - Read sections 1-8 (core)
2. **DEVELOPMENT_GUIDELINES.md** - Read sections 9-16 (advanced)
3. Keep as reference during coding

### For DevOps/Senior Developers:
1. **DEVELOPMENT_GUIDELINES.md** - Full read
2. **OPERATIONAL_GUIDELINES.md** - Full read
3. Refer during deployment and operations

### For Feature Developers:
1. **DEVELOPMENT_GUIDELINES.md** - Core sections
2. **FEATURE_GUIDELINES.md** - Relevant sections only

---

## 💡 Quick Reference

### Good vs Bad Examples

**TypeScript**:
```typescript
// ✅ Good - Explicit types
const getUser = async (id: string): Promise<User | null> => {
  return await prisma.user.findUnique({ where: { id } });
};

// ❌ Bad - Implicit any
const getUser = async (id) => {
  return await prisma.user.findUnique({ where: { id } });
};
```

**React Components**:
```typescript
// ✅ Good - Functional with types
interface ContactFormProps {
  contactId?: string;
  onSuccess: () => void;
}

export default function ContactForm({ contactId, onSuccess }: ContactFormProps) {
  // ...
}

// ❌ Bad - Class component, no types
export default class ContactForm extends React.Component {
  // Don't use class components
}
```

**Colors**:
```tsx
// ✅ Good - Teal/Amber theme
<button className="bg-teal-600 hover:bg-teal-700">Primary</button>
<button className="bg-amber-600 hover:bg-amber-700">Secondary</button>

// ❌ Bad - Other colors
<button className="bg-blue-600">Button</button>
```

**Icons**:
```tsx
// ✅ Good - SVG icon
import { CheckCircleIcon } from '@heroicons/react/24/solid';
<CheckCircleIcon className="w-5 h-5 text-green-600" />

// ❌ Bad - Emoji
<span>✅ Success</span>
```

---

## 🎓 Learning Path

### Week 1:
- [ ] Read DEVELOPMENT_GUIDELINES.md (sections 1-8)
- [ ] Review existing code for patterns
- [ ] Fix a "good first issue" bug

### Week 2-3:
- [ ] Read DEVELOPMENT_GUIDELINES.md (sections 9-16)
- [ ] Implement a small feature
- [ ] Write tests
- [ ] Submit first PR

### Week 4+:
- [ ] Read OPERATIONAL_GUIDELINES.md
- [ ] Read FEATURE_GUIDELINES.md (relevant sections)
- [ ] Lead a feature from design to deployment

---

## 📝 Next Steps

**After reading guidelines**:

→ Start building: [03-implementation-plans](../03-implementation-plans/)
→ Learn architecture: [01-architecture](../01-architecture/)
→ Deploy: [04-deployment](../04-deployment/)

---

**Last Updated**: 2025-10-05
**Maintainer**: @raunak
