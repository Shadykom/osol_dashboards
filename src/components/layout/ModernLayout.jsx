import React from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import ModernSidebar from './ModernSidebar';
import ErrorBoundaryWrapper from './ErrorBoundaryWrapper';
import { Menu, Bell, Search, User } from 'lucide-react';

// Header component
const Header = () => {
  const { i18n } = useTranslation();
  const { toggleSidebar, isMobile } = useSidebar();
  const isRTL = i18n.language === 'ar';

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Search bar */}
          <div className="hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2 w-64 lg:w-96">
            <Search className={`w-5 h-5 text-gray-400 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            <input
              type="text"
              placeholder={i18n.t('common.searchPlaceholder')}
              className="bg-transparent flex-1 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
              dir={isRTL ? 'rtl' : 'ltr'}
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile search button */}
          <button className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Notifications */}
          <button className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          {/* User menu */}
          <button className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
              Admin User
            </span>
          </button>
        </div>
      </div>
    </header>
  );
};

// Main layout content
const LayoutContent = () => {
  const { isOpen, isMobile } = useSidebar();
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  // Debug logging
  React.useEffect(() => {
    console.log('🚀 [ModernLayout] Mounted - Using MODERN SIDEBAR');
    console.log('🚀 [ModernLayout] Current path:', window.location.pathname);
    console.log('🚀 [ModernLayout] This is the NEW layout with organized sidebar');
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Sidebar */}
      <ModernSidebar />

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <ErrorBoundaryWrapper>
              <React.Suspense fallback={
                <div className="flex items-center justify-center h-64">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 dark:border-white mx-auto"></div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading...</p>
                  </div>
                </div>
              }>
                <Outlet />
              </React.Suspense>
            </ErrorBoundaryWrapper>
          </div>
        </main>
      </div>
    </div>
  );
};

// Main layout component with provider
const ModernLayout = () => {
  return (
    <SidebarProvider>
      <LayoutContent />
    </SidebarProvider>
  );
};

export default ModernLayout;