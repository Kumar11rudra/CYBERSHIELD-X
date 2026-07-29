import React from 'react';

export default function LoginHeader({ t }) {
  return (
    <div className="relative z-10 mb-6">
      <h2 className="font-display text-xl text-white tracking-widest mb-1 font-bold">
        {t('auth.login.welcomeBack')}
      </h2>
      <p className="font-mono text-xs text-cyber-green/80 tracking-widest uppercase">
        {t('auth.login.signInAccount')}
      </p>
    </div>
  );
}
