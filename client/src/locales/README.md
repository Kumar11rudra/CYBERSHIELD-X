# 🌍 Translation Files Reference

This directory contains all 10 language translation files for CyberShield X.

---

## 📚 Language Files

| Language | File | Code | Direction | Status |
|----------|------|------|-----------|--------|
| 🇺🇸 English | `en.json` | `en` | LTR | ✅ |
| 🇮🇳 Hindi | `hi.json` | `hi` | LTR | ✅ |
| 🇸🇦 Arabic | `ar.json` | `ar` | **RTL** | ✅ |
| 🇪🇸 Spanish | `es.json` | `es` | LTR | ✅ |
| 🇫🇷 French | `fr.json` | `fr` | LTR | ✅ |
| 🇩🇪 German | `de.json` | `de` | LTR | ✅ |
| 🇵🇹 Portuguese | `pt.json` | `pt` | LTR | ✅ |
| 🇷🇺 Russian | `ru.json` | `ru` | LTR | ✅ |
| 🇯🇵 Japanese | `ja.json` | `ja` | LTR | ✅ |
| 🇨🇳 Chinese | `zh.json` | `zh` | LTR | ✅ |

---

## 📖 How to Edit Translations

### 1. **Master Reference**
Always check `en.json` first to understand the complete key structure and all available translations.

### 2. **Updating a Translation**
```json
// In any language file (e.g., hi.json):
{
  "auth": {
    "login": {
      "title": "प्रमाणीकरण",      // Edit this
      "description": "..."
    }
  }
}
```

### 3. **Testing Changes**
1. Edit the JSON file
2. Save it (VS Code auto-saves)
3. Open app in browser
4. Hot reload (Ctrl+S or just refresh)
5. Switch to that language
6. Verify changes appear

### 4. **No Syntax Errors**
- ✅ All files are valid JSON
- ✅ All keys are quoted
- ✅ All commas are correct
- ✅ Check VS Code red squiggles

---

## 🔑 Translation Key Structure

All files follow this hierarchy:

```
{
  "common": {          // Global UI elements
    "loading": "...",
    "save": "...",
    "cancel": "..."
  },
  "auth": {            // Authentication pages
    "login": {...},
    "signup": {...},
    "forgotPassword": {...}
  },
  "dashboard": {...},  // Dashboard page
  "scanner": {...},    // Scanner page
  "email": {...},      // Email triage page
  "history": {...},    // Scan history page
  "settings": {...},   // Settings page
  "admin": {...},      // Admin panel
  "errors": {...},     // Error messages
  "validation": {...}, // Form validation
  "modals": {...},     // Modal dialogs
  "components": {...}, // Reusable components
  "profile": {...},    // User profile
  "toast": {...}       // Toast notifications
}
```

---

## ✏️ Adding New Translations

When adding a new UI string to the app:

1. **Add to en.json first** (English reference)
   ```json
   "dashboard": {
     "newFeature": "New Feature Title"
   }
   ```

2. **Add to all 10 language files**
   - Use same key structure
   - Translate the English value
   - Keep JSON valid

3. **Update MIGRATION_GUIDE.md** with key reference

4. **Test in app**
   ```jsx
   {t('dashboard.newFeature')}
   ```

---

## 🌐 Language-Specific Notes

### 🇮🇳 Hindi (hi.json)
- Uses native Hindi script (Devanagari)
- LTR direction
- Example: "प्रमाणीकरण" (Praman īkaran) = Authentication

### 🇸🇦 Arabic (ar.json) - **RTL**
- Uses native Arabic script
- **RTL (right-to-left) direction** ← Important!
- Triggers automatic layout flipping
- Example: "المصادقة" (Al-musadaqa) = Authentication

### 🇪🇸 Spanish (es.json)
- European Spanish variant
- Can be customized for Latin American Spanish if needed

### 🇯🇵 Japanese (ja.json)
- Uses Hiragana, Katakana, Kanji as appropriate
- No verb tenses like English

### 🇨🇳 Chinese (zh.json)
- Simplified Chinese variant
- Can be customized for Traditional Chinese if needed

---

## 🎯 Translation Quality Guidelines

When adding/updating translations, keep these in mind:

✅ **Be Consistent**
- Use same terminology across all strings
- Match existing translation patterns

✅ **Be Concise**
- Keep text short and clear
- Avoid long complicated sentences

✅ **Be Professional**
- Use proper grammar and punctuation
- Match the app's professional tone

✅ **Be Accurate**
- Translate meaning, not just words
- Consider context of where text appears

✅ **Respect RTL** (Arabic)
- RTL handled automatically by CSS
- Just provide correct Arabic text

---

## 🔍 Validating JSON

To ensure your translations are valid:

1. **VS Code Built-in Validation**
   - Red squiggles = errors
   - Hover for error details

2. **JSON Lint**
   - Copy content to https://jsonlint.com/
   - Paste and validate

3. **Browser Console**
   - Missing keys logged: "Key not found: ..."
   - Helps catch typos

---

## 📊 Translation Statistics

```
English (en.json)       : 200+ keys
Hindi (hi.json)         : 200+ keys ✓ Translated
Arabic (ar.json)        : 200+ keys ✓ Translated (RTL)
Spanish (es.json)       : 200+ keys ✓ Translated
French (fr.json)        : 200+ keys ✓ Translated
German (de.json)        : 200+ keys ✓ Translated
Portuguese (pt.json)    : 200+ keys ✓ Translated
Russian (ru.json)       : 200+ keys ✓ Translated
Japanese (ja.json)      : 200+ keys ✓ Translated
Chinese (zh.json)       : 200+ keys ✓ Translated

Total Translations      : 2000+ across 10 languages
Coverage                : 100%
Completion              : ✅ Ready for production
```

---

## 🚀 Adding a New Language

If you need to add an 11th language:

1. **Copy en.json as template**
   ```bash
   cp en.json it.json  # Italian example
   ```

2. **Translate all values** (keep keys identical)
   ```json
   {
     "common": {
       "loading": "Caricamento...",  // Italian translation
       ...
     }
   }
   ```

3. **Update i18n/config.js**
   ```js
   import it from '../locales/it.json';
   
   resources: {
     en: { translation: en },
     hi: { translation: hi },
     ar: { translation: ar },
     // ... existing languages ...
     it: { translation: it }  // Add this
   }
   ```

4. **Update i18n/provider.jsx**
   ```js
   const getLanguageList = () => [
     // ... existing languages ...
     { code: 'it', label: 'Italiano', flag: '🇮🇹', dir: 'ltr' }
   ];
   ```

5. **Test**
   - Language should appear in switcher
   - All text should display in Italian

---

## 📝 Common Translation Keys

Here are the most frequently used keys:

### Global (common.*)
```
common.loading          : "Loading..."
common.save             : "Save"
common.cancel           : "Cancel"
common.delete           : "Delete"
common.close            : "Close"
common.yes              : "Yes"
common.no               : "No"
common.error            : "Error"
common.success          : "Success"
```

### Authentication (auth.*)
```
auth.login.title        : "AUTHENTICATE"
auth.login.description  : "Access the CyberShield X platform"
auth.login.email        : "Email Address"
auth.login.password     : "Password"
auth.login.button       : "Sign In"
auth.signup.title       : "CREATE ACCOUNT"
// ... many more
```

### Dashboard (dashboard.*)
```
dashboard.title         : "Dashboard"
dashboard.subtitle      : "Welcome back, {{username}}"
dashboard.lastScan      : "Last Scan"
dashboard.totalThreats  : "Total Threats Detected"
// ... many more
```

---

## 🛠️ Troubleshooting

### Missing Translation in UI?
1. Check if key exists in JSON file
2. Check spelling (case-sensitive!)
3. Open browser DevTools console
4. Look for: "Key not found: ..." messages

### RTL Not Flipping?
1. Select Arabic language
2. Check if `document.dir="rtl"` in DevTools
3. Inspect RTL CSS file: `styles/rtl-support.css`
4. Clear browser cache and refresh

### Language Not Saving?
1. Check browser allows localStorage
2. Open DevTools → Application → Storage → localStorage
3. Look for `i18nextLng` entry
4. Should show current language code

### JSON File Error?
1. Copy to https://jsonlint.com
2. Paste content
3. Validate for syntax errors
4. Fix any errors reported

---

## 📚 Related Files

- **i18n/config.js** - Configuration that imports these files
- **i18n/provider.jsx** - React integration that uses these files
- **i18n/README.md** - Main documentation
- **i18n/MIGRATION_GUIDE.md** - How to use in components
- **i18n/IMPLEMENTATION_GUIDE.md** - Full setup guide

---

## 🎯 Quick Reference

| Task | Location |
|------|----------|
| View English master | `en.json` |
| Edit Hindi | `hi.json` |
| Edit Arabic (RTL) | `ar.json` |
| Fix JSON errors | Check in VS Code for red squiggles |
| Test language | Switch in app language switcher |
| Add key to all languages | Edit all 10 files same key path |
| Deploy translation | Just commit JSON files to git |

---

## ✅ Checklist Before Deployment

- [ ] All 10 JSON files are valid (no VS Code errors)
- [ ] All translations match the key structure
- [ ] No hardcoded text in React components
- [ ] All components use `{t('key.name')}`
- [ ] Tested all 10 languages in app
- [ ] Tested Arabic RTL mode
- [ ] Verified language persists across refresh
- [ ] No console warnings about missing keys
- [ ] Deployed to production ✅

---

**Status:** All 10 languages ready for production ✅

