import React, { useState } from 'react';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, stagger } from '../utils/motion';
import ThreatGauge from '../components/scan/ThreatGauge';
import CyberIntelligenceConsole from '../components/common/CyberIntelligenceConsole';
import toast from 'react-hot-toast';

// ─── Grade Badge ───────────────────────────────────────────────────────────────
const GradeBadge = ({ grade }) => {
  const colors = {
    A: 'text-cyber-green border-cyber-green bg-cyber-green/10',
    B: 'text-blue-400 border-blue-400/50 bg-blue-400/10',
    C: 'text-yellow-400 border-yellow-400/50 bg-yellow-400/10',
    F: 'text-cyber-red border-cyber-red/50 bg-cyber-red/10',
  };
  return (
    <span className={`font-display text-3xl font-black border-2 rounded-xl px-4 py-1 ${colors[grade] || colors.B}`}>
      {grade}
    </span>
  );
};

// ─── Info Row ──────────────────────────────────────────────────────────────────
const InfoRow = ({ label, value, highlight }) => (
  <div className="flex items-center justify-between gap-3 py-2.5 border-b border-cyber-border/20 last:border-0">
    <span className="font-mono text-[10px] uppercase tracking-wider text-cyber-muted">{label}</span>
    <span className={`font-mono text-xs text-right max-w-[60%] break-all ${highlight || 'text-cyber-text'}`}>{value ?? '—'}</span>
  </div>
);

// ─── Section wrapper ───────────────────────────────────────────────────────────
const Section = ({ title, children }) => (
  <div className="cyber-card p-6 space-y-2">
    <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyber-accent mb-4">{title}</p>
    {children}
  </div>
);

const TABS = [
  { id: 'phishing', label: 'Phishing Detector', icon: '🎣', placeholder: 'https://secure-paypal-login.suspicious.tk/verify' },
  { id: 'whois',    label: 'WHOIS Lookup',      icon: '🌐', placeholder: 'google.com' },
  { id: 'ssl',      label: 'SSL Certificate',   icon: '🔒', placeholder: 'github.com' },
];

const ENDPOINTS = {
  phishing: '/tools/phishing',
  whois:    '/tools/whois',
  ssl:      '/tools/ssl',
};

export default function WebForensicsPage() {
  const [activeTab, setActiveTab] = useState('phishing');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const activeTabData = TABS.find(t => t.id === activeTab);

  const handleScan = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const payload = activeTab === 'phishing' ? { url: input.trim() } : { domain: input.trim() };
      const res = await api.post(ENDPOINTS[activeTab], payload);
      setResult({ ...res.data, mode: activeTab });
      toast.success('Scan complete');
    } catch (err) {
      const msg = err.response?.data?.error || 'Scan failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setResult(null);
    setError('');
    setInput('');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <motion.div initial="hidden" animate="show" variants={stagger(0.1)}>
        <motion.p variants={fadeUp} className="font-mono text-[10px] text-cyber-accent uppercase tracking-[0.3em] mb-3">
          Domain & URL Intelligence Suite
        </motion.p>
        <motion.h1 variants={fadeUp} className="font-display text-4xl text-cyber-text tracking-widest uppercase">
          Web <span className="text-cyber-accent">Forensics</span>
        </motion.h1>
        <motion.p variants={fadeUp} className="font-mono text-cyber-muted text-xs mt-3 max-w-2xl leading-relaxed">
          Unified threat analysis for URLs and domains — phishing heuristics, WHOIS registration data, and SSL certificate validation in one place.
        </motion.p>
      </motion.div>

      {/* Tab Selector */}
      <motion.div variants={fadeUp} className="flex flex-wrap gap-3">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => handleTabChange(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl border font-mono text-xs uppercase tracking-wider transition-all ${
              activeTab === tab.id
                ? 'bg-cyber-accent/20 border-cyber-accent text-cyber-accent shadow-[0_0_20px_rgba(0,212,255,0.15)]'
                : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/30 hover:text-white'
            }`}
          >
            <span>{tab.icon}</span> {tab.label}
          </button>
        ))}
      </motion.div>

      {/* Input Card */}
      <motion.div variants={fadeUp} className="cyber-card p-8 space-y-4">
        <label className="block font-mono text-cyber-muted text-xs uppercase tracking-wider">
          {activeTab === 'phishing' ? 'Enter URL to Analyze' : 'Enter Domain Name'}
        </label>
        <div className="flex flex-col md:flex-row gap-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleScan()}
            placeholder={activeTabData.placeholder}
            className="cyber-input flex-1 h-14 px-5"
            disabled={loading}
          />
          <button
            onClick={handleScan}
            disabled={loading || !input.trim()}
            className="cyber-button-primary px-10 h-14 flex items-center justify-center gap-2 whitespace-nowrap"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-cyber-bg border-t-transparent rounded-full animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              `Run ${activeTabData.label} →`
            )}
          </button>
        </div>
        <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">
          {activeTab === 'phishing' && 'Heuristic engine checks TLD, brand spoofing, IP masking, subdomain abuse, and more.'}
          {activeTab === 'whois' && 'Queries RDAP (ICANN) + live DNS records. No API key required.'}
          {activeTab === 'ssl' && 'Connects to server and retrieves live TLS certificate chain. No external API needed.'}
        </p>
      </motion.div>

      {/* Console */}
      <CyberIntelligenceConsole isScanning={loading} type="url" target={input} />

      {/* Error */}
      {error && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="p-4 border border-red-500/50 bg-red-500/10 text-red-400 font-mono text-xs rounded-xl flex items-center gap-3">
          <span className="text-lg">⚠</span> {error}
        </motion.div>
      )}

      {/* ── Results ─────────────────────────────────────────────────────────────── */}
      <AnimatePresence mode="wait">
        {result && (

          /* ── PHISHING RESULT ─────────────────────────────────────── */
          result.mode === 'phishing' ? (
            <motion.div key="phishing" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className={`cyber-card p-8 space-y-8 relative overflow-hidden ${
                result.analysis?.riskLevel === 'dangerous' ? 'border-cyber-red/50 shadow-[0_0_24px_rgba(255,34,68,0.12)]' : ''
              }`}>
              {result.analysis?.riskLevel === 'dangerous' && (
                <div className="absolute top-0 inset-x-0 h-1 bg-cyber-red animate-pulse" />
              )}
              <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
                <ThreatGauge score={result.analysis.score} riskLevel={result.analysis.riskLevel} size={160} />
                <div className="flex-1 space-y-6">
                  <div>
                    <p className="font-mono text-cyber-muted text-[10px] uppercase tracking-widest">Phishing Detection — Heuristic Analysis</p>
                    <h2 className="text-2xl font-bold mt-1 font-display tracking-wider text-cyber-text">Score: {result.analysis.score}/100</h2>
                    <code className="text-cyber-muted text-xs font-mono mt-2 block break-all">{result.analysis.target}</code>
                  </div>
                  <div className="space-y-2">
                    <p className="font-mono text-[10px] uppercase tracking-wider text-cyber-muted mb-3">Triggered Heuristics</p>
                    {result.analysis.heuristics.map((h, i) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg text-xs font-mono ${
                        h.includes('No suspicious') ? 'bg-cyber-green/10 border border-cyber-green/30 text-cyber-green' : 'bg-cyber-red/10 border border-cyber-red/30 text-cyber-red'
                      }`}>
                        <span>{h.includes('No suspicious') ? '✓' : '⚑'}</span> {h}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

          /* ── WHOIS RESULT ─────────────────────────────────────────── */
          ) : result.mode === 'whois' ? (
            <motion.div key="whois" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="cyber-card p-6">
                <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyber-accent mb-1">Domain Scanned</p>
                <h2 className="font-display text-2xl text-white">{result.domain}</h2>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Registration Info">
                  <InfoRow label="Registrar" value={result.whois?.registrar} />
                  <InfoRow label="Registered" value={result.whois?.registered} />
                  <InfoRow label="Expires" value={result.whois?.expires} />
                  <InfoRow label="Status" value={result.whois?.status?.join(', ') || '—'} />
                  <InfoRow label="Nameservers" value={result.whois?.nameservers?.join(' | ') || '—'} />
                </Section>
                <Section title="DNS Records">
                  <InfoRow label="A Records (IP)" value={result.dns?.a?.join(', ') || '—'} highlight="text-cyber-accent" />
                  <InfoRow label="MX Records" value={result.dns?.mx?.join(', ') || '—'} />
                  <InfoRow label="NS Records" value={result.dns?.ns?.join(', ') || '—'} />
                  {result.dns?.txt?.map((t, i) => (
                    <InfoRow key={i} label={`TXT ${i + 1}`} value={t} />
                  ))}
                </Section>
              </div>
            </motion.div>

          /* ── SSL RESULT ───────────────────────────────────────────── */
          ) : result.mode === 'ssl' ? (
            <motion.div key="ssl" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
              <div className="cyber-card p-6 flex flex-col md:flex-row items-center md:items-start gap-8">
                <div className="text-center space-y-2">
                  <GradeBadge grade={result.ssl?.grade || 'B'} />
                  <p className="font-mono text-[10px] text-cyber-muted uppercase tracking-widest">SSL Grade</p>
                </div>
                <div className="flex-1 space-y-1">
                  <p className="font-mono text-[10px] uppercase tracking-[0.25em] text-cyber-accent">Certificate Subject</p>
                  <h2 className="font-display text-2xl text-white">{result.ssl?.subject}</h2>
                  <p className="font-mono text-xs text-cyber-muted mt-2">Issued by: {result.ssl?.issuer}</p>
                  <div className="flex flex-wrap gap-3 mt-4">
                    <span className={`text-[10px] font-mono px-3 py-1.5 rounded-lg border uppercase tracking-wider ${
                      result.ssl?.isValid ? 'bg-cyber-green/10 border-cyber-green/40 text-cyber-green' : 'bg-cyber-red/10 border-cyber-red/40 text-cyber-red'
                    }`}>
                      {result.ssl?.isValid ? '✓ Valid Certificate' : '✗ Certificate Invalid'}
                    </span>
                    {result.ssl?.isExpiringSoon && (
                      <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg border uppercase tracking-wider bg-yellow-400/10 border-yellow-400/40 text-yellow-400">
                        ⚠ Expiring Soon
                      </span>
                    )}
                    <span className="text-[10px] font-mono px-3 py-1.5 rounded-lg border bg-white/5 border-white/10 text-cyber-text uppercase">
                      {result.ssl?.daysLeft} Days Left
                    </span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Section title="Validity Period">
                  <InfoRow label="Valid From" value={result.ssl?.validFrom} />
                  <InfoRow label="Valid To" value={result.ssl?.validTo} highlight={result.ssl?.isExpiringSoon ? 'text-yellow-400' : ''} />
                  <InfoRow label="Protocol" value={result.ssl?.protocol} highlight="text-cyber-accent" />
                </Section>
                <Section title="Subject Alt Names (SANs)">
                  {result.ssl?.subjectAltNames?.length > 0
                    ? result.ssl.subjectAltNames.map((san, i) => (
                        <InfoRow key={i} label={`SAN ${i + 1}`} value={san} />
                      ))
                    : <p className="font-mono text-cyber-muted text-xs">No SANs found.</p>
                  }
                </Section>
              </div>
            </motion.div>
          ) : null
        )}
      </AnimatePresence>
    </div>
  );
}
