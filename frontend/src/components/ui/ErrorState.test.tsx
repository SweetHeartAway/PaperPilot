import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ErrorState from "./ErrorState";

describe("ErrorState", () => {
  it("renders the required title", () => {
    render(<ErrorState title="出错了" />);
    expect(screen.getByText("出错了")).toBeInTheDocument();
  });

  it("renders message when provided", () => {
    render(<ErrorState title="出错了" message="详情信息" />);
    expect(screen.getByText("详情信息")).toBeInTheDocument();
  });

  it("does not render message when not provided", () => {
    render(<ErrorState title="出错了" />);
    expect(screen.queryByText("详情信息")).not.toBeInTheDocument();
  });

  it("renders retry button with default label when onRetry provided", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="出错了" onRetry={onRetry} />);
    const button = screen.getByRole("button", { name: "重新加载" });
    expect(button).toBeInTheDocument();
  });

  it("renders retry button with custom label", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="出错了" onRetry={onRetry} retryLabel="重试" />);
    expect(screen.getByRole("button", { name: "重试" })).toBeInTheDocument();
  });

  it("calls onRetry when retry button is clicked", () => {
    const onRetry = vi.fn();
    render(<ErrorState title="出错了" onRetry={onRetry} />);
    fireEvent.click(screen.getByRole("button", { name: "重新加载" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("does not render retry button when onRetry is not provided", () => {
    render(<ErrorState title="出错了" />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
