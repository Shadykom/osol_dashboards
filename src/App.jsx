import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import CollectionOverview from './pages/CollectionOverview';
import CollectionCases from './pages/CollectionCases';
import CollectionReports from './pages/CollectionReports';
import DailyCollectionDashboard from './pages/DailyCollectionDashboard';
import DigitalCollectionDashboard from './pages/DigitalCollectionDashboard';
import EarlyWarningDashboard from './pages/EarlyWarningDashboard';
import ExecutiveCollectionDashboard from './pages/ExecutiveCollectionDashboard';
import FieldCollectionDashboard from './pages/FieldCollectionDashboard';
import OfficerPerformanceDashboard from './pages/OfficerPerformanceDashboard';
import ShariaComplianceDashboard from './pages/ShariaComplianceDashboard';
import VintageAnalysisDashboard from './pages/VintageAnalysisDashboard';
import { Toaster } from './components/ui/sonner';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';
import { useTranslation } from 'react-i18next';

// Placeholder component with translations
function PlaceholderPage({ titleKey, descriptionKey }) {
  const { t } = useTranslation();
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">{t(titleKey)}</h1>
      <p>{t(descriptionKey)}</p>
    </div>
  );
}

function App() {
  return (
    <>
      <Router>
        <Layout>
          <Routes>
            {/* Main Dashboard Routes */}
            <Route path="/" element={<Dashboard />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/custom-dashboard" element={<CustomDashboard />} />
            <Route path="/executive-dashboard" element={<ExecutiveDashboard />} />
            <Route path="/operations-dashboard" element={<OperationsDashboard />} />
            
            {/* Customer Routes */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<PlaceholderPage titleKey="add_new_customer.title" descriptionKey="add_new_customer.description" />} />
            <Route path="/customers/kyc-pending" element={<PlaceholderPage titleKey="kyc_pending.title" descriptionKey="kyc_pending.description" />} />
            <Route path="/customers/risk" element={<PlaceholderPage titleKey="risk_assessment.title" descriptionKey="risk_assessment.description" />} />
            
            {/* Account Routes */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/new" element={<PlaceholderPage titleKey="open_new_account.title" descriptionKey="open_new_account.description" />} />
            <Route path="/accounts/blocked" element={<PlaceholderPage titleKey="blocked_accounts.title" descriptionKey="blocked_accounts.description" />} />
            <Route path="/accounts/dormant" element={<PlaceholderPage titleKey="dormant_accounts.title" descriptionKey="dormant_accounts.description" />} />
            
            {/* Transaction Routes */}
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/pending" element={<PlaceholderPage titleKey="pending_transactions.title" descriptionKey="pending_transactions.description" />} />
            <Route path="/transactions/failed" element={<PlaceholderPage titleKey="failed_transactions.title" descriptionKey="failed_transactions.description" />} />
            <Route path="/transactions/bulk" element={<PlaceholderPage titleKey="bulk_upload.title" descriptionKey="bulk_upload.description" />} />
            
            {/* Loan Routes */}
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/applications" element={<PlaceholderPage titleKey="loan_applications.title" descriptionKey="loan_applications.description" />} />
            <Route path="/loans/disbursements" element={<PlaceholderPage titleKey="loan_disbursements.title" descriptionKey="loan_disbursements.description" />} />
            <Route path="/loans/collections" element={<PlaceholderPage titleKey="loan_collections.title" descriptionKey="loan_collections.description" />} />
            
            {/* Report Routes */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/financial" element={<PlaceholderPage titleKey="financial_reports.title" descriptionKey="financial_reports.description" />} />
            <Route path="/reports/regulatory" element={<PlaceholderPage titleKey="regulatory_reports.title" descriptionKey="regulatory_reports.description" />} />
            <Route path="/reports/customers" element={<PlaceholderPage titleKey="customer_reports.title" descriptionKey="customer_reports.description" />} />
            <Route path="/reports/risk" element={<PlaceholderPage titleKey="risk_reports.title" descriptionKey="risk_reports.description" />} />
            
            {/* Operations Routes */}
            <Route path="/operations" element={<OperationsDashboard />} />
            <Route path="/operations/branches" element={<PlaceholderPage titleKey="branch_management.title" descriptionKey="branch_management.description" />} />
            <Route path="/operations/users" element={<PlaceholderPage titleKey="user_management.title" descriptionKey="user_management.description" />} />
            <Route path="/operations/audit" element={<PlaceholderPage titleKey="audit_trail.title" descriptionKey="audit_trail.description" />} />
            <Route path="/operations/health" element={<PlaceholderPage titleKey="system_health.title" descriptionKey="system_health.description" />} />
            
            {/* Analytics and Compliance Routes */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/compliance" element={<Compliance />} />
            
            {/* Collection Routes */}
            <Route path="/collection-overview" element={<CollectionOverview />} />
            <Route path="/collection-cases" element={<CollectionCases />} />
            <Route path="/collection-reports" element={<CollectionReports />} />
            <Route path="/collection-daily" element={<DailyCollectionDashboard />} />
            <Route path="/collection-digital" element={<DigitalCollectionDashboard />} />
            <Route path="/collection-early-warning" element={<EarlyWarningDashboard />} />
            <Route path="/collection-executive" element={<ExecutiveCollectionDashboard />} />
            <Route path="/collection-field" element={<FieldCollectionDashboard />} />
            <Route path="/collection-officer-performance" element={<OfficerPerformanceDashboard />} />
            <Route path="/collection-sharia-compliance" element={<ShariaComplianceDashboard />} />
            <Route path="/collection-vintage-analysis" element={<VintageAnalysisDashboard />} />
            
            {/* Settings and Help Routes */}
            <Route path="/settings" element={<PlaceholderPage titleKey="system_settings.title" descriptionKey="system_settings.description" />} />
            <Route path="/help" element={<PlaceholderPage titleKey="help_support.title" descriptionKey="help_support.description" />} />
          </Routes>
        </Layout>
      </Router>
      <Toaster />
    </>
  );
}

export default App;