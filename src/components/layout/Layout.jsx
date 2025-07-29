// This file now redirects to ModernLayout
import React from 'react';
import ModernLayout from './ModernLayout';

// Legacy Layout component - now uses ModernLayout
export function Layout(props) {
  console.warn('⚠️ Legacy Layout component is being used - redirecting to ModernLayout');
  return <ModernLayout {...props} />;
}