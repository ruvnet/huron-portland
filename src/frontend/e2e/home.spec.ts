import { test, expect, ROUTES, testUtils } from './fixtures';

test.describe('Home Page', () => {
  test.beforeEach(async ({ page }) => {
    // Enable console logging for debugging
    testUtils.logConsole(page);
  });

  test('should load the home page successfully', async ({ page }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Verify page loaded
    await expect(page).toHaveURL(ROUTES.home);

    // Check for main content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });

  test('should have correct page title', async ({ page }) => {
    await page.goto(ROUTES.home);

    // Check page title contains expected text
    await expect(page).toHaveTitle(/Huron|Grants|Home/i);
  });

  test('should have navigation elements', async ({ page }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Check for header/navigation
    const nav = page.locator('nav, header');
    await expect(nav.first()).toBeVisible();
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Page should still be usable
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // Take screenshot for visual verification
    await testUtils.screenshot(page, 'home-mobile');
  });

  test('should have no accessibility violations for basic elements', async ({
    page,
  }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Check that main landmarks exist
    const main = page.locator('main');
    await expect(main).toBeVisible();

    // Check that links have accessible names
    const links = page.locator('a');
    const linkCount = await links.count();

    for (let i = 0; i < Math.min(linkCount, 5); i++) {
      const link = links.nth(i);
      const isVisible = await link.isVisible();
      if (isVisible) {
        const text = await link.textContent();
        const ariaLabel = await link.getAttribute('aria-label');
        expect(text || ariaLabel).toBeTruthy();
      }
    }
  });

  test('should handle page refresh correctly', async ({ page }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Refresh the page
    await page.reload();
    await testUtils.waitForPageLoad(page);

    // Page should still be functional
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();
  });
});
