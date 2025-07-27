import React from 'react';
import { Routes, Route } from 'react-router-dom';

const DashboardRouter = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="w-full px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
        <Routes>
          <Route path="/" element={<div>Dashboard Home</div>} />
          <Route path="/*" element={<div>Dashboard Section</div>} />
        </Routes>
      </div>
    </div>
  );
};

export default DashboardRouter;
