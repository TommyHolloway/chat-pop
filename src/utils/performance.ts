/**
 * Performance Monitoring Utilities
 * Tracks Web Vitals and provides performance insights
 */

interface PerformanceMetric {
  name: string;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

/**
 * Report Web Vitals metrics for monitoring
 */
export function reportWebVitals(onReport?: (metric: PerformanceMetric) => void) {
  if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
    return;
  }

  // Largest Contentful Paint (LCP)
  try {
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const lastEntry = entries[entries.length - 1] as any;
      const lcpValue = lastEntry.startTime;
      
      const metric: PerformanceMetric = {
        name: 'LCP',
        value: lcpValue,
        rating: lcpValue <= 2500 ? 'good' : lcpValue <= 4000 ? 'needs-improvement' : 'poor'
      };
      
      console.log('📊 LCP:', lcpValue.toFixed(0), 'ms', `(${metric.rating})`);
      onReport?.(metric);
    });
    
    lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
  } catch (error) {
    console.warn('LCP observation failed:', error);
  }

  // First Input Delay (FID)
  try {
    const fidObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      entries.forEach((entry: any) => {
        const fidValue = entry.processingStart - entry.startTime;
        
        const metric: PerformanceMetric = {
          name: 'FID',
          value: fidValue,
          rating: fidValue <= 100 ? 'good' : fidValue <= 300 ? 'needs-improvement' : 'poor'
        };
        
        console.log('📊 FID:', fidValue.toFixed(0), 'ms', `(${metric.rating})`);
        onReport?.(metric);
      });
    });
    
    fidObserver.observe({ type: 'first-input', buffered: true });
  } catch (error) {
    console.warn('FID observation failed:', error);
  }

  // Cumulative Layout Shift (CLS)
  try {
    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        const layoutShift = entry as any;
        if (!layoutShift.hadRecentInput) {
          clsValue += layoutShift.value;
        }
      }
      
      const metric: PerformanceMetric = {
        name: 'CLS',
        value: clsValue,
        rating: clsValue <= 0.1 ? 'good' : clsValue <= 0.25 ? 'needs-improvement' : 'poor'
      };
      
      console.log('📊 CLS:', clsValue.toFixed(3), `(${metric.rating})`);
      onReport?.(metric);
    });
    
    clsObserver.observe({ type: 'layout-shift', buffered: true });
  } catch (error) {
    console.warn('CLS observation failed:', error);
  }

  // Time to First Byte (TTFB)
  try {
    const navEntry = performance.getEntriesByType('navigation')[0] as any;
    if (navEntry) {
      const ttfbValue = navEntry.responseStart - navEntry.requestStart;
      
      const metric: PerformanceMetric = {
        name: 'TTFB',
        value: ttfbValue,
        rating: ttfbValue <= 800 ? 'good' : ttfbValue <= 1800 ? 'needs-improvement' : 'poor'
      };
      
      console.log('📊 TTFB:', ttfbValue.toFixed(0), 'ms', `(${metric.rating})`);
      onReport?.(metric);
    }
  } catch (error) {
    console.warn('TTFB calculation failed:', error);
  }
}

/**
 * Mark a custom performance timing
 */
export function markPerformance(name: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    performance.mark(name);
  }
}

/**
 * Measure time between two performance marks
 */
export function measurePerformance(name: string, startMark: string, endMark: string) {
  if (typeof window !== 'undefined' && 'performance' in window) {
    try {
      performance.measure(name, startMark, endMark);
      const measure = performance.getEntriesByName(name)[0];
      console.log(`⏱️ ${name}:`, measure.duration.toFixed(0), 'ms');
      return measure.duration;
    } catch (error) {
      console.warn(`Performance measurement failed for ${name}:`, error);
      return 0;
    }
  }
  return 0;
}
