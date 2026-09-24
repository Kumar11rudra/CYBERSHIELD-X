import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import api from '../services/api';
import BrandLogo from '../components/common/BrandLogo';
import { Shield, Lock, User, Eye, EyeOff, KeyRound, ArrowLeft } from 'lucide-react';

export default function LoginPage() {
  const [identity, setIdentity] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('creds');
  const [otp, setOtp] = useState('');
  const [otpLoad, setOtpLoad] = useState(false);

  const { login } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const isExpired = searchParams.get('expired') === '1';

  const shouldReduceMotion = useReducedMotion();

  // Inform user if redirected due to expired session
  useEffect(() => {
    if (isExpired) {
      toast.error('Your session has expired. Please sign in again.', { id: 'session-expired' });
    }
  }, [isExpired]);

  const getSafeReturnUrl = (url) => {
    if (!url) return '/dashboard';
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '/dashboard';
  };

  const doLogin = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    try {
      await login(identity, password);
      toast.success(t('auth.validation.welcomeOperator') || 'Welcome, Operator.');
      navigate(getSafeReturnUrl(returnTo));
    } catch (err) {
      const d = err.response?.data;
      if (d?.otpRequired || d?.totpRequired) {
        if (d?.otpRequired) {
          try {
            await api.post('/auth/2fa/send-otp', { email: identity });
          } catch (_) {}
          toast(t('auth.validation.emailOtpSent') || 'OTP sent to your email.', { icon: '📧' });
        } else {
          toast(t('auth.validation.authCodeRequired') || 'Authenticator code required.', { icon: '📱' });
        }
        setStep('otp');
      } else {
        const errorMsg =
          d?.code === 'AUTH_ACCOUNT_DISABLED'
            ? 'Account is suspended or locked. Please contact support.'
            : d?.code === 'AUTH_RATE_LIMITED'
            ? 'Too many login attempts. Please wait a few minutes before retrying.'
            : d?.error || t('auth.login.failed') || 'Invalid credentials.';
        toast.error(errorMsg);
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
      toast.success(t('auth.validation.verified') || 'Authentication verified.');
      navigate(getSafeReturnUrl(returnTo));
    } catch (err) {
      toast.error(err.response?.data?.error || t('auth.validation.invalidOtp') || 'Invalid verification code.');
    } finally {
      setOtpLoad(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-10 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none mb-3">
            <div className="p-2.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 shadow-[0_0_20px_rgba(0,212,255,0.2)] transition-all">
              <BrandLogo size={36} />
            </div>
            <div className="text-left">
              <span className="font-display font-black text-lg tracking-wider text-white group-hover:text-cyan-400 transition-colors block">
                CYBERSHIELD X
              </span>
              <span className="text-[10px] font-mono text-cyan-400/80 tracking-widest uppercase block">
                Security Operations Hub
              </span>
            </div>
          </Link>
        </div>

        {/* Auth Card */}
        <div className="bg-[#0c162d]/90 border border-cyan-500/25 rounded-2xl p-6 sm:p-8 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)]">
          <AnimatePresence mode="wait">
            {step === 'creds' ? (
              <motion.div
                key="creds"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="mb-6">
                  <h2 className="text-xl font-bold text-white tracking-tight">Operator Access</h2>
                  <p className="text-xs text-slate-400 mt-1">
                    Sign in to access your CyberSOC workspace and security tools.
                  </p>
                </div>

                <form onSubmit={doLogin} className="space-y-4">
                  {/* Identity Input */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                      Username / Email / Mobile
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <User size={16} className="text-cyan-400/80" />
                      </div>
                      <input
                        type="text"
                        value={identity}
                        onChange={(e) => setIdentity(e.target.value)}
                        placeholder="operator@cybershieldx.in"
                        required
                        autoFocus
                        autoComplete="username"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  {/* Password Input */}
                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-xs font-semibold text-slate-300 font-mono uppercase tracking-wider">
                        Password
                      </label>
                      <Link
                        to="/forgot-password"
                        className="text-xs text-cyan-400 hover:text-cyan-300 transition-colors font-medium hover:underline underline-offset-2"
                      >
                        Forgot password?
                      </Link>
                    </div>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Lock size={16} className="text-cyan-400/80" />
                      </div>
                      <input
                        type={showPw ? 'text' : 'password'}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••••••"
                        required
                        autoComplete="current-password"
                        className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(!showPw)}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                        className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Primary Submit Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {loading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Credentials...</span>
                      </>
                    ) : (
                      <span>Authenticate & Enter</span>
                    )}
                  </button>
                </form>

                {/* Footer Navigation */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
                  <span>Don't have an operator account? </span>
                  <Link
                    to={`/signup${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline underline-offset-4"
                  >
                    Register Account →
                  </Link>
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <div className="flex items-center gap-2 mb-4">
                  <button
                    type="button"
                    onClick={() => setStep('creds')}
                    className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Back to credentials"
                  >
                    <ArrowLeft size={18} />
                  </button>
                  <h2 className="text-lg font-bold text-white tracking-tight">Two-Factor Authentication</h2>
                </div>

                <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                  Enter the verification code sent to your registered device or generated by your authenticator app.
                </p>

                <form onSubmit={doOtp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                      6-Digit Security Code
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <KeyRound size={16} className="text-cyan-400/80" />
                      </div>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value.trim())}
                        placeholder="123456"
                        required
                        autoFocus
                        maxLength={8}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm font-mono tracking-widest text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={otpLoad || !otp}
                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                  >
                    {otpLoad ? (
                      <>
                        <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                        <span>Verifying Code...</span>
                      </>
                    ) : (
                      <span>Verify & Continue</span>
                    )}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Security Assurance Badge */}
        <div className="mt-6 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 font-mono">
            <Shield size={12} className="text-emerald-400" />
            <span>Zero-Trust RBAC Protected • TLS Encrypted</span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
