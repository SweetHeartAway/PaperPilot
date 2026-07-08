import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ─── Mock API ───

const mockLogin = vi.fn();
const mockRegister = vi.fn();

vi.mock("../api/auth", () => ({
  login: (...args: unknown[]) => mockLogin(...args),
  register: (...args: unknown[]) => mockRegister(...args),
}));

// ─── Wrapper ───

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

describe("useLogin", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("localStorage", {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
      removeItem: vi.fn(),
    });
  });

  it("should call login API with credentials", async () => {
    mockLogin.mockResolvedValueOnce({
      access_token: "test-token",
      token_type: "bearer",
    });

    const { useLogin } = await import("./useAuth");
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ username: "test@example.com", password: "secret123" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockLogin).toHaveBeenCalledWith({
      username: "test@example.com",
      password: "secret123",
    });
    expect(result.current.data?.access_token).toBe("test-token");
  });

  it("should handle login failure", async () => {
    mockLogin.mockRejectedValueOnce(new Error("邮箱或密码错误"));

    const { useLogin } = await import("./useAuth");
    const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() });

    result.current.mutate({ username: "wrong@example.com", password: "wrong" });

    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeDefined();
  });
});

describe("useRegister", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call register API with user data", async () => {
    mockRegister.mockResolvedValueOnce({
      id: 1,
      email: "new@example.com",
      username: "newuser",
    });

    const { useRegister } = await import("./useAuth");
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    result.current.mutate({
      username: "newuser",
      email: "new@example.com",
      password: "password123",
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(mockRegister).toHaveBeenCalledWith({
      username: "newuser",
      email: "new@example.com",
      password: "password123",
    });
  });

  it("should handle registration failure", async () => {
    mockRegister.mockRejectedValueOnce(new Error("邮箱已被使用"));

    const { useRegister } = await import("./useAuth");
    const { result } = renderHook(() => useRegister(), { wrapper: createWrapper() });

    result.current.mutate({
      username: "existing",
      email: "dup@example.com",
      password: "password123",
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
