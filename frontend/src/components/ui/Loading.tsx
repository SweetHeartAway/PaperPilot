interface LoadingProps {
  message?: string;
}

export default function Loading({ message = "加载中..." }: LoadingProps) {
  return (
    <div className="flex items-center justify-center py-16" role="status" aria-label="加载中">
      <div className="flex flex-col items-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-600" />
        <p className="text-sm text-gray-500">{message}</p>
      </div>
    </div>
  );
}
