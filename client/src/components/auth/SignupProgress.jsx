import React from 'react';

export default function SignupProgress({ step }) {
  const steps = [
    { s: 1, l: 'Identity' },
    { s: 2, l: 'Profile & Verification' },
  ];

  return (
    <div className="space-y-8 w-full max-w-xs">
      {steps.map((i) => (
        <div
          key={i.s}
          className={`flex items-center gap-6 transition-all duration-500 ${
            step === i.s ? 'opacity-100 translate-x-4' : 'opacity-30'
          }`}
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center font-mono text-lg border-2 ${
              step === i.s
                ? 'bg-cyber-green text-black border-cyber-green shadow-[0_0_20px_rgba(0,255,136,0.5)]'
                : 'border-white/20 text-white'
            }`}
          >
            {i.s}
          </div>

          <div>
            <h4 className="font-mono text-[11px] uppercase font-bold tracking-[0.2em] text-white">
              {i.l}
            </h4>

            {step === i.s && (
              <p className="font-mono text-[8px] text-cyber-green/60 uppercase tracking-widest mt-0.5">
                Active Protocol
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
