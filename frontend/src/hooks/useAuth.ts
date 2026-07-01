import { useMutation } from "@tanstack/react-query";
import { login as loginApi, register as registerApi } from "../api/auth";
import { useAuthStore } from "../stores/authStore";
import type { LoginRequest, RegisterRequest } from "../types/auth";

/** 登录 Mutation — 成功时自动写入 auth store */
export function useLogin() {
  const setAuth = useAuthStore((s) => s.setAuth);
  return useMutation({
    mutationFn: (data: LoginRequest) => loginApi(data),
    onSuccess: (res) => {
      setAuth(res.access_token);
    },
  });
}

/** 注册 Mutation */
export function useRegister() {
  return useMutation({
    mutationFn: (data: RegisterRequest) => registerApi(data),
  });
}
