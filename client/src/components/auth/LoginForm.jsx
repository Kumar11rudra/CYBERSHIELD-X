import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import LoginHeader from './LoginHeader';
import EmailField from './EmailField';
import PasswordField from './PasswordField';
import LoginActions from './LoginActions';
import GoogleAuthButton from '../common/GoogleAuthButton';
import AuthDivider from '../common/AuthDivider';

export default function LoginForm({
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
    <motion.div
      key="creds"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
    >
      <LoginHeader t={t} />

      <form onSubmit={doLogin} className="space-y-5 relative z-10" autoComplete="on">
        <EmailField t={t} identity={identity} setIdentity={setIdentity} />
        <PasswordField
          t={t}
          password={password}
          setPassword={setPassword}
          showPw={showPw}
          setShowPw={setShowPw}
        />
        <LoginActions t={t} loading={loading} />
      </form>

      <AuthDivider
        label={`${t('common.or')} ${t('auth.login.loginButton')} ${t('common.with')}`}
      />

      <div className="flex flex-col gap-4 relative z-10">
        <GoogleAuthButton
          label={t('auth.login.continueWithGoogle')}
          onClick={handleGoogleLogin}
          size="sm"
        />
      </div>

      <div className="mt-8 pt-4 border-t border-white/10 text-center relative z-10 flex flex-col gap-2">
        <p className="font-mono text-[10px] text-cyber-muted">
          {t('auth.login.dontHaveAccount')}{' '}
          <Link
            to="/signup"
            className="text-cyber-green hover:underline decoration-cyber-green/50 underline-offset-4"
          >
            {t('auth.login.register')} →
          </Link>
        </p>
      </div>
    </motion.div>
  );
}