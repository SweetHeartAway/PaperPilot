import { describe, it, expect, beforeEach } from "vitest";
import { getToken, setToken, removeToken } from "./token";

describe("token", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("getToken returns null when no token is stored", () => {
    expect(getToken()).toBeNull();
  });

  it("getToken returns the token after setToken", () => {
    setToken("abc");
    expect(getToken()).toBe("abc");
  });

  it("getToken returns null after removeToken", () => {
    setToken("abc");
    removeToken();
    expect(getToken()).toBeNull();
  });

  it("overwrites an existing token on second setToken", () => {
    setToken("first");
    setToken("second");
    expect(getToken()).toBe("second");
  });
});
