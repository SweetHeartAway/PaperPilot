import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/userService";
import { useAuthStore } from "../stores/authStore";
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
