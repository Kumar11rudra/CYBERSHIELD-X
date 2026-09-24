import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { motion, useReducedMotion } from 'framer-motion';
import BrandLogo from '../components/common/BrandLogo';
import { formatApiError, getPasswordRequirements, isPasswordStrongEnough } from '../utils/authValidation';
import { Shield, Lock, User, Mail, Phone, Eye, EyeOff, CheckCircle2, AlertCircle, Check, X } from 'lucide-react';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
];

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

export default function SignupPage() {
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    mobileNumber: '',
    countryCode: '+91',
  });

  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnTo = searchParams.get('returnTo');
  const usernameRequestRef = useRef(0);
  const shouldReduceMotion = useReducedMotion();

  const getSafeReturnUrl = (url) => {
    if (!url) return '/dashboard';
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '/dashboard';
  };

  // Username live availability checking
  useEffect(() => {
    const value = form.username.trim().toLowerCase();
    if (!value || value.length < 3) {
      setUsernameAvailable(null);
      setUsernameSuggestions([]);
      return;
    }
    if (value.length > 30 || !/^[a-z0-9_]+$/.test(value)) {
      setUsernameAvailable(false);
      return;
    }

    const requestId = ++usernameRequestRef.current;
    const timer = setTimeout(async () => {
      setUsernameChecking(true);
      try {
        const res = await api.get(`/auth/check-username?username=${encodeURIComponent(value)}`);
        if (usernameRequestRef.current === requestId) {
          setUsernameAvailable(Boolean(res.data?.available));
          setUsernameSuggestions(res.data?.suggestions || []);
        }
      } catch (_) {
        if (usernameRequestRef.current === requestId) {
          setUsernameAvailable(null);
          setUsernameSuggestions([]);
        }
      } finally {
        if (usernameRequestRef.current === requestId) {
          setUsernameChecking(false);
        }
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [form.username]);

  const passwordRequirements = getPasswordRequirements(form.password);

  const validate = () => {
    const nextErrors = {};
    const u = form.username.trim();
    if (!u) nextErrors.username = 'Username is required';
    else if (u.length < 3) nextErrors.username = 'Username must be at least 3 characters';
    else if (u.length > 30) nextErrors.username = 'Username must be under 30 characters';
    else if (!/^[a-zA-Z0-9_]+$/.test(u)) nextErrors.username = 'Letters, numbers, and underscores only';

    const e = form.email.trim();
    if (!e) nextErrors.email = 'Email address is required';
    else if (!EMAIL_PATTERN.test(e)) nextErrors.email = 'Enter a valid email address';

    if (!form.password) nextErrors.password = 'Password is required';
    else if (!isPasswordStrongEnough(form.password)) nextErrors.password = 'Password does not meet requirements';

    if (!form.confirmPassword) nextErrors.confirmPassword = 'Confirm your password';
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = 'Passwords do not match';

    if (!termsAccepted) nextErrors.terms = 'You must accept the terms of service';

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);

    const payload = {
      username: form.username.trim(),
      email: form.email.trim(),
      password: form.password,
      fullName: form.fullName.trim() || undefined,
      mobileNumber: form.mobileNumber.trim() ? `${form.countryCode}${form.mobileNumber.trim()}` : undefined,
    };

    try {
      const res = await signup(payload);
      if (res?.emailVerificationRequired) {
        toast.success('Account created! Please verify your email.');
        navigate(`/verify-email?email=${encodeURIComponent(payload.email)}`);
      } else {
        toast.success('Account created successfully! Welcome to CyberShield X.');
        navigate(getSafeReturnUrl(returnTo));
      }
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to register account.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[650px] h-[450px] bg-cyan-500/10 rounded-full blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-lg relative z-10 my-8"
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
            <h2 className="text-xl font-bold text-white tracking-tight">Create Operator Account</h2>
            <p className="text-xs text-slate-400 mt-1">
              Join the CyberShield X security fabric to access 111 defense tools.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Username & Full Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                  Username *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <User size={15} className="text-cyan-400/80" />
                  </div>
                  <input
                    type="text"
                    value={form.username}
                    onChange={(e) => setForm({ ...form, username: e.target.value })}
                    placeholder="operator_one"
                    required
                    className="w-full pl-9 pr-8 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                  <div className="absolute inset-y-0 right-0 pr-2.5 flex items-center">
                    {usernameChecking ? (
                      <span className="w-3.5 h-3.5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                    ) : usernameAvailable === true ? (
                      <Check size={16} className="text-emerald-400" />
                    ) : usernameAvailable === false ? (
                      <X size={16} className="text-rose-400" />
                    ) : null}
                  </div>
                </div>
                {errors.username && <p className="text-[11px] text-rose-400 mt-1">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.fullName}
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })}
                  placeholder="Jane Doe"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                Email Address *
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail size={15} className="text-cyan-400/80" />
                </div>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="operator@organization.com"
                  required
                  autoComplete="email"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                />
              </div>
              {errors.email && <p className="text-[11px] text-rose-400 mt-1">{errors.email}</p>}
            </div>

            {/* Mobile Number & Country Code */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                Mobile Number (Optional)
              </label>
              <div className="flex gap-2">
                <select
                  value={form.countryCode}
                  onChange={(e) => setForm({ ...form, countryCode: e.target.value })}
                  className="bg-slate-900/80 border border-slate-700/80 rounded-xl px-2.5 py-2.5 text-xs text-white focus:outline-none focus:border-cyan-400 font-mono shrink-0"
                >
                  {COUNTRY_CODES.map((c) => (
                    <option key={`${c.country}-${c.code}`} value={c.code} className="bg-slate-900">
                      {c.flag} {c.code}
                    </option>
                  ))}
                </select>
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone size={15} className="text-cyan-400/80" />
                  </div>
                  <input
                    type="tel"
                    value={form.mobileNumber}
                    onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                    placeholder="9876543210"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400 font-mono"
                  />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                  Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} className="text-cyan-400/80" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5 font-mono uppercase tracking-wider">
                  Confirm Password *
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock size={15} className="text-cyan-400/80" />
                  </div>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={form.confirmPassword}
                    onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                    placeholder="••••••••••••"
                    required
                    autoComplete="new-password"
                    className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/80 hover:border-slate-600 focus:border-cyan-400 text-sm text-white placeholder-slate-500 transition-colors focus:outline-none focus:ring-1 focus:ring-cyan-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                    className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-200"
                  >
                    {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Password Requirements Checklist */}
            {form.password && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] font-mono space-y-1.5">
                <p className="text-slate-400 font-bold uppercase tracking-wider">Security Requirements:</p>
                <div className="grid grid-cols-2 gap-1">
                  {passwordRequirements.map((req, idx) => (
                    <div key={idx} className="flex items-center gap-1.5">
                      {req.met ? (
                        <Check size={13} className="text-emerald-400 shrink-0" />
                      ) : (
                        <X size={13} className="text-slate-500 shrink-0" />
                      )}
                      <span className={req.met ? 'text-emerald-300' : 'text-slate-500'}>{req.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {errors.password && <p className="text-[11px] text-rose-400">{errors.password}</p>}
            {errors.confirmPassword && <p className="text-[11px] text-rose-400">{errors.confirmPassword}</p>}

            {/* Terms of Service Checkbox */}
            <div className="flex items-start gap-2.5 pt-1">
              <input
                id="terms-checkbox"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-cyan-400 focus:ring-offset-slate-900 cursor-pointer"
              />
              <label htmlFor="terms-checkbox" className="text-xs text-slate-400 leading-relaxed cursor-pointer">
                I agree to the{' '}
                <Link to="/terms" className="text-cyan-400 hover:underline">
                  Terms of Service
                </Link>{' '}
                and{' '}
                <Link to="/privacy" className="text-cyan-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </label>
            </div>
            {errors.terms && <p className="text-[11px] text-rose-400">{errors.terms}</p>}

            {/* Submit Action */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] disabled:opacity-50 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-slate-900"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Creating Operator Account...</span>
                </>
              ) : (
                <span>Register & Initialize Workspace</span>
              )}
            </button>
          </form>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            <span>Already have an operator account? </span>
            <Link
              to={`/login${returnTo ? `?returnTo=${encodeURIComponent(returnTo)}` : ''}`}
              className="text-cyan-400 hover:text-cyan-300 font-semibold hover:underline underline-offset-4"
            >
              Sign In →
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
