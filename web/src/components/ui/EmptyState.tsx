import type { LucideIcon } from 'lucide-react';
import type { ReactNode } from 'react';

interface EmptyStateProps {
  /** Icon to display */
  icon: LucideIcon;
  /** Main message */
  message: string;
  /** Optional description */
  description?: string;
  /** Optional action button */
  action?: ReactNode;
  /** Optional className */
  className?: string;
}

/**
 * Empty state component for when there's no data to display
 *
 * @example
 * <EmptyState
 *   icon={Package}
 *   message="No products found"
 *   description="Try adjusting your filters"
 * />
 *
 * @example
 * <EmptyState
 *   icon={Users}
 *   message="No contacts yet"
 *   action={
 *     <button onClick={() => navigate('/contacts/new')} className="btn-primary">
 *       Add Your First Contact
 *     </button>
 *   }
 * />
 */
export function EmptyState({
  icon: Icon,
  message,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div className={`text-center py-12 bg-white rounded-lg shadow ${className}`}>
      <Icon className="mx-auto text-neutral-400 mb-4" size={48} />
      <p className="text-lg font-medium text-neutral-900">{message}</p>
      {description && <p className="text-sm text-neutral-500 mt-1">{description}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
