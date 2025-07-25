import { useHydrated } from '@/hooks/useHydrated';

/**
 * Component that only renders its children on the client side after hydration
 * This prevents hydration mismatches for dynamic content like dates and locale-specific formatting
 */
export function ClientOnly({ children, fallback = null }) {
  const hydrated = useHydrated();
  
  if (!hydrated) {
    return fallback;
  }
  
  return children;
}