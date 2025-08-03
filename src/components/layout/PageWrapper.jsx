import React from 'react';
import { useTranslation } from 'react-i18next';
import { RTLWrapper, RTLContainer, useRTLClasses } from '../ui/rtl-wrapper';
import { cn } from '@/lib/utils';

/**
 * PageWrapper component that provides RTL/LTR support and mobile responsive layout
 * for all pages in the application
 */
export const PageWrapper = ({ 
  children, 
  title, 
  subtitle, 
  actions, 
  className,
  containerClassName,
  fullWidth = false,
  noPadding = false 
}) => {
  const { t } = useTranslation();
  const { isRTL, isMobile } = useRTLClasses();

  return (
    <RTLWrapper className={cn("min-h-full", className)}>
      {/* Page Header */}
      {(title || subtitle || actions) && (
        <div className={cn(
          "mb-4 sm:mb-6 lg:mb-8",
          !fullWidth && "max-w-7xl mx-auto",
          !noPadding && "px-4 sm:px-6 lg:px-8"
        )}>
          <div className={cn(
            "flex flex-col sm:flex-row",
            "gap-4 sm:items-center sm:justify-between",
            isRTL && "sm:flex-row-reverse"
          )}>
            {/* Title Section */}
            {(title || subtitle) && (
              <div className="flex-1">
                {title && (
                  <h1 className={cn(
                    "text-2xl sm:text-3xl font-bold",
                    "text-gray-900 dark:text-white",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {title}
                  </h1>
                )}
                {subtitle && (
                  <p className={cn(
                    "mt-1 text-sm sm:text-base",
                    "text-gray-600 dark:text-gray-400",
                    isRTL ? "text-right" : "text-left"
                  )}>
                    {subtitle}
                  </p>
                )}
              </div>
            )}

            {/* Actions Section */}
            {actions && (
              <div className={cn(
                "flex gap-2 sm:gap-3",
                isRTL ? "flex-row-reverse" : "flex-row",
                isMobile && "w-full sm:w-auto"
              )}>
                {actions}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Page Content */}
      <div className={cn(
        !fullWidth && "max-w-7xl mx-auto",
        !noPadding && "px-4 sm:px-6 lg:px-8",
        containerClassName
      )}>
        {children}
      </div>
    </RTLWrapper>
  );
};

/**
 * PageSection component for consistent section layout within pages
 */
export const PageSection = ({ 
  children, 
  title, 
  description, 
  actions,
  className,
  noPadding = false 
}) => {
  const { isRTL } = useRTLClasses();

  return (
    <section className={cn(
      "mb-6 sm:mb-8",
      !noPadding && "bg-white dark:bg-gray-800 rounded-lg shadow-sm",
      !noPadding && "p-4 sm:p-6",
      className
    )}>
      {/* Section Header */}
      {(title || description || actions) && (
        <div className={cn(
          "flex flex-col sm:flex-row",
          "gap-3 sm:items-start sm:justify-between",
          "mb-4 sm:mb-6",
          isRTL && "sm:flex-row-reverse"
        )}>
          <div className="flex-1">
            {title && (
              <h2 className={cn(
                "text-lg sm:text-xl font-semibold",
                "text-gray-900 dark:text-white",
                isRTL ? "text-right" : "text-left"
              )}>
                {title}
              </h2>
            )}
            {description && (
              <p className={cn(
                "mt-1 text-sm",
                "text-gray-600 dark:text-gray-400",
                isRTL ? "text-right" : "text-left"
              )}>
                {description}
              </p>
            )}
          </div>
          {actions && (
            <div className={cn(
              "flex gap-2",
              isRTL ? "flex-row-reverse" : "flex-row"
            )}>
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Section Content */}
      {children}
    </section>
  );
};

/**
 * PageGrid component for responsive grid layouts
 */
export const PageGrid = ({ 
  children, 
  cols = 1, 
  smCols = 2, 
  mdCols = 3, 
  lgCols = 4,
  gap = 4,
  className 
}) => {
  return (
    <div className={cn(
      "grid",
      `grid-cols-${cols}`,
      `sm:grid-cols-${smCols}`,
      `md:grid-cols-${mdCols}`,
      `lg:grid-cols-${lgCols}`,
      `gap-${gap}`,
      className
    )}>
      {children}
    </div>
  );
};

/**
 * PageCard component for consistent card styling
 */
export const PageCard = ({ 
  children, 
  title, 
  subtitle, 
  icon: Icon,
  actions,
  className,
  onClick,
  hoverable = false 
}) => {
  const { isRTL } = useRTLClasses();

  return (
    <div 
      className={cn(
        "bg-white dark:bg-gray-800",
        "rounded-lg shadow-sm",
        "p-4 sm:p-6",
        hoverable && "cursor-pointer hover:shadow-md transition-shadow",
        className
      )}
      onClick={onClick}
    >
      {/* Card Header */}
      {(Icon || title || subtitle || actions) && (
        <div className={cn(
          "flex items-start gap-3 mb-4",
          isRTL ? "flex-row-reverse" : "flex-row"
        )}>
          {Icon && (
            <div className="flex-shrink-0">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Icon className="w-5 h-5 text-primary" />
              </div>
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {title && (
              <h3 className={cn(
                "text-base font-semibold",
                "text-gray-900 dark:text-white",
                "truncate",
                isRTL ? "text-right" : "text-left"
              )}>
                {title}
              </h3>
            )}
            {subtitle && (
              <p className={cn(
                "mt-1 text-sm",
                "text-gray-600 dark:text-gray-400",
                isRTL ? "text-right" : "text-left"
              )}>
                {subtitle}
              </p>
            )}
          </div>

          {actions && (
            <div className="flex-shrink-0">
              {actions}
            </div>
          )}
        </div>
      )}

      {/* Card Content */}
      {children}
    </div>
  );
};

export default PageWrapper;