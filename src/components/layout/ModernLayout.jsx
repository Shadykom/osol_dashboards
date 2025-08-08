import React from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SidebarProvider, useSidebar } from '../../contexts/SidebarContext';
import ModernSidebar from './ModernSidebar';
import ErrorBoundaryWrapper from './ErrorBoundaryWrapper';
import { Menu, Bell, Search, User, Globe, Moon, Sun, LogOut } from 'lucide-react';
import { RTLWrapper, RTLFlex, useRTLClasses } from '../ui/rtl-wrapper';
import { cn } from '@/lib/utils';
import { useAuth } from '../../contexts/AuthContext';

// Language Switcher Component
const LanguageSwitcher = () => {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar';
    i18n.changeLanguage(newLang);
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex items-center gap-2"
      title={isRTL ? 'Switch to English' : 'التبديل إلى العربية'}
    >
      <Globe className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      <span className="hidden sm:inline-block text-sm font-medium text-gray-700 dark:text-gray-300">
        {isRTL ? 'EN' : 'AR'}
      </span>
    </button>
  );
};

// Header component
const Header = ({ isDarkMode, toggleDarkMode, isMobile }) => {
  const { i18n, t, ready } = useTranslation('translation');
  const { toggleSidebar } = useSidebar();
  const { isRTL, marginStart, marginEnd } = useRTLClasses();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [showUserMenu, setShowUserMenu] = React.useState(false);
  const userMenuRef = React.useRef(null);

  // Close user menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!ready) {
    return null;
  }

  return (
    <header className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Mobile menu button */}
          <button
            onClick={toggleSidebar}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label={t('common.toggleMenu')}
          >
            <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Search bar - Hidden on mobile, shown on tablet and up */}
          <div className={cn(
            "hidden sm:flex items-center bg-gray-100 dark:bg-gray-800 rounded-lg px-3 py-2",
            "w-64 lg:w-96"
          )}>
            <Search className={cn("w-5 h-5 text-gray-400", isRTL ? "ml-2" : "mr-2")} />
            <input
              type="text"
              placeholder={t('common.searchPlaceholder')}
              className="bg-transparent flex-1 outline-none text-gray-700 dark:text-gray-300 placeholder-gray-400"
              dir="auto"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-1 sm:gap-2 lg:gap-4">
          {/* Mobile search button */}
          <button 
            className="sm:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label={t('common.search')}
          >
            <Search className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>

          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Dark Mode Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label={isDarkMode ? t('common.lightMode') : t('common.darkMode')}
          >
            {isDarkMode ? (
              <Sun className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            ) : (
              <Moon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            )}
          </button>

          {/* Notifications */}
          <button 
            className="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors touch-target"
            aria-label={t('common.notifications')}
          >
            <Bell className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <span className={cn(
              "absolute top-1 w-2 h-2 bg-red-500 rounded-full",
              isRTL ? "left-1" : "right-1"
            )}></span>
          </button>

          {/* User menu */}
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <span className="hidden sm:block text-sm font-medium text-gray-700 dark:text-gray-300">
                {user?.full_name || user?.email || t('common.adminUser')}
              </span>
            </button>
            
            {/* User dropdown menu */}
            {showUserMenu && (
              <div className={cn(
                "absolute top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1",
                isRTL ? "left-0" : "right-0"
              )}>
                <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.full_name || 'User'}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                </div>
                <button
                  onClick={async () => {
                    await signOut();
                    navigate('/login');
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  {t('common.logout', 'Logout')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

// Main layout content
const LayoutContent = ({ sidebarOpen, setSidebarOpen, isMobile, isDarkMode, toggleDarkMode }) => {
  const { isOpen, closeSidebar } = useSidebar();
  const { i18n, ready } = useTranslation('translation');
  const isRTL = i18n.language === 'ar';

  // Debug logging
  React.useEffect(() => {
    console.log('🚀 [ModernLayout] Mounted - Using MODERN SIDEBAR');
    console.log('🚀 [ModernLayout] Current path:', window.location.pathname);
    console.log('🚀 [ModernLayout] This is the NEW layout with organized sidebar');
    console.log('🚀 [ModernLayout] RTL Mode:', isRTL);
    console.log('🚀 [ModernLayout] Mobile Mode:', isMobile);
  }, [isRTL, isMobile]);

  if (!ready) {
    return null;
  }

  // Handle body scroll locking on mobile
  React.useEffect(() => {
    if (isMobile && isOpen) {
      document.body.classList.add('sidebar-open');
    } else {
      document.body.classList.remove('sidebar-open');
    }
    
    return () => {
      document.body.classList.remove('sidebar-open');
    };
  }, [isMobile, isOpen]);

  return (
    <div className={cn(
      "flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950",
      isRTL && "flex-row-reverse"
    )}>
      {/* Sidebar */}
      <ModernSidebar isMobile={isMobile} />

      {/* Overlay for mobile */}
      {isMobile && isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden"
          onClick={closeSidebar}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <Header isDarkMode={isDarkMode} toggleDarkMode={toggleDarkMode} isMobile={isMobile} />

        {/* Page content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <RTLWrapper className="w-full">
            <div className={cn(
              "w-full max-w-7xl mx-auto",
              "px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8"
            )}>
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
          </RTLWrapper>
        </main>

        {/* Mobile bottom navigation bar (optional) */}
        {isMobile && (
          <nav className="mobile-nav bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-4 py-2">
            <div className="flex justify-around">
              {/* Add mobile navigation items here if needed */}
            </div>
          </nav>
        )}
      </div>
    </div>
  );
};

// Main ModernLayout component
function ModernLayout({ sidebarOpen, setSidebarOpen, isMobile, isDarkMode, toggleDarkMode }) {
  return (
    <SidebarProvider>
      <LayoutContent 
        sidebarOpen={sidebarOpen} 
        setSidebarOpen={setSidebarOpen}
        isMobile={isMobile}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />
    </SidebarProvider>
  );
}

export default ModernLayout;