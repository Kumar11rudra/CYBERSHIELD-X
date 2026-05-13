import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * CYBER INTELLIGENCE CONSOLE
 * A unified, high-tech terminal component for all scanning modules.
 */

const LOG_TEMPLATES = {
  url: [
    { cmd: 'resolver.init', msg: 'Initializing secure DNS resolver context' },
    { cmd: 'tls.verify', msg: 'Validating certificate chain and cipher suites' },
    { cmd: 'vt.scan', msg: 'Querying VirusTotal URL reputation engine' },
    { cmd: 'heuristics.check', msg: 'Analyzing hostname entropy and typosquatting signals' },
    { cmd: 'sandbox.run', msg: 'Emulating browser-based execution in secure container' },
  ],
  ip: [
    { cmd: 'net.whois', msg: 'Fetching registrar and ASN infrastructure data' },
    { cmd: 'abuse.db', msg: 'Checking AbuseIPDB reported confidence scores' },
    { cmd: 'geo.lookup', msg: 'Locating infrastructure origin and datacenter signals' },
    { cmd: 'port.scan', msg: 'Checking for known suspicious open services' },
  ],
  hash: [
    { cmd: 'sig.calc', msg: 'Calculating cryptographic hash checksums' },
    { cmd: 'circl.lookup', msg: 'Comparing against CIRCL known-good datasets' },
    { cmd: 'vt.file', msg: 'Querying VirusTotal malware intelligence' },
  ],
  sms: [
    { cmd: 'nlp.parser', msg: 'Analyzing message intent and social engineering markers' },
    { cmd: 'link.extract', msg: 'Isolating hidden URL destinations from payload' },
    { cmd: 'threat.score', msg: 'Calculating overall scam confidence index' },
  ],
  upi: [
    { cmd: 'pay.verify', msg: 'Verifying merchant IDs and payment gateway integrity' },
    { cmd: 'bank.check', msg: 'Validating VPA against known bank handles' },
  ]
};

export default function CyberIntelligenceConsole({ type = 'url', isScanning = false, target = '' }) {
  const [lines, setLines] = useState([]);
  const logs = LOG_TEMPLATES[type] || LOG_TEMPLATES.url;
  const containerRef = useRef(null);

  useEffect(() => {
    if (!isScanning) {
      setLines([]);
      return;
    }

    setLines([]);
    let currentIdx = 0;
    
    const interval = setInterval(() => {
      setLines(prev => {
        if (currentIdx >= logs.length) return prev;
        const line = {
          ...logs[currentIdx],
          timestamp: new Date().toLocaleTimeString([], { hour12: false, fractionalSecondDigits: 3 }),
          id: Math.random()
        };
        currentIdx++;
        return [...prev, line];
      });
    }, 600);

    return () => clearInterval(interval);
  }, [isScanning, type, logs]);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [lines]);

  return (
    <div className="w-full mt-6 rounded-xl border border-cyber-border/40 bg-black/40 backdrop-blur-md overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.2)]">
      {/* Console Header */}
      <div className="bg-cyber-surface/60 border-b border-cyber-border/30 px-4 py-2 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
          <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cyber-muted">Cyber Intelligence Console</span>
        </div>
        <span className="font-mono text-[10px] text-cyber-accent">{isScanning ? '[SESSION ACTIVE]' : '[IDLE]'}</span>
      </div>

      {/* Terminal View */}
      <div 
        ref={containerRef}
        className="h-48 overflow-y-auto p-4 space-y-2 font-mono text-[11px] scrollbar-hide"
      >
        <AnimatePresence>
          {lines.map((line) => (
            <motion.div
              key={line.id}
              initial={{ opacity: 0, x: -5 }}
              animate={{ opacity: 1, x: 0 }}
              className="group flex flex-col gap-1 border-l-2 border-cyber-border/20 pl-3 hover:border-cyber-accent/40 transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="text-cyber-muted opacity-50">{line.timestamp}</span>
                <span className="text-cyber-accent font-bold">$ {line.cmd}</span>
                <span className="text-cyber-green text-[10px] border border-cyber-green/30 px-1 rounded">OK</span>
              </div>
              <p className="text-cyber-text/80 ml-4 group-hover:text-cyber-text transition-colors">
                {line.msg} <span className="animate-pulse">_</span>
              </p>
            </motion.div>
          ))}
        </AnimatePresence>
        
        {isScanning && lines.length < logs.length && (
          <div className="flex items-center gap-2 text-cyber-muted animate-pulse">
            <span>$</span>
            <div className="w-16 h-2 bg-cyber-border/40 rounded" />
          </div>
        )}

        {!isScanning && (
          <div className="h-full flex flex-col items-center justify-center text-cyber-muted/40">
            <svg className="w-8 h-8 mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-[10px] uppercase tracking-widest">Waiting for target input...</p>
          </div>
        )}
      </div>

      {/* Status Footer */}
      <div className="bg-cyber-surface/30 px-4 py-1.5 flex items-center gap-4 border-t border-cyber-border/20">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[9px] text-cyber-muted">TARGET:</span>
          <span className="font-mono text-[9px] text-cyber-text truncate max-w-[150px]">{target || 'NULL'}</span>
        </div>
        <div className="flex-1" />
        <div className="flex items-center gap-1.5">
          <div className={`w-1.5 h-1.5 rounded-full ${isScanning ? 'bg-cyber-accent animate-pulse' : 'bg-cyber-muted'}`} />
          <span className="font-mono text-[9px] text-cyber-muted uppercase tracking-tighter">Real-time Analysis Enabled</span>
        </div>
      </div>
    </div>
  );
}
