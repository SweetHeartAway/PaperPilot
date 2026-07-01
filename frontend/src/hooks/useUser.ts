import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  changePassword,
  fetchCurrentUser,
  removeAvatar,
  updateProfile,
  uploadAvatar,
} from "../services/userService";
import { useAuthStore } from "../stores/authStore";
import type { ChangePasswordData, UpdateProfileData } from "../types/user";
import { queryKeys } from "../utils/queryKeys";

/** 获取当前登录用户信息 */
export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  return useQuery({
    queryKey: queryKeys.user.me,
    queryFn: fetchCurrentUser,
    enabled: !!token,
  });
}

/** 更新用户资料 */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: UpdateProfileData) => updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

/** 修改密码 */
export function useChangePassword() {
  return useMutation({
    mutationFn: (data: ChangePasswordData) => changePassword(data),
  });
}

/** 上传头像 */
export function useUploadAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => uploadAvatar(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}

/** 删除头像 */
export function useRemoveAvatar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: removeAvatar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.user.me });
    },
  });
}
