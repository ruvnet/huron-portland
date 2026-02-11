/**
 * Performance monitoring utilities for Next.js application
 * Includes Web Vitals reporting and WASM initialization tracking
 */

// Web Vitals metric types
export interface WebVitalsMetric {
  id: string;
  name: 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB';
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  navigationType: 'navigate' | 'reload' | 'back-forward' | 'prerender';
}

// Performance thresholds based on Web Vitals guidelines
const THRESHOLDS = {
  CLS: { good: 0.1, poor: 0.25 },
  FCP: { good: 1800, poor: 3000 },
  FID: { good: 100, poor: 300 },
  INP: { good: 200, poor: 500 },
  LCP: { good: 2500, poor: 4000 },
  TTFB: { good: 800, poor: 1800 },
} as const;

/**
 * Report Web Vitals metrics
 * In development, logs to console
 * In production, can be extended to send to analytics
 */
export function reportWebVitals(metric: WebVitalsMetric): void {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

  if (isDevelopment || isDebug) {
    const threshold = THRESHOLDS[metric.name];
    const rating = getRating(metric.value, threshold);
    const color = rating === 'good' ? '\x1b[32m' : rating === 'needs-improvement' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(
      `[PERF] ${metric.name}: ${color}${formatValue(metric.name, metric.value)}${reset} (${rating})`
    );
  }

  // In production, send to analytics service
  if (process.env.NODE_ENV === 'production') {
    // Example: Send to analytics endpoint
    // sendToAnalytics({ metric, timestamp: Date.now() });
  }
}

/**
 * Get rating based on metric value and thresholds
 */
function getRating(
  value: number,
  threshold: { good: number; poor: number }
): 'good' | 'needs-improvement' | 'poor' {
  if (value <= threshold.good) return 'good';
  if (value <= threshold.poor) return 'needs-improvement';
  return 'poor';
}

/**
 * Format metric value for display
 */
function formatValue(name: string, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3);
  }
  return `${value.toFixed(2)}ms`;
}

/**
 * Measure WASM module initialization time
 */
export function measureWasmInit(startTime: number): void {
  const duration = performance.now() - startTime;
  const isDevelopment = process.env.NODE_ENV === 'development';
  const isDebug = process.env.NEXT_PUBLIC_DEBUG === 'true';

  if (isDevelopment || isDebug) {
    const rating = duration < 50 ? 'good' : duration < 200 ? 'needs-improvement' : 'poor';
    const color = rating === 'good' ? '\x1b[32m' : rating === 'needs-improvement' ? '\x1b[33m' : '\x1b[31m';
    const reset = '\x1b[0m';

    console.log(`[WASM] Initialization: ${color}${duration.toFixed(2)}ms${reset}`);
  }
}

/**
 * Performance marks and measures for custom timing
 */
export const perfMarks = {
  mark(name: string): void {
    if (typeof performance !== 'undefined' && performance.mark) {
      performance.mark(name);
    }
  },

  measure(name: string, startMark: string, endMark?: string): PerformanceMeasure | null {
    if (typeof performance !== 'undefined' && performance.measure) {
      try {
        const measure = performance.measure(name, startMark, endMark);

        if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_DEBUG === 'true') {
          console.log(`[PERF] ${name}: ${measure.duration.toFixed(2)}ms`);
        }

        return measure;
      } catch {
        return null;
      }
    }
    return null;
  },

  clearMarks(name?: string): void {
    if (typeof performance !== 'undefined' && performance.clearMarks) {
      performance.clearMarks(name);
    }
  },

  clearMeasures(name?: string): void {
    if (typeof performance !== 'undefined' && performance.clearMeasures) {
      performance.clearMeasures(name);
    }
  },
};

/**
 * Track component render time (for development profiling)
 */
export function trackRenderTime(componentName: string): () => void {
  const startTime = performance.now();

  return () => {
    const duration = performance.now() - startTime;
    if (process.env.NODE_ENV === 'development') {
      if (duration > 16.67) {
        // Longer than one frame at 60fps
        console.warn(`[RENDER] ${componentName}: ${duration.toFixed(2)}ms (slow)`);
      }
    }
  };
}

/**
 * Resource timing observer for monitoring asset loading
 */
export function observeResourceTiming(): PerformanceObserver | null {
  if (typeof PerformanceObserver === 'undefined') {
    return null;
  }

  const observer = new PerformanceObserver((list) => {
    const entries = list.getEntries() as PerformanceResourceTiming[];

    for (const entry of entries) {
      // Only log slow resources in development
      if (process.env.NODE_ENV === 'development' && entry.duration > 500) {
        console.warn(
          `[RESOURCE] Slow load: ${entry.name} took ${entry.duration.toFixed(2)}ms`
        );
      }
    }
  });

  try {
    observer.observe({ type: 'resource', buffered: false });
    return observer;
  } catch {
    return null;
  }
}

/**
 * Memory usage monitoring (Chrome only)
 */
export function getMemoryUsage(): { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } | null {
  if (typeof performance !== 'undefined' && 'memory' in performance) {
    const memory = (performance as unknown as { memory: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit,
    };
  }
  return null;
}

/**
 * Log memory usage in development
 */
export function logMemoryUsage(label = 'Memory'): void {
  if (process.env.NODE_ENV !== 'development') return;

  const memory = getMemoryUsage();
  if (memory) {
    const used = (memory.usedJSHeapSize / 1024 / 1024).toFixed(2);
    const total = (memory.totalJSHeapSize / 1024 / 1024).toFixed(2);
    const limit = (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2);

    console.log(`[${label}] Used: ${used}MB / Total: ${total}MB / Limit: ${limit}MB`);
  }
}
