import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import BrandLogo from '../components/common/BrandLogo';
import LanguageSwitcher from '../components/common/LanguageSwitcher';
import { formatApiError, isPasswordStrongEnough } from '../utils/authValidation';

const COUNTRY_CODES = [
  { code: '+91', country: 'India', flag: '🇮🇳' },
  { code: '+1', country: 'USA', flag: '🇺🇸' },
  { code: '+1', country: 'Canada', flag: '🇨🇦' },
  { code: '+44', country: 'UK', flag: '🇬🇧' },
  { code: '+61', country: 'Australia', flag: '🇦🇺' },
  { code: '+49', country: 'Germany', flag: '🇩🇪' },
  { code: '+33', country: 'France', flag: '🇫🇷' },
  { code: '+39', country: 'Italy', flag: '🇮🇹' },
  { code: '+34', country: 'Spain', flag: '🇪🇸' },
  { code: '+31', country: 'Netherlands', flag: '🇳🇱' },
  { code: '+41', country: 'Switzerland', flag: '🇨🇭' },
  { code: '+46', country: 'Sweden', flag: '🇸🇪' },
  { code: '+47', country: 'Norway', flag: '🇳🇴' },
  { code: '+45', country: 'Denmark', flag: '🇩🇰' },
  { code: '+81', country: 'Japan', flag: '🇯🇵' },
  { code: '+86', country: 'China', flag: '🇨🇳' },
  { code: '+82', country: 'South Korea', flag: '🇰🇷' },
  { code: '+7', country: 'Russia', flag: '🇷🇺' },
  { code: '+971', country: 'UAE', flag: '🇦🇪' },
  { code: '+65', country: 'Singapore', flag: '🇸🇬' },
  { code: '+966', country: 'Saudi Arabia', flag: '🇸🇦' },
  { code: '+60', country: 'Malaysia', flag: '🇲🇾' },
  { code: '+62', country: 'Indonesia', flag: '🇮🇩' },
  { code: '+66', country: 'Thailand', flag: '🇹🇭' },
  { code: '+84', country: 'Vietnam', flag: '🇻🇳' },
  { code: '+63', country: 'Philippines', flag: '🇵🇭' },
  { code: '+92', country: 'Pakistan', flag: '🇵🇰' },
  { code: '+880', country: 'Bangladesh', flag: '🇧🇩' },
  { code: '+94', country: 'Sri Lanka', flag: '🇱🇰' },
  { code: '+977', country: 'Nepal', flag: '🇳🇵' },
  { code: '+55', country: 'Brazil', flag: '🇧🇷' },
  { code: '+54', country: 'Argentina', flag: '🇦🇷' },
  { code: '+56', country: 'Chile', flag: '🇨🇱' },
  { code: '+57', country: 'Colombia', flag: '🇨🇴' },
  { code: '+52', country: 'Mexico', flag: '🇲🇽' },
  { code: '+27', country: 'South Africa', flag: '🇿🇦' },
  { code: '+234', country: 'Nigeria', flag: '🇳🇬' },
  { code: '+20', country: 'Egypt', flag: '🇪🇬' },
  { code: '+212', country: 'Morocco', flag: '🇲🇦' },
  { code: '+254', country: 'Kenya', flag: '🇰🇪' },
  { code: '+90', country: 'Turkey', flag: '🇹🇷' },
  { code: '+48', country: 'Poland', flag: '🇵🇱' },
  { code: '+351', country: 'Portugal', flag: '🇵🇹' },
  { code: '+353', country: 'Ireland', flag: '🇮🇪' },
  { code: '+43', country: 'Austria', flag: '🇦🇹' },
  { code: '+32', country: 'Belgium', flag: '🇧🇪' },
  { code: '+30', country: 'Greece', flag: '🇬🇷' },
  { code: '+972', country: 'Israel', flag: '🇮🇱' },
  { code: '+965', country: 'Kuwait', flag: '🇰🇼' },
  { code: '+974', country: 'Qatar', flag: '🇶🇦' },
  { code: '+968', country: 'Oman', flag: '🇴🇲' },
  { code: '+962', country: 'Jordan', flag: '🇯🇴' },
  { code: '+961', country: 'Lebanon', flag: '🇱🇧' },
  { code: '+964', country: 'Iraq', flag: '🇮🇶' },
  { code: '+98', country: 'Iran', flag: '🇮🇷' },
  { code: '+64', country: 'New Zealand', flag: '🇳🇿' },
  { code: '+852', country: 'Hong Kong', flag: '🇭🇰' },
  { code: '+886', country: 'Taiwan', flag: '🇹🇼' },
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

  const getSafeReturnUrl = (url) => {
    if (!url) return '/dashboard';
    if (url.startsWith('/') && !url.startsWith('//')) {
      return url;
    }
    return '/dashboard';
  };

  // Username validation checking hook
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
    const requestId = usernameRequestRef.current + 1;
    usernameRequestRef.current = requestId;
    setUsernameChecking(true);
    const timer = setTimeout(async () => {
      try {
        const res = await api.post('/auth/check-username', { username: value });
        if (usernameRequestRef.current === requestId) {
          setUsernameAvailable(res.data.available);
          setUsernameSuggestions(res.data.suggestions || []);
        }
      } catch {
        if (usernameRequestRef.current === requestId) setUsernameAvailable(null);
      } finally {
        if (usernameRequestRef.current === requestId) setUsernameChecking(false);
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [form.username]);

  const updateForm = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!form.fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!form.username.trim()) newErrors.username = t('auth.validation.usernameRequired');
    else if (form.username.length < 3) newErrors.username = 'Minimum 3 characters';
    else if (usernameAvailable === false) newErrors.username = t('auth.validation.usernameTaken');
    
    if (!EMAIL_PATTERN.test(form.email)) newErrors.email = t('auth.validation.emailInvalid');
    if (!isPasswordStrongEnough(form.password)) newErrors.password = t('auth.validation.passwordTooWeak');
    if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('auth.validation.passwordMismatch');

    const cleanPhone = form.mobileNumber.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 7) {
      newErrors.mobileNumber = 'Invalid mobile number';
    }

    if (!termsAccepted) {
      newErrors.terms = 'You must accept the protocols and privacy policy';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setLoading(true);

    const fullMobile = `${form.countryCode}${cleanPhone}`;
    try {
      await signup(
        form.username.trim(),
        form.email.trim(),
        form.password,
        fullMobile,
        form.fullName.trim()
      );
      toast.success('Account successfully registered! Welcome to CyberShield X.');
      navigate(getSafeReturnUrl(returnTo));
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to complete registration.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-cyber-bg overflow-hidden relative selection:bg-cyber-green/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#00ff8811,_transparent_70%)] pointer-events-none opacity-50" />

      {/* LEFT HEMISPHERE: Cyber Hero Graphic */}
      <motion.div
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="hidden lg:flex w-1/2 relative bg-[#020814] flex-col items-center justify-center p-12 border-r border-cyber-green/10"
      >
        <div className="absolute inset-0 z-0 opacity-20 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMwMGZmODgiLz48L3N2Zz4=')] bg-[length:24px_24px]" />

        <div className="z-10 flex flex-col items-center">
          <motion.div
            animate={{ y: [-10, 10, -10] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="mb-12 drop-shadow-[0_0_30px_rgba(0,255,136,0.3)]"
          >
            <Link to="/" className="hover:scale-105 transition-transform block">
              <BrandLogo size={120} />
            </Link>
          </motion.div>

          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="font-mono text-[10px] font-bold px-2.5 py-0.5 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/30 tracking-wider">
                CYBERSHIELD X v33.0.0
              </span>
            </div>
            <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-white">Create</h1>
            <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-cyber-green">Account</h1>
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] mt-4">Simple & Secure Cybersecurity</p>
          </div>
        </div>

        {/* Decorative HUD Elements */}
        <div className="absolute bottom-10 left-10 border-l-2 border-cyber-green/40 pl-6">
          <p className="font-mono text-[10px] text-cyber-green tracking-[0.3em] mb-1 uppercase font-bold">Registration Status</p>
          <p className="font-mono text-[10px] text-cyber-muted tracking-[0.3em] uppercase">Secure session active</p>
        </div>
      </motion.div>

      {/* RIGHT HEMISPHERE: Form Content */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 lg:p-8 relative z-10 bg-gradient-to-l from-black/80 to-transparent">
        <div className="absolute top-8 right-8 z-20">
          <LanguageSwitcher />
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full max-w-[560px]"
        >
          {/* Mobile Header Logo */}
          <div className="text-center mb-8 lg:hidden">
            <BrandLogo size={60} />
            <div className="flex items-center justify-center gap-2 mt-2">
              <h2 className="font-display text-2xl font-bold text-white tracking-widest uppercase">Create Account</h2>
              <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded bg-cyber-green/10 text-cyber-green border border-cyber-green/30">v33.0.0</span>
            </div>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-12 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Top corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyber-green/30 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyber-green/30 rounded-br-3xl" />

            <form onSubmit={handleSignupSubmit} className="space-y-6">
              <h2 className="font-display text-2xl font-bold text-white">Create Account</h2>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Full Name</label>
                  <input value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} className={`w-full bg-white/[0.03] border ${errors.fullName ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="e.g. John Doe" />
                  {errors.fullName && <p className="text-red-500 text-xs font-mono">{errors.fullName}</p>}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{t('auth.signup.username')}</label>
                    <div className="relative">
                      <input value={form.username} onChange={e => updateForm('username', e.target.value.toLowerCase())} className={`w-full bg-white/[0.03] border ${errors.username ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="cyber_warrior" />
                      {usernameChecking && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />}
                    </div>
                    {usernameAvailable === false && usernameSuggestions.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-1">
                        {usernameSuggestions.map(s => <button key={s} type="button" onClick={() => updateForm('username', s)} className="px-2 py-1 bg-cyber-green/5 border border-cyber-green/20 rounded text-cyber-green font-mono text-[9px]">{s}</button>)}
                      </div>
                    )}
                    {errors.username && <p className="text-red-500 text-xs font-mono">{errors.username}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{t('auth.signup.emailAddress')}</label>
                    <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} className={`w-full bg-white/[0.03] border ${errors.email ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="user@example.com" />
                    {errors.email && <p className="text-red-500 text-xs font-mono">{errors.email}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Password</label>
                    <div className="relative">
                      <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateForm('password', e.target.value)} className={`w-full bg-white/[0.03] border ${errors.password ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors">{showPassword ? '👁️' : '🔒'}</button>
                    </div>
                    {errors.password && <p className="text-red-500 text-xs font-mono">{errors.password}</p>}
                  </div>
                  
                  <div className="space-y-2">
                    <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Confirm</label>
                    <div className="relative">
                      <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} className={`w-full bg-white/[0.03] border ${errors.confirmPassword ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="••••••••" />
                      <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors">{showConfirmPassword ? '👁️' : '🔒'}</button>
                    </div>
                    {errors.confirmPassword && <p className="text-red-500 text-xs font-mono">{errors.confirmPassword}</p>}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Mobile Number</label>
                  <div className="flex gap-2">
                    <select value={form.countryCode} onChange={e => updateForm('countryCode', e.target.value)} className="w-24 bg-white/[0.03] border border-white/10 rounded-2xl px-3 py-4 font-mono text-xs outline-none text-white focus:border-cyber-green/50 transition-colors">
                      {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-black">{c.flag} {c.code}</option>)}
                    </select>
                    <input value={form.mobileNumber} onChange={e => updateForm('mobileNumber', e.target.value)} className={`flex-1 bg-white/[0.03] border ${errors.mobileNumber ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="1234567890" />
                  </div>
                  {errors.mobileNumber && <p className="text-red-500 text-xs font-mono">{errors.mobileNumber}</p>}
                </div>
              </div>

              <div className="space-y-4">
                <label className="flex items-center gap-4 cursor-pointer select-none">
                  <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="hidden" />
                  <div className={`w-5 h-5 border rounded flex items-center justify-center transition-all ${termsAccepted ? 'bg-cyber-green border-cyber-green text-black font-bold' : 'border-white/20'}`}>
                    {termsAccepted && "✓"}
                  </div>
                  <span className="font-mono text-[9px] text-cyber-muted uppercase">I agree to the Terms of Service & Privacy Policy</span>
                </label>
                {errors.terms && <p className="text-red-500 text-xs font-mono">{errors.terms}</p>}
              </div>

              <button type="submit" disabled={loading} className="w-full py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-50 shadow-[0_0_20px_rgba(0,255,136,0.3)]">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>

              <div className="mt-8 pt-4 border-t border-white/10 text-center relative z-10">
                <p className="font-mono text-[10px] text-cyber-muted">
                  Already a member?{' '}
                  <Link to={`/login?returnTo=${encodeURIComponent(returnTo || '')}`} className="text-cyber-green hover:underline decoration-cyber-green/50 underline-offset-4">Sign In →</Link>
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
