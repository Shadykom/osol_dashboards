import React, { useState } from 'react';

// Minimal select component with controlled value.  Accepts children
// consisting of SelectItem elements.  This is only a placeholder; replace
// with a real component for full UX.

export const Select = ({ value, onValueChange, children }) => {
  const handleChange = (e) => {
    onValueChange && onValueChange(e.target.value);
  };
  return (
    <select value={value} onChange={handleChange}>
      {children}
    </select>
  );
};

export const SelectTrigger = ({ children }) => <>{children}</>;
export const SelectValue = () => null;
export const SelectContent = ({ children }) => <>{children}</>;
export const SelectItem = ({ value, children }) => {
  return (
    <option value={value}>{children}</option>
  );
};

export default Select;