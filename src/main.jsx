import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n'
import App from './App.jsx'

// Clear old language setting to ensure new default is applied
// This can be removed after initial deployment
if (localStorage.getItem('i18nextLng') === 'ar' && !localStorage.getItem('languageDefaultUpdated')) {
  localStorage.removeItem('i18nextLng');
  localStorage.setItem('languageDefaultUpdated', 'true');
}

// Add global error handler
window.addEventListener('error', (event) => {
  console.error('Global error:', event.error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Error</h1>
      <p>An error occurred while loading the application:</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${event.error?.message || 'Unknown error'}</pre>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
});

window.addEventListener('unhandledrejection', (event) => {
  console.error('Unhandled promise rejection:', event.reason);
});

try {
  console.log('Starting Osol Dashboard application...');
  
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  console.log('Root element found, creating React root...');
  const root = createRoot(rootElement);
  
  console.log('Rendering App component...');
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
  
  console.log('App rendered successfully');
} catch (error) {
  console.error('Failed to start application:', error);
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: Arial, sans-serif;">
      <h1 style="color: red;">Application Startup Error</h1>
      <p>Failed to start the Osol Dashboard:</p>
      <pre style="background: #f5f5f5; padding: 10px; border-radius: 4px;">${error.message}</pre>
      <p>Please check the browser console for more details.</p>
    </div>
  `;
}

