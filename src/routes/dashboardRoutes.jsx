// Dashboard routes configuration
//
// Defines the React Router paths for the dashboard area.  Each route
// resolves to a page component.  Additional pages can be added as needed.

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from '../pages/Dashboard.jsx';
import DashboardDetail from '../pages/DashboardDetail.jsx';
import DashboardReports from '../pages/DashboardReports.jsx';
import TestIncomeStatement from '../pages/TestIncomeStatement.jsx';

// Placeholder component for templates page
const DashboardTemplates = () => <div>Dashboard templates placeholder</div>;

export const DashboardRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="detail/:section/:widgetId" element={<DashboardDetail />} />
      <Route path="reports" element={<DashboardReports />} />
      <Route path="test-income-statement" element={<TestIncomeStatement />} />
      <Route path="templates" element={<DashboardTemplates />} />
    </Routes>
  );
};