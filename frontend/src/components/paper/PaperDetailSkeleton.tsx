import Skeleton from "../ui/Skeleton";

export default function PaperDetailSkeleton() {
  return (
    <div role="status" aria-label="加载中">
      <Skeleton className="mb-6 h-4 w-32" />
      <div className="flex flex-col gap-6 lg:flex-row">
        <div className="flex-1 space-y-4">
          <Skeleton className="h-7 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
          <div className="flex gap-4">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-36" />
          </div>
          <div>
            <Skeleton className="mb-2 h-5 w-16" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="mt-1 h-4 w-5/6" />
          </div>
        </div>
        <div className="w-full lg:w-96">
          <div className="rounded-lg border border-gray-200 p-5">
            <Skeleton className="mb-4 h-6 w-24" />
            <Skeleton className="mb-2 h-4 w-full" />
            <Skeleton className="mb-2 h-4 w-5/6" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </div>
    </div>
  );
}
