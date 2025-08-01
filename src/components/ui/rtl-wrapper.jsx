import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

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
      {...props}
    >
      {children}
    </Component>
  );
}

/**
 * RTL-aware flex component
 */
export function RTLFlex({ children, className, reverse = false, ...props }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div 
      className={cn(
        'flex',
        className,
        {
          'flex-row-reverse': (isRTL && !reverse) || (!isRTL && reverse),
          'flex-row': (!isRTL && !reverse) || (isRTL && reverse)
        }
      )} 
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
  })
};

/**
 * Hook to get RTL-aware classes
 */
export function useRTLClasses() {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return {
    isRTL,
    textAlign: isRTL ? 'text-right' : 'text-left',
    flexRow: isRTL ? 'flex-row-reverse' : 'flex-row',
    spaceX: (value) => isRTL ? `space-x-reverse space-x-${value}` : `space-x-${value}`,
    marginStart: (value) => isRTL ? `mr-${value}` : `ml-${value}`,
    marginEnd: (value) => isRTL ? `ml-${value}` : `mr-${value}`,
    paddingStart: (value) => isRTL ? `pr-${value}` : `pl-${value}`,
    paddingEnd: (value) => isRTL ? `pl-${value}` : `pr-${value}`,
    start: (value) => isRTL ? `right-${value}` : `left-${value}`,
    end: (value) => isRTL ? `left-${value}` : `right-${value}`,
    roundedStart: (value) => isRTL ? `rounded-r-${value}` : `rounded-l-${value}`,
    roundedEnd: (value) => isRTL ? `rounded-l-${value}` : `rounded-r-${value}`,
  };
}