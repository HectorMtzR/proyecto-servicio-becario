import { Skeleton, SkeletonCard, SkeletonTable } from "@/components/shared/Skeleton";

export default function Loading() {
  return (
    <div className="p-8">
      <div className="mb-6">
        <Skeleton className="h-10 w-64" />
      </div>
      <div className="grid grid-cols-12 gap-6">
        <SkeletonCard className="col-span-8 h-64" />
        <SkeletonCard className="col-span-4 h-64" />
        <SkeletonCard className="col-span-12 h-48" />
        <div className="col-span-12">
          <SkeletonTable rows={5} />
        </div>
      </div>
    </div>
  );
}
