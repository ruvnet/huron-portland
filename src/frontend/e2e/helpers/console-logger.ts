import { Page, ConsoleMessage } from '@playwright/test';

/**
 * Log entry interface for browser console messages
 */
export interface ConsoleLogEntry {
  type: string;
  text: string;
  timestamp: Date;
  location?: {
    url: string;
    lineNumber: number;
    columnNumber: number;
  };
  args?: string[];
}

/**
 * Error entry interface for browser errors
 */
export interface ErrorEntry {
  message: string;
  timestamp: Date;
  stack?: string;
}

/**
 * Network request entry interface
 */
export interface NetworkEntry {
  url: string;
  method: string;
  status?: number;
  timestamp: Date;
  duration?: number;
  type: 'request' | 'response' | 'failed';
}

/**
 * ConsoleLogger - Captures and manages browser console output
 *
 * Usage:
 * ```typescript
 * const logger = new ConsoleLogger();
 * logger.attach(page);
 *
 * // After test
 * console.log(logger.getLogs());
 * logger.printSummary();
 * ```
 */
export class ConsoleLogger {
  private logs: ConsoleLogEntry[] = [];
  private errors: ErrorEntry[] = [];
  private networkRequests: NetworkEntry[] = [];
  private verbose: boolean;
  private captureNetwork: boolean;

  constructor(options: { verbose?: boolean; captureNetwork?: boolean } = {}) {
    this.verbose = options.verbose ?? true;
    this.captureNetwork = options.captureNetwork ?? false;
  }

  /**
   * Attach logger to a page instance
   */
  attach(page: Page): void {
    // Capture console messages
    page.on('console', (msg: ConsoleMessage) => {
      const entry: ConsoleLogEntry = {
        type: msg.type(),
        text: msg.text(),
        timestamp: new Date(),
        location: msg.location(),
      };

      this.logs.push(entry);

      // Output to CLI based on log type
      if (this.verbose) {
        const prefix = this.getLogPrefix(msg.type());
        console.log(`${prefix} ${msg.text()}`);
      }
    });

    // Capture page errors
    page.on('pageerror', (error: Error) => {
      const entry: ErrorEntry = {
        message: error.message,
        timestamp: new Date(),
        stack: error.stack,
      };

      this.errors.push(entry);
      console.error('[BROWSER ERROR]', error.message);

      if (error.stack && this.verbose) {
        console.error('[STACK]', error.stack);
      }
    });

    // Capture uncaught exceptions in the page context
    page.on('crash', () => {
      console.error('[BROWSER CRASH] Page crashed!');
    });

    // Capture network activity if enabled
    if (this.captureNetwork) {
      this.attachNetworkLogging(page);
    }
  }

  /**
   * Attach network request/response logging
   */
  private attachNetworkLogging(page: Page): void {
    const requestTimings = new Map<string, number>();

    page.on('request', (request) => {
      const url = request.url();
      requestTimings.set(url, Date.now());

      this.networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date(),
        type: 'request',
      });

      if (this.verbose) {
        console.log(`[NETWORK REQUEST] ${request.method()} ${url}`);
      }
    });

    page.on('response', (response) => {
      const url = response.url();
      const startTime = requestTimings.get(url);
      const duration = startTime ? Date.now() - startTime : undefined;

      this.networkRequests.push({
        url,
        method: response.request().method(),
        status: response.status(),
        timestamp: new Date(),
        duration,
        type: 'response',
      });

      if (this.verbose) {
        const durationStr = duration ? ` (${duration}ms)` : '';
        console.log(`[NETWORK RESPONSE] ${response.status()} ${url}${durationStr}`);
      }
    });

    page.on('requestfailed', (request) => {
      const url = request.url();
      const failure = request.failure();

      this.networkRequests.push({
        url,
        method: request.method(),
        timestamp: new Date(),
        type: 'failed',
      });

      console.error(`[NETWORK FAILED] ${request.method()} ${url} - ${failure?.errorText}`);
    });
  }

  /**
   * Get colored prefix for log type
   */
  private getLogPrefix(type: string): string {
    const prefixes: Record<string, string> = {
      log: '[BROWSER LOG]',
      info: '[BROWSER INFO]',
      warn: '[BROWSER WARN]',
      error: '[BROWSER ERROR]',
      debug: '[BROWSER DEBUG]',
      trace: '[BROWSER TRACE]',
    };

    return prefixes[type] || `[BROWSER ${type.toUpperCase()}]`;
  }

  /**
   * Get all captured logs
   */
  getLogs(): ConsoleLogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs filtered by type
   */
  getLogsByType(type: string): ConsoleLogEntry[] {
    return this.logs.filter((log) => log.type === type);
  }

  /**
   * Get all captured errors
   */
  getErrors(): ErrorEntry[] {
    return [...this.errors];
  }

  /**
   * Get all network requests
   */
  getNetworkRequests(): NetworkEntry[] {
    return [...this.networkRequests];
  }

  /**
   * Check if any errors were captured
   */
  hasErrors(): boolean {
    return this.errors.length > 0;
  }

  /**
   * Check if specific text appears in logs
   */
  hasLogContaining(text: string, type?: string): boolean {
    return this.logs.some(
      (log) => log.text.includes(text) && (!type || log.type === type)
    );
  }

  /**
   * Clear all captured logs
   */
  clear(): void {
    this.logs = [];
    this.errors = [];
    this.networkRequests = [];
  }

  /**
   * Print a summary of captured logs
   */
  printSummary(): void {
    console.log('\n' + '='.repeat(60));
    console.log('Browser Console Summary');
    console.log('='.repeat(60));

    const summary = {
      total: this.logs.length,
      logs: this.getLogsByType('log').length,
      info: this.getLogsByType('info').length,
      warnings: this.getLogsByType('warn').length,
      errors: this.getLogsByType('error').length,
      pageErrors: this.errors.length,
      networkRequests: this.networkRequests.filter((n) => n.type === 'request').length,
      networkFailures: this.networkRequests.filter((n) => n.type === 'failed').length,
    };

    console.log(`Total console messages: ${summary.total}`);
    console.log(`  - Logs: ${summary.logs}`);
    console.log(`  - Info: ${summary.info}`);
    console.log(`  - Warnings: ${summary.warnings}`);
    console.log(`  - Errors: ${summary.errors}`);
    console.log(`Page errors: ${summary.pageErrors}`);

    if (this.captureNetwork) {
      console.log(`Network requests: ${summary.networkRequests}`);
      console.log(`Network failures: ${summary.networkFailures}`);
    }

    if (this.errors.length > 0) {
      console.log('\nPage Errors:');
      this.errors.forEach((error, i) => {
        console.log(`  ${i + 1}. ${error.message}`);
      });
    }

    console.log('='.repeat(60) + '\n');
  }

  /**
   * Export logs as JSON
   */
  toJSON(): string {
    return JSON.stringify(
      {
        logs: this.logs,
        errors: this.errors,
        networkRequests: this.networkRequests,
      },
      null,
      2
    );
  }
}
