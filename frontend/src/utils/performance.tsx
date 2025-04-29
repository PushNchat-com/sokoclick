import * as React from "react";

/**
 * Performance monitoring utilities for tracking user interactions
 */

type InteractionType =
  | "search"
  | "filter"
  | "product-load"
  | "navigation"
  | "form-submit";

interface PerformanceMetrics {
  duration: number;
  interactionType: InteractionType;
  metadata?: Record<string, any>;
}

/**
 * Monitors the performance of a function execution
 * @param fn The function to monitor
 * @param interactionType The type of interaction being monitored
 * @param metadata Additional contextual data about the interaction
 * @returns The result of the function execution
 */
export async function monitorPerformance<T>(
  fn: () => Promise<T>,
  interactionType: InteractionType,
  metadata?: Record<string, any>,
): Promise<T> {
  const startMarkName = `${interactionType}-start-${Date.now()}`;
  const endMarkName = `${interactionType}-end-${Date.now()}`;
  const measureName = `${interactionType}-measure-${Date.now()}`;

  try {
    performance.mark(startMarkName);
    const result = await fn();
    performance.mark(endMarkName);

    performance.measure(measureName, startMarkName, endMarkName);
    const measure = performance.getEntriesByName(measureName)[0];

    logPerformanceMetric({
      duration: measure.duration,
      interactionType,
      metadata,
    });

    return result;
  } catch (error) {
    // Still capture performance even if the operation failed
    performance.mark(endMarkName);
    performance.measure(measureName, startMarkName, endMarkName);
    const measure = performance.getEntriesByName(measureName)[0];

    logPerformanceMetric({
      duration: measure.duration,
      interactionType,
      metadata: {
        ...metadata,
        error: true,
        errorMessage: (error as Error).message,
      },
    });

    throw error;
  } finally {
    // Clean up performance entries
    performance.clearMarks(startMarkName);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);
  }
}

/**
 * Logs performance metrics to console and analytics
 * @param metrics The performance metrics to log
 */
function logPerformanceMetric(metrics: PerformanceMetrics): void {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log(`Performance ${metrics.interactionType}:`, metrics);
  }

  // Send to analytics service
  // This would typically be implemented with your analytics provider
  // Example: analytics.track('performance_metric', metrics);

  // In a production environment, you might send these metrics to a monitoring service
  // like Google Analytics, New Relic, etc.
}

/**
 * Creates a monitored version of a hook or function that tracks performance
 * @param hookFn The original hook function
 * @param interactionType The type of interaction to track
 * @returns A wrapped version of the hook with performance monitoring
 */
export function createMonitoredHook<T extends (...args: any[]) => any>(
  hookFn: T,
  interactionType: InteractionType,
): (...args: Parameters<T>) => ReturnType<T> {
  return (...args: Parameters<T>): ReturnType<T> => {
    const startMarkName = `${interactionType}-hook-start-${Date.now()}`;
    const endMarkName = `${interactionType}-hook-end-${Date.now()}`;
    const measureName = `${interactionType}-hook-measure-${Date.now()}`;

    performance.mark(startMarkName);
    const result = hookFn(...args);
    performance.mark(endMarkName);

    performance.measure(measureName, startMarkName, endMarkName);

    // Clean up performance entries
    performance.clearMarks(startMarkName);
    performance.clearMarks(endMarkName);
    performance.clearMeasures(measureName);

    return result;
  };
}

/**
 * HOC that adds performance monitoring to a React component
 * @param Component The component to wrap with performance monitoring
 * @param componentName The name of the component (for labeling in performance metrics)
 * @returns A wrapped version of the component with performance monitoring
 */
export function withPerformanceMonitoring<P extends object>(
  Component: React.ComponentType<P>,
  componentName: string,
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => {
    const renderStartRef = React.useRef(performance.now());

    React.useEffect(() => {
      const renderDuration = performance.now() - renderStartRef.current;

      logPerformanceMetric({
        duration: renderDuration,
        interactionType: "navigation",
        metadata: { componentName },
      });

      // Reset for any re-renders
      renderStartRef.current = performance.now();
    }, []);

    return <Component {...props} />;
  };

  WrappedComponent.displayName = `WithPerformanceMonitoring(${componentName})`;
  return WrappedComponent;
}
