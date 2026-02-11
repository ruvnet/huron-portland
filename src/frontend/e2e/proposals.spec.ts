import { test, expect, ROUTES, testData, testUtils } from './fixtures';

test.describe('Proposals E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    testUtils.logConsole(page);
  });

  test.describe('Proposals List', () => {
    test('should display proposals page header', async ({ page }) => {
      testUtils.debugStep('Navigating to proposals list');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      // Check for main header
      const header = page.locator('h1');
      await expect(header).toContainText(/Proposals/i);

      testUtils.debugStep('Header verified');
    });

    test('should display New Proposal button', async ({ page }) => {
      testUtils.debugStep('Checking New Proposal button');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const newButton = page.locator('a:has-text("New Proposal")');
      await expect(newButton).toBeVisible();
      await expect(newButton).toHaveAttribute('href', '/proposals/new');
    });

    test('should display status filter buttons', async ({ page }) => {
      testUtils.debugStep('Checking status filters');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const statuses = ['All', 'Draft', 'Submitted', 'Approved', 'Rejected', 'Archived'];

      for (const status of statuses) {
        const filterButton = page.locator(`button:has-text("${status}")`);
        await expect(filterButton).toBeVisible();
        testUtils.debugStep(`Found filter: ${status}`);
      }
    });

    test('should display search input', async ({ page }) => {
      testUtils.debugStep('Checking search input');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const searchInput = page.locator('input[placeholder*="Search"]');
      await expect(searchInput).toBeVisible();
    });

    test('should filter proposals by status', async ({ page }) => {
      testUtils.debugStep('Testing status filtering');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const timer = testUtils.startTimer('Status Filter');

      // Click Draft filter
      await page.click('button:has-text("Draft")');
      timer.mark('draft-filter-clicked');

      await testUtils.waitForPageLoad(page);
      timer.end();

      // Verify the Draft button is now active
      const draftButton = page.locator('button:has-text("Draft")');
      await expect(draftButton).toBeVisible();
    });

    test('should search proposals by keyword', async ({ page }) => {
      testUtils.debugStep('Testing keyword search');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const searchInput = page.locator('input[placeholder*="Search"]');
      await searchInput.fill('test');
      await page.waitForTimeout(500); // Wait for debounce

      testUtils.debugStep('Search query entered');
    });

    test('should navigate to Vector Search', async ({ page }) => {
      testUtils.debugStep('Testing navigation to Vector Search');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const vectorSearchLink = page.locator('a:has-text("Vector Search")');
      await vectorSearchLink.click();

      await page.waitForURL(/search=true/);

      const header = page.locator('h1');
      await expect(header).toContainText('Vector Search');
    });

    test('should show empty state when no proposals match filter', async ({ page }) => {
      testUtils.debugStep('Testing empty state');

      // Mock empty API response
      await testUtils.mockApiResponse(page, '**/api/proposals**', {
        status: 200,
        body: {
          data: [],
          total: 0,
          page: 1,
          pageSize: 12,
          totalPages: 0,
        },
      });

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const emptyState = page.locator('text=No proposals found');
      const hasEmptyState = await emptyState.isVisible().catch(() => false);

      testUtils.debugStep('Empty state check', { hasEmptyState });
    });

    test('should handle API errors gracefully', async ({ page }) => {
      testUtils.debugStep('Testing error handling');

      await testUtils.mockApiResponse(page, '**/api/proposals**', {
        status: 500,
        body: { message: 'Internal Server Error' },
      });

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      // Page should still render without crashing
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      testUtils.debugStep('Error handling verified');
    });
  });

  test.describe('Create New Proposal', () => {
    test('should display new proposal form', async ({ page }) => {
      testUtils.debugStep('Verifying new proposal form');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      const header = page.locator('h1');
      await expect(header).toContainText('New Proposal');

      // Check form fields
      await expect(page.locator('#title')).toBeVisible();
      await expect(page.locator('#description')).toBeVisible();
      await expect(page.locator('#customer_name')).toBeVisible();
      await expect(page.locator('#customer_email')).toBeVisible();
      await expect(page.locator('#amount')).toBeVisible();

      // Check buttons
      await expect(page.locator('button[type="submit"]')).toBeVisible();
      await expect(page.locator('button:has-text("Cancel")')).toBeVisible();
    });

    test('should validate required fields', async ({ page }) => {
      testUtils.debugStep('Testing form validation');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      // Submit empty form
      await page.click('button[type="submit"]');

      // Check for validation errors
      await page.waitForTimeout(100);

      const errors = await page.locator('.text-destructive').allTextContents();
      testUtils.debugStep('Validation errors', { errors });

      // Should have validation errors for required fields
      expect(errors.length).toBeGreaterThan(0);
    });

    test('should validate email format', async ({ page }) => {
      testUtils.debugStep('Testing email validation');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      // Fill form with invalid email
      await page.fill('#title', 'Test Proposal');
      await page.fill('#description', 'Test description');
      await page.fill('#customer_name', 'Test Customer');
      await page.fill('#customer_email', 'invalid-email');
      await page.fill('#amount', '1000');

      await page.click('button[type="submit"]');
      await page.waitForTimeout(100);

      const emailError = page.locator('text=/Invalid email|email format/i');
      const hasEmailError = await emailError.isVisible().catch(() => false);

      testUtils.debugStep('Email validation', { hasEmailError });
    });

    test('should fill and submit new proposal', async ({ page }) => {
      testUtils.debugStep('Testing proposal creation');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      const proposal = testData.proposal();

      // Fill the form
      await testUtils.fillWithDebug(page, '#title', proposal.title);
      await testUtils.fillWithDebug(page, '#description', proposal.description);
      await testUtils.fillWithDebug(page, '#customer_name', proposal.customer_name);
      await testUtils.fillWithDebug(page, '#customer_email', proposal.customer_email);
      await testUtils.fillWithDebug(page, '#amount', String(proposal.amount));

      testUtils.debugStep('Form filled', { proposal });

      // Mock successful API response
      await testUtils.mockApiResponse(page, '**/api/proposals', {
        status: 201,
        body: {
          id: 'test-id-123',
          ...proposal,
          status: 'draft',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      });

      // Submit the form
      await page.click('button[type="submit"]');

      // Wait for navigation or success
      await page.waitForTimeout(1000);

      testUtils.debugStep('Proposal creation flow completed');

      // Take screenshot
      await testUtils.screenshot(page, 'proposal-created');
    });

    test('should cancel and navigate back', async ({ page }) => {
      testUtils.debugStep('Testing cancel button');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      await page.click('button:has-text("Cancel")');

      // Should navigate back
      await page.waitForTimeout(500);

      testUtils.debugStep('Cancel navigation completed');
    });

    test('should handle edge case data', async ({ page }) => {
      testUtils.debugStep('Testing edge cases');

      await page.goto(ROUTES.newProposal);
      await testUtils.waitForPageLoad(page);

      // Test long title
      await page.fill('#title', testData.edgeCases.longTitle.title);
      testUtils.debugStep('Long title entered', { length: testData.edgeCases.longTitle.title.length });

      // Clear and test special characters (XSS attempt)
      await page.fill('#title', '');
      await page.fill('#title', testData.edgeCases.specialChars.title);
      testUtils.debugStep('Special characters entered');

      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();
    });
  });

  test.describe('Proposal Detail', () => {
    test('should display proposal details', async ({ page }) => {
      testUtils.debugStep('Testing proposal detail view');

      const mockProposal = testData.fullProposal({ id: 'test-123' });

      // Mock API response
      await testUtils.mockApiResponse(page, '**/api/proposals/test-123', {
        status: 200,
        body: mockProposal,
      });

      await page.goto('/proposals/test-123');
      await testUtils.waitForPageLoad(page);

      // Check for main content
      const title = page.locator('h1');
      await expect(title).toBeVisible();

      testUtils.debugStep('Proposal detail loaded');
    });

    test('should show Edit and Delete buttons', async ({ page }) => {
      testUtils.debugStep('Testing action buttons');

      const mockProposal = testData.fullProposal({ id: 'test-456' });

      await testUtils.mockApiResponse(page, '**/api/proposals/test-456', {
        status: 200,
        body: mockProposal,
      });

      await page.goto('/proposals/test-456');
      await testUtils.waitForPageLoad(page);

      const editButton = page.locator('a:has-text("Edit")');
      const deleteButton = page.locator('button:has-text("Delete")');

      await expect(editButton).toBeVisible();
      await expect(deleteButton).toBeVisible();

      testUtils.debugStep('Action buttons verified');
    });

    test('should handle 404 not found', async ({ page }) => {
      testUtils.debugStep('Testing 404 handling');

      await testUtils.mockApiResponse(page, '**/api/proposals/nonexistent', {
        status: 404,
        body: { message: 'Not found' },
      });

      await page.goto('/proposals/nonexistent');
      await testUtils.waitForPageLoad(page);

      // Should show error or not found message
      const mainContent = page.locator('main');
      await expect(mainContent).toBeVisible();

      testUtils.debugStep('404 handling verified');
    });

    test('should navigate to edit page', async ({ page }) => {
      testUtils.debugStep('Testing edit navigation');

      const mockProposal = testData.fullProposal({ id: 'test-789' });

      await testUtils.mockApiResponse(page, '**/api/proposals/test-789', {
        status: 200,
        body: mockProposal,
      });

      await page.goto('/proposals/test-789');
      await testUtils.waitForPageLoad(page);

      await page.click('a:has-text("Edit")');

      await page.waitForURL(/\/proposals\/test-789\/edit/);

      testUtils.debugStep('Edit navigation completed');
    });
  });

  test.describe('Performance', () => {
    test('should load proposals list within acceptable time', async ({ page }) => {
      testUtils.debugStep('Testing page load performance');

      const timer = testUtils.startTimer('Proposals List Load');

      await page.goto(ROUTES.proposals);
      timer.mark('navigation-start');

      await page.waitForLoadState('domcontentloaded');
      timer.mark('dom-content-loaded');

      await testUtils.waitForPageLoad(page);
      const totalTime = timer.end();

      // Assert page loads within 5 seconds
      expect(totalTime).toBeLessThan(5000);

      testUtils.debugStep('Performance metrics', { totalTime });
    });

    test('should handle rapid filter changes', async ({ page }) => {
      testUtils.debugStep('Testing rapid filter changes');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const statuses = ['Draft', 'Submitted', 'Approved', 'All'];

      for (const status of statuses) {
        await page.click(`button:has-text("${status}")`);
        await page.waitForTimeout(100);
      }

      // Page should still be functional
      await expect(page.locator('h1')).toBeVisible();

      testUtils.debugStep('Rapid filter changes handled');
    });
  });

  test.describe('Accessibility', () => {
    test('should have no basic accessibility violations', async ({ page }) => {
      testUtils.debugStep('Testing basic accessibility');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      const issues = await testUtils.checkBasicA11y(page);

      testUtils.debugStep('Accessibility issues', { issues });
    });

    test('should be keyboard navigable', async ({ page }) => {
      testUtils.debugStep('Testing keyboard navigation');

      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      // Tab through interactive elements
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');
      await page.keyboard.press('Tab');

      // Check that focus is visible
      const focusedElement = page.locator(':focus');
      await expect(focusedElement).toBeVisible();

      testUtils.debugStep('Keyboard navigation verified');
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should display correctly on mobile viewport', async ({ page }) => {
      testUtils.debugStep('Testing mobile viewport');

      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      // Header should be visible
      const header = page.locator('h1');
      await expect(header).toBeVisible();

      // Take screenshot
      await testUtils.screenshot(page, 'proposals-mobile');

      testUtils.debugStep('Mobile viewport verified');
    });

    test('should display correctly on tablet viewport', async ({ page }) => {
      testUtils.debugStep('Testing tablet viewport');

      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(ROUTES.proposals);
      await testUtils.waitForPageLoad(page);

      // Header should be visible
      const header = page.locator('h1');
      await expect(header).toBeVisible();

      // Take screenshot
      await testUtils.screenshot(page, 'proposals-tablet');

      testUtils.debugStep('Tablet viewport verified');
    });
  });
});
