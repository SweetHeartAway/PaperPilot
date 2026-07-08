import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ─── Mocks ───

const mockFetchCurrentUser = vi.fn();
const mockUpdateProfile = vi.fn();
const mockChangePassword = vi.fn();
const mockUploadAvatar = vi.fn();
const mockRemoveAvatar = vi.fn();

vi.mock("../services/userService", () => ({
  fetchCurrentUser: (...args: unknown[]) => mockFetchCurrentUser(...args),
  updateProfile: (...args: unknown[]) => mockUpdateProfile(...args),
  changePassword: (...args: unknown[]) => mockChangePassword(...args),
  uploadAvatar: (...args: unknown[]) => mockUploadAvatar(...args),
  removeAvatar: (...args: unknown[]) => mockRemoveAvatar(...args),
}));

let mockToken: string | null = "test-token";
vi.mock("../stores/authStore", () => ({
  useAuthStore: (selector: (s: { token: string | null }) => unknown) =>
    selector({ token: mockToken }),
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

const TEST_USER = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  is_active: true,
  avatar_uuid: null,
  avatar_url: null,
  ai_api_key: null,
  ai_base_url: null,
  ai_model: null,
  default_prompt_template_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ─── useCurrentUser ───

describe("useCurrentUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = "test-token";
  });

  it("should fetch current user when token exists", async () => {
    mockFetchCurrentUser.mockResolvedValueOnce(TEST_USER);

    const { useCurrentUser } = await import("./useUser");
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual(TEST_USER);
  });

  it("should not fetch when token is null", async () => {
    mockToken = null;

    const { useCurrentUser } = await import("./useUser");
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

    expect(result.current.isFetching).toBe(false);
    expect(mockFetchCurrentUser).not.toHaveBeenCalled();
  });

  it("should handle fetch failure", async () => {
    mockFetchCurrentUser.mockRejectedValueOnce(new Error("Network error"));

    const { useCurrentUser } = await import("./useUser");
    const { result } = renderHook(() => useCurrentUser(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useUpdateProfile ───

describe("useUpdateProfile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call updateProfile with data", async () => {
    mockUpdateProfile.mockResolvedValueOnce({ ...TEST_USER, username: "newname" });

    const { useUpdateProfile } = await import("./useUser");
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.mutate({ username: "newname" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUpdateProfile).toHaveBeenCalledWith({ username: "newname" });
  });

  it("should handle update failure", async () => {
    mockUpdateProfile.mockRejectedValueOnce(new Error("邮箱已被使用"));

    const { useUpdateProfile } = await import("./useUser");
    const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() });

    result.current.mutate({ email: "dup@example.com" });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useChangePassword ───

describe("useChangePassword", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call changePassword with data", async () => {
    mockChangePassword.mockResolvedValueOnce({ message: "密码修改成功" });

    const { useChangePassword } = await import("./useUser");
    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    result.current.mutate({ current_password: "old", new_password: "new12345" });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockChangePassword).toHaveBeenCalledWith({
      current_password: "old",
      new_password: "new12345",
    });
  });

  it("should handle wrong password", async () => {
    mockChangePassword.mockRejectedValueOnce(new Error("当前密码错误"));

    const { useChangePassword } = await import("./useUser");
    const { result } = renderHook(() => useChangePassword(), { wrapper: createWrapper() });

    result.current.mutate({ current_password: "wrong", new_password: "new12345" });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useUploadAvatar ───

describe("useUploadAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call uploadAvatar with file", async () => {
    const avatarFile = new File(["test"], "avatar.png", { type: "image/png" });
    mockUploadAvatar.mockResolvedValueOnce({ ...TEST_USER, avatar_uuid: "new-uuid" });

    const { useUploadAvatar } = await import("./useUser");
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: createWrapper() });

    result.current.mutate(avatarFile);

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockUploadAvatar).toHaveBeenCalledWith(avatarFile);
  });

  it("should handle upload failure", async () => {
    mockUploadAvatar.mockRejectedValueOnce(new Error("不支持的头像格式"));

    const { useUploadAvatar } = await import("./useUser");
    const { result } = renderHook(() => useUploadAvatar(), { wrapper: createWrapper() });

    result.current.mutate(new File(["x"], "bad.txt", { type: "text/plain" }));

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

// ─── useRemoveAvatar ───

describe("useRemoveAvatar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call removeAvatar", async () => {
    mockRemoveAvatar.mockResolvedValueOnce(TEST_USER);

    const { useRemoveAvatar } = await import("./useUser");
    const { result } = renderHook(() => useRemoveAvatar(), { wrapper: createWrapper() });

    result.current.mutate();

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemoveAvatar).toHaveBeenCalledOnce();
  });

  it("should handle remove failure when no avatar", async () => {
    mockRemoveAvatar.mockRejectedValueOnce(new Error("未设置头像"));

    const { useRemoveAvatar } = await import("./useUser");
    const { result } = renderHook(() => useRemoveAvatar(), { wrapper: createWrapper() });

    result.current.mutate();

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
