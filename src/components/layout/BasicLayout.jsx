import React, { useState } from 'react';
import { BasicMobileSidebar } from './BasicMobileSidebar';

// Basic header component
function BasicHeader({ onMenuClick }) {
  return (
    <header style={{
      height: '64px',
      backgroundColor: 'white',
      borderBottom: '1px solid #e5e7eb',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 16px',
      position: 'sticky',
      top: 0,
      zIndex: 10
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <button
          onClick={onMenuClick}
          style={{
            width: '40px',
            height: '40px',
            border: 'none',
            backgroundColor: '#f3f4f6',
            borderRadius: '8px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            color: '#374151'
          }}
        >
          ☰
        </button>
        <h1 style={{
          fontSize: '20px',
          fontWeight: 'bold',
          color: '#1f2937',
          margin: 0
        }}>
          Konan Dashboard
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          backgroundColor: '#3b82f6',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '14px',
          fontWeight: 'bold'
        }}>
          JD
        </div>
      </div>
    </header>
  );
}

// Main basic layout component
export function BasicLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleMenuClick = () => {
    console.log('Menu clicked, opening sidebar');
    setSidebarOpen(true);
  };

  const handleCloseSidebar = () => {
    console.log('Closing sidebar');
    setSidebarOpen(false);
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <BasicHeader onMenuClick={handleMenuClick} />
      
      <BasicMobileSidebar 
        isOpen={sidebarOpen} 
        onClose={handleCloseSidebar} 
      />
      
      <main style={{
        flex: 1,
        padding: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e5e7eb',
          minHeight: '500px'
        }}>
          {children}
        </div>
      </main>
    </div>
  );
}