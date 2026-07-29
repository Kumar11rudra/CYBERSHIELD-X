import React from 'react';
import { motion } from 'framer-motion';

export default function LoginActions({ t, loading }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      type="submit"
      disabled={loading}
      className="w-full py-3.5 mt-2 rounded-lg bg-transparent text-cyber-green font-bold tracking-[0.2em] uppercase text-sm border-2 border-cyber-green hover:bg-cyber-green hover:text-cyber-bg hover:shadow-[0_0_25px_rgba(0,255,136,0.5)] transition-all duration-300 disabled:opacity-50 relative overflow-hidden group"
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          {t('auth.login.authenticating')}
        </span>
      ) : (
        t('auth.login.loginButton')
      )}
      {/* Shine effect */}
      <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-[-20deg]" />
    </motion.button>
  );
}
