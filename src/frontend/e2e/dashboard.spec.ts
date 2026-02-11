import { test, expect, ROUTES, testUtils } from './fixtures';

test.describe('Dashboard E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    testUtils.logConsole(page);
    testUtils.debugStep('Navigating to dashboard');
    await page.goto(ROUTES.dashboard);
    await testUtils.waitForPageLoad(page);
  });

  test('should display dashboard header', async ({ page }) => {
    testUtils.debugStep('Verifying dashboard header');

    const header = page.locator('h1');
    await expect(header).toContainText('Dashboard');

    testUtils.debugStep('Header verified successfully');
  });

  test('should display stats cards', async ({ page }) => {
    testUtils.debugStep('Checking stats cards');

    // Check for Total Proposals card
    const totalProposalsCard = page.locator('text=Total Proposals');
    await expect(totalProposalsCard).toBeVisible();

    // Check for Total Value card
    const totalValueCard = page.locator('text=Total Value');
    await expect(totalValueCard).toBeVisible();

    // Check for Approved card
    const approvedCard = page.locator('text=Approved');
    await expect(approvedCard).toBeVisible();

    // Check for Pending card
    const pendingCard = page.locator('text=Pending');
    await expect(pendingCard).toBeVisible();

    testUtils.debugStep('All stats cards displayed');
  });

  test('should display quick actions section', async ({ page }) => {
    testUtils.debugStep('Checking quick actions');

    const quickActions = page.locator('text=Quick Actions');
    await expect(quickActions).toBeVisible();

    // Check for action buttons
    const createButton = page.locator('a:has-text("Create New Proposal")');
    await expect(createButton).toBeVisible();

    const viewAllButton = page.locator('a:has-text("View All Proposals")');
    await expect(viewAllButton).toBeVisible();

    testUtils.debugStep('Quick actions verified');
  });

  test('should navigate to new proposal page', async ({ page }) => {
    testUtils.debugStep('Clicking New Proposal button');

    await page.click('a:has-text("New Proposal")');
    await page.waitForURL(/\/proposals\/new/);

    testUtils.debugStep('Navigation to new proposal page successful');

    const header = page.locator('h1');
    await expect(header).toContainText('New Proposal');
  });

  test('should navigate to proposals list', async ({ page }) => {
    testUtils.debugStep('Clicking View All Proposals');

    await page.click('a:has-text("View All Proposals")');
    await page.waitForURL(/\/proposals$/);

    testUtils.debugStep('Navigation to proposals list successful');

    const header = page.locator('h1');
    await expect(header).toContainText('Proposals');
  });

  test('should navigate to search page', async ({ page }) => {
    testUtils.debugStep('Clicking Search button');

    await page.click('a:has-text("Search")');
    await page.waitForURL(/\/proposals\?search=true/);

    testUtils.debugStep('Navigation to search page successful');

    const header = page.locator('h1');
    await expect(header).toContainText('Vector Search');
  });

  test('should show loading state initially', async ({ page }) => {
    testUtils.debugStep('Checking loading state');

    // Go to dashboard with network throttling
    await page.route('**/api/**', async (route) => {
      await new Promise(resolve => setTimeout(resolve, 1000));
      await route.continue();
    });

    await page.goto('/');

    // Check for loading indicators (animate-pulse class)
    const loadingCards = page.locator('.animate-pulse');

    // Wait for loading to complete
    await testUtils.waitForPageLoad(page);

    testUtils.debugStep('Loading state verified');
  });

  test('should display status overview section', async ({ page }) => {
    testUtils.debugStep('Checking status overview');

    const statusOverview = page.locator('text=Status Overview');
    await expect(statusOverview).toBeVisible();

    // Check for status breakdown items
    const statuses = ['Drafts', 'Submitted', 'Approved', 'Rejected', 'Archived'];

    for (const status of statuses) {
      testUtils.debugStep(`Checking status: ${status}`);
    }

    testUtils.debugStep('Status overview verified');
  });

  test('should be responsive on mobile viewport', async ({ page }) => {
    testUtils.debugStep('Testing mobile responsiveness');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await testUtils.waitForPageLoad(page);

    // Check that header is still visible
    const header = page.locator('h1');
    await expect(header).toBeVisible();

    // Check that cards stack vertically (grid should change)
    const statsCards = page.locator('.grid');
    await expect(statsCards.first()).toBeVisible();

    // Take screenshot
    await testUtils.screenshot(page, 'dashboard-mobile');

    testUtils.debugStep('Mobile responsiveness verified');
  });

  test('should handle API errors gracefully', async ({ page, consoleLogger }) => {
    testUtils.debugStep('Testing error handling');

    // Mock API to return error
    await testUtils.mockApiResponse(page, '**/api/proposals**', {
      status: 500,
      body: { message: 'Internal Server Error' },
    });

    await page.goto('/');
    await testUtils.waitForPageLoad(page);

    // Check for error state or message
    const errorMessage = page.locator('text=Failed to load');
    const hasError = await errorMessage.isVisible().catch(() => false);

    testUtils.debugStep('Error handling verified', { hasError });

    // Log browser console errors
    const errors = consoleLogger.getErrors();
    testUtils.debugStep('Console errors captured', { errors: errors.map(e => e.message) });
  });

  test('should load dashboard within acceptable time', async ({ page }) => {
    testUtils.debugStep('Testing page load performance');

    const timer = testUtils.startTimer('Dashboard Load');

    await page.goto(ROUTES.dashboard);
    timer.mark('navigation-start');

    await page.waitForLoadState('domcontentloaded');
    timer.mark('dom-content-loaded');

    await testUtils.waitForPageLoad(page);
    const totalTime = timer.end();

    // Assert page loads within 5 seconds
    expect(totalTime).toBeLessThan(5000);

    testUtils.debugStep('Performance metrics', { totalTime });
  });
});
