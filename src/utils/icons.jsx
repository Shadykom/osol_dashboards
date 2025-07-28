// src/utils/icons.js
// Centralized icon imports with error handling

import * as LucideIcons from 'lucide-react';

// Fallback icon component
const FallbackIcon = ({ className }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor">
    <circle cx="12" cy="12" r="10" strokeWidth="2"/>
  </svg>
);

// Create safe icon exports with fallbacks
export const DatabaseIcon = LucideIcons.Database || LucideIcons.Server || FallbackIcon;
export const RefreshCw = LucideIcons.RefreshCw || FallbackIcon;
export const CheckCircle = LucideIcons.CheckCircle || FallbackIcon;
export const XCircle = LucideIcons.XCircle || FallbackIcon;
export const AlertTriangle = LucideIcons.AlertTriangle || FallbackIcon;
export const Info = LucideIcons.Info || FallbackIcon;
export const AlertCircle = LucideIcons.AlertCircle || FallbackIcon;
export const Server = LucideIcons.Server || FallbackIcon;

// Export all icons for convenience
export * from 'lucide-react';

// Export default
export default LucideIcons;