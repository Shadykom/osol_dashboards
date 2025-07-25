import { useEffect, useState } from 'react';

/**
 * Custom hook to detect when the app has been hydrated on the client
 * This helps prevent hydration mismatches for dynamic content
 */
export function useHydrated() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  return hydrated;
}