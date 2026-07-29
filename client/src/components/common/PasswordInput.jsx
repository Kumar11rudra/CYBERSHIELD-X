import React from 'react';

/**
 * PasswordInput
 * Shared password input with show/hide toggle and lock/eye icon.
 *
 * Props:
 *   id          — input id for label association
 *   label       — field label text
 *   value       — controlled value
 *   onChange    — change handler (e) => void
 *   show        — boolean visibility state
 *   onToggle    — toggle visibility handler
 *   placeholder — input placeholder
 *   required    — html required attribute
 *   error       — optional error string
 *   variant     — 'login' | 'signup' (adjusts border-radius and padding)
 */
export default function PasswordInput({
  id,
  label,
  value,
  onChange,
  show,
  onToggle,
  placeholder = '••••••••',
  required = false,
  error,
  variant = 'signup',
}) {
  const isLogin = variant === 'login';

  const inputClass = isLogin
    ? 'w-full bg-black/40 border border-white/10 rounded-lg pl-10 pr-10 py-3 text-white font-mono text-sm focus:outline-none focus:border-cyber-green focus:ring-1 focus:ring-cyber-green transition-all placeholder:text-white/20'
    : `w-full bg-white/[0.03] border ${error ? 'border-red-500/50' : 'border-white/10'} rounded-2xl px-5 py-4 pr-12 font-mono text-sm outline-none focus:border-cyber-green/50 transition-colors`;

  return (
    <div className="space-y-2">
      {label && (
        <label
          htmlFor={id}
          className="font-mono text-[9px] text-white/50 uppercase tracking-widest"
        >
          {label}
        </label>
      )}
      <div className="relative">
        {isLogin && (
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-cyber-muted"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
              />
            </svg>
          </div>
        )}
        <input
          id={id}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={onChange}
          className={inputClass}
          placeholder={placeholder}
          required={required}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <button
          type="button"
          onClick={onToggle}
          className={`absolute ${isLogin ? 'inset-y-0 right-0 pr-3 flex items-center' : 'right-4 top-1/2 -translate-y-1/2'} text-cyber-muted hover:text-white transition-colors`}
          aria-label={show ? 'Hide password' : 'Show password'}
        >
          {show ? '👁️' : '🔒'}
        </button>
      </div>
      {error && (
        <p id={`${id}-error`} className="font-mono text-[9px] text-red-400">
          {error}
        </p>
      )}
    </div>
  );
}
