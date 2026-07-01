import { test, expect } from "@playwright/test";

const TEST_USER = {
  username: `e2e-paper-${Date.now()}`,
  email: `e2e-paper-${Date.now()}@example.com`,
  password: "testpass123",
};

let authToken = "";

test.describe("Paper Management", () => {
  test.beforeAll(async ({ request }) => {
    // Register user
    const regRes = await request.post("http://localhost:8000/api/v1/auth/register", {
      data: {
        username: TEST_USER.username,
        email: TEST_USER.email,
        password: TEST_USER.password,
      },
    });
    expect(regRes.ok()).toBeTruthy();

    // Login to get token
    const loginRes = await request.post("http://localhost:8000/api/v1/auth/login", {
      data: {
        username: TEST_USER.username,
        password: TEST_USER.password,
      },
    });
    const body = await loginRes.json();
    authToken = body.access_token;
  });

  test.beforeEach(async ({ page }) => {
    // Set auth token
    await page.goto("/login");
    await page.evaluate((t) => {
      localStorage.setItem("paperpilot_access_token", t);
    }, authToken);
  });

  test("should create a paper with metadata", async ({ page }) => {
    await page.goto("/papers/create");

    // Fill paper form
    await page.fill('input[placeholder*="标题"]', "E2E Test Paper");
    await page.fill('input[placeholder*="作者"]', "Test Author");
    await page.fill('textarea[placeholder*="摘要"]', "This is an E2E test paper abstract.");

    // Submit
    await page.click('button[type="submit"]');

    // Should navigate to paper detail page after creation
    await expect(page).toHaveURL(/\/papers\/\d+/);
  });

  test("should display paper in list after creation", async ({ page }) => {
    // Create paper via API
    const createRes = await page.request.post("http://localhost:8000/api/v1/papers/", {
      data: {
        title: "List Test Paper",
        authors: "E2E Author",
        abstract: "Testing list display",
      },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(createRes.ok()).toBeTruthy();

    // Navigate to paper list
    await page.goto("/papers");

    // Paper should appear in list
    await expect(page.getByText("List Test Paper")).toBeVisible();
  });

  test("should show paper detail page", async ({ page }) => {
    // Create paper via API
    const createRes = await page.request.post("http://localhost:8000/api/v1/papers/", {
      data: {
        title: "Detail Test Paper",
        authors: "E2E Author",
      },
      headers: { Authorization: `Bearer ${authToken}` },
    });
    expect(createRes.ok()).toBeTruthy();
    const paper = await createRes.json();

    // Navigate to detail page
    await page.goto(`/papers/${paper.id}`);

    // Paper title should be displayed
    await expect(page.getByText("Detail Test Paper")).toBeVisible();
    await expect(page.getByText("E2E Author")).toBeVisible();
  });
});
