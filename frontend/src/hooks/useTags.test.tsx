import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

// ─── Mocks ───

const mockAddPaperTag = vi.fn();
const mockRemovePaperTag = vi.fn();

vi.mock("../api/papers", () => ({
  addPaperTag: (...args: unknown[]) => mockAddPaperTag(...args),
  removePaperTag: (...args: unknown[]) => mockRemovePaperTag(...args),
}));

// Mock useToast to avoid real store side effects
vi.mock("../hooks/useToast", () => ({
  useToast: () => ({
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    loading: vi.fn(() => vi.fn()),
    dismiss: vi.fn(),
  }),
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

describe("useAddPaperTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call addPaperTag with paperId and tag name", async () => {
    mockAddPaperTag.mockResolvedValueOnce({
      id: 1,
      title: "Test Paper",
      tags: [{ id: 1, name: "ML" }],
    });

    const { useAddPaperTag } = await import("./useTags");
    const { result } = renderHook(() => useAddPaperTag(1), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("Deep Learning");
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockAddPaperTag).toHaveBeenCalledWith(1, "Deep Learning");
  });

  it("should handle duplicate tag error", async () => {
    mockAddPaperTag.mockRejectedValueOnce(new Error("标签已存在"));

    const { useAddPaperTag } = await import("./useTags");
    const { result } = renderHook(() => useAddPaperTag(1), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate("Existing");
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});

describe("useRemovePaperTag", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should call removePaperTag with tagId", async () => {
    mockRemovePaperTag.mockResolvedValueOnce(undefined);

    const { useRemovePaperTag } = await import("./useTags");
    const { result } = renderHook(() => useRemovePaperTag(1), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(5);
    });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(mockRemovePaperTag).toHaveBeenCalledWith(1, 5);
  });

  it("should handle remove failure", async () => {
    mockRemovePaperTag.mockRejectedValueOnce(new Error("标签不存在"));

    const { useRemovePaperTag } = await import("./useTags");
    const { result } = renderHook(() => useRemovePaperTag(1), { wrapper: createWrapper() });

    act(() => {
      result.current.mutate(999);
    });

    await waitFor(() => expect(result.current.isError).toBe(true));
  });
});
