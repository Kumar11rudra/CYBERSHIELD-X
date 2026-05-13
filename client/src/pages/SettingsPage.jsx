import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import api from '../services/api';
import { toast } from 'react-hot-toast';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

const SettingsPage = () => {
  const { user, logout, updateUser } = useAuth();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [twoFAState, setTwoFAState] = useState(user?.twoFactorEnabled || false);
  const [otpStep, setOtpStep] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [totpSetup, setTotpSetup] = useState(null);
  const [webhookUrl, setWebhookUrl] = useState(user?.webhookUrl || '');
  const [webhookSaving, setWebhookSaving] = useState(false);
  const [webhookTesting, setWebhookTesting] = useState(false);

  // New Security States
  const [sessions, setSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [passForm, setPassForm] = useState({ current: '', next: '', confirm: '' });
  const [passLoading, setPassLoading] = useState(false);

  React.useEffect(() => {
    fetchSessions();
  }, []);

  const fetchSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await api.get('/auth/sessions');
      setSessions(res.data.sessions);
    } catch {
      toast.error('Failed to sync session intelligence');
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleRevokeSession = async (deviceId) => {
    try {
      await api.post('/auth/sessions/revoke', { deviceId });
      toast.success('Node disconnected from Nexus');
      setSessions(prev => prev.filter(d => d.deviceId !== deviceId));
    } catch (err) {
      toast.error(err.response?.data?.error || 'Revocation failed');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passForm.next !== passForm.confirm) return toast.error('Security keys do not match');
    if (passForm.next.length < 8) return toast.error('Key must be at least 8 characters');

    setPassLoading(true);
    try {
      await api.post('/auth/update-password', {
        currentPassword: passForm.current,
        newPassword: passForm.next
      });
      toast.success('Security key rotated successfully');
      setPassForm({ current: '', next: '', confirm: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Key rotation failed');
    } finally {
      setPassLoading(false);
    }
  };

  const handleWebhookSave = async () => {
    setWebhookSaving(true);
    try {
      await api.patch('/auth/webhook', { webhookUrl });
      toast.success(t('settings.webhookSaved', 'Webhook URL updated successfully!'));
      updateUser({ webhookUrl });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save webhook');
    } finally {
      setWebhookSaving(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) return toast.error('Image must be under 2MB');

    const reader = new FileReader();
    reader.onloadend = async () => {
      setAvatarUploading(true);
      try {
        await api.patch('/auth/me', { avatar: reader.result });
        toast.success('Avatar updated successfully');
        updateUser({ avatar: reader.result });
      } catch (err) {
        toast.error('Failed to update avatar');
      } finally {
        setAvatarUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleWebhookTest = async () => {
    if (!webhookUrl) return toast.error('Save a webhook URL first');
    setWebhookTesting(true);
    try {
      const res = await api.patch('/auth/webhook', { webhookUrl, test: true });
      toast.success(res.data.message || 'Test ping sent!');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to send test ping');
    } finally {
      setWebhookTesting(false);
    }
  };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await api.delete('/auth/delete-account');
      toast.success(t('settings.accountDeleted', 'Account permanently deleted.'));
      logout();
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.deleteAccountFailed', 'Failed to delete account.'));
    } finally {
      setLoading(false);
      setShowDeleteModal(false);
    }
  };

  const handle2FAToggle = async () => {
    if (twoFAState) {
      setOtpLoading(true);
      try {
        await api.post('/auth/2fa/disable');
        setTwoFAState(false);
        setOtpStep(false);
        setTotpSetup(null);
        toast.success(t('settings.twoFADisabled', '🔓 2FA has been disabled.'));
      } catch (err) {
        toast.error(err.response?.data?.error || t('settings.twoFADisableFailed', '2FA disable failed.'));
      } finally {
        setOtpLoading(false);
      }
    } else {
      setOtpLoading(true);
      try {
        const res = await api.post('/auth/2fa/enable');
        setTotpSetup({ qrCode: res.data.qrCode, secret: res.data.secret });
        setOtpStep(true);
        toast.success(t('settings.scanAuthenticator', 'Scan the QR code with your authenticator app.'));
      } catch (err) {
        toast.error(err.response?.data?.error || t('settings.twoFAEnableFailed', '2FA enable failed.'));
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleConfirm2FA = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) return;
    setOtpLoading(true);
    try {
      await api.post('/auth/2fa/confirm', { otp });
      setTwoFAState(true);
      setOtpStep(false);
      setTotpSetup(null);
      setOtp('');
      toast.success(t('settings.twoFAEnabled', '🔐 2FA is now ACTIVE on your account!'));
    } catch (err) {
      toast.error(err.response?.data?.error || t('settings.otpVerifyFailed', 'OTP verification failed.'));
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-10">
        <h1 className="text-3xl font-display font-black text-white tracking-tight mb-2">
          {t('settings.title')}
        </h1>
        <p className="text-cyber-muted font-mono text-xs uppercase tracking-[.3em]">
          {t('settings.manageIdentity', 'Manage Identity & Shield Parameters')}
        </p>
      </div>

      <div className="space-y-8">

        {/* Profile Section */}
        <section className="cyber-bento-card p-8">
          <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            {t('settings.identityProfile', 'Identity Profile')}
          </h2>

          {/* Avatar Upload */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative group w-20 h-20 rounded-full overflow-hidden border-2 border-cyber-accent/30 bg-black/50">
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center font-display text-2xl font-bold text-cyber-accent">
                  {user?.username?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <label className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                <span className="text-[10px] font-mono text-white text-center">
                  {avatarUploading ? 'UPLOADING...' : 'CHANGE'}
                </span>
                <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={avatarUploading} />
              </label>
            </div>
            <div>
              <h3 className="font-bold text-white text-lg">{user?.username}</h3>
              <p className="text-xs text-cyber-muted font-mono">{user?.role?.toUpperCase()} / {user?.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
            <div>
              <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
                {t('settings.account.username')}
              </label>
              <input type="text" disabled aria-label="Username" value={user?.username} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
                {t('settings.account.email')}
              </label>
              <input type="text" disabled aria-label="Email" value={user?.email} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed" />
            </div>
            <div>
              <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
                {t('settings.mobileIdentifier', 'Mobile Identifier')}
              </label>
              {user?.mobileNumber ? (
                <PhoneInput
                  disabled
                  value={user.mobileNumber}
                  containerClass="cyber-phone-input !opacity-60"
                  inputClass="!w-full !bg-white/5 !border-white/10 !rounded-xl !px-4 !py-3 !text-xs !text-cyber-text !font-mono !h-auto"
                  buttonClass="!bg-transparent !border-white/10 !rounded-l-xl !border-r-0"
                  dropdownClass="!bg-[#0a0f18] !text-white !border-white/10"
                />
              ) : (
                <input type="text" disabled value={t('settings.notLinked', 'Not Linked')} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed" />
              )}
            </div>
            <div>
              <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">
                {t('settings.account.role')}
              </label>
              <input type="text" disabled aria-label="Role" value={user?.role?.toUpperCase() || 'USER'} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-cyber-text font-mono opacity-60 cursor-not-allowed" />
            </div>
          </div>
        </section>

        {/* 2FA Security Section */}
        <section className="cyber-bento-card p-8">
          <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            {t('settings.shieldEnhancements', 'Shield Enhancements — Authentication')}
          </h2>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 mb-4 gap-4">
            <div>
              <p className="text-sm font-bold text-white mb-1">
                {t('settings.email2FA', 'Email Two-Factor Authentication (2FA)')}
              </p>
              <p className="text-xs text-cyber-muted">
                {twoFAState
                  ? `🔐 ${t('settings.twoFAActive', 'ACTIVE — Login requires an authenticator code')}`
                  : t('settings.twoFADescription', 'Verify your identity with an authenticator app during login.')}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {twoFAState && (
                <span className="text-[9px] font-mono bg-cyber-green/10 text-cyber-green border border-cyber-green/30 px-2 py-1 rounded uppercase tracking-widest">
                  {t('settings.account.enabled')}
                </span>
              )}
              <button
                onClick={handle2FAToggle}
                disabled={otpLoading}
                aria-label={twoFAState ? t('settings.disable2FA', 'Disable 2FA') : t('settings.enable2FA', 'Enable 2FA')}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${twoFAState ? 'bg-cyber-green' : 'bg-white/10'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${twoFAState ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {/* OTP Confirm Step */}
          <AnimatePresence>
            {otpStep && (
              <motion.form
                onSubmit={handleConfirm2FA}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-cyber-accent/5 border border-cyber-accent/20 rounded-xl p-6 overflow-hidden mb-6"
              >
                <p className="font-mono text-[11px] text-cyber-accent uppercase tracking-widest mb-4">
                  » {t('settings.enterToActivate2FA', 'Enter authenticator code to activate 2FA')}
                </p>
                {totpSetup?.qrCode && (
                  <div className="mb-4 flex flex-col md:flex-row gap-4 items-start">
                    <img src={totpSetup.qrCode} alt="Authenticator QR code" className="w-36 h-36 rounded-xl border border-cyber-accent/30 bg-white p-2" />
                    <div className="min-w-0">
                      <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">Secret</p>
                      <code className="block break-all rounded-lg border border-white/10 bg-black/40 p-3 text-[11px] text-cyber-text">
                        {totpSetup.secret}
                      </code>
                    </div>
                  </div>
                )}
                <div className="flex gap-4">
                  <input
                    type="text"
                    value={otp}
                    onChange={e => setOtp(e.target.value)}
                    maxLength={6}
                    placeholder={t('settings.enterOtp', 'Enter code')}
                    className="flex-1 bg-black/40 border border-cyber-accent/30 rounded-xl px-4 py-3 font-mono text-white text-sm focus:outline-none focus:border-cyber-accent transition-all tracking-[0.4em]"
                    autoFocus
                  />
                  <button
                    type="submit"
                    disabled={otpLoading}
                    className="px-6 py-3 rounded-xl bg-cyber-accent text-cyber-bg font-black text-[11px] uppercase tracking-widest hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all disabled:opacity-50"
                  >
                    {otpLoading ? t('common.loading') : t('common.confirm')}
                  </button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Biometric / WebAuthn Section */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-sm font-bold text-white">
                  {t('settings.biometricTitle', 'Biometric / Hardware Key (WebAuthn)')}
                </p>
                <span className="text-[8px] font-mono bg-cyber-accent/20 text-cyber-accent px-1.5 py-0.5 rounded uppercase border border-cyber-accent/30">PRO</span>
              </div>
              <p className="text-xs text-cyber-muted">
                {t('settings.biometricDescription', 'Use Apple TouchID, FaceID, Windows Hello, or YubiKey for passwordless security.')}
              </p>
            </div>
            <button
              onClick={async () => {
                if (!window.PublicKeyCredential) {
                  return toast.error(t('settings.webAuthnNotSupported', 'WebAuthn is not supported by your browser.'));
                }
                try {
                  const challenge = new Uint8Array(32);
                  window.crypto.getRandomValues(challenge);
                  const cred = await navigator.credentials.create({
                    publicKey: {
                      challenge,
                      rp: { name: 'CyberShield X', id: window.location.hostname },
                      user: { id: new Uint8Array(16), name: user?.email, displayName: user?.username },
                      pubKeyCredParams: [{ alg: -7, type: 'public-key' }, { alg: -257, type: 'public-key' }],
                      authenticatorSelection: { userVerification: 'preferred' },
                      timeout: 60000,
                      attestation: 'none'
                    }
                  });
                  if (cred) toast.success(t('settings.biometricRegistered', 'Biometric Authenticator registered successfully! 🔐'));
                } catch {
                  toast.error(t('settings.biometricFailed', 'Registration cancelled or failed.'));
                }
              }}
              className="px-4 py-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent/20 transition-all whitespace-nowrap"
            >
              {t('settings.registerDevice', 'Register Device')}
            </button>
          </div>
        </section>

        {/* Webhook Integrations */}
        <section className="cyber-bento-card p-8">
          <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            {t('settings.integrations', 'External Integrations')}
          </h2>

          <div className="p-4 rounded-2xl bg-black/40 border border-white/5 space-y-4">
            <div>
              <p className="text-sm font-bold text-white mb-1">
                {t('settings.webhookAlerts', 'Webhook Threat Alerts')}
              </p>
              <p className="text-xs text-cyber-muted">
                {t('settings.webhookDescription', 'Receive real-time notifications on Discord, Slack, or custom endpoints when high-risk threats are detected.')}
              </p>
            </div>
            <div className="flex flex-col md:flex-row gap-3">
              <input
                type="text"
                placeholder="https://discord.com/api/webhooks/..."
                value={webhookUrl}
                onChange={(e) => setWebhookUrl(e.target.value)}
                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 font-mono text-xs text-white placeholder-white/20 focus:outline-none focus:border-cyber-accent transition-all"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleWebhookSave}
                  disabled={webhookSaving}
                  className="px-6 py-3 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent/20 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {webhookSaving ? t('common.saving', 'Saving...') : t('common.save', 'Save')}
                </button>
                <button
                  onClick={handleWebhookTest}
                  disabled={webhookTesting || !webhookUrl}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black text-white uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-50 whitespace-nowrap"
                >
                  {webhookTesting ? 'Ping...' : 'Test'}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* API Rate Limits Section */}
        <section className="cyber-bento-card p-8">
          <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            Intelligence Quotas
          </h2>

          <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 gap-4">
            <div>
              <p className="text-sm font-bold text-white mb-1">
                API Rate Limits
              </p>
              <p className="text-xs text-cyber-muted">
                View your daily intelligence scan limits and API usage quotas.
              </p>
            </div>
            <Link
              to="/api-limits"
              className="px-6 py-3 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent hover:text-black transition-all whitespace-nowrap"
            >
              View Dashboard →
            </Link>
          </div>
        </section>

        {/* Password Rotation Section */}
        <section className="cyber-bento-card p-8">
          <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest mb-6 border-b border-white/5 pb-4">
            Neural Key Rotation
          </h2>
          <form onSubmit={handlePasswordUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">Current Key</label>
                <input
                  type="password"
                  value={passForm.current}
                  onChange={e => setPassForm(p => ({ ...p, current: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">Next Gen Key</label>
                <input
                  type="password"
                  value={passForm.next}
                  onChange={e => setPassForm(p => ({ ...p, next: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-2">Confirm Key</label>
                <input
                  type="password"
                  value={passForm.confirm}
                  onChange={e => setPassForm(p => ({ ...p, confirm: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white font-mono focus:border-cyber-accent outline-none transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={passLoading || !passForm.current || !passForm.next}
              className="w-full py-3 bg-cyber-accent/10 border border-cyber-accent/30 rounded-xl text-cyber-accent font-mono text-[11px] font-bold uppercase tracking-[0.2em] hover:bg-cyber-accent/20 transition-all disabled:opacity-50"
            >
              {passLoading ? 'Rotating...' : 'Rotate Security Key →'}
            </button>
          </form>
        </section>

        {/* Session Intelligence Section */}
        <section className="cyber-bento-card p-8">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h2 className="text-sm font-display font-bold text-cyber-accent uppercase tracking-widest">
              Session Intelligence Monitor
            </h2>
            <span className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest">
              Active Nodes: {sessions.length}
            </span>
          </div>

          <div className="space-y-4">
            {sessionsLoading ? (
              <div className="py-8 text-center font-mono text-xs text-cyber-muted animate-pulse uppercase tracking-widest">
                Scanning for active neural links...
              </div>
            ) : sessions.map((sess, idx) => (
              <div key={idx} className="flex items-center justify-between p-4 rounded-2xl bg-black/40 border border-white/5 group hover:border-cyber-accent/30 transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-cyber-accent/5 border border-cyber-accent/20 flex items-center justify-center text-cyber-accent">
                    {sess.userAgent.includes('Mobile') ? '📱' : '💻'}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-white truncate max-w-[200px] sm:max-w-md">
                      {sess.userAgent}
                    </p>
                    <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mt-1">
                      Last Active: {new Date(sess.lastUsedAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRevokeSession(sess.deviceId)}
                  className="p-2 text-cyber-muted hover:text-cyber-red transition-colors group-hover:scale-110"
                  title="Purge Session"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M18.36 6.64a9 9 0 11-12.73 0M12 2v10" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Danger Zone */}
        <section className="cyber-bento-card p-8 border-red-500/20 bg-red-500/5">
          <h2 className="text-sm font-display font-bold text-cyber-red uppercase tracking-widest mb-6 border-b border-red-500/10 pb-4">
            {t('settings.dangerPerimeter', 'Danger Perimeter')}
          </h2>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <p className="text-sm font-bold text-white mb-1">
                {t('settings.eraseNeuralData', 'Erase All Neural Core Data')}
              </p>
              <p className="text-xs text-cyber-muted max-w-md">
                {t('settings.eraseDescription', 'This will permanently delete your account and all scan history. This action cannot be reversed.')}
              </p>
            </div>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="px-6 py-3 rounded-xl bg-red-600/20 border border-red-600/30 text-[10px] font-black text-red-500 uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-lg shadow-red-600/10"
            >
              {t('settings.terminateAccount', 'Terminate Account')}
            </button>
          </div>
        </section>

      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-full max-w-md p-8 bg-cyber-surface border border-red-500/30 rounded-3xl text-center"
          >
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-6 border border-red-500/20 text-red-500">
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
              </svg>
            </div>
            <h3 className="text-xl font-display font-black text-white mb-4 uppercase tracking-tight">
              {t('settings.confirmSelfDestruct', 'Confirm Self-Destruct?')}
            </h3>
            <p className="text-sm text-cyber-muted mb-8 leading-relaxed">
              {t('settings.selfDestructWarning', 'Entering the danger zone. All your signals, reports, and identity will be purged from the Nexus core forever.')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 py-3 rounded-xl border border-white/10 text-[10px] font-bold text-cyber-muted uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                {t('settings.abort', 'Abort')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-red-600 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-red-600/20 disabled:opacity-50"
              >
                {loading ? t('settings.purging', 'Purging...') : t('settings.executeDelete', 'Execute Delete')}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default SettingsPage;
