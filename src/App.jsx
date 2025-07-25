import React from 'react';
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
          <h1 style={{ color: 'red' }}>Something went wrong</h1>
          <p>The Osol Dashboard encountered an error and needs to be refreshed.</p>
          <details style={{ whiteSpace: 'pre-wrap', background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>
            <summary>Error Details</summary>
            {this.state.error && this.state.error.toString()}
            <br />
            {this.state.errorInfo && this.state.errorInfo.componentStack}
          </details>
          <button 
            onClick={() => window.location.reload()} 
            style={{ 
              marginTop: '10px', 
              padding: '10px 20px', 
              backgroundColor: '#007bff', 
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
              backgroundColor: '#28a745', 
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

// Safe App Component with try-catch
function SafeApp() {
  try {
    console.log('Rendering SafeApp component...');
    const { i18n } = useTranslation();
    
    console.log('i18n initialized, current language:', i18n.language);
    
    return (
      <div className={`app ${i18n.language === 'ar' ? 'rtl' : 'ltr'}`} dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
        <Router>
          <Layout>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/dashboards/custom" element={<CustomDashboard />} />
              <Route path="/dashboards/executive" element={<ExecutiveDashboard />} />
              <Route path="/dashboards/operations" element={<OperationsDashboard />} />
              <Route path="/customers" element={<Customers />} />
              <Route path="/customers/new" element={<Customers />} />
              <Route path="/customers/kyc-pending" element={<Customers />} />
              <Route path="/customers/risk" element={<Customers />} />
              <Route path="/accounts" element={<Accounts />} />
              <Route path="/accounts/new" element={<Accounts />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/transactions/pending" element={<Transactions />} />
              <Route path="/transactions/failed" element={<Transactions />} />
              <Route path="/loans" element={<Loans />} />
              <Route path="/loans/applications" element={<Loans />} />
              <Route path="/loans/disbursed" element={<Loans />} />
              <Route path="/loans/overdue" element={<Loans />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/analytics" element={<Analytics />} />
              <Route path="/compliance" element={<Compliance />} />
              
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
            </Routes>
          </Layout>
          <Toaster />
        </Router>
      </div>
    );
  } catch (error) {
    console.error('Error in SafeApp component:', error);
    return (
      <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
        <h1 style={{ color: 'red' }}>App Component Error</h1>
        <p>Failed to render the Osol Dashboard app component:</p>
        <pre style={{ background: '#f5f5f5', padding: '10px', borderRadius: '4px' }}>{error.message}</pre>
        <button 
          onClick={() => window.location.reload()} 
          style={{ 
            marginTop: '10px', 
            padding: '10px 20px', 
            backgroundColor: '#007bff', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }
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

