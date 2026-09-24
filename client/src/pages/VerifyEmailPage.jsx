import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion, useReducedMotion } from 'framer-motion';
import BrandLogo from '../components/common/BrandLogo';
import { CheckCircle2, AlertCircle, ArrowLeft, MailCheck } from 'lucide-react';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying'); // 'verifying' | 'success' | 'error'
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    const verify = async () => {
      const email = searchParams.get('email');
      const code = searchParams.get('code');

      if (!email || !code) {
        setStatus('error');
        return;
      }

      try {
        const res = await api.post('/auth/verify-email-otp', { email, otp: code });
        const { verificationToken } = res.data;

        // Save verification data to sessionStorage so SignupPage can pick it up
        sessionStorage.setItem('csx_verified_email', email);
        sessionStorage.setItem('csx_verification_token', verificationToken);

        setStatus('success');
        toast.success('Email verified successfully!');

        // Redirect to signup after 2 seconds
        setTimeout(() => {
          navigate('/signup');
        }, 2000);
      } catch (err) {
        setStatus('error');
        toast.error('Verification failed. The link may have expired.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 flex flex-col items-center justify-center p-4 sm:p-6 relative overflow-hidden select-none">
      {/* Ambient background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[350px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        {/* Brand Header */}
        <div className="text-center mb-6">
          <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none mb-2">
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

        {/* Verification Card */}
        <div className="bg-[#0c162d]/90 border border-cyan-500/25 rounded-2xl p-7 sm:p-9 backdrop-blur-xl shadow-[0_12px_45px_rgba(0,0,0,0.6)] text-center">
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center border transition-all">
            {status === 'verifying' && (
              <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border-cyan-500/30 flex items-center justify-center">
                <span className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
              </div>
            )}
            {status === 'success' && (
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border-emerald-500/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.3)]">
                <CheckCircle2 size={32} />
              </div>
            )}
            {status === 'error' && (
              <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border-rose-500/30 flex items-center justify-center text-rose-400 shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                <AlertCircle size={32} />
              </div>
            )}
          </div>

          <h2 className="text-xl font-bold text-white tracking-tight">
            {status === 'verifying' && 'Verifying Email Address...'}
            {status === 'success' && 'Email Verified Successfully!'}
            {status === 'error' && 'Verification Link Invalid'}
          </h2>

          <p className="mt-2 text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
            {status === 'verifying' && 'Validating your verification token against CyberShield security standards.'}
            {status === 'success' && 'Your security credential has been verified. Redirecting to complete your workspace setup...'}
            {status === 'error' && 'This security verification link has expired or has already been used. Please request a new link.'}
          </p>

          {status === 'error' && (
            <div className="mt-6 pt-4 border-t border-slate-800">
              <button
                type="button"
                onClick={() => navigate('/signup')}
                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-all duration-150 shadow-[0_0_20px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                <span>Return to Registration</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
