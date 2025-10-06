# Week 2-3 Atomic Todo List

**Project**: Field Force CRM
**Scope**: Days 6-15 (Weeks 2-3)
**Created**: 2025-10-06
**Status**: Ready to Start

---

## Overview

This document breaks down Weeks 2-3 of the roadmap into atomic, actionable tasks with time estimates.

**Week 2 Focus**: Dashboard, Analytics, Reports, User Management, Territory Management
**Week 3 Focus**: Mobile Optimization, PWA, Performance, Push Notifications

**Total Estimated Time**: 80 hours (10 days × 8 hours)

---

# WEEK 2: Dashboard & Analytics (Days 6-10)

---

## DAY 6: Dashboard Layout & Stats Cards (8 hours)

**Goal**: Create a comprehensive dashboard with real-time stats and recent activity feed

### Backend Tasks (3-4 hours)

#### 6.1 Dashboard Stats Endpoint
- [ ] Create `api/src/routes/dashboard.ts` file [15min]
- [ ] Add GET `/api/dashboard/stats` route definition [10min]
- [ ] Create `api/src/controllers/dashboard.ts` controller file [15min]
- [ ] Implement `getDashboardStats` controller function [30min]
  - Aggregate total visits (today, this week, this month)
  - Aggregate total orders (pending, approved, delivered, cancelled)
  - Aggregate total payments (collected, outstanding)
  - Calculate total revenue
- [ ] Write Prisma query for visit stats with date filters [30min]
  ```typescript
  // Today: where createdAt >= startOfDay
  // This week: where createdAt >= startOfWeek
  // This month: where createdAt >= startOfMonth
  ```
- [ ] Write Prisma query for order stats by status [20min]
- [ ] Write Prisma query for payment stats (sum amounts) [20min]
- [ ] Add error handling with try-catch [10min]
- [ ] Add CSRF token validation middleware [10min]
- [ ] Add role-based access control (all authenticated users) [10min]
- [ ] Test endpoint with curl/Postman [15min]

#### 6.2 Recent Activity Endpoint
- [ ] Add GET `/api/dashboard/recent-activity` route [10min]
- [ ] Implement `getRecentActivity` controller function [45min]
  - Fetch last 10 visits with contact info
  - Fetch last 10 orders with contact info
  - Fetch last 10 payments with order/contact info
  - Merge and sort by timestamp (most recent first)
- [ ] Add pagination support (limit 20 items) [15min]
- [ ] Add error handling [10min]
- [ ] Test endpoint with curl/Postman [15min]

#### 6.3 Top Performers Endpoint
- [ ] Add GET `/api/dashboard/top-performers` route [10min]
- [ ] Implement `getTopPerformers` controller function [30min]
  - Group orders by fieldRepId
  - Sum totalAmount per rep
  - Join with User table to get names
  - Order by total revenue DESC
  - Limit to top 5
- [ ] Add date range filter support (this month by default) [20min]
- [ ] Test endpoint [15min]

### Frontend Tasks (3-4 hours)

#### 6.4 Dashboard Page Layout
- [ ] Create `web/src/pages/Dashboard.tsx` file [10min]
- [ ] Add Dashboard route to `App.tsx` (path: `/dashboard` or `/`) [10min]
- [ ] Import and add Navigation component [5min]
- [ ] Create grid layout with Tailwind (responsive) [20min]
  ```tsx
  // 3 columns on desktop, 1 on mobile
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
  ```
- [ ] Add page header with title "Dashboard" [10min]

#### 6.5 Stats Cards Component
- [ ] Create `web/src/components/dashboard/StatsCard.tsx` [30min]
  - Props: title, value, icon, trend, color
  - Show icon (from lucide-react)
  - Show value with number formatting
  - Show trend indicator (up/down arrow with percentage)
- [ ] Create stats fetch function with API call [20min]
- [ ] Add loading state with skeleton cards [20min]
- [ ] Add error state handling [15min]
- [ ] Render stats cards for:
  - Total Visits (Today/Week/Month) [15min]
  - Total Orders (Pending/Approved/Delivered) [15min]
  - Total Revenue [10min]
  - Outstanding Payments [10min]

#### 6.6 Quick Action Buttons
- [ ] Create Quick Actions section [30min]
  - "New Visit" button → navigates to /visits/new
  - "New Order" button → navigates to /orders/new
  - "Record Payment" button → navigates to /payments/new
  - "View Pending Payments" button → navigates to /payments/pending
- [ ] Style buttons with primary colors and icons [15min]
- [ ] Add responsive grid (2x2 on mobile, 4x1 on desktop) [15min]

#### 6.7 Recent Activity Feed
- [ ] Create `web/src/components/dashboard/ActivityFeed.tsx` [45min]
  - Fetch recent activity from API
  - Display as timeline/list
  - Show icon based on type (visit/order/payment)
  - Show timestamp (relative: "2 hours ago")
  - Show primary info (contact name, amount, status)
- [ ] Add loading skeleton [15min]
- [ ] Add empty state ("No recent activity") [10min]
- [ ] Add "View All" link at bottom [10min]

#### 6.8 Top Performers Widget
- [ ] Create `web/src/components/dashboard/TopPerformers.tsx` [30min]
  - Fetch top performers from API
  - Display as ranked list
  - Show rank number, name, total revenue
  - Add medal icons for top 3
- [ ] Add loading state [10min]
- [ ] Style with teal/amber theme [15min]

### Testing & Deployment (1 hour)

#### 6.9 Manual Testing
- [ ] Test dashboard loads without errors [5min]
- [ ] Verify all stats display correct numbers [10min]
- [ ] Test quick action buttons navigate correctly [5min]
- [ ] Test recent activity shows latest items [5min]
- [ ] Test on mobile (responsive layout) [10min]
- [ ] Test loading states work properly [5min]
- [ ] Test error handling (disconnect API) [5min]

#### 6.10 Deployment
- [ ] Commit changes with message "feat: Add dashboard with stats and activity feed" [5min]
- [ ] Deploy backend to Cloudflare Workers [10min]
- [ ] Deploy frontend to Cloudflare Pages [10min]
- [ ] Test in production [10min]

---

## DAY 7: Analytics & Charts (8 hours)

**Goal**: Add interactive charts showing trends and insights

### Setup (30 min)

#### 7.1 Install Dependencies
- [ ] Install recharts: `npm install recharts` in web folder [5min]
- [ ] Install date-fns: `npm install date-fns` in web folder [5min]
- [ ] Verify installations work [5min]
- [ ] Create `web/src/components/charts/` directory [2min]
- [ ] Create `web/src/utils/dateHelpers.ts` for date range logic [10min]

### Backend Tasks (2-3 hours)

#### 7.2 Visit Trends Endpoint
- [ ] Create `api/src/routes/analytics.ts` file [10min]
- [ ] Add GET `/api/analytics/visit-trends` route [10min]
- [ ] Implement controller function [1hr]
  - Accept query params: `period` (daily/weekly/monthly), `startDate`, `endDate`
  - Group visits by date (use SQL DATE function or Prisma groupBy)
  - Count visits per day/week/month
  - Return array: `[{ date: '2025-01-15', count: 12 }, ...]`
- [ ] Add date validation [15min]
- [ ] Test with different date ranges [15min]

#### 7.3 Orders Revenue Endpoint
- [ ] Add GET `/api/analytics/orders-revenue` route [10min]
- [ ] Implement controller function [45min]
  - Group orders by date
  - Sum totalAmount per day/week/month
  - Filter by status (only DELIVERED orders count as revenue)
  - Return array: `[{ date: '2025-01-15', revenue: 45000 }, ...]`
- [ ] Test endpoint [15min]

#### 7.4 Payment Modes Breakdown
- [ ] Add GET `/api/analytics/payment-modes` route [10min]
- [ ] Implement controller function [30min]
  - Group payments by paymentMode
  - Sum amounts per mode
  - Calculate percentages
  - Return: `[{ mode: 'CASH', amount: 50000, percentage: 45 }, ...]`
- [ ] Test endpoint [10min]

#### 7.5 Territory Performance (Optional)
- [ ] Add GET `/api/analytics/territory-performance` route [10min]
- [ ] Implement controller function [30min]
  - Group by user (field rep)
  - Sum order amounts per user
  - Include user name and role
  - Sort by revenue DESC
- [ ] Test endpoint [10min]

### Frontend Tasks (3-4 hours)

#### 7.6 Analytics Page Layout
- [ ] Create `web/src/pages/Analytics.tsx` [15min]
- [ ] Add Analytics route to App.tsx (path: `/analytics`) [5min]
- [ ] Add Navigation component [5min]
- [ ] Create page header with title and date range selector [30min]

#### 7.7 Date Range Selector Component
- [ ] Create `web/src/components/analytics/DateRangeSelector.tsx` [45min]
  - Preset buttons: Today, This Week, This Month, This Quarter, This Year, Custom
  - Custom date picker (HTML5 date inputs)
  - State management for selected range
  - Pass selected range to parent via callback
- [ ] Style with Tailwind [15min]

#### 7.8 Visit Trends Line Chart
- [ ] Create `web/src/components/charts/VisitTrendsChart.tsx` [45min]
  - Fetch data from `/api/analytics/visit-trends`
  - Use recharts LineChart component
  - X-axis: dates, Y-axis: visit count
  - Add tooltip showing exact values
  - Add responsive container
- [ ] Add loading skeleton [10min]
- [ ] Add empty state [10min]
- [ ] Style with teal color scheme [10min]

#### 7.9 Revenue Bar Chart
- [ ] Create `web/src/components/charts/RevenueChart.tsx` [45min]
  - Fetch data from `/api/analytics/orders-revenue`
  - Use recharts BarChart component
  - X-axis: dates, Y-axis: revenue amount (₹)
  - Add tooltip with formatted currency
  - Add responsive container
- [ ] Add loading state [10min]
- [ ] Style with amber color scheme [10min]

#### 7.10 Payment Mode Pie Chart
- [ ] Create `web/src/components/charts/PaymentModeChart.tsx` [45min]
  - Fetch data from `/api/analytics/payment-modes`
  - Use recharts PieChart component
  - Show percentages in legend
  - Add tooltip with amounts and percentages
  - Use different colors for each mode
- [ ] Add loading state [10min]
- [ ] Add empty state [10min]

#### 7.11 Revenue Area Chart (Alternative to Bar)
- [ ] Create `web/src/components/charts/RevenueAreaChart.tsx` [30min]
  - Use recharts AreaChart component
  - Gradient fill for visual appeal
  - Same data as bar chart
- [ ] Add toggle to switch between bar/area view [20min]

### Testing & Deployment (1 hour)

#### 7.12 Manual Testing
- [ ] Test all charts load data correctly [10min]
- [ ] Test date range selector updates charts [10min]
- [ ] Verify chart tooltips show correct values [5min]
- [ ] Test on mobile (charts are responsive) [10min]
- [ ] Test empty states (no data scenarios) [5min]
- [ ] Test loading states [5min]

#### 7.13 Deployment
- [ ] Commit changes: "feat: Add analytics page with charts" [5min]
- [ ] Deploy to production [10min]
- [ ] Test in production [10min]

---

## DAY 8: Reports Module (8 hours)

**Goal**: Add comprehensive reporting with CSV/PDF export

### Backend Tasks (4-5 hours)

#### 8.1 Reports Routes Setup
- [ ] Create `api/src/routes/reports.ts` file [10min]
- [ ] Add routes for visit/order/payment reports [15min]

#### 8.2 Visit Report Endpoint
- [ ] Add GET `/api/reports/visits` route [10min]
- [ ] Implement controller function [1hr]
  - Accept filters: startDate, endDate, contactId, status
  - Fetch visits with filters
  - Include contact info, photos, GPS coordinates
  - Support pagination
  - Return structured data
- [ ] Add query optimization (select only needed fields) [20min]
- [ ] Test with various filters [15min]

#### 8.3 Order Report Endpoint
- [ ] Add GET `/api/reports/orders` route [10min]
- [ ] Implement controller function [1hr]
  - Accept filters: startDate, endDate, contactId, status, minAmount, maxAmount
  - Fetch orders with items
  - Include contact info, payment status
  - Calculate totals (total orders, total revenue)
  - Support pagination
- [ ] Test endpoint [15min]

#### 8.4 Payment Report Endpoint
- [ ] Add GET `/api/reports/payments` route [10min]
- [ ] Implement controller function [45min]
  - Accept filters: startDate, endDate, paymentMode, contactId
  - Fetch payments with order info
  - Calculate totals (total collected, by mode)
  - Support pagination
- [ ] Test endpoint [15min]

#### 8.5 CSV Export Utility
- [ ] Create `api/src/utils/csv.ts` file [15min]
- [ ] Implement `generateCSV` function [45min]
  ```typescript
  // Convert array of objects to CSV string
  // Handle escaping, quotes, special characters
  // Support custom headers
  ```
- [ ] Add CSV download endpoints:
  - GET `/api/reports/visits/csv` [20min]
  - GET `/api/reports/orders/csv` [20min]
  - GET `/api/reports/payments/csv` [20min]
- [ ] Test CSV generation [15min]

#### 8.6 PDF Export Utility (Optional - Can skip if time-constrained)
- [ ] Install pdfkit: `npm install pdfkit` [5min]
- [ ] Create `api/src/utils/pdf.ts` file [15min]
- [ ] Implement basic PDF report template [1hr]
  - Header with company logo/name
  - Report title and date range
  - Table with data
  - Footer with totals
- [ ] Add PDF endpoints (similar to CSV) [30min]
- [ ] Test PDF generation [15min]

### Frontend Tasks (3-4 hours)

#### 8.7 Reports Page Layout
- [ ] Create `web/src/pages/Reports.tsx` [20min]
- [ ] Add Reports route to App.tsx (path: `/reports`) [5min]
- [ ] Add Navigation component [5min]
- [ ] Create two-column layout: Filter sidebar + Results table [30min]

#### 8.8 Report Filter Sidebar
- [ ] Create `web/src/components/reports/ReportFilters.tsx` [1hr]
  - Report type selector (Visits/Orders/Payments)
  - Date range picker (start/end dates)
  - Contact search/select dropdown
  - Status filter (for visits/orders)
  - Payment mode filter (for payments)
  - Amount range filter (min/max - for orders)
  - "Generate Report" button
  - "Reset Filters" button
- [ ] Add form validation [20min]
- [ ] Style with Tailwind [20min]

#### 8.9 Report Results Table
- [ ] Create `web/src/components/reports/ReportTable.tsx` [45min]
  - Dynamic columns based on report type
  - Sortable columns (click header to sort)
  - Show loading skeleton while fetching
  - Show empty state if no results
  - Add pagination controls
- [ ] Add row click to view details [20min]
- [ ] Add summary footer (totals) [20min]

#### 8.10 Export Buttons
- [ ] Create export button group (CSV/PDF/Excel) [30min]
  - CSV export: download from `/api/reports/{type}/csv`
  - PDF export: download from `/api/reports/{type}/pdf`
  - Excel: use CSV for now (rename to .xlsx)
- [ ] Add loading state during export [15min]
- [ ] Add success notification after download [10min]
- [ ] Handle export errors [10min]

#### 8.11 Report Preview
- [ ] Add preview toggle (Table view / Print preview) [30min]
- [ ] Create print-friendly CSS styles [20min]
- [ ] Add "Print Report" button (browser print) [15min]

### Testing & Deployment (1 hour)

#### 8.12 Manual Testing
- [ ] Test visit report with filters [10min]
- [ ] Test order report with filters [10min]
- [ ] Test payment report with filters [10min]
- [ ] Test CSV export downloads correctly [5min]
- [ ] Test PDF export (if implemented) [5min]
- [ ] Test pagination works [5min]
- [ ] Test on mobile [10min]

#### 8.13 Deployment
- [ ] Commit changes: "feat: Add reports module with CSV/PDF export" [5min]
- [ ] Deploy to production [10min]
- [ ] Test exports in production [10min]

---

## DAY 9: User Management (Admin Panel) (8 hours)

**Goal**: Allow admins to manage users, roles, and territories

### Backend Tasks (3-4 hours)

#### 9.1 User Management Routes
- [ ] Create `api/src/routes/users.ts` (admin only) [10min]
- [ ] Add role-based middleware (adminOnly) [20min]
  ```typescript
  // Only ADMIN and MANAGER can access
  ```

#### 9.2 List Users Endpoint
- [ ] Add GET `/api/users` route [10min]
- [ ] Implement controller function [30min]
  - Fetch all users (exclude passwords)
  - Include role, status, territory
  - Support pagination and search
  - Sort by createdAt DESC
- [ ] Test endpoint [10min]

#### 9.3 Create User Endpoint
- [ ] Add POST `/api/users` route [10min]
- [ ] Implement controller function [45min]
  - Validate email (unique, valid format)
  - Validate phone (unique if provided)
  - Hash password with bcrypt
  - Set role (ADMIN, MANAGER, FIELD_REP)
  - Set status (ACTIVE by default)
  - Send welcome email (optional)
- [ ] Add input validation [20min]
- [ ] Test endpoint [15min]

#### 9.4 Update User Endpoint
- [ ] Add PUT `/api/users/:id` route [10min]
- [ ] Implement controller function [30min]
  - Update name, email, phone, role
  - Prevent admins from demoting themselves
  - Update password only if provided
- [ ] Add validation [15min]
- [ ] Test endpoint [10min]

#### 9.5 Deactivate/Activate User Endpoint
- [ ] Add PATCH `/api/users/:id/status` route [10min]
- [ ] Implement controller function [20min]
  - Toggle ACTIVE/INACTIVE status
  - Prevent admins from deactivating themselves
  - Log status change
- [ ] Test endpoint [10min]

#### 9.6 Assign Territory Endpoint
- [ ] Add PATCH `/api/users/:id/territory` route [10min]
- [ ] Implement controller function [20min]
  - Update user's assigned territory
  - Validate territory exists
- [ ] Test endpoint [10min]

#### 9.7 User Invitation System (Optional)
- [ ] Add POST `/api/users/invite` route [10min]
- [ ] Implement controller function [30min]
  - Generate unique invitation token
  - Send email with signup link
  - Store token in database
- [ ] Create invitation acceptance endpoint [30min]
- [ ] Test flow [15min]

### Frontend Tasks (3-4 hours)

#### 9.8 Users List Page
- [ ] Create `web/src/pages/admin/Users.tsx` [20min]
- [ ] Add Users route (path: `/admin/users`) [5min]
- [ ] Add admin-only route guard [15min]
  ```tsx
  // Redirect if user.role !== 'ADMIN'
  ```
- [ ] Create table layout [30min]
  - Columns: Name, Email, Role, Territory, Status, Actions
  - Show loading skeleton
  - Add pagination
  - Add search bar

#### 9.9 Add User Modal
- [ ] Create `web/src/components/admin/AddUserModal.tsx` [45min]
  - Form fields: name, email, phone, password, role
  - Validation (all fields required except phone)
  - Submit to POST `/api/users`
  - Show success/error messages
  - Close modal on success
- [ ] Style with Tailwind modal [20min]
- [ ] Add "Add User" button to open modal [10min]

#### 9.10 Edit User Modal
- [ ] Create `web/src/components/admin/EditUserModal.tsx` [45min]
  - Pre-fill form with user data
  - Form fields: name, email, phone, role
  - Password field (optional - only if changing)
  - Submit to PUT `/api/users/:id`
  - Show success/error messages
- [ ] Add edit button in table row [10min]

#### 9.11 Deactivate/Activate Toggle
- [ ] Add status toggle in table [20min]
  - Show "Active" (green) or "Inactive" (red) badge
  - Click to toggle status
  - Confirm before deactivating
  - Call PATCH `/api/users/:id/status`
- [ ] Add visual feedback (loading state) [10min]

#### 9.12 Assign Territory Dropdown
- [ ] Fetch territories list [15min]
- [ ] Add territory dropdown in edit modal [20min]
- [ ] Call PATCH `/api/users/:id/territory` on change [15min]

#### 9.13 User Details View
- [ ] Create user detail page (optional) [30min]
  - Show full user info
  - Show activity stats (visits, orders, revenue)
  - Show recent activity
- [ ] Add "View Details" link in table [10min]

### Testing & Deployment (1 hour)

#### 9.14 Manual Testing
- [ ] Test adding new user [5min]
- [ ] Test editing user [5min]
- [ ] Test deactivating user [5min]
- [ ] Test role changes [5min]
- [ ] Test admin cannot deactivate themselves [5min]
- [ ] Test search and pagination [5min]
- [ ] Test on mobile [10min]

#### 9.15 Deployment
- [ ] Commit: "feat: Add user management admin panel" [5min]
- [ ] Deploy to production [10min]
- [ ] Test in production [15min]

---

## DAY 10: Territory Management (8 hours)

**Goal**: Manage territories and assign users

### Backend Tasks (3-4 hours)

#### 10.1 Territory Model & Migration
- [ ] Create Prisma model for Territory [20min]
  ```prisma
  model Territory {
    id        String   @id @default(cuid())
    name      String   @unique
    state     String
    city      String?
    pincode   String?
    isActive  Boolean  @default(true)
    users     User[]
    createdAt DateTime @default(now())
    updatedAt DateTime @updatedAt
  }
  ```
- [ ] Run migration: `npx prisma migrate dev --name add_territories` [10min]
- [ ] Update User model with territory relation [10min]

#### 10.2 Territory CRUD Endpoints
- [ ] Create `api/src/routes/territories.ts` [10min]
- [ ] Add GET `/api/territories` route [10min]
- [ ] Implement list territories controller [30min]
  - Fetch all territories
  - Include user count
  - Support search by name/state
  - Support pagination
- [ ] Add POST `/api/territories` route [10min]
- [ ] Implement create territory controller [30min]
  - Validate name is unique
  - Validate state is valid (India/Nepal states)
  - Set isActive = true by default
- [ ] Add PUT `/api/territories/:id` route [10min]
- [ ] Implement update territory controller [20min]
- [ ] Add DELETE `/api/territories/:id` route [10min]
- [ ] Implement delete territory controller [20min]
  - Soft delete (set isActive = false)
  - Check if territory has users assigned
- [ ] Test all endpoints [20min]

#### 10.3 Territory Performance Endpoint
- [ ] Add GET `/api/territories/:id/stats` route [10min]
- [ ] Implement controller function [45min]
  - Count users in territory
  - Count total visits by users in territory
  - Count total orders by users in territory
  - Sum total revenue by users in territory
  - Calculate average order value
- [ ] Test endpoint [15min]

#### 10.4 Assign Users to Territory
- [ ] Add POST `/api/territories/:id/assign-users` route [10min]
- [ ] Implement controller function [30min]
  - Accept array of user IDs
  - Update users' territory field
  - Validate all user IDs exist
- [ ] Test endpoint [10min]

### Frontend Tasks (3-4 hours)

#### 10.5 Territories List Page
- [ ] Create `web/src/pages/admin/Territories.tsx` [20min]
- [ ] Add Territories route (path: `/admin/territories`) [5min]
- [ ] Add admin-only route guard [10min]
- [ ] Create table layout [30min]
  - Columns: Name, State, City, Users, Status, Actions
  - Add search bar
  - Add pagination
  - Add "Add Territory" button

#### 10.6 Add Territory Modal
- [ ] Create `web/src/components/admin/AddTerritoryModal.tsx` [45min]
  - Form fields: name, state, city, pincode
  - State dropdown (India states list)
  - Validation
  - Submit to POST `/api/territories`
- [ ] Style modal [20min]

#### 10.7 Edit Territory Modal
- [ ] Create `web/src/components/admin/EditTerritoryModal.tsx` [30min]
  - Pre-fill form with territory data
  - Same fields as add modal
  - Submit to PUT `/api/territories/:id`
- [ ] Add edit button in table [10min]

#### 10.8 Delete Territory Confirmation
- [ ] Add delete button in table [10min]
- [ ] Create confirmation modal [20min]
  - Show warning if territory has users
  - Confirm before deleting
  - Call DELETE `/api/territories/:id`

#### 10.9 Territory Performance Dashboard
- [ ] Create `web/src/components/admin/TerritoryStats.tsx` [45min]
  - Fetch stats from `/api/territories/:id/stats`
  - Display stats cards (users, visits, orders, revenue)
  - Show user list in territory
  - Add charts (optional)
- [ ] Add "View Stats" button in table [10min]

#### 10.10 Assign Users to Territory
- [ ] Create assign users modal [45min]
  - Show list of all users
  - Checkbox to select users
  - Show currently assigned users
  - Submit to `/api/territories/:id/assign-users`
- [ ] Add "Assign Users" button [10min]

#### 10.11 Map View (Optional - Can skip)
- [ ] Install Leaflet: `npm install leaflet react-leaflet` [5min]
- [ ] Create map component [1hr]
  - Show territories on map (pins)
  - Show user locations
  - Click territory to see details
- [ ] Add map view toggle [15min]

### Testing & Deployment (1 hour)

#### 10.12 Manual Testing
- [ ] Test adding territory [5min]
- [ ] Test editing territory [5min]
- [ ] Test deleting territory [5min]
- [ ] Test assigning users [5min]
- [ ] Test territory stats display correctly [10min]
- [ ] Test search and pagination [5min]
- [ ] Test on mobile [10min]

#### 10.13 Deployment
- [ ] Commit: "feat: Add territory management" [5min]
- [ ] Deploy to production [10min]
- [ ] Test in production [15min]

---

# WEEK 3: Mobile Optimization & PWA (Days 11-15)

---

## DAY 11: Responsive Design Audit (8 hours)

**Goal**: Ensure all pages work perfectly on mobile devices

### Audit & Planning (1 hour)

#### 11.1 Create Audit Checklist
- [ ] Create `docs/RESPONSIVE_AUDIT.md` file [15min]
- [ ] List all pages to audit [15min]
  - Dashboard, Analytics, Reports
  - Contacts, Products, Visits, Orders, Payments
  - User Management, Territory Management
  - Login, Signup
- [ ] Document target devices [10min]
  - iPhone SE (375px)
  - iPhone 12 (390px)
  - iPad (768px)
  - Desktop (1024px+)

#### 11.2 Setup Testing Environment
- [ ] Use browser DevTools responsive mode [10min]
- [ ] Test on actual mobile device (if available) [10min]

### Mobile Navigation (1-2 hours)

#### 11.3 Hamburger Menu
- [ ] Create `web/src/components/MobileMenu.tsx` [45min]
  - Hamburger icon (3 lines)
  - Slide-in menu from left
  - Close button
  - Same navigation links as desktop
  - User profile section
  - Logout button
- [ ] Add state management (open/closed) [15min]
- [ ] Add animations (slide in/out) [20min]
- [ ] Test on mobile [10min]

#### 11.4 Bottom Navigation (Optional)
- [ ] Create `web/src/components/BottomNav.tsx` [45min]
  - Fixed at bottom on mobile
  - Icons for: Dashboard, Visits, Orders, Payments, More
  - Active state highlighting
  - Hide on scroll down, show on scroll up
- [ ] Add to all pages [20min]
- [ ] Test on mobile [10min]

### Page-by-Page Fixes (4-5 hours)

#### 11.5 Dashboard Page
- [ ] Test on mobile devices [10min]
- [ ] Fix stats cards: grid-cols-1 on mobile, grid-cols-3 on desktop [15min]
- [ ] Fix quick actions: grid-cols-2 on mobile, grid-cols-4 on desktop [15min]
- [ ] Fix activity feed: full width on mobile [10min]
- [ ] Reduce padding/margins on mobile [15min]
- [ ] Test touch targets (minimum 44x44px) [10min]

#### 11.6 Analytics Page
- [ ] Test charts on mobile [10min]
- [ ] Make charts responsive (full width on mobile) [20min]
- [ ] Move date range selector above charts on mobile [15min]
- [ ] Fix filter sidebar: collapse to accordion on mobile [30min]
- [ ] Test scrolling and touch interactions [10min]

#### 11.7 Reports Page
- [ ] Fix filter sidebar: move to collapsible section on mobile [30min]
- [ ] Make table horizontally scrollable on mobile [15min]
- [ ] Fix export buttons: stack vertically on mobile [15min]
- [ ] Test table interactions [10min]

#### 11.8 Contacts List Page
- [ ] Test table on mobile [10min]
- [ ] Consider card view instead of table on mobile [45min]
  ```tsx
  // Show cards with contact info instead of table rows
  ```
- [ ] Fix search bar width [10min]
- [ ] Fix filter buttons layout [15min]
- [ ] Test pagination controls [10min]

#### 11.9 Products List Page
- [ ] Similar fixes as Contacts [30min]
- [ ] Test grid/list view toggle [10min]
- [ ] Fix product cards on mobile [20min]

#### 11.10 Visits List Page
- [ ] Test on mobile [10min]
- [ ] Fix table or switch to cards [30min]
- [ ] Fix date filters layout [15min]
- [ ] Test photo viewing on mobile [10min]

#### 11.11 Orders List Page
- [ ] Test on mobile [10min]
- [ ] Fix table layout [30min]
- [ ] Fix status filter dropdown [15min]
- [ ] Fix action buttons [15min]

#### 11.12 Payments List Page
- [ ] Test on mobile [10min]
- [ ] Fix table or switch to cards [30min]
- [ ] Fix filters (amount range, search) [20min]

#### 11.13 Forms (Order Form, Visit Form, Payment Form)
- [ ] Test all forms on mobile [15min]
- [ ] Fix input field widths (full width on mobile) [20min]
- [ ] Fix button sizes (larger touch targets) [15min]
- [ ] Fix dropdown widths [15min]
- [ ] Test keyboard interactions [10min]

#### 11.14 Modals and Popups
- [ ] Test all modals on mobile [15min]
- [ ] Fix modal widths (full screen on mobile) [20min]
- [ ] Fix modal close buttons (larger) [10min]
- [ ] Test scrolling in modals [10min]

### Final Testing (1 hour)

#### 11.15 Cross-Device Testing
- [ ] Test on iPhone SE (375px) [15min]
- [ ] Test on iPhone 12 (390px) [15min]
- [ ] Test on iPad (768px) [15min]
- [ ] Test on Android device (if available) [15min]

#### 11.16 Orientation Testing
- [ ] Test portrait orientation [10min]
- [ ] Test landscape orientation [10min]
- [ ] Fix layout issues in landscape [20min]

#### 11.17 Touch Interactions
- [ ] Verify all buttons are easy to tap [10min]
- [ ] Verify swipe gestures work (if any) [5min]
- [ ] Verify scrolling is smooth [5min]

---

## DAY 12: PWA Setup & Offline Mode (8 hours)

**Goal**: Make the app installable and work offline

### PWA Setup (2-3 hours)

#### 12.1 Install Dependencies
- [ ] Install vite-plugin-pwa: `npm install -D vite-plugin-pwa` [5min]
- [ ] Install workbox: `npm install -D workbox-window` [5min]
- [ ] Install localforage: `npm install localforage` [5min]

#### 12.2 Configure Vite PWA Plugin
- [ ] Update `web/vite.config.ts` [30min]
  ```typescript
  import { VitePWA } from 'vite-plugin-pwa';

  export default defineConfig({
    plugins: [
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        manifest: { /* ... */ },
        workbox: { /* ... */ }
      })
    ]
  });
  ```
- [ ] Configure manifest options [30min]
  - name: "FieldForce CRM"
  - short_name: "FieldForce"
  - description: "Field force management system"
  - theme_color: "#0d9488" (teal)
  - background_color: "#ffffff"
  - display: "standalone"
  - icons: 192x192, 512x512
- [ ] Create app icons (192x192, 512x512) [30min]
  - Use online icon generator or Figma
  - Place in `web/public/` folder

#### 12.3 Service Worker Configuration
- [ ] Configure workbox options [45min]
  ```typescript
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
    runtimeCaching: [
      {
        urlPattern: /^https:\/\/api\.*/,
        handler: 'NetworkFirst',
        options: {
          cacheName: 'api-cache',
          expiration: { maxEntries: 50, maxAgeSeconds: 300 }
        }
      }
    ]
  }
  ```
- [ ] Test service worker registration [15min]

#### 12.4 Add to Home Screen Prompt
- [ ] Create `web/src/components/InstallPrompt.tsx` [45min]
  - Detect if app is installable
  - Show prompt: "Add to Home Screen"
  - Show instructions for iOS (different from Android)
  - Dismiss button
  - Show only once per user (localStorage)
- [ ] Style prompt with Tailwind [15min]
- [ ] Test on mobile device [15min]

### Offline Storage (2-3 hours)

#### 12.5 Setup LocalForage
- [ ] Create `web/src/utils/offlineStorage.ts` [30min]
  ```typescript
  import localforage from 'localforage';

  const store = localforage.createInstance({
    name: 'fieldforce-crm',
    storeName: 'offline_data'
  });
  ```

#### 12.6 Offline Visits Storage
- [ ] Create offline visits queue [1hr]
  - Save visit data to IndexedDB when offline
  - Include photos (base64 or Blob)
  - Store GPS coordinates
  - Store timestamp
  - Add "synced" flag
- [ ] Add sync function [45min]
  - Check if online
  - Fetch unsynced visits from IndexedDB
  - POST to API
  - Mark as synced on success
  - Retry on failure

#### 12.7 Offline Orders Storage
- [ ] Create offline orders queue [45min]
  - Save order data to IndexedDB when offline
  - Store order items
  - Add "synced" flag
- [ ] Add sync function [30min]
  - Similar to visits sync

#### 12.8 Background Sync
- [ ] Create `web/src/utils/syncManager.ts` [45min]
  - Listen for online event
  - Trigger sync for visits, orders, payments
  - Show sync status in UI
- [ ] Add sync status indicator [30min]
  - Green dot: online and synced
  - Yellow dot: syncing
  - Red dot: offline with pending changes
  - Show in navigation bar

### Offline UI Indicators (1-2 hours)

#### 12.9 Offline Banner
- [ ] Create `web/src/components/OfflineBanner.tsx` [30min]
  - Show banner at top when offline
  - Message: "You're offline. Changes will sync when online."
  - Yellow background
  - Dismiss button
- [ ] Add to App.tsx [10min]

#### 12.10 Offline-Ready Badges
- [ ] Add "Saved Offline" badge to items [20min]
  - Show on visits/orders created offline
  - Gray badge with cloud icon
  - Remove after syncing

#### 12.11 Sync Status Page
- [ ] Create `web/src/pages/SyncStatus.tsx` [45min]
  - List all unsynced items
  - Show sync progress
  - Manual "Sync Now" button
  - Clear synced items
- [ ] Add route (path: `/sync-status`) [5min]

### Testing (1-2 hours)

#### 12.12 Offline Testing
- [ ] Test app works offline (basic navigation) [10min]
- [ ] Test creating visit offline [15min]
- [ ] Test creating order offline [15min]
- [ ] Test photos saved offline [15min]
- [ ] Test sync when back online [15min]
- [ ] Test partial sync failures [15min]

#### 12.13 Installation Testing
- [ ] Test "Add to Home Screen" on Android [15min]
- [ ] Test on iOS (manual instructions) [15min]
- [ ] Verify app icon shows correctly [10min]
- [ ] Verify standalone mode works [10min]

#### 12.14 Deployment
- [ ] Commit: "feat: Add PWA support with offline mode" [5min]
- [ ] Deploy to production [10min]
- [ ] Test PWA in production [20min]

---

## DAY 13: Camera & GPS Integration (8 hours)

**Goal**: Improve photo capture and GPS accuracy

### Camera Improvements (3-4 hours)

#### 13.1 Enhanced Camera Component
- [ ] Update `web/src/utils/camera.ts` [1hr]
  - Support front/back camera toggle
  - Support flash on/off
  - Support zoom controls
  - Add camera permission check
  - Handle permission denied gracefully

#### 13.2 Photo Compression
- [ ] Install browser-image-compression: `npm install browser-image-compression` [5min]
- [ ] Create `web/src/utils/imageCompression.ts` [45min]
  ```typescript
  // Compress image to 70% quality
  // Max width: 1200px
  // Convert to JPEG
  // Target size: <500KB
  ```
- [ ] Integrate with visit form [30min]
- [ ] Test compression reduces file size by 70%+ [15min]

#### 13.3 Multiple Photos Support
- [ ] Update visit form to support multiple photos [45min]
  - Allow up to 5 photos per visit
  - Show thumbnails of captured photos
  - Delete photo button
  - Reorder photos (drag and drop)
- [ ] Update backend to handle multiple photos [30min]
- [ ] Test uploading multiple photos [15min]

#### 13.4 Photo Preview & Retake
- [ ] Add photo preview after capture [30min]
  - Show preview with "Retake" and "Use Photo" buttons
  - Zoom in on preview
  - Rotate photo if needed
- [ ] Add photo editing (optional) [1hr]
  - Crop tool
  - Brightness/contrast adjustments
  - Filters (grayscale, sepia)

### GPS Improvements (2-3 hours)

#### 13.5 Enhanced GPS Utility
- [ ] Update `web/src/utils/location.ts` [1hr]
  ```typescript
  // Request high accuracy GPS
  // Set timeout (10 seconds)
  // Retry if failed
  // Fallback to low accuracy
  // Cache last known location
  ```
- [ ] Add GPS accuracy indicator [30min]
  - Show accuracy in meters
  - Color code: Green (<20m), Yellow (20-50m), Red (>50m)
  - Show in visit form

#### 13.6 Current Location Button
- [ ] Add "Current Location" button to forms [30min]
  - Show loading spinner while fetching
  - Auto-fill GPS coordinates
  - Show accuracy
  - Allow manual override
- [ ] Test on different devices [15min]

#### 13.7 Location History
- [ ] Create location tracking service [1hr]
  - Store GPS coordinates in IndexedDB
  - Timestamp each location
  - Limit to last 100 locations
  - Clear old locations (>7 days)
- [ ] Create location history page [45min]
  - Show list of tracked locations
  - Show on map (optional)
  - Export to CSV
- [ ] Test location tracking [15min]

#### 13.8 Background Location Tracking (Optional - Advanced)
- [ ] Request background location permission [20min]
- [ ] Implement background tracking [1hr]
  - Track every 5 minutes
  - Only when app is in use
  - Stop after 1 hour of inactivity
- [ ] Add privacy notice [15min]

### Testing (1-2 hours)

#### 13.9 Camera Testing
- [ ] Test camera on different devices [20min]
- [ ] Test photo compression works [10min]
- [ ] Test multiple photos upload [15min]
- [ ] Test photo preview and retake [10min]

#### 13.10 GPS Testing
- [ ] Test GPS accuracy on different devices [20min]
- [ ] Test indoor vs outdoor accuracy [15min]
- [ ] Test GPS timeout handling [10min]
- [ ] Test location history [10min]

#### 13.11 Deployment
- [ ] Commit: "feat: Improve camera and GPS integration" [5min]
- [ ] Deploy to production [10min]
- [ ] Test in production [20min]

---

## DAY 14: Performance Optimization (8 hours)

**Goal**: Optimize app for speed and efficiency

### Code Splitting & Lazy Loading (2 hours)

#### 14.1 Implement Code Splitting
- [ ] Lazy load all page components [1hr]
  ```typescript
  const Dashboard = lazy(() => import('./pages/Dashboard'));
  const Analytics = lazy(() => import('./pages/Analytics'));
  // ... etc
  ```
- [ ] Add Suspense with loading fallback [30min]
  ```typescript
  <Suspense fallback={<LoadingSpinner />}>
    <Routes>...</Routes>
  </Suspense>
  ```
- [ ] Test lazy loading works [15min]
- [ ] Measure bundle size reduction [15min]

#### 14.2 Dynamic Imports for Heavy Libraries
- [ ] Lazy load recharts [20min]
  ```typescript
  // Only load charts when Analytics page is opened
  ```
- [ ] Lazy load PDF generation library [15min]
- [ ] Test dynamic imports [10min]

### Bundle Size Optimization (2 hours)

#### 14.3 Analyze Bundle Size
- [ ] Install webpack-bundle-analyzer: `npm install -D webpack-bundle-analyzer` [5min]
- [ ] Add analyze script to package.json [10min]
- [ ] Run bundle analyzer [10min]
- [ ] Identify large dependencies [15min]

#### 14.4 Tree Shaking & Dead Code Elimination
- [ ] Remove unused imports across all files [30min]
- [ ] Remove unused dependencies from package.json [20min]
- [ ] Configure Vite for better tree shaking [15min]
- [ ] Test app still works [15min]

#### 14.5 Optimize Images
- [ ] Convert PNG icons to SVG where possible [30min]
- [ ] Use WebP format for images [20min]
- [ ] Compress existing images [15min]

### Database & API Optimization (2 hours)

#### 14.6 Add Database Indexes
- [ ] Analyze slow queries with Prisma logs [20min]
- [ ] Add indexes to frequently queried fields [45min]
  ```prisma
  @@index([createdAt])
  @@index([status])
  @@index([contactId])
  @@index([fieldRepId])
  ```
- [ ] Run migration [10min]
- [ ] Test query performance improvement [15min]

#### 14.7 Optimize Prisma Queries
- [ ] Use `select` instead of fetching all fields [30min]
  ```typescript
  // Only select needed fields
  prisma.visit.findMany({ select: { id: true, contactName: true } })
  ```
- [ ] Use `include` efficiently (avoid N+1 queries) [20min]
- [ ] Add query result caching (optional) [30min]

#### 14.8 API Response Compression
- [ ] Enable gzip compression in Cloudflare Workers [15min]
- [ ] Test response size reduction [10min]

### Frontend Performance (1-2 hours)

#### 14.9 Implement Virtual Scrolling
- [ ] Install react-virtual: `npm install @tanstack/react-virtual` [5min]
- [ ] Implement virtual scrolling for long lists [1hr]
  - Contacts list
  - Products list
  - Visits list
  - Orders list
  - Payments list
- [ ] Test scrolling performance [15min]

#### 14.10 Memoization
- [ ] Add React.memo to expensive components [30min]
  - Table rows
  - Chart components
  - Card components
- [ ] Use useMemo for expensive calculations [30min]
  - Filtering
  - Sorting
  - Aggregations
- [ ] Use useCallback for functions passed as props [20min]

#### 14.11 Debounce & Throttle
- [ ] Ensure all search inputs are debounced (300ms) [20min]
- [ ] Throttle scroll events (if any) [15min]

### Testing & Verification (1 hour)

#### 14.12 Performance Testing
- [ ] Run Lighthouse audit [15min]
  - Target: >90 score
- [ ] Measure First Contentful Paint [10min]
  - Target: <1.5s
- [ ] Measure Time to Interactive [10min]
  - Target: <3s
- [ ] Measure bundle size [10min]
  - Target: <500KB gzipped

#### 14.13 Load Testing
- [ ] Test with 100+ contacts/products/orders [15min]
- [ ] Test table scrolling performance [10min]
- [ ] Test search performance [10min]

#### 14.14 Deployment
- [ ] Commit: "perf: Optimize bundle size and performance" [5min]
- [ ] Deploy to production [10min]
- [ ] Run Lighthouse on production [15min]

---

## DAY 15: Push Notifications (8 hours)

**Goal**: Implement browser push notifications

### Backend Setup (3-4 hours)

#### 15.1 Install Dependencies
- [ ] Install web-push: `npm install web-push` [5min]
- [ ] Generate VAPID keys [10min]
  ```bash
  npx web-push generate-vapid-keys
  ```
- [ ] Add keys to environment variables [10min]

#### 15.2 Notification Subscription Model
- [ ] Create Prisma model for PushSubscription [20min]
  ```prisma
  model PushSubscription {
    id       String @id @default(cuid())
    userId   String
    endpoint String @unique
    keys     Json
    user     User   @relation(fields: [userId], references: [id])
  }
  ```
- [ ] Run migration [10min]

#### 15.3 Subscription Endpoints
- [ ] Create `api/src/routes/notifications.ts` [10min]
- [ ] Add POST `/api/notifications/subscribe` route [10min]
- [ ] Implement subscribe controller [30min]
  - Accept subscription object from frontend
  - Validate subscription
  - Store in database
  - Return success
- [ ] Add DELETE `/api/notifications/unsubscribe` route [10min]
- [ ] Implement unsubscribe controller [20min]
- [ ] Test endpoints [15min]

#### 15.4 Send Notification Utility
- [ ] Create `api/src/utils/push.ts` [1hr]
  ```typescript
  import webpush from 'web-push';

  export async function sendPushNotification(
    subscription: PushSubscription,
    payload: { title: string; body: string; icon?: string }
  ) {
    await webpush.sendNotification(subscription, JSON.stringify(payload));
  }
  ```
- [ ] Add batch send function [30min]
- [ ] Add error handling (remove invalid subscriptions) [20min]

#### 15.5 Notification Triggers
- [ ] Send notification when order is approved [30min]
  - Hook into order update controller
  - Send to order creator
- [ ] Send notification when payment is received [30min]
  - Hook into payment create controller
  - Send to field rep
- [ ] Send notification when visit is verified [30min]
  - Hook into visit update controller
- [ ] Test notification triggers [20min]

### Frontend Setup (2-3 hours)

#### 15.6 Service Worker for Notifications
- [ ] Update service worker to handle push events [45min]
  ```typescript
  self.addEventListener('push', (event) => {
    const data = event.data.json();
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/icon-192x192.png',
      badge: '/badge-72x72.png'
    });
  });
  ```
- [ ] Handle notification click [30min]
  - Open app when notification is clicked
  - Navigate to relevant page

#### 15.7 Request Notification Permission
- [ ] Create `web/src/utils/notifications.ts` [45min]
  ```typescript
  export async function requestNotificationPermission() {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      // Subscribe to push notifications
    }
  }
  ```
- [ ] Subscribe to push notifications [45min]
  - Get service worker registration
  - Subscribe using VAPID public key
  - Send subscription to backend
- [ ] Handle permission denied [20min]

#### 15.8 Notification Settings Page
- [ ] Create `web/src/pages/NotificationSettings.tsx` [1hr]
  - Toggle: Enable/disable notifications
  - Checkboxes: Order notifications, Payment notifications, Visit notifications
  - "Test Notification" button
  - Show current subscription status
- [ ] Add route (path: `/settings/notifications`) [5min]
- [ ] Save preferences to localStorage [20min]

#### 15.9 Notification Permission Prompt
- [ ] Create `web/src/components/NotificationPrompt.tsx` [30min]
  - Show on first login
  - Explain benefits of notifications
  - "Enable Notifications" button
  - "Maybe Later" button
  - Don't show again if dismissed 3 times
- [ ] Add to Dashboard page [10min]

### Testing (1-2 hours)

#### 15.10 Notification Testing
- [ ] Test requesting permission [10min]
- [ ] Test subscribing to notifications [10min]
- [ ] Test unsubscribing [10min]
- [ ] Test receiving notifications [15min]
- [ ] Test notification click action [10min]
- [ ] Test all notification triggers [20min]
  - Order approved
  - Payment received
  - Visit verified

#### 15.11 Cross-Browser Testing
- [ ] Test on Chrome (desktop & mobile) [15min]
- [ ] Test on Firefox [10min]
- [ ] Test on Safari (limited support) [10min]
- [ ] Test on Edge [10min]

#### 15.12 Deployment
- [ ] Add VAPID keys to production environment [10min]
- [ ] Commit: "feat: Add push notifications" [5min]
- [ ] Deploy to production [10min]
- [ ] Test notifications in production [20min]

---

## End of Week 2-3 Checklist

### Summary of Features Implemented

**Week 2 (Days 6-10):**
- ✅ Dashboard with stats cards and activity feed
- ✅ Analytics with charts (visits, revenue, payments)
- ✅ Reports module with CSV/PDF export
- ✅ User management (admin panel)
- ✅ Territory management

**Week 3 (Days 11-15):**
- ✅ Responsive design for all mobile devices
- ✅ PWA setup with offline mode
- ✅ Enhanced camera and GPS integration
- ✅ Performance optimizations (bundle size, lazy loading, virtual scrolling)
- ✅ Push notifications

### Final Testing Checklist

- [ ] All features work on mobile (iPhone, Android, iPad)
- [ ] All features work offline and sync when online
- [ ] App is installable as PWA
- [ ] Push notifications work across browsers
- [ ] Lighthouse score >90
- [ ] Bundle size <500KB gzipped
- [ ] No console errors in production

### Documentation Updates

- [ ] Update README with new features
- [ ] Document PWA installation instructions
- [ ] Document notification setup for users
- [ ] Update API documentation (if using Swagger)

---

## Next Steps

After completing Weeks 2-3, refer to **WEEK_02_TO_12_ROADMAP.md** for Week 4 onwards:
- Week 4: Advanced Features (Product enhancements, order workflow, payment automation, visit planning)
- Week 5-6: Multi-Language & Customization (i18n, voice input, custom fields, SMS/WhatsApp)
- Week 7-8: Advanced Analytics & Gamification
- Week 9: Testing & Bug Fixes
- Week 10: Polish & UX Improvements
- Week 11: Pre-Launch Preparation
- Week 12: Launch Week

---

## Time Tracking Template

Use this template to track actual time spent on each day:

| Day | Planned | Actual | Variance | Notes |
|-----|---------|--------|----------|-------|
| 6   | 8h      |        |          |       |
| 7   | 8h      |        |          |       |
| 8   | 8h      |        |          |       |
| 9   | 8h      |        |          |       |
| 10  | 8h      |        |          |       |
| 11  | 8h      |        |          |       |
| 12  | 8h      |        |          |       |
| 13  | 8h      |        |          |       |
| 14  | 8h      |        |          |       |
| 15  | 8h      |        |          |       |

**Total Planned**: 80 hours
**Total Actual**: _____
**Variance**: _____

---

**Good luck with the implementation!**
