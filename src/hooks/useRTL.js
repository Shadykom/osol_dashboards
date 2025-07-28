import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useRTL() {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(() => {
    // Check initial state from multiple sources
    const htmlLang = document.documentElement.getAttribute('lang');
    const htmlDir = document.documentElement.getAttribute('dir');
    const i18nLang = i18n.language;
    
    return htmlLang === 'ar' || htmlDir === 'rtl' || i18nLang === 'ar';
  });

  useEffect(() => {
    const applyRTL = (isRtl) => {
      console.log('useRTL: Applying RTL:', isRtl);
      
      // Apply to HTML element
      document.documentElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      document.documentElement.setAttribute('lang', isRtl ? 'ar' : 'en');
      document.documentElement.classList.toggle('rtl', isRtl);
      document.documentElement.classList.toggle('ltr', !isRtl);
      
      // Apply to body element
      document.body.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      document.body.classList.toggle('rtl', isRtl);
      document.body.classList.toggle('ltr', !isRtl);
      
      // Apply to root element if it exists
      const rootElement = document.getElementById('root');
      if (rootElement) {
        rootElement.setAttribute('dir', isRtl ? 'rtl' : 'ltr');
      }
      
      // Force a reflow to ensure styles are applied
      document.documentElement.style.display = 'none';
      document.documentElement.offsetHeight; // Trigger reflow
      document.documentElement.style.display = '';
    };

    const handleLanguageChange = (lng) => {
      const isRtl = lng === 'ar';
      setIsRTL(isRtl);
      applyRTL(isRtl);
    };

    // Set initial RTL state
    const isInitialRTL = i18n.language === 'ar';
    setIsRTL(isInitialRTL);
    applyRTL(isInitialRTL);

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return isRTL;
}