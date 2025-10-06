interface LoadingSpinnerProps {
  /** Spinner size */
  size?: 'sm' | 'md' | 'lg';
  /** Optional loading message */
  message?: string;
  /** Full page overlay or inline */
  fullPage?: boolean;
}

const sizeClasses = {
  sm: 'h-8 w-8',
  md: 'h-12 w-12',
  lg: 'h-16 w-16',
};

/**
 * Reusable loading spinner component
 *
 * @example
 * <LoadingSpinner message="Loading contacts..." />
 *
 * @example
 * <LoadingSpinner size="sm" />
 *
 * @example
 * // Full page loading overlay
 * {loading && <LoadingSpinner fullPage message="Please wait..." />}
 */
export function LoadingSpinner({
  size = 'md',
  message,
  fullPage = false,
}: LoadingSpinnerProps) {
  const spinner = (
    <div className="text-center">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-b-2 border-primary-600 mx-auto`}
      ></div>
      {message && <p className="mt-4 text-neutral-600">{message}</p>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-neutral-50 flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return <div className="flex items-center justify-center py-12">{spinner}</div>;
}
