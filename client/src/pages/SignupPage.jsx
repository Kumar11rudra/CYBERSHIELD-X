import React, { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    fullName: '',
    age: '',
    gender: '',
    country: 'India',
    mobileNumber: '',
    countryCode: '+91',
    emailOtp: '',
  });

  const [errors, setErrors] = useState({});
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState(null);
  const [emailOtpSent, setEmailOtpSent] = useState(false);
  const [emailOtpVerifying, setEmailOtpVerifying] = useState(false);
  const [emailOtpVerified, setEmailOtpVerified] = useState(false);
  const [usernameSuggestions, setUsernameSuggestions] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const { signup, googleLogin } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const usernameRequestRef = useRef(0);

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

  const handleNext = async () => {
    const newErrors = {};
    if (step === 1) {
      if (!form.username) newErrors.username = t('auth.validation.usernameRequired');
      else if (form.username.length < 3) newErrors.username = 'Minimum 3 characters';
      else if (usernameAvailable === false) newErrors.username = t('auth.validation.usernameTaken');
      
      if (!EMAIL_PATTERN.test(form.email)) newErrors.email = t('auth.validation.emailInvalid');
      if (!isPasswordStrongEnough(form.password)) newErrors.password = t('auth.validation.passwordTooWeak');
      if (form.password !== form.confirmPassword) newErrors.confirmPassword = t('auth.validation.passwordMismatch');

      if (Object.keys(newErrors).length === 0) {
        // Step 1 extra validation: Breach Check
        setLoading(true);
        try {
          const res = await api.post('/auth/password-check', { password: form.password });
          if (res.data.isPwned) {
            newErrors.password = 'This password has appeared in a data breach. Please choose a stronger password.';
            toast.error(newErrors.password);
          }
        } catch (err) {
          console.error('Breach check failed:', err);
        } finally {
          setLoading(false);
        }
      }
    } else if (step === 2) {
      if (!form.fullName.trim()) newErrors.fullName = t('auth.validation.fillProfile');
      if (!form.age || parseInt(form.age) < 10) newErrors.age = 'Minimum age 10 required';
      if (!form.gender) newErrors.gender = 'Gender is required';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    setStep(s => s + 1);
  };

  const handleSendEmailOtp = async () => {
    setEmailOtpVerifying(true);
    try {
      await api.post('/auth/request-email-otp', { email: form.email });
      setEmailOtpSent(true);
      toast.success(t('auth.validation.otpSentEmail'));
    } catch (err) {
      toast.error(formatApiError(err, 'Failed to send OTP'));
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleVerifyEmailOtp = async () => {
    setEmailOtpVerifying(true);
    try {
      const res = await api.post('/auth/verify-email-otp', { email: form.email, otp: form.emailOtp });
      setEmailOtpVerified(true);
      setForm(prev => ({ ...prev, verificationToken: res.data.verificationToken }));
      toast.success(t('auth.validation.emailVerified'));
    } catch (err) {
      toast.error(formatApiError(err, 'Invalid OTP'));
    } finally {
      setEmailOtpVerifying(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailOtpVerified) return toast.error('Please verify your email first');
    setLoading(true);
    const fullMobile = form.mobileNumber ? `${form.countryCode} ${form.mobileNumber}` : undefined;
    const finalAge = form.age ? parseInt(form.age) : undefined;
    
    try {
      await signup(form.username, form.email, form.password, fullMobile, form.verificationToken, form.fullName, finalAge, form.country, form.gender);
      toast.success('Welcome to the Nexus!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(formatApiError(err, 'Signup failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    const clientId = process.env.REACT_APP_GOOGLE_CLIENT_ID;

    if (!clientId) {
      toast.error(t('auth.validation.googleClientIdMissing') || "Google Client ID Missing");
      return;
    }

    if (!window.google || !window.google.accounts) {
      toast.error(t('auth.validation.googleSdkLoading') || "Google SDK is loading...");
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
              toast.success("Google Account Linked successfully!");
              navigate('/dashboard');
            } catch (err) {
              toast.error(t('auth.validation.googleVerifyFailed') || "Google verification failed");
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
      toast.error(t('auth.validation.googleInitFailed') || "Failed to initialize Google");
    }
  };

  return (
    <div className="flex min-h-screen bg-cyber-bg overflow-hidden relative selection:bg-cyber-green/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_#00ff8811,_transparent_70%)] pointer-events-none opacity-50" />

      {/* LEFT HEMISPHERE: Cyber Hero Graphic & Step Progress */}
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

          <div className="text-center mb-16">
            <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-white">Nexus</h1>
            <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-cyber-green">Registry</h1>
            <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] mt-4">Secure Identity Node</p>
          </div>

          <div className="space-y-8 w-full max-w-xs">
            {[ { s: 1, l: 'Identity' }, { s: 2, l: 'Profile' }, { s: 3, l: 'Verify' } ].map(i => (
              <div key={i.s} className={`flex items-center gap-6 transition-all duration-500 ${step === i.s ? 'opacity-100 translate-x-4' : 'opacity-30'}`}>
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg border-2 ${step === i.s ? 'bg-cyber-green text-black border-cyber-green shadow-[0_0_20px_rgba(0,255,136,0.5)]' : 'border-white/20 text-white'}`}>{i.s}</div>
                <div>
                  <h4 className="font-mono text-[11px] uppercase font-bold tracking-[0.2em] text-white">{i.l}</h4>
                  {step === i.s && <p className="font-mono text-[8px] text-cyber-green/60 uppercase tracking-widest mt-0.5">Active Protocol</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Decorative HUD Elements */}
        <div className="absolute bottom-10 left-10 border-l-2 border-cyber-green/40 pl-6">
          <p className="font-mono text-[10px] text-cyber-green tracking-[0.3em] mb-1 uppercase font-bold">Registration Status</p>
          <p className="font-mono text-[10px] text-cyber-muted tracking-[0.3em] uppercase">Encrypting session data...</p>
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
            <h2 className="font-display text-2xl font-bold text-white tracking-widest mt-2 uppercase">Nexus Registry</h2>
          </div>

          <div className="bg-white/[0.03] backdrop-blur-3xl border border-white/10 p-8 lg:p-12 rounded-3xl shadow-[0_20px_80px_rgba(0,0,0,0.6)] relative overflow-hidden">
            {/* Top corner accents */}
            <div className="absolute top-0 left-0 w-16 h-16 border-t border-l border-cyber-green/30 rounded-tl-3xl" />
            <div className="absolute bottom-0 right-0 w-16 h-16 border-b border-r border-cyber-green/30 rounded-br-3xl" />

            <form onSubmit={handleSubmit} className="space-y-8">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-white">{t('auth.signup.basicIdentity')}</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{t('auth.signup.username')}</label>
                        <div className="relative">
                          <input value={form.username} onChange={e => updateForm('username', e.target.value.toLowerCase())} className={`w-full bg-white/[0.03] border ${errors.username ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`} placeholder="cyber_warrior" />
                          {usernameChecking && <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />}
                        </div>
                        {usernameAvailable === false && usernameSuggestions.length > 0 && (
                          <div className="flex flex-wrap gap-2">{usernameSuggestions.map(s => <button key={s} type="button" onClick={() => updateForm('username', s)} className="px-2 py-1 bg-cyber-green/5 border border-cyber-green/20 rounded text-cyber-green font-mono text-[9px]">{s}</button>)}</div>
                        )}
                      </div>
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">{t('auth.signup.emailAddress')}</label>
                        <input type="email" value={form.email} onChange={e => updateForm('email', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="operator@nexus.io" />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Password</label>
                        <div className="relative">
                          <input type={showPassword ? "text" : "password"} value={form.password} onChange={e => updateForm('password', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors">{showPassword ? '👁️' : '🔒'}</button>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Confirm</label>
                        <div className="relative">
                          <input type={showConfirmPassword ? "text" : "password"} value={form.confirmPassword} onChange={e => updateForm('confirmPassword', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="••••••••" />
                          <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors">{showConfirmPassword ? '👁️' : '🔒'}</button>
                        </div>
                      </div>
                    </div>
                    <button type="button" onClick={handleNext} disabled={loading} className="w-full py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-50">
                      {loading && step === 1 ? 'Analyzing Protocols...' : 'Next Step'}
                    </button>

                    <div className="flex items-center gap-4 my-4">
                      <div className="flex-1 h-px bg-white/10" />
                      <span className="font-mono text-[9px] text-white/40 tracking-[0.2em] uppercase">
                        {t('common.or') || 'OR'} SIGNUP WITH
                      </span>
                      <div className="flex-1 h-px bg-white/10" />
                    </div>

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleGoogleLogin}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl border border-white/10 bg-white/5 transition-colors w-full"
                    >
                      <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                      </svg>
                      <span className="font-mono text-xs text-white/80">{t('auth.login.continueWithGoogle') || 'Continue with Google'}</span>
                    </motion.button>

                    <div className="mt-8 pt-4 border-t border-white/10 text-center relative z-10">
                      <p className="font-mono text-[10px] text-cyber-muted">
                        {t('auth.signup.alreadyMember') || 'Already a member?'}{' '}
                        <Link to="/login" className="text-cyber-green hover:underline decoration-cyber-green/50 underline-offset-4">{t('auth.signup.loginRegistry') || 'Login Registry'} →</Link>
                      </p>
                    </div>
                  </motion.div>
                )}
                {step === 2 && (
                  <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                    <h2 className="font-display text-2xl font-bold text-white">Profile Details</h2>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Full Name</label>
                        <input value={form.fullName} onChange={e => updateForm('fullName', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="e.g. John Doe" />
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Age</label>
                          <input type="number" value={form.age} onChange={e => updateForm('age', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="e.g. 24" />
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Gender</label>
                          <select value={form.gender} onChange={e => updateForm('gender', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none appearance-none text-white focus:border-cyber-green/50 transition-colors">
                            <option value="">Select</option>
                            <option value="Male" className="bg-black">Male</option>
                            <option value="Female" className="bg-black">Female</option>
                            <option value="Other" className="bg-black">Other</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Country</label>
                          <select value={form.country} onChange={e => updateForm('country', e.target.value)} className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none text-white focus:border-cyber-green/50 transition-colors">
                            {COUNTRY_CODES.sort((a,b) => a.country.localeCompare(b.country)).map(c => <option key={c.country} value={c.country} className="bg-black">{c.flag} {c.country}</option>)}
                          </select>
                        </div>
                        <div className="space-y-2">
                          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">Mobile Number</label>
                          <div className="flex gap-2">
                            <select value={form.countryCode} onChange={e => updateForm('countryCode', e.target.value)} className="w-24 bg-white/[0.03] border border-white/10 rounded-2xl px-3 py-4 font-mono text-xs outline-none text-white focus:border-cyber-green/50 transition-colors">
                              {COUNTRY_CODES.map(c => <option key={c.code} value={c.code} className="bg-black">{c.flag} {c.code}</option>)}
                            </select>
                            <input value={form.mobileNumber} onChange={e => updateForm('mobileNumber', e.target.value)} className="flex-1 bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors" placeholder="1234567890" />
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-4 pt-4">
                      <button type="button" onClick={() => setStep(1)} className="flex-1 py-5 border border-white/10 text-white font-mono text-xs uppercase rounded-2xl">Back</button>
                      <button type="button" onClick={handleNext} disabled={loading} className="flex-[2] py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl disabled:opacity-50">
                        {loading && step === 2 ? 'Updating Registry...' : 'Proceed'}
                      </button>
                    </div>
                  </motion.div>
                )}
                {step === 3 && (
                  <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                    <h2 className="font-display text-2xl font-bold text-white">Final Verification</h2>
                    <div className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl space-y-6">
                      {!emailOtpVerified && (
                        <div className="space-y-6">
                          {!emailOtpSent ? (
                            <button type="button" onClick={handleSendEmailOtp} className="w-full py-4 bg-white/5 border border-white/10 rounded-xl text-cyber-green font-mono text-[10px] font-bold uppercase tracking-widest hover:bg-cyber-green/10">Send OTP to {form.email}</button>
                          ) : (
                            <div className="space-y-4">
                              <input maxLength={6} value={form.emailOtp} onChange={e => setForm(prev => ({...prev, emailOtp: e.target.value}))} className="w-full bg-black/40 border border-cyber-green/30 rounded-2xl px-5 py-4 font-mono text-center tracking-[1em] text-cyber-green text-xl outline-none" placeholder="------" />
                              <button type="button" onClick={handleVerifyEmailOtp} className="w-full py-4 bg-cyber-green text-black font-mono font-bold uppercase tracking-widest rounded-xl">Verify Code</button>
                            </div>
                          )}
                        </div>
                      )}
                      {emailOtpVerified && <div className="text-center text-cyber-green font-mono text-sm">✓ Email Authenticated</div>}
                    </div>
                    <div className="space-y-4">
                      <label className="flex items-center gap-4 cursor-pointer">
                        <input type="checkbox" checked={termsAccepted} onChange={() => setTermsAccepted(!termsAccepted)} className="hidden" />
                        <div className={`w-5 h-5 border rounded ${termsAccepted ? 'bg-cyber-green border-cyber-green' : 'border-white/20'}`} />
                        <span className="font-mono text-[9px] text-cyber-muted uppercase">Accept Protocols</span>
                      </label>
                      <button type="submit" disabled={!emailOtpVerified || !termsAccepted || loading} className="w-full py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl disabled:opacity-20">
                        {loading ? 'Finalizing Registry...' : 'Complete Registration'}
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
