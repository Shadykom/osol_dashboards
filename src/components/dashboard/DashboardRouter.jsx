import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard } from '../../pages/Dashboard';
import { Customers } from '../../pages/Customers';
import { Accounts } from '../../pages/Accounts';
import { Transactions } from '../../pages/Transactions';
import { Loans } from '../../pages/Loans';
import { Analytics } from '../../pages/Analytics';
import { Reports } from '../../pages/Reports';
import { Compliance } from '../../pages/Compliance';
import { ExecutiveDashboard } from '../../pages/ExecutiveDashboard';
import { OperationsDashboard } from '../../pages/OperationsDashboard';

const DashboardRouter = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/customers" element={<Customers />} />
      <Route path="/accounts" element={<Accounts />} />
      <Route path="/transactions" element={<Transactions />} />
      <Route path="/loans" element={<Loans />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/reports" element={<Reports />} />
      <Route path="/compliance" element={<Compliance />} />
      <Route path="/executive" element={<ExecutiveDashboard />} />
      <Route path="/operations" element={<OperationsDashboard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default DashboardRouter;
