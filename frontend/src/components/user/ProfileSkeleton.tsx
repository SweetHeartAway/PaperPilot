import Skeleton from "../ui/Skeleton";

export default function ProfileSkeleton() {
  return (
    <div className="space-y-6" role="status" aria-label="加载中">
      <Skeleton className="h-5 w-24" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i}>
          <Skeleton className="mb-1.5 h-4 w-16" />
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}
