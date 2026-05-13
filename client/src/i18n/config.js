import i18n from 'i18next';
import LanguageDetector from 'i18next-browser-languagedetector';
import { initReactI18next } from 'react-i18next';

// Import all translation files
import en from '../locales/en.json';
import hi from '../locales/hi.json';
import ar from '../locales/ar.json';
import es from '../locales/es.json';
import fr from '../locales/fr.json';
import de from '../locales/de.json';
import pt from '../locales/pt.json';
import ru from '../locales/ru.json';
import ja from '../locales/ja.json';
import zh from '../locales/zh.json';

/**
 * i18n Configuration
 * Production-grade internationalization setup with:
 * - Automatic language detection based on browser/localStorage
 * - RTL support for Arabic
 * - Fallback to English
 * - Namespace-based translations
 */

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  ar: { translation: ar },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  pt: { translation: pt },
  ru: { translation: ru },
  ja: { translation: ja },
  zh: { translation: zh },
};

// Define RTL languages
const rtlLanguages = ['ar'];

i18n
  // Load translation using http backend (or directly import JSON)
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Init i18next
  .init({
    resources,
    fallbackLng: 'en',
    defaultNS: 'translation',
    ns: ['translation'],
    
    // Language detection options
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
    },

    // Interpolation for variables like {{username}}
    interpolation: {
      escapeValue: false,
      formatSeparator: ',',
    },

    // React-i18next options
    react: {
      useSuspense: false, // Don't use suspense by default
      bindI18n: 'languageChanged loaded',
      bindI18nStore: 'added removed',
      transEmptyNodeValue: '',
      transSupportBasicHtmlNodes: true,
      transKeepBasicHtmlNodesFor: ['br', 'strong', 'i', 'p'],
    },

    // Disable XML name spaces
    ns: ['translation'],
    defaultNS: 'translation',

    debug: false, // Set to true for debugging
    
    missingKeyHandler: (lngs, ns, key) => {
      console.warn(`Translation missing for key: ${key} in namespace: ${ns} for languages:`, lngs);
    },
  });

/**
 * Helper function to check if RTL is needed
 */
export const isRTL = (lang) => rtlLanguages.includes(lang);

/**
 * Helper function to get document direction
 */
export const getDirection = (lang) => {
  return isRTL(lang) ? 'rtl' : 'ltr';
};

/**
 * Helper function to update document direction and lang attribute
 */
export const updateDocumentDirection = (lang) => {
  const dir = getDirection(lang);
  document.documentElement.dir = dir;
  document.documentElement.lang = lang;
  document.body.dir = dir;
  
  // Emit custom event for components to listen
  window.dispatchEvent(new CustomEvent('directionchange', { detail: { direction: dir, lang } }));
};

export default i18n;
