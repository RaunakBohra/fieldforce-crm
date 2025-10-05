# Pre-Development Preparation Checklist

**Project**: Field Force CRM
**Start Date**: Ready to begin
**Estimated Completion**: 60 working days

---

## ✅ Environment Check (COMPLETED)

- [x] **Node.js**: v22.14.0 installed ✓
- [x] **PostgreSQL**: v15 installed and running ✓
- [x] **Git**: v2.39.5 installed ✓
- [x] **Project Folder**: /Users/raunakbohra/Desktop/medical-CRM ✓
- [x] **Docs Folder**: Contains all 7 planning documents ✓

---

## 📋 Pre-Development Tasks

### 1. Review Planning Documents (30 minutes)

**Status**: In Progress

- [x] Master Implementation Plan reviewed
- [ ] Day 1 plan read (DAY_01_SETUP_AND_AUTH.md)
- [ ] Understand Week 1 goals
- [ ] Understand database schema

**Action**: Read the following files in order:
1. `docs/00_MASTER_IMPLEMENTATION_PLAN.md` (already reviewed)
2. `docs/DAY_01_SETUP_AND_AUTH.md` (next)
3. Skim Days 2-5 to understand the flow

---

### 2. Setup Additional Tools (10 minutes)

- [ ] **VS Code** (or preferred code editor)
  ```bash
  # If not installed:
  brew install --cask visual-studio-code
  ```

- [ ] **GitHub CLI** (optional but recommended)
  ```bash
  brew install gh
  gh auth login
  ```

- [ ] **PostgreSQL GUI** (optional - Prisma Studio will work)
  ```bash
  # Option 1: Postico (macOS)
  brew install --cask postico

  # Option 2: TablePlus
  brew install --cask tableplus
  ```

---

### 3. Verify PostgreSQL Setup (5 minutes)

- [x] PostgreSQL 15 running
- [ ] Can connect to PostgreSQL
  ```bash
  psql postgres
  # Type \q to exit
  ```

- [ ] Create project database
  ```bash
  createdb fieldforce_crm

  # Verify it exists
  psql -l | grep fieldforce
  ```

---

### 4. GitHub Account & Repository (5 minutes)

- [ ] GitHub account ready
- [ ] SSH key configured (optional)
  ```bash
  # Check if SSH key exists
  ls -la ~/.ssh/id_*.pub

  # If not, generate one
  ssh-keygen -t ed25519 -C "your_email@example.com"

  # Add to GitHub: https://github.com/settings/keys
  ```

- [ ] Ready to create repository (will do in Day 1)

---

### 5. AWS Account for S3 (Optional for Day 1, Required by Day 3)

**Status**: Can skip for now, set up by Day 3

- [ ] AWS account created
- [ ] IAM user created with S3 permissions
- [ ] Access Key ID and Secret Access Key generated
- [ ] S3 bucket created (or will create via code)

**Note**: For Day 1-2, you can develop without S3. By Day 3 (visit photos), you'll need this.

**Alternative**: Use Cloudflare R2 (S3-compatible, cheaper)

---

### 6. Code Editor Extensions (Recommended)

If using VS Code:

- [ ] **ESLint** - JavaScript/TypeScript linting
- [ ] **Prettier** - Code formatting
- [ ] **Prisma** - Prisma schema syntax highlighting
- [ ] **Tailwind CSS IntelliSense** - Tailwind autocomplete
- [ ] **GitLens** - Git supercharged

```bash
# Install extensions via CLI (optional)
code --install-extension dbaeumer.vscode-eslint
code --install-extension esbenp.prettier-vscode
code --install-extension Prisma.prisma
code --install-extension bradlc.vscode-tailwindcss
code --install-extension eamodio.gitlens
```

---

### 7. Create Workspace Folder Structure (2 minutes)

- [x] Main project folder created: `medical-CRM`
- [x] Docs folder exists: `medical-CRM/docs`
- [ ] Ready to create `api` and `web` folders (will do in Day 1)

---

### 8. Environment Preparation Summary

**Current Status**:
```
✅ Node.js v22.14.0
✅ PostgreSQL v15 (running)
✅ Git v2.39.5
✅ Project folder: /Users/raunakbohra/Desktop/medical-CRM
✅ Planning docs: 7 files ready
⏳ Database: Need to create 'fieldforce_crm'
⏳ VS Code extensions: Recommended but optional
⏳ AWS S3: Can wait until Day 3
```

---

## 🚀 Ready to Start? (Final Checklist)

Before executing Day 1, ensure:

- [ ] **Mindset**: Committed to 5 full days (8 hours/day) for Week 1
- [ ] **Time blocked**: Calendar cleared for development time
- [ ] **Distractions minimized**: Notifications off, focus mode on
- [ ] **Coffee/Tea ready**: ☕ Essential fuel
- [ ] **Day 1 plan open**: Have `DAY_01_SETUP_AND_AUTH.md` ready

---

## 📅 Day 1 Preview (What You'll Build Tomorrow)

**Duration**: 8 hours (9 AM - 5:30 PM)

**Deliverables**:
1. GitHub repository created
2. Backend: Express + TypeScript server running
3. Frontend: React + Vite app running
4. Database: PostgreSQL with users table
5. Authentication: JWT signup/login working
6. Login page: Fully functional UI

**Files to Create**: 14 files (~700 lines of code)
**Endpoints**: 3 API endpoints (signup, login, getCurrentUser)

**Timeline**:
- 9:00-9:30 AM: GitHub repo setup
- 9:30-10:15 AM: Backend setup (Express + Prisma)
- 10:15-10:30 AM: Break
- 10:30-11:15 AM: Frontend setup (React + Vite + Tailwind)
- 11:15 AM-12:00 PM: Database setup (Prisma migrations)
- 12:00-1:00 PM: Lunch
- 1:00-2:00 PM: Auth backend (JWT + bcrypt)
- 2:00-3:00 PM: Auth frontend (Context + Login page)
- 3:00-3:30 PM: Testing auth flow
- 3:30-4:00 PM: Git commit
- 4:00-5:00 PM: Documentation
- 5:00-5:30 PM: Day 1 review + Day 2 preview

---

## 🎯 Success Criteria for Week 1

By Friday evening, you will have:

- ✅ Working authentication system
- ✅ Complete contacts management
- ✅ GPS-verified visit tracking
- ✅ Order management with approvals
- ✅ Payment tracking with analytics
- ✅ 27 API endpoints working
- ✅ 8 database tables
- ✅ ~4,250 lines of production code
- ✅ 5 fully functional modules

**This is a complete, usable MVP!**

---

## 📞 Support & Resources

### Documentation
- Master Plan: `docs/00_MASTER_IMPLEMENTATION_PLAN.md`
- Day 1-5 Plans: `docs/DAY_0X_*.md`
- Week 2-12: `docs/WEEK_02_TO_12_ROADMAP.md`

### Quick Commands Reference

```bash
# Start PostgreSQL
brew services start postgresql@15

# Create database
createdb fieldforce_crm

# Check database exists
psql -l | grep fieldforce

# Start backend (Day 1+)
cd api && npm run dev

# Start frontend (Day 1+)
cd web && npm run dev

# Run Prisma Studio (view database)
cd api && npx prisma studio
```

### Troubleshooting

**PostgreSQL not running?**
```bash
brew services restart postgresql@15
```

**Port already in use?**
```bash
# Kill process on port 5000 (backend)
lsof -ti:5000 | xargs kill -9

# Kill process on port 3000 (frontend)
lsof -ti:3000 | xargs kill -9
```

**Node version issues?**
```bash
# Use nvm to switch versions
nvm install 20
nvm use 20
```

---

## ✅ Final Pre-Flight Check

**Right now, complete these final tasks**:

1. **Create the database** (2 minutes)
   ```bash
   createdb fieldforce_crm
   psql -l | grep fieldforce
   ```

2. **Open Day 1 plan** (1 minute)
   ```bash
   open docs/DAY_01_SETUP_AND_AUTH.md
   # Or view in your editor
   ```

3. **Set your status**
   - Slack/Teams: "🚀 Deep work - Building Field Force CRM"
   - Do Not Disturb: ON
   - Calendar: Block 9 AM - 5:30 PM

4. **Ready your workspace**
   - Close unnecessary apps
   - Open terminal
   - Open code editor
   - Have Day 1 plan visible
   - Start timer/pomodoro (optional)

---

## 🎉 You're Ready to Build!

Everything is prepared. When you're ready to start Day 1:

**Say**: "Let's start Day 1"

And I'll guide you through each step, hour by hour, to build your Field Force CRM.

---

**Status**: ✅ Environment Ready | 📋 Plans Complete | 🚀 Ready to Execute

*Let's build something amazing!*
