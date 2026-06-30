/** 用户服务层 — 数据转换与 API 调用编排 */

import { getCurrentUser } from "../api/auth";
import type { User } from "../types/user";

/** 获取当前登录用户信息 */
export function fetchCurrentUser(): Promise<User> {
  return getCurrentUser();
}
