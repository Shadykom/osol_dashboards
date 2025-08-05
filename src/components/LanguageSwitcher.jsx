import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { FiGlobe } from 'react-icons/fi';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(newLang);
    
    // Update document attributes
    document.documentElement.setAttribute('lang', newLang);
    document.documentElement.setAttribute('dir', newLang === 'ar' ? 'rtl' : 'ltr');
    
    // Store preference
    localStorage.setItem('i18nextLng', newLang);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className={`flex items-center ${isRTL ? 'space-x-reverse space-x-2' : 'space-x-2'} px-4 py-2 rounded-xl bg-white/80 backdrop-blur-sm border border-osoul-gray-200 hover:border-osoul-primary transition-all ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <FiGlobe className="text-osoul-primary flex-shrink-0" size={18} />
      <span className="font-medium text-osoul-dark">
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </span>
    </motion.button>
  );
};

export default LanguageSwitcher;