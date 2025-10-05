# 🏗️ Architecture

**System design and architectural decisions**

---

## 📄 Files in This Folder

### 1. [TECHNICAL_ARCHITECTURE.md](./TECHNICAL_ARCHITECTURE.md)
**Size**: ~2,500 lines
**Content**: Complete system architecture:
- High-level architecture diagrams
- Technology decisions with rationale
- System components breakdown
- Data flow diagrams
- Security architecture
- Scalability strategy
- Offline-first design
- Multi-tenancy approach
- Performance optimization
- Disaster recovery

**When to read**:
- Understanding how the system works
- Making architectural decisions
- Onboarding senior developers
- Planning new features

---

### 2. [PORTABLE_ARCHITECTURE_GUIDE.md](./PORTABLE_ARCHITECTURE_GUIDE.md)
**Size**: ~1,000 lines
**Content**: How to switch between Cloudflare and AWS:
- Hexagonal architecture pattern
- Interface-first design
- Dependency injection
- Platform-agnostic code
- Migration guide (5-7 days)
- Testing strategies
- Best practices

**When to read**:
- Understanding portable architecture
- Planning platform migration
- Writing new services
- Code review

**Key Insight**: Business logic never changes, only infrastructure

---

### 3. [COMPUTE_PORTABILITY_GUIDE.md](./COMPUTE_PORTABILITY_GUIDE.md)
**Size**: ~1,500 lines
**Content**: Frontend & Backend compute portability:
- Frontend hosting (Pages → Vercel → S3)
- Backend compute (Workers → Lambda → Node.js)
- Entry point abstraction
- Hono framework strategy
- Platform-specific adapters
- Migration time estimates (4-6 hours)
- Deployment comparisons
- Performance benchmarks

**When to read**:
- Understanding compute portability
- Choosing deployment platform
- Planning migration
- Writing platform-agnostic code

**Key Insight**: Only entry point changes (~50 lines), everything else stays the same

---

### 4. [ARCHITECTURE_MIGRATION_SUMMARY.md](./ARCHITECTURE_MIGRATION_SUMMARY.md)
**Size**: ~500 lines
**Content**: Why we chose Cloudflare + Portable:
- Before/after comparison
- Cost savings (70%)
- Performance improvements (75% faster)
- Migration effort breakdown
- Decision rationale
- Trade-offs

**When to read**:
- Understanding architecture decisions
- Explaining to stakeholders
- Evaluating alternatives

---

## 🎯 Key Architectural Principles

### 1. **Portable Architecture**
```
Business Logic = Platform Agnostic
Infrastructure = Platform Specific
Entry Point = Glue Code
```

### 2. **Hexagonal Architecture**
```
Core (Business Logic)
  ↓ depends on
Ports (Interfaces)
  ↑ implemented by
Adapters (Infrastructure)
```

### 3. **Cloud-Agnostic**
- Start with Cloudflare (70% cheaper)
- Switch to AWS in 5-7 days if needed
- Run on multiple platforms simultaneously

---

## 📊 Architecture at a Glance

```
┌─────────────────────────────────────┐
│     Users (India)                   │
└─────────────┬───────────────────────┘
              │
    ┌─────────▼─────────┐
    │  Cloudflare Edge  │
    │  (275+ Cities)    │
    └─────────┬─────────┘
              │
    ┌─────────┼─────────┐
    │         │         │
    ▼         ▼         ▼
┌───────┐ ┌──────┐ ┌──────┐
│ Pages │ │Workers│ │  R2  │
│(React)│ │ (Hono)│ │      │
└───────┘ └───┬───┘ └──────┘
              │
         ┌────▼────┐
         │  Neon   │
         │  (PG)   │
         └─────────┘
```

**Latency**: 15-50ms in India
**Cost**: ~$30/month
**Scalability**: Automatic
**Lock-in**: Zero

---

## 🔄 Migration Path

```
Component         Time        Code Changes
─────────────────────────────────────────
Database          2-3 hrs     Connection string
Storage (R2→S3)   3-4 hrs     DI factory only
Queue             4-5 hrs     DI factory only
Backend           1-2 days    Entry point
Frontend          2-3 hrs     API URL
─────────────────────────────────────────
TOTAL             5-7 days    ~10% of codebase
```

---

## 📚 Recommended Reading Order

### For Developers:
1. **TECHNICAL_ARCHITECTURE.md** - Understand the system
2. **PORTABLE_ARCHITECTURE_GUIDE.md** - Learn the pattern
3. **COMPUTE_PORTABILITY_GUIDE.md** - Understand frontend/backend portability
4. **ARCHITECTURE_MIGRATION_SUMMARY.md** - Understand why

### For Product/Business:
1. **ARCHITECTURE_MIGRATION_SUMMARY.md** - ROI and decisions
2. **TECHNICAL_ARCHITECTURE.md** (sections 1-2) - High-level overview

### For DevOps:
1. **TECHNICAL_ARCHITECTURE.md** - Full system
2. **COMPUTE_PORTABILITY_GUIDE.md** - Deployment platforms and migration
3. **PORTABLE_ARCHITECTURE_GUIDE.md** - Infrastructure flexibility

---

## 🎓 Key Concepts

### Interfaces (Ports)
```typescript
export interface IStorageService {
  uploadFile(key: string, file: Buffer): Promise<string>;
  deleteFile(key: string): Promise<void>;
}
```

### Implementations (Adapters)
```typescript
// Cloudflare
class R2StorageService implements IStorageService { }

// AWS
class S3StorageService implements IStorageService { }
```

### Business Logic (Pure)
```typescript
class VisitService {
  constructor(private storage: IStorageService) {}  // ← Interface!

  async createVisit(data: CreateVisitDTO) {
    const photoUrl = await this.storage.uploadFile(key, buffer);
    // Works with R2, S3, or ANY storage!
  }
}
```

---

## 📈 Benefits

✅ **70% cost savings** ($30 vs $100/month)
✅ **75% faster** (15-50ms vs 100-200ms)
✅ **Zero vendor lock-in** (switch in 5-7 days)
✅ **Global edge** (275+ cities)
✅ **Auto-scaling** (0 to millions)
✅ **Clean code** (separation of concerns)

---

## 📝 Next Steps

**After reading architecture**:

→ Learn coding standards: [02-guidelines](../02-guidelines/)
→ Start building: [03-implementation-plans](../03-implementation-plans/)
→ Deploy: [04-deployment](../04-deployment/)

---

**Last Updated**: 2025-10-05
