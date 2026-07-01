import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import Spinner from "./Spinner";

describe("Spinner", () => {
  it("renders with role status and aria-label", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner).toBeInTheDocument();
    expect(spinner).toHaveAttribute("aria-label", "加载中");
  });

  it("applies default size classes (md)", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-4");
    expect(spinner.className).toContain("w-4");
  });

  it("applies default variant classes (blue)", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-blue-200");
    expect(spinner.className).toContain("border-t-blue-600");
  });

  it("applies animate-spin and rounded-full classes", () => {
    render(<Spinner />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("animate-spin");
    expect(spinner.className).toContain("rounded-full");
  });

  it("accepts size lg", () => {
    render(<Spinner size="lg" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-10");
    expect(spinner.className).toContain("w-10");
    expect(spinner.className).toContain("border-4");
  });

  it("accepts size sm", () => {
    render(<Spinner size="sm" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("h-3");
    expect(spinner.className).toContain("w-3");
    expect(spinner.className).toContain("border-2");
  });

  it("accepts variant white", () => {
    render(<Spinner variant="white" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("border-white");
    expect(spinner.className).toContain("border-t-transparent");
  });

  it("merges custom className", () => {
    render(<Spinner className="my-custom" />);
    const spinner = screen.getByRole("status");
    expect(spinner.className).toContain("my-custom");
  });
});
