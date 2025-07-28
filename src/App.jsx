import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import DelinquencyExecutiveDashboard from './pages/DelinquencyExecutiveDashboard';
import SpecialistLevelReport from './pages/SpecialistLevelReport';
import DatabaseTest from './pages/DatabaseTest';
import BranchReportPage from '@/pages/collection/BranchReport';
import ProductReportPage from '@/pages/collection/ProductReport';
import { Toaster } from './components/ui/sonner';
import { useTranslation } from 'react-i18next';
import { RTLDebug } from './components/RTLDebug';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';

// Route Redirect Component
function RouteRedirect() {
  const location = useLocation();
  
  // Handle legacy URL patterns
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
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
          <h1 style={{ color: '#dc2626' }}>Something went wrong</h1>
          <p>The Osoul Dashboard encountered an error and needs to be refreshed.</p>
          <details style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px', borderRadius: '4px', marginTop: '10px' }}>
            <summary style={{ cursor: 'pointer' }}>Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '10px', 
              padding: '10px 20px', 
              backgroundColor: '#2563eb', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Refresh Page
          </button>
          <button 
            onClick={() => this.setState({ hasError: false, error: null, errorInfo: null })} 
            style={{ 
              marginTop: '10px', 
              marginLeft: '10px',
              padding: '10px 20px', 
              backgroundColor: '#16a34a', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// 404 Page Component
function NotFound() {
  return (
    <div style={{ textAlign: 'center', padding: '50px' }}>
      <h1 style={{ fontSize: '48px', color: '#dc2626' }}>404</h1>
      <h2>Page Not Found</h2>
      <p>The page you are looking for doesn't exist.</p>
      <button 
        onClick={() => window.location.href = '/dashboard'} 
        style={{ 
          marginTop: '20px', 
          padding: '10px 20px', 
          backgroundColor: '#2563eb', 
          color: 'white', 
          border: 'none', 
          borderRadius: '4px', 
          cursor: 'pointer' 
        }}
      >
        Go to Dashboard
      </button>
    </div>
  );
}

// Safe App Component
function SafeApp() {
  const { i18n } = useTranslation();
  
  // Database connection status logging and RTL setup
  useEffect(() => {
    if (import.meta.env.DEV) {
      console.log('🔗 Checking database connection status...');
      // Connection status is already logged in supabase.js
    }
    
    // Ensure document direction is set on mount
    const currentLang = i18n.language || 'en';
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = currentLang;
  }, [i18n.language]);
  
  return (
    <div className={`app ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <Router>
        <RouteRedirect />
        <Layout>
          <Routes>
            {/* Main Routes */}
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Dashboard Routes */}
            <Route path="/dashboards/custom" element={<CustomDashboard />} />
            <Route path="/dashboards/executive" element={<ExecutiveDashboard />} />
            <Route path="/dashboards/operations" element={<OperationsDashboard />} />
            
            {/* Customer Routes */}
            <Route path="/customers" element={<Customers />} />
            <Route path="/customers/new" element={<Customers />} />
            <Route path="/customers/kyc-pending" element={<Customers />} />
            <Route path="/customers/risk" element={<Customers />} />
            
            {/* Account Routes */}
            <Route path="/accounts" element={<Accounts />} />
            <Route path="/accounts/new" element={<Accounts />} />
            <Route path="/accounts/blocked" element={<Accounts />} />
            <Route path="/accounts/dormant" element={<Accounts />} />
            
            {/* Transaction Routes */}
            <Route path="/transactions" element={<Transactions />} />
            <Route path="/transactions/pending" element={<Transactions />} />
            <Route path="/transactions/failed" element={<Transactions />} />
            <Route path="/transactions/bulk" element={<Transactions />} />
            
            {/* Loan Routes */}
            <Route path="/loans" element={<Loans />} />
            <Route path="/loans/applications" element={<Loans />} />
            <Route path="/loans/disbursed" element={<Loans />} />
            <Route path="/loans/disbursements" element={<Loans />} />
            <Route path="/loans/collections" element={<Loans />} />
            <Route path="/loans/overdue" element={<Loans />} />
            
            {/* Reports Routes */}
            <Route path="/reports" element={<Reports />} />
            <Route path="/reports/financial" element={<Reports />} />
            <Route path="/reports/regulatory" element={<Reports />} />
            <Route path="/reports/customers" element={<Reports />} />
            <Route path="/reports/risk" element={<Reports />} />
            
            {/* Operations Routes */}
            <Route path="/operations/branches" element={<OperationsDashboard />} />
            <Route path="/operations/users" element={<OperationsDashboard />} />
            <Route path="/operations/audit" element={<OperationsDashboard />} />
            <Route path="/operations/health" element={<OperationsDashboard />} />
            
            {/* Other Routes */}
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/compliance" element={<Compliance />} />
            <Route path="/database-test" element={<DatabaseTest />} />
            
            {/* Collection Routes */}
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
            {/* Legacy URL Redirects (backwards compatibility) */}
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
            
            {/* 404 Route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
        <Toaster />
        <RTLDebug />
      </Router>
    </div>
  );
}

// Main App Component
function App() {
  console.log('App component rendering...');
  
  return (
    <ErrorBoundary>
      <SafeApp />
    </ErrorBoundary>
  );
}

export default App;