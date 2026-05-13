import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import i18n from '../i18n/config';

const LANGUAGE_STORAGE_KEY = 'cybershield-language';
const LanguageContext = createContext(null);

const getStoredLanguage = () => {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
};

const getBrowserLanguage = () => {
  if (typeof navigator === 'undefined') return 'en';
  const code = navigator.language?.toLowerCase();
  return code?.startsWith('hi') ? 'hi' : code?.startsWith('ar') ? 'ar' : code?.startsWith('zh') ? 'zh' : code?.startsWith('es') ? 'es' : code?.startsWith('fr') ? 'fr' : code?.startsWith('de') ? 'de' : code?.startsWith('pt') ? 'pt' : code?.startsWith('ru') ? 'ru' : code?.startsWith('ja') ? 'ja' : 'en';
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => getStoredLanguage() || i18n.language || getBrowserLanguage());

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    if (i18n.language !== language) {
      i18n.changeLanguage(language);
    }
  }, [language]);

  useEffect(() => {
    const handleLanguageChanged = (lang) => {
      setLanguage(lang);
    };
    i18n.on('languageChanged', handleLanguageChanged);
    return () => {
      i18n.off('languageChanged', handleLanguageChanged);
    };
  }, []);

  const value = useMemo(() => ({
    language,
    isHindi: language === 'hi',
    setLanguage,
    toggleLanguage: () => setLanguage((current) => (current === 'en' ? 'hi' : 'en')),
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
