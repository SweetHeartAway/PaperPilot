import { test, expect } from "@playwright/test";

const TEST_USER = {
  username: `e2e-nav-${Date.now()}`,
  email: `e2e-nav-${Date.now()}@example.com`,
  password: "testpass123",
};

test.describe("Navigation", () => {
  test.beforeAll(async ({ request }) => {
    // Register test user via API
    const res = await request.post("http://localhost:8000/api/v1/auth/register", {
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
    expect(res.ok()).toBeTruthy();
  });

  test.beforeEach(async ({ page }) => {
    // Login via API
    const res = await page.request.post("http://localhost:8000/api/v1/auth/login", {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password,
      },
    });
    const body = await res.json();
    const token = body.access_token;

    // Set auth state in localStorage
    await page.goto("/login");
    await page.evaluate((t) => {
      localStorage.setItem("paperpilot_access_token", t);
    }, token);
  });

  test("should show 404 page for unknown routes", async ({ page }) => {
    await page.goto("/nonexistent-route");
    await expect(page.getByText("404")).toBeVisible();
    await expect(page.getByText("页面未找到")).toBeVisible();
  });

  test("should navigate via sidebar", async ({ page }) => {
    await page.goto("/papers");

    // Navigate to Tags page
    await page.getByText("标签").first().click();
    await expect(page).toHaveURL(/\/tags/);

    // Navigate to Profile page
    await page.getByText("个人中心").first().click();
    await expect(page).toHaveURL(/\/profile/);

    // Navigate back to Papers via logo
    await page.getByText("PaperPilot").first().click();
    await expect(page).toHaveURL(/\/papers/);
  });

  test("should show empty state when no papers exist", async ({ page }) => {
    await page.goto("/papers");
    await expect(page.getByText("还没有论文")).toBeVisible();
  });

  test("should navigate to create paper page", async ({ page }) => {
    await page.goto("/papers");
    await page.getByText("上传论文").click();
    await expect(page).toHaveURL(/\/papers\/create/);
  });
});
