import React from 'react';
import { motion } from 'framer-motion';
import BrandLogo from '../common/BrandLogo';
import LanguageSwitcher from '../common/LanguageSwitcher';
import GlassCard from '../common/GlassCard';
import LoginForm from './LoginForm';

export default function LoginFormContainer({
  t,
  identity,
  setIdentity,
  password,
  setPassword,
  showPw,
  setShowPw,
  loading,
  doLogin,
  handleGoogleLogin,
}) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-6 relative z-10 bg-gradient-to-l from-black/80 to-transparent w-full">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="w-full max-w-[440px] relative mt-[var(--safe-top)] mb-[var(--safe-bottom)]"
      >
        {/* Mobile Header Logo */}
        <div className="text-center mb-6 lg:hidden">
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="inline-flex justify-center mb-2"
          >
            <BrandLogo size={50} />
          </motion.div>
          <h1 className="font-display text-xl font-bold text-white tracking-widest">
            CYBERSHIELD X
          </h1>
        </div>

        <div className="absolute top-0 right-0 p-4 z-20">
          <LanguageSwitcher />
        </div>

        <GlassCard padding="md" glow>
          <LoginForm
            t={t}
            identity={identity}
            setIdentity={setIdentity}
            password={password}
            setPassword={setPassword}
            showPw={showPw}
            setShowPw={setShowPw}
            loading={loading}
            doLogin={doLogin}
            handleGoogleLogin={handleGoogleLogin}
          />
        </GlassCard>
      </motion.div>
    </div>
  );
}
