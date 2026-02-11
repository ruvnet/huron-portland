import { defineConfig, devices } from '@playwright/test';
import path from 'path';

/**
 * Playwright E2E Test Configuration
 * Comprehensive setup with browser debugging, console logging, and reporting
 * @see https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  // Test directory
  testDir: './e2e',

  // Test file patterns
  testMatch: '**/*.spec.ts',

  // Run tests in parallel
  fullyParallel: true,

  // Fail build on CI if test.only is left in code
  forbidOnly: !!process.env.CI,

  // Retry on CI only
  retries: process.env.CI ? 2 : 0,

  // Parallel workers configuration
  workers: process.env.CI ? 1 : undefined,

  // Reporter configuration
  reporter: [
    // HTML reporter for detailed reports
    ['html', { outputFolder: 'test-results/html-report', open: 'never' }],
    // List reporter for console output
    ['list'],
    // JSON reporter for CI integration
    ['json', { outputFile: 'test-results/results.json' }],
    // JUnit reporter for CI systems
    ['junit', { outputFile: 'test-results/junit.xml' }],
    // GitHub Actions reporter (conditional)
    ...(process.env.CI ? [['github'] as const] : []),
  ],

  // Output directory for test artifacts
  outputDir: 'test-results/artifacts',

  // Global test timeout
  timeout: 30000,

  // Expect timeout for assertions
  expect: {
    timeout: 10000,
  },

  // Shared settings for all tests
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3000',

    // Collect trace on first retry for easier debugging
    trace: 'on-first-retry',

    // Take screenshot only on failure
    screenshot: 'only-on-failure',

    // Retain video on failure for debugging
    video: 'retain-on-failure',

    // Enable browser console logging
    launchOptions: {
      args: [
        '--enable-logging',
        '--v=1',
        // Disable GPU for CI environments
        '--disable-gpu',
        // Disable sandbox for Docker/container environments
        '--no-sandbox',
        '--disable-setuid-sandbox',
        // Additional debugging flags
        '--disable-dev-shm-usage',
      ],
    },

    // Action timeout
    actionTimeout: 10000,

    // Navigation timeout
    navigationTimeout: 30000,

    // Ignore HTTPS errors (useful for local development)
    ignoreHTTPSErrors: true,

    // Viewport size
    viewport: { width: 1280, height: 720 },

    // Enable JavaScript
    javaScriptEnabled: true,

    // Locale
    locale: 'en-US',

    // Timezone
    timezoneId: 'America/New_York',

    // Color scheme
    colorScheme: 'light',

    // Geolocation (optional)
    // geolocation: { longitude: -73.935242, latitude: 40.730610 },

    // Permissions
    permissions: ['geolocation'],
  },

  // Configure projects for cross-browser testing
  projects: [
    // Desktop Chrome - Primary browser
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use Chrome channel for more stable results
        channel: 'chrome',
      },
    },

    // Desktop Firefox
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    // Desktop Safari (WebKit)
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    // Mobile Chrome
    {
      name: 'mobile-chrome',
      use: { ...devices['Pixel 5'] },
    },

    // Mobile Safari
    {
      name: 'mobile-safari',
      use: { ...devices['iPhone 12'] },
    },

    // Tablet
    {
      name: 'tablet',
      use: { ...devices['iPad (gen 7)'] },
    },
  ],

  // Web server configuration - starts dev server before tests
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
    stdout: 'pipe',
    stderr: 'pipe',
    env: {
      // Pass environment variables to the dev server
      NODE_ENV: 'test',
    },
  },

  // Global setup/teardown
  globalSetup: path.join(__dirname, 'e2e/global-setup.ts'),
  globalTeardown: path.join(__dirname, 'e2e/global-teardown.ts'),

  // Metadata for test reports
  metadata: {
    project: 'huron-bangalore',
    environment: process.env.CI ? 'ci' : 'local',
  },
});
