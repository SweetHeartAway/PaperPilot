import client from "./client";
import type { LoginRequest, RegisterRequest, TokenResponse } from "../types/auth";
import type { User } from "../types/user";

export function login(data: LoginRequest): Promise<TokenResponse> {
  return client.post("/api/v1/auth/login", data).then((res) => res.data);
}

export function register(data: RegisterRequest): Promise<User> {
  return client.post("/api/v1/auth/register", data).then((res) => res.data);
}

export function getCurrentUser(): Promise<User> {
  return client.get("/api/v1/auth/me").then((res) => res.data);
}
