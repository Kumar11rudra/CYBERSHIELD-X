import React from 'react';

export default function UsernameField({
  t,
  value,
  error,
  onChange,
  usernameChecking,
  usernameAvailable,
  usernameSuggestions,
}) {
  return (
    <div className="space-y-2">
      <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
        {t('auth.signup.username')}
      </label>
      <div className="relative">
        <input
          value={value}
          onChange={(e) => onChange('username', e.target.value.toLowerCase())}
          className={`w-full bg-white/[0.03] border ${
            error ? 'border-red-500/50' : 'border-white/10'
          } rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`}
          placeholder="cyber_warrior"
        />
        {usernameChecking && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 border-2 border-cyber-green border-t-transparent rounded-full animate-spin" />
        )}
      </div>
      {usernameAvailable === false && usernameSuggestions.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {usernameSuggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => onChange('username', s)}
              className="px-2 py-1 bg-cyber-green/5 border border-cyber-green/20 rounded text-cyber-green font-mono text-[9px]"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
