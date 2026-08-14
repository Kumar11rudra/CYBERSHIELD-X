import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { getAllTools } from '../components/toolkit/toolConfig';
import NexusCategoryGrid from '../components/home/NexusCategoryGrid';

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




// ─── Threat ticker ────────────────────────────────────────────────────────────
const TICKER = [
  '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure',
  '🔴 ALERT: New Lumma Stealer campaign targeting Indian banks',
  '⚡ UrlEngine: 2.3M new IOCs detected in last 24h',
  '🛡 UrlEngine: 14,000+ IPs reported for DDoS activity today',
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






  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < fullText.length) { setTypedText(fullText.slice(0, ++i)); }
      else clearInterval(id);
    }, 45);
    return () => clearInterval(id);
  }, []);



  const stats = [
    { label: t('home.stats.threatModules'), value: getAllTools().length, suffix: '', color: '#00bfff' },
    { label: t('home.stats.intelSources'), value: 35, suffix: '+', color: '#00ff88' },
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



      {/* ── HERO ── */}
      <section style={{ 
        position: 'relative', 
        zIndex: 2, 
        minHeight: '88vh', 
        display: 'flex', 
        flexDirection: 'column',
        alignItems: 'center', 
        justifyContent: 'center', 
        padding: '95px 24px 55px', 
        textAlign: 'center',
      }}>
        {/* Animated Grid background */}
        <div style={{
          position: 'absolute', inset: 0,
          backgroundImage: 'linear-gradient(rgba(0,191,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,191,255,0.04) 1px,transparent 1px)',
          backgroundSize: '48px 48px', animation: 'gridFade 1.5s ease both',
          pointerEvents: 'none'
        }} />

        {/* Glow orbs */}
        <div style={{ position: 'absolute', top: '15%', left: '8%', width: 400, height: 400, background: 'radial-gradient(circle,rgba(0,191,255,0.07),transparent 70%)', borderRadius: '50%', animation: 'float 8s ease-in-out infinite', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: '15%', right: '8%', width: 320, height: 320, background: 'radial-gradient(circle,rgba(0,255,136,0.06),transparent 70%)', borderRadius: '50%', animation: 'float 10s ease-in-out infinite reverse', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: 700, height: 700, background: 'radial-gradient(circle,rgba(0,191,255,0.04),transparent 65%)', borderRadius: '50%', animation: 'float 14s ease-in-out infinite', pointerEvents: 'none' }} />

        {/* Main Brand Lockup Wrapper — X-Aligned CyberNexus Platform Branding */}
        <div style={{ position: 'relative', display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', zIndex: 2, marginBottom: 18 }}>
          {/* Main CYBER SHIELD X title */}
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            style={{
              fontSize: 'clamp(28px, 6vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.1,
              margin: 0,
              letterSpacing: '-1px',
              position: 'relative',
              whiteSpace: 'nowrap',
            }}
          >
            <GlitchText text="CYBER" color="#e0e6ff" />
            <span className="glow-text" style={{ color: '#00bfff', marginLeft: '0.18em', textShadow: '0 0 40px rgba(0,191,255,0.8), 0 0 80px rgba(0,191,255,0.4)' }}> SHIELD</span>
            <span style={{ color: '#00ff88', fontSize: '0.6em', marginLeft: '0.2em', verticalAlign: 'middle', textShadow: '0 0 20px rgba(0,255,136,0.8)' }}>X</span>
          </motion.h1>

          {/* Platform Sub-Branding: Next-Gen Threat Intelligence */}
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            whileHover={{ scale: 1.02 }}
            style={{
              fontSize: 'clamp(10px, 1.2vw, 13px)',
              fontFamily: '"JetBrains Mono", monospace',
              letterSpacing: '2.5px',
              textTransform: 'uppercase',
              marginTop: 4,
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'default',
              position: 'relative',
              paddingRight: '0.1em'
            }}
          >
            <span style={{ color: 'rgba(224, 230, 255, 0.55)', fontWeight: 500 }}>INTELLIGENCE</span>
            <motion.span 
              animate={{ 
                textShadow: [
                  '0 0 10px rgba(0,191,255,0.4)', 
                  '0 0 20px rgba(0,191,255,0.85)', 
                  '0 0 10px rgba(0,191,255,0.4)'
                ] 
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{
                color: '#00bfff',
                fontWeight: 700,
                letterSpacing: '3px',
                position: 'relative',
                display: 'inline-block'
              }}
            >
              PLATFORM
              {/* Subtle Cyan Scanning Highlight Underline */}
              <motion.span
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ scaleX: 1, opacity: [0, 1, 0.7] }}
                transition={{ duration: 0.8, delay: 0.6 }}
                style={{
                  position: 'absolute',
                  bottom: -2,
                  left: 0,
                  right: 0,
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, #00bfff, #00ff88, transparent)',
                  transformOrigin: 'left'
                }}
              />
            </motion.span>
          </motion.div>
        </div>

        {/* Typewriter subtitle */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          style={{ fontSize: 13, color: '#3b7a9e', letterSpacing: 3, marginBottom: 16, minHeight: 22 }}
        >
          {typedText}<span style={{ animation: 'pulse-ring 1s infinite', color: '#00bfff' }}>|</span>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ fontSize: 14, color: '#5a7fa8', lineHeight: 1.8, marginBottom: 38, maxWidth: 600 }}
        >
          {t('home.hero.desc')}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 52 }}
        >
          <button className="btn-primary" onClick={() => navigate('/signup')} style={{ fontSize: 14, padding: '14px 36px' }}>{t('home.hero.ctaCreate')}</button>
          <button className="btn-secondary" onClick={() => navigate('/login')} style={{ fontSize: 14, padding: '14px 36px' }}>{t('home.hero.ctaSignIn')}</button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', position: 'relative', zIndex: 2 }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 90 }}>
              <div style={{ fontSize: 'clamp(26px,4vw,40px)', fontWeight: 900, color: s.color, fontFamily: 'Orbitron,monospace', textShadow: `0 0 20px ${s.color}66` }}>
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 10, color: '#5a7fa8', letterSpacing: 2, marginTop: 4, textTransform: 'uppercase' }}>{s.label}</div>
            </div>
          ))}
        </motion.div>

      </section>

      {/* ── NEXUS TOOLKIT SECTION ── */}
      <section style={{ position: 'relative', zIndex: 2, padding: '60px 24px', background: 'linear-gradient(180deg,transparent,rgba(0,10,25,0.95) 15%,rgba(0,10,25,0.95) 85%,transparent)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>

          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p style={{ fontSize: 11, letterSpacing: 4, color: '#00bfff', marginBottom: 12 }}>SECURE DOMAIN ORCHESTRATION</p>
            <h2 className="hero-title" style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: '#e0e6ff', margin: 0 }}>
              NEXUS SECURITY TOOLKIT
            </h2>
            <div style={{ width: 60, height: 2, background: 'linear-gradient(90deg,transparent,#00bfff,transparent)', margin: '20px auto 0' }} />
            <p style={{ fontSize: 12, color: '#5a7fa8', maxWidth: 600, margin: '16px auto 0', lineHeight: 1.6 }}>
              Deploy specialized threat intelligence, passive vulnerability mapping, and cryptographic diagnostic modules across 7 custom cybersecurity categories.
            </p>
          </div>

          {/* Nexus Category Grid Selector */}
          <NexusCategoryGrid />

          {/* Explore Button */}
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 40 }}>
            <button 
              onClick={() => navigate('/toolkit')}
              style={{
                background: 'rgba(0,191,255,0.06)',
                border: '1px solid rgba(0,191,255,0.3)',
                padding: '12px 32px',
                borderRadius: '8px',
                color: '#fff',
                fontSize: '11px',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: 'bold',
                cursor: 'pointer',
                transition: 'all 0.3s'
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.12)';
                e.currentTarget.style.borderColor = '#00bfff';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,191,255,0.2)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(0,191,255,0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Explore Full Nexus Toolkit →
            </button>
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
              { name: 'UrlEngine', desc: t('home.intelSources.vtDesc'), color: '#00bfff' },
              { name: 'UrlEngine', desc: t('home.intelSources.abuseDesc'), color: '#ff8c00' },
              { name: 'Pulsedive', desc: 'Real-time threat feeds & risk scoring', color: '#00ff88' },
              { name: 'AlienVault OTX', desc: 'World largest open threat community', color: '#b400ff' },
              { name: 'GreyNoise', desc: 'Analyzing global internet scanning noise', color: '#ff2244' },
              { name: 'PortEngine', desc: 'Deep device & network discovery intel', color: '#00d4ff' },
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
                onClick={() => navigate(user ? '/toolkit/UrlEngine' : '/signup')}
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
            { label: 'Core Team', path: '/team' },
            { label: 'Live Models', path: '/toolkit' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Create Account', path: '/signup' },
            { label: 'Comms Line', path: 'tel:+919351636193', external: true },
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

        <div style={{ width: '100%', maxWidth: 800, borderTop: '1px solid rgba(255,255,255,0.03)', paddingTop: 14, display: 'flex', justifyContent: 'center' }}>
          <div style={{ color: '#475569', fontSize: 9, textAlign: 'center', letterSpacing: 1, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'center' }}>
            <span>© {new Date().getFullYear()} CYBERSHIELD X. ALL RIGHTS RESERVED.</span>
            <span style={{ color: '#334155' }}>|</span>
            <Link to="/privacy" style={{ color: '#00bfff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Privacy Policy</Link>
            <span style={{ color: '#334155' }}>|</span>
            <Link to="/terms" style={{ color: '#00bfff', textDecoration: 'none' }} onMouseEnter={e => e.currentTarget.style.textDecoration = 'underline'} onMouseLeave={e => e.currentTarget.style.textDecoration = 'none'}>Terms of Service</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
