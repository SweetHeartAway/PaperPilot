import { useQuery } from "@tanstack/react-query";
import { fetchCurrentUser } from "../services/userService";

/** 获取当前登录用户信息 */
export function useCurrentUser() {
  return useQuery({
    queryKey: ["user", "me"],
    queryFn: fetchCurrentUser,
  });
}
