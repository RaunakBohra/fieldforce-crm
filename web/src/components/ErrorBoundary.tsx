import { Component } from 'react';
import type { ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary Component
 * Catches JavaScript errors in child components and displays fallback UI
 * Prevents entire app crash due to component errors
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Error Boundary caught an error:', error, errorInfo);

    // In production, send to error tracking service (e.g., Sentry)
    if (import.meta.env.PROD) {
      // TODO: Send to error tracking service
      // e.g., Sentry.captureException(error, { extra: errorInfo });
    }
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-neutral-100">
          <div className="max-w-lg w-full bg-white shadow-lg rounded-lg p-8 mx-4">
            <div className="flex flex-col items-center justify-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto bg-danger-100 rounded-full mb-4">
                <AlertCircle className="w-8 h-8 text-danger-600" />
              </div>
              <h3 className="text-xl font-semibold text-neutral-900 mb-2 text-center">
                Something Went Wrong
              </h3>
              <p className="text-neutral-600 text-center mb-6 max-w-md">
                {this.state.error?.message || 'An unexpected error occurred. Please try again or return to the home page.'}
              </p>

              {!import.meta.env.PROD && this.state.error && (
                <details className="w-full mt-4 mb-6">
                  <summary className="cursor-pointer font-medium text-sm text-neutral-700 bg-neutral-100 px-4 py-2 rounded-lg hover:bg-neutral-200 transition-colors">
                    View Error Details (Development Only)
                  </summary>
                  <pre className="mt-3 p-4 bg-neutral-50 border border-neutral-200 rounded-lg overflow-auto text-xs text-neutral-800 max-h-64">
                    {this.state.error.stack}
                  </pre>
                </details>
              )}

              <div className="flex flex-col sm:flex-row gap-3 w-full">
                <button
                  onClick={this.resetError}
                  className="flex-1 btn-primary"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Try Again</span>
                </button>
                <button
                  onClick={() => window.location.href = '/'}
                  className="flex-1 btn-secondary"
                >
                  <Home className="w-4 h-4" />
                  <span>Go Home</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
