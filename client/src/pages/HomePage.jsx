import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';

// ─── Matrix Rain Canvas ───────────────────────────────────────────────────────
function MatrixRain() {
  const canvasRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let W = canvas.width = window.innerWidth;
    let H = canvas.height = window.innerHeight;
    const cols = Math.floor(W / 18);
    const drops = Array(cols).fill(1);
    const chars = 'アイウエオカキクケコ01ABCDEF</>{}[]#@!?';

    const draw = () => {
      ctx.fillStyle = 'rgba(2,8,20,0.055)';
      ctx.fillRect(0, 0, W, H);
      ctx.font = '13px monospace';
      drops.forEach((y, i) => {
        const char = chars[Math.floor(Math.random() * chars.length)];
        const bright = Math.random() > 0.95;
        ctx.fillStyle = bright ? '#00ffcc' : `rgba(0,191,255,${0.08 + Math.random() * 0.18})`;
        ctx.fillText(char, i * 18, y * 18);
        if (y * 18 > H && Math.random() > 0.975) drops[i] = 0;
        drops[i]++;
      });
    };

    const id = setInterval(draw, 55);
    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', resize);
    return () => { clearInterval(id); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={canvasRef} style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.35, pointerEvents: 'none', zIndex: 0 }} />;
}

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);
  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        let start = 0;
        const duration = 2500; // 2.5 seconds total duration for a smooth, slow feel
        const stepTime = Math.max(duration / to, 50); // Minimum 50ms between steps
        const id = setInterval(() => {
          start += 1;
          if (start >= to) { setVal(to); clearInterval(id); } else setVal(start);
        }, stepTime);
      }
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);
  return <span ref={ref}>{val}{suffix}</span>;
}

// ─── Glitch text ──────────────────────────────────────────────────────────────
function GlitchText({ text, color = '#00bfff' }) {
  return (
    <span style={{ position: 'relative', display: 'inline-block', color }}>
      {text}
      <span aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, color: '#ff003c',
        clipPath: 'polygon(0 30%,100% 30%,100% 50%,0 50%)',
        animation: 'glitch1 3.5s infinite', opacity: 0.7
      }}>{text}</span>
      <span aria-hidden="true" style={{
        position: 'absolute', top: 0, left: 0, color: '#00ffcc',
        clipPath: 'polygon(0 60%,100% 60%,100% 80%,0 80%)',
        animation: 'glitch2 3.5s infinite', opacity: 0.6
      }}>{text}</span>
    </span>
  );
}

// ─── Scan line overlay ────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100%', height: '100%',
      background: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,191,255,0.015) 2px,rgba(0,191,255,0.015) 4px)',
      pointerEvents: 'none', zIndex: 1
    }} />
  );
}

const COLOR_MAP = {
  blue: { rgb: '0,191,255', hex: '#00bfff', rgba30: 'rgba(0,191,255,0.3)' },
  green: { rgb: '0,255,136', hex: '#00ff88', rgba30: 'rgba(0,255,136,0.3)' },
  orange: { rgb: '255,140,0', hex: '#ff8c00', rgba30: 'rgba(255,140,0,0.3)' },
  red: { rgb: '255,34,68', hex: '#ff2244', rgba30: 'rgba(255,34,68,0.3)' },
  purple: { rgb: '180,0,255', hex: '#b400ff', rgba30: 'rgba(180,0,255,0.3)' },
};

// ─── Module card ──────────────────────────────────────────────────────────────
function ModuleCard({ icon, title, desc, tag, color, delay, onClick, locked, engine, intelCount }) {
  const { t } = useTranslation();
  const [hovered, setHovered] = useState(false);

  const c = COLOR_MAP[color] || COLOR_MAP.blue;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: delay / 1000 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
      style={{
        background: hovered ? `rgba(${c.rgb},0.08)` : 'rgba(10,18,35,0.85)',
        border: `1px solid ${hovered ? c.hex : 'rgba(0,191,255,0.15)'}`,
        borderRadius: 14,
        padding: '24px 20px',
        cursor: locked ? 'default' : 'pointer',
        transition: 'all 0.15s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: hovered ? 'translateY(-10px) scale(1.03)' : 'none',
        boxShadow: hovered ? `0 20px 40px rgba(${c.rgb},0.25)` : 'none',
        position: 'relative', overflow: 'hidden',
      }}
    >
      {/* Dynamic Glow Background */}
      <AnimatePresence>
        {hovered && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.1 }}
            exit={{ opacity: 0 }}
            style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at center, ${c.hex}, transparent 70%)` }}
          />
        )}
      </AnimatePresence>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16, position: 'relative', zIndex: 1 }}>
        <motion.span 
          animate={hovered ? { scale: 1.2, rotate: [0, -10, 10, 0] } : {}}
          style={{ fontSize: 28 }}
        >
          {icon}
        </motion.span>
        <span style={{
          fontSize: 9, letterSpacing: 1.5, fontWeight: 800,
          padding: '4px 10px', borderRadius: 4,
          background: `rgba(${c.rgb},0.15)`,
          color: c.hex,
          border: `1px solid ${c.rgba30}`,
          textTransform: 'uppercase'
        }}>{tag}</span>
      </div>

      <h3 style={{ fontSize: 16, fontWeight: 800, color: '#e0e6ff', margin: '0 0 10px', letterSpacing: 0.5, position: 'relative', zIndex: 1 }}>{title}</h3>
      <p style={{ fontSize: 12, color: '#5a7fa8', lineHeight: 1.6, margin: '0 0 16px', position: 'relative', zIndex: 1 }}>{desc}</p>
      
      {/* Advanced Engine & Intel Footer */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: c.hex, boxShadow: `0 0 5px ${c.hex}`, animation: 'pulse-ring 2s infinite' }} />
            <span style={{ fontSize: 9, color: c.hex, fontWeight: 800, letterSpacing: 1 }}>ENGINE</span>
          </div>
          <span style={{ fontSize: 10, color: '#e0e6ff', fontFamily: 'monospace' }}>{engine}</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, alignItems: 'flex-end' }}>
          <span style={{ fontSize: 9, color: '#00ff88', fontWeight: 800, letterSpacing: 1 }}>INTEL</span>
          <span style={{ fontSize: 10, color: '#00ff88', fontFamily: 'monospace' }}>{intelCount}</span>
        </div>
      </div>

      {locked && (
        <div style={{ marginTop: 12, fontSize: 10, color: '#ff2244', letterSpacing: 1, fontWeight: 700 }}>{t('home.modules.loginRequired')}</div>
      )}
    </motion.div>
  );
}


// ─── Threat ticker ────────────────────────────────────────────────────────────
const TICKER = [
  '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure',
  '🔴 ALERT: New Lumma Stealer campaign targeting Indian banks',
  '⚡ VirusTotal: 2.3M new IOCs detected in last 24h',
  '🛡 AbuseIPDB: 14,000+ IPs reported for DDoS activity today',
  '⚠ NCIIPC Advisory: Phishing attacks targeting UPI users',
  '🔴 CERT-In: Ransomware targeting MSME sector in India',
];

function LiveTicker() {
  return (
    <div style={{
      width: '100%', background: 'rgba(0,0,0,0.4)',
      borderBottom: '1px solid rgba(0,191,255,0.1)', borderTop: '1px solid rgba(0,191,255,0.1)',
      overflow: 'hidden', whiteSpace: 'nowrap', padding: '10px 0',
      position: 'absolute', top: 0, left: 0, zIndex: 10
    }}>
      <div style={{ display: 'inline-block', whiteSpace: 'nowrap', animation: 'ticker 40s linear infinite' }}>
        {[...TICKER, ...TICKER].map((text, i) => (
          <span key={i} style={{ color: '#00bfff', fontSize: 13, letterSpacing: 1, marginRight: 60, fontWeight: 600 }}>
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function HomePage() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [typedText, setTypedText] = useState('');
  const fullText = t('home.hero.subtitle');
  const [selectedMember, setSelectedMember] = useState(null);

  const team = [
    { name: 'Anil Kumar', role: 'Founder & Cybersecurity Analyst', color: '00bfff', email: 'official.cybershieldx@gmail.com', phone: '+919351636193', isFounder: true },
    { name: 'Suryansh Pandey', role: 'Data Analyst', color: '00ff88', email: 'pandeysuryansh560@gmail.com', phone: '+917565813054' },
    { name: 'Aryan Patel', role: 'AI & Machine Learning', color: 'ff8c00', email: 'aryanpatel9171235114@gmail.com', phone: '+919827035235' },
    { name: 'Pranav Kumar', role: 'Data Analyst', color: 'b400ff', email: 'Parmarpranav57@gmail.com', phone: '+918529395855' },
    { name: 'Ankita', role: 'Network Analyst', color: 'ff2244', email: 'pinksigar@gmail.com', phone: '' }
  ];

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < fullText.length) { setTypedText(fullText.slice(0, ++i)); }
      else clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, []);

  const modules = [
    {
      id: 'nmap',
      icon: '📡',
      title: 'Nmap',
      desc: 'Advanced network reconnaissance and port scanning engine.',
      engine: 'Nmap v7.94',
      intelCount: '65k+ Ports',
      tag: 'RECON',
      color: 'blue',
      path: '/toolkit/nmap',
    },
    {
      id: 'nikto',
      icon: '🧪',
      title: 'Nikto',
      desc: 'Comprehensive web server security and configuration auditing.',
      engine: 'Nikto v2.1.6',
      intelCount: '6.7k+ Tests',
      tag: 'VULNERABILITY',
      color: 'orange',
      path: '/toolkit/nikto',
    },
    {
      id: 'sqlmap',
      icon: '💉',
      title: 'SQLMap',
      desc: 'Automated SQL injection and database takeover engine.',
      engine: 'SQLMap v1.8',
      intelCount: 'DBMS Multi',
      tag: 'WEB',
      color: 'red',
      path: '/toolkit/sqlmap',
    },
    {
      id: 'john',
      icon: '🔨',
      title: 'John the Ripper',
      desc: 'Industrial-strength password auditing and hash cracking.',
      engine: 'John the Ripper',
      intelCount: 'Multi-Format',
      tag: 'PASSWORD',
      color: 'purple',
      path: '/toolkit/john',
    },
    {
      id: 'autopsy',
      icon: '🔍',
      title: 'Autopsy',
      desc: 'Digital forensics and incident response investigation suite.',
      engine: 'Autopsy v4.21',
      intelCount: 'OS Artifacts',
      tag: 'FORENSICS',
      color: 'blue',
      path: '/toolkit/autopsy',
    },
    {
      id: 'splunk',
      icon: '📊',
      title: 'Splunk',
      desc: 'Real-time security information and event management (SIEM).',
      engine: 'Splunk Core',
      intelCount: 'Real-time SIEM',
      tag: 'SOC',
      color: 'orange',
      path: '/toolkit/splunk',
    },
    {
      id: 'wiz',
      icon: '🧙',
      title: 'Wiz',
      desc: 'Cloud-native workload protection and risk assessment.',
      engine: 'Wiz Graph Engine',
      intelCount: 'Multi-Cloud',
      tag: 'CLOUD',
      color: 'blue',
      path: '/toolkit/wiz',
    },
    {
      id: 'virustotal',
      icon: '☣️',
      title: 'VirusTotal',
      desc: 'Unified intelligence from 70+ global security vendors.',
      engine: 'VirusTotal API',
      intelCount: '74+ Engines',
      tag: 'INTEL',
      color: 'red',
      path: '/toolkit/virustotal',
    },
    {
      id: 'breach',
      icon: '🛑',
      title: 'Have I Been Pwned',
      desc: 'Monitor data breaches and leaked credentials in real-time.',
      engine: 'HIBP / Breach-API',
      intelCount: '12B+ Records',
      tag: 'DARK WEB',
      color: 'red',
      path: '/breach-checker',
    },
    {
      id: 'vault',
      icon: '🗄️',
      title: 'Vault',
      desc: 'Secure AES-256 encrypted storage for sensitive assets.',
      engine: 'AES-256-GCM',
      intelCount: 'Encrypted',
      tag: 'ENCRYPTED',
      color: 'purple',
      path: '/vault',
    },
    {
      id: 'zerothreat',
      icon: '🤖',
      title: 'ZeroThreat',
      desc: 'Agentic AI driven penetration testing and reporting.',
      engine: 'GPT-4o Security',
      intelCount: 'Neural Intel',
      tag: 'AI',
      color: 'green',
      path: '/toolkit/zerothreat',
    },
    {
      id: 'mobsf',
      icon: '📱',
      title: 'MobSF',
      desc: 'Automated mobile app security analysis (iOS/Android).',
      engine: 'MobSF Analyzer',
      intelCount: 'Static/Dynamic',
      tag: 'MOBILE',
      color: 'red',
      path: '/toolkit/mobsf',
    },
    {
      id: 'sherlock',
      icon: '🕵️‍♂️',
      title: 'Sherlock',
      desc: 'Search username footprints across 300+ social platforms.',
      engine: 'Sherlock v0.14',
      intelCount: '300+ Targets',
      tag: 'OSINT',
      color: 'green',
      path: '/toolkit/sherlock',
    },
    {
      id: 'stegano',
      icon: '🖼️',
      title: 'Steghide',
      desc: 'Extract hidden text and files embedded inside image payloads.',
      engine: 'Steghide v0.5',
      intelCount: 'JPG/BMP/WAV',
      tag: 'FORENSICS',
      color: 'orange',
      path: '/toolkit/stegano',
    },
    {
      id: 'whatweb',
      icon: '🕸️',
      title: 'WhatWeb',
      desc: 'Passive technology profiling of remote web servers.',
      engine: 'WhatWeb v0.5.5',
      intelCount: '1.8k+ Signatures',
      tag: 'RECON',
      color: 'blue',
      path: '/toolkit/whatweb',
    },
    {
      id: 'exiftool',
      icon: '🧹',
      title: 'ExifTool',
      desc: 'Analyze and strip tracking geolocation and EXIF metadata.',
      engine: 'ExifTool v12.76',
      intelCount: 'GPS/EXIF/Tags',
      tag: 'PRIVACY',
      color: 'red',
      path: '/toolkit/exiftool',
    },
    {
      id: 'slither',
      icon: '🪙',
      title: 'Slither',
      desc: 'Static security analysis for Solidity smart contracts.',
      engine: 'Slither v0.10',
      intelCount: '30+ Checkers',
      tag: 'WEB3',
      color: 'purple',
      path: '/toolkit/slither',
    },
    {
      id: 'metasploit',
      icon: '🛡️',
      title: 'Metasploit',
      desc: 'Scan target hosts for known CVEs and coordinate payload validation.',
      engine: 'Metasploit v6.3',
      intelCount: '2.3k+ Exploits',
      tag: 'EXPLOIT',
      color: 'red',
      path: '/toolkit/metasploit',
    },
    {
      id: 'trivy',
      icon: '🐳',
      title: 'Trivy',
      desc: 'Scan container images, Kubernetes namespaces, and repositories for CVEs.',
      engine: 'Trivy v0.49',
      intelCount: 'Vulnerabilities',
      tag: 'CONTAINER',
      color: 'blue',
      path: '/toolkit/trivy',
    },
    {
      id: 'aircrack',
      icon: '📶',
      title: 'Aircrack-ng',
      desc: 'Monitor 802.11 packets, capture WPA handshakes, and dictionary audits.',
      engine: 'Aircrack-ng v1.7',
      intelCount: '802.11 Auditing',
      tag: 'WIRELESS',
      color: 'orange',
      path: '/toolkit/aircrack',
    },
  ];

  const stats = [
    { label: t('home.stats.threatModules'), value: 20, suffix: '', color: '#00bfff' },
    { label: t('home.stats.intelSources'), value: 24, suffix: '+', color: '#00ff88' },
    { label: t('home.stats.riskTiers'), value: 5, suffix: '', color: '#ff2244' },
    { label: t('home.stats.responseTime'), value: 15, suffix: 's', color: '#e0e6ff' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--cyber-bg, #020814)', fontFamily: '"JetBrains Mono", "Courier New", monospace', color: '#e0e6ff', overflowX: 'hidden', position: 'relative' }}>

      {/* CSS */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700;800&family=Orbitron:wght@700;900&display=swap');

        @keyframes glitch1 { 0%,100%{transform:translate(0)} 20%{transform:translate(-2px,1px)} 40%{transform:translate(2px,-1px)} 60%{transform:translate(-1px,2px)} }
        @keyframes glitch2 { 0%,100%{transform:translate(0)} 20%{transform:translate(2px,-1px)} 40%{transform:translate(-2px,1px)} 60%{transform:translate(1px,-2px)} }
        @keyframes fadeSlideUp { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
        @keyframes ticker { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
        @keyframes pulse-ring { 0%{transform:scale(0.8);opacity:0.8} 100%{transform:scale(2.2);opacity:0} }
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes scanline { 0%{top:-10%} 100%{top:110%} }
        @keyframes borderGlow {
          0%,100%{border-color:rgba(0,191,255,0.3)}
          50%{border-color:rgba(0,191,255,0.8)}
        }
        @keyframes gridFade { from{opacity:0} to{opacity:1} }

        .hero-title { font-family:'Orbitron',monospace; }
        .glow-text { text-shadow: 0 0 20px rgba(0,191,255,0.6), 0 0 40px rgba(0,191,255,0.3); }
        .card-hover { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .card-hover:hover { transform: translateY(-8px) scale(1.02); box-shadow: 0 15px 40px rgba(0,191,255,0.2); }
        .btn-primary {
          background: linear-gradient(135deg,#0066cc,#00bfff);
          border: none; border-radius: 8px; color: #fff;
          padding: 12px 28px; font-size: 13px; font-weight: 700;
          letter-spacing: 1.5px; cursor: pointer; font-family: inherit;
          box-shadow: 0 0 24px rgba(0,191,255,0.35);
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-primary:hover { box-shadow: 0 0 36px rgba(0,191,255,0.55); transform: translateY(-3px) scale(1.05); }
        .btn-secondary {
          background: transparent;
          border: 1px solid rgba(0,191,255,0.4); border-radius: 8px; color: #00bfff;
          padding: 12px 28px; font-size: 13px; font-weight: 600;
          letter-spacing: 1.5px; cursor: pointer; font-family: inherit;
          transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .btn-secondary:hover { background: rgba(0,191,255,0.08); border-color: #00bfff; transform: translateY(-3px); }

        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: #020814; }
        ::-webkit-scrollbar-thumb { background: rgba(0,191,255,0.3); border-radius: 3px; }
      `}</style>

      <MatrixRain />
      <ScanLine />
      <LiveTicker />

      {/* Team Modal Popup */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedMember(null)}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(8px)', padding: 20 }}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20, opacity: 0 }}
              animate={{ scale: 1, y: 0, opacity: 1 }}
              exit={{ scale: 0.9, y: 20, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: 'rgba(10,18,35,0.95)',
                border: `1px solid #${selectedMember.color}55`,
                borderRadius: 20, padding: 32, maxWidth: 360, width: '100%',
                position: 'relative', overflow: 'hidden', textAlign: 'center',
                boxShadow: `0 20px 60px rgba(0,0,0,0.5), 0 0 30px #${selectedMember.color}15`
              }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: `#${selectedMember.color}` }} />
              <button onClick={() => setSelectedMember(null)} style={{ position: 'absolute', top: 12, right: 16, background: 'transparent', border: 'none', color: '#5a7fa8', cursor: 'pointer', fontSize: 18 }}>×</button>

              <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                <img 
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(selectedMember.name)}&background=${selectedMember.color}&color=fff&rounded=true&bold=true&size=128`} 
                  style={{ width: 70, height: 70, borderRadius: '50%', border: `2px solid #${selectedMember.color}`, boxShadow: `0 0 15px #${selectedMember.color}33` }} 
                  alt="" 
                />
              </div>
              
              <h3 style={{ fontSize: 18, fontWeight: 800, color: '#fff', margin: '0 0 4px' }}>{selectedMember.name}</h3>
              <p style={{ fontSize: 9, color: `#${selectedMember.color}`, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 20 }}>{selectedMember.role}</p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, textAlign: 'left' }}>
                {selectedMember.email && (
                  <a href={`mailto:${selectedMember.email}`} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 12, textDecoration: 'none', color: '#e0e6ff', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 16 }}>✉</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 8, color: '#5a7fa8', textTransform: 'uppercase' }}>Email Address</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{selectedMember.email}</span>
                    </div>
                  </a>
                )}
                {selectedMember.phone && (
                  <a href={`tel:${selectedMember.phone}`} style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 12, textDecoration: 'none', color: '#e0e6ff', border: '1px solid rgba(255,255,255,0.05)' }}>
                    <span style={{ fontSize: 16 }}>📞</span>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 8, color: '#5a7fa8', textTransform: 'uppercase' }}>Direct Contact</span>
                      <span style={{ fontSize: 11, fontFamily: 'monospace' }}>{selectedMember.phone}</span>
                    </div>
                  </a>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── HERO ── */}
      <section style={{ position: 'relative', zIndex: 2, minHeight: '85vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px 20px', textAlign: 'center' }}>

        {/* Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,191,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,191,255,0.04) 1px,transparent 1px)',
          backgroundSize: '48px 48px', animation: 'gridFade 1.5s ease both',
          pointerEvents: 'none'
        }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '20%', left: '15%', width: 300, height: 300, background: 'radial-gradient(circle,rgba(0,191,255,0.06),transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '20%', right: '10%', width: 240, height: 240, background: 'radial-gradient(circle,rgba(0,255,136,0.05),transparent 70%)', borderRadius: '50%', animation: 'float 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />

        {/* Badge */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, border: '1px solid rgba(0,255,136,0.3)', background: 'rgba(0,255,136,0.05)', borderRadius: 20, padding: '6px 16px', marginBottom: 28, animation: 'fadeSlideUp 0.5s ease both' }}>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88', display: 'inline-block', boxShadow: '0 0 8px #00ff88' }} />
          <span style={{ fontSize: 11, letterSpacing: 3, color: '#00ff88', fontWeight: 600 }}>{t('home.hero.badge')}</span>
          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#00ff88', display: 'inline-block', animation: 'pulse-ring 1.5s infinite' }} />
        </div>

        {/* Main title */}
        <h1 className="hero-title" style={{ fontSize: 'clamp(42px,8vw,88px)', fontWeight: 900, lineHeight: 1, margin: '0 0 16px', animation: 'fadeSlideUp 0.6s 0.1s ease both', opacity: 0 }}>
          <GlitchText text="CYBER" color="#e0e6ff" />
          <span className="glow-text" style={{ color: '#00bfff' }}>SHIELD</span>
          <span style={{ color: '#00ff88', fontSize: '0.6em' }}>X</span>
        </h1>

        {/* Typewriter */}
        <p style={{ fontSize: 14, color: '#3b7a9e', letterSpacing: 2, marginBottom: 32, minHeight: 22, animation: 'fadeSlideUp 0.6s 0.2s ease both', opacity: 0 }}>
          {typedText}<span style={{ animation: 'pulse-ring 1s infinite', color: '#00bfff' }}>|</span>
        </p>

        {/* Description */}
        <p style={{ maxWidth: 580, fontSize: 14, color: '#5a7fa8', lineHeight: 1.8, marginBottom: 40, animation: 'fadeSlideUp 0.6s 0.3s ease both', opacity: 0 }}>
          {t('home.hero.desc')}
        </p>

        {/* Launch Console Action Button */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="mb-12 flex justify-center"
        >
          <button 
            onClick={() => navigate('/toolkit/nmap')}
            className="px-8 py-4 bg-gradient-to-r from-[#00bfff] to-blue-600 text-black font-display font-black text-xs uppercase tracking-[0.25em] rounded-xl hover:shadow-[0_0_35px_rgba(0,212,255,0.6)] hover:scale-105 transition-all duration-300 border border-[#00bfff]/30 flex items-center gap-3"
          >
            <span>🛡️</span> LAUNCH THREAT CONSOLE <span>→</span>
          </button>
        </motion.div>

        {/* CTA */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 56, animation: 'fadeSlideUp 0.6s 0.4s ease both', opacity: 0 }}>
          <button className="btn-primary" onClick={() => navigate('/signup')}>{t('home.hero.ctaCreate')}</button>
          <button className="btn-secondary" onClick={() => navigate('/login')}>{t('home.hero.ctaSignIn')}</button>
        </div>

        {/* Stats row */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.5 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16, maxWidth: 720, width: '100%' }}
        >
          {stats.map((s, i) => (
            <motion.div 
              key={i} 
              whileHover={{ scale: 1.05, borderColor: s.color, boxShadow: `0 0 20px ${s.color}25` }}
              style={{
                background: 'rgba(10,18,35,0.8)', border: '1px solid rgba(0,191,255,0.12)',
                borderRadius: 10, padding: '18px 12px', textAlign: 'center',
                transition: 'border-color 0.25s', cursor: 'default',
              }}
            >
              <div style={{ fontSize: 26, fontWeight: 900, color: s.color, fontFamily: 'Orbitron,monospace' }}>
                {String(s.label).toLowerCase().includes('time') ? `<${s.value}${s.suffix}` : <Counter to={s.value} suffix={s.suffix} />}
              </div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: '#3b5a7a', marginTop: 4 }}>{s.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ── MODULES SECTION ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', background: 'linear-gradient(180deg,transparent,rgba(0,10,25,0.95) 15%,rgba(0,10,25,0.95) 85%,transparent)' }}>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, letterSpacing: 4, color: '#00bfff', marginBottom: 12 }}>{t('home.modules.subtitle')}</p>
            <h2 className="hero-title" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#e0e6ff', margin: 0 }}>
              {t('home.modules.title')}
            </h2>
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,transparent,#00bfff,transparent)', margin: '20px auto 0' }} />
          </div>

          {/* Module grid */}
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
            gap: '16px' 
          }}>
            {modules.map((mod, i) => (
              <ModuleCard
                key={mod.id}
                {...mod}
                delay={i * 80}
                locked={false}
                onClick={() => navigate(mod.path)}
              />
            ))}
          </div>


        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            style={{ textAlign: 'center', marginBottom: 48 }}
          >
            <p style={{ fontSize: 11, letterSpacing: 4, color: '#00ff88', marginBottom: 12 }}>{t('home.workflow.subtitle')}</p>
            <h2 className="hero-title" style={{ fontSize: 'clamp(24px,3.5vw,36px)', fontWeight: 900, color: '#e0e6ff', margin: 0 }}>
              {t('home.workflow.title')}
            </h2>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))', gap: 24 }}>
            {[
              { step: '01', title: t('home.workflow.step1Title'), desc: t('home.workflow.step1Desc'), color: '#00bfff', icon: '📋' },
              { step: '02', title: t('home.workflow.step2Title'), desc: t('home.workflow.step2Desc'), color: '#00ff88', icon: '⚡' },
              { step: '03', title: t('home.workflow.step3Title'), desc: t('home.workflow.step3Desc'), color: '#ff8c00', icon: '🎯' },
            ].map((s, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, x: i === 0 ? -30 : i === 2 ? 30 : 0, y: i === 1 ? 30 : 0 }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{
                  background: 'rgba(10,18,35,0.85)', border: '1px solid rgba(0,191,255,0.1)',
                  borderRadius: 12, padding: 24,
                  position: 'relative', overflow: 'hidden'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <span style={{ fontFamily: 'Orbitron,monospace', fontSize: 22, fontWeight: 900, color: s.color }}>{s.step}</span>
                </div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: '#e0e6ff', margin: '0 0 10px' }}>{s.title}</h3>
                <p style={{ fontSize: 12, color: '#5a7fa8', lineHeight: 1.7, margin: 0 }}>{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEL SOURCES ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', background: 'rgba(0,8,20,0.7)' }}>
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p style={{ fontSize: 11, letterSpacing: 4, color: '#5a7fa8', marginBottom: 28 }}>{t('home.intelSources.subtitle')}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, justifyContent: 'center' }}>
            {[
              { name: 'VirusTotal', desc: t('home.intelSources.vtDesc'), color: '#00bfff' },
              { name: 'AbuseIPDB', desc: t('home.intelSources.abuseDesc'), color: '#ff8c00' },
              { name: 'Pulsedive', desc: 'Real-time threat feeds & risk scoring', color: '#00ff88' },
              { name: 'AlienVault OTX', desc: 'World largest open threat community', color: '#b400ff' },
              { name: 'GreyNoise', desc: 'Analyzing global internet scanning noise', color: '#ff2244' },
              { name: 'Shodan', desc: 'Deep device & network discovery intel', color: '#00d4ff' },
              { name: 'Cisco Talos', desc: 'Industry-leading threat intelligence', color: '#ffffff' },
              { name: 'HIBP (Breach)', desc: t('home.intelSources.hibpDesc'), color: '#ff2244' },
              { name: 'TLS / OpenSSL', desc: t('home.intelSources.tlsDesc'), color: '#00ff88' },
            ].map((src, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.05, borderColor: src.color, boxShadow: `0 0 20px ${src.color}30` }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                onClick={() => navigate(user ? '/toolkit/virustotal' : '/signup')}
                style={{
                  background: 'rgba(10,18,35,0.9)', border: `1px solid ${src.color}25`,
                  borderRadius: 10, padding: '16px 22px', minWidth: 180,
                  transition: 'border-color 0.2s',
                  cursor: 'pointer'
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 700, color: src.color, marginBottom: 4 }}>{src.name}</div>
                <div style={{ fontSize: 11, color: '#3b5a7a' }}>{src.desc}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', textAlign: 'center' }}>
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <div style={{ position: 'relative', display: 'inline-block', marginBottom: 24 }}>
            <motion.div 
              animate={{ boxShadow: ['0 0 20px rgba(0,191,255,0.3)', '0 0 40px rgba(0,191,255,0.6)', '0 0 20px rgba(0,191,255,0.3)'] }}
              transition={{ duration: 2, repeat: Infinity }}
              style={{ width: 80, height: 80, background: 'linear-gradient(135deg,#003366,#006699)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, margin: '0 auto' }}
            >
              🛡
            </motion.div>
            <div style={{ position: 'absolute', inset: -8, borderRadius: '50%', border: '1px solid rgba(0,191,255,0.3)', animation: 'pulse-ring 2s infinite' }} />
          </div>
          <h2 className="hero-title" style={{ fontSize: 'clamp(24px,4vw,38px)', fontWeight: 900, color: '#e0e6ff', margin: '0 0 16px' }}>
            {t('home.finalCta.title')}
          </h2>
          <p style={{ fontSize: 14, color: '#5a7fa8', lineHeight: 1.8, marginBottom: 36 }}>
            {t('home.finalCta.desc')}
          </p>
          <div style={{ display: 'flex', gap: 14, justifyContent: 'center', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => navigate('/signup')} style={{ fontSize: 14, padding: '14px 36px' }}>
              {t('home.hero.ctaLaunch')}
            </button>
            <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: 14, padding: '14px 36px' }}>
              {t('home.hero.ctaSignIn')}
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── PREMIUM FOOTER ── */}
      <footer style={{
        position: 'relative',
        zIndex: 2,
        marginTop: 20,
        background: 'linear-gradient(180deg, rgba(2,8,20,0) 0%, rgba(2,8,20,0.95) 20%, #020814 100%)',
        borderTop: '1px solid rgba(0,191,255,0.1)',
        padding: '30px 24px 20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 32
      }}>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textAlign: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', fontFamily: 'Orbitron,monospace', fontSize: 16, fontWeight: 900, letterSpacing: 1 }}>
            <span style={{ color: '#e0e6ff' }}>CYBER</span>
            <span style={{ color: '#00bfff', textShadow: '0 0 10px rgba(0,191,255,0.5)' }}>SHIELD</span>
            <span style={{ color: '#00ff88', fontSize: '0.6em', marginLeft: 4 }}>X</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#64748b', fontSize: 10, fontFamily: '"JetBrains Mono", monospace' }}>
            <span style={{ color: '#00bfff' }}>✉</span>
            <a href="mailto:official.cybershieldx@gmail.com" style={{ color: '#64748b', textDecoration: 'none', transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = '#64748b'}>
              official.cybershieldx@gmail.com
            </a>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { label: 'Platform', path: '/login' },
            { label: 'Security', path: '/security' },
            { label: 'Live Modules', path: '/login' },
            { label: 'Create Account', path: '/signup' },
            { label: 'Contact Support', path: 'tel:+919351636193', external: true },
            ...(user?.role === 'admin' ? [{ label: 'Admin Portal', path: '/nexus-admin' }] : [])
          ].map((item, i) => (
            item.external ? (
              <a key={i} href={item.path} style={{
                color: '#475569', textDecoration: 'none', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.3s'
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00bfff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
              >
                {item.label}
              </a>
            ) : (
              <Link key={i} to={item.path} style={{
                color: '#475569', textDecoration: 'none', fontSize: 9, fontWeight: 700, letterSpacing: 1, textTransform: 'uppercase', transition: 'all 0.3s'
              }}
                onMouseEnter={e => { e.currentTarget.style.color = '#00bfff'; }}
                onMouseLeave={e => { e.currentTarget.style.color = '#475569'; }}
              >
                {item.label}
              </Link>
            )
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ fontSize: 8, color: '#334155', letterSpacing: 2, textTransform: 'uppercase', fontWeight: 800 }}>Nexus Command Core</div>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, width: '100%' }}>
            {/* Founder Card - Parent (Slightly larger) */}
            <div 
              onClick={() => setSelectedMember(team.find(t => t.isFounder))}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                background: 'rgba(0,191,255,0.06)',
                padding: '12px 24px', borderRadius: '12px 24px',
                border: '1px solid rgba(0,191,255,0.3)',
                cursor: 'pointer', transition: 'all 0.3s', minWidth: 160
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.12)';
                e.currentTarget.style.borderColor = 'rgba(0,191,255,0.6)';
                e.currentTarget.style.transform = 'translateY(-2px)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(0,191,255,0.3)';
                e.currentTarget.style.transform = 'none';
              }}
            >
              <div style={{ position: 'relative' }}>
                <img src="https://ui-avatars.com/api/?name=Anil+Kumar&background=00bfff&color=fff&rounded=true&bold=true" alt="Anil Kumar" style={{ width: 22, height: 22, borderRadius: '50%' }} />
                <div style={{ position: 'absolute', inset: -4, borderRadius: '50%', border: '1px solid rgba(0,191,255,0.4)', animation: 'pulse-ring 2s infinite' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <span style={{ fontSize: 11, color: '#fff', fontWeight: 900, letterSpacing: 0.5 }}>Anil Kumar</span>
                <span style={{ fontSize: 8, color: '#00bfff', textTransform: 'uppercase', fontWeight: 800 }}>Founder & Cybersecurity Analyst</span>
              </div>
            </div>

            {/* Visual connector (optional tree line) */}
            <div style={{ width: 1, height: 12, background: 'rgba(255,255,255,0.1)' }} />

            {/* Team Members - Children */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, justifyContent: 'center', maxWidth: 900 }}>

            {/* Team Members - Same Small Size */}
            {team.filter(t => !t.isFounder).map((member, i) => (
              <div key={i} 
                onClick={() => setSelectedMember(member)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  background: 'rgba(255,255,255,0.02)',
                  padding: '8px 16px', borderRadius: '8px 20px',
                  border: '1px solid rgba(255,255,255,0.05)',
                  transition: 'all 0.2s',
                  cursor: 'pointer', minWidth: 130
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.borderColor = `#${member.color}66`;
                  e.currentTarget.style.background = `rgba(${COLOR_MAP[member.color]?.rgb || '255,255,255'}, 0.04)`;
                  e.currentTarget.style.transform = 'translateY(-2px)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.borderColor = 'rgba(255,255,255,0.05)';
                  e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <img src={`https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=${member.color}&color=fff&rounded=true&bold=true`} alt={member.name} style={{ width: 18, height: 18, borderRadius: '50%' }} />
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: '#cbd5e1', fontWeight: 700 }}>{member.name}</span>
                  <span style={{ fontSize: 7, color: '#5a7fa8', textTransform: 'uppercase' }}>{member.role}</span>
                </div>
              </div>
            ))}
            </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: 800, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 12, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ color: '#475569', fontSize: 9, textAlign: 'center', letterSpacing: 1, display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'center' }}>
            <span>© {new Date().getFullYear()} CYBERSHIELD X. {t('home.footer.allRightsReserved')}</span>
            <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
              <Link to="/privacy" style={{ color: '#00bfff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Privacy Policy</Link>
              <span style={{ color: '#334155' }}>|</span>
              <Link to="/terms" style={{ color: '#00bfff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Terms of Service</Link>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 8, color: '#334155', textTransform: 'uppercase', letterSpacing: 2, marginTop: 4 }}>
            <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#00ff88', boxShadow: '0 0 5px #00ff88', animation: 'pulse-ring 2s infinite' }} />
            {t('home.footer.allSystemsOperational')}
          </div>
        </div>
      </footer>
    </div>
  );
}
