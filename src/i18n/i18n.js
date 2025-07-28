import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

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
});

// Function to change language
export const changeLanguage = async (lng) => {
  console.log('Changing language to:', lng);
  
  // Change i18n language
  await i18n.changeLanguage(lng);
  
  // Set language attribute
  document.documentElement.setAttribute('lang', lng);
  
  // Store in localStorage
  localStorage.setItem('i18nextLng', lng);
  
  console.log('Document lang set to:', document.documentElement.lang);
};

// Set initial language
const storedLang = localStorage.getItem('i18nextLng');
const currentLang = storedLang || i18n.language || 'en'; // Default to English

// Set initial language attribute
document.documentElement.setAttribute('lang', currentLang);
console.log('Initial language setup:', currentLang);

export default i18n;