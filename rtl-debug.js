// RTL Debug Script
// Run this in the browser console to check for RTL issues

(function() {
  console.log('=== RTL Debug Report ===');
  
  // Check HTML dir attribute
  const htmlDir = document.documentElement.getAttribute('dir');
  const bodyDir = document.body.getAttribute('dir');
  console.log('HTML dir:', htmlDir);
  console.log('Body dir:', bodyDir);
  
  // Check main layout container
  const mainContainer = document.querySelector('.flex.h-screen.overflow-hidden');
  if (mainContainer) {
    const computedStyle = window.getComputedStyle(mainContainer);
    console.log('Main container flex-direction:', computedStyle.flexDirection);
    console.log('Main container classes:', mainContainer.className);
  }
  
  // Check sidebar
  const sidebar = document.querySelector('.sidebar');
  if (sidebar) {
    const computedStyle = window.getComputedStyle(sidebar);
    console.log('Sidebar order:', computedStyle.order);
    console.log('Sidebar visibility:', computedStyle.visibility);
    console.log('Sidebar opacity:', computedStyle.opacity);
    console.log('Sidebar transform:', computedStyle.transform);
    console.log('Sidebar position:', sidebar.getBoundingClientRect());
  }
  
  // Check main content
  const mainContent = document.querySelector('main');
  if (mainContent) {
    const computedStyle = window.getComputedStyle(mainContent);
    console.log('Main content order:', computedStyle.order);
  }
  
  // Check for flex containers
  const flexContainers = document.querySelectorAll('.flex:not(.flex-col):not(.flex-column)');
  console.log('Flex containers found:', flexContainers.length);
  flexContainers.forEach((container, index) => {
    if (index < 5) { // Only check first 5 to avoid clutter
      const computedStyle = window.getComputedStyle(container);
      console.log(`Flex container ${index} direction:`, computedStyle.flexDirection);
    }
  });
  
  // Check for margin/padding issues
  const mlElements = document.querySelectorAll('[class*="ml-"]');
  console.log('Elements with ml- classes:', mlElements.length);
  
  const mrElements = document.querySelectorAll('[class*="mr-"]');
  console.log('Elements with mr- classes:', mrElements.length);
  
  // Check text alignment
  const textElements = document.querySelectorAll('.text-left, .text-right');
  textElements.forEach((el, index) => {
    if (index < 3) {
      const computedStyle = window.getComputedStyle(el);
      console.log(`Text element ${index} alignment:`, computedStyle.textAlign, 'Classes:', el.className);
    }
  });
  
  // Check for CSS file loading
  const styleSheets = Array.from(document.styleSheets);
  const rtlStyleSheets = styleSheets.filter(sheet => {
    try {
      return sheet.href && sheet.href.includes('rtl');
    } catch (e) {
      return false;
    }
  });
  console.log('RTL stylesheets loaded:', rtlStyleSheets.length);
  
  console.log('=== End RTL Debug Report ===');
})();