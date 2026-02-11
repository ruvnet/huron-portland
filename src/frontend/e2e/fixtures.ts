import { test as base, expect, Page, ConsoleMessage } from '@playwright/test';
import { ConsoleLogger } from './helpers/console-logger';

/**
 * Custom test fixtures for Huron Bangalore E2E tests
 * Enhanced with console logging, debugging utilities, and test data
 */

// Test user credentials
export const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123',
};

// API endpoints
export const API_ENDPOINTS = {
  proposals: '/api/proposals',
  auth: '/api/auth',
  health: '/api/health',
  search: '/api/search',
};

// Page routes
export const ROUTES = {
  home: '/',
  dashboard: '/',
  proposals: '/proposals',
  newProposal: '/proposals/new',
  vectorSearch: '/proposals?search=true',
  login: '/login',
};

/**
 * Extended test fixture interface
 */
interface TestFixtures {
  consoleLogger: ConsoleLogger;
  authenticatedPage: Page;
}

/**
 * Extended test with custom fixtures
 */
export const test = base.extend<TestFixtures>({
  /**
   * Console logger fixture - automatically captures browser console output
   */
  consoleLogger: async ({ page }, use) => {
    const logger = new ConsoleLogger({
      verbose: process.env.VERBOSE_LOGS === 'true',
      captureNetwork: process.env.CAPTURE_NETWORK === 'true',
    });

    logger.attach(page);

    // Use the logger during the test
    await use(logger);

    // Print summary after test (only if there were errors or in verbose mode)
    if (logger.hasErrors() || process.env.VERBOSE_LOGS === 'true') {
      logger.printSummary();
    }
  },

  /**
   * Authenticated page fixture
   */
  authenticatedPage: async ({ page }, use) => {
    // Set up authentication state if needed
    await page.goto('/');
    await use(page);
  },
});

export { expect };

/**
 * Test data generators
 */
export const testData = {
  /**
   * Generate a random proposal title
   */
  proposalTitle: () => `Test Proposal ${Date.now()}`,

  /**
   * Generate a mock proposal object
   */
  proposal: (overrides: Partial<{
    title: string;
    description: string;
    customer_name: string;
    customer_email: string;
    amount: number;
  }> = {}) => ({
    title: `Test Proposal ${Date.now()}`,
    description: 'This is a test proposal created by E2E tests',
    customer_name: 'Test Customer',
    customer_email: `test-${Date.now()}@example.com`,
    amount: 50000,
    status: 'draft',
    ...overrides,
  }),

  /**
   * Generate a full proposal with ID and timestamps
   */
  fullProposal: (overrides: Partial<{
    id: string;
    title: string;
    description: string;
    customer_name: string;
    customer_email: string;
    amount: number;
    status: string;
  }> = {}) => ({
    id: `test-${Date.now()}`,
    title: `Test Proposal ${Date.now()}`,
    description: 'This is a test proposal description.',
    customer_name: 'Test Customer',
    customer_email: 'test@example.com',
    amount: 10000,
    status: 'draft',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  }),

  /**
   * Generate random string
   */
  randomString: (length: number = 10) => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    return Array.from(
      { length },
      () => chars[Math.floor(Math.random() * chars.length)]
    ).join('');
  },

  /**
   * Invalid proposal data for validation testing
   */
  invalidProposal: {
    emptyTitle: { title: '', description: 'Test', customer_name: 'Test', customer_email: 'test@test.com', amount: 1000 },
    emptyDescription: { title: 'Test', description: '', customer_name: 'Test', customer_email: 'test@test.com', amount: 1000 },
    invalidEmail: { title: 'Test', description: 'Test', customer_name: 'Test', customer_email: 'invalid', amount: 1000 },
    zeroAmount: { title: 'Test', description: 'Test', customer_name: 'Test', customer_email: 'test@test.com', amount: 0 },
  },

  /**
   * Edge case data
   */
  edgeCases: {
    longTitle: { title: 'A'.repeat(200), description: 'Test', customer_name: 'Test', customer_email: 'test@test.com', amount: 1000 },
    specialChars: { title: '<script>alert(1)</script>', description: 'Test "quotes"', customer_name: "O'Connor", customer_email: 'test@test.com', amount: 1000 },
    unicode: { title: 'Test Cafe', description: 'Description', customer_name: 'Jose Garcia', customer_email: 'test@test.com', amount: 1000 },
  },

  /**
   * Search test queries
   */
  searchQueries: {
    valid: ['climate research', 'software development', 'marketing'],
    special: '<script>alert(1)</script>',
    empty: '',
    long: 'A'.repeat(500),
  },
};

/**
 * Common test utilities
 */
export const testUtils = {
  /**
   * Wait for page to be fully loaded
   */
  waitForPageLoad: async (page: Page) => {
    await page.waitForLoadState('networkidle');
  },

  /**
   * Take a screenshot with timestamp
   */
  screenshot: async (page: Page, name: string) => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    await page.screenshot({
      path: `test-results/screenshots/${name}-${timestamp}.png`,
      fullPage: true,
    });
  },

  /**
   * Log browser console messages (simple version)
   */
  logConsole: (page: Page) => {
    page.on('console', (msg: ConsoleMessage) => {
      const type = msg.type();
      const text = msg.text();

      // Color code by type
      const prefix = `[Browser ${type.toUpperCase()}]`;
      console.log(`${prefix} ${text}`);
    });

    page.on('pageerror', (error: Error) => {
      console.error('[Browser ERROR]', error.message);
    });
  },

  /**
   * Debug step logger
   */
  debugStep: (name: string, data?: unknown) => {
    console.log(`\n${'='.repeat(50)}`);
    console.log(`[DEBUG STEP] ${name}`);
    if (data) console.log(JSON.stringify(data, null, 2));
    console.log('='.repeat(50));
  },

  /**
   * Wait for element with logging
   */
  waitAndDebug: async (page: Page, selector: string) => {
    console.log(`[WAITING] ${selector}`);
    await page.waitForSelector(selector);
    console.log(`[FOUND] ${selector}`);
  },

  /**
   * Fill form field with logging
   */
  fillWithDebug: async (page: Page, selector: string, value: string) => {
    console.log(`[FILL] ${selector} = "${value.substring(0, 50)}..."`);
    await page.fill(selector, value);
  },

  /**
   * Click element with logging
   */
  clickWithDebug: async (page: Page, selector: string) => {
    console.log(`[CLICK] ${selector}`);
    await page.click(selector);
  },

  /**
   * Performance timer
   */
  startTimer: (name: string) => {
    const start = Date.now();
    console.log(`[PERF] Timer started: ${name}`);

    return {
      mark: (label: string) => {
        console.log(`[PERF] ${label}: ${Date.now() - start}ms`);
      },
      end: () => {
        const duration = Date.now() - start;
        console.log(`[PERF] Timer ended: ${name} - ${duration}ms`);
        return duration;
      },
    };
  },

  /**
   * Mock API response
   */
  mockApiResponse: async (
    page: Page,
    urlPattern: string | RegExp,
    response: { status: number; body: unknown }
  ) => {
    await page.route(urlPattern, (route) => {
      route.fulfill({
        status: response.status,
        contentType: 'application/json',
        body: JSON.stringify(response.body),
      });
    });
  },

  /**
   * Check basic accessibility
   */
  checkBasicA11y: async (page: Page) => {
    const issues: string[] = [];

    // Check images without alt
    const imagesWithoutAlt = await page.locator('img:not([alt])').count();
    if (imagesWithoutAlt > 0) {
      issues.push(`${imagesWithoutAlt} image(s) without alt text`);
    }

    // Check buttons without accessible name
    const buttonsWithoutLabel = await page.locator('button:not([aria-label]):empty').count();
    if (buttonsWithoutLabel > 0) {
      issues.push(`${buttonsWithoutLabel} button(s) without accessible names`);
    }

    return issues;
  },
};
