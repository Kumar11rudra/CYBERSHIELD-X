# TODO: Fix Black Page & Complete i18n Migration

## Status: Approved by user ✅

### Breakdown from Plan:
 - [x] Step 1: Edit index.js - Remove ThemeLanguageProvider wrapper
 - [x] Step 2a: Edit Layout.jsx - Replace useThemeLang() with useTheme() + useTranslation()
 - [x] Step 2b: Update ThemeToggle in Layout.jsx to new useTheme()
 - [x] Step 2c: Replace hardcoded text in Layout.jsx with t()
 - [x] Step 3: Migrate SettingsPage.jsx to i18n
 - [x] Step 4: cd cybershield-x/client && npm start (http://localhost:3001)
 - [ ] Step 5: Test language switching & RTL (Arabic)
 - [x] Step 6: Migrate remaining high-priority components (DashboardPage, LoginPage, etc.)
