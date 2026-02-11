import { Page, Locator, expect } from '@playwright/test';

/**
 * Debug step configuration
 */
interface DebugStepOptions {
  timestamp?: boolean;
  separator?: boolean;
  data?: unknown;
}

/**
 * Print a debug step to the console
 *
 * @param name - Step name/description
 * @param options - Configuration options
 */
export function debugStep(name: string, options: DebugStepOptions = {}): void {
  const { timestamp = true, separator = true, data } = options;

  if (separator) {
    console.log(`\n${'='.repeat(60)}`);
  }

  const timeStr = timestamp ? `[${new Date().toISOString()}] ` : '';
  console.log(`${timeStr}[DEBUG STEP] ${name}`);

  if (data !== undefined) {
    if (typeof data === 'object') {
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log(data);
    }
  }

  if (separator) {
    console.log('='.repeat(60));
  }
}

/**
 * Wait for element and log the action
 *
 * @param page - Playwright page instance
 * @param selector - CSS selector
 * @param options - Wait options
 * @returns The found locator
 */
export async function waitAndDebug(
  page: Page,
  selector: string,
  options: { timeout?: number; state?: 'attached' | 'detached' | 'visible' | 'hidden' } = {}
): Promise<Locator> {
  const { timeout = 10000, state = 'visible' } = options;

  console.log(`[WAITING] ${selector} (state: ${state}, timeout: ${timeout}ms)`);

  const locator = page.locator(selector);
  await locator.waitFor({ state, timeout });

  console.log(`[FOUND] ${selector}`);
  return locator;
}

/**
 * Take a screenshot with a descriptive name
 *
 * @param page - Playwright page instance
 * @param name - Screenshot name
 */
export async function screenshotStep(page: Page, name: string): Promise<void> {
  const filename = `${name.replace(/\s+/g, '-').toLowerCase()}-${Date.now()}.png`;
  console.log(`[SCREENSHOT] Taking: ${filename}`);
  await page.screenshot({ path: `test-results/screenshots/${filename}`, fullPage: true });
  console.log(`[SCREENSHOT] Saved: ${filename}`);
}

/**
 * Log the current URL
 *
 * @param page - Playwright page instance
 */
export function logCurrentUrl(page: Page): void {
  console.log(`[URL] ${page.url()}`);
}

/**
 * Log page title
 *
 * @param page - Playwright page instance
 */
export async function logPageTitle(page: Page): Promise<void> {
  const title = await page.title();
  console.log(`[TITLE] ${title}`);
}

/**
 * Fill form field with debug output
 *
 * @param page - Playwright page instance
 * @param selector - Field selector
 * @param value - Value to fill
 */
export async function fillWithDebug(
  page: Page,
  selector: string,
  value: string
): Promise<void> {
  console.log(`[FILL] ${selector} = "${value.substring(0, 50)}${value.length > 50 ? '...' : ''}"`);
  await page.fill(selector, value);
}

/**
 * Click element with debug output
 *
 * @param page - Playwright page instance
 * @param selector - Element selector
 */
export async function clickWithDebug(page: Page, selector: string): Promise<void> {
  console.log(`[CLICK] ${selector}`);
  await page.click(selector);
}

/**
 * Wait for navigation with debug output
 *
 * @param page - Playwright page instance
 * @param urlPattern - Expected URL pattern (regex or string)
 */
export async function waitForNavigationDebug(
  page: Page,
  urlPattern: string | RegExp
): Promise<void> {
  console.log(`[NAVIGATION] Waiting for URL: ${urlPattern}`);
  await page.waitForURL(urlPattern);
  console.log(`[NAVIGATION] Arrived at: ${page.url()}`);
}

/**
 * Assert element text with debug output
 *
 * @param locator - Playwright locator
 * @param expectedText - Expected text content
 */
export async function assertTextDebug(
  locator: Locator,
  expectedText: string | RegExp
): Promise<void> {
  console.log(`[ASSERT] Checking text: "${expectedText}"`);
  await expect(locator).toContainText(expectedText);
  console.log(`[ASSERT] Text verified`);
}

/**
 * Assert element is visible with debug output
 *
 * @param locator - Playwright locator
 */
export async function assertVisibleDebug(locator: Locator): Promise<void> {
  console.log(`[ASSERT] Checking visibility`);
  await expect(locator).toBeVisible();
  console.log(`[ASSERT] Element is visible`);
}

/**
 * Wait for API response
 *
 * @param page - Playwright page instance
 * @param urlPattern - API endpoint pattern
 * @param action - Action to perform that triggers the API call
 */
export async function waitForApiResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>
): Promise<{ status: number; body: unknown }> {
  console.log(`[API] Waiting for response matching: ${urlPattern}`);

  const responsePromise = page.waitForResponse(urlPattern);
  await action();
  const response = await responsePromise;

  const status = response.status();
  let body: unknown;

  try {
    body = await response.json();
  } catch {
    body = await response.text();
  }

  console.log(`[API] Response: ${status}`);

  return { status, body };
}

/**
 * Performance timing helper
 */
export class PerformanceTimer {
  private startTime: number;
  private markers: Map<string, number> = new Map();

  constructor(name: string) {
    this.startTime = Date.now();
    console.log(`[PERF] Timer started: ${name}`);
  }

  mark(name: string): void {
    const elapsed = Date.now() - this.startTime;
    this.markers.set(name, elapsed);
    console.log(`[PERF] Mark "${name}": ${elapsed}ms`);
  }

  end(name: string): number {
    const elapsed = Date.now() - this.startTime;
    console.log(`[PERF] Timer ended: ${name} - Total: ${elapsed}ms`);
    return elapsed;
  }

  getMarkers(): Record<string, number> {
    return Object.fromEntries(this.markers);
  }
}

/**
 * Check for accessibility issues (basic)
 *
 * @param page - Playwright page instance
 */
export async function checkAccessibility(page: Page): Promise<{ issues: string[] }> {
  console.log('[A11Y] Checking basic accessibility...');

  const issues: string[] = [];

  // Check for images without alt text
  const imagesWithoutAlt = await page.locator('img:not([alt])').count();
  if (imagesWithoutAlt > 0) {
    issues.push(`${imagesWithoutAlt} image(s) without alt text`);
  }

  // Check for buttons without accessible names
  const buttonsWithoutLabel = await page.locator('button:not([aria-label]):not(:has-text(*))').count();
  if (buttonsWithoutLabel > 0) {
    issues.push(`${buttonsWithoutLabel} button(s) without accessible names`);
  }

  // Check for form inputs without labels
  const inputsWithoutLabels = await page.locator('input:not([aria-label]):not([id])').count();
  if (inputsWithoutLabels > 0) {
    issues.push(`${inputsWithoutLabels} input(s) without associated labels`);
  }

  if (issues.length > 0) {
    console.log(`[A11Y] Found ${issues.length} issue(s):`);
    issues.forEach((issue) => console.log(`  - ${issue}`));
  } else {
    console.log('[A11Y] No basic accessibility issues found');
  }

  return { issues };
}

/**
 * Retry helper for flaky operations
 *
 * @param operation - Async operation to retry
 * @param maxRetries - Maximum number of retries
 * @param delay - Delay between retries in ms
 */
export async function retry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: Error | undefined;

  for (let i = 0; i < maxRetries; i++) {
    try {
      console.log(`[RETRY] Attempt ${i + 1}/${maxRetries}`);
      return await operation();
    } catch (error) {
      lastError = error as Error;
      console.log(`[RETRY] Failed: ${lastError.message}`);

      if (i < maxRetries - 1) {
        console.log(`[RETRY] Waiting ${delay}ms before retry...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}
