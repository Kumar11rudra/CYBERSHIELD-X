import React from 'react';

/**
 * AuthDivider
 * "OR LOGIN WITH" / "OR SIGNUP WITH" horizontal divider.
 *
 * Props:
 *   label — string shown in center
 */
export default function AuthDivider({ label }) {
  return (
    <div className="flex items-center gap-4 my-6" role="separator" aria-label={label}>
      <div className="flex-1 h-px bg-white/10" />
      <span className="font-mono text-[10px] text-cyber-muted tracking-[0.2em] uppercase">
        {label}
      </span>
      <div className="flex-1 h-px bg-white/10" />
    </div>
  );
}
