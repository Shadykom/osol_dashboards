import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { CustomDashboard } from './pages/CustomDashboard';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { OperationsDashboard } from './pages/OperationsDashboard';
import { Customers } from './pages/Customers';
import './App.css';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/custom-dashboard" element={<CustomDashboard />} />
          <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
          <Route path="/operations-dashboard" element={<OperationsDashboard />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/accounts" element={<div className="p-6"><h1 className="text-2xl font-bold">Accounts</h1><p>Accounts management coming soon...</p></div>} />
          <Route path="/transactions" element={<div className="p-6"><h1 className="text-2xl font-bold">Transactions</h1><p>Transaction management coming soon...</p></div>} />
          <Route path="/loans" element={<div className="p-6"><h1 className="text-2xl font-bold">Loans</h1><p>Loan management coming soon...</p></div>} />
          <Route path="/reports" element={<div className="p-6"><h1 className="text-2xl font-bold">Reports</h1><p>Reporting system coming soon...</p></div>} />
          <Route path="/operations" element={<OperationsDashboard />} />
          <Route path="/analytics" element={<div className="p-6"><h1 className="text-2xl font-bold">Analytics</h1><p>Advanced analytics coming soon...</p></div>} />
          <Route path="/compliance" element={<div className="p-6"><h1 className="text-2xl font-bold">Compliance</h1><p>Compliance monitoring coming soon...</p></div>} />
          <Route path="/settings" element={<div className="p-6"><h1 className="text-2xl font-bold">Settings</h1><p>System settings coming soon...</p></div>} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;