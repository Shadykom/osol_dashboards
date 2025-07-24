import React from 'react';

export const IntegratedMapComponent = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Explore Map</h1>
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="h-96 bg-gray-200 rounded flex items-center justify-center">
            <p className="text-gray-500">Map component will be loaded here</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IntegratedMapComponent;
