import React from 'react';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { Globe as FiGlobe } from 'lucide-react';
import { changeLanguage } from '@/i18n/i18n';

const LanguageSwitcher = ({ className = '' }) => {
  const { i18n } = useTranslation();
  const currentLanguage = i18n.language;
  const isRTL = currentLanguage === 'ar';

  const toggleLanguage = () => {
    const newLang = currentLanguage === 'en' ? 'ar' : 'en';
    changeLanguage(newLang);
  };

  return (
    <motion.button
      onClick={toggleLanguage}
      className={`flex items-center ${isRTL ? 'space-x-reverse space-x-1.5 sm:space-x-2' : 'space-x-1.5 sm:space-x-2'} px-3 sm:px-4 py-1.5 sm:py-2 rounded-lg sm:rounded-xl bg-white/80 backdrop-blur-sm border border-osoul-gray-200 hover:border-osoul-primary transition-all ${className}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      dir={isRTL ? 'rtl' : 'ltr'}
    >
      <FiGlobe className="text-osoul-primary flex-shrink-0 w-4 h-4 sm:w-[18px] sm:h-[18px]" />
      <span className="font-medium text-osoul-dark text-sm sm:text-base">
        {currentLanguage === 'en' ? 'العربية' : 'English'}
      </span>
    </motion.button>
  );
};

export default LanguageSwitcher;