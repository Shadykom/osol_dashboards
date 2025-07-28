import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import HttpBackend from 'i18next-http-backend';

i18n
  .use(HttpBackend)
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'ar', // Default to Arabic
    lng: 'ar', // Force Arabic as default
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
  document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
  document.documentElement.lang = lng;
  document.body.dir = lng === 'ar' ? 'rtl' : 'ltr';
});

// Function to change language and update document direction
export const changeLanguage = async (lng) => {
  console.log('Changing language to:', lng);
  
  // Change i18n language
  await i18n.changeLanguage(lng);
  
  // Apply RTL/LTR changes
  const isRTL = lng === 'ar';
  
  // Set attributes
  document.documentElement.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', lng);
  document.body.setAttribute('dir', isRTL ? 'rtl' : 'ltr');
  
  // Set classes
  if (isRTL) {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
    document.body.classList.add('rtl');
    document.body.classList.remove('ltr');
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
    document.body.classList.add('ltr');
    document.body.classList.remove('rtl');
  }
  
  // Store in localStorage
  localStorage.setItem('i18nextLng', lng);
  
  console.log('Document dir set to:', document.documentElement.dir);
  console.log('Document lang set to:', document.documentElement.lang);
  console.log('Has RTL class:', document.documentElement.classList.contains('rtl'));
};

// Set initial direction based on detected/stored language
const storedLang = localStorage.getItem('i18nextLng');
const currentLang = storedLang || i18n.language || 'ar'; // Default to Arabic
const isInitialRTL = currentLang === 'ar';

// Function to apply initial RTL settings
const applyInitialRTL = () => {
  // Set attributes
  document.documentElement.setAttribute('dir', isInitialRTL ? 'rtl' : 'ltr');
  document.documentElement.setAttribute('lang', currentLang);
  
  if (document.body) {
    document.body.setAttribute('dir', isInitialRTL ? 'rtl' : 'ltr');
  }

  // Set classes
  if (isInitialRTL) {
    document.documentElement.classList.add('rtl');
    document.documentElement.classList.remove('ltr');
    if (document.body) {
      document.body.classList.add('rtl');
      document.body.classList.remove('ltr');
    }
  } else {
    document.documentElement.classList.add('ltr');
    document.documentElement.classList.remove('rtl');
    if (document.body) {
      document.body.classList.add('ltr');
      document.body.classList.remove('rtl');
    }
  }

  console.log('Initial language setup:', currentLang, 'dir:', document.documentElement.dir);
};

// Apply immediately for documentElement
applyInitialRTL();

// Apply again when DOM is ready for body element
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', applyInitialRTL);
} else {
  // DOM is already loaded
  applyInitialRTL();
}

export default i18n;