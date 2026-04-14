import { Skeleton, SkeletonTable } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-6 flex items-center justify-between">
        <Skeleton className="h-10 w-64" />
        <Skeleton className="h-10 w-40 rounded-full" />
      </div>
      <SkeletonTable rows={6} />
    </div>
  );
}
