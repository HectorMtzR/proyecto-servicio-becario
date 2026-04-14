import { Skeleton, SkeletonTable } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <Skeleton className="mb-6 h-10 w-48" />
      <SkeletonTable rows={10} />
    </div>
  );
}
