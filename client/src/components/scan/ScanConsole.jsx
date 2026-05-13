import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PHASES = (target) => [
  { text: `$ Initializing CyberShield X engine...`,    delay: 0 },
  { text: `$ Connecting to VirusTotal API...`,         delay: 420 },
  { text: `$ Submitting target: ${target || '...'}`,   delay: 900 },
  { text: `$ Fetching reputation data...`,             delay: 1500 },
  { text: `$ Querying AbuseIPDB threat database...`,   delay: 2200 },
  { text: `$ Analyzing DNS / WHOIS records...`,        delay: 2900 },
  { text: `$ Running threat-scoring algorithm...`,     delay: 3600 },
  { text: `$ Generating report...`,                    delay: 4200 },
  { text: `$ ✓ Scan complete.`,                        delay: 4800, accent: true },
];

const TypewriterText = ({ text }) => {
  const [displayed, setDisplayed] = useState('');

  useEffect(() => {
    setDisplayed('');
    let i = 0;
    const id = setInterval(() => {
      i += 1;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) clearInterval(id);
    }, 18);

    return () => clearInterval(id);
  }, [text]);

  return <span>{displayed}<span className="animate-pulse opacity-60">▌</span></span>;
};

const ConsoleLine = ({ text, accent }) => (
  <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.25 }}
    className={`font-mono text-xs leading-6 flex items-start gap-2 ${accent ? 'text-cyber-green' : 'text-cyber-muted'}`}>
    <span className="text-cyber-accent select-none mt-px">›</span>
    <TypewriterText text={text} />
  </motion.div>
);

export default function ScanConsole({ isScanning, target }) {
  const [lines, setLines] = useState([]);
  const endRef = useRef(null);
  const timers = useRef([]);

  useEffect(() => {
    timers.current.forEach(clearTimeout);
    timers.current = [];

    if (!isScanning) return;

    setLines([]);
    PHASES(target).forEach((p) => {
      const id = setTimeout(() => setLines((prev) => [...prev, p]), p.delay);
      timers.current.push(id);
    });

    return () => timers.current.forEach(clearTimeout);
  }, [isScanning, target]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  if (!isScanning && lines.length === 0) return null;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.3 }}
      className="cyber-card p-4 mt-4">
      <div className="flex items-center gap-1.5 mb-3 pb-3 border-b border-cyber-border/40">
        <span className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
        <span className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
        <span className="ml-3 font-mono text-xs text-cyber-muted tracking-widest uppercase">
          scan_console — {target || 'awaiting target'}
        </span>
        {isScanning && (
          <span className="ml-auto flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyber-green animate-pulse"
              style={{ boxShadow: '0 0 6px #00ff88' }} />
            <span className="font-mono text-xs text-cyber-green">LIVE</span>
          </span>
        )}
      </div>
      <div className="min-h-[120px] max-h-48 overflow-y-auto space-y-0.5">
        <AnimatePresence initial={false}>
          {lines.map((line, i) => <ConsoleLine key={i} text={line.text} accent={line.accent} />)}
        </AnimatePresence>
        <div ref={endRef} />
      </div>
      {isScanning && (
        <div className="mt-3 pt-3 border-t border-cyber-border/40">
          <div className="h-1 bg-cyber-bg rounded overflow-hidden">
            <motion.div className="h-full rounded"
              style={{ background: 'linear-gradient(90deg, #00d4ff, #00ff88)' }}
              animate={{ width: `${Math.min((lines.length / PHASES('').length) * 100, 95)}%` }}
              transition={{ duration: 0.4 }} />
          </div>
        </div>
      )}
    </motion.div>
  );
}
