import { describe, it, expect, beforeEach } from "vitest";
import { useToastStore } from "./toastStore";

describe("toastStore", () => {
  beforeEach(() => {
    useToastStore.getState().clear();
  });

  it("starts with an empty toasts array", () => {
    expect(useToastStore.getState().toasts).toEqual([]);
  });

  it("adds a toast and returns a string id", () => {
    const id = useToastStore.getState().add({
      type: "success",
      message: "ok",
      duration: 3000,
    });
    expect(typeof id).toBe("string");
    expect(id).toMatch(/^toast-/);
    const state = useToastStore.getState();
    expect(state.toasts).toHaveLength(1);
    expect(state.toasts[0]).toMatchObject({
      id,
      type: "success",
      message: "ok",
      duration: 3000,
    });
  });

  it("removes a toast by id", () => {
    const id = useToastStore.getState().add({
      type: "error",
      message: "err",
      duration: 0,
    });
    expect(useToastStore.getState().toasts).toHaveLength(1);

    useToastStore.getState().remove(id);
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("clears all toasts", () => {
    useToastStore.getState().add({ type: "info", message: "a", duration: 1000 });
    useToastStore.getState().add({ type: "info", message: "b", duration: 1000 });
    expect(useToastStore.getState().toasts).toHaveLength(2);

    useToastStore.getState().clear();
    expect(useToastStore.getState().toasts).toHaveLength(0);
  });

  it("accumulates multiple toasts", () => {
    useToastStore.getState().add({ type: "success", message: "1", duration: 1000 });
    useToastStore.getState().add({ type: "error", message: "2", duration: 2000 });
    useToastStore.getState().add({ type: "info", message: "3", duration: 3000 });
    expect(useToastStore.getState().toasts).toHaveLength(3);
  });
});
