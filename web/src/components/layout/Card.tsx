import type { ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  /** Optional className for additional styling */
  className?: string;
  /** Card padding size */
  padding?: 'sm' | 'md' | 'lg';
  /** Whether to show hover effect */
  hover?: boolean;
  /** Click handler for clickable cards */
  onClick?: () => void;
}

const paddingClasses = {
  sm: 'p-4',
  md: 'p-6',
  lg: 'p-8',
};

/**
 * Standard card component with consistent styling
 *
 * @example
 * <Card>
 *   <h3>Card Title</h3>
 *   <p>Card content...</p>
 * </Card>
 *
 * @example
 * <Card hover onClick={() => navigate('/details')}>
 *   Clickable card
 * </Card>
 */
export function Card({
  children,
  className = '',
  padding = 'md',
  hover = false,
  onClick
}: CardProps) {
  const Component = onClick ? 'button' : 'div';
  const clickableClasses = onClick
    ? 'cursor-pointer hover:shadow-lg transition-shadow text-left w-full'
    : '';
  const hoverClasses = hover ? 'hover:shadow-lg transition-shadow' : '';

  return (
    <Component
      onClick={onClick}
      className={`bg-white rounded-lg shadow ${paddingClasses[padding]} ${clickableClasses} ${hoverClasses} ${className}`}
    >
      {children}
    </Component>
  );
}
