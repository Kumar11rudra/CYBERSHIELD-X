import React, { useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { motion, useReducedMotion } from 'framer-motion';
import { formatApiError, getPasswordRequirements, isPasswordStrongEnough } from '../utils/authValidation';
import BrandLogo from '../components/common/BrandLogo';
import { KeyRound, Lock, Eye, EyeOff, ArrowLeft, RotateCw } from 'lucide-react';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tokenFromUrl = useMemo(() => searchParams.get('token') || '', [searchParams]);

  const [form, setForm] = useState({
    token: tokenFromUrl,
    password: '',
    confirmPassword: '',
  });
  const [showPw, setShowPw] = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const shouldReduceMotion = useReducedMotion();

  const copy = {
    mismatch: 'Passwords do not match',
    success: 'Password reset successful',
    failed: 'Password reset failed',
    title: 'SET NEW PASSWORD',
    desc: 'Create a new password for your account',
    token: 'Reset Token',
    tokenPlaceholder: 'Paste reset token or open reset link',
    newPassword: 'New Password',
    newPlaceholder: '12+ chars with upper/lowercase, number, and symbol',
    confirm: 'Confirm Password',
    confirmPlaceholder: 'Repeat new password',
    helper: 'Reset links expire automatically for safety. If this token is expired, request a fresh one.',
    passwordNeeds: 'Use 12+ characters with uppercase, lowercase, number, and special character.',
    loading: 'Updating password...',
    submit: 'Reset Password',
    needNew: 'Need a new link?',
    again: 'Request again →',
    back: 'Back to Login',
  };

  const requirements = getPasswordRequirements(form.password);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.password !== form.confirmPassword) {
      toast.error(copy.mismatch);
      return;
    }

    if (!isPasswordStrongEnough(form.password)) {
      toast.error(
        requirements
          .filter((requirement) => !requirement.met)
          .map((requirement) => requirement.label)
          .join(' • ')
      );
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/reset-password', {
        token: form.token,
        password: form.password,
      });
      toast.success(res.data.message || copy.success);
      navigate('/login');
    } catch (err) {
      toast.error(formatApiError(err, copy.failed));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow elements */}
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
          <div className="mb-6">
            <h2 className="text-xl font-bold text-white tracking-tight">{copy.title}</h2>
            <p className="text-xs text-slate-400 mt-1">{copy.desc}</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Token Input */}
            <div>
              <label
                htmlFor="reset-token"
                className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
              >
                {copy.token}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <KeyRound size={16} className="text-cyan-400/80" />
                </div>
                <input
                  id="reset-token"
                  type="text"
                  value={form.token}
                  onChange={(e) => setForm({ ...form, token: e.target.value })}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  placeholder={copy.tokenPlaceholder}
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            {/* New Password Input */}
            <div>
              <label
                htmlFor="new-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
              >
                {copy.newPassword}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} className="text-cyan-400/80" />
                </div>
                <input
                  id="new-password"
                  type={showPw ? 'text' : 'password'}
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  placeholder={copy.newPlaceholder}
                  required
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

              {form.password && (
                <div className="mt-3 p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                  <p className="text-[11px] font-mono text-slate-400">{copy.passwordNeeds}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    {requirements.map((requirement) => (
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

            {/* Confirm Password Input */}
            <div>
              <label
                htmlFor="confirm-password"
                className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider"
              >
                {copy.confirm}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock size={16} className="text-cyan-400/80" />
                </div>
                <input
                  id="confirm-password"
                  type={showConfirmPw ? 'text' : 'password'}
                  value={form.confirmPassword}
                  onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  placeholder={copy.confirmPlaceholder}
                  required
                  minLength={12}
                  autoComplete="new-password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPw(!showConfirmPw)}
                  aria-label={showConfirmPw ? 'Hide confirm password' : 'Show confirm password'}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                >
                  {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <p className="text-[11px] font-mono text-slate-400">{copy.helper}</p>

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
                <span>{copy.submit}</span>
              )}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <Link
              to="/login"
              className="inline-flex items-center gap-2 font-mono text-slate-400 hover:text-cyan-400 transition-colors uppercase tracking-wider"
            >
              <ArrowLeft size={14} />
              <span>{copy.back}</span>
            </Link>

            <span className="font-mono text-slate-400">
              {copy.needNew}{' '}
              <Link to="/forgot-password" className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline">
                {copy.again}
              </Link>
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
