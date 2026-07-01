import { useMutation, useQueryClient } from "@tanstack/react-query";
import { login as loginApi, register as registerApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import { queryKeys } from "../utils/queryKeys";
import { fetchCurrentUser } from "../services/userService";
import type { LoginRequest, RegisterRequest } from "../types/auth";

/** 登录 Mutation — 成功时自动写入 auth store 并 prefetch 用户信息 */
export function useLogin() {
  const queryClient = useQueryClient();
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (res) => {
      setAuth(res.access_token);
      queryClient.prefetchQuery({ queryKey: queryKeys.user.me, queryFn: fetchCurrentUser });
    },
  });
}

/** 注册 Mutation */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
  });
}
