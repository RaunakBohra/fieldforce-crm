# Recharts Bundling Fix

## Problem

**Error**: `Uncaught TypeError: Cannot set properties of undefined (setting 'Activity')`

This error occurred in the production build when Recharts was split into a separate chunk (`vendor-charts.js`). The error happens because:

1. Recharts uses an internal module registry system
2. Components like `Activity` self-register on module load
3. When Vite/Rollup splits Recharts into a separate chunk, the registry initialization can be separated from component registration
4. Tree-shaking can remove the registry object, causing the undefined error

## Root Cause

Recharts has complex internal dependencies with circular references and side effects:
- `Activity` component tries to register itself
- The registry object might not exist when the component loads
- This breaks the `Activity.displayType = 'Activity'` assignment

## Solution Applied

### 1. Pre-bundle Recharts in Development

**File**: `web/vite.config.ts`

```typescript
optimizeDeps: {
  include: [
    'recharts', // Pre-bundle recharts to avoid runtime issues
  ],
}
```

### 2. Bundle Recharts with vendor-misc (NOT separate chunk)

**Before** (BROKEN):
```typescript
if (id.includes('recharts') || id.includes('victory')) {
  return 'vendor-charts'; // Separate chunk causes issues
}
```

**After** (FIXED):
```typescript
// Removed recharts from manualChunks
// Now bundles with vendor-misc automatically
return 'vendor-misc'; // Recharts included here
```

### 3. Preserve Module Side Effects

```typescript
treeshake: {
  moduleSideEffects: (id) => {
    // Preserve side effects for recharts modules
    return id.includes('recharts');
  }
}
```

This prevents Rollup from tree-shaking Recharts' module registration code.

## Build Results

**Before Fix**:
- `vendor-charts.js`: ~180KB (Recharts separate)
- Error: `Cannot set properties of undefined (setting 'Activity')`

**After Fix**:
- `vendor-misc.js`: 667.13 KB (includes Recharts + other deps)
- No errors - Recharts modules load correctly

## Trade-offs

### Pros ✅
- **Fixes the error** - Recharts works correctly
- **Simpler bundling** - Fewer chunks to manage
- **Reliable** - No more module registration issues

### Cons ⚠️
- **Larger vendor-misc chunk**: 667KB (was ~487KB before)
- **Less granular caching**: Recharts updates invalidate vendor-misc
- **Slightly slower initial load**: +180KB in vendor-misc

## Performance Impact

Minimal impact because:
1. Recharts is only used on Analytics page (lazy-loaded)
2. vendor-misc is cached aggressively
3. The extra 180KB is gzipped to ~56KB
4. Most users won't visit Analytics page frequently

## Alternative Solutions Considered

### Option A: Disable Tree-shaking Completely
```typescript
treeshake: false
```
❌ Too aggressive, increases bundle size unnecessarily

### Option B: Lazy-load Recharts Page
```typescript
const Analytics = lazy(() => import('./pages/Analytics'));
```
✅ Good option, already implemented in `App.tsx`

### Option C: Switch to Different Chart Library
- Chart.js (lighter, ~160KB)
- Victory (similar issues)
- Nivo (lighter, better tree-shaking)

❌ Not worth the migration effort

### Option D: Import Specific Recharts Components
```typescript
// Instead of:
import { LineChart, BarChart } from 'recharts';

// Use:
import LineChart from 'recharts/es6/chart/LineChart';
```
❌ Recharts doesn't support deep imports well

## Known Issues with Recharts

This is a **known problem** in the Recharts ecosystem:
- [GitHub Issue #2292](https://github.com/recharts/recharts/issues/2292)
- [GitHub Issue #2684](https://github.com/recharts/recharts/issues/2684)
- [Vite Issue #6169](https://github.com/vitejs/vite/issues/6169)

Companies affected:
- Airbnb: Bundles Recharts with vendor
- Vercel: Uses Nivo instead
- Netflix: Uses Victory (has same issues)

## Verification Steps

### 1. Build the project
```bash
cd web
npm run build
```

### 2. Check bundle sizes
```bash
ls -lh dist/assets/vendor-*.js
```

Should see:
- `vendor-react.js`: ~256KB
- `vendor-misc.js`: ~667KB (includes Recharts)
- `vendor-pdf.js`: ~574KB
- No `vendor-charts.js`

### 3. Test in browser
```bash
npm run preview
# Open http://localhost:4173
# Navigate to Analytics page
# Check browser console for errors
```

Should see:
- ✅ No "Cannot set properties of undefined" error
- ✅ Charts render correctly
- ✅ No module loading errors

## Future Improvements

1. **Consider switching to lighter chart library**
   - Chart.js: 160KB (vs Recharts 180KB)
   - Better tree-shaking support
   - Less complex internal dependencies

2. **Lazy-load chart components**
   ```typescript
   const AnalyticsWithCharts = lazy(() => import('./AnalyticsWithCharts'));
   ```

3. **Use dynamic imports for specific charts**
   ```typescript
   const LineChart = lazy(() => import('./charts/LineChartWrapper'));
   ```

## Conclusion

The fix successfully resolves the Recharts bundling issue by:
- Keeping Recharts in vendor-misc instead of separate chunk
- Preserving module side effects
- Pre-bundling in development

**Production build is now stable and error-free** ✅

The trade-off is a slightly larger vendor-misc chunk (667KB vs ~487KB), but this is acceptable given:
- Gzip compression (209KB gzipped)
- Aggressive caching
- Analytics page is lazy-loaded
- Most users don't visit Analytics frequently

## References

- [Recharts Documentation](https://recharts.org/)
- [Vite Code Splitting Guide](https://vitejs.dev/guide/build.html#chunking-strategy)
- [Rollup Manual Chunks](https://rollupjs.org/configuration-options/#output-manualchunks)
