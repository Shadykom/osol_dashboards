import React from 'react';

// A minimal button component used as a placeholder.  It forwards props to
// the underlying button element.  In your application replace this with
// shadcn/ui or your preferred UI library.

export const Button = ({ children, onClick, variant = 'default', size = 'md', ...rest }) => {
  return (
    <button onClick={onClick} {...rest}>
      {children}
    </button>
  );
};

export default Button;