import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import en from './locales/en.js';
import ta from './locales/ta.js';

// Retrieve saved language or default to English
const savedLanguage = localStorage.getItem('app_language') || 'en';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: savedLanguage,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // React already escapes values
    },
  });

// Synchronize document lang attribute on language change
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('app_language', lng);
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng;
    if (lng === 'ta') {
      document.body.classList.add('lang-tamil');
    } else {
      document.body.classList.remove('lang-tamil');
    }
  }
});

// Set initial document attributes
if (typeof document !== 'undefined') {
  document.documentElement.lang = savedLanguage;
  if (savedLanguage === 'ta') {
    document.body.classList.add('lang-tamil');
  }
}

export default i18n;
