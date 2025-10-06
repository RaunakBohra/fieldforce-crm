import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
  /** Card title/label */
  title: string;
  /** Main stat value */
  value: string | number;
  /** Optional icon */
  icon?: LucideIcon;
  /** Icon color (text-* class) */
  iconColor?: string;
  /** Value color (text-* class) */
  valueColor?: string;
  /** Optional subtitle or additional info */
  subtitle?: ReactNode;
  /** Click handler for clickable stat cards */
  onClick?: () => void;
  /** Optional className for additional styling */
  className?: string;
}

/**
 * Reusable stat card component
 * Used on Dashboard, list pages for displaying statistics
 *
 * @example
 * <StatCard
 *   title="Total Contacts"
 *   value={125}
 *   icon={Users}
 *   iconColor="text-primary-800"
 *   valueColor="text-primary-600"
 * />
 *
 * @example
 * <StatCard
 *   title="Revenue"
 *   value="₹1,50,000"
 *   valueColor="text-success-600"
 *   subtitle="This month"
 * />
 */
export function StatCard({
  title,
  value,
  icon: Icon,
  iconColor = 'text-neutral-600',
  valueColor = 'text-neutral-900',
  subtitle,
  onClick,
  className = '',
}: StatCardProps) {
  const Component = onClick ? 'button' : 'div';
  const clickableClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow text-left w-full' : '';

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-lg shadow p-4 md:p-6 ${clickableClasses} ${className}`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-neutral-600">{title}</div>
        {Icon && <Icon className={`w-5 h-5 md:w-6 md:h-6 ${iconColor}`} />}
      </div>
      <div className={`text-2xl md:text-3xl font-bold ${valueColor}`}>
        {typeof value === 'number' ? value.toLocaleString() : value}
      </div>
      {subtitle && <div className="mt-2 text-sm text-neutral-600">{subtitle}</div>}
    </Component>
  );
}
