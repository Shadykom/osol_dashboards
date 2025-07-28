import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useRTL() {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  useEffect(() => {
    const applyRTL = (isRtl) => {
      console.log('useRTL: Applying RTL:', isRtl);
      if (isRtl) {
        document.documentElement.setAttribute('dir', 'rtl');
        document.documentElement.setAttribute('lang', 'ar');
        document.body.setAttribute('dir', 'rtl');
        document.documentElement.classList.add('rtl');
        document.documentElement.classList.remove('ltr');
      } else {
        document.documentElement.setAttribute('dir', 'ltr');
        document.documentElement.setAttribute('lang', 'en');
        document.body.setAttribute('dir', 'ltr');
        document.documentElement.classList.add('ltr');
        document.documentElement.classList.remove('rtl');
      }
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