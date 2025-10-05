# 📚 Documentation - Field Force CRM

**Complete project documentation for development, deployment, and operations**

**Last Updated**: 2025-10-05

---

## 🗂️ Documentation Structure

```
docs/
├── 00-getting-started/      # ← START HERE
│   ├── ONBOARDING_GUIDE.md
│   ├── PREPARATION_CHECKLIST.md
│   ├── CLAUDE_CODE_PROMPT.md
│   └── CLAUDE_CODE_PROMPT_SHORT.md
│
├── 01-architecture/          # System design
│   ├── TECHNICAL_ARCHITECTURE.md
│   ├── PORTABLE_ARCHITECTURE_GUIDE.md
│   └── ARCHITECTURE_MIGRATION_SUMMARY.md
│
├── 02-guidelines/            # Development standards
│   ├── DEVELOPMENT_GUIDELINES.md  ⭐ READ FIRST
│   ├── OPERATIONAL_GUIDELINES.md
│   └── FEATURE_GUIDELINES.md
│
├── 03-implementation-plans/  # Day-by-day plans
│   ├── 00_MASTER_IMPLEMENTATION_PLAN.md
│   ├── DAY_01_SETUP_AND_AUTH_V2.md  ⭐ START HERE
│   ├── DAY_02_CONTACTS_IMPLEMENTATION.md
│   ├── DAY_03_VISITS_IMPLEMENTATION.md
│   ├── DAY_04_ORDERS_IMPLEMENTATION.md
│   ├── DAY_05_PAYMENTS_IMPLEMENTATION.md
│   └── WEEK_02_TO_12_ROADMAP.md
│
├── 04-deployment/            # Production deployment
│   └── CLOUDFLARE_DEPLOYMENT_GUIDE.md
│
├── 05-references/            # Quick references (coming soon)
│
├── archive/                  # Old/deprecated docs
│
└── README.md                 # This file
```

---

## 🚀 Quick Start Paths

### Path 1: New Team Member
```
1. Read: 00-getting-started/ONBOARDING_GUIDE.md
2. Setup: 00-getting-started/PREPARATION_CHECKLIST.md
3. Learn: 02-guidelines/DEVELOPMENT_GUIDELINES.md
4. Build: 03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md
```

### Path 2: Start Building (You're Ready!)
```
1. Open: 03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md
2. Follow: Hour-by-hour schedule
3. Build: Authentication system
4. Next: Continue with Day 2-5
```

### Path 3: Understanding Architecture
```
1. Read: 01-architecture/TECHNICAL_ARCHITECTURE.md
2. Learn: 01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md
3. Review: 01-architecture/ARCHITECTURE_MIGRATION_SUMMARY.md
```

### Path 4: Deploying to Production
```
1. Complete: Week 1 MVP (Day 1-5)
2. Read: 04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md
3. Deploy: Follow step-by-step guide
4. Monitor: Setup analytics and alerts
```

### Path 5: Using Claude Code
```
1. Copy: 00-getting-started/CLAUDE_CODE_PROMPT.md
2. Paste: At start of new Claude Code session
3. Code: With full project context!
```

---

## 📂 Folder Descriptions

### [00-getting-started/](./00-getting-started/) 🎯 START HERE
**For**: New team members, onboarding
**Time**: 30-45 minutes
**Contains**:
- Complete onboarding guide
- Environment setup checklist
- Claude Code prompt templates

**Start with**: ONBOARDING_GUIDE.md

---

### [01-architecture/](./01-architecture/) 🏗️
**For**: Understanding system design
**Time**: 2-3 hours to read all
**Contains**:
- Technical architecture (system design)
- Portable architecture guide (Cloudflare ↔ AWS)
- Architecture migration summary (why Cloudflare)

**Key Insight**: Our architecture is portable - switch platforms in 5-7 days!

**Start with**: TECHNICAL_ARCHITECTURE.md

---

### [02-guidelines/](./02-guidelines/) 📖 ESSENTIAL
**For**: ALL developers (required reading)
**Time**: 3-4 hours to read all
**Contains**:
- **DEVELOPMENT_GUIDELINES.md** ⭐ (2,052 lines) - MUST READ
- **OPERATIONAL_GUIDELINES.md** (1,400 lines) - DevOps
- **FEATURE_GUIDELINES.md** (1,200 lines) - Specific features

**Critical Rules**:
- ❌ NEVER: Reset DB, Use emojis, Use `any` type
- ✅ ALWAYS: Teal/Amber colors, TypeScript strict, Test everything

**Start with**: DEVELOPMENT_GUIDELINES.md (read before coding!)

---

### [03-implementation-plans/](./03-implementation-plans/) 📅 BUILD HERE
**For**: Daily implementation guidance
**Time**: 8 hours per day × 5 days = Week 1 MVP
**Contains**:
- Master plan (90-day roadmap)
- **Day 1-5 plans** (hour-by-hour schedules)
- Week 2-12 roadmap

**Week 1 MVP**:
- Day 1: Authentication ✅
- Day 2: Contacts CRUD ✅
- Day 3: Visit tracking ✅
- Day 4: Order management ✅
- Day 5: Payments + Email ✅

**Start with**: DAY_01_SETUP_AND_AUTH_V2.md

---

### [04-deployment/](./04-deployment/) 🚀
**For**: Deploying to production
**Time**: 2-3 hours (first time), 5 mins (subsequent)
**Contains**:
- Complete Cloudflare + Neon deployment guide
- Environment setup
- Monitoring configuration
- Troubleshooting

**Deploy when**: Week 1 MVP complete

**Start with**: CLOUDFLARE_DEPLOYMENT_GUIDE.md

---

### [05-references/](./05-references/) 📚
**For**: Quick lookups and cheat sheets
**Status**: Coming soon
**Planned**:
- API endpoints documentation
- Database schema diagrams
- Environment variables list
- Common troubleshooting

---

### [archive/](./archive/) 🗄️
**For**: Deprecated documentation
**Contains**: Old Express/Railway version of Day 1

---

## 🎯 Documentation Stats

| Category | Files | Lines | Purpose |
|----------|-------|-------|---------|
| Getting Started | 4 | 2,500+ | Onboarding |
| Architecture | 3 | 4,500+ | System design |
| Guidelines | 3 | 4,652+ | Standards |
| Implementation | 8 | 7,000+ | Build guide |
| Deployment | 1 | 3,000+ | Production |
| **Total** | **19** | **21,652+** | Complete docs |

---

## 💡 Key Concepts

### Tech Stack
```
Frontend:  Cloudflare Pages (React 18 + Vite + Tailwind)
Backend:   Cloudflare Workers (Hono + TypeScript)
Database:  Neon PostgreSQL (serverless, Mumbai)
Storage:   Cloudflare R2
Email:     AWS SES (Mumbai)
Queue:     Cloudflare Queues
Cache:     Cloudflare KV
```

### Architecture Pattern
```
Hexagonal Architecture (Ports & Adapters)
→ Business logic: Platform-agnostic
→ Infrastructure: Swappable (Cloudflare ↔ AWS)
→ Migration time: 5-7 days
```

### Cost & Performance
```
Cost:        $30/month (vs $132 on AWS = 77% cheaper)
Performance: 15-50ms in India (vs 100-200ms = 75% faster)
Lock-in:     Zero (portable architecture)
```

---

## 📖 Recommended Reading Order

### For New Developers (Week 1):

**Day 1-2** (Setup & Context):
1. ✅ [ONBOARDING_GUIDE.md](./00-getting-started/ONBOARDING_GUIDE.md) - 30 min
2. ✅ [PREPARATION_CHECKLIST.md](./00-getting-started/PREPARATION_CHECKLIST.md) - 15 min
3. ✅ [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md) (sections 1-8) - 2 hrs

**Day 3-4** (Architecture):
4. ✅ [TECHNICAL_ARCHITECTURE.md](./01-architecture/TECHNICAL_ARCHITECTURE.md) - 1 hr
5. ✅ [PORTABLE_ARCHITECTURE_GUIDE.md](./01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md) - 45 min
6. ✅ [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md) (sections 9-16) - 2 hrs

**Day 5** (Start Building):
7. ✅ [DAY_01_SETUP_AND_AUTH_V2.md](./03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md) - 8 hrs

---

### For Product/Business (30 minutes):

1. ✅ [ARCHITECTURE_MIGRATION_SUMMARY.md](./01-architecture/ARCHITECTURE_MIGRATION_SUMMARY.md) - 10 min
2. ✅ [00_MASTER_IMPLEMENTATION_PLAN.md](./03-implementation-plans/00_MASTER_IMPLEMENTATION_PLAN.md) - 15 min
3. ✅ [TECHNICAL_ARCHITECTURE.md](./01-architecture/TECHNICAL_ARCHITECTURE.md) (sections 1-2) - 5 min

---

### For DevOps (2 hours):

1. ✅ [TECHNICAL_ARCHITECTURE.md](./01-architecture/TECHNICAL_ARCHITECTURE.md) - 45 min
2. ✅ [OPERATIONAL_GUIDELINES.md](./02-guidelines/OPERATIONAL_GUIDELINES.md) - 45 min
3. ✅ [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md) - 30 min

---

## 🎓 Learning Paths

### Path A: Full Stack Developer
```
Week 1:  Getting Started + Guidelines
Week 2:  Architecture + Implementation
Week 3:  Build Day 1-3
Week 4:  Build Day 4-5 + Deploy
```

### Path B: Frontend Specialist
```
Focus on:
- DEVELOPMENT_GUIDELINES.md (Frontend sections)
- FEATURE_GUIDELINES.md (PWA, i18n, Offline)
- Day 1-5 frontend portions
```

### Path C: Backend Specialist
```
Focus on:
- DEVELOPMENT_GUIDELINES.md (Backend sections)
- PORTABLE_ARCHITECTURE_GUIDE.md
- OPERATIONAL_GUIDELINES.md
- Day 1-5 backend portions
```

### Path D: DevOps Engineer
```
Focus on:
- OPERATIONAL_GUIDELINES.md
- CLOUDFLARE_DEPLOYMENT_GUIDE.md
- TECHNICAL_ARCHITECTURE.md
- Monitoring & scaling sections
```

---

## 🔍 Finding Information

### "How do I...?"

**...set up my environment?**
→ [PREPARATION_CHECKLIST.md](./00-getting-started/PREPARATION_CHECKLIST.md)

**...start building?**
→ [DAY_01_SETUP_AND_AUTH_V2.md](./03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md)

**...write code correctly?**
→ [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md)

**...understand the architecture?**
→ [TECHNICAL_ARCHITECTURE.md](./01-architecture/TECHNICAL_ARCHITECTURE.md)

**...deploy to production?**
→ [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md)

**...switch to AWS?**
→ [PORTABLE_ARCHITECTURE_GUIDE.md](./01-architecture/PORTABLE_ARCHITECTURE_GUIDE.md)

**...implement offline mode?**
→ [FEATURE_GUIDELINES.md](./02-guidelines/FEATURE_GUIDELINES.md#2-offline-mode)

**...handle errors?**
→ [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md#9-error-handling)

**...write tests?**
→ [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md#10-testing-requirements)

---

## 📊 Quality Metrics

### Code Quality
- TypeScript strict mode: 100%
- Backend test coverage: 70%+
- Frontend test coverage: 60%+
- Lighthouse score: >90
- Bundle size: <500KB gzipped

### Performance
- API response time: <200ms (p95)
- Page load time: <3s
- First Contentful Paint: <1.5s

### Security
- Zero critical vulnerabilities
- OWASP Top 10 compliance
- GDPR/DPDP Act compliance

---

## 🚨 Critical Rules

### ❌ NEVER:
1. Reset database (`prisma migrate reset` is FORBIDDEN)
2. Use emojis (use professional SVG logos instead)
3. Commit secrets (.env, API keys, passwords)
4. Use `any` type (use `unknown` or proper types)
5. Skip tests (70% backend, 60% frontend required)

### ✅ ALWAYS:
1. Use teal/amber color scheme
2. TypeScript strict mode
3. Validate ALL user input
4. Follow Single Responsibility Principle
5. Write tests before merging
6. Use proper error handling
7. Optimize performance

---

## 📞 Getting Help

**Questions about**:

| Topic | Document | Contact |
|-------|----------|---------|
| Setup | [ONBOARDING_GUIDE.md](./00-getting-started/ONBOARDING_GUIDE.md) | Team Slack |
| Code Standards | [DEVELOPMENT_GUIDELINES.md](./02-guidelines/DEVELOPMENT_GUIDELINES.md) | Code review |
| Architecture | [TECHNICAL_ARCHITECTURE.md](./01-architecture/TECHNICAL_ARCHITECTURE.md) | @raunak |
| Deployment | [CLOUDFLARE_DEPLOYMENT_GUIDE.md](./04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md) | DevOps team |
| Features (PWA, i18n) | [FEATURE_GUIDELINES.md](./02-guidelines/FEATURE_GUIDELINES.md) | Tech lead |

---

## 🎉 Success Criteria

### You're Ready to Code When:
- [x] Environment setup complete
- [x] Read DEVELOPMENT_GUIDELINES.md
- [x] Understand architecture
- [x] Have access to all services
- [x] Can run app locally

### You're an Expert When:
- [x] Can implement features independently
- [x] Can review code effectively
- [x] Understand portable architecture
- [x] Can troubleshoot production issues
- [x] Can mentor new team members

---

## 📈 Project Status

**Current Phase**: Week 1 MVP (Ready to start!)
**Next Milestone**: Week 1 Complete (Auth + Contacts + Visits + Orders + Payments)

**Documentation Status**: ✅ Complete
**Architecture Status**: ✅ Defined
**Implementation Status**: ⏳ Ready to begin

---

## 🔄 Document Updates

**How to update docs**:
1. Make changes to markdown files
2. Update "Last Updated" date
3. Create PR with documentation tag
4. Tag @raunak for review
5. Merge after approval

**Documentation style**:
- Clear, concise language
- Code examples (good vs bad)
- Checklists where applicable
- Tables for reference
- Keep it current!

---

## 📝 Contributing

**Found an error?**
→ Create issue with `documentation` label

**Want to improve docs?**
→ Create PR with changes

**Have a question?**
→ Ask in team Slack #dev channel

---

## 🌟 What Makes Our Documentation Special

✅ **Complete**: 21,652+ lines covering everything
✅ **Actionable**: Hour-by-hour implementation plans
✅ **Organized**: Clear folder structure
✅ **Maintained**: Up-to-date and reviewed
✅ **Accessible**: Easy to find information
✅ **Practical**: Real code examples throughout

---

## 🚀 Ready to Start?

### For New Team Members:
**Go to**: [00-getting-started/](./00-getting-started/)

### For Building:
**Go to**: [03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md](./03-implementation-plans/DAY_01_SETUP_AND_AUTH_V2.md)

### For Deploying:
**Go to**: [04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md](./04-deployment/CLOUDFLARE_DEPLOYMENT_GUIDE.md)

---

**Welcome to Field Force CRM! Let's build something amazing together.** 🚀

**Last Updated**: 2025-10-05
**Version**: 2.0 (Cloudflare Architecture)
**Maintainer**: @raunak
