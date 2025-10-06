/**
 * Shared utility functions for formatting data across the application
 * Single source of truth for all formatting logic
 */

/**
 * Format number as Indian currency (₹)
 *
 * @example
 * formatCurrency(1500) // "₹1,500"
 * formatCurrency(1500.50) // "₹1,501" (rounds by default)
 * formatCurrency(1500.50, true) // "₹1,500.50" (with decimals)
 */
export function formatCurrency(amount: number, showDecimals = false): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
}

/**
 * Format date in short format
 *
 * @example
 * formatDate('2025-10-06T12:30:00Z') // "Oct 6, 2025"
 */
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/**
 * Format date with time
 *
 * @example
 * formatDateTime('2025-10-06T12:30:00Z') // "Oct 6, 2025, 12:30 PM"
 */
export function formatDateTime(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date and time with full details (for detail pages)
 *
 * @example
 * formatDateTimeFull('2025-10-06T12:30:00Z') // "Saturday, October 6, 2025, 12:30 PM"
 */
export function formatDateTimeFull(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Format date for Indian locale
 *
 * @example
 * formatDateIndian('2025-10-06') // "06/10/2025"
 */
export function formatDateIndian(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
