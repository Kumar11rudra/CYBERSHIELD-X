import React from 'react';

export default function TermsCheckbox({ termsAccepted, setTermsAccepted }) {
  return (
    <label className="flex items-center gap-4 cursor-pointer">
      <input
        type="checkbox"
        checked={termsAccepted}
        onChange={() => setTermsAccepted(!termsAccepted)}
        className="hidden"
      />
      <div
        className={`w-5 h-5 border rounded flex items-center justify-center ${
          termsAccepted
            ? 'bg-cyber-green border-cyber-green text-black font-bold'
            : 'border-white/20'
        }`}
      >
        {termsAccepted && '✓'}
      </div>
      <span className="font-mono text-[9px] text-cyber-muted uppercase">
        Accept Protocols & Privacy Policy
      </span>
    </label>
  );
}
