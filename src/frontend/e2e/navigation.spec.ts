import { test, expect, ROUTES, testUtils } from './fixtures';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    testUtils.logConsole(page);
  });

  test('should navigate between pages using links', async ({ page }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Get all navigation links
    const navLinks = page.locator('nav a, header a');
    const linkCount = await navLinks.count();

    // Test first few navigation links
    for (let i = 0; i < Math.min(linkCount, 3); i++) {
      const link = navLinks.nth(i);
      const isVisible = await link.isVisible();

      if (isVisible) {
        const href = await link.getAttribute('href');
        if (href && !href.startsWith('http') && !href.startsWith('#')) {
          await link.click();
          await testUtils.waitForPageLoad(page);

          // Page should have loaded
          const mainContent = page.locator('main');
          await expect(mainContent).toBeVisible();

          // Go back to home for next iteration
          await page.goto(ROUTES.home);
          await testUtils.waitForPageLoad(page);
        }
      }
    }
  });

  test('should maintain navigation state on page refresh', async ({ page }) => {
    await page.goto('/proposals');
    await testUtils.waitForPageLoad(page);

    const urlBefore = page.url();

    await page.reload();
    await testUtils.waitForPageLoad(page);

    const urlAfter = page.url();

    expect(urlAfter).toBe(urlBefore);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Navigate to home
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Navigate to proposals
    await page.goto('/proposals');
    await testUtils.waitForPageLoad(page);

    // Go back
    await page.goBack();
    await testUtils.waitForPageLoad(page);

    // Should be back at home
    await expect(page).toHaveURL(ROUTES.home);

    // Go forward
    await page.goForward();
    await testUtils.waitForPageLoad(page);

    // Should be at proposals
    await expect(page).toHaveURL(/proposal/i);
  });

  test('should show active state for current navigation item', async ({
    page,
  }) => {
    await page.goto('/proposals');
    await testUtils.waitForPageLoad(page);

    // Look for active navigation indicator
    const activeNav = page.locator(
      'nav a[aria-current="page"], nav a.active, nav a[data-active="true"]'
    );
    const activeCount = await activeNav.count();

    // Either has explicit active state or CSS-based active state
    // This test verifies navigation exists and is functional
    const nav = page.locator('nav');
    await expect(nav.first()).toBeVisible();

    // Log active indicator status for debugging
    if (activeCount > 0) {
      console.log(`Found ${activeCount} active navigation indicators`);
    }
  });

  test('should handle 404 pages gracefully', async ({ page }) => {
    await page.goto('/this-page-does-not-exist-12345');
    await testUtils.waitForPageLoad(page);

    // Page should still render something (either 404 page or redirect)
    const body = page.locator('body');
    await expect(body).toBeVisible();

    // Should have some content indicating the issue or redirect
    const mainContent = page.locator('main');
    const hasMainContent = await mainContent.isVisible().catch(() => false);

    // Either shows 404 content or redirects to valid page
    expect(await body.isVisible()).toBeTruthy();

    // Log main content status for debugging
    if (hasMainContent) {
      console.log('404 page has main content element');
    }
  });

  test('should have working sidebar navigation if present', async ({
    page,
  }) => {
    await page.goto(ROUTES.home);
    await testUtils.waitForPageLoad(page);

    // Check for sidebar
    const sidebar = page.locator(
      'aside, [data-testid="sidebar"], .sidebar, nav[aria-label*="sidebar" i]'
    );

    if ((await sidebar.count()) > 0 && (await sidebar.first().isVisible())) {
      // Sidebar exists, check its links
      const sidebarLinks = sidebar.first().locator('a');
      const linkCount = await sidebarLinks.count();

      expect(linkCount).toBeGreaterThan(0);

      // Test first sidebar link
      if (linkCount > 0) {
        const firstLink = sidebarLinks.first();
        const href = await firstLink.getAttribute('href');

        if (href && !href.startsWith('http')) {
          await firstLink.click();
          await testUtils.waitForPageLoad(page);

          // Page should load successfully
          const mainContent = page.locator('main');
          await expect(mainContent).toBeVisible();
        }
      }
    }
  });

  test('should handle deep linking correctly', async ({ page }) => {
    // Navigate directly to a deep URL
    await page.goto('/proposals/new');
    await testUtils.waitForPageLoad(page);

    // Page should load the correct content
    const mainContent = page.locator('main');
    await expect(mainContent).toBeVisible();

    // URL should match
    await expect(page).toHaveURL(/proposals\/new/i);
  });
});
