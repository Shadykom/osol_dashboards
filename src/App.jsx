import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { Layout } from './components/layout/Layout';

// Dashboard imports
import Dashboard from './pages/Dashboard';
import { CustomDashboard } from './pages/CustomDashboard';
import { ExecutiveDashboard } from './pages/ExecutiveDashboard';
import { OperationsDashboard } from './pages/OperationsDashboard';

// Customer imports
import { Customers } from './pages/Customers';

// Account imports
import { Accounts } from './pages/Accounts';

// Transaction imports
import { Transactions } from './pages/Transactions';

// Loan imports
import { Loans } from './pages/Loans';

// Report and Analytics imports
import { Reports } from './pages/Reports';
import { Analytics } from './pages/Analytics';
import { Compliance } from './pages/Compliance';

// Collection imports
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
import DelinquencyExecutiveDashboard from './pages/DelinquencyExecutiveDashboard';
import SpecialistLevelReport from './pages/SpecialistLevelReport';
import BranchReportPage from '@/pages/collection/BranchReport';
import ProductReportPage from '@/pages/collection/ProductReport';

// Test and utility imports
import DatabaseTest from './pages/DatabaseTest';
import { SidebarTest } from './components/SidebarTest'; // Optional test component

// UI imports
import { Toaster } from './components/ui/sonner';
import { useTranslation } from 'react-i18next';

// Style imports
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';

// Route Redirect Component for handling legacy URLs
function RouteRedirect() {
  const location = useLocation();
  
  useEffect(() => {
    const path = location.pathname;
    
    // Map old URLs to new URLs
    const redirectMap = {
      '/collection-daily': '/collection/daily',
      '/collection-overview': '/collection/overview',
      '/collection-cases': '/collection/cases',
      '/collection-reports': '/collection/reports',
      '/collection-digital': '/collection/digital',
      '/collection-early-warning': '/collection/early-warning',
      '/collection-executive': '/collection/executive',
      '/collection-field': '/collection/field',
      '/collection-officer-performance': '/collection/officer-performance',
      '/collection-sharia-compliance': '/collection/sharia-compliance',
      '/collection-vintage-analysis': '/collection/vintage-analysis'
    };
    
    if (redirectMap[path]) {
      window.location.replace(redirectMap[path]);
    }
  }, [location]);
  
  return null;
}

// Error Boundary Component
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('App Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error: error,
      errorInfo: errorInfo
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
          <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <svg className="w-6 h-6 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              Something went wrong
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              The Konan Dashboard encountered an error and needs to be refreshed.
            </p>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="mb-4 p-3 bg-gray-100 dark:bg-gray-700 rounded text-sm">
                <summary className="cursor-pointer font-medium text-gray-700 dark:text-gray-300">
                  Error Details
                </summary>
                <pre className="mt-2 text-xs overflow-auto text-gray-600 dark:text-gray-400">
                  {this.state.error && this.state.error.toString()}
                  {this.state.errorInfo && this.state.errorInfo.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3">
              <button 
                onClick={() => window.location.reload()} 
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
              >
                Refresh Page
              </button>
              <button 
                onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
                className="flex-1 px-4 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 404 Page Component
function NotFound() {
  const { t } = useTranslation();
  
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200 dark:text-gray-700">404</h1>
        <h2 className="text-3xl font-semibold text-gray-900 dark:text-white mt-4">
          {t('errors.pageNotFound', 'Page Not Found')}
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mt-2 max-w-md mx-auto">
          {t('errors.pageNotFoundDesc', 'The page you are looking for doesn\'t exist or has been moved.')}
        </p>
        <div className="mt-8 flex gap-4 justify-center">
          <button 
            onClick={() => window.history.back()} 
            className="px-6 py-3 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg transition-colors"
          >
            {t('common.goBack', 'Go Back')}
          </button>
          <a 
            href="/dashboard" 
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg transition-colors inline-block"
          >
            {t('common.backToDashboard', 'Back to Dashboard')}
          </a>
        </div>
      </div>
    </div>
  );
}

// Main App Component with all routes
function AppContent() {
  const { i18n } = useTranslation();
  
  // Set document direction and language based on i18n
  useEffect(() => {
    const currentLang = i18n.language || 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
    
    // Add class to body for additional styling hooks
    document.body.className = currentLang === 'ar' ? 'rtl' : 'ltr';
  }, [i18n.language]);
  
  // Log app initialization
  useEffect(() => {
    console.log('Konan Dashboard initialized', {
      language: i18n.language,
      direction: document.documentElement.dir,
      viewport: `${window.innerWidth}x${window.innerHeight}`,
      userAgent: navigator.userAgent
    });
  }, [i18n.language]);
  
  return (
    <Router>
      <RouteRedirect />
      <Layout>
        <Routes>
          {/* Root redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          
          {/* Main Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboards/custom" element={<CustomDashboard />} />
          <Route path="/dashboards/executive" element={<ExecutiveDashboard />} />
          <Route path="/dashboards/operations" element={<OperationsDashboard />} />
          
          {/* Customer Management Routes */}
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/new" element={<Customers />} />
          <Route path="/customers/kyc-pending" element={<Customers />} />
          <Route path="/customers/risk" element={<Customers />} />
          
          {/* Account Management Routes */}
          <Route path="/accounts" element={<Accounts />} />
          <Route path="/accounts/new" element={<Accounts />} />
          <Route path="/accounts/blocked" element={<Accounts />} />
          <Route path="/accounts/dormant" element={<Accounts />} />
          
          {/* Transaction Routes */}
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/transactions/pending" element={<Transactions />} />
          <Route path="/transactions/failed" element={<Transactions />} />
          <Route path="/transactions/bulk" element={<Transactions />} />
          
          {/* Loan Management Routes */}
          <Route path="/loans" element={<Loans />} />
          <Route path="/loans/applications" element={<Loans />} />
          <Route path="/loans/disbursed" element={<Loans />} />
          <Route path="/loans/disbursements" element={<Loans />} />
          <Route path="/loans/collections" element={<Loans />} />
          <Route path="/loans/overdue" element={<Loans />} />
          
          {/* Reports & Analytics Routes */}
          <Route path="/reports" element={<Reports />} />
          <Route path="/reports/financial" element={<Reports />} />
          <Route path="/reports/regulatory" element={<Reports />} />
          <Route path="/reports/customers" element={<Reports />} />
          <Route path="/reports/risk" element={<Reports />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/compliance" element={<Compliance />} />
          
          {/* Operations Routes */}
          <Route path="/operations/branches" element={<OperationsDashboard />} />
          <Route path="/operations/users" element={<OperationsDashboard />} />
          <Route path="/operations/audit" element={<OperationsDashboard />} />
          <Route path="/operations/health" element={<OperationsDashboard />} />
          
          {/* Collection Routes - New Structure */}
          <Route path="/collection" element={<Navigate to="/collection/overview" replace />} />
          <Route path="/collection/overview" element={<CollectionOverview />} />
          <Route path="/collection/cases" element={<CollectionCases />} />
          <Route path="/collection/reports" element={<CollectionReports />} />
          <Route path="/collection/daily" element={<DailyCollectionDashboard />} />
          <Route path="/collection/digital" element={<DigitalCollectionDashboard />} />
          <Route path="/collection/early-warning" element={<EarlyWarningDashboard />} />
          <Route path="/collection/executive" element={<ExecutiveCollectionDashboard />} />
          <Route path="/collection/field" element={<FieldCollectionDashboard />} />
          <Route path="/collection/officer-performance" element={<OfficerPerformanceDashboard />} />
          <Route path="/collection/sharia-compliance" element={<ShariaComplianceDashboard />} />
          <Route path="/collection/vintage-analysis" element={<VintageAnalysisDashboard />} />
          <Route path="/collection/delinquency-executive" element={<DelinquencyExecutiveDashboard />} />
          <Route path="/collection/specialist-report" element={<SpecialistLevelReport />} />
          <Route path="/collection/branch-report" element={<BranchReportPage />} />
          <Route path="/collection/product-report" element={<ProductReportPage />} />
          
          {/* Legacy URL Redirects for backwards compatibility */}
          <Route path="/collection-daily" element={<Navigate to="/collection/daily" replace />} />
          <Route path="/collection-overview" element={<Navigate to="/collection/overview" replace />} />
          <Route path="/collection-cases" element={<Navigate to="/collection/cases" replace />} />
          <Route path="/collection-reports" element={<Navigate to="/collection/reports" replace />} />
          <Route path="/collection-digital" element={<Navigate to="/collection/digital" replace />} />
          <Route path="/collection-early-warning" element={<Navigate to="/collection/early-warning" replace />} />
          <Route path="/collection-executive" element={<Navigate to="/collection/executive" replace />} />
          <Route path="/collection-field" element={<Navigate to="/collection/field" replace />} />
          <Route path="/collection-officer-performance" element={<Navigate to="/collection/officer-performance" replace />} />
          <Route path="/collection-sharia-compliance" element={<Navigate to="/collection/sharia-compliance" replace />} />
          <Route path="/collection-vintage-analysis" element={<Navigate to="/collection/vintage-analysis" replace />} />
          
          {/* Test & Debug Routes */}
          <Route path="/database-test" element={<DatabaseTest />} />
          <Route path="/sidebar-test" element={<SidebarTest />} />
          
          {/* 404 - This should be last */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Layout>
      <Toaster 
        position="top-right"
        expand={false}
        richColors
        closeButton
        duration={4000}
      />
    </Router>
  );
}

// Main App Component wrapped with Error Boundary
function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;