import Skeleton from "../ui/Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="加载中">
      {/* Avatar */}
      <div className="flex items-center gap-4">
        <Skeleton className="h-20 w-20 rounded-full" />
        <Skeleton className="h-9 w-24 rounded-lg" />
      </div>

      {/* Grid fields */}
      <div className="grid gap-6 sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i}>
            <Skeleton className="mb-1.5 h-4 w-16" />
            <Skeleton className="h-10 w-full rounded-lg" />
          </div>
        ))}
      </div>

      {/* Save button */}
      <Skeleton className="h-10 w-20 rounded-lg" />

      {/* Password section separator + button */}
      <Skeleton className="h-px w-full" />
      <Skeleton className="h-5 w-24" />
    </div>
  );
}
