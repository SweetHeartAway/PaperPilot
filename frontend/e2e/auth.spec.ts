import { test, expect } from "@playwright/test";

const TEST_USER = {
  username: `e2e-test-${Date.now()}`,
  email: `e2e-test-${Date.now()}@example.com`,
  password: "testpass123",
};

test.describe("Authentication", () => {
  test("should register a new user and redirect to login", async ({ page }) => {
    await page.goto("/register");

    // Fill registration form
    await page.fill('input[id="register-username"]', TEST_USER.username);
    await page.fill('input[id="register-email"]', TEST_USER.email);
    await page.fill('input[id="register-password"]', TEST_USER.password);
    await page.fill('input[id="register-confirm"]', TEST_USER.password);

    // Submit
    await page.click('button[type="submit"]');

    // Should redirect to login with success message
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByText("注册成功")).toBeVisible();
  });

  test("should login with registered user and redirect to papers", async ({ page }) => {
    // First register the user
    const response = await page.request.post("http://localhost:8000/api/v1/auth/register", {
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
    expect(response.ok()).toBeTruthy();

    // Now login via UI
    await page.goto("/login");
    await page.fill('input[id="login-username"]', TEST_USER.username);
    await page.fill('input[id="login-password"]', TEST_USER.password);
    await page.click('button[type="submit"]');

    // Should redirect to /papers
    await expect(page).toHaveURL(/\/papers/);
    await expect(page.getByText("论文列表")).toBeVisible();
  });

  test("should show error on wrong password", async ({ page }) => {
    // Register user
    await page.request.post("http://localhost:8000/api/v1/auth/register", {
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });

    await page.goto("/login");
    await page.fill('input[id="login-username"]', TEST_USER.username);
    await page.fill('input[id="login-password"]', "wrongpassword");
    await page.click('button[type="submit"]');

    // Should stay on login page with error
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole("alert")).toBeVisible();
  });

  test("should redirect unauthenticated user to login", async ({ page }) => {
    // Clear any stored auth
    await page.goto("/login");
    await page.evaluate(() => localStorage.clear());

    // Try to access protected page
    await page.goto("/papers");
    await expect(page).toHaveURL(/\/login/);
  });
});
