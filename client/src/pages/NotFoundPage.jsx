import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const glitchChars = '!@#$%^&*><[]{}|\\/?~`1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function GlitchText({ text }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let iteration = 0;
    const interval = setInterval(() => {
      setDisplay(
        text.split('').map((char, i) => {
          if (i < iteration) return text[i];
          return glitchChars[Math.floor(Math.random() * glitchChars.length)];
        }).join('')
      );
      if (iteration >= text.length) clearInterval(interval);
      iteration += 1 / 3;
    }, 30);
    return () => clearInterval(interval);
  }, [text]);

  return <span>{display}</span>;
}

export default function NotFoundPage() {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (countdown <= 0) { navigate('/dashboard'); return; }
    const t = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-[#020508] px-6 text-center relative overflow-hidden">

      {/* Scanlines */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,212,255,0.015) 2px, rgba(0,212,255,0.015) 4px)' }}
      />

      {/* Radar ring animation */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        {[1, 2, 3].map((i) => (
          <motion.div
            key={i}
            className="absolute rounded-full border border-cyber-accent/10"
            style={{ width: `${i * 200}px`, height: `${i * 200}px`, top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
            animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0.05, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, delay: i * 0.5 }}
          />
        ))}
      </div>

      {/* Error Code */}
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10"
      >
        <p className="font-mono text-[10px] text-cyber-accent uppercase tracking-[0.5em] mb-4 animate-pulse">
          NEXUS_SIGNAL :: ROUTE_NOT_FOUND
        </p>

        <h1 className="font-display font-black text-white mb-2 leading-none"
          style={{ fontSize: 'clamp(6rem, 20vw, 12rem)', textShadow: '0 0 80px rgba(0,212,255,0.15)' }}
        >
          4<span className="text-cyber-accent">0</span>4
        </h1>

        <div className="font-display text-2xl md:text-4xl font-black text-white uppercase tracking-[0.2em] mb-6">
          <GlitchText text="SIGNAL LOST" />
        </div>

        <p className="font-mono text-sm text-cyber-muted max-w-md mx-auto leading-relaxed mb-10">
          The requested coordinates are outside the Nexus perimeter. The location you are scanning does not exist in our threat-mapped universe.
        </p>

        {/* Countdown */}
        <div className="flex items-center justify-center gap-3 mb-10">
          <div className="w-10 h-10 rounded-full border-2 border-cyber-accent/30 flex items-center justify-center font-mono text-xl font-bold text-cyber-accent" style={{ boxShadow: '0 0 15px rgba(0,212,255,0.2)' }}>
            {countdown}
          </div>
          <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">
            Returning to Nexus in {countdown}s
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/dashboard"
            className="px-8 py-3.5 rounded-xl bg-cyber-accent text-cyber-bg font-bold font-mono text-[11px] uppercase tracking-[0.3em] hover:shadow-[0_0_25px_rgba(0,212,255,0.5)] transition-all"
          >
            ↩ Return to Command Center
          </Link>
          <Link
            to="/"
            className="px-8 py-3.5 rounded-xl border border-white/10 text-cyber-muted font-mono text-[11px] uppercase tracking-[0.3em] hover:border-cyber-accent/40 hover:text-white transition-all"
          >
            ⊘ Mission Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
