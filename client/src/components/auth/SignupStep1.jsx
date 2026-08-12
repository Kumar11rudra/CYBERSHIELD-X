import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import UsernameField from './UsernameField';
import PasswordFields from './PasswordFields';
import AuthDivider from '../common/AuthDivider';

export default function SignupStep1({
  t,
  form,
  errors,
  updateForm,
  usernameChecking,
  usernameAvailable,
  usernameSuggestions,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  loading,
  handleNext,
}) {
  return (
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-6"
    >
      <h2 className="font-display text-2xl font-bold text-white">
        {t('auth.signup.basicIdentity')}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <UsernameField
          t={t}
          value={form.username}
          error={errors.username}
          onChange={updateForm}
          usernameChecking={usernameChecking}
          usernameAvailable={usernameAvailable}
          usernameSuggestions={usernameSuggestions}
        />
        <div className="space-y-2">
          <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
            {t('auth.signup.emailAddress')}
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => updateForm('email', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors"
            placeholder="operator@nexus.io"
          />
        </div>
      </div>

      <PasswordFields
        password={form.password}
        confirmPassword={form.confirmPassword}
        onChange={updateForm}
        showPassword={showPassword}
        setShowPassword={setShowPassword}
        showConfirmPassword={showConfirmPassword}
        setShowConfirmPassword={setShowConfirmPassword}
      />

      <button
        type="button"
        onClick={handleNext}
        disabled={loading}
        className="w-full py-5 bg-cyber-green text-black font-mono font-black uppercase rounded-2xl transition-all active:scale-95 disabled:opacity-50"
      >
        {loading ? 'Analyzing Protocols...' : 'Next Step'}
      </button>

      <div className="mt-8 pt-4 border-t border-white/10 text-center relative z-10">
        <p className="font-mono text-[10px] text-cyber-muted">
          {t('auth.signup.alreadyMember') || 'Already a member?'}{' '}
          <Link
            to="/login"
            className="text-cyber-green hover:underline decoration-cyber-green/50 underline-offset-4"
          >
            {t('auth.signup.loginRegistry') || 'Sign In'} →
          </Link>
        </p>
      </div>
    </motion.div>
  );
}