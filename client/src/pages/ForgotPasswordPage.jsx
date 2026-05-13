import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import api from '../services/api';
import { useLanguage } from '../context/LanguageContext';
import { motion, AnimatePresence } from 'framer-motion';
import { formatApiError, getPasswordRequirements, isPasswordStrongEnough } from '../utils/authValidation';

export default function ForgotPasswordPage() {
  const [identity, setIdentity] = useState('');
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(''); // Verification token from OTP check
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('REQUEST'); // REQUEST, VERIFY, RESET
  
  const { language } = useLanguage();
  const navigate = useNavigate();
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
    back: '← Back to Login',
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
      toast.error(passwordRequirements.filter((requirement) => !requirement.met).map((requirement) => requirement.label).join(' • '));
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
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyber-accent/5 via-transparent to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="cyber-card p-10 backdrop-blur-xl bg-white/[0.02] border-white/5 relative overflow-hidden">
          
          {/* Header */}
          <div className="text-center mb-10">
             <motion.div 
               animate={{ rotate: [0, 10, -10, 0] }} 
               transition={{ duration: 4, repeat: Infinity }}
               className="inline-flex items-center justify-center w-16 h-16 border border-cyber-accent/30 rounded-xl mb-6 bg-cyber-accent/5"
             >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(var(--cyber-accent-rgb))" strokeWidth="1.5">
                  <path d="M12 2a4 4 0 0 1 4 4v2h2a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V10a2 2 0 0 1 2-2h2V6a4 4 0 0 1 4-4z" />
                  <path d="M12 13v4" />
                  <circle cx="12" cy="15" r="5" strokeDasharray="2 2" />
                </svg>
             </motion.div>
             <h1 className="font-display text-2xl text-white tracking-[0.3em] font-bold uppercase">{copy.title}</h1>
             <p className="font-mono text-cyber-green text-[10px] mt-2 uppercase tracking-widest">{copy.desc}</p>
          </div>

          <AnimatePresence mode="wait">
            {step === 'REQUEST' && (
              <motion.form 
                key="request"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleRequest} 
                className="space-y-6"
              >
                <div className="relative group">
                  <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2 group-focus-within:text-cyber-accent transition-colors">
                    {copy.identity}
                  </label>
                  <input
                    type="text"
                    value={identity}
                    onChange={(e) => setIdentity(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all placeholder:text-white/10"
                    placeholder="Email / Phone / User"
                    required
                    autoComplete="username"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full cyber-button-primary py-4 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : copy.sendOtp}
                </button>
              </motion.form>
            )}

            {step === 'VERIFY' && (
              <motion.form 
                key="verify"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                onSubmit={handleVerify} 
                className="space-y-6"
              >
                <div className="relative group">
                  <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2 group-focus-within:text-cyber-green transition-colors">
                    {copy.otp}
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-4 text-white font-mono text-lg text-center tracking-[1em] focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all"
                    placeholder="000000"
                    required
                    maxLength={6}
                    autoComplete="one-time-code"
                  />
                  <p className="mt-4 font-mono text-[10px] text-cyber-muted text-center italic">
                    Sent to identity: <span className="text-cyber-green">{identity}</span>
                  </p>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-4 bg-cyber-green/20 border border-cyber-green/50 text-cyber-green hover:bg-cyber-green hover:text-black font-bold tracking-widest text-sm uppercase transition-all flex items-center justify-center gap-3"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : copy.verify}
                </button>
              </motion.form>
            )}

            {step === 'RESET' && (
              <motion.form 
                key="reset"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                onSubmit={handleReset} 
                className="space-y-6"
              >
                <div className="relative group">
                  <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-widest mb-2 group-focus-within:text-cyber-accent transition-colors">
                    {copy.newPass}
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-4 text-white font-mono text-sm focus:outline-none focus:border-cyber-accent focus:ring-1 focus:ring-cyber-accent transition-all placeholder:text-white/20"
                    placeholder="••••••••"
                    required
                    minLength={12}
                    autoComplete="new-password"
                  />
                  {password && (
                    <div className="mt-3 space-y-2">
                      <p className="font-mono text-[10px] text-cyber-muted">
                        {copy.passwordNeeds}
                      </p>
                      <div className="grid grid-cols-2 gap-2">
                        {passwordRequirements.map((requirement) => (
                          <div key={requirement.label} className="flex items-center gap-1.5">
                            <span className={`text-[10px] ${requirement.met ? 'text-cyber-green' : 'text-cyber-muted/50'}`}>
                              {requirement.met ? '✓' : '○'}
                            </span>
                            <span className={`font-mono text-[9px] ${requirement.met ? 'text-cyber-green' : 'text-cyber-muted/60'}`}>
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
                  className="w-full cyber-button-primary py-4 font-bold tracking-widest text-sm uppercase flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(var(--cyber-accent-rgb),0.3)]"
                >
                  {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : copy.reset}
                </button>
              </motion.form>
            )}
          </AnimatePresence>

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <Link to="/login" className="font-mono text-[11px] text-cyber-muted hover:text-white transition-colors tracking-widest uppercase">
              {copy.back}
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
