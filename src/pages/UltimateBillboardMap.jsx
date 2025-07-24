import React from 'react';
import { useGoogleMaps } from '../contexts/GoogleMapsContext';

const UltimateBillboardMap = () => {
  const { isLoaded, loadError } = useGoogleMaps();

  if (loadError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Error loading maps</h2>
          <p className="text-gray-600">Unable to load Google Maps. Please check your configuration.</p>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading maps...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Billboard Map</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-96 bg-gray-200 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Map will be displayed here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UltimateBillboardMap;
