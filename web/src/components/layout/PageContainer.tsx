import type { ReactNode } from 'react';
import { Navigation } from '../Navigation';

interface PageContainerProps {
  children: ReactNode;
  /** Override default background color */
  bgColor?: string;
}

/**
 * Standard page container with Navigation and consistent layout
 *
 * @example
 * <PageContainer>
 *   <ContentSection>...</ContentSection>
 * </PageContainer>
 */
export function PageContainer({ children, bgColor = 'bg-neutral-100' }: PageContainerProps) {
  return (
    <div className={`min-h-screen ${bgColor}`}>
      <Navigation />
      {children}
    </div>
  );
}
