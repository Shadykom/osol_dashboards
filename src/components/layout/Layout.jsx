import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useMediaQuery } from '@/hooks/use-media-query';
import { Header } from './Header';
import { NewSidebar } from './NewSidebar';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { cn } from '@/lib/utils';

export function Layout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDesktopSidebarCollapsed, setIsDesktopSidebarCollapsed] = useState(false);
  const location = useLocation();
  const { i18n } = useTranslation();
  const isMobile = useMediaQuery('(max-width: 1024px)');
  const isRTL = i18n.language === 'ar';
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);
  
  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 1024) {
        setIsMobileSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);
  
  const handleMenuClick = () => {
    if (isMobile) {
      setIsMobileSidebarOpen(true);
    } else {
      setIsDesktopSidebarCollapsed(!isDesktopSidebarCollapsed);
    }
  };
  
  return (
    <div className={cn("flex h-screen overflow-hidden bg-gray-50 dark:bg-gray-950", isRTL && "rtl")} dir={isRTL ? "rtl" : "ltr"}>
      {/* Desktop Sidebar */}
      {!isMobile && (
        <aside className={cn(
          "hidden lg:block transition-all duration-300 border-r border-gray-200 dark:border-gray-800",
          isDesktopSidebarCollapsed ? "w-0" : "w-80"
        )}>
          <div className="h-full overflow-hidden">
            <NewSidebar isOpen={!isDesktopSidebarCollapsed} />
          </div>
        </aside>
      )}
      
      {/* Mobile Sidebar Sheet */}
      <Sheet open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen}>
        <SheetContent 
          side={isRTL ? "right" : "left"} 
          className="w-80 max-w-[85vw] p-0 border-0"
        >
          <NewSidebar 
            isOpen={isMobileSidebarOpen} 
            onClose={() => setIsMobileSidebarOpen(false)}
            isMobile={true}
          />
        </SheetContent>
      </Sheet>
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={handleMenuClick} />
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto p-4 md:p-6 lg:p-8">
            <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 p-6">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}