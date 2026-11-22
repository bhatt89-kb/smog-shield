/**
 * Performance monitoring utilities for Web Vitals and custom metrics.
 * Tracks Core Web Vitals (CLS, FID, LCP) and custom performance markers.
 * 
 * @module performance
 */

/**
 * Web Vitals metric type.
 */
export interface WebVitalsMetric {
  /** Metric name (CLS, FID, FCP, LCP, TTFB, INP) */
  name: string;
  /** Metric value */
  value: number;
  /** Rating (good, needs-improvement, poor) */
  rating: "good" | "needs-improvement" | "poor";
  /** Delta from previous value */
  delta: number;
  /** Unique ID for this page visit */
  id: string;
}

/**
 * Reports Web Vitals metrics.
 * In production, send these to your analytics service.
 * 
 * @param {WebVitalsMetric} metric - Web Vitals metric object
 * 
 * @example
 * import { getCLS, getFID, getLCP } from 'web-vitals';
 * getCLS(reportWebVitals);
 * getFID(reportWebVitals);
 * getLCP(reportWebVitals);
 */
export function reportWebVitals(metric: WebVitalsMetric) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`[Web Vitals] ${metric.name}:`, {
      value: metric.value,
      rating: metric.rating,
    });
  }

  // In production, send to analytics
  if (process.env.NODE_ENV === "production") {
    // Example: Send to Google Analytics
    // window.gtag?.('event', metric.name, {
    //   value: Math.round(metric.value),
    //   metric_rating: metric.rating,
    //   metric_delta: metric.delta,
    // });

    // Example: Send to custom endpoint
    // navigator.sendBeacon?.('/api/vitals', JSON.stringify(metric));
  }
}

/**
 * Custom performance mark for timing measurements.
 * 
 * @param {string} name - Mark name
 * 
 * @example
 * mark('api-call-start');
 * await fetch('/api/data');
 * measure('api-call', 'api-call-start');
 */
export function mark(name: string): void {
  if (typeof performance !== "undefined" && performance.mark) {
    performance.mark(name);
  }
}

/**
 * Measures time between two performance marks.
 * 
 * @param {string} name - Measurement name
 * @param {string} startMark - Start mark name
 * @param {string} endMark - Optional end mark name (defaults to now)
 * @returns {number | null} Duration in milliseconds or null if unavailable
 * 
 * @example
 * mark('data-fetch-start');
 * await fetchData();
 * const duration = measure('data-fetch', 'data-fetch-start');
 * console.log(`Fetch took ${duration}ms`);
 */
export function measure(
  name: string,
  startMark: string,
  endMark?: string
): number | null {
  if (typeof performance === "undefined" || !performance.measure) {
    return null;
  }

  try {
    if (endMark) {
      performance.measure(name, startMark, endMark);
    } else {
      performance.measure(name, startMark);
    }

    const entries = performance.getEntriesByName(name, "measure");
    const lastEntry = entries[entries.length - 1];
    
    if (lastEntry) {
      const duration = lastEntry.duration;
      
      // Log in development
      if (process.env.NODE_ENV === "development") {
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
      }
      
      return duration;
    }
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error);
  }

  return null;
}

/**
 * Clears performance marks and measures.
 * 
 * @param {string} name - Optional specific mark/measure to clear
 */
export function clearPerformance(name?: string): void {
  if (typeof performance === "undefined") return;

  if (name) {
    performance.clearMarks?.(name);
    performance.clearMeasures?.(name);
  } else {
    performance.clearMarks?.();
    performance.clearMeasures?.();
  }
}

/**
 * Gets Resource Timing entries for analyzing resource load performance.
 * 
 * @returns {PerformanceResourceTiming[]} Array of resource timing entries
 */
export function getResourceTimings(): PerformanceResourceTiming[] {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return [];
  }

  return performance.getEntriesByType(
    "resource"
  ) as PerformanceResourceTiming[];
}

/**
 * Monitors Long Tasks (tasks taking >50ms) that can cause jank.
 * 
 * @param {function} callback - Called for each long task
 * @returns {function | null} Cleanup function to stop monitoring
 */
export function monitorLongTasks(
  callback: (duration: number, startTime: number) => void
): (() => void) | null {
  if (
    typeof window === "undefined" ||
    !("PerformanceObserver" in window)
  ) {
    return null;
  }

  try {
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        callback(entry.duration, entry.startTime);
      }
    });

    observer.observe({ entryTypes: ["longtask"] });

    return () => observer.disconnect();
  } catch {
    return null;
  }
}

/**
 * Gets navigation timing metrics for page load analysis.
 * 
 * @returns {object | null} Navigation timing data or null
 */
export function getNavigationTiming(): {
  dns: number;
  tcp: number;
  request: number;
  response: number;
  dom: number;
  load: number;
} | null {
  if (typeof performance === "undefined" || !performance.getEntriesByType) {
    return null;
  }

  const [nav] = performance.getEntriesByType(
    "navigation"
  ) as PerformanceNavigationTiming[];

  if (!nav) return null;

  return {
    dns: nav.domainLookupEnd - nav.domainLookupStart,
    tcp: nav.connectEnd - nav.connectStart,
    request: nav.responseStart - nav.requestStart,
    response: nav.responseEnd - nav.responseStart,
    dom: nav.domContentLoadedEventEnd - nav.domContentLoadedEventStart,
    load: nav.loadEventEnd - nav.loadEventStart,
  };
}
