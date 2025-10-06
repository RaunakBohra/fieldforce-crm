import { formatStatusLabel } from '../../utils/styleHelpers';

export type BadgeVariant =
  | 'success'
  | 'danger'
  | 'warn'
  | 'primary'
  | 'neutral'
  | 'purple'
  | 'indigo';

interface StatusBadgeProps {
  /** Badge text */
  label: string;
  /** Visual style variant */
  variant?: BadgeVariant;
  /** Custom Tailwind classes (overrides variant) */
  className?: string;
  /** Format label (replace underscores with spaces) */
  formatLabel?: boolean;
  /** Show border */
  border?: boolean;
}

const variantClasses: Record<BadgeVariant, string> = {
  success: 'bg-success-100 text-success-800',
  danger: 'bg-danger-100 text-danger-800',
  warn: 'bg-warn-100 text-warn-800',
  primary: 'bg-primary-100 text-primary-800',
  neutral: 'bg-neutral-100 text-neutral-800',
  purple: 'bg-purple-100 text-purple-800',
  indigo: 'bg-indigo-100 text-indigo-800',
};

/**
 * Reusable status badge component
 * Used for displaying status, outcome, category badges
 *
 * @example
 * <StatusBadge label="COMPLETED" variant="success" />
 *
 * @example
 * <StatusBadge
 *   label="IN_PROGRESS"
 *   variant="warn"
 *   formatLabel
 *   border
 * />
 *
 * @example
 * // Custom styling
 * <StatusBadge
 *   label="Custom"
 *   className="bg-orange-100 text-orange-800"
 * />
 */
export function StatusBadge({
  label,
  variant = 'neutral',
  className,
  formatLabel = true,
  border = false,
}: StatusBadgeProps) {
  const displayLabel = formatLabel ? formatStatusLabel(label) : label;
  const colorClasses = className || variantClasses[variant];
  const borderClass = border ? 'border border-current border-opacity-30' : '';

  return (
    <span
      className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${colorClasses} ${borderClass}`}
    >
      {displayLabel}
    </span>
  );
}
