import { Skeleton, SkeletonCard } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <Skeleton className="mb-6 h-10 w-64" />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} className="h-48" />
        ))}
      </div>
    </div>
  );
}
