import React from 'react';

export default function EmailField({ t, identity, setIdentity }) {
  return (
    <div className="relative group">
      <label className="block font-mono text-[10px] text-cyber-muted uppercase tracking-[0.2em] mb-1.5 group-focus-within:text-cyber-green transition-colors">
        {t('auth.login.emailUsernamePhone')}
      </label>
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
              d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
            />
          </svg>
        </div>
        <input
          type="text"
          value={identity}
          onChange={(e) => setIdentity(e.target.value)}
          className="w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-4 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all placeholder:text-white/20"
          placeholder="operator@nexus.io"
          required
          autoFocus
        />
      </div>
    </div>
  );
}
