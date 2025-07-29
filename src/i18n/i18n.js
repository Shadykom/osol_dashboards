import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

// Custom number formatter to keep numbers in English format
const formatNumber = (value, lng, options = {}) => {
  // Always use English number formatting regardless of language
  const formatter = new Intl.NumberFormat('en-US', {
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 2,
    ...options
  });
  return formatter.format(value);
};

// Custom currency formatter to keep numbers in English format
const formatCurrency = (value, lng, options = {}) => {
  // Always use English number formatting for currency
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: options.currency || 'SAR',
    minimumFractionDigits: options.minimumFractionDigits || 0,
    maximumFractionDigits: options.maximumFractionDigits || 0,
    ...options
  });
  return formatter.format(value);
};

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en', // Default to English
    lng: 'en', // Force English as default
    debug: false,
    supportedLngs: ['en', 'ar'],
    
    interpolation: {
      escapeValue: false,
      format: function(value, format, lng) {
        // Handle number formatting
        if (format === 'number') {
          return formatNumber(value, lng);
        }
        // Handle currency formatting
        if (format === 'currency') {
          return formatCurrency(value, lng);
        }
        // Handle percentage formatting
        if (format === 'percent') {
          return formatNumber(value, lng, { 
            style: 'percent',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
          });
        }
        // Handle custom number formats
        if (format && format.startsWith('number:')) {
          const options = {};
          const formatOptions = format.split(':')[1];
          if (formatOptions) {
            const [minDecimals, maxDecimals] = formatOptions.split(',').map(n => parseInt(n));
            if (!isNaN(minDecimals)) options.minimumFractionDigits = minDecimals;
            if (!isNaN(maxDecimals)) options.maximumFractionDigits = maxDecimals;
          }
          return formatNumber(value, lng, options);
        }
        return value;
      }
    },
    
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
    },
    
    detection: {
      order: ['localStorage', 'cookie', 'htmlTag', 'path', 'subdomain'],
      caches: ['localStorage', 'cookie'],
      lookupLocalStorage: 'i18nextLng',
      lookupCookie: 'i18nextLng',
    },
    
    react: {
      useSuspense: false,
    },
  });

// Add language change listener
i18n.on('languageChanged', (lng) => {
  console.log('i18n languageChanged event fired:', lng);
  document.documentElement.lang = lng;
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Function to change language
export const changeLanguage = async (lng) => {
  console.log('Changing language to:', lng);
  
  // Change i18n language
  await i18n.changeLanguage(lng);
  
  // Set language attribute
  document.documentElement.setAttribute('lang', lng);
  
  // Set direction attribute
  document.documentElement.setAttribute('dir', lng === 'ar' ? 'rtl' : 'ltr');
  
  // Store in localStorage
  localStorage.setItem('i18nextLng', lng);
  
  console.log('Document lang set to:', document.documentElement.lang);
};

// Set initial language
const storedLang = localStorage.getItem('i18nextLng');
const currentLang = storedLang || i18n.language || 'en'; // Default to English

// Set initial language attribute
document.documentElement.setAttribute('lang', currentLang);
document.documentElement.setAttribute('dir', currentLang === 'ar' ? 'rtl' : 'ltr');
console.log('Initial language setup:', currentLang);

export default i18n;