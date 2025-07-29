import React from 'react';

const SimpleTest = () => {
  return (
    <div style={{ padding: '20px', backgroundColor: '#f0f0f0', minHeight: '100vh' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px', color: '#333' }}>
        Simple Test Page
      </h1>
      <p style={{ color: '#666' }}>
        This is a simple test page with inline styles and no external dependencies.
      </p>
      <p style={{ marginTop: '20px', color: '#666' }}>
        If you can see this content, the routing and layout system is working correctly.
      </p>
      <div style={{ marginTop: '30px', padding: '20px', backgroundColor: '#fff', borderRadius: '8px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px', color: '#333' }}>
          Debug Information:
        </h2>
        <ul style={{ listStyle: 'disc', paddingLeft: '20px', color: '#666' }}>
          <li>Current URL: {window.location.href}</li>
          <li>Pathname: {window.location.pathname}</li>
          <li>Component: SimpleTest</li>
          <li>Time: {new Date().toLocaleTimeString()}</li>
        </ul>
      </div>
    </div>
  );
};

export default SimpleTest;