import React from 'react';
import ForgotPasswordLink from './ForgotPasswordLink';

export default function PasswordField({ t, password, setPassword, showPw, setShowPw }) {
  return (
    <div className="relative group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-[0.2em] group-focus-within:text-cyber-green transition-colors">
          {t('auth.login.password')}
        </label>
        <ForgotPasswordLink t={t} />
      </div>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className="w-5 h-5 text-cyber-muted group-focus-within:text-cyber-green transition-colors"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <input
          type={showPw ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all placeholder:text-white/20"
          placeholder="••••••••••••"
          required
        />
        <button
          type="button"
          onClick={() => setShowPw(!showPw)}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-cyber-muted hover:text-white transition-colors"
        >
          {showPw ? '🙈' : '👁️'}
        </button>
      </div>
    </div>
  );
}
