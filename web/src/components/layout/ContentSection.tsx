import type { ReactNode } from 'react';

interface ContentSectionProps {
  children: ReactNode;
  /** Maximum width of content section */
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '4xl' | '5xl' | '7xl';
  /** Optional className for additional styling */
  className?: string;
}

const maxWidthClasses = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
  '2xl': 'max-w-2xl',
  '4xl': 'max-w-4xl',
  '5xl': 'max-w-5xl',
  '7xl': 'max-w-7xl',
};

/**
 * Standard content section container with consistent spacing
 * Default max-width is 7xl to match most list pages
 *
 * @example
 * <ContentSection>
 *   <h1>Page Title</h1>
 *   ...
 * </ContentSection>
 *
 * @example
 * <ContentSection maxWidth="4xl">
 *   <form>...</form>
 * </ContentSection>
 */
export function ContentSection({
  children,
  maxWidth = '7xl',
  className = ''
}: ContentSectionProps) {
  return (
    <main className={`${maxWidthClasses[maxWidth]} mx-auto py-6 sm:px-6 lg:px-8`} role="main">
      <div className={`px-4 py-6 sm:px-0 ${className}`}>
        {children}
      </div>
    </main>
  );
}
