export interface SkeletonProps {
  className?: string;
}

export default function Skeleton({ className = "" }: SkeletonProps) {
  return (
    <div
      role="status"
      aria-label="加载中"
      className={`animate-pulse rounded-md bg-gray-200 ${className}`}
    />
  );
}
