import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { updateDocumentDirection } from './config';

/**
 * I18nProvider - Main provider component for internationalization
 * 
 * This wraps the app and initializes i18n, handles RTL updates,
 * and provides language context to all child components.
 */
export function I18nProvider({ children }) {
  const { i18n } = useTranslation();

  useEffect(() => {
    // Update document direction on language change
    updateDocumentDirection(i18n.language);
    
    // Listen for language changes
    const handleLanguageChanged = () => {
      updateDocumentDirection(i18n.language);
    };
    
    i18n.on('languageChanged', handleLanguageChanged);
    
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, [i18n]);

  return <>{children}</>;
}

/**
 * useI18n - Custom hook to access i18n functionality
 * Returns: { t, i18n, language, setLanguage, direction, isRTL }
 */
export function useI18n() {
  const { t, i18n } = useTranslation();
  const language = i18n.language;
  const direction = document.documentElement.dir || 'ltr';
  const isRTL = direction === 'rtl';

  const setLanguage = (lang) => {
    i18n.changeLanguage(lang);
  };

  return {
    t,
    i18n,
    language,
    setLanguage,
    direction,
    isRTL,
  };
}

/**
 * createTranslationKey - Helper to safely create translation keys
 * Usage: createTranslationKey('common', 'loading') → 'common.loading'
 */
export const createTranslationKey = (namespace, key) => {
  return `${namespace}.${key}`;
};

/**
 * getLanguageList - Returns list of supported languages with metadata
 */
export const getLanguageList = () => [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'hi', label: 'हिन्दी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', label: 'Português', flag: '🇵🇹', dir: 'ltr' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'zh', label: '中文', flag: '🇨🇳', dir: 'ltr' },
];

export default I18nProvider;
