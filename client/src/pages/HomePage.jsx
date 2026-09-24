import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { getAllTools } from '../components/toolkit/toolConfig';
import BrandLogo from '../components/common/BrandLogo';
import NexusCategoryGrid from '../components/home/NexusCategoryGrid';
import ToolGrid from '../components/toolkit/cards/ToolGrid';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import BinaryMatrixRain from '../components/home/BinaryMatrixRain';
import {
  Shield,
  Lock,
  Terminal,
  ArrowRight,
  CheckCircle2,
  ChevronRight,
  Menu,
  X,
  Activity,
  Search,
  Database,
  Globe,
  Cpu,
  Zap,
} from 'lucide-react';

// ─── Animated Counter Component ───────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    if (shouldReduceMotion) {
      setVal(to);
      return;
    }

    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const duration = 1800;
          const stepTime = Math.max(Math.floor(duration / (to || 1)), 25);
          const timer = setInterval(() => {
            start += Math.ceil(to / 40) || 1;
            if (start >= to) {
              setVal(to);
              clearInterval(timer);
            } else {
              setVal(start);
            }
          }, stepTime);
        }
      },
      { threshold: 0.3 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to, shouldReduceMotion]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ─── Live Threat Ticker ───────────────────────────────────────────────────────
const THREAT_ALERTS = [
  'CRITICAL: Active 0-Day Exploit Detected in Public Cloud Gateway',
  'ALERT: Targeted Credential Stuffing Campaign Against Banking APIs',
  'TELEMETRY: 2.8M Network IOCs Correlated Across Global Feeds',
  'ADVISORY: Zero-Day Phishing Campaign Mimicking MFA Portals',
  'INTEL: Suspicious ASN Traffic Spike Identified & Contained',
  'SURFACE: 14,000+ Compromised Hosts Tracked in Threat Fabric',
];

function LiveTicker() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <div className="w-full bg-[#030914] border-b border-cyan-500/20 py-2 px-4 overflow-hidden relative z-30 select-none">
      <div className="max-w-7xl mx-auto flex items-center gap-3">
        <div className="flex items-center gap-2 shrink-0 bg-red-500/10 border border-red-500/30 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold text-red-400">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
          <span>THREAT FEED</span>
        </div>
        <div className="overflow-hidden whitespace-nowrap flex-1">
          <div
            className={`inline-block ${
              shouldReduceMotion ? '' : 'animate-[marquee_45s_linear_infinite]'
            }`}
          >
            {[...THREAT_ALERTS, ...THREAT_ALERTS].map((item, idx) => (
              <span
                key={idx}
                className="text-xs font-mono text-cyan-300/80 mr-12 tracking-wide inline-flex items-center gap-2"
              >
                <span className="text-cyan-500">•</span>
                <span>{item}</span>
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Public Header / Navigation Bar ───────────────────────────────────────────
function PublicNavbar({ user }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const navLinks = [
    { label: 'Tools & Modules', href: '#tools' },
    { label: 'Capabilities', href: '#capabilities' },
    { label: 'Threat Lifecycle', href: '#lifecycle' },
    { label: 'Intelligence', href: '#intelligence' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-[#020814]/90 backdrop-blur-xl border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
        {/* Brand */}
        <Link to="/" className="inline-flex items-center gap-3 group focus:outline-none">
          <div className="p-1.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 group-hover:border-cyan-400 shadow-[0_0_15px_rgba(0,212,255,0.2)] transition-all">
            <BrandLogo size={28} />
          </div>
          <div>
            <span className="font-display font-black text-base tracking-wider text-white group-hover:text-cyan-400 transition-colors block">
              CYBERSHIELD X
            </span>
            <span className="text-[9px] font-mono text-cyan-400/80 tracking-widest uppercase block">
              Security Operations Hub
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-mono tracking-wider uppercase">
          {navLinks.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-slate-300 hover:text-cyan-400 transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            to="/toolkit"
            className="text-slate-300 hover:text-cyan-400 transition-colors"
          >
            Toolkit Catalog
          </Link>
        </nav>

        {/* Auth CTA Actions */}
        <div className="hidden sm:flex items-center gap-3">
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] flex items-center gap-2"
            >
              <Terminal size={14} />
              <span>Enter Console</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/login')}
                className="px-3.5 py-1.5 rounded-xl border border-slate-700 hover:border-cyan-400 text-slate-200 hover:text-white font-mono text-xs uppercase tracking-wider transition-colors"
              >
                Sign In
              </button>
              <button
                onClick={() => navigate('/signup')}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-xs font-mono uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(0,212,255,0.3)] flex items-center gap-2"
              >
                <span>Launch Workstation</span>
                <ArrowRight size={14} />
              </button>
            </>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex sm:hidden items-center">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle Navigation Menu"
            className="p-2 rounded-lg border border-slate-800 text-slate-300 hover:text-white hover:border-cyan-500/50"
          >
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="sm:hidden bg-[#030918] border-b border-cyan-500/20 px-4 py-6 space-y-4"
          >
            <nav className="flex flex-col space-y-3 font-mono text-xs uppercase tracking-wider">
              {navLinks.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="text-slate-300 hover:text-cyan-400 py-1"
                >
                  {link.label}
                </a>
              ))}
              <Link
                to="/toolkit"
                onClick={() => setMobileMenuOpen(false)}
                className="text-slate-300 hover:text-cyan-400 py-1"
              >
                Toolkit Catalog
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-800 flex flex-col gap-2.5">
              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/dashboard');
                  }}
                  className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider"
                >
                  Enter Console
                </button>
              ) : (
                <>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/login');
                    }}
                    className="w-full py-2.5 rounded-xl border border-slate-700 text-slate-200 font-mono text-xs uppercase tracking-wider"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      navigate('/signup');
                    }}
                    className="w-full py-2.5 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs font-mono uppercase tracking-wider flex items-center justify-center gap-2"
                  >
                    <span>Launch Workstation</span>
                    <ArrowRight size={14} />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

// ─── Main Public Home Page Component ──────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();

  const [alternativeToolModal, setAlternativeToolModal] = useState(null);

  const allTools = getAllTools();
  // Select 6 featured tools across core categories for the discovery preview
  const featuredTools = allTools
    .filter((t) =>
      [
        'UrlEngine',
        'PortEngine',
        'DnsEngine',
        'BreachWatch',
        'CloudAuditor',
        'WebVulnScan',
      ].includes(t.id)
    )
    .slice(0, 6);

  // Fallback if specific IDs differ
  const displayTools = featuredTools.length >= 4 ? featuredTools : allTools.slice(0, 6);

  const stats = [
    { label: 'Defense Modules', value: allTools.length, suffix: '+', color: '#00d4ff' },
    { label: 'Intel Feeds', value: 35, suffix: '+', color: '#10b981' },
    { label: 'Risk Tiers', value: 5, suffix: '', color: '#f59e0b' },
    { label: 'Scan Latency', value: 15, suffix: 's', color: '#38bdf8' },
  ];

  return (
    <div className="min-h-screen bg-[#020814] text-slate-100 font-sans relative overflow-x-hidden selection:bg-cyan-500 selection:text-slate-950">
      {/* Live Threat Ticker */}
      <LiveTicker />

      {/* Public Navigation */}
      <PublicNavbar user={user} />

      {/* Binary Matrix Rain Canvas (Step 4C) */}
      <BinaryMatrixRain className="opacity-20" />

      {/* Ambient Cyber Background Lighting */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[450px] bg-cyan-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-[800px] right-10 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[400px] left-10 w-[600px] h-[600px] bg-sky-600/5 rounded-full blur-[150px] pointer-events-none" />

      {/* ── 1. HERO SECTION ── */}
      <section className="relative z-10 pt-16 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center flex flex-col items-center justify-center min-h-[75vh]">
        {/* Platform Status Badge */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-6 shadow-[0_0_15px_rgba(0,212,255,0.15)]"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>CYBERSOC THREAT DEFENSE PLATFORM</span>
        </motion.div>

        {/* Hero Title */}
        <motion.h1
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-tight text-white uppercase max-w-5xl leading-[1.1]"
        >
          CYBER<span className="text-cyan-400 text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-emerald-400">SHIELD</span> X
        </motion.h1>

        {/* Platform Value Proposition */}
        <motion.p
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="mt-6 text-base sm:text-xl text-slate-300 max-w-3xl leading-relaxed font-light"
        >
          Unified defensive intelligence, automated reconnaissance, credential leak detection, and vulnerability assessments across <span className="text-cyan-400 font-semibold">{allTools.length} security tool models</span>.
        </motion.p>

        {/* Call to Actions */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-8 flex flex-col sm:flex-row items-center gap-4 justify-center w-full max-w-md"
        >
          {user ? (
            <button
              onClick={() => navigate('/dashboard')}
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,212,255,0.35)] flex items-center justify-center gap-2"
            >
              <span>Access SOC Dashboard</span>
              <ArrowRight size={16} />
            </button>
          ) : (
            <>
              <button
                onClick={() => navigate('/signup')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-[0.99] text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_25px_rgba(0,212,255,0.35)] flex items-center justify-center gap-2"
              >
                <span>Launch Free Workstation</span>
                <ArrowRight size={16} />
              </button>
              <button
                onClick={() => navigate('/login')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 hover:border-cyan-400 bg-[#0c162d]/60 text-slate-200 hover:text-white font-semibold text-sm uppercase tracking-wider transition-colors"
              >
                Sign In
              </button>
            </>
          )}
        </motion.div>

        {/* Operational Statistics Matrix */}
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-10 w-full max-w-4xl pt-10 border-t border-slate-800/80"
        >
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <div
                style={{ color: s.color }}
                className="text-3xl sm:text-4xl font-bold font-mono tracking-tight mb-1"
              >
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div className="text-[11px] font-mono text-slate-400 uppercase tracking-widest">
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── 2. FEATURED SECURITY TOOLS PREVIEW ── */}
      <section id="tools" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <Zap size={14} />
            <span>INTEGRATED DEFENSE ENGINES</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Security Tool Discovery Preview
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Directly invoke verified threat intelligence, automated network probes, and breach scanners engineered with zero-trust isolation.
          </p>
        </div>

        {/* Featured Tool Card Grid (Step 4B/4C External-Only Discovery) */}
        <ToolGrid
          tools={displayTools}
          onExternalDiscovery={(tool) => setAlternativeToolModal(tool)}
        />

        {/* Catalog CTA */}
        <div className="mt-12 text-center">
          <button
            onClick={() => navigate('/toolkit')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-cyan-500/30 bg-[#0c162d]/80 hover:bg-cyan-500/10 hover:border-cyan-400 text-cyan-300 font-mono text-xs uppercase tracking-wider font-bold transition-all shadow-[0_0_20px_rgba(0,212,255,0.15)]"
          >
            <span>Explore All {allTools.length} Security Tools</span>
            <ChevronRight size={14} />
          </button>
        </div>
      </section>

      {/* ── 3. CAPABILITY / CATEGORY SECTION ── */}
      <section id="capabilities" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-emerald-400 uppercase tracking-widest mb-3">
            <Globe size={14} />
            <span>MODULAR ARCHITECTURE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            24 Canonical Defense Categories
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Structured defensive capabilities categorized according to industrial cybersecurity standards and SOC operations requirements.
          </p>
        </div>

        {/* Nexus Category Grid Component */}
        <NexusCategoryGrid />
      </section>

      {/* ── 4. HOW IT WORKS: UNIFIED LIFECYCLE ── */}
      <section id="lifecycle" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-14">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <Activity size={14} />
            <span>OPERATIONAL WORKFLOW</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Unified Threat Investigation Lifecycle
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            From preliminary reconnaissance to evidence verification and automated incident mitigation.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            {
              step: '01',
              title: 'Reconnaissance & Asset Audit',
              desc: 'Continuous scanning of host boundaries, DNS records, open service ports, and exposed cloud buckets with verifiable rate control.',
              icon: Search,
              accent: '#00d4ff',
            },
            {
              step: '02',
              title: 'Deterministic Risk Synthesis',
              desc: 'Multi-source risk scoring correlates findings, CVE telemetry, and live threat feeds with transparent evidence audit trails.',
              icon: Cpu,
              accent: '#10b981',
            },
            {
              step: '03',
              title: 'Verification & Remediation',
              desc: 'Cryptographic SHA-256 evidence package sealing and human-approved response workflows ensuring reliable remediation.',
              icon: Shield,
              accent: '#f59e0b',
            },
          ].map((item, idx) => {
            const IconComponent = item.icon;
            return (
              <motion.div
                key={item.step}
                initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: idx * 0.1 }}
                className="p-8 rounded-2xl bg-[#0c162d]/80 border border-slate-800 hover:border-cyan-500/40 backdrop-blur-xl transition-all shadow-[0_8px_30px_rgba(0,0,0,0.4)] flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div
                      style={{ color: item.accent }}
                      className="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80"
                    >
                      <IconComponent size={24} />
                    </div>
                    <span
                      style={{ color: item.accent }}
                      className="text-2xl font-black font-mono"
                    >
                      {item.step}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight mb-3">
                    {item.title}
                  </h3>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    {item.desc}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── 5. GLOBAL INTEL SOURCES ── */}
      <section id="intelligence" className="relative z-10 py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto border-t border-slate-800/60">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 text-xs font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <Database size={14} />
            <span>GLOBAL COVERAGE</span>
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Integrated Threat Intelligence Feeds
          </h2>
          <p className="mt-3 text-sm text-slate-400 leading-relaxed">
            Synchronized telemetry feeds providing high-confidence malicious indicator ratings and IP reputation analysis.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {[
            { name: 'UrlEngine', desc: 'Real-time URL & Domain reputation metrics', color: '#00d4ff' },
            { name: 'Pulsedive', desc: 'Threat indicator feeds & risk classification', color: '#10b981' },
            { name: 'AlienVault OTX', desc: 'Open threat exchange indicator matrix', color: '#a855f7' },
            { name: 'GreyNoise', desc: 'Global internet mass-scanner filtering', color: '#f43f5e' },
            { name: 'PortEngine', desc: 'Port scanner & service fingerprinting', color: '#38bdf8' },
            { name: 'Cisco Talos', desc: 'Authoritative IP & domain reputation', color: '#fb923c' },
            { name: 'HIBP Breach Feed', desc: 'Compromised credential breach telemetry', color: '#ef4444' },
            { name: 'TLS / OpenSSL', desc: 'Cryptographic certificate validity auditing', color: '#2dd4bf' },
          ].map((feed) => (
            <div
              key={feed.name}
              className="p-4 rounded-xl bg-[#0c162d]/70 border border-slate-800 hover:border-cyan-500/30 transition-all flex flex-col justify-between"
            >
              <div>
                <div
                  style={{ color: feed.color }}
                  className="font-mono font-bold text-sm mb-1 tracking-tight"
                >
                  {feed.name}
                </div>
                <div className="text-xs text-slate-400 leading-relaxed">
                  {feed.desc}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. FINAL CALL TO ACTION ── */}
      <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto text-center border-t border-slate-800/60">
        <motion.div
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="p-10 sm:p-14 rounded-3xl bg-[#0c162d]/90 border border-cyan-500/30 backdrop-blur-xl shadow-[0_15px_50px_rgba(0,0,0,0.6)]"
        >
          <div className="inline-flex p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 shadow-[0_0_20px_rgba(0,212,255,0.25)] mb-6">
            <BrandLogo size={42} />
          </div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white tracking-tight">
            Ready to Protect Your Infrastructure?
          </h2>
          <p className="mt-4 text-sm sm:text-base text-slate-300 max-w-xl mx-auto leading-relaxed">
            Deploy automated security scans, inspect attack surfaces, and secure your systems with the CyberShield X platform today.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3.5 justify-center items-center">
            {user ? (
              <button
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)]"
              >
                Enter Dashboard
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/signup')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(0,212,255,0.3)] flex items-center justify-center gap-2"
                >
                  <span>Create Operator Account</span>
                  <ArrowRight size={16} />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl border border-slate-700 hover:border-cyan-400 bg-slate-900/60 text-slate-200 text-sm font-semibold uppercase tracking-wider transition-colors"
                >
                  Sign In
                </button>
              </>
            )}
          </div>
        </motion.div>
      </section>

      {/* ── 7. PUBLIC FOOTER ── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-[#020814] py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-col items-center gap-8 text-center">
          {/* Brand */}
          <div className="flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 font-display font-black text-lg tracking-wider text-white">
              <span>CYBERSHIELD</span>
              <span className="text-cyan-400">X</span>
            </div>
            <div className="text-xs font-mono text-slate-400">
              official.cybershieldx@gmail.com
            </div>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap justify-center gap-6 text-xs font-mono uppercase tracking-wider text-slate-400">
            <Link to="/login" className="hover:text-cyan-400 transition-colors">
              Platform
            </Link>
            <Link to="/security" className="hover:text-cyan-400 transition-colors">
              Security
            </Link>
            <Link to="/team" className="hover:text-cyan-400 transition-colors">
              Core Team
            </Link>
            <Link to="/toolkit" className="hover:text-cyan-400 transition-colors">
              Live Models
            </Link>
            <Link to="/contact" className="hover:text-cyan-400 transition-colors">
              Contact Us
            </Link>
            <Link to="/signup" className="hover:text-cyan-400 transition-colors">
              Create Account
            </Link>
            <Link to="/privacy" className="hover:text-cyan-400 transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-cyan-400 transition-colors">
              Terms of Service
            </Link>
          </div>

          {/* Tactical Version & Copyright */}
          <div className="pt-6 border-t border-slate-800/60 w-full max-w-4xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-slate-500">
            <div className="inline-flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span className="text-slate-400 font-semibold">CYBERSHIELD X PLATFORM</span>
              <span>•</span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-[10px]">
                v62.2.0
              </span>
            </div>
            <div>
              © {new Date().getFullYear()} CYBERSHIELD X. All rights reserved. Zero-trust protected.
            </div>
          </div>
        </div>
      </footer>

      {/* ── Verified External Alternatives Modal (Step 4C External-Only Flow) ── */}
      <ExternalAlternativesModal
        tool={alternativeToolModal}
        isOpen={Boolean(alternativeToolModal)}
        onClose={() => setAlternativeToolModal(null)}
        onOpenNativeTool={(tool) => {
          if (tool?.id) {
            navigate(user ? `/toolkit/${tool.id}` : '/login');
          }
        }}
      />
    </div>
  );
}
