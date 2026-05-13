import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import BrandLogo from '../components/common/BrandLogo';
import LanguageSwitcher from '../components/common/LanguageSwitcher';


export default function LoginPage() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('creds');
  const [otp, setOtp] = useState('');
  const [otpLoad, setOtpLoad] = useState(false);

  const { login, googleLogin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const handleGoogleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast.error(t('auth.validation.googleClientIdMissing'), { duration: 5000 });
      return;
    }

    if (!window.google || !window.google.accounts) {
      toast.error(t('auth.validation.googleSdkLoading'));
      return;
    }

    try {
      const client = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: 'email profile openid',
        callback: async (response) => {
          if (response.access_token) {
            try {
              setLoading(true);
              await googleLogin(response.access_token);
              toast.success(t('auth.validation.googleAccessGranted'));
              navigate('/dashboard');
            } catch (err) {
              toast.error(t('auth.validation.googleVerifyFailed'));
            } finally {
              setLoading(false);
            }
          }
        },
        error_callback: (err) => {
          console.error('Google SDK Error:', err);
          toast.error('Google Auth Error: ' + err.message);
        }
      });
      client.requestAccessToken();
    } catch (err) {
      console.error('Google Init Error:', err);
      toast.error(t('auth.validation.googleInitFailed'));
    }
  };

  const doLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login(identity, password);
      toast.success(t('auth.validation.welcomeOperator'));
      navigate('/dashboard');
    } catch (err) {
      const d = err.response?.data;
      if (d?.otpRequired || d?.totpRequired) {
        if (d?.otpRequired) {
          try { await api.post('/auth/2fa/send-otp', { email: identity }); } catch (_) { }
          toast(t('auth.validation.emailOtpSent'), { icon: '📧' });
        } else {
          toast(t('auth.validation.authCodeRequired'), { icon: '📱' });
        }
        setStep('otp');
      } else {
        toast.error(d?.error || t('auth.login.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const doOtp = async (e) => {
    e.preventDefault();
    if (!otp) return;
    setOtpLoad(true);
    try {
      await login(identity, password, otp);
      toast.success(t('auth.validation.verified'));
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.validation.invalidOtp'));
    } finally {
      setOtpLoad(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-cyber-bg overflow-hidden relative">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-green/10 via-cyber-bg to-cyber-bg pointer-events-none opacity-50" />

      {/* LEFT HEMISPHERE: Cyber Hero Graphic */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative bg-[#020814] flex-col items-center justify-center p-12 border-r border-cyber-green/10"
      >
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMGZmODgiLz48L3N2Zz4=')] bg-[length:24px_24px]" />

        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="z-10 relative drop-shadow-[0_0_40px_rgba(0,255,136,0.5)]"
        >
          <Link to="/" className="hover:scale-105 transition-transform block">
            <BrandLogo size={180} />
          </Link>
        </motion.div>

        <div className="z-10 mt-16 text-center max-w-lg">
          <h2 className="font-display text-4xl font-bold text-white tracking-widest mb-6 uppercase">
            SECURE <br /><span className="text-cyber-green">ACCESS</span>
          </h2>
          <p className="font-mono text-sm text-cyber-muted leading-relaxed">
            {t('auth.login.desc')}
          </p>
        </div>

        {/* Decorative HUD Elements */}
        <div className="absolute bottom-8 left-8 border-l border-cyber-green/40 pl-4">
          <p className="font-mono text-[10px] text-cyber-green tracking-[0.3em] mb-1">NETWORK: SECURE</p>
          <p className="font-mono text-[10px] text-cyber-muted tracking-[0.3em] uppercase">Auth channels open</p>
        </div>
      </motion.div>

      {/* RIGHT HEMISPHERE: Glassmorphism Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10 bg-gradient-to-l from-black/80 to-transparent w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="w-full max-w-[440px] relative mt-[var(--safe-top)] mb-[var(--safe-bottom)]"
        >
          {/* Mobile Header Logo */}
          <div className="text-center mb-6 lg:hidden">
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }} className="inline-flex justify-center mb-2">
              <BrandLogo size={50} />
            </motion.div>
            <h1 className="font-display text-xl font-bold text-white tracking-widest">CYBERSHIELD X</h1>
          </div>

          <div className="absolute top-0 right-0 p-4 z-20">
            <LanguageSwitcher />
          </div>

          <div className="bg-white/[0.03] backdrop-blur-2xl border border-white/[0.08] p-6 md:p-8 rounded-2xl shadow-[0_8px_40px_rgba(0,0,0,0.6)] relative overflow-hidden">

            {/* Top corner accents */}
            <div className="absolute top-0 left-0 w-12 h-12 border-t border-l border-cyber-green/50 rounded-tl-2xl opacity-60" />
            <div className="absolute bottom-0 right-0 w-12 h-12 border-b border-r border-cyber-green/50 rounded-br-2xl opacity-60" />

            {/* Glowing background blob behind form */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-cyber-green/10 rounded-full blur-[80px] pointer-events-none" />

            <AnimatePresence mode="wait">
              {step === 'creds' && (
                <motion.div
                  key="creds"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                >
                  <div className="relative z-10 mb-6">
                    <h2 className="font-display text-xl text-white tracking-widest mb-1 font-bold">{t('auth.login.welcomeBack')}</h2>
                    <p className="font-mono text-xs text-cyber-green/80 tracking-widest uppercase">{t('auth.login.signInAccount')}</p>
                  </div>

                  <form onSubmit={doLogin} className="space-y-5 relative z-10" autoComplete="on">
                    <div className="relative group">
                      <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-[0.2em] mb-1.5 group-focus-within:text-cyber-green transition-colors">
                        {t('auth.login.emailUsernamePhone')}
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-cyber-muted group-focus-within:text-cyber-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" /></svg>
                        </div>
                        <input
                          type="text"
                          value={identity}
                          onChange={(e) => setIdentity(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all placeholder:text-white/20"
                          placeholder="operator@nexus.io"
                          required
                          autoFocus
                        />
                      </div>
                    </div>

                    <div className="relative group">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-[0.2em] group-focus-within:text-cyber-green transition-colors">
                          {t('auth.login.password')}
                        </label>
                        <Link to="/forgot-password" className="font-mono text-[10px] text-cyber-green hover:underline underline-offset-2">{t('auth.login.forgotPassword')}</Link>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="w-5 h-5 text-cyber-muted group-focus-within:text-cyber-green transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                        </div>
                        <input
                          type={showPw ? "text" : "password"}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all placeholder:text-white/20"
                          placeholder="••••••••••••"
                          required
                        />
                        <button
                          type="button"
                          onClick={() => setShowPw(!showPw)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyber-muted hover:text-white transition-colors"
                        >
                          {showPw ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={loading}
                      className="w-full py-3.5 mt-2 rounded-lg bg-transparent text-cyber-green font-bold tracking-[0.2em] uppercase text-sm border-2 border-cyber-green hover:bg-cyber-green hover:text-cyber-bg hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
                    >
                      {loading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                          {t('auth.login.authenticating')}
                        </span>
                      ) : t('auth.login.loginButton')}
                      {/* Button shine effect */}
                      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
                    </motion.button>
                  </form>

                  <div className="flex items-center gap-4 my-6">
                    <div className="flex-1 h-px bg-white/10" />
                    <span className="font-mono text-[10px] text-cyber-muted tracking-[0.2em] uppercase">
                      {t('common.or')} {t('auth.login.loginButton')} {t('common.with')}
                    </span>
                    <div className="flex-1 h-px bg-white/10" />
                  </div>

                  <div className="flex flex-col gap-4 relative z-10">
                    <motion.button
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => handleGoogleLogin()}
                      className="flex items-center justify-center gap-2 py-2.5 rounded-lg border border-white/10 bg-white/5 transition-colors w-full"
                    >
                      <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span className="font-mono text-xs text-white/80">{t('auth.login.continueWithGoogle')}</span>
                    </motion.button>
                  </div>

                  <div className="mt-8 pt-4 border-t border-white/10 text-center relative z-10 flex flex-col gap-2">
                    <p className="font-mono text-[10px] text-cyber-muted">
                      {t('auth.login.dontHaveAccount')}{' '}
                      <Link to="/signup" className="text-cyber-green hover:underline decoration-cyber-green/50 underline-offset-4">{t('auth.login.register')} →</Link>
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 'otp' && (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                  className="text-center relative z-10"
                >
                  <div className="text-4xl mb-4">🔐</div>
                  <h2 className="font-display text-xl text-white tracking-widest mb-2 font-bold uppercase">{t('auth.login.twoFactorVerify')}</h2>
                  <p className="font-mono text-xs text-cyber-muted mb-6 leading-relaxed">
                    {t('auth.login.enterOtp')} <br />
                    <strong className="text-cyber-green">{identity}</strong>
                  </p>

                  <form onSubmit={doOtp} className="space-y-4">
                    <input
                      type="text"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                      placeholder="• • • • • •"
                      autoFocus
                      required
                      className="w-full bg-black/40 border border-cyber-green/30 rounded-lg py-4 text-cyber-green font-mono text-2xl text-center tracking-[0.5em] focus:outline-none focus:border-cyber-green focus:shadow-[0_0_15px_rgba(0,255,136,0.3)] transition-all"
                    />
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      type="submit"
                      disabled={otpLoad}
                      className="w-full py-3.5 rounded-lg bg-cyber-green text-cyber-bg font-bold tracking-[0.2em] uppercase text-sm hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all duration-300 disabled:opacity-50"
                    >
                      {otpLoad ? 'Verifying...' : 'Verify & Enter'}
                    </motion.button>
                  </form>
                  <button
                    type="button"
                    onClick={() => { setStep('creds'); setOtp(''); }}
                    className="mt-6 font-mono text-[10px] text-cyber-muted hover:text-white uppercase tracking-widest transition-colors"
                  >
                    ← {t('auth.login.backToLogin')}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </motion.div>
      </div>
    </div>
  );
}
