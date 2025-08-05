import React from 'react';

/**
 * SafeRender component that prevents "Objects are not valid as a React child" errors
 * by checking and converting non-renderable values before rendering
 */
export const SafeRender = ({ value, fallback = '', stringify = false }) => {
  // Handle null/undefined
  if (value === null || value === undefined) {
    return fallback;
  }

  // Primitives are safe to render
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value;
  }

  // React elements are safe
  if (React.isValidElement(value)) {
    return value;
  }

  // Arrays need to be mapped
  if (Array.isArray(value)) {
    if (value.length === 0) return fallback;
    
    // Check if it's an array of primitives
    const allPrimitive = value.every(item => 
      typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean'
    );
    
    if (allPrimitive) {
      return value.join(', ');
    }
    
    // For arrays of objects, stringify or return fallback
    if (stringify) {
      return JSON.stringify(value, null, 2);
    }
    
    console.warn('[SafeRender] Array of objects detected:', value);
    return fallback;
  }

  // Dates
  if (value instanceof Date) {
    return value.toLocaleString();
  }

  // Objects
  if (type === 'object') {
    if (stringify) {
      return JSON.stringify(value, null, 2);
    }
    
    console.warn('[SafeRender] Object detected:', value);
    return fallback;
  }

  // Functions and other types
  console.warn('[SafeRender] Non-renderable type:', type, value);
  return fallback;
};

/**
 * HOC that wraps a component to ensure all its props are safe to render
 */
export const withSafeProps = (Component) => {
  return React.forwardRef((props, ref) => {
    const safeProps = {};
    
    Object.entries(props).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !React.isValidElement(value) && !Array.isArray(value)) {
        // Skip objects except for style, className, etc.
        if (key === 'style' || key === 'className' || key.startsWith('data-')) {
          safeProps[key] = value;
        } else {
          console.warn(`[withSafeProps] Filtering out object prop "${key}":`, value);
        }
      } else {
        safeProps[key] = value;
      }
    });
    
    return <Component {...safeProps} ref={ref} />;
  });
};

/**
 * Debug component that logs what's being rendered
 */
export const DebugValue = ({ value, label = 'Debug' }) => {
  React.useEffect(() => {
    console.log(`[DebugValue] ${label}:`, value);
    
    if (value && typeof value === 'object' && !React.isValidElement(value)) {
      console.warn(`[DebugValue] WARNING: Object detected in ${label}:`, value);
    }
  }, [value, label]);
  
  return <SafeRender value={value} stringify={true} />;
};

export default SafeRender;