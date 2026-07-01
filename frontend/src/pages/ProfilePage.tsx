import { useState } from "react";
import {
  useCurrentUser,
  useUpdateProfile,
  useChangePassword,
  useUploadAvatar,
  useRemoveAvatar,
} from "../hooks/useUser";
import { usePromptTemplates } from "../hooks/usePrompts";
import Content from "../layout/Content";
import ProfileForm from "../components/user/ProfileForm";
import ProfileSkeleton from "../components/user/ProfileSkeleton";
import ErrorState from "../components/ui/ErrorState";
import { getErrorMessage } from "../utils/error";

export default function ProfilePage() {
  const { data: user, isLoading, isError, error, refetch } = useCurrentUser();

  // ─── Mutations ───
  const updateMutation = useUpdateProfile();
  const changePasswordMutation = useChangePassword();
  const uploadAvatarMutation = useUploadAvatar();
  const removeAvatarMutation = useRemoveAvatar();

  // ─── Password change feedback ───
  const [changePwdError, setChangePwdError] = useState<string | null>(null);
  const [changePwdSuccess, setChangePwdSuccess] = useState(false);

  // ─── Prompt templates ───
  const { data: promptTemplates = [], isLoading: promptsLoading } = usePromptTemplates();

  // ─── Handlers ───

  const handleUpdateProfile = (data: Parameters<typeof updateMutation.mutate>[0]) => {
    updateMutation.mutate(data);
  };

  const handleChangePassword = (data: Parameters<typeof changePasswordMutation.mutate>[0]) => {
    setChangePwdError(null);
    setChangePwdSuccess(false);
    changePasswordMutation.mutate(data, {
      onSuccess: () => {
        setChangePwdSuccess(true);
      },
      onError: (err) => {
        setChangePwdError(getErrorMessage(err, "密码修改失败"));
      },
    });
  };

  const handleUploadAvatar = (file: File) => {
    uploadAvatarMutation.mutate(file);
  };

  const handleRemoveAvatar = () => {
    removeAvatarMutation.mutate();
  };

  return (
    <Content maxWidth="max-w-2xl">
      {/* Page header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-sm">
            <svg
              className="h-5 w-5 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900">个人中心</h1>
            <p className="text-xs text-gray-500">管理您的账户信息和 AI 偏好设置</p>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ProfileSkeleton />
        </div>
      ) : /* Error state */
      isError ? (
        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <ErrorState
            title="加载用户信息失败"
            message={getErrorMessage(error, "请检查网络连接后重试")}
            onRetry={() => refetch()}
          />
        </div>
      ) : /* Profile form */
      user ? (
        <div className="rounded-xl bg-white shadow-sm">
          <ProfileForm
            user={user}
            onUpdateProfile={handleUpdateProfile}
            updatePending={updateMutation.isPending}
            onChangePassword={handleChangePassword}
            changePasswordPending={changePasswordMutation.isPending}
            changePasswordError={changePwdError}
            changePasswordSuccess={changePwdSuccess}
            onUploadAvatar={handleUploadAvatar}
            uploadAvatarPending={uploadAvatarMutation.isPending}
            onRemoveAvatar={handleRemoveAvatar}
            removeAvatarPending={removeAvatarMutation.isPending}
            promptTemplates={promptTemplates}
            promptsLoading={promptsLoading}
          />
        </div>
      ) : null}
    </Content>
  );
}
