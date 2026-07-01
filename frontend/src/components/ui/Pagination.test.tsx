import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("returns null when totalPages <= 1", () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={() => {}} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("shows all page buttons when totalPages is small (3)", () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={3} onPageChange={onChange} />);
    // "上一页" + 3 page buttons + "下一页" = 5
    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);
  });

  it("highlights the current page with bg-blue-600 and text-white", () => {
    render(<Pagination currentPage={2} totalPages={5} onPageChange={() => {}} />);
    const currentBtn = screen.getByRole("button", { name: "2" });
    expect(currentBtn.className).toContain("bg-blue-600");
    expect(currentBtn.className).toContain("text-white");
    expect(currentBtn).toHaveAttribute("aria-current", "page");
  });

  it("disables the prev button on the first page", () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "上一页" })).toBeDisabled();
  });

  it("disables the next button on the last page", () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "下一页" })).toBeDisabled();
  });

  it("calls onPageChange with the correct page number on click", () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "3" }));
    expect(onChange).toHaveBeenCalledWith(3);
  });

  it("calls onPageChange with currentPage - 1 when clicking prev", () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "上一页" }));
    expect(onChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange with currentPage + 1 when clicking next", () => {
    const onChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "下一页" }));
    expect(onChange).toHaveBeenCalledWith(4);
  });

  it("shows ellipsis when there are skipped pages on both sides", () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
    const ellipsisSpans = screen.getAllByText("...");
    expect(ellipsisSpans.length).toBeGreaterThanOrEqual(1);
  });

  it("renders first and last page buttons when ellipsis is present", () => {
    render(<Pagination currentPage={5} totalPages={10} onPageChange={() => {}} />);
    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "10" })).toBeInTheDocument();
  });
});
