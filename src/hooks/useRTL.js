import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';

export function useRTL() {
  const { i18n } = useTranslation();
  const [isRTL, setIsRTL] = useState(i18n.language === 'ar');

  useEffect(() => {
    const handleLanguageChange = (lng) => {
      setIsRTL(lng === 'ar');
    };

    // Set initial RTL state
    setIsRTL(i18n.language === 'ar');

    // Listen for language changes
    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  return isRTL;
}