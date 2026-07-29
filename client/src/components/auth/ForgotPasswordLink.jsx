import React from 'react';
import { Link } from 'react-router-dom';

export default function ForgotPasswordLink({ t }) {
  return (
    <Link
      to="/forgot-password"
      className="font-mono text-[10px] text-cyber-green hover:underline underline-offset-2"
    >
      {t('auth.login.forgotPassword')}
    </Link>
  );
}
