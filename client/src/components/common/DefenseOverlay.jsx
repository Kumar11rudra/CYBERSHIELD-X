import React from 'react';
import { motion } from 'framer-motion';

const DefenseOverlay = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden opacity-20">
      {/* Horizontal Scanline */}
      <motion.div
        animate={{ y: ['-100%', '200%'] }}
        transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
        className="absolute top-0 left-0 w-full h-[2px] bg-cyber-accent shadow-[0_0_15px_rgba(0,212,255,0.8)]"
      />

      {/* Radar Ping pulses */}
      <motion.div
        initial={{ scale: 0, opacity: 0.5 }}
        animate={{ scale: 4, opacity: 0 }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeOut" }}
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 border border-cyber-accent rounded-full"
      />

      {/* Corner Brackets */}
      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-cyber-accent/30" />
      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-cyber-accent/30" />
      <div className="absolute bottom-12 left-8 w-8 h-8 border-b-2 border-l-2 border-cyber-accent/30" />
      <div className="absolute bottom-12 right-8 w-8 h-8 border-b-2 border-r-2 border-cyber-accent/30" />

      {/* Digital Noise / Interlace (Subtle) */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,0,0.03))] bg-[length:100%_4px,3px_100%]" />
      
      {/* Floating coordinates indicator (Purely aesthetic) */}
      <div className="absolute bottom-10 left-20 font-mono text-[8px] text-cyber-accent/40 uppercase tracking-widest hidden md:block">
        Lat: 28.6139° N | Long: 77.2090° E | ELEV: 213M
      </div>
    </div>
  );
};

export default DefenseOverlay;
