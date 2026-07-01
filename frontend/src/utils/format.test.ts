import { describe, it, expect } from "vitest";
import { formatDate, formatFileSize } from "./format";

describe("formatDate", () => {
  it("returns empty string for undefined", () => {
    expect(formatDate(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatDate(null as unknown as string)).toBe("");
  });

  it("returns original string for invalid date", () => {
    expect(formatDate("invalid")).toBe("invalid");
  });

  it("formats a valid date string to zh-CN locale", () => {
    const result = formatDate("2024-01-15");
    expect(result).toContain("2024");
    expect(result).toContain("/");
  });
});

describe("formatFileSize", () => {
  it("returns empty string for undefined", () => {
    expect(formatFileSize(undefined)).toBe("");
  });

  it("returns empty string for null", () => {
    expect(formatFileSize(null as unknown as number)).toBe("");
  });

  it("returns '0 B' for 0", () => {
    expect(formatFileSize(0)).toBe("0 B");
  });

  it("returns '1 KB' for 1024", () => {
    expect(formatFileSize(1024)).toBe("1 KB");
  });

  it("returns '1 MB' for 1048576", () => {
    expect(formatFileSize(1048576)).toBe("1 MB");
  });

  it("returns decimal value with toFixed(2) precision", () => {
    const result = formatFileSize(1500);
    expect(result).toContain("KB");
    expect(result).toMatch(/^\d+(\.\d+)?/);
  });
});
