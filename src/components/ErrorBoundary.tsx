/**
 * Error Boundary component for graceful error handling.
 * Catches React errors and displays fallback UI instead of crashing.
 * 
 * @module ErrorBoundary
 */

"use client";
import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error boundary component that catches JavaScript errors in child components.
 * Logs errors and displays a fallback UI.
 * 
 * @example
 * <ErrorBoundary fallback={<div>Something went wrong</div>}>
 *   <MyComponent />
 * </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log to error reporting service
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    
    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    // In production, you might want to send this to an error tracking service
    if (process.env.NODE_ENV === "production") {
      // Example: sendToErrorTracking(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div
          role="alert"
          className="mx-auto max-w-2xl rounded-lg border border-red-400 bg-red-950 p-6 text-center"
        >
          <h2 className="mb-2 text-xl font-semibold text-red-200">Something went wrong</h2>
          <p className="mb-4 text-red-300">
            We&apos;re sorry, but something unexpected happened. Please refresh the page to try again.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-md bg-red-600 px-4 py-2 font-medium text-white transition hover:bg-red-700"
          >
            Refresh Page
          </button>
          {process.env.NODE_ENV === "development" && this.state.error && (
            <details className="mt-4 text-left">
              <summary className="cursor-pointer text-sm text-red-300">
                Error details (dev only)
              </summary>
              <pre className="mt-2 overflow-auto rounded bg-red-900 p-3 text-xs text-red-200">
                {this.state.error.toString()}
                {"\n"}
                {this.state.error.stack}
              </pre>
            </details>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Hook-based error boundary wrapper for functional components.
 * Simpler API but with limitations compared to class-based boundaries.
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  fallback?: ReactNode
) {
  return function WithErrorBoundary(props: P) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    );
  };
}
