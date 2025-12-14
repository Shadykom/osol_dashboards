/**
 * Admin Routes Configuration
 * EPIC 5 - MDM and Integration Admin Pages
 */

import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';

// Integration Pages
import IntegrationSettings from '../pages/admin/integration/IntegrationSettings';
import IngestionRuns from '../pages/admin/integration/IngestionRuns';
import RunDetail from '../pages/admin/integration/RunDetail';
import Ingest from '../pages/admin/integration/Ingest';
import DataFreshness from '../pages/admin/integration/DataFreshness';

// MDM Pages
import ReferenceData from '../pages/admin/mdm/ReferenceData';
import Parties from '../pages/admin/mdm/Parties';
import PartyDetail from '../pages/admin/mdm/PartyDetail';
import Users from '../pages/admin/mdm/Users';

export const AdminRoutes = () => {
  return (
    <Routes>
      {/* Integration Routes */}
      <Route path="integration">
        <Route index element={<Navigate to="settings" replace />} />
        <Route path="settings" element={<IntegrationSettings />} />
        <Route path="runs" element={<IngestionRuns />} />
        <Route path="runs/:id" element={<RunDetail />} />
        <Route path="ingest" element={<Ingest />} />
        <Route path="freshness" element={<DataFreshness />} />
      </Route>
      
      {/* MDM Routes */}
      <Route path="mdm">
        <Route index element={<Navigate to="parties" replace />} />
        <Route path="reference-data" element={<ReferenceData />} />
        <Route path="parties" element={<Parties />} />
        <Route path="parties/:id" element={<PartyDetail />} />
        <Route path="users" element={<Users />} />
      </Route>
      
      {/* Default redirect */}
      <Route path="*" element={<Navigate to="integration/settings" replace />} />
    </Routes>
  );
};

export default AdminRoutes;
