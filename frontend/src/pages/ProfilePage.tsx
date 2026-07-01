import { useCurrentUser } from "../hooks/useUser";
import Content from "../layout/Content";
import ProfileForm from "../components/user/ProfileForm";
import ProfileSkeleton from "../components/user/ProfileSkeleton";
import ErrorState from "../components/ui/ErrorState";
import { getErrorMessage } from "../utils/error";

export default function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();

  return (
    <Content maxWidth="max-w-2xl">
      <h1 className="mb-6 text-xl font-semibold text-gray-900">个人中心</h1>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <ProfileSkeleton />
        </div>
      ) : /* Error state */
      isError ? (
        <ErrorState
          title="加载用户信息失败"
          message={getErrorMessage(error, "请检查网络连接后重试")}
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
