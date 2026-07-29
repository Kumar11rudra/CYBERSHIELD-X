import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import BrandLogo from '../common/BrandLogo';
import AuthLeftPanel from '../common/AuthLeftPanel';
import SignupProgress from './SignupProgress';
import RegistrationStatus from './RegistrationStatus';

export default function SignupLeftPanel({ step }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -50 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.8, ease: 'easeOut' }}
      className="hidden lg:flex w-1/2"
    >
      <AuthLeftPanel hud={<RegistrationStatus />}>
        <motion.div
          animate={{ y: [-10, 10, -10] }}
          transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
          className="mb-12 drop-shadow-[0_0_30px_rgba(0,255,136,0.3)]"
        >
          <Link to="/" className="hover:scale-105 transition-transform block">
            <BrandLogo size={120} />
          </Link>
        </motion.div>

        <div className="text-center mb-16">
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-white">
            Nexus
          </h1>
          <h1 className="font-display text-5xl font-black tracking-tighter uppercase leading-[0.9] text-cyber-green">
            Registry
          </h1>
          <p className="font-mono text-[10px] text-white/40 uppercase tracking-[0.4em] mt-4">
            Secure Identity Node
          </p>
        </div>

        <SignupProgress step={step} />
      </AuthLeftPanel>
    </motion.div>
  );
}
