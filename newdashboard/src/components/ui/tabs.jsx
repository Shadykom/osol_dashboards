import React, { useState } from 'react';

// Simple tabs implementation for demonstration purposes.  Accepts TabsList,
// TabsTrigger and TabsContent as children.  Maintains internal state for
// active tab unless controlled via props.

export const Tabs = ({ value, onValueChange, children }) => {
  const [internalValue, setInternalValue] = useState(value);
  const active = value !== undefined ? value : internalValue;
  const handleChange = (newValue) => {
    if (onValueChange) onValueChange(newValue);
    else setInternalValue(newValue);
  };
  // Clone children with additional props
  return React.Children.map(children, (child) => {
    if (child.type === TabsList) {
      return React.cloneElement(child, { active, onChange: handleChange });
    }
    if (child.type === TabsContent) {
      return React.cloneElement(child, { active });
    }
    return child;
  });
};

export const TabsList = ({ children, active, onChange }) => {
  return (
    <div>
      {React.Children.map(children, (child) => {
        return React.cloneElement(child, { active, onChange });
      })}
    </div>
  );
};

export const TabsTrigger = ({ value, children, active, onChange }) => {
  return (
    <button
      onClick={() => onChange(value)}
      style={{ fontWeight: active === value ? 'bold' : 'normal' }}
    >
      {children}
    </button>
  );
};

export const TabsContent = ({ value, children, active }) => {
  return active === value ? <div>{children}</div> : null;
};