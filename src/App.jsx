import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CustomDashboard } from './pages/CustomDashboard';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { Customers } from './pages/Customers';
import { Accounts } from './pages/Accounts';
import { Transactions } from './pages/Transactions';
import { Loans } from './pages/Loans';
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { Compliance } from './pages/Compliance';
import { Toaster } from './components/ui/sonner';
import './App.css';

function App() {
  return (
    <>
      <Router>
        <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/custom-dashboard" element={<CustomDashboard />} />
          <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
          <Route path="/operations-dashboard" element={<OperationsDashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/loans" element={<Loans />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/operations" element={<OperationsDashboard />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/compliance" element={<Compliance />} />
          <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>System settings coming soon...</p></div>} />
          
          {/* Customer sub-routes */}
          <Route path="/customers/new" element={<div className="p-6"><h1 className="text-2xl font-bold">Add New Customer</h1><p>Add customer form coming soon...</p></div>} />
          <Route path="/customers/kyc-pending" element={<div className="p-6"><h1 className="text-2xl font-bold">KYC Pending</h1><p>KYC pending customers coming soon...</p></div>} />
          <Route path="/customers/risk" element={<div className="p-6"><h1 className="text-2xl font-bold">Risk Assessment</h1><p>Risk assessment coming soon...</p></div>} />
          
          {/* Account sub-routes */}
          <Route path="/accounts/new" element={<div className="p-6"><h1 className="text-2xl font-bold">Open New Account</h1><p>Account opening form coming soon...</p></div>} />
          <Route path="/accounts/blocked" element={<div className="p-6"><h1 className="text-2xl font-bold">Blocked Accounts</h1><p>Blocked accounts list coming soon...</p></div>} />
          <Route path="/accounts/dormant" element={<div className="p-6"><h1 className="text-2xl font-bold">Dormant Accounts</h1><p>Dormant accounts list coming soon...</p></div>} />
          
          {/* Transaction sub-routes */}
          <Route path="/transactions/pending" element={<div className="p-6"><h1 className="text-2xl font-bold">Pending Transactions</h1><p>Pending approvals coming soon...</p></div>} />
          <Route path="/transactions/failed" element={<div className="p-6"><h1 className="text-2xl font-bold">Failed Transactions</h1><p>Failed transactions list coming soon...</p></div>} />
          <Route path="/transactions/bulk" element={<div className="p-6"><h1 className="text-2xl font-bold">Bulk Upload</h1><p>Bulk transaction upload coming soon...</p></div>} />
          
          {/* Loan sub-routes */}
          <Route path="/loans/applications" element={<div className="p-6"><h1 className="text-2xl font-bold">Loan Applications</h1><p>Loan applications coming soon...</p></div>} />
          <Route path="/loans/disbursements" element={<div className="p-6"><h1 className="text-2xl font-bold">Loan Disbursements</h1><p>Disbursements coming soon...</p></div>} />
          <Route path="/loans/collections" element={<div className="p-6"><h1 className="text-2xl font-bold">Loan Collections</h1><p>Collections coming soon...</p></div>} />
          
          {/* Report sub-routes */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/financial" element={<div className="p-6"><h1 className="text-2xl font-bold">Financial Reports</h1><p>Financial reports coming soon...</p></div>} />
          <Route path="/reports/regulatory" element={<div className="p-6"><h1 className="text-2xl font-bold">Regulatory Reports</h1><p>Regulatory reports coming soon...</p></div>} />
          <Route path="/reports/customers" element={<div className="p-6"><h1 className="text-2xl font-bold">Customer Reports</h1><p>Customer reports coming soon...</p></div>} />
          <Route path="/reports/risk" element={<div className="p-6"><h1 className="text-2xl font-bold">Risk Reports</h1><p>Risk reports coming soon...</p></div>} />
          
          {/* Operations sub-routes */}
          <Route path="/operations/branches" element={<div className="p-6"><h1 className="text-2xl font-bold">Branch Management</h1><p>Branch management coming soon...</p></div>} />
          <Route path="/operations/users" element={<div className="p-6"><h1 className="text-2xl font-bold">User Management</h1><p>User management coming soon...</p></div>} />
          <Route path="/operations/audit" element={<div className="p-6"><h1 className="text-2xl font-bold">Audit Trail</h1><p>Audit trail coming soon...</p></div>} />
          <Route path="/operations/health" element={<div className="p-6"><h1 className="text-2xl font-bold">System Health</h1><p>System health monitoring coming soon...</p></div>} />
          
          {/* Help route */}
          <Route path="/help" element={<div className="p-6"><h1 className="text-2xl font-bold">Help & Support</h1><p>Help documentation and support coming soon...</p></div>} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </>
  );
}

export default App;