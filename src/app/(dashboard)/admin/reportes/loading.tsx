import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <Skeleton className="mb-6 h-10 w-64" />
      <SkeletonCard className="mb-6 h-32" />
      <SkeletonTable rows={8} />
    </div>
  );
}
