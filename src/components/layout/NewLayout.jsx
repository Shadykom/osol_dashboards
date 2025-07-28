import { useState, useEffect } from 'react';
import { NewSidebar } from './NewSidebar';
import { Header } from './Header';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks/use-media-query';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Mobile Overlay Component
function MobileOverlay({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
      onClick={onClose}
      aria-hidden="true"
    />
  );
}

// Mobile Sidebar Container
function MobileSidebarContainer({ isOpen, onClose, children }) {
  const { i18n } = useTranslation();
  const isRTL = i18n.language === 'ar';

  return (
    <div
      className={cn(
        "fixed inset-y-0 z-50 w-72 transform transition-transform duration-300 ease-in-out lg:hidden",
        isRTL ? "right-0" : "left-0",
        isOpen ? "translate-x-0" : (isRTL ? "translate-x-full" : "-translate-x-full")
      )}
    >
      {children}
    </div>
  );
}

// Desktop Sidebar Container
function DesktopSidebarContainer({ isCollapsed, children }) {
  return (
    <div className={cn(
      "hidden lg:flex lg:flex-shrink-0 transition-all duration-300",
      isCollapsed ? "lg:w-16" : "lg:w-72"
    )}>
      {children}
    </div>
  );
}

// Main Layout Component
export function NewLayout({ children }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const isMobile = useMediaQuery('(max-width: 1023px)');
  const location = useLocation();
  const { i18n } = useTranslation();

  const isRTL = i18n.language === 'ar';

  // Close mobile sidebar when route changes or screen size changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Close mobile sidebar when clicking outside (handled by overlay)
  const handleMobileSidebarClose = () => {
    setIsMobileSidebarOpen(false);
  };

  // Handle menu button click
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsSidebarCollapsed(!isSidebarCollapsed);
    }
  };

  // Handle navigation item click (close mobile sidebar)
  const handleNavigationClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(false);
    }
  };

  // Prevent body scroll when mobile sidebar is open
  useEffect(() => {
    if (isMobile && isMobileSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobile, isMobileSidebarOpen]);

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Desktop Sidebar */}
      <DesktopSidebarContainer isCollapsed={isSidebarCollapsed}>
        <NewSidebar
          isCollapsed={isSidebarCollapsed}
          setIsCollapsed={setIsSidebarCollapsed}
          onItemClick={handleNavigationClick}
        />
      </DesktopSidebarContainer>

      {/* Mobile Sidebar */}
      <MobileOverlay 
        isOpen={isMobileSidebarOpen} 
        onClose={handleMobileSidebarClose} 
      />
      
      <MobileSidebarContainer 
        isOpen={isMobileSidebarOpen}
        onClose={handleMobileSidebarClose}
      >
        <NewSidebar
          isCollapsed={false}
          onItemClick={handleNavigationClick}
          className="shadow-xl"
        />
      </MobileSidebarContainer>

      {/* Main Content */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">
        
        {/* Header */}
        <Header 
          onMenuClick={handleMenuClick}
          isMobile={isMobile}
          isSidebarCollapsed={isSidebarCollapsed}
        />
        
        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50/50 dark:bg-gray-950">
          <div className="h-full p-4 md:p-6 lg:p-8">
            <div className="w-full max-w-[1920px] mx-auto h-full">
              <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6 h-full">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}