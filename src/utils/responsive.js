import { useState, useEffect } from 'react';

// Responsive breakpoints matching Tailwind's default breakpoints
export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
};

// Hook to check if screen is mobile
export const useIsMobile = () => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < breakpoints.md);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return isMobile;
};

// Responsive class utilities
export const responsiveClasses = {
  // Grid layouts
  gridCols: {
    mobile: 'grid-cols-1',
    tablet: 'sm:grid-cols-2 md:grid-cols-3',
    desktop: 'lg:grid-cols-4 xl:grid-cols-5',
  },
  
  // Padding
  padding: {
    mobile: 'p-4',
    tablet: 'sm:p-6',
    desktop: 'lg:p-8',
  },
  
  // Text sizes
  text: {
    heading: 'text-2xl sm:text-3xl lg:text-4xl',
    subheading: 'text-lg sm:text-xl lg:text-2xl',
    body: 'text-sm sm:text-base',
  },
  
  // Flex layouts
  flex: {
    mobileColumn: 'flex flex-col',
    tabletRow: 'sm:flex-row',
    gap: 'gap-4 sm:gap-6 lg:gap-8',
  },
  
  // Navigation
  nav: {
    mobile: 'fixed bottom-0 left-0 right-0 sm:relative sm:bottom-auto',
    desktop: 'hidden sm:flex',
  },
  
  // Cards
  card: {
    mobile: 'rounded-lg shadow-sm',
    padding: 'p-4 sm:p-6',
  },
  
  // Tables
  table: {
    wrapper: 'overflow-x-auto -mx-4 sm:mx-0',
    mobile: 'min-w-full sm:min-w-0',
  },
};

// RTL-aware margin and padding utilities
export const rtlClasses = {
  marginStart: 'ms-',
  marginEnd: 'me-',
  paddingStart: 'ps-',
  paddingEnd: 'pe-',
  start: 'start-',
  end: 'end-',
};

// Helper to generate responsive grid classes
export const getResponsiveGridCols = (mobile = 1, tablet = 2, desktop = 3) => {
  return `grid-cols-${mobile} sm:grid-cols-${tablet} lg:grid-cols-${desktop}`;
};

// Helper to generate responsive text classes
export const getResponsiveText = (mobile = 'sm', tablet = 'base', desktop = 'lg') => {
  return `text-${mobile} sm:text-${tablet} lg:text-${desktop}`;
};