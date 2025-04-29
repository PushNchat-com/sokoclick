import React, { lazy, Suspense } from "react";
import { ErrorBoundary } from "../components/ui/ErrorBoundary";

/**
 * Options for lazy loading a component
 */
interface LazyLoadOptions {
  /**
   * Fallback component to display during loading
   */
  fallback?: React.ReactNode;
  /**
   * Error boundary options
   */
  errorBoundary?: boolean;
  /**
   * Function to handle errors in the error boundary
   */
  onError?: (error: Error) => void;
  /**
   * Component to display when an error occurs
   */
  errorComponent?: React.ReactNode;
}

/**
 * Creates a lazily loaded component with suspense and error boundary
 *
 * @param importFn Function to import the component
 * @param options Options for lazy loading
 * @returns Lazily loaded component
 */
export function lazyImport<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  options: LazyLoadOptions = {},
) {
  const {
    fallback = (
      <div className="animate-pulse w-full h-32 bg-gray-200 rounded-md"></div>
    ),
    errorBoundary = true,
    onError,
    errorComponent,
  } = options;

  const LazyComponent = lazy(importFn);

  return function WithLazy(props: React.ComponentProps<T>): JSX.Element {
    const Content = (
      <Suspense fallback={fallback}>
        <LazyComponent {...props} />
      </Suspense>
    );

    if (errorBoundary) {
      return (
        <ErrorBoundary onError={onError} fallback={errorComponent}>
          {Content}
        </ErrorBoundary>
      );
    }

    return Content;
  };
}

/**
 * Creates a lazily loaded component with a specified fallback
 *
 * @param importFn Function to import the component
 * @param fallback Fallback component to display during loading
 * @returns Lazily loaded component
 */
export function lazyWithFallback<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback: React.ReactNode,
) {
  return lazyImport(importFn, { fallback });
}

/**
 * Creates a lazily loaded component with a loading spinner fallback
 *
 * @param importFn Function to import the component
 * @returns Lazily loaded component
 */
export function lazyWithSpinner<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
) {
  const fallback = (
    <div className="flex justify-center items-center py-8">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );

  return lazyImport(importFn, { fallback });
}
