import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import EmptyState from "./EmptyState";

describe("EmptyState", () => {
  it("renders default title and message", () => {
    render(<EmptyState />);
    expect(screen.getByText("暂无数据")).toBeInTheDocument();
    expect(screen.getByText("当前没有可显示的内容")).toBeInTheDocument();
  });

  it("renders custom title and message overriding defaults", () => {
    render(<EmptyState title="自定义标题" message="自定义消息" />);
    expect(screen.getByText("自定义标题")).toBeInTheDocument();
    expect(screen.getByText("自定义消息")).toBeInTheDocument();
  });

  it("renders action element when provided", () => {
    render(<EmptyState action={<button>点击</button>} />);
    expect(screen.getByRole("button", { name: "点击" })).toBeInTheDocument();
  });

  it("does not render action area when action prop is omitted", () => {
    render(<EmptyState />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
