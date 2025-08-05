import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import ModernLayout from './components/layout/ModernLayout';
import { FilterProvider } from './contexts/FilterContext';
import { RTLWrapper } from './components/ui/rtl-wrapper';
import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import ProtectedRoute from './components/auth/ProtectedRoute';

// Import test utility for debugging
import './utils/testCustomerCount';
import './utils/objectRenderingDiagnostic';
import './utils/reactObjectRenderingFix';

import Dashboard from './pages/Dashboard';
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
import CollectionDetailView from './pages/CollectionDetailView';
import CollectionCases from './pages/CollectionCases';
import CollectionCaseDetails from './pages/CollectionCaseDetails';
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
import SpecialistCollectionDashboard from './pages/SpecialistCollectionDashboard';
import DatabaseTest from './pages/DatabaseTest';
import DiagnosticPage from './pages/DiagnosticPage';
import DatabaseDiagnostic from './pages/DatabaseDiagnostic';
import BranchReportPage from '@/pages/collection/BranchReport';
import ProductReportPage from '@/pages/collection/ProductReport';
import { NewSidebarDemo } from './pages/NewSidebarDemo';
import { SimpleSidebarDemo } from './pages/SimpleSidebarDemo';
import { BasicSidebarTest } from './pages/BasicSidebarTest';
import TestModernLayout from './pages/TestModernLayout';
import SimpleTest from './pages/SimpleTest';
import TestMobileSidebar from './pages/TestMobileSidebar';
import DashboardDetail from './pages/DashboardDetail';
import DashboardDetailNew from './pages/DashboardDetailNew';
import ModernDashboardDetail from './pages/ModernDashboardDetail';
import DashboardCardsDemo from './pages/DashboardCardsDemo';
import DashboardReports from './pages/DashboardReports';
import ReportsHealthCheck from './pages/ReportsHealthCheck';
import TestDashboardRouting from './pages/TestDashboardRouting';
import TestDashboardDetailNew from './pages/TestDashboardDetailNew';
import ErrorBoundary from './components/ErrorBoundary';
import { ObjectRenderingFixProvider } from './contexts/ObjectRenderingFixContext';
import ReactErrorInterceptor from './components/ReactErrorInterceptor';

import { Toaster } from './components/ui/sonner';
import { useTranslation } from 'react-i18next';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import './App.css';
import { testDatabaseSchema } from '@/utils/testDatabaseSchema';
import { testDashboardConsistency } from '@/utils/testDashboardConsistency';

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

// Main App Component
function App() {
  const { i18n } = useTranslation();

  // Set up mobile viewport
  useEffect(() => {
    // Add viewport meta tag for proper mobile scaling
    const viewport = document.querySelector('meta[name="viewport"]');
    if (!viewport) {
      const meta = document.createElement('meta');
      meta.name = 'viewport';
      meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no';
      document.head.appendChild(meta);
    }

    // Add mobile-specific classes to body
    const checkMobile = () => {
      const isMobile = window.innerWidth <= 768;
      document.body.classList.toggle('mobile', isMobile);
      document.body.classList.toggle('desktop', !isMobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  return (
    <ErrorBoundary>
      <ReactErrorInterceptor>
        <ObjectRenderingFixProvider>
          <FilterProvider>
            <Router>
              <AuthProvider>
                <AppContent />
              </AuthProvider>
            </Router>
          </FilterProvider>
        </ObjectRenderingFixProvider>
      </ReactErrorInterceptor>
    </ErrorBoundary>
  );
}

// App Content Component that can use Router hooks
function AppContent() {
  const { i18n, t } = useTranslation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Add test function to window for debugging
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.testDashboardConsistency = testDashboardConsistency;
      console.log('💡 Run window.testDashboardConsistency() in console to test dashboard data consistency');
    }
  }, []);

  // Handle mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  // Ensure document language and direction are set with proper mobile handling
  useEffect(() => {
    const currentLang = i18n.language || 'en'; // Default to English
    document.documentElement.lang = currentLang;
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    
    // Add language-specific class to html element
    document.documentElement.className = document.documentElement.className
      .replace(/lang-\w+/g, '')
      .trim() + ` lang-${currentLang}`;
    
    // Set proper font family based on language
    if (currentLang === 'ar') {
      document.documentElement.style.fontFamily = "'Noto Sans Arabic', 'Segoe UI', system-ui, -apple-system, sans-serif";
    } else {
      document.documentElement.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
    }
  }, [i18n.language]);

  // Handle language changes with enhanced mobile support
  useEffect(() => {
    const handleLanguageChange = (lng) => {
      const isArabic = lng === 'ar';
      setIsRTL(isArabic);
      document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
      document.documentElement.lang = lng;
      
      // Update language class
      document.documentElement.className = document.documentElement.className
        .replace(/lang-\w+/g, '')
        .trim() + ` lang-${lng}`;
      
      // Update font family
      if (isArabic) {
        document.documentElement.style.fontFamily = "'Noto Sans Arabic', 'Segoe UI', system-ui, -apple-system, sans-serif";
      } else {
        document.documentElement.style.fontFamily = "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif";
      }
      
      // Force re-render of components that depend on text direction
      window.dispatchEvent(new Event('languagechange'));
    };

    i18n.on('languageChanged', handleLanguageChange);
    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  // Handle dark mode with mobile considerations
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const shouldBeDark = savedTheme === 'dark' || (!savedTheme && prefersDark);
    
    setIsDarkMode(shouldBeDark);
    if (shouldBeDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    const newDarkMode = !isDarkMode;
    setIsDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    if (newDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // Close sidebar on mobile when navigating
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile]);

  return (
    <RTLWrapper className="app min-h-screen">
      <RouteRedirect />
      <Routes>
        {/* Login Route - Not Protected */}
        <Route path="/login" element={<Login />} />
        
        {/* Protected Routes */}
        <Route element={
          <ProtectedRoute>
            <ModernLayout sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} isMobile={isMobile} isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} />
          </ProtectedRoute>
        }>
          {/* Main Routes */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/detail/:type/:widgetId" element={<DashboardDetail />} />
          <Route path="/dashboard/detail-new/:section/:widgetId" element={<DashboardDetailNew />} />
          <Route path="/dashboard/modern-detail/:cardType" element={<ModernDashboardDetail />} />
          <Route path="/dashboard/cards-demo" element={<DashboardCardsDemo />} />
          <Route path="/dashboard/reports" element={<DashboardReports />} />
          <Route path="/test-dashboard" element={<TestDashboardRouting />} />
          <Route path="/test-dashboard-detail-new" element={<TestDashboardDetailNew />} />
          
          {/* Dashboard Routes */}
          <Route path="/dashboards/custom" element={
            <ErrorBoundary>
              <CustomDashboard />
            </ErrorBoundary>
          } />
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
          <Route path="/diagnostic" element={<DiagnosticPage />} />
          <Route path="/db-diagnostic" element={<DatabaseDiagnostic />} />
          <Route path="/reports-health-check" element={<ReportsHealthCheck />} />
          <Route path="/new-sidebar-demo" element={<NewSidebarDemo />} />
          <Route path="/simple-sidebar-demo" element={<SimpleSidebarDemo />} />
          <Route path="/basic-sidebar-test" element={<BasicSidebarTest />} />
          <Route path="/test-modern-layout" element={<TestModernLayout />} />
          <Route path="/simple-test" element={<SimpleTest />} />
          <Route path="/test-mobile-sidebar" element={<TestMobileSidebar />} />
          
          
          {/* Collection Routes */}
          <Route path="/collection" element={<Navigate to="/collection/overview" replace />} />
          <Route path="/collection/overview" element={<CollectionOverview />} />
          <Route path="/collection/detail/:cardType" element={<CollectionDetailView />} />
          <Route path="/collection/cases" element={<CollectionCases />} />
          <Route path="/collection/cases/:caseId" element={<CollectionCaseDetails />} />
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
          <Route path="/collection/specialist" element={<SpecialistCollectionDashboard />} />
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
        </Route>
      </Routes>
      <Toaster />
    </RTLWrapper>
  );
}

export default App;