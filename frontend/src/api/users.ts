import type { AxiosProgressEvent } from "axios";
import client from "./client";
import type { ChangePasswordData, UpdateProfileData, User } from "../types/user";

/** 更新当前用户资料 */
export function updateCurrentUser(data: UpdateProfileData): Promise<User> {
  return client.put("/api/v1/users/me", data).then((res) => res.data);
}

/** 修改当前用户密码 */
export function changeMyPassword(data: ChangePasswordData): Promise<{ message: string }> {
  return client.post("/api/v1/users/me/change-password", data).then((res) => res.data);
}

/** 上传当前用户头像 */
export function uploadMyAvatar(file: File, onProgress?: (percent: number) => void): Promise<User> {
  const formData = new FormData();
  formData.append("file", file);
  return client
    .post("/api/v1/users/me/avatar", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (event: AxiosProgressEvent) => {
        if (event.total && onProgress) {
          onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    })
    .then((res) => res.data);
}

/** 删除当前用户头像 */
export function deleteMyAvatar(): Promise<User> {
  return client.delete("/api/v1/users/me/avatar").then((res) => res.data);
}

/** 获取用户头像 URL（仅用于构造 <img> src） */
export function getUserAvatarUrl(userId: number): string {
  return (client.defaults.baseURL as string) + `/api/v1/users/${userId}/avatar`;
}
