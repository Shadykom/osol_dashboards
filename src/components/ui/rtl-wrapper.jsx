import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';

/**
 * RTL-aware wrapper component that automatically adjusts classes based on language direction
 */
export function RTLWrapper({ children, className, as: Component = 'div', ...props }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <Component 
      className={cn(className, {
        'rtl': isRTL,
        'ltr': !isRTL
      })} 
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * RTL-aware flex component with mobile responsive support
 */
export function RTLFlex({ children, className, reverse = false, responsive = true, ...props }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={cn(
        'flex',
        responsive && 'flex-col sm:flex-row',
        className,
        {
          'sm:flex-row-reverse': responsive && ((isRTL && !reverse) || (!isRTL && reverse)),
          'sm:flex-row': responsive && ((!isRTL && !reverse) || (isRTL && reverse)),
          'flex-row-reverse': !responsive && ((isRTL && !reverse) || (!isRTL && reverse)),
          'flex-row': !responsive && ((!isRTL && !reverse) || (isRTL && reverse))
        }
      )} 
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * RTL-aware grid component with mobile responsive support
 */
export function RTLGrid({ children, className, cols = 1, mdCols = 2, lgCols = 3, gap = 4, ...props }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={cn(
        'grid',
        `grid-cols-${cols}`,
        `md:grid-cols-${mdCols}`,
        `lg:grid-cols-${lgCols}`,
        `gap-${gap}`,
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * RTL-aware container with mobile responsive padding
 */
export function RTLContainer({ children, className, ...props }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={cn(
        'w-full mx-auto px-4 sm:px-6 lg:px-8',
        'max-w-7xl',
        className
      )}
      dir={isRTL ? 'rtl' : 'ltr'}
      {...props}
    >
      {children}
    </div>
  );
}

/**
 * RTL-aware spacing utilities
 */
export const rtlSpace = {
  marginStart: (value) => ({
    marginInlineStart: value
  }),
  marginEnd: (value) => ({
    marginInlineEnd: value
  }),
  paddingStart: (value) => ({
    paddingInlineStart: value
  }),
  paddingEnd: (value) => ({
    paddingInlineEnd: value
  }),
  start: (value) => ({
    insetInlineStart: value
  }),
  end: (value) => ({
    insetInlineEnd: value
  })
};

/**
 * Hook to get RTL-aware classes with mobile responsive support
 */
export function useRTLClasses() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return {
    isRTL,
    isMobile,
    textAlign: isRTL ? 'text-right' : 'text-left',
    textAlignOpposite: isRTL ? 'text-left' : 'text-right',
    flexRow: isRTL ? 'flex-row-reverse' : 'flex-row',
    flexRowMobile: isMobile ? 'flex-col' : (isRTL ? 'flex-row-reverse' : 'flex-row'),
    spaceX: (value) => isRTL ? `space-x-reverse space-x-${value}` : `space-x-${value}`,
    marginStart: (value) => isRTL ? `mr-${value}` : `ml-${value}`,
    marginEnd: (value) => isRTL ? `ml-${value}` : `mr-${value}`,
    paddingStart: (value) => isRTL ? `pr-${value}` : `pl-${value}`,
    paddingEnd: (value) => isRTL ? `pl-${value}` : `pr-${value}`,
    start: (value) => isRTL ? `right-${value}` : `left-${value}`,
    end: (value) => isRTL ? `left-${value}` : `right-${value}`,
    roundedStart: (value) => isRTL ? `rounded-r-${value}` : `rounded-l-${value}`,
    roundedEnd: (value) => isRTL ? `rounded-l-${value}` : `rounded-r-${value}`,
    borderStart: (value) => isRTL ? `border-r-${value}` : `border-l-${value}`,
    borderEnd: (value) => isRTL ? `border-l-${value}` : `border-r-${value}`,
    // Mobile responsive classes
    marginStartMobile: (value, mobileValue) => isMobile ? 
      (isRTL ? `mr-${mobileValue}` : `ml-${mobileValue}`) : 
      (isRTL ? `mr-${value}` : `ml-${value}`),
    marginEndMobile: (value, mobileValue) => isMobile ? 
      (isRTL ? `ml-${mobileValue}` : `mr-${mobileValue}`) : 
      (isRTL ? `ml-${value}` : `mr-${value}`),
    paddingStartMobile: (value, mobileValue) => isMobile ? 
      (isRTL ? `pr-${mobileValue}` : `pl-${mobileValue}`) : 
      (isRTL ? `pr-${value}` : `pl-${value}`),
    paddingEndMobile: (value, mobileValue) => isMobile ? 
      (isRTL ? `pl-${mobileValue}` : `pr-${mobileValue}`) : 
      (isRTL ? `pl-${value}` : `pr-${value}`),
  };
}

/**
 * RTL-aware text component with proper alignment
 */
export function RTLText({ children, className, align = 'start', ...props }) {
  const { isRTL, textAlign, textAlignOpposite } = useRTLClasses();
  
  const alignmentClass = align === 'start' ? textAlign : 
                        align === 'end' ? textAlignOpposite : 
                        `text-${align}`;

  return (
    <div className={cn(alignmentClass, className)} {...props}>
      {children}
    </div>
  );
}

/**
 * RTL-aware icon wrapper
 */
export function RTLIcon({ children, className, position = 'start', ...props }) {
  const { isRTL, marginStart, marginEnd } = useRTLClasses();
  
  const positionClass = position === 'start' ? marginEnd(2) : marginStart(2);

  return (
    <span className={cn(positionClass, 'inline-flex', className)} {...props}>
      {children}
    </span>
  );
}