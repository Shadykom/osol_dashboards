import React from 'react';

/**
 * Component that safely renders values and prevents "Objects are not valid as a React child" errors
 * Specifically handles objects with collection-related keys that might be accidentally rendered
 */
export const SafeObjectRenderer = ({ children }) => {
  // Check if children is an object that shouldn't be rendered directly
  if (children && typeof children === 'object' && !React.isValidElement(children) && !Array.isArray(children)) {
    // Check for the specific pattern from the error
    const problematicKeys = [
      'title', 'performanceReport', 'summary', 'totalPortfolio',
      'overdueAmount', 'activeCases', 'collectionRate', 'officers',
      'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
    ];
    
    const hasProblematicKeys = problematicKeys.some(key => key in children);
    
    if (hasProblematicKeys) {
      console.error('[SafeObjectRenderer] Prevented object rendering error. Object:', children);
      console.trace('Stack trace:');
      
      // Return a safe representation
      return (
        <span className="text-muted-foreground text-sm">
          [Object: {Object.keys(children).slice(0, 3).join(', ')}...]
        </span>
      );
    }
  }
  
  // For all other cases, render normally
  return <>{children}</>;
};

/**
 * HOC that wraps a component to make all its children safe from object rendering errors
 */
export const withSafeObjectRendering = (Component) => {
  return React.forwardRef((props, ref) => {
    return (
      <Component {...props} ref={ref}>
        {React.Children.map(props.children, child => (
          <SafeObjectRenderer>{child}</SafeObjectRenderer>
        ))}
      </Component>
    );
  });
};

export default SafeObjectRenderer;