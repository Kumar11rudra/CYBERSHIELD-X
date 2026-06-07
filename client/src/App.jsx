import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import './i18n/config';
import { I18nProvider } from './i18n/provider';

// Static imports
import Layout from './components/common/Layout';
import DefenseOverlay from './components/common/DefenseOverlay';
import LoadingScreen from './components/common/LoadingScreen';
import ErrorBoundary from './components/common/ErrorBoundary';

import CookieConsentBanner from './components/common/CookieConsentBanner';

import NotificationService from './services/NotificationService';

// Lazy-loaded Pages
const HomePage         = lazy(() => import('./pages/HomePage'));
const LoginPage        = lazy(() => import('./pages/LoginPage'));
const SignupPage       = lazy(() => import('./pages/SignupPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const DashboardPage    = lazy(() => import('./pages/DashboardPage'));
const HistoryPage      = lazy(() => import('./pages/HistoryPage'));
const ScanDetailPage   = lazy(() => import('./pages/ScanDetailPage'));
const AdminPage        = lazy(() => import('./pages/AdminPage'));
const AdminLoginPage   = lazy(() => import('./pages/AdminLoginPage'));
const ScanPage         = lazy(() => import('./pages/ScanPage'));
const BreachCheckerPage    = lazy(() => import('./pages/BreachCheckerPage'));
const SettingsPage         = lazy(() => import('./pages/SettingsPage'));
const NotFoundPage         = lazy(() => import('./pages/NotFoundPage'));
const QRScannerPage        = lazy(() => import('./pages/QRScannerPage'));
const BulkScannerPage      = lazy(() => import('./pages/BulkScannerPage'));
const SharedScanPage       = lazy(() => import('./pages/SharedScanPage'));
const SecurityPosturePage  = lazy(() => import('./pages/SecurityPosturePage'));
const ApiLimitsPage        = lazy(() => import('./pages/ApiLimitsPage'));
const UpiVerifierPage      = lazy(() => import('./pages/UpiVerifierPage'));
const VaultPage            = lazy(() => import('./pages/VaultPage'));
const MembershipPage       = lazy(() => import('./pages/MembershipPage'));
// ─── Combined Pages ────────────────────────────────────────────────────────────
const MessageAnalyzerPage  = lazy(() => import('./pages/MessageAnalyzerPage'));
const WebForensicsPage     = lazy(() => import('./pages/WebForensicsPage'));
// ─── Legacy deep link components ──────────────────────────────────────────────
const IPReputationHistoryPage = lazy(() => import('./pages/IPReputationHistoryPage'));
const ToolkitPage              = lazy(() => import('./pages/ToolkitPage'));
const ToolDetailPage           = lazy(() => import('./pages/ToolDetailPage'));
const VerifyEmailPage          = lazy(() => import('./pages/VerifyEmailPage'));
const PrivacyPolicyPage        = lazy(() => import('./pages/PrivacyPolicyPage'));
const TermsOfServicePage       = lazy(() => import('./pages/TermsOfServicePage'));

// Helper Components
const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user ? children : <Navigate to="/login" />;
};

const AdminRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  return user && user.role === 'admin' ? children : <Navigate to="/nexus-admin" />;
};

const CyberSuspense = ({ children }) => (
  <Suspense fallback={<LoadingScreen />}>
    {children}
  </Suspense>
);

const AppRoutes = () => (
  <Routes>
    {/* Public Static Pages */}
    <Route path="/" element={<HomePage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/signup" element={<SignupPage />} />
    <Route path="/verify-email" element={<VerifyEmailPage />} />
    <Route path="/forgot-password" element={<ForgotPasswordPage />} />

    {/* Protected App Shell */}
    <Route path="/" element={<Layout />}>
      <Route path="dashboard" element={<PrivateRoute><DashboardPage /></PrivateRoute>} />
      <Route path="scan" element={<PrivateRoute><ScanPage /></PrivateRoute>} />
      <Route path="bulk-scan" element={<PrivateRoute><BulkScannerPage /></PrivateRoute>} />
      {/* ─── Combined Tools ─────────────────────────────────────────────── */}
      <Route path="message-analyzer" element={<PrivateRoute><MessageAnalyzerPage /></PrivateRoute>} />
      <Route path="web-forensics" element={<PrivateRoute><WebForensicsPage /></PrivateRoute>} />
      {/* ─── Standalone Tools ──────────────────────────────────────────── */}
      <Route path="upi-verifier" element={<PrivateRoute><UpiVerifierPage /></PrivateRoute>} />
      <Route path="qr-scanner" element={<PrivateRoute><QRScannerPage /></PrivateRoute>} />
      <Route path="vault" element={<VaultPage />} />
      <Route path="breach-checker" element={<BreachCheckerPage />} />
      <Route path="api-limits" element={<PrivateRoute><ApiLimitsPage /></PrivateRoute>} />
      <Route path="history" element={<PrivateRoute><HistoryPage /></PrivateRoute>} />
      <Route path="history/:id" element={<PrivateRoute><ScanDetailPage /></PrivateRoute>} />
      <Route path="shared-scan/:id" element={<SharedScanPage />} />
      <Route path="settings" element={<PrivateRoute><SettingsPage /></PrivateRoute>} />
      <Route path="membership" element={<PrivateRoute><MembershipPage /></PrivateRoute>} />
      <Route path="toolkit" element={<ToolkitPage />} />
      <Route path="privacy" element={<PrivacyPolicyPage />} />
      <Route path="terms" element={<TermsOfServicePage />} />


      {/* ─── Toolkit — all tool pages share the same Layout shell ─────── */}
      <Route path="toolkit/:toolId" element={<ToolDetailPage />} />

      {/* ─── Legacy deep-link support (redirect old bookmarks) ────────── */}
      <Route path="email-intel" element={<Navigate replace to="/message-analyzer" />} />
      <Route path="sms-analyzer" element={<Navigate replace to="/message-analyzer" />} />
      <Route path="ssl-checker" element={<Navigate replace to="/web-forensics" />} />
      <Route path="phishing-detector" element={<Navigate replace to="/web-forensics" />} />
      <Route path="hash-reputation" element={<Navigate replace to="/scan" />} />
      <Route path="ip-history" element={<PrivateRoute><IPReputationHistoryPage /></PrivateRoute>} />
    </Route>
    <Route path="/nexus-admin" element={<AdminLoginPage />} />
    <Route path="/nexus-admin/dashboard" element={<AdminRoute><AdminPage /></AdminRoute>} />
    <Route path="/security" element={<SecurityPosturePage />} />
    <Route path="*" element={<NotFoundPage />} />
  </Routes>
);

export default function App() {
  useEffect(() => {
    // Session Hard Reset for Fresh Launch
    const lastReset = localStorage.getItem('csx_last_reset');
    if (lastReset !== '2026-05-12') {
      console.warn('🔄 System Upgrade Detected: Clearing legacy sessions...');
      localStorage.clear();
      sessionStorage.clear();
      localStorage.setItem('csx_last_reset', '2026-05-12');
      window.location.reload();
    }
    
    const initializeApp = async () => { };
    initializeApp();
    NotificationService.init(); // Initialize Enterprise SOC Alerts
  }, []);

  return (
    <BrowserRouter>
      <I18nProvider>
        <LanguageProvider>
          <ThemeProvider>
            <AuthProvider>
              <div className="relative min-h-screen bg-cyber-bg text-cyber-text selection:bg-cyber-accent/30 selection:text-white">
                <DefenseOverlay />
                <ErrorBoundary>
                  <CyberSuspense>
                    <AppRoutes />
                  </CyberSuspense>
                </ErrorBoundary>
                <CookieConsentBanner />
                <Toaster position="top-right" toastOptions={{
                  style: { background: '#020814', color: '#fff', border: '1px solid rgba(0, 212, 255, 0.2)', fontSize: '12px' },
                }} />
              </div>
            </AuthProvider>
          </ThemeProvider>
        </LanguageProvider>
      </I18nProvider>
    </BrowserRouter>
  );
}
