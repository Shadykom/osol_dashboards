// App entry point
//
// Sets up the router and wraps the dashboard routes in the FilterProvider.

import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { FilterProvider } from './contexts/FilterContext.jsx';
import { DashboardRoutes } from './routes/dashboardRoutes.jsx';

function App() {
  return (
    <FilterProvider>
      <Router>
        <Routes>
          <Route path="/dashboard/*" element={<DashboardRoutes />} />
          {/* Add other routes here */}
        </Routes>
      </Router>
    </FilterProvider>
  );
}

export default App;