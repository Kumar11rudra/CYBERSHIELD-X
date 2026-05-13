import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('verifying');
  const navigate = useNavigate();

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
        toast.error('Verification failed. Link might be expired.');
      }
    };

    verify();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#020817] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white/[0.02] backdrop-blur-xl border border-white/10 p-8 rounded-3xl text-center"
      >
        <div className="mb-6">
          <div className="w-16 h-16 bg-cyber-green/10 border border-cyber-green/20 rounded-full flex items-center justify-center mx-auto mb-4">
            {status === 'verifying' && <div className="w-8 h-8 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />}
            {status === 'success' && <span className="text-cyber-green text-3xl">✓</span>}
            {status === 'error' && <span className="text-red-500 text-3xl">✗</span>}
          </div>
          
          <h2 className="font-display text-2xl font-bold tracking-widest text-white uppercase">
            {status === 'verifying' && 'Verifying Email...'}
            {status === 'success' && 'Verified!'}
            {status === 'error' && 'Verification Failed'}
          </h2>
          
          <p className="mt-4 font-mono text-sm text-cyber-muted">
            {status === 'verifying' && 'Synchronizing neural signatures with Nexus Core...'}
            {status === 'success' && 'Your identity has been confirmed. Redirecting to registry...'}
            {status === 'error' && 'The link is invalid or has expired. Please request a new code.'}
          </p>
        </div>

        {status === 'error' && (
          <button 
            onClick={() => navigate('/signup')}
            className="w-full py-4 bg-cyber-green text-black font-bold uppercase tracking-widest rounded-xl"
          >
            Back to Signup
          </button>
        )}
      </motion.div>
    </div>
  );
}
