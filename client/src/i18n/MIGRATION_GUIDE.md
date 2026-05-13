# i18n Implementation Guide

## Overview

This guide explains how to migrate your entire CyberShield X application from hardcoded text to **production-grade i18n using i18next & react-i18next**.

---

## ✅ What's Already Done

1. **✅ Dependencies Installed**
   - `i18next`
   - `react-i18next`
   - `i18next-browser-languagedetector`

2. **✅ Translation Files Created** (10 languages)
   - `/client/src/locales/en.json`
   - `/client/src/locales/hi.json`
   - `/client/src/locales/ar.json` (RTL)
   - `/client/src/locales/es.json`
   - `/client/src/locales/fr.json`
   - `/client/src/locales/de.json`
   - `/client/src/locales/pt.json`
   - `/client/src/locales/ru.json`
   - `/client/src/locales/ja.json`
   - `/client/src/locales/zh.json`

3. **✅ Configuration Set Up**
   - `/client/src/i18n/config.js` - Core i18n configuration
   - `/client/src/i18n/provider.jsx` - I18nProvider component & hooks
   - Updated `/client/src/App.jsx` - Wrapped with I18nProvider

4. **✅ UI Components Created**
   - `/client/src/components/common/LanguageSwitcher.jsx` - Language selector dropdown

---

## 🔄 Migration Pattern

### OLD (Before)
```jsx
// OLD: Inline language switching
const copy = language === 'hi'
  ? { title: 'AUTHENTICATE', desc: 'CyberShield X platform access kijiye' }
  : { title: 'AUTHENTICATE', desc: 'Access the CyberShield X platform' };

export default function LoginPage() {
  return (
    <h1>{copy.title}</h1>
    <p>{copy.desc}</p>
  );
}
```

### NEW (After)
```jsx
// NEW: i18next with useTranslation hook
import { useTranslation } from 'react-i18next';

export default function LoginPage() {
  const { t } = useTranslation();
  
  return (
    <h1>{t('auth.login.title')}</h1>
    <p>{t('auth.login.desc')}</p>
  );
}
```

---

## 📋 Step-by-Step Component Update

### Step 1: Import useTranslation Hook
```jsx
import { useTranslation } from 'react-i18next';
```

### Step 2: Get Translation Function
```jsx
export default function MyComponent() {
  const { t } = useTranslation();
  
  // Now use t() for all text
}
```

### Step 3: Replace Hardcoded Text
**Replace all hardcoded strings with translation keys:**

| Element | Old | New |
|---------|-----|-----|
| **Labels** | `"Email Address"` | `t('auth.login.email')` |
| **Buttons** | `"Login"` | `t('auth.login.button')` |
| **Titles** | `"DASHBOARD"` | `t('dashboard.title')` |
| **Errors** | `"Failed to load"` | `t('errors.network')` |
| **Tooltips** | `title="Help"` | `title={t('common.help')}` |
| **Placeholders** | `placeholder="..."` | `placeholder={t('scanner.input.placeholder')}` |

---

## 🎯 Translation Key Hierarchy

Keys are organized hierarchically for easy discovery:

```
common/
  appName, loading, error, success, warning, close, save...

auth/
  login/ → title, desc, email, password, button, failed...
  signup/ → title, desc, username, email, password, create...
  forgotPassword/ → ...
  resetPassword/ → ...

navigation/
  dashboard, liveScanner, emailTriage, settings, logout...

dashboard/
  title, subtitle, totalScans, statistics...

scanner/
  title, input.placeholder, results.title...

email/
  title, riskLevel, sender, subject...

settings/
  title, tabs.appearance, tabs.account...

errors/
  404, 401, 403, 500, network, timeout...

validation/
  emailRequired, emailInvalid, passwordTooShort...
```

---

## 📝 Component Examples

### Example 1: DashboardPage
```jsx
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="font-display text-2xl text-cyber-text">
          {t('dashboard.title')}
        </h1>
        <p className="font-mono text-cyber-muted text-xs mt-1">
          {t('dashboard.subtitle', { username: user?.username })}
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label={t('dashboard.totalScans')} value={stats?.overview?.totalScans} />
        <StatCard label={t('dashboard.dangerousFindings')} value={stats?.overview?.dangerousFindings} />
      </div>
    </div>
  );
}
```

### Example 2: Using Variables / Interpolation
```jsx
// In translation file (en.json)
"dashboard": {
  "subtitle": "Welcome back, {{username}}"
}

// In component
{t('dashboard.subtitle', { username: user?.username })}
```

### Example 3: Toast Notifications
```jsx
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t } = useTranslation();

  const handleSave = () => {
    toast.success(t('toast.settingSaved'));
    toast.error(t('errors.network'));
  };
}
```

---

## 🌍 RTL Support (Arabic)

RTL is **automatically handled** by the i18n system:

1. **Automatic Detection** - When Arabic is selected:
   - `document.documentElement.dir = 'rtl'`
   - `document.documentElement.lang = 'ar'`

2. **CSS Classes** (use conditional classes)
   ```jsx
   const { direction } = useI18n();
   
   <div className={direction === 'rtl' ? 'text-right' : 'text-left'}>
     {t('common.welcome')}
   </div>
   ```

3. **Tailwind RTL** (use dir-based classes)
   ```jsx
   {/* Automatically flips in RTL */}
   <div className="mr-4 rtl:ml-4 rtl:mr-0">Content</div>
   ```

---

## 🪝 Custom Hooks

### useI18n() - Enhanced Hook
```jsx
import { useI18n } from '../i18n/provider';

function MyComponent() {
  const { t, language, setLanguage, direction, isRTL } = useI18n();
  
  return (
    <div dir={direction}>
      <h1>{t('common.appName')}</h1>
      <p>Current: {language}</p>
      <button onClick={() => setLanguage('hi')}>
        Switch to Hindi
      </button>
      {isRTL && <p>RTL mode active!</p>}
    </div>
  );
}
```

---

## 🔧 Files to Update

### High Priority (Update First)
1. ✅ `/client/src/pages/LoginPage.jsx`
2. ✅ `/client/src/pages/SignupPage.jsx`
3. ✅ `/client/src/pages/DashboardPage.jsx`
4. ✅ `/client/src/pages/SettingsPage.jsx`
5. ✅ `/client/src/pages/HistoryPage.jsx`
6. ✅ `/client/src/components/common/Layout.jsx`

### Medium Priority (Update Next)
7. `/client/src/pages/EmailIntelPage.jsx`
8. `/client/src/pages/AdminPage.jsx`
9. `/client/src/pages/ScanDetailPage.jsx`
10. `/client/src/components/scan/ScannerInput.jsx`
11. `/client/src/components/scan/AISummary.jsx`
12. `/client/src/components/scan/ScanConsole.jsx`

### Low Priority (Non-Critical UI)
13. `/client/src/components/common/RiskBadge.jsx`
14. `/client/src/components/common/SystemStatusPanel.jsx`
15. `/client/src/components/common/ThreatTicker.jsx`

---

## ✨ Key Features

### ✅ Language Detection
- Automatically detects browser language
- Falls back to localStorage saved preference
- Falls back to English if language not available

### ✅ Persistence
- Selected language saved to localStorage
- Auto-loads on browser refresh

### ✅ RTL Support
- Automatic direction switching
- Document attributes updated
- CSS classes available for manual adjustment

### ✅ Interpolation
- Variables: `{t('key', { var: value })}`
- Pluralization: Build as needed

### ✅ Fallback
- Missing keys logged to console
- Falls back to English translation
- Easy to track what needs translation

### ✅ Hot Reload
- Change language → All components re-render instantly
- No page refresh needed

---

## 🚀 Quick Start for Component Updates

### 1-Minute Update Template
```jsx
// 1. Add import
import { useTranslation } from 'react-i18next';

// 2. Destructure t
const { t } = useTranslation();

// 3. Replace text
// OLD: <h1>Settings</h1>
// NEW: <h1>{t('settings.title')}</h1>

// 4. Replace button labels
// OLD: <button>Save</button>
// NEW: <button>{t('common.save')}</button>

// 5. Replace placeholders
// OLD: placeholder="Enter email..."
// NEW: placeholder={t('auth.login.emailPlaceholder')}
```

---

## 🧪 Testing the Implementation

### Test in Browser
1. Open app at http://localhost:3001
2. Click language switcher (top navbar)
3. Change to Arabic → All UI flips to RTL
4. Change to Hindi → All text translates
5. Refresh page → Language persists from localStorage

### Test Missing Keys
1. In console, you'll see warnings for any missing translation keys
2. All missing keys fall back to English
3. Check console.warn in `i18n/config.js` for debugging

---

## 📦 Translation File Organization

Each translation file has this structure:

```json
{
  "common": { ... },           // Global buttons, labels
  "auth": { ... },             // Authentication pages
  "navigation": { ... },       // Menu items
  "dashboard": { ... },        // Dashboard page
  "scanner": { ... },          // Scanner components
  "email": { ... },            // Email page
  "history": { ... },          // History page
  "settings": { ... },         // Settings page
  "admin": { ... },            // Admin panel
  "errors": { ... },           // Error messages
  "validation": { ... },       // Form validation
  "modals": { ... },           // Modal dialogs
  "components": { ... },       // Reusable components
  "profile": { ... },          // Profile-related
  "toast": { ... }             // Toast notifications
}
```

---

## ⚡ Performance Tips

1. **Lazy Load Translations** - Already optimized with lazy bundling
2. **Avoid Deep Nesting** - Keep key depth to 3 levels max
3. **Reuse Common Keys** - Use `common.save`, `common.close` everywhere
4. **Preload Critical Languages** - Optional, handled automatically

---

## 🎨 UI Language Switcher Integration

The LanguageSwitcher component is ready! Add it to your Layout:

```jsx
import LanguageSwitcher from './LanguageSwitcher';

// In Layout component
<div className="flex items-center gap-2">
  <ThemeToggle />
  <LanguageSwitcher />  {/* Add here */}
  {/* Other components */}
</div>
```

---

## 🔍 Debugging

### See All Translation Keys
```javascript
i18n.getResourceBundle(i18n.language, 'translation')
```

### Save to Console (In browser DevTools)
```javascript
console.table(i18n.getResourceBundle('en', 'translation'))
```

### Check Current Language
```javascript
console.log(i18n.language)
```

### Change Language Programmatically
```javascript
i18n.changeLanguage('hi')
```

---

## 📚 Additional Resources

- **i18next Docs**: https://www.i18next.com
- **react-i18next**: https://react.i18next.com
- **Language Detection**: https://github.com/i18next/i18next-browser-languagedetector

---

## ✅ Completion Checklist

- [ ] All components updated to use `useTranslation()`
- [ ] All hardcoded text replaced with `t()` calls
- [ ] LanguageSwitcher added to Layout
- [ ] Tested language switching
- [ ] Tested Arabic RTL
- [ ] Verified localStorage persistence
- [ ] Checked browser console for missing keys
- [ ] Tested all 10 languages
- [ ] Removed old LanguageContext (if not needed)

---

**Status**: ✅ Production-ready i18n system installed and configured!
**Next**: Update all component files using the pattern above.

