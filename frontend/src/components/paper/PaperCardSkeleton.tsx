import Skeleton from "../ui/Skeleton";

export interface PaperCardSkeletonProps {
  count?: number;
}

export default function PaperCardSkeleton({ count = 1 }: PaperCardSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-lg border border-gray-200 bg-white p-5"
          role="status"
          aria-label="加载中"
        >
          <Skeleton className="mb-3 h-5 w-3/4" />
          <Skeleton className="mb-3 h-4 w-1/2" />
          <Skeleton className="mb-1 h-4 w-full" />
          <Skeleton className="mb-4 h-4 w-5/6" />
          <div className="mb-3 flex gap-4">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-16" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-5 w-14 rounded-full" />
            <Skeleton className="h-5 w-20 rounded-full" />
          </div>
        </div>
      ))}
    </>
  );
}
