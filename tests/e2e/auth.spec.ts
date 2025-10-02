import { test, expect } from "@playwright/test";

test.describe("Authentication Flow", () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
    await page.goto("/");
  });

  test("should redirect to auth page when not authenticated", async ({
    page,
  }) => {
    await page.goto("/tasks/create");

    // Should redirect to auth page
    await page.waitForURL("/auth");
    expect(page.url()).toContain("/auth");
  });

  test("should display sign-in form on auth page", async ({ page }) => {
    await page.goto("/auth");

    // Check for email input and sign-in button
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test("should validate email format in sign-in form", async ({ page }) => {
    await page.goto("/auth");

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    // Enter invalid email
    await emailInput.fill("invalid-email");
    await submitButton.click();

    // Check for validation error (browser native validation or custom)
    const validationMessage = await emailInput.evaluate(
      (input: HTMLInputElement) => {
        return input.validationMessage;
      }
    );

    expect(validationMessage).toBeTruthy();
  });

  test("should handle auth callback with error parameters", async ({
    page,
  }) => {
    // Navigate directly to callback with error
    await page.goto(
      "/auth/callback?error=access_denied&error_description=User denied access"
    );

    // Should redirect to auth page with error
    await page.waitForURL(/\/auth\?error=/);
    expect(page.url()).toContain("error=access_denied");
  });

  test("should handle auth callback with malformed token", async ({ page }) => {
    // Navigate to callback with malformed access token
    await page.goto(
      "/auth/callback?access_token=malformed@token&refresh_token=valid_token"
    );

    // Should redirect to auth page with invalid token error
    await page.waitForURL(/\/auth\?error=/);
    expect(page.url()).toContain("error=invalid_token");
  });

  test("should show proper loading state during auth callback", async ({
    page,
  }) => {
    await page.goto("/auth/callback");

    // Should show loading message
    await expect(page.locator("text=Completing sign in")).toBeVisible();
    await expect(page.locator(".animate-spin")).toBeVisible();
  });

  test("should handle auth callback timeout gracefully", async ({ page }) => {
    // Mock a slow auth response
    await page.route("**/auth/**", async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto("/auth/callback");

    // Should show loading state initially
    await expect(page.locator("text=Completing sign in")).toBeVisible();
  });

  // Integration test requiring Supabase connection - marked as optional
  test.skip("should complete magic link flow", async ({ page }) => {
    // This test would require actual email sending/receiving
    // Skip for now as it needs real Supabase integration

    await page.goto("/auth");

    const emailInput = page.locator('input[type="email"]');
    const submitButton = page.locator('button[type="submit"]');

    await emailInput.fill("test@example.com");
    await submitButton.click();

    // Check for success message
    await expect(page.locator("text=Check your email")).toBeVisible();
  });

  test("should maintain session across page refreshes", async ({ page }) => {
    // This test assumes user is authenticated
    // Skip if no auth state exists
    test.skip(!process.env.TEST_AUTH_TOKEN, "No test auth token available");

    // Set auth token in localStorage if available
    await page.goto("/");
    await page.evaluate((token) => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: { id: "test-user" },
            session: { access_token: token },
          },
        })
      );
    }, process.env.TEST_AUTH_TOKEN);

    await page.goto("/tasks/create");
    await page.reload();

    // Should remain on tasks page after refresh
    expect(page.url()).toContain("/tasks");
  });

  test("should clear auth state on sign out", async ({ page }) => {
    // Set initial auth state
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem(
        "auth-storage",
        JSON.stringify({
          state: {
            user: { id: "test-user" },
            session: { access_token: "test-token" },
          },
        })
      );
    });

    await page.goto("/tasks/create");

    // Find and click sign out button
    const signOutButton = page.locator(
      'button:has-text("Sign out"), button:has-text("Logout"), a:has-text("Sign out")'
    );
    await signOutButton.first().click();

    // Should redirect to auth page and clear localStorage
    await page.waitForURL("/auth");

    const authStorage = await page.evaluate(() => {
      return localStorage.getItem("auth-storage");
    });

    // Auth storage should be cleared or reset
    expect(authStorage).toBeNull();
  });
});
