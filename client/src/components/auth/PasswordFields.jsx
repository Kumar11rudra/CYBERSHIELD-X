import React from 'react';

export default function PasswordFields({
  password,
  confirmPassword,
  onChange,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="space-y-2">
        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
          Password
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => onChange('password', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors"
          >
            {showPassword ? '👁️' : '🔒'}
          </button>
        </div>
      </div>
      <div className="space-y-2">
        <label className="font-mono text-[9px] text-white/50 uppercase tracking-widest">
          Confirm
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            value={confirmPassword}
            onChange={(e) => onChange('confirmPassword', e.target.value)}
            className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-5 py-4 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors"
            placeholder="••••••••"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted hover:text-white transition-colors"
          >
            {showConfirmPassword ? '👁️' : '🔒'}
          </button>
        </div>
      </div>
    </div>
  );
}
