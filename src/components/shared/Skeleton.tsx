export function Skeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-lg bg-surface-container ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonCard({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-surface-container-low ${className}`}
      aria-hidden="true"
    />
  );
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-4 p-4">
      <Skeleton className="h-10 w-10 rounded-full" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/3" />
        <Skeleton className="h-3 w-1/4" />
      </div>
      <Skeleton className="h-8 w-20 rounded-full" />
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="rounded-xl bg-surface-container-lowest shadow-[0_4px_32px_rgba(25,28,29,0.06)]">
      <div className="border-b border-surface-container p-4">
        <Skeleton className="h-5 w-48" />
      </div>
      <div className="divide-y divide-surface-container">
        {Array.from({ length: rows }).map((_, i) => (
          <SkeletonRow key={i} />
        ))}
      </div>
    </div>
  );
}
