import React, { createContext, useContext, useState, useEffect } from 'react';

const GoogleMapsContext = createContext({});

export const useGoogleMaps = () => {
  const context = useContext(GoogleMapsContext);
  if (!context) {
    throw new Error('useGoogleMaps must be used within a GoogleMapsProvider');
  }
  return context;
};

export const GoogleMapsProvider = ({ children }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadError, setLoadError] = useState(null);

  useEffect(() => {
    // Check if Google Maps is already loaded
    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsLoaded(true);
      });
      existingScript.addEventListener('error', (error) => {
        setLoadError(error);
      });
      return;
    }

    // Load Google Maps script
    const loadGoogleMaps = () => {
      const script = document.createElement('script');
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
      
      if (!apiKey) {
        console.warn('Google Maps API key not found. Maps functionality will be limited.');
        setLoadError(new Error('Google Maps API key not configured'));
        return;
      }

      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places,geometry`;
      script.async = true;
      script.defer = true;

      script.addEventListener('load', () => {
        setIsLoaded(true);
      });

      script.addEventListener('error', (error) => {
        console.error('Failed to load Google Maps:', error);
        setLoadError(error);
      });

      document.head.appendChild(script);
    };

    loadGoogleMaps();
  }, []);

  const value = {
    isLoaded,
    loadError,
    google: window.google,
  };

  return (
    <GoogleMapsContext.Provider value={value}>
      {children}
    </GoogleMapsContext.Provider>
  );
};

export default GoogleMapsContext;
