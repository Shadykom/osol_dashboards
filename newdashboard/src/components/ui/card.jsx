import React from 'react';

// A simple card component.  In a real app you would import from your UI
// library.  Here we just wrap the children in a semantic section.

export const Card = ({ children, className }) => {
  return <section className={className}>{children}</section>;
};

export const CardHeader = ({ children }) => {
  return <header>{children}</header>;
};

export const CardTitle = ({ children }) => {
  return <h3>{children}</h3>;
};

export const CardContent = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export default Card;