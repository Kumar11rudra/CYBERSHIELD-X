import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Security2FaSection Component
 * Handles MFA / 2FA status, OTP verification prompt, and WebAuthn hardware keys.
 */
const Security2FaSection = React.memo(({
  twoFAState,
  otpStep,
  otp,
  setOtp,
  otpLoading,
  totpSetup,
  on2FAToggle,
  onConfirm2FA,
  onRegisterBiometric,
  t,
}) => {
  return (
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
            onClick={on2FAToggle}
            disabled={otpLoading}
            aria-label={
              twoFAState
                ? t('settings.disable2FA', 'Disable 2FA')
                : t('settings.enable2FA', 'Enable 2FA')
            }
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors disabled:opacity-50 ${
              twoFAState ? 'bg-cyber-green' : 'bg-white/10'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                twoFAState ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </div>

      {/* OTP Confirm Step */}
      <AnimatePresence>
        {otpStep && (
          <motion.form
            onSubmit={onConfirm2FA}
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
                <img
                  src={totpSetup.qrCode}
                  alt="Authenticator QR code"
                  className="w-36 h-36 rounded-xl border border-cyber-accent/30 bg-white p-2"
                />
                <div className="min-w-0">
                  <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2">
                    Secret
                  </p>
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
                onChange={(e) => setOtp(e.target.value)}
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
            <span className="text-[8px] font-mono bg-cyber-accent/20 text-cyber-accent px-1.5 py-0.5 rounded uppercase border border-cyber-accent/30">
              PRO
            </span>
          </div>
          <p className="text-xs text-cyber-muted">
            {t(
              'settings.biometricDescription',
              'Use Apple TouchID, FaceID, Windows Hello, or YubiKey for passwordless security.'
            )}
          </p>
        </div>
        <button
          onClick={onRegisterBiometric}
          className="px-4 py-2 rounded-xl bg-cyber-accent/10 border border-cyber-accent/30 text-[10px] font-black text-cyber-accent uppercase tracking-widest hover:bg-cyber-accent/20 transition-all whitespace-nowrap"
        >
          {t('settings.registerDevice', 'Register Device')}
        </button>
      </div>
    </section>
  );
});

export default Security2FaSection;
