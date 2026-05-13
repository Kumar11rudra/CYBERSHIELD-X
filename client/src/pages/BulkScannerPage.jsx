import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../services/api';
import toast from 'react-hot-toast';
import RiskBadge from '../components/common/RiskBadge';

const RISK_COLOR = { safe: '#00ff88', low: '#ffdd00', medium: '#ff8c00', dangerous: '#ff2244' };

// Delay between scans to avoid hammering the API
const delay = (ms) => new Promise((r) => setTimeout(r, ms));

export default function BulkScannerPage() {
  const [input, setInput] = useState('');
  const [results, setResults] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const abortRef = useRef(false);

  const parseTargets = (text) => {
    return text
      .split(/[\n,\s]+/)
      .map((t) => t.trim())
      .filter((t) => t.length > 3);
  };

  const handleBulkScan = async () => {
    const targets = parseTargets(input);
    if (targets.length === 0) return toast.error('Enter at least one URL, IP, or domain');
    if (targets.length > 20) return toast.error('Max 20 targets at once to avoid rate limiting');

    setScanning(true);
    setResults([]);
    setProgress({ done: 0, total: targets.length });
    abortRef.current = false;

    for (let i = 0; i < targets.length; i++) {
      if (abortRef.current) break;
      const target = targets[i];

      // Add pending entry
      setResults((prev) => [...prev, { target, status: 'scanning' }]);

      try {
        const res = await api.post('/scan', { target });
        const scan = res.data.scan;
        setResults((prev) =>
          prev.map((r) =>
            r.target === target && r.status === 'scanning'
              ? { target, status: 'done', scan }
              : r
          )
        );
      } catch (err) {
        const errMsg = err.response?.data?.error || 'Scan failed';
        setResults((prev) =>
          prev.map((r) =>
            r.target === target && r.status === 'scanning'
              ? { target, status: 'error', error: errMsg }
              : r
          )
        );
      }

      setProgress((p) => ({ ...p, done: i + 1 }));
      // Small delay between requests
      if (i < targets.length - 1) await delay(800);
    }

    setScanning(false);
    toast.success(`Bulk scan complete — ${progress.total} targets processed`);
  };

  const handleStop = () => {
    abortRef.current = true;
    setScanning(false);
    toast('Scan stopped by user', { icon: '🛑' });
  };

  const dangerous = results.filter((r) => r.scan?.riskLevel === 'dangerous').length;
  const safe = results.filter((r) => r.scan?.riskLevel === 'safe').length;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div>
        <p className="font-mono text-[10px] text-cyber-accent/60 uppercase tracking-[0.4em] mb-1">Batch Intelligence</p>
        <h1 className="font-display text-3xl font-black text-white uppercase tracking-tight">
          Bulk <span className="text-cyber-accent">URL Scanner</span>
        </h1>
        <p className="font-mono text-xs text-cyber-muted mt-1">
          Scan up to 20 URLs, IPs, or domains at once — results stream in real-time
        </p>
      </div>

      {/* Input */}
      <div className="cyber-bento-card p-6 space-y-4">
        <div>
          <label className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest block mb-2">
            Targets — one per line, or comma/space separated (max 20)
          </label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`8.8.8.8\nhttps://malicious-site.com\nexample.org\n192.168.1.1`}
            rows={6}
            disabled={scanning}
            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-sm text-white placeholder-white/20 focus:border-cyber-accent outline-none transition-colors resize-none custom-scrollbar"
          />
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleBulkScan}
            disabled={scanning || !input.trim()}
            className="flex-1 py-3 bg-cyber-accent/20 border border-cyber-accent/40 text-cyber-accent font-mono text-sm font-bold uppercase tracking-widest rounded-xl hover:bg-cyber-accent/30 transition-all disabled:opacity-40"
          >
            {scanning ? `Scanning... ${progress.done}/${progress.total}` : '🔍 Start Bulk Scan'}
          </button>
          {scanning && (
            <button
              onClick={handleStop}
              className="px-6 py-3 bg-red-500/10 border border-red-500/30 text-red-400 font-mono text-sm font-bold uppercase rounded-xl hover:bg-red-500/20 transition-all"
            >
              🛑 Stop
            </button>
          )}
        </div>

        {/* Progress bar */}
        {scanning && (
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-cyber-muted">
              <span>{progress.done} / {progress.total} scanned</span>
              <span>{Math.round((progress.done / progress.total) * 100)}%</span>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-cyber-accent rounded-full"
                animate={{ width: `${(progress.done / progress.total) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Summary row */}
      {results.length > 0 && !scanning && (
        <div className="grid grid-cols-3 gap-3">
          <div className="cyber-bento-card p-4 text-center">
            <p className="font-display text-2xl font-black text-white">{results.length}</p>
            <p className="font-mono text-[10px] text-cyber-muted uppercase mt-1">Total Scanned</p>
          </div>
          <div className="cyber-bento-card p-4 text-center border-red-500/20">
            <p className="font-display text-2xl font-black text-red-400">{dangerous}</p>
            <p className="font-mono text-[10px] text-cyber-muted uppercase mt-1">Dangerous</p>
          </div>
          <div className="cyber-bento-card p-4 text-center border-green-500/20">
            <p className="font-display text-2xl font-black text-green-400">{safe}</p>
            <p className="font-mono text-[10px] text-cyber-muted uppercase mt-1">Clean</p>
          </div>
        </div>
      )}

      {/* Results */}
      <div className="space-y-2">
        <AnimatePresence>
          {results.map((r, i) => (
            <motion.div
              key={`${r.target}-${i}`}
              initial={{ opacity: 0, x: -16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25 }}
              className={`cyber-bento-card p-4 flex items-center gap-4 ${
                r.scan?.riskLevel === 'dangerous' ? 'border-red-500/30' : ''
              }`}
            >
              {/* Status indicator */}
              {r.status === 'scanning' && (
                <div className="w-5 h-5 border-2 border-cyber-accent border-t-transparent rounded-full animate-spin flex-shrink-0" />
              )}
              {r.status === 'done' && (
                <div className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center"
                  style={{ backgroundColor: `${RISK_COLOR[r.scan.riskLevel]}18`, border: `1px solid ${RISK_COLOR[r.scan.riskLevel]}` }}>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: RISK_COLOR[r.scan.riskLevel] }} />
                </div>
              )}
              {r.status === 'error' && (
                <div className="w-5 h-5 rounded-full bg-gray-500/20 border border-gray-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-[8px] text-gray-400">!</span>
                </div>
              )}

              {/* Target */}
              <p className="font-mono text-sm text-white flex-1 truncate">{r.target}</p>

              {/* Result */}
              {r.status === 'scanning' && (
                <span className="font-mono text-[10px] text-cyber-accent/60 uppercase animate-pulse">Scanning...</span>
              )}
              {r.status === 'done' && (
                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="font-mono text-xs font-bold"
                    style={{ color: RISK_COLOR[r.scan.riskLevel] }}>
                    {r.scan.threatScore}/100
                  </span>
                  <RiskBadge level={r.scan.riskLevel} />
                </div>
              )}
              {r.status === 'error' && (
                <span className="font-mono text-[10px] text-red-400 uppercase max-w-[140px] text-right">{r.error}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
