import React from 'react';

export default function RegistrationStatus() {
  return (
    <div className="absolute bottom-10 left-10 border-l-2 border-cyber-green/40 pl-6">
      <p className="font-mono text-[10px] text-cyber-green tracking-[0.3em] mb-1 uppercase font-bold">
        Registration Status
      </p>
      <p className="font-mono text-[10px] text-cyber-muted tracking-[0.3em] uppercase">
        Encrypting session data...
      </p>
    </div>
  );
}
