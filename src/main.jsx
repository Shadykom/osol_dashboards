import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n/i18n'
import App from './App.jsx'
import { initializeWalletProtection } from './utils/walletConflictResolver'

// Initialize wallet protection before anything else
initializeWalletProtection();

// Clear old language setting to ensure new default is applied
// This can be removed after initial deployment
if (localStorage.getItem('i18nextLng') === 'ar' && !localStorage.getItem('languageDefaultUpdated')) {
  localStorage.removeItem('i18nextLng');
  localStorage.setItem('languageDefaultUpdated', 'true');
}

// Add global error handler
window.addEventListener('error', (event) => {
  // Ignore extension-related errors
  if (event.error?.message?.includes('extension://') || 
      event.error?.stack?.includes('extension://') ||
      event.filename?.includes('extension://') ||
      event.error?.message?.includes('ethereum') ||
      event.error?.message?.includes('MetaMask')) {
    event.preventDefault();
    return;
  }
  
  // Show error UI for critical errors
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
  // Ignore extension-related rejections
  const reason = String(event.reason);
  if (reason.includes('extension://') || reason.includes('chrome-extension://')) {
    event.preventDefault();
    return;
  }
  
  // Silently handle unhandled rejections
});

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    throw new Error('Root element not found');
  }
  
  const root = createRoot(rootElement);
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
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

