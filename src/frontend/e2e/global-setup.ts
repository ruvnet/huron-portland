import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup runs once before all tests
 * Use for:
 * - Setting up test database
 * - Authenticating and saving state
 * - Creating global test fixtures
 */
async function globalSetup(config: FullConfig): Promise<void> {
  console.log('\n[GLOBAL SETUP] Starting E2E test suite initialization...');

  const startTime = Date.now();

  // Launch browser for setup tasks
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for the application to be ready
    const baseURL = config.projects[0]?.use?.baseURL || 'http://localhost:3000';
    console.log(`[GLOBAL SETUP] Checking application at ${baseURL}...`);

    // Try to connect to the application with retries
    let retries = 10;
    while (retries > 0) {
      try {
        const response = await page.goto(baseURL, { timeout: 5000 });
        if (response?.ok()) {
          console.log('[GLOBAL SETUP] Application is ready!');
          break;
        }
      } catch {
        retries--;
        if (retries === 0) {
          console.warn('[GLOBAL SETUP] Could not verify application is running, continuing anyway...');
        } else {
          console.log(`[GLOBAL SETUP] Waiting for application... (${retries} retries left)`);
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    // Additional setup tasks can go here:
    // - Create test user accounts
    // - Seed test data via API
    // - Set up authentication state

    console.log('[GLOBAL SETUP] Setup tasks completed');

  } catch (error) {
    console.error('[GLOBAL SETUP] Setup failed:', error);
    // Don't throw - allow tests to run and fail naturally
  } finally {
    await browser.close();
  }

  const duration = Date.now() - startTime;
  console.log(`[GLOBAL SETUP] Completed in ${duration}ms\n`);
}

export default globalSetup;
