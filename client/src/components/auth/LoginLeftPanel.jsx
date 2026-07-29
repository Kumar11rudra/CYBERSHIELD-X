import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import AuthLeftPanel from '../common/AuthLeftPanel';

export default function LoginLeftPanel({ t }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="hidden lg:flex w-1/2"
    >
      <AuthLeftPanel
        hud={
          <>
            <p className="font-mono text-[10px] text-cyber-green tracking-[0.3em] mb-1">
              NETWORK: SECURE
            </p>
            <p className="font-mono text-[10px] text-cyber-muted tracking-[0.3em] uppercase">
              Auth channels open
            </p>
          </>
        }
      >
        <motion.div
          animate={{ y: [-10, 10, -10], rotate: [0, 5, -5, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-12 drop-shadow-[0_0_40px_rgba(0,255,136,0.5)]"
        >
          <Link to="/" className="hover:scale-105 transition-transform block">
            <BrandLogo size={180} />
          </Link>
        </motion.div>

        <div className="mt-4 text-center max-w-lg">
          <h2 className="font-display text-4xl font-bold text-white tracking-widest mb-6 uppercase">
            SECURE <br />
            <span className="text-cyber-green">ACCESS</span>
          </h2>
          <p className="font-mono text-sm text-cyber-muted leading-relaxed">
            {t('auth.login.desc')}
          </p>
        </div>
      </AuthLeftPanel>
    </motion.div>
  );
}
