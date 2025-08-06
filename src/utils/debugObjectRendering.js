// Utility to help debug "Objects are not valid as a React child" errors

/**
 * Wraps a value to ensure it's safe to render in React
 * If the value is an object, it will be stringified
 * @param {any} value - The value to make safe for rendering
 * @param {string} context - Optional context for debugging
 * @returns {any} - A value safe for React rendering
 */
export function safeRender(value, context = '') {
  // Check if value is null or undefined
  if (value === null || value === undefined) {
    return '';
  }

  // Check if it's a primitive type (safe to render)
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return value;
  }

  // Check if it's a React element (safe to render)
  if (value.$$typeof === Symbol.for('react.element')) {
    return value;
  }

  // Check if it's an array
  if (Array.isArray(value)) {
    console.warn(`[safeRender] Array detected in ${context}:`, value);
    return JSON.stringify(value);
  }

  // Check if it's a Date
  if (value instanceof Date) {
    return value.toLocaleString();
  }

  // Check if it's an object
  if (type === 'object') {
    console.warn(`[safeRender] Object detected in ${context}:`, value);
    // Log the object structure to help identify the issue
    console.warn('Object keys:', Object.keys(value));
    return JSON.stringify(value);
  }

  // For functions and other types
  console.warn(`[safeRender] Unexpected type "${type}" in ${context}:`, value);
  return String(value);
}

/**
 * Debug wrapper component that logs what's being rendered
 */
export function DebugRender({ children, name = 'Unknown' }) {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[DebugRender] Component "${name}" rendering:`, children);
    
    // Check if children is an object that shouldn't be rendered
    if (children && typeof children === 'object' && !children.$$typeof) {
      console.error(`[DebugRender] WARNING: Component "${name}" is trying to render an object:`, children);
    }
  }
  
  return children;
}

/**
 * HOC to wrap components and catch object rendering errors
 */
export function withSafeRender(Component, componentName = Component.name) {
  return function SafeRenderWrapper(props) {
    try {
      return <Component {...props} />;
    } catch (error) {
      if (error.message && error.message.includes('Objects are not valid as a React child')) {
        console.error(`[withSafeRender] Object rendering error in ${componentName}:`, error);
        console.error('Props that caused the error:', props);
        return (
          <div style={{ color: 'red', padding: '10px', border: '1px solid red' }}>
            Error in {componentName}: Objects are not valid as a React child
          </div>
        );
      }
      throw error;
    }
  };
}

/**
 * Utility to check if a value would cause a React rendering error
 */
export function isValidReactChild(value) {
  if (value === null || value === undefined) return true;
  
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return true;
  
  if (value.$$typeof === Symbol.for('react.element')) return true;
  
  if (Array.isArray(value)) {
    // Arrays are valid if all children are valid
    return value.every(child => isValidReactChild(child));
  }
  
  // Objects and other types are not valid
  return false;
}

/**
 * Deep check an object for any values that might cause rendering issues
 */
export function findInvalidReactChildren(obj, path = '') {
  const issues = [];
  
  function check(value, currentPath) {
    if (value === null || value === undefined) return;
    
    if (typeof value === 'object' && !value.$$typeof) {
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          check(item, `${currentPath}[${index}]`);
        });
      } else if (value instanceof Date) {
        // Dates are problematic
        issues.push({
          path: currentPath,
          type: 'Date',
          value: value.toString()
        });
      } else {
        // Regular object - check if it's being used as a child
        if (currentPath && !currentPath.includes('.')) {
          issues.push({
            path: currentPath,
            type: 'Object',
            keys: Object.keys(value)
          });
        }
        
        // Recursively check object properties
        Object.entries(value).forEach(([key, val]) => {
          check(val, currentPath ? `${currentPath}.${key}` : key);
        });
      }
    }
  }
  
  check(obj, path);
  return issues;
}