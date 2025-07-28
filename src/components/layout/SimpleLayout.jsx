import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MobileSidebar } from './MobileSidebar';
import { Header } from './Header';

export function SimpleLayout({ children }) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileSidebarOpen(false);
  }, [location.pathname]);

  const handleMenuClick = () => {
    setIsMobileSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    setIsMobileSidebarOpen(false);
  };

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      height: '100vh',
      backgroundColor: '#f9fafb'
    }}>
      {/* Header */}
      <Header onMenuClick={handleMenuClick} />
      
      {/* Mobile Sidebar */}
      <MobileSidebar 
        isOpen={isMobileSidebarOpen} 
        onClose={handleCloseSidebar} 
      />
      
      {/* Main Content */}
      <main style={{
        flex: 1,
        overflow: 'auto',
        padding: '1rem'
      }}>
        <div style={{
          maxWidth: '1920px',
          margin: '0 auto',
          height: '100%'
        }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
            border: '1px solid #e5e7eb',
            padding: '1.5rem',
            height: '100%',
            minHeight: 'calc(100vh - 120px)'
          }}>
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}