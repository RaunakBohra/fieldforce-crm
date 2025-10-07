/**
 * Skeleton Loading Components
 * Provides perceived performance boost while data loads
 */

export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse bg-neutral-200 rounded-lg ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200 bg-[length:200%_100%] animate-shimmer" />
    </div>
  );
}

export function SkeletonStat() {
  return (
    <div className="bg-white rounded-lg border border-neutral-200 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse mb-2" />
          <div className="h-8 w-16 bg-neutral-300 rounded animate-pulse mb-1" />
          <div className="h-2 w-20 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="w-8 h-8 bg-neutral-200 rounded-full animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonActivity() {
  return (
    <div className="flex items-center justify-between p-3 border border-neutral-200 rounded-lg">
      <div className="flex items-center gap-3 flex-1">
        <div className="w-10 h-10 bg-neutral-200 rounded-full animate-pulse" />
        <div className="flex-1">
          <div className="h-4 w-48 bg-neutral-300 rounded animate-pulse mb-2" />
          <div className="h-3 w-32 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="h-6 w-16 bg-neutral-200 rounded animate-pulse" />
        <div className="h-4 w-20 bg-neutral-200 rounded animate-pulse" />
      </div>
    </div>
  );
}

export function SkeletonVisitCard() {
  return (
    <div className="flex items-center justify-between p-3 bg-white rounded-lg border border-neutral-200">
      <div className="flex-1">
        <div className="h-4 w-40 bg-neutral-300 rounded animate-pulse mb-2" />
        <div className="flex items-center gap-2">
          <div className="h-3 w-16 bg-neutral-200 rounded animate-pulse" />
          <div className="h-3 w-24 bg-neutral-200 rounded animate-pulse" />
        </div>
      </div>
      <div className="w-20 h-8 bg-neutral-200 rounded-lg animate-pulse" />
    </div>
  );
}

export function SkeletonDashboard() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <div className="h-8 w-64 bg-neutral-300 rounded animate-pulse mb-2" />
          <div className="h-4 w-80 bg-neutral-200 rounded animate-pulse" />
        </div>
        <div className="h-4 w-32 bg-neutral-200 rounded animate-pulse" />
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
        <SkeletonStat />
      </div>

      {/* Quick Actions */}
      <div>
        <div className="h-6 w-32 bg-neutral-300 rounded animate-pulse mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} className="h-32" />
          ))}
        </div>
      </div>

      {/* Visit Planning */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="h-6 w-48 bg-neutral-300 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <SkeletonVisitCard />
            <SkeletonVisitCard />
            <SkeletonVisitCard />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 p-6">
          <div className="h-6 w-40 bg-neutral-300 rounded animate-pulse mb-4" />
          <div className="space-y-2">
            <SkeletonVisitCard />
            <SkeletonVisitCard />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-lg border border-neutral-200 p-6">
        <div className="h-6 w-40 bg-neutral-300 rounded animate-pulse mb-4" />
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <SkeletonActivity key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
