# Migration Guide: Updating Pages to Use New Components

**Purpose**: Quick reference for updating remaining pages to use standardized components

---

## ✅ Completed Pages

1. **Dashboard.tsx** - ✅ 170 → 107 lines (-37%)
2. **ContactsList.tsx** - ✅ 347 → 304 lines (-12%)
3. **ContactForm.tsx** - ✅ Constants centralized

---

## 🔄 Pages Requiring Updates (Priority Order)

### High Priority (Has Duplicate Utilities)

1. **VisitsList.tsx** (464 lines)
   - Duplicate: `getStatusColor()`, `getOutcomeColor()`, `formatDate()`
   - Needs: PageContainer, ContentSection, StatCard, StatusBadge, Pagination, TableSkeleton
   - Estimated reduction: ~80 lines

2. **VisitDetails.tsx** (400 lines)
   - Duplicate: `formatDateTime()`, `getStatusColor()`, `getOutcomeColor()`
   - Needs: PageContainer, ContentSection, Card, StatusBadge
   - Estimated reduction: ~50 lines

3. **OrdersList.tsx** (328 lines)
   - Duplicate: `getStatusColor()`
   - Needs: PageContainer, ContentSection, StatCard, StatusBadge, Pagination, TableSkeleton
   - Estimated reduction: ~50 lines

4. **PaymentsList.tsx** (403 lines) ⚠️ **Also needs API fix**
   - Duplicate: `formatCurrency()`, `formatDate()`
   - Uses raw `fetch()` instead of `api` service
   - Needs: PageContainer, ContentSection, StatCard, StatusBadge, Pagination, TableSkeleton
   - Estimated reduction: ~70 lines

5. **PendingPayments.tsx** ⚠️ **Also needs API fix**
   - Duplicate: `formatCurrency()`, `getPriorityBadge()`
   - Uses raw `fetch()` instead of `api` service
   - Needs: PageContainer, ContentSection, Card, StatusBadge, TableSkeleton
   - Estimated reduction: ~40 lines

### Medium Priority

6. **ProductsList.tsx** (345 lines)
   - Needs: PageContainer, ContentSection, TableSkeleton, EmptyState, Pagination
   - Estimated reduction: ~40 lines

7. **ProductForm.tsx**
   - Needs: PageContainer, ContentSection (maxWidth="4xl"), Card
   - Estimated reduction: ~20 lines

8. **OrderForm.tsx**
   - Needs: PageContainer, ContentSection (maxWidth="4xl"), Card
   - Estimated reduction: ~20 lines

9. **PaymentForm.tsx**
   - Needs: PageContainer, ContentSection (maxWidth="4xl"), Card
   - Estimated reduction: ~20 lines

10. **VisitForm.tsx** (465 lines) - Large file
    - Needs: PageContainer, ContentSection (maxWidth="4xl"), Card
    - Estimated reduction: ~30 lines

---

## 📖 Step-by-Step Migration Pattern

### Step 1: Update Imports

**Before:**
```tsx
import { Navigation } from '../components/Navigation';
```

**After:**
```tsx
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, Pagination, TableSkeleton, EmptyState } from '../components/ui';
import { formatCurrency, formatDate, getVisitStatusColor, getOrderStatusColor } from '../utils';
```

---

### Step 2: Replace Layout Structure

**Before:**
```tsx
return (
  <div className="min-h-screen bg-neutral-100">
    <Navigation />
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* content */}
      </div>
    </main>
  </div>
);
```

**After:**
```tsx
return (
  <PageContainer>
    <ContentSection>
      {/* content */}
    </ContentSection>
  </PageContainer>
);

// For form pages (narrower)
return (
  <PageContainer>
    <ContentSection maxWidth="4xl">
      {/* content */}
    </ContentSection>
  </PageContainer>
);
```

---

### Step 3: Replace Stat Cards

**Before:**
```tsx
<div className="bg-white p-4 rounded-lg shadow">
  <div className="text-sm text-neutral-600">Total Orders</div>
  <div className="text-2xl font-bold text-primary-600">{stats.totalOrders}</div>
</div>
```

**After:**
```tsx
<StatCard
  title="Total Orders"
  value={stats.totalOrders}
  valueColor="text-primary-600"
/>

// With icon and click handler
<StatCard
  title="Total Orders"
  value={stats.totalOrders}
  icon={ShoppingCart}
  iconColor="text-primary-800"
  valueColor="text-primary-600"
  onClick={() => navigate('/orders')}
/>
```

---

### Step 4: Replace Status Badges

**Before:**
```tsx
<span className="px-2 py-1 text-xs font-semibold rounded-full bg-success-100 text-success-800">
  COMPLETED
</span>

// Or with getStatusColor()
<span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(visit.status)}`}>
  {visit.status.replace(/_/g, ' ')}
</span>
```

**After:**
```tsx
<StatusBadge label="COMPLETED" variant="success" />

// With formatting
<StatusBadge label={visit.status} variant="success" formatLabel />

// Using utility function
<StatusBadge
  label={visit.status}
  className={getVisitStatusColor(visit.status)}
  formatLabel
/>
```

---

### Step 5: Replace Pagination

**Before:**
```tsx
{totalPages > 1 && (
  <div className="flex justify-center items-center gap-2 mt-6">
    <button
      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
      disabled={currentPage === 1}
      className="px-4 py-2 border border-neutral-300 rounded-md disabled:opacity-50"
    >
      Previous
    </button>
    <span className="text-neutral-600">
      Page {currentPage} of {totalPages}
    </span>
    <button
      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
      disabled={currentPage === totalPages}
      className="px-4 py-2 border border-neutral-300 rounded-md disabled:opacity-50"
    >
      Next
    </button>
  </div>
)}
```

**After:**
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={totalPages}
  onPageChange={setCurrentPage}
/>
```

---

### Step 6: Replace Loading States

**Before:**
```tsx
{loading ? (
  <div className="bg-white rounded-lg shadow overflow-hidden">
    <table className="min-w-full divide-y divide-neutral-200">
      <thead className="bg-neutral-50">
        <tr>
          <th>...</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-neutral-200">
        {[...Array(5)].map((_, i) => (
          <tr key={i} className="animate-pulse">
            <td className="px-6 py-4">
              <div className="h-4 bg-neutral-200 rounded w-32"></div>
            </td>
            ...
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  // actual table
)}
```

**After:**
```tsx
{loading ? (
  <TableSkeleton
    rows={5}
    columns={7}
    headers={['Name', 'Status', 'Date', 'Amount', 'Actions']}
  />
) : (
  // actual table
)}
```

---

### Step 7: Replace Empty States

**Before:**
```tsx
{items.length === 0 && (
  <div className="text-center py-12 bg-white rounded-lg shadow">
    <Package className="mx-auto text-neutral-400 mb-4" size={48} />
    <p className="text-neutral-500">No items found</p>
  </div>
)}
```

**After:**
```tsx
{items.length === 0 && (
  <EmptyState
    icon={Package}
    message="No items found"
    description="Try adjusting your filters"
  />
)}
```

---

### Step 8: Replace Utility Functions

**Before:**
```tsx
// Local function in component
const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(amount);
};

const getStatusColor = (status: string) => {
  const colors: Record<string, string> = {
    PLANNED: 'bg-primary-100 text-primary-800',
    // ...
  };
  return colors[status] || 'bg-neutral-100...';
};
```

**After:**
```tsx
// Import from utils
import { formatCurrency, formatDate, getVisitStatusColor } from '../utils';

// Use directly
<span>{formatCurrency(order.totalAmount)}</span>
<span>{formatDate(order.createdAt)}</span>
<span className={getVisitStatusColor(visit.status)}>
  {formatStatusLabel(visit.status)}
</span>
```

---

### Step 9: Fix API Inconsistency (PaymentsList, PendingPayments)

**Before:**
```tsx
const response = await fetch(`${import.meta.env.VITE_API_URL}/api/payments?${params}`, {
  headers: { Authorization: `Bearer ${token}` },
});
const data = await response.json();
if (data.success) {
  setPayments(data.data.payments);
}
```

**After:**
```tsx
const response = await api.getPayments(params);
if (response.success && response.data) {
  setPayments(response.data.payments);
}
```

**Note**: May need to add `getPayments()` method to `api.ts` if not present.

---

## 🎯 Example: Complete Refactor

### Before (VisitsList.tsx excerpt):
```tsx
import { Navigation } from '../components/Navigation';

export function VisitsList() {
  // ... state

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNED: 'bg-primary-100 text-primary-800',
      IN_PROGRESS: 'bg-warn-100 text-warn-800',
      COMPLETED: 'bg-success-100 text-success-800',
      // ... 10 more lines
    };
    return colors[status] || 'bg-neutral-100 text-neutral-800';
  };

  return (
    <div className="min-h-screen bg-neutral-100">
      <Navigation />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Stats - 15 lines of markup */}
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-neutral-600">Total Visits</div>
            <div className="text-2xl font-bold text-primary-600">{stats.total}</div>
          </div>

          {/* Table with skeleton - 30 lines */}
          {loading ? (
            <table>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="animate-pulse">...</tr>
              ))}
            </table>
          ) : (
            <table>...</table>
          )}

          {/* Pagination - 15 lines */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))}>Previous</button>
              <span>Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}>Next</button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
```

### After (VisitsList.tsx excerpt):
```tsx
import { PageContainer, ContentSection, Card } from '../components/layout';
import { StatCard, StatusBadge, Pagination, TableSkeleton } from '../components/ui';
import { formatDateTime, getVisitStatusColor, formatStatusLabel } from '../utils';

export function VisitsList() {
  // ... state (no local utility functions!)

  return (
    <PageContainer>
      <ContentSection>
        {/* Stats - 1 component */}
        <StatCard
          title="Total Visits"
          value={stats.total}
          valueColor="text-primary-600"
        />

        {/* Table with skeleton - 1 component */}
        {loading ? (
          <TableSkeleton rows={5} columns={6} headers={['Date', 'Contact', 'Status', 'Outcome', 'Type', 'Actions']} />
        ) : (
          <table>
            ...
            <StatusBadge
              label={visit.status}
              className={getVisitStatusColor(visit.status)}
              formatLabel
            />
            <span>{formatDateTime(visit.visitDate)}</span>
            ...
          </table>
        )}

        {/* Pagination - 1 component */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </ContentSection>
    </PageContainer>
  );
}
```

**Lines Saved**: ~80 lines

---

## ⚡ Quick Checklist Per Page

- [ ] Import layout components (`PageContainer`, `ContentSection`, `Card`)
- [ ] Import UI components (`StatCard`, `StatusBadge`, `Pagination`, `TableSkeleton`, `EmptyState`)
- [ ] Import utilities (`formatCurrency`, `formatDate`, `getXStatusColor`, `formatStatusLabel`)
- [ ] Import constants if needed (`DISTRIBUTION_TYPES`, etc.)
- [ ] Replace layout wrapper
- [ ] Replace stat cards
- [ ] Replace status badges
- [ ] Replace pagination
- [ ] Replace loading skeleton
- [ ] Replace empty state
- [ ] Remove local utility functions
- [ ] Test build: `npm run build`

---

## 🎓 Benefits Recap

| Benefit | Impact |
|---------|--------|
| **Code Reduction** | ~80 lines per list page, ~30 lines per form page |
| **Single Source of Truth** | Change once, applies everywhere |
| **Consistency** | All pages look and behave the same |
| **Type Safety** | TypeScript catches errors |
| **Maintainability** | Fix bugs in one place |
| **Bundle Size** | Smaller bundles (see Dashboard: 4.34 kB vs previous) |

---

**Need Help?** Check `REFACTORING_SUMMARY.md` for complete documentation.
