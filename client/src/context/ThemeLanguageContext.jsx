import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇺🇸', dir: 'ltr' },
  { code: 'hi', label: 'हिंदी', flag: '🇮🇳', dir: 'ltr' },
  { code: 'ar', label: 'العربية', flag: '🇸🇦', dir: 'rtl' },
  { code: 'zh', label: '中文', flag: '🇨🇳', dir: 'ltr' },
  { code: 'es', label: 'Español', flag: '🇪🇸', dir: 'ltr' },
  { code: 'fr', label: 'Français', flag: '🇫🇷', dir: 'ltr' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪', dir: 'ltr' },
  { code: 'pt', label: 'Português', flag: '🇧🇷', dir: 'ltr' },
  { code: 'ru', label: 'Русский', flag: '🇷🇺', dir: 'ltr' },
  { code: 'ja', label: '日本語', flag: '🇯🇵', dir: 'ltr' },
  { code: 'ko', label: '한국어', flag: '🇰🇷', dir: 'ltr' },
  { code: 'tr', label: 'Türkçe', flag: '🇹🇷', dir: 'ltr' },
  { code: 'it', label: 'Italiano', flag: '🇮🇹', dir: 'ltr' },
  { code: 'ur', label: 'اردو', flag: '🇵🇰', dir: 'rtl' },
  { code: 'bn', label: 'বাংলা', flag: '🇧🇩', dir: 'ltr' },
  { code: 'id', label: 'Bahasa', flag: '🇮🇩', dir: 'ltr' },
];

const TRANSLATIONS = {
  en: {
    login: 'Login', signup: 'Sign up', logout: 'Logout',
    dashboard: 'Dashboard', liveScanner: 'Live Scanner', emailDetection: 'Email Detection',
    scanHistory: 'Scan History', settings: 'Settings', admin: 'Admin',
    quickSearch: 'Quick search - IP, URL, hash, domain...',
    themDay: 'Day', themNight: 'Night', themSystem: 'System',
    scanNow: 'Scan', scanning: 'Scanning...', noThreats: 'No threats found',
    threatDetected: 'Threat detected', downloadReport: 'Download Report',
    generatingPdf: 'Generating PDF...', welcomeBack: 'Welcome back',
  },
  hi: {
    login: 'लॉगिन', signup: 'साइन अप', logout: 'लॉग आউट',
    dashboard: 'डैशबोर्ड', liveScanner: 'लाइव स्कैनर', emailDetection: 'ईमेल डिटेक्शन',
    scanHistory: 'स्कैन हिस्ट्री', settings: 'सेटिंग्स', admin: 'एडमिन',
    quickSearch: 'खोजें - IP, URL, हैश, डोमेन...',
    themDay: 'दिन', themNight: 'रात', themSystem: 'सिस्टम',
    scanNow: 'स्कैन करें', scanning: 'स्कैन हो रहा है...', noThreats: 'कोई खतरा नहीं',
    threatDetected: 'खतरा मिला', downloadReport: 'रिपोर्ट डाउनलोड',
    generatingPdf: 'PDF बन रही है...', welcomeBack: 'वापस स्वागत है',
  },
  ur: {
    login: 'لاگ ان', signup: 'سائن اپ', logout: 'لاگ آؤٹ',
    dashboard: 'ڈیش بورڈ', liveScanner: 'لائیو اسکینر', emailTriage: 'ای میل ٹرائیج',
    scanHistory: 'اسکین ہسٹری', settings: 'ترتیبات', admin: 'ایڈمن',
    quickSearch: 'تلاش کریں - IP, URL, ہیش, ڈومین...',
    themDay: 'دن', themNight: 'رات', themSystem: 'سسٹم',
    scanNow: 'اسکین', scanning: 'اسکین ہو رہا ہے...', noThreats: 'کوئی خطرہ نہیں',
    threatDetected: 'خطرہ ملا', downloadReport: 'رپورٹ ڈاؤنلوڈ',
    generatingPdf: 'PDF بن رہی ہے...', welcomeBack: 'خوش آمدید',
  },
  ar: {
    login: 'تسجيل الدخول', signup: 'إنشاء حساب', logout: 'تسجيل الخروج',
    dashboard: 'لوحة القيادة', liveScanner: 'الماسح المباشر', emailTriage: 'فرز البريد',
    scanHistory: 'سجل الفحص', settings: 'الإعدادات', admin: 'المشرف',
    quickSearch: 'بحث سريع - IP، URL، هاش، نطاق...',
    themDay: 'نهار', themNight: 'ليل', themSystem: 'تلقائي',
    scanNow: 'فحص', scanning: 'جارٍ الفحص...', noThreats: 'لا تهديدات',
    threatDetected: 'تهديد مكتشف', downloadReport: 'تحميل التقرير',
    generatingPdf: '...توليد PDF', welcomeBack: 'مرحباً بعودتك',
  },
  zh: {
    login: '登录', signup: '注册', logout: '登出', dashboard: '仪表板',
    liveScanner: '实时扫描', emailTriage: '邮件分类', scanHistory: '扫描历史',
    settings: '设置', admin: '管理员', quickSearch: '搜索 IP、URL、哈希、域名...',
    themDay: '白天', themNight: '夜间', themSystem: '系统', scanNow: '扫描',
    scanning: '扫描中...', noThreats: '未发现威胁', threatDetected: '检测到威胁',
    downloadReport: '下载报告', generatingPdf: '生成 PDF 中…', welcomeBack: '欢迎回来',
  },
  es: {
    login: 'Iniciar sesión', signup: 'Registrarse', logout: 'Cerrar sesión',
    dashboard: 'Panel', liveScanner: 'Escáner en vivo', emailTriage: 'Triaje email',
    scanHistory: 'Historial', settings: 'Ajustes', admin: 'Admin',
    quickSearch: 'Buscar IP, URL, hash, dominio...',
    themDay: 'Día', themNight: 'Noche', themSystem: 'Sistema', scanNow: 'Escanear',
    scanning: 'Escaneando...', noThreats: 'Sin amenazas', threatDetected: 'Amenaza detectada',
    downloadReport: 'Descargar informe', generatingPdf: 'Generando PDF…', welcomeBack: 'Bienvenido',
  },
  fr: {
    login: 'Connexion', signup: 'Inscription', logout: 'Déconnexion',
    dashboard: 'Tableau de bord', liveScanner: 'Scanner live', emailTriage: 'Triage email',
    scanHistory: 'Historique', settings: 'Paramètres', admin: 'Admin',
    quickSearch: 'Rechercher IP, URL, hash, domaine...',
    themDay: 'Jour', themNight: 'Nuit', themSystem: 'Système', scanNow: 'Scanner',
    scanning: 'Analyse...', noThreats: 'Aucune menace', threatDetected: 'Menace détectée',
    downloadReport: 'Télécharger rapport', generatingPdf: 'Génération PDF…', welcomeBack: 'Bienvenue',
  },
  de: {
    login: 'Anmelden', signup: 'Registrieren', logout: 'Abmelden',
    dashboard: 'Dashboard', liveScanner: 'Live-Scanner', emailTriage: 'E-Mail-Triage',
    scanHistory: 'Verlauf', settings: 'Einstellungen', admin: 'Admin',
    quickSearch: 'IP, URL, Hash, Domain suchen...',
    themDay: 'Tag', themNight: 'Nacht', themSystem: 'System', scanNow: 'Scannen',
    scanning: 'Scannt...', noThreats: 'Keine Bedrohungen', threatDetected: 'Bedrohung erkannt',
    downloadReport: 'Bericht laden', generatingPdf: 'PDF wird erstellt…', welcomeBack: 'Willkommen',
  },
};

const t = (lang, key) => {
  const map = TRANSLATIONS[lang] || TRANSLATIONS.en;
  return map[key] || TRANSLATIONS.en[key] || key;
};

const applyTheme = () => {
  // PERMANENTLY DARK — Day mode removed
  const root = document.documentElement;
  root.setAttribute('data-theme', 'dark');
  root.classList.add('dark');
  root.classList.remove('light');
};

const ThemeLanguageContext = createContext(null);

export function ThemeLanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem('csxLang') || 'en');

  useEffect(() => {
    // Always apply dark theme
    localStorage.setItem('csxTheme', 'night');
    applyTheme();
  }, []);

  useEffect(() => {
    const langObj = LANGUAGES.find((l) => l.code === lang);
    document.documentElement.setAttribute('dir', langObj?.dir || 'ltr');
    document.documentElement.setAttribute('lang', lang);
  }, [lang]);

  const setTheme = useCallback(() => {}, []); // No-op

  const setLang = useCallback((code) => {
    setLangState(code);
    localStorage.setItem('csxLang', code);
  }, []);

  const useT = useCallback((key) => t(lang, key), [lang]);

  return (
    <ThemeLanguageContext.Provider value={{ theme: 'night', setTheme, lang, setLang, useT, THEME_MODES: ['night'], LANGUAGES }}>
      {children}
    </ThemeLanguageContext.Provider>
  );
}

export const useThemeLang = () => useContext(ThemeLanguageContext);
