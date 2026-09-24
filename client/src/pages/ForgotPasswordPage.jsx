import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { formatApiError, getPasswordRequirements, isPasswordStrongEnough } from '../utils/authValidation';
import BrandLogo from '../components/common/BrandLogo';
import { KeyRound, Mail, ShieldCheck, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [identity, setIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [token, setToken] = useState(''); // Verification token from OTP check
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('REQUEST'); // REQUEST, VERIFY, RESET

  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const passwordRequirements = getPasswordRequirements(password);

  const copy = {
    title: 'RESET ACCESS',
    desc: 'Recover your account using a secure OTP',
    identity: 'Email, Phone, or Username',
    otp: '6-digit OTP Code',
    newPass: 'New Password',
    sendOtp: 'Send OTP Code',
    verify: 'Verify Code →',
    reset: 'Set New Password',
    loading: 'Processing...',
    successRequest: 'Reset code has been sent.',
    successVerify: 'OTP verified! Now set your new password.',
    successReset: 'Password reset successful! Please login.',
    failed: 'Operation failed',
    passwordNeeds: 'Use 12+ characters with uppercase, lowercase, number, and special character.',
    back: 'Back to Login',
  };

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/auth/request-password-reset', { identity });
      toast.success(copy.successRequest);
      setStep('VERIFY');
    } catch (err) {
      toast.error(formatApiError(err, copy.failed));
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-reset-otp', { identity, otp });
      setToken(res.data.resetToken);
      toast.success(copy.successVerify);
      setStep('RESET');
    } catch (err) {
      toast.error(formatApiError(err, copy.failed));
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();

    if (!isPasswordStrongEnough(password)) {
      toast.error(
        passwordRequirements
          .filter((requirement) => !requirement.met)
          .map((requirement) => requirement.label)
          .join(' • ')
      );
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      toast.success(copy.successReset);
      navigate('/login');
    } catch (err) {
      toast.error(formatApiError(err, copy.failed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient cyber glow elements */}
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
          {/* Step Progress Indicators */}
          <div className="flex items-center justify-between gap-2 mb-6 px-1">
            <div className="flex-1 flex items-center gap-2">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 'REQUEST'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                    : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                }`}
              >
                {step === 'REQUEST' ? '1' : '✓'}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">
                Identify
              </span>
            </div>

            <div className="w-6 h-[1px] bg-slate-700" />

            <div className="flex-1 flex items-center gap-2 justify-center">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 'VERIFY'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                    : step === 'RESET'
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                {step === 'RESET' ? '✓' : '2'}
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">
                Verify OTP
              </span>
            </div>

            <div className="w-6 h-[1px] bg-slate-700" />

            <div className="flex-1 flex items-center gap-2 justify-end">
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-mono font-bold transition-colors ${
                  step === 'RESET'
                    ? 'bg-cyan-500 text-slate-950 shadow-[0_0_10px_rgba(0,212,255,0.5)]'
                    : 'bg-slate-800 text-slate-500 border border-slate-700'
                }`}
              >
                3
              </div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 hidden sm:inline">
                New Pass
              </span>
            </div>
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">{copy.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{copy.desc}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'REQUEST' && (
              <motion.form
                key="request"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleRequest}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-identity"
                    className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
                  >
                    {copy.identity}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Mail size={16} className="text-cyan-400/80" />
                    </div>
                    <input
                      id="forgot-identity"
                      type="text"
                      value={identity}
                      onChange={(e) => setIdentity(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      placeholder="operator@cybershieldx.in"
                      required
                      autoFocus
                      autoComplete="username"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{copy.loading}</span>
                    </>
                  ) : (
                    <span>{copy.sendOtp}</span>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'VERIFY' && (
              <motion.form
                key="verify"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleVerify}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-otp"
                    className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
                  >
                    {copy.otp}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <KeyRound size={16} className="text-cyan-400/80" />
                    </div>
                    <input
                      id="forgot-otp"
                      type="text"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-base font-mono text-center tracking-[0.5em] text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      placeholder="000000"
                      required
                      autoFocus
                      maxLength={6}
                      autoComplete="one-time-code"
                    />
                  </div>
                  <p className="mt-2 text-[11px] font-mono text-slate-400">
                    Verification code dispatched to: <span className="text-cyan-400 font-semibold">{identity}</span>
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{copy.loading}</span>
                    </>
                  ) : (
                    <span>{copy.verify}</span>
                  )}
                </button>
              </motion.form>
            )}

            {step === 'RESET' && (
              <motion.form
                key="reset"
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0, x: 15 }}
                transition={{ duration: 0.2 }}
                onSubmit={handleReset}
                className="space-y-4"
              >
                <div>
                  <label
                    htmlFor="forgot-password"
                    className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
                  >
                    {copy.newPass}
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Lock size={16} className="text-cyan-400/80" />
                    </div>
                    <input
                      id="forgot-password"
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                      placeholder="••••••••••••"
                      required
                      autoFocus
                      minLength={12}
                      autoComplete="new-password"
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

                  {password && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                      <p className="text-[11px] font-mono text-slate-400">{copy.passwordNeeds}</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {passwordRequirements.map((requirement) => (
                          <div key={requirement.label} className="flex items-center gap-1.5">
                            <span className={`text-xs ${requirement.met ? 'text-emerald-400 font-bold' : 'text-slate-600'}`}>
                              {requirement.met ? '✓' : '○'}
                            </span>
                            <span
                              className={`text-[11px] font-mono ${
                                requirement.met ? 'text-emerald-300' : 'text-slate-500'
                              }`}
                            >
                              {requirement.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
                >
                  {loading ? (
                    <>
                      <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                      <span>{copy.loading}</span>
                    </>
                  ) : (
                    <span>{copy.reset}</span>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-xs font-mono text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft size={14} />
              <span>{copy.back}</span>
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
