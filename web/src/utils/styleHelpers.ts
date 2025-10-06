/**
 * Shared utility functions for consistent styling across the application
 * Single source of truth for status colors, badge styles, etc.
 */

export type VisitStatus =
  | 'PLANNED'
  | 'IN_PROGRESS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'POSTPONED'
  | 'NO_SHOW';

export type VisitOutcome =
  | 'SUCCESSFUL'
  | 'PARTIAL'
  | 'UNSUCCESSFUL'
  | 'FOLLOW_UP_NEEDED'
  | 'ORDER_PLACED'
  | 'SAMPLE_GIVEN'
  | 'INFORMATION_ONLY';

export type OrderStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REJECTED';

export type PaymentStatus =
  | 'PAID'
  | 'PARTIAL'
  | 'PENDING'
  | 'OVERDUE';

/**
 * Get Tailwind classes for visit status badge
 */
export function getVisitStatusColor(status: VisitStatus): string {
  const colors: Record<VisitStatus, string> = {
    PLANNED: 'bg-primary-100 text-primary-800 border-primary-200',
    IN_PROGRESS: 'bg-warn-100 text-warn-800 border-warn-200',
    COMPLETED: 'bg-success-100 text-success-800 border-success-200',
    CANCELLED: 'bg-danger-100 text-danger-800 border-danger-200',
    POSTPONED: 'bg-warn-100 text-warn-800 border-warn-200',
    NO_SHOW: 'bg-neutral-100 text-neutral-800 border-neutral-200',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
}

/**
 * Get Tailwind classes for visit outcome badge
 */
export function getVisitOutcomeColor(outcome: VisitOutcome): string {
  const colors: Record<VisitOutcome, string> = {
    SUCCESSFUL: 'bg-success-100 text-success-800 border-success-200',
    PARTIAL: 'bg-warn-100 text-warn-800 border-warn-200',
    UNSUCCESSFUL: 'bg-danger-100 text-danger-800 border-danger-200',
    FOLLOW_UP_NEEDED: 'bg-warn-100 text-warn-800 border-warn-200',
    ORDER_PLACED: 'bg-success-100 text-success-800 border-success-200',
    SAMPLE_GIVEN: 'bg-purple-100 text-purple-800 border-purple-200',
    INFORMATION_ONLY: 'bg-primary-100 text-primary-800 border-primary-200',
  };
  return colors[outcome] || 'bg-neutral-100 text-neutral-800 border-neutral-200';
}

/**
 * Get Tailwind classes for order status badge
 */
export function getOrderStatusColor(status: OrderStatus): string {
  const colors: Record<OrderStatus, string> = {
    PENDING: 'bg-warn-100 text-warn-800',
    APPROVED: 'bg-primary-100 text-primary-800',
    PROCESSING: 'bg-purple-100 text-purple-800',
    SHIPPED: 'bg-indigo-100 text-indigo-800',
    DELIVERED: 'bg-success-100 text-success-800',
    CANCELLED: 'bg-danger-100 text-danger-800',
    REJECTED: 'bg-neutral-100 text-neutral-800',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-800';
}

/**
 * Get Tailwind classes for payment status badge
 */
export function getPaymentStatusColor(status: PaymentStatus): string {
  const colors: Record<PaymentStatus, string> = {
    PAID: 'bg-success-100 text-success-800',
    PARTIAL: 'bg-warn-100 text-warn-800',
    PENDING: 'bg-danger-100 text-danger-800',
    OVERDUE: 'bg-danger-100 text-danger-800',
  };
  return colors[status] || 'bg-neutral-100 text-neutral-800';
}

/**
 * Get priority badge color based on days pending
 */
export function getPriorityColor(days: number): { label: string; color: string } {
  if (days > 30) {
    return {
      label: 'HIGH',
      color: 'bg-danger-100 text-danger-800',
    };
  } else if (days > 15) {
    return {
      label: 'MEDIUM',
      color: 'bg-warn-100 text-warn-800',
    };
  }
  return {
    label: 'LOW',
    color: 'bg-success-100 text-success-800',
  };
}

/**
 * Format status/outcome strings for display (replace underscores with spaces)
 */
export function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}
