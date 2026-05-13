import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function LoadingScreen() {
  const [log, setLog] = useState('');
  
  useEffect(() => {
    const chars = '0123456789ABCDEF';
    const interval = setInterval(() => {
      let hex = '';
      for(let i=0; i<8; i++) hex += chars[Math.floor(Math.random() * 16)];
      setLog(`0x${hex}`);
    }, 150);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#020814] flex flex-col items-center justify-center z-[100] font-mono overflow-hidden">
      {/* Background grid */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+PHBhdGggZD0iTTAgMGg0MHY0MEgweiIgZmlsbD0ibm9uZSIvPjxwYXRoIGQ9Ik0wIDM5LjVoNDBNMzkuNSAwdi00ME0wIDE5LjVoNDBNMTkuNSAwdi00MCIgc3Ryb2tlPSJyZ2JhKDAsMjExLDI1NSwwLjAyKSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIi8+PC9zdmc+')] pointer-events-none" />

      {/* Main Reticle */}
      <div className="relative flex items-center justify-center w-64 h-64">
        
        {/* Outer dashed scanner */}
        <motion.div 
          animate={{ rotate: 360 }}
          transition={{ duration: 8, ease: "linear", repeat: Infinity }}
          className="absolute inset-0 rounded-full border border-cyber-accent/30 border-dashed"
        />

        {/* Counter-rotating targeting ring */}
        <motion.div 
          animate={{ rotate: -360 }}
          transition={{ duration: 12, ease: "linear", repeat: Infinity }}
          className="absolute inset-4 rounded-full border-2 border-transparent border-t-cyber-green/50 border-b-cyber-green/50"
        />

        {/* Inner pulse */}
        <motion.div 
           animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.8, 0.3] }}
           transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
           className="absolute w-12 h-12 bg-cyber-accent/20 rounded-full shadow-[0_0_30px_rgba(0,212,255,0.4)] blur-sm"
        />

        {/* Center crosshair */}
        <IconCrosshair />
      </div>

      <div className="mt-12 flex flex-col items-center gap-2 relative z-10">
        <motion.h2 
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className="text-cyber-accent font-black tracking-[0.4em] uppercase text-sm"
        >
          System Handshake
        </motion.h2>
        
        <p className="text-[10px] text-cyber-muted tracking-widest uppercase">
          Verifying clearance... [{log}]
        </p>

        {/* Progress bar line */}
        <div className="w-48 h-px bg-white/10 mt-4 relative overflow-hidden">
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-y-0 w-1/2 bg-gradient-to-r from-transparent via-cyber-accent to-transparent"
          />
        </div>
      </div>
    </div>
  );
}

function IconCrosshair() {
  return (
    <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="rgba(0,212,255,0.8)" strokeWidth="1.5">
      <path d="M20 0v16M20 24v16M0 20h16M24 20h16" />
      <circle cx="20" cy="20" r="12" stroke="rgba(0,212,255,0.3)" strokeDasharray="4 4" />
      <circle cx="20" cy="20" r="2" fill="rgba(0,212,255,1)" />
    </svg>
  );
}
