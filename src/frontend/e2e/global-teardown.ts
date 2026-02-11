import { FullConfig } from '@playwright/test';

/**
 * Global teardown runs once after all tests
 * Use for:
 * - Cleaning up test data
 * - Closing external connections
 * - Generating summary reports
 */
async function globalTeardown(_config: FullConfig): Promise<void> {
  console.log('\n[GLOBAL TEARDOWN] Starting cleanup...');

  const startTime = Date.now();

  try {
    // Cleanup tasks can go here:
    // - Delete test user accounts
    // - Clean up test database
    // - Close external service connections

    console.log('[GLOBAL TEARDOWN] Cleanup completed');

  } catch (error) {
    console.error('[GLOBAL TEARDOWN] Cleanup failed:', error);
    // Don't throw - cleanup failures shouldn't fail the test suite
  }

  const duration = Date.now() - startTime;
  console.log(`[GLOBAL TEARDOWN] Completed in ${duration}ms\n`);

  // Print test summary
  console.log('=' .repeat(60));
  console.log('E2E Test Suite Completed');
  console.log('=' .repeat(60));
}

export default globalTeardown;
