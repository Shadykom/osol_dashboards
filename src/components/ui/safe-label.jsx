import React from 'react';
import { Label } from './label';

/**
 * Safe wrapper for Label component that prevents object rendering errors
 */
export const SafeLabel = React.forwardRef(({ children, ...props }, ref) => {
  // Check if children is a problematic object
  if (children && typeof children === 'object' && !React.isValidElement(children) && !Array.isArray(children)) {
    // Check for the specific pattern from the error
    const problematicKeys = [
      'title', 'performanceReport', 'summary', 'totalPortfolio',
      'overdueAmount', 'activeCases', 'collectionRate', 'officers',
      'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
    ];
    
    const hasProblematicKeys = problematicKeys.some(key => key in children);
    
    if (hasProblematicKeys) {
      console.error('[SafeLabel] Prevented object rendering in label. Object:', children);
      
      // Return label with safe content
      return (
        <Label {...props} ref={ref}>
          [Object]
        </Label>
      );
    }
  }
  
  // For all other cases, render normally
  return (
    <Label {...props} ref={ref}>
      {children}
    </Label>
  );
});

SafeLabel.displayName = 'SafeLabel';

export default SafeLabel;