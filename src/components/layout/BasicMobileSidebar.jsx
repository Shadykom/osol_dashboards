import React, { useState, useEffect } from 'react';

// Extremely basic navigation data
const NAVIGATION = [
  { id: 1, title: 'Dashboard', path: '/dashboard' },
  { id: 2, title: 'Customers', path: '/customers' },
  { id: 3, title: 'Accounts', path: '/accounts' },
  { id: 4, title: 'Transactions', path: '/transactions' },
  { id: 5, title: 'Loans', path: '/loans' },
  { id: 6, title: 'Collection Overview', path: '/collection/overview' },
  { id: 7, title: 'Daily Collection', path: '/collection/daily' },
  { id: 8, title: 'Digital Collection', path: '/collection/digital' },
  { id: 9, title: 'Early Warning', path: '/collection/early-warning' },
  { id: 10, title: 'Executive Collection', path: '/collection/executive' },
  { id: 11, title: 'Field Collection', path: '/collection/field' },
  { id: 12, title: 'Officer Performance', path: '/collection/officer-performance' },
  { id: 13, title: 'Reports', path: '/reports' },
  { id: 14, title: 'Analytics', path: '/analytics' },
  { id: 15, title: 'Settings', path: '/settings' }
];

// Basic navigation item component
function NavItem({ item, onClose }) {
  const handleClick = () => {
    console.log('Navigation clicked:', item.title);
    window.location.href = item.path;
    onClose();
  };

  return (
    <div 
      onClick={handleClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        padding: '12px 16px',
        margin: '4px 8px',
        borderRadius: '8px',
        backgroundColor: '#f3f4f6',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151'
      }}
      onMouseEnter={(e) => {
        e.target.style.backgroundColor = '#e5e7eb';
      }}
      onMouseLeave={(e) => {
        e.target.style.backgroundColor = '#f3f4f6';
      }}
    >
      <span style={{ 
        width: '8px', 
        height: '8px', 
        backgroundColor: '#3b82f6', 
        borderRadius: '50%', 
        marginRight: '12px' 
      }} />
      {item.title}
    </div>
  );
}

// Main basic mobile sidebar
export function BasicMobileSidebar({ isOpen, onClose }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return (
    <div>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 999,
          display: isOpen ? 'block' : 'none'
        }}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          width: '280px',
          maxWidth: '85vw',
          backgroundColor: 'white',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '4px 0 20px rgba(0, 0, 0, 0.15)'
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px',
          borderBottom: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#3b82f6',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white',
              fontWeight: 'bold',
              fontSize: '18px'
            }}>
              K
            </div>
            <div>
              <div style={{ 
                fontSize: '18px', 
                fontWeight: 'bold', 
                color: '#1f2937' 
              }}>
                Konan Pro
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                v2.0.0
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: '32px',
              height: '32px',
              border: 'none',
              backgroundColor: '#f3f4f6',
              borderRadius: '6px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '18px',
              color: '#6b7280'
            }}
          >
            ×
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '16px', borderBottom: '1px solid #e5e7eb' }}>
          <input
            type="text"
            placeholder="Search navigation..."
            style={{
              width: '100%',
              padding: '8px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              backgroundColor: 'white'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#3b82f6';
              e.target.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#d1d5db';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>

        {/* Navigation */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 0',
          backgroundColor: 'white'
        }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            marginBottom: '8px',
            paddingLeft: '16px'
          }}>
            Navigation
          </div>
          
          {NAVIGATION.map((item) => (
            <NavItem key={item.id} item={item} onClose={onClose} />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px',
          borderTop: '1px solid #e5e7eb',
          backgroundColor: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px',
            backgroundColor: '#f9fafb',
            borderRadius: '8px'
          }}>
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
            <div>
              <div style={{ 
                fontSize: '14px', 
                fontWeight: '500', 
                color: '#1f2937' 
              }}>
                John Doe
              </div>
              <div style={{ 
                fontSize: '12px', 
                color: '#6b7280' 
              }}>
                Administrator
              </div>
            </div>
          </div>
          
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            marginTop: '12px',
            padding: '8px 12px',
            backgroundColor: '#dcfce7',
            borderRadius: '6px'
          }}>
            <div style={{
              width: '8px',
              height: '8px',
              backgroundColor: '#16a34a',
              borderRadius: '50%'
            }} />
            <span style={{
              fontSize: '12px',
              color: '#166534',
              fontWeight: '500'
            }}>
              System Online
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}