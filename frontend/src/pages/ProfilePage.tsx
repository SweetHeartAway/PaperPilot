import { useCurrentUser } from "../hooks/useUser";
import Content from "../layout/Content";
import ProfileForm from "../components/user/ProfileForm";
import Skeleton from "../components/ui/Skeleton";
import ErrorState from "../components/ui/ErrorState";

function ProfileSkeleton() {
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

export default function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();

  return (
    <Content maxWidth="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">个人中心</h1>

      {/* Loading state */}
      {isLoading && !user ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ProfileSkeleton />
        </div>
      ) : /* Error state */
      isError ? (
        <ErrorState
          title="加载用户信息失败"
          message={error instanceof Error ? error.message : "请检查网络连接后重试"}
          onRetry={() => refetch()}
        />
      ) : /* User info card */
      user ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          {/* Avatar placeholder */}
          <div className="mb-6 flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 text-xl font-semibold text-blue-600">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">{user.username}</p>
              <p className="text-sm text-gray-500">{user.email}</p>
            </div>
          </div>

          <ProfileForm user={user} />
        </div>
      ) : null}
    </Content>
  );
}
