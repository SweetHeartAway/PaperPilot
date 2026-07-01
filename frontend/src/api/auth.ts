import client from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse } from "../types/auth";
import type { User } from "../types/user";

/** 登录（后端 OAuth2PasswordRequestForm 要求 form-data） */
export function login(data: LoginRequest): Promise<TokenResponse> {
  const formData = new URLSearchParams();
  formData.append("username", data.username);
  formData.append("password", data.password);
  return client
    .post("/api/v1/auth/login", formData, {
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
    })
    .then((res) => res.data);
}

export function register(data: RegisterRequest): Promise<User> {
  return client.post("/api/v1/auth/register", data).then((res) => res.data);
}

export function getCurrentUser(): Promise<User> {
  return client.get("/api/v1/users/me").then((res) => res.data);
}
