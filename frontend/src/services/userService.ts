/** 用户服务层 — 数据转换与 API 调用编排 */

import { getCurrentUser } from "../api/auth";
import { changeMyPassword, deleteMyAvatar, updateCurrentUser, uploadMyAvatar } from "../api/users";
import type { ChangePasswordData, UpdateProfileData, User } from "../types/user";

/** 获取当前登录用户信息 */
export function fetchCurrentUser(): Promise<User> {
  return getCurrentUser();
}

/** 更新用户资料 */
export function updateProfile(data: UpdateProfileData): Promise<User> {
  return updateCurrentUser(data);
}

/** 修改密码 */
export function changePassword(data: ChangePasswordData): Promise<{ message: string }> {
  return changeMyPassword(data);
}

/** 上传头像 */
export function uploadAvatar(file: File, onProgress?: (percent: number) => void): Promise<User> {
  return uploadMyAvatar(file, onProgress);
}

/** 删除头像 */
export function removeAvatar(): Promise<User> {
  return deleteMyAvatar();
}
