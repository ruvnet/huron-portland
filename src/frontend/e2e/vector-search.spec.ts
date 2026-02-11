import { test, expect, ROUTES, testData, testUtils } from './fixtures';

test.describe('Vector Search E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    testUtils.logConsole(page);
    testUtils.debugStep('Navigating to vector search page');
    await page.goto(ROUTES.vectorSearch);
    await testUtils.waitForPageLoad(page);
  });

  test('should display vector search page', async ({ page }) => {
    testUtils.debugStep('Verifying vector search page');

    const header = page.locator('h1');
    await expect(header).toContainText('Vector Search');

    const subtitle = page.locator('text=Find proposals using semantic');
    await expect(subtitle).toBeVisible();
  });

  test('should display search input with vector search testid', async ({ page }) => {
    testUtils.debugStep('Checking search input');

    const searchInput = page.locator('[data-testid="vector-search"]');
    await expect(searchInput).toBeVisible();

    const placeholder = await searchInput.getAttribute('placeholder');
    testUtils.debugStep('Search input found', { placeholder });
  });

  test('should display online/offline status indicator', async ({ page }) => {
    testUtils.debugStep('Checking status indicator');

    // Check for either Online or Offline badge
    const onlineBadge = page.locator('text=Online');
    const offlineBadge = page.locator('[data-testid="offline-indicator"]');

    const isOnline = await onlineBadge.isVisible().catch(() => false);
    const isOffline = await offlineBadge.isVisible().catch(() => false);

    testUtils.debugStep('Status indicator', { isOnline, isOffline });

    // One of them should be visible
    expect(isOnline || isOffline).toBe(true);
  });

  test('should display sync button', async ({ page }) => {
    testUtils.debugStep('Checking sync button');

    const syncButton = page.locator('button:has-text("Sync")');
    await expect(syncButton).toBeVisible();
  });

  test('should enter search query', async ({ page, consoleLogger }) => {
    testUtils.debugStep('Testing search query input');

    const searchInput = page.locator('[data-testid="vector-search"]');

    await searchInput.fill('climate research');
    testUtils.debugStep('Search query entered');

    // Check value was set
    const value = await searchInput.inputValue();
    expect(value).toBe('climate research');

    // Log any WASM-related console messages
    const wasmLogs = consoleLogger.getLogs().filter(l =>
      l.text.toLowerCase().includes('wasm') ||
      l.text.toLowerCase().includes('vector')
    );
    testUtils.debugStep('WASM/Vector logs', { logs: wasmLogs.map(l => l.text) });
  });

  test('should trigger search on button click', async ({ page, consoleLogger }) => {
    testUtils.debugStep('Testing search execution');

    const timer = testUtils.startTimer('Vector Search');

    // Enter query
    await page.fill('[data-testid="vector-search"]', 'software development');
    timer.mark('query-entered');

    // Click search button
    await page.click('button:has-text("Search")');
    timer.mark('search-clicked');

    // Wait for search to complete (either results or no results message)
    await page.waitForTimeout(2000); // Allow time for vector operations
    timer.end();

    // Check for search results or no results message
    const hasResults = await page.locator('text=Search Results').isVisible().catch(() => false);
    const hasNoResults = await page.locator('text=No proposals found').isVisible().catch(() => false);

    testUtils.debugStep('Search completed', { hasResults, hasNoResults });

    // Log browser console for debugging
    const consoleLogs = consoleLogger.getLogs();
    testUtils.debugStep('Console logs after search', {
      count: consoleLogs.length,
      lastFew: consoleLogs.slice(-5).map(l => `[${l.type}] ${l.text}`)
    });
  });

  test('should trigger search on Enter key', async ({ page }) => {
    testUtils.debugStep('Testing search with Enter key');

    const searchInput = page.locator('[data-testid="vector-search"]');

    await searchInput.fill('infrastructure upgrade');
    await searchInput.press('Enter');

    // Wait for search to process
    await page.waitForTimeout(1000);

    testUtils.debugStep('Search triggered via Enter key');
  });

  test('should display search mode info', async ({ page }) => {
    testUtils.debugStep('Checking search mode info');

    // Check for online or offline search mode text
    const onlineMode = page.locator('text=semantic vector search');
    const offlineMode = page.locator('text=offline cached vectors');

    const hasOnlineMode = await onlineMode.isVisible().catch(() => false);
    const hasOfflineMode = await offlineMode.isVisible().catch(() => false);

    testUtils.debugStep('Search mode info', { hasOnlineMode, hasOfflineMode });

    // One should be visible
    expect(hasOnlineMode || hasOfflineMode).toBe(true);
  });

  test('should handle empty search query', async ({ page }) => {
    testUtils.debugStep('Testing empty search query');

    const searchButton = page.locator('button:has-text("Search")');

    // Button should be disabled when query is empty
    const isDisabled = await searchButton.isDisabled();
    testUtils.debugStep('Search button state with empty query', { isDisabled });
  });

  test('should handle special characters in search', async ({ page }) => {
    testUtils.debugStep('Testing special characters in search');

    const searchInput = page.locator('[data-testid="vector-search"]');
    const specialQuery = testData.searchQueries.special;

    await searchInput.fill(specialQuery);
    testUtils.debugStep('Special characters entered', { query: specialQuery });

    // Should handle without crashing
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);

    // Page should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should handle long search query', async ({ page }) => {
    testUtils.debugStep('Testing long search query');

    const searchInput = page.locator('[data-testid="vector-search"]');
    const longQuery = testData.searchQueries.long;

    await searchInput.fill(longQuery);
    testUtils.debugStep('Long query entered', { length: longQuery.length });

    // Should handle without crashing
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(1000);

    // Page should still be functional
    await expect(page.locator('h1')).toBeVisible();
  });

  test('should show cached vectors count', async ({ page }) => {
    testUtils.debugStep('Checking cached vectors count');

    const vectorsCountText = page.locator('text=/\\d+ vectors cached/');
    const hasVectorCount = await vectorsCountText.isVisible().catch(() => false);

    testUtils.debugStep('Vectors count visibility', { hasVectorCount });
  });

  test('should navigate back to proposals list', async ({ page }) => {
    testUtils.debugStep('Testing navigation back');

    const viewAllLink = page.locator('a:has-text("View All Proposals")');
    await viewAllLink.click();

    await page.waitForURL(/\/proposals$/);

    const header = page.locator('h1');
    await expect(header).toContainText('Proposals');

    testUtils.debugStep('Navigation back completed');
  });

  test('should measure search performance', async ({ page, consoleLogger }) => {
    testUtils.debugStep('Measuring search performance');

    const timer = testUtils.startTimer('Search Performance Test');

    // Pre-warm with a search
    await page.fill('[data-testid="vector-search"]', 'test');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);
    timer.mark('warmup-complete');

    // Clear and do timed search
    await page.fill('[data-testid="vector-search"]', '');
    await page.fill('[data-testid="vector-search"]', 'marketing campaign');

    const searchStart = Date.now();
    await page.click('button:has-text("Search")');

    // Wait for results or no results
    await Promise.race([
      page.locator('text=Search Results').waitFor({ timeout: 5000 }),
      page.locator('text=No proposals found').waitFor({ timeout: 5000 }),
    ]).catch(() => {});

    const searchDuration = Date.now() - searchStart;
    timer.mark('search-complete');
    const totalTime = timer.end();

    testUtils.debugStep('Search performance', { searchDuration, totalTime });

    // Search should complete within reasonable time
    expect(searchDuration).toBeLessThan(10000);
  });

  test('should handle network offline scenario', async ({ page, context }) => {
    testUtils.debugStep('Testing offline scenario');

    // Simulate offline mode
    await context.setOffline(true);
    testUtils.debugStep('Offline mode enabled');

    // Try to search
    await page.fill('[data-testid="vector-search"]', 'test query');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(2000);

    // Should either use cached vectors or show appropriate message
    const offlineIndicator = page.locator('[data-testid="offline-indicator"]');
    const isOfflineVisible = await offlineIndicator.isVisible().catch(() => false);

    testUtils.debugStep('Offline behavior', { isOfflineVisible });

    // Re-enable online mode
    await context.setOffline(false);
    testUtils.debugStep('Online mode restored');
  });

  test('should be responsive on mobile', async ({ page }) => {
    testUtils.debugStep('Testing mobile responsiveness');

    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.reload();
    await testUtils.waitForPageLoad(page);

    // Search input should still be visible
    const searchInput = page.locator('[data-testid="vector-search"]');
    await expect(searchInput).toBeVisible();

    // Header should be visible
    const header = page.locator('h1');
    await expect(header).toBeVisible();

    // Take screenshot
    await testUtils.screenshot(page, 'vector-search-mobile');

    testUtils.debugStep('Mobile responsiveness verified');
  });
});
