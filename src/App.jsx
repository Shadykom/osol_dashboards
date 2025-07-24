// src/App.jsx
import React, { useEffect, Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./contexts/AuthContext";
import { GoogleMapsProvider } from "./contexts/GoogleMapsContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Navigation from "./components/Navigation";
import Footer from "./components/Footer";
import { consoleErrorSuppressor } from "./utils/consoleErrorSuppressor";
import { productionErrorHandler } from "./utils/productionErrorHandler";
import "./styles/eaalani-theme.css";
import "./styles/dashboard.css";
import UltimateBillboardMap from './pages/UltimateBillboardMap';

// Import Ealaani logo for loading screen
import ealaaniLogo from "./assets/logo/ealaani-logo.png";

// Lazy load components with error handling
const lazyLoadWithRetry = (componentImport, componentName) => {
  return lazy(async () => {
    try {
      return await componentImport();
    } catch (error) {
      console.error(`[EALAANI] Failed to load ${componentName}:`, error);
      
      // If it's a constructor error, try reloading the module
      if (error instanceof Error && error.message.includes('is not a constructor')) {
        console.warn(`[EALAANI] Retrying load for ${componentName}...`);
        
        // Clear module cache if possible
        if ('webpackChunkName' in window) {
          delete window.webpackChunkName;
        }
        
        // Retry after a short delay
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
          return await componentImport();
        } catch (retryError) {
          console.error(`[EALAANI] Retry failed for ${componentName}`);
          // Return a fallback component
          return {
            default: () => (
              <div className="flex items-center justify-center h-screen">
                <div className="text-center">
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    Loading Error
                  </h2>
                  <p className="text-gray-600">
                    Failed to load {componentName}. Please refresh the page.
                  </p>
                  <button
                    onClick={() => window.location.reload()}
                    className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Refresh Page
                  </button>
                </div>
              </div>
            ),
          };
        }
      }
      
      throw error;
    }
  });
};

// Lazy load components with retry mechanism
const HomePage = lazyLoadWithRetry(() => import("./components/HomePage"), "HomePage");
const BillboardDetailsPage = lazyLoadWithRetry(() => import("./components/BillboardDetailsPage"), "BillboardDetailsPage");
const AboutPage = lazyLoadWithRetry(() => import("./components/AboutPage"), "AboutPage");
const ContactPage = lazyLoadWithRetry(() => import("./components/ContactPage"), "ContactPage");
const DashboardRouter = lazyLoadWithRetry(() => import("./components/dashboard/DashboardRouter"), "DashboardRouter");
const NotFoundPage = lazyLoadWithRetry(() => import("./components/NotFoundPage"), "NotFoundPage");
const Howitworks = lazyLoadWithRetry(() => import("./components/HowItWorksPage"), "HowItWorksPage");

// NEW: Enhanced Dashboard Components
const CustomDashboard = lazyLoadWithRetry(() => import("./pages/CustomDashboard"), "CustomDashboard");
const SharedDashboardView = lazyLoadWithRetry(() => import("./pages/SharedDashboardView"), "SharedDashboardView");

// Map components - load with special handling
const ExplorePage = lazyLoadWithRetry(
  () => import("./map").then(module => ({ default: module.default || module.IntegratedMapComponent })),
  "ExplorePage"
);

const MapPage = lazyLoadWithRetry(() => import("./components/MapPage"), "MapPage");

// Lazy load AI Assistant
const EalaaniAIAssistant = lazyLoadWithRetry(() => import('./components/ai/EalaaniAIAssistant'), "EalaaniAIAssistant");

// Auth components - load immediately as they're needed for routing
import LoginComponent from "./components/auth/LoginComponent";
import UserRoleSelection from "./components/auth/UserRoleSelection";
import RegistrationStep1 from "./components/auth/RegistrationStep1";
import RegistrationStep2 from "./components/auth/RegistrationStep2";
import OTPVerification from "./components/auth/OTPVerification";
import RegistrationStep3 from "./components/auth/RegistrationStep3";

// Lazy load investor components
const InvestorProfilePage = lazyLoadWithRetry(() => import("./components/dashboard/investor/InvestorProfilePage"), "InvestorProfilePage");
const BillboardManagementDashboard = lazyLoadWithRetry(() => import("./components/dashboard/investor/BillboardManagementDashboard"), "BillboardManagementDashboard");
const ProfileSettings = lazyLoadWithRetry(() => import("./components/dashboard/advertiser/ProfileSettings"), "ProfileSettings");
const EnhancedBookingWorkflow = lazyLoadWithRetry(() => import("./components/dashboard/advertiser/EnhancedBookingWorkflow"), "EnhancedBookingWorkflow");

// Lazy load indoor mapping components
const MapDemo = lazyLoadWithRetry(() => import("./pages/MapDemo"), "MapDemo");
const DataTestPage = lazyLoadWithRetry(() => import("./components/DataTestPage"), "DataTestPage");
const IndoorMappingPage = lazyLoadWithRetry(() => import("./components/IndoorMappingPage"), "IndoorMappingPage");
const GoogleMapsPreviewPage = lazyLoadWithRetry(() => import("./pages/GoogleMapsPreviewPage"), "GoogleMapsPreviewPage");

// Enhanced loading component with animated Ealaani logo
const LoadingSpinner = () => (
  <div className="flex justify-center items-center h-screen bg-gradient-to-br from-pink-50 via-white to-pink-50">
    <div className="text-center">
      <div className="relative mb-8">
        <div className="relative w-40 h-40 mx-auto">
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 to-pink-700 rounded-full opacity-20 blur-3xl animate-pulse"></div>
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <img 
              src={ealaaniLogo} 
              alt="Ealaani" 
              className="w-full h-full object-contain rounded-full p-4 bg-white"
              style={{
                animation: 'float 3s ease-in-out infinite'
              }}
            />
          </div>
          
          {/* Multiple Animated Loading Rings */}
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderTopColor: '#E91E63',
              borderRightColor: '#D81B60',
              animationDuration: '1s'
            }}
          ></div>
          
          <div 
            className="absolute -inset-2 rounded-full border-4 border-transparent animate-spin"
            style={{
              borderBottomColor: '#F06292',
              borderLeftColor: '#E91E63',
              animationDirection: 'reverse',
              animationDuration: '1.5s',
              opacity: 0.7
            }}
          ></div>
        </div>
      </div>
      
      <div className="flex justify-center gap-3 mt-8">
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="w-3 h-3 bg-gradient-to-r from-pink-600 to-pink-700 rounded-full animate-bounce"
            style={{ 
              animationDelay: `${i * 0.1}s`,
              animationDuration: '1s'
            }}
          ></div>
        ))}
      </div>
    </div>
  </div>
);

// Error boundary specifically for lazy loaded components
const LazyLoadErrorBoundary = ({ children }) => {
  return (
    <ErrorBoundary
      fallback={
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Component Loading Error
            </h2>
            <p className="text-gray-600 mb-4">
              A component failed to load properly.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Refresh Page
            </button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
};

// Protected route wrapper with role checking
const ProtectedRoute = ({ children, requiredRole }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check role if required
  if (requiredRole) {
    const userRole = user.user_metadata?.role || user.app_metadata?.role;
    if (userRole !== requiredRole && !["investor", "billboard_owner"].includes(userRole)) {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};

// Investor Protected Route
const InvestorProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const userRole = user.user_metadata?.role || user.app_metadata?.role;
  const isInvestor = userRole === "investor" || userRole === "billboard_owner";

  if (!isInvestor) {
    console.log("Non-investor user redirected from investor route");
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

// Layout wrapper for consistent page structure
const Layout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen">
      <Navigation />
      <main className="flex-grow">
        <LazyLoadErrorBoundary>
          <Suspense fallback={<LoadingSpinner />}>
            {children}
          </Suspense>
        </LazyLoadErrorBoundary>
      </main>
      <Footer />
    </div>
  );
};

// Main App Component
function App() {
  // Setup error suppression and global handlers
  useEffect(() => {
    // Console error suppressor is already activated in productionErrorFixes
    // Just log the state
    console.log("[EALAANI] App component mounted");

    // In production, use enhanced error handler
    if (process.env.NODE_ENV === "production") {
      productionErrorHandler.activate();
      console.log("[EALAANI] Production error handler activated");
    }

    // Check if Google Maps is loaded
    const checkGoogleMaps = () => {
      if (window.google && window.google.maps) {
        console.log("[EALAANI] Google Maps is available");
      } else {
        console.log("[EALAANI] Waiting for Google Maps to load...");
      }
    };

    checkGoogleMaps();

    // Notify that app has mounted
    window.dispatchEvent(new Event('appMounted'));
    console.log("[EALAANI] App component mounted");

    // Setup development helpers
    if (process.env.NODE_ENV === "development") {
      console.log(`
🚀 Ealaani Development Mode
━━━━━━━━━━━━━━━━━━━━━━━━
✨ AI Assistant is Active!
• Click the floating AI button
• Works with real database
• Smart responses
• Mobile optimized

📊 Features:
• Billboard search
• Price analysis
• Location recommendations
• Real-time data
━━━━━━━━━━━━━━━━━━━━━━━━
      `);
    }
  }, []);

  return (
    <ErrorBoundary>
      <GoogleMapsProvider>
        <Layout>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/billboard/:id" element={<BillboardDetailsPage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/map" element={<UltimateBillboardMap />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/Howitworks" element={<Howitworks />} />
            
            {/* NEW: Enhanced Dashboard Routes */}
            <Route 
              path="/custom-dashboard" 
              element={
                <ProtectedRoute>
                  <CustomDashboard />
                </ProtectedRoute>
              } 
            />
            
            {/* NEW: Shared Dashboard Route - Public (no auth required) */}
            <Route path="/shared-dashboard/:token" element={<SharedDashboardView />} />
            
            {/* Indoor Mapping Routes */}
            <Route path="/indoor-mapping" element={<IndoorMappingPage />} />
            <Route path="/map-demo" element={<MapDemo />} />
            <Route path="/data-test" element={<DataTestPage />} />
            <Route path="/indoor-map" element={<ExplorePage />} />
            <Route path="/google-maps-preview" element={<GoogleMapsPreviewPage />} />

            {/* Auth routes */}
            <Route path="/login" element={<LoginComponent />} />
            <Route path="/register" element={<UserRoleSelection />} />
            <Route path="/register/step1" element={<RegistrationStep1 />} />
            <Route path="/register/step2" element={<RegistrationStep2 />} />
            <Route path="/register/otp" element={<OTPVerification />} />
            <Route path="/register/step3" element={<RegistrationStep3 />} />
            
            {/* Protected routes */}
            <Route 
              path="/dashboard/*" 
              element={
                <ProtectedRoute>
                  <DashboardRouter />
                </ProtectedRoute>
              } 
            />

            {/* Investor-specific routes */}
            <Route 
              path="/investor/profile" 
              element={
                <InvestorProtectedRoute>
                  <InvestorProfilePage />
                </InvestorProtectedRoute>
              } 
            />
            
            <Route 
              path="/investor/dashboard" 
              element={
                <InvestorProtectedRoute>
                  <BillboardManagementDashboard />
                </InvestorProtectedRoute>
              } 
            />

            <Route 
              path="/billboard-management" 
              element={
                <InvestorProtectedRoute>
                  <BillboardManagementDashboard />
                </InvestorProtectedRoute>
              } 
            />

            {/* Advertiser routes */}
            <Route 
              path="/advertiser/profile" 
              element={
                <ProtectedRoute>
                  <ProfileSettings />
                </ProtectedRoute>
              } 
            />

            <Route 
              path="/advertiser/booking" 
              element={
                <ProtectedRoute>
                  <EnhancedBookingWorkflow />
                </ProtectedRoute>
              } 
            />
            
            {/* 404 route */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Layout>

        {/* Global AI Assistant - Lazy loaded */}
        <Suspense fallback={null}>
          <EalaaniAIAssistant />
        </Suspense>
      </GoogleMapsProvider>
      
      {/* Global Styles */}
      <style jsx global>{`
        @keyframes float {
          0%, 100% {
            transform: translateY(0px) scale(1);
          }
          50% {
            transform: translateY(-10px) scale(1.05);
          }
        }
        
        @keyframes swim {
          0%, 100% {
            transform: translateY(0) translateX(0) rotate(0deg);
          }
          25% {
            transform: translateY(-10px) translateX(5px) rotate(5deg);
          }
          50% {
            transform: translateY(5px) translateX(-5px) rotate(-5deg);
          }
          75% {
            transform: translateY(-5px) translateX(3px) rotate(3deg);
          }
        }
        
        .animate-swim {
          animation: swim 6s ease-in-out infinite;
        }
      `}</style>
    </ErrorBoundary>
  );
}

export default App;