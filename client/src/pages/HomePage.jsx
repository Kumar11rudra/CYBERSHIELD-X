import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { getAllTools } from '../components/toolkit/toolConfig';
import NexusCategoryGrid from '../components/home/NexusCategoryGrid';
import BrandLogo from '../components/common/BrandLogo';
import GlitchText from '../components/home/GlitchText';
import BinaryMatrixRain from '../components/home/BinaryMatrixRain';
import ExternalAlternativesModal from '../components/toolkit/cards/ExternalAlternativesModal';
import api from '../services/api';

// ─── Animated counter ─────────────────────────────────────────────────────────
function Counter({ to, suffix = '' }) {
  const [val, setVal] = useState(0);
  const ref = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          let start = 0;
          const duration = 2500;
          const stepTime = Math.max(duration / (to || 1), 50);
          const id = setInterval(() => {
            start += 1;
            if (start >= to) {
              setVal(to);
              clearInterval(id);
            } else {
              setVal(start);
            }
          }, stepTime);
        }
      },
      { threshold: 0.5 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [to]);

  return (
    <span ref={ref}>
      {val}
      {suffix}
    </span>
  );
}

// ─── Scan line overlay ────────────────────────────────────────────────────────
function ScanLine() {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        background:
          'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,191,255,0.015) 2px,rgba(0,191,255,0.015) 4px)',
        pointerEvents: 'none',
        zIndex: 1,
      }}
    />
  );
}

// ─── Threat ticker ────────────────────────────────────────────────────────────
const FALLBACK_TICKER = [
  '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure',
  '🔴 ALERT: New Lumma Stealer campaign targeting Indian banks',
  '⚡ UrlEngine: 2.3M new IOCs detected in last 24h',
  '🛡 UrlEngine: 14,000+ IPs reported for DDoS activity today',
  '⚠ NCIIPC Advisory: Phishing attacks targeting UPI users',
  '🔴 CERT-In: Ransomware targeting MSME sector in India',
];

function LiveTicker() {
  const [tickerItems, setTickerItems] = useState(FALLBACK_TICKER);

  useEffect(() => {
    let isMounted = true;

    const loadThreatTicker = async () => {
      try {
        const res = await api.get('/threat-feed');
        if (!isMounted) return;

        if (res.data && Array.isArray(res.data.ticker) && res.data.ticker.length > 0) {
          const sanitized = res.data.ticker
            .filter((item) => typeof item === 'string' && item.trim().length > 0)
            .map((item) => item.replace(/<[^>]+>/g, '').trim());
          if (sanitized.length > 0) {
            setTickerItems(sanitized);
          }
        } else if (res.data && Array.isArray(res.data.items) && res.data.items.length > 0) {
          const sanitized = res.data.items
            .map((item) => item.tickerText || item.title)
            .filter((text) => typeof text === 'string' && text.trim().length > 0)
            .map((text) => text.replace(/<[^>]+>/g, '').trim());
          if (sanitized.length > 0) {
            setTickerItems(sanitized);
          }
        }
      } catch (err) {
        // Fallback safely preserved without disrupting Homepage
      }
    };

    loadThreatTicker();
    // Refresh periodically matching backend cache window (15 minutes), avoid aggressive polling
    const intervalId = setInterval(loadThreatTicker, 15 * 60 * 1000);

    return () => {
      isMounted = false;
      clearInterval(intervalId);
    };
  }, []);

  const renderedItems = [...tickerItems, ...tickerItems];

  return (
    <div
      data-testid="homepage-live-ticker"
      style={{
        width: '100%',
        background: 'rgba(0,0,0,0.4)',
        borderBottom: '1px solid rgba(0,191,255,0.1)',
        borderTop: '1px solid rgba(0,191,255,0.1)',
        overflow: 'hidden',
        whiteSpace: 'nowrap',
        padding: '10px 0',
        position: 'absolute',
        top: 0,
        left: 0,
        zIndex: 10,
      }}
    >
      <div
        style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: 'ticker 40s linear infinite',
        }}
      >
        {renderedItems.map((text, i) => (
          <span
            key={i}
            style={{
              color: '#00bfff',
              fontSize: 13,
              letterSpacing: 1,
              marginRight: 60,
              fontWeight: 600,
            }}
          >
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
  const [selectedAlternativeTool, setSelectedAlternativeTool] = useState(null);
  const fullText = t('home.hero.subtitle') || 'Enterprise Cyber Threat Intelligence & SOC Workstation';

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      if (i < fullText.length) {
        setTypedText(fullText.slice(0, ++i));
      } else {
        clearInterval(id);
      }
    }, 45);
    return () => clearInterval(id);
  }, [fullText]);

  const stats = [
    { label: t('home.stats.threatModules') || 'Security Tools', value: getAllTools().length, suffix: '', color: '#00bfff' },
    { label: t('home.stats.intelSources') || 'Intel Sources', value: 35, suffix: '+', color: '#00ff88' },
    { label: t('home.stats.riskTiers') || 'Risk Tiers', value: 5, suffix: '', color: '#ff2244' },
    { label: t('home.stats.responseTime') || 'Response Time', value: 15, suffix: 's', color: '#e0e6ff' },
  ];

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--cyber-bg, #020814)',
        fontFamily: '"JetBrains Mono", "Courier New", monospace',
        color: '#e0e6ff',
        overflowX: 'hidden',
        position: 'relative',
      }}
    >
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

      <BinaryMatrixRain className="fixed inset-0 z-0 pointer-events-none opacity-30" />
      <ScanLine />
      <LiveTicker />

      {/* ── HERO ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          minHeight: '88vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '95px 24px 55px',
          textAlign: 'center',
        }}
      >
        {/* Animated Grid background */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage:
              'linear-gradient(rgba(0,191,255,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,191,255,0.04) 1px,transparent 1px)',
            backgroundSize: '48px 48px',
            animation: 'gridFade 1.5s ease both',
            pointerEvents: 'none',
          }}
        />

        {/* Glow orbs */}
        <div
          style={{
            position: 'absolute',
            top: '15%',
            left: '8%',
            width: 400,
            height: 400,
            background: 'radial-gradient(circle,rgba(0,191,255,0.07),transparent 70%)',
            borderRadius: '50%',
            animation: 'float 8s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '15%',
            right: '8%',
            width: 320,
            height: 320,
            background: 'radial-gradient(circle,rgba(0,255,136,0.06),transparent 70%)',
            borderRadius: '50%',
            animation: 'float 10s ease-in-out infinite reverse',
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%,-50%)',
            width: 700,
            height: 700,
            background: 'radial-gradient(circle,rgba(0,191,255,0.04),transparent 65%)',
            borderRadius: '50%',
            animation: 'float 14s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Main Brand Lockup Wrapper — X-Aligned CyberNexus Platform Branding */}
        <div
          style={{
            position: 'relative',
            display: 'inline-flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            zIndex: 2,
            marginBottom: 18,
          }}
        >
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
            <span
              className="glow-text"
              style={{
                color: '#00bfff',
                marginLeft: '0.18em',
                textShadow:
                  '0 0 40px rgba(0,191,255,0.8), 0 0 80px rgba(0,191,255,0.4)',
              }}
            >
              {' '}
              SHIELD
            </span>
            <span
              style={{
                color: '#00ff88',
                fontSize: '0.6em',
                marginLeft: '0.2em',
                verticalAlign: 'middle',
                textShadow: '0 0 20px rgba(0,255,136,0.8)',
              }}
            >
              X
            </span>
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
              paddingRight: '0.1em',
            }}
          >
            <span style={{ color: 'rgba(224, 230, 255, 0.55)', fontWeight: 500 }}>
              INTELLIGENCE
            </span>
            <motion.span
              animate={{
                textShadow: [
                  '0 0 10px rgba(0,191,255,0.4)',
                  '0 0 20px rgba(0,191,255,0.85)',
                  '0 0 10px rgba(0,191,255,0.4)',
                ],
              }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
              style={{
                color: '#00bfff',
                fontWeight: 700,
                letterSpacing: '3px',
                position: 'relative',
                display: 'inline-block',
              }}
            >
              PLATFORM
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
                  background:
                    'linear-gradient(90deg, transparent, #00bfff, #00ff88, transparent)',
                  transformOrigin: 'left',
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
          style={{
            fontSize: 13,
            color: '#3b7a9e',
            letterSpacing: 3,
            marginBottom: 16,
            minHeight: 22,
          }}
        >
          {typedText}
          <span style={{ animation: 'pulse-ring 1s infinite', color: '#00bfff' }}>|</span>
        </motion.p>

        {/* Description */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            fontSize: 14,
            color: '#5a7fa8',
            lineHeight: 1.8,
            marginBottom: 38,
            maxWidth: 600,
          }}
        >
          {t('home.hero.desc') ||
            'Advanced cybersecurity monitoring, automated threat detection, and zero-trust vulnerability assessment platform.'}
        </motion.p>

        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.65 }}
          style={{
            display: 'flex',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
            marginBottom: 52,
          }}
        >
          <button
            className="btn-primary"
            onClick={() => navigate('/signup')}
            style={{ fontSize: 14, padding: '14px 36px' }}
          >
            {t('home.hero.ctaCreate') || 'CREATE ACCOUNT'}
          </button>
          <button
            className="btn-secondary"
            onClick={() => navigate('/login')}
            style={{ fontSize: 14, padding: '14px 36px' }}
          >
            {t('home.hero.ctaSignIn') || 'SIGN IN'}
          </button>
        </motion.div>

        {/* Stats Row */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.85 }}
          style={{
            display: 'flex',
            gap: 32,
            flexWrap: 'wrap',
            justifyContent: 'center',
            position: 'relative',
            zIndex: 2,
          }}
        >
          {stats.map((s, i) => (
            <div key={i} style={{ textAlign: 'center', minWidth: 90 }}>
              <div
                style={{
                  fontSize: 'clamp(26px,4vw,40px)',
                  fontWeight: 900,
                  color: s.color,
                  fontFamily: 'Orbitron,monospace',
                  textShadow: `0 0 20px ${s.color}66`,
                }}
              >
                <Counter to={s.value} suffix={s.suffix} />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: '#5a7fa8',
                  letterSpacing: 2,
                  marginTop: 4,
                  textTransform: 'uppercase',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </motion.div>
      </section>

      {/* ── HAVE I BEEN PWNED SECTION (Step 209: Exact Placement below Stats, above Tools) ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '48px 24px',
          background: 'radial-gradient(ellipse at center, rgba(0, 191, 255, 0.05) 0%, transparent 70%)',
        }}
        aria-label="Have I Been Pwned Data Breach Verification"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            background: 'linear-gradient(135deg, rgba(12, 22, 45, 0.7) 0%, rgba(2, 8, 20, 0.9) 100%)',
            border: '1px solid rgba(0, 191, 255, 0.25)',
            boxShadow: '0 0 30px rgba(0, 191, 255, 0.08), inset 0 0 20px rgba(0, 191, 255, 0.03)',
            borderRadius: 20,
            padding: '36px 32px',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 24,
            }}
          >
            {/* Header & Title — Centered */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 10,
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontFamily: '"JetBrains Mono", monospace',
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '2px',
                  color: '#00ff88',
                  textTransform: 'uppercase',
                }}
              >
                <span
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: '#00ff88',
                    boxShadow: '0 0 8px #00ff88',
                    display: 'inline-block',
                  }}
                />
                DATA BREACH & EXPOSURE VERIFICATION
              </div>

              <h2
                style={{
                  fontSize: 'clamp(24px, 3.5vw, 36px)',
                  fontWeight: 900,
                  color: '#ffffff',
                  margin: 0,
                  letterSpacing: '-0.5px',
                  fontFamily: 'Orbitron, sans-serif',
                  textAlign: 'center',
                }}
              >
                Have I Been Pwned
              </h2>

              <p
                style={{
                  fontSize: 14,
                  color: '#94a3b8',
                  lineHeight: 1.7,
                  margin: '0 auto',
                  maxWidth: 850,
                  fontFamily: '"JetBrains Mono", monospace',
                  textAlign: 'center',
                }}
              >
                Check whether your email address has appeared in known data breaches. Have I Been Pwned aggregates billions of compromised accounts from public breaches and security incident corpuses to help operators and individuals secure exposed identities.
              </p>
            </div>

            {/* Feature Highlights Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 16,
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.1 }}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 12,
                  padding: '16px 18px',
                }}
              >
                <div style={{ color: '#00bfff', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Breach Verification
                </div>
                <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
                  Discover whether an email appeared in known breaches across major enterprise leaks and paste dumps.
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.2 }}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 12,
                  padding: '16px 18px',
                }}
              >
                <div style={{ color: '#00ff88', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Associated Incidents
                </div>
                <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
                  View associated breach incidents, compromise dates, attack vectors, and incident backgrounds.
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.3 }}
                style={{
                  background: 'rgba(0, 0, 0, 0.3)',
                  border: '1px solid rgba(255, 255, 255, 0.07)',
                  borderRadius: 12,
                  padding: '16px 18px',
                }}
              >
                <div style={{ color: '#a78bfa', fontWeight: 700, fontSize: 13, marginBottom: 6 }}>
                  Exposed Data Categories
                </div>
                <div style={{ color: '#64748b', fontSize: 12, lineHeight: 1.5 }}>
                  Inspect exposed data categories reported for those breaches, including passwords, emails, and PII.
                </div>
              </motion.div>
            </div>

            {/* CTA & Privacy Notice — Centered */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                textAlign: 'center',
                gap: 16,
                paddingTop: 8,
              }}
            >
              <motion.a
                href="https://haveibeenpwned.com/"
                target="_blank"
                rel="noopener noreferrer"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 10,
                  background: 'linear-gradient(135deg, #00bfff 0%, #00ff88 100%)',
                  color: '#020814',
                  fontWeight: 900,
                  fontSize: 14,
                  letterSpacing: '1px',
                  textTransform: 'uppercase',
                  padding: '14px 28px',
                  borderRadius: 12,
                  textDecoration: 'none',
                  boxShadow: '0 0 25px rgba(0, 191, 255, 0.4)',
                  transition: 'box-shadow 0.25s ease',
                  fontFamily: '"JetBrains Mono", monospace',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 35px rgba(0, 255, 136, 0.6)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.boxShadow = '0 0 25px rgba(0, 191, 255, 0.4)';
                }}
              >
                <span>Check Your Data</span>
                <span style={{ fontSize: 16 }}>↗</span>
              </motion.a>

              <p
                style={{
                  fontSize: 11,
                  color: '#64748b',
                  margin: '0 auto',
                  lineHeight: 1.5,
                  maxWidth: 700,
                  fontFamily: '"JetBrains Mono", monospace',
                  textAlign: 'center',
                }}
              >
                * CyberShield X does not collect, transmit, proxy, or store your email address. Clicking "Check Your Data" directly opens the official Have I Been Pwned service in a new secure tab.
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── NEXUS TOOLKIT SECTION ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '60px 24px',
          background:
            'linear-gradient(180deg,transparent,rgba(0,10,25,0.95) 15%,rgba(0,10,25,0.95) 85%,transparent)',
        }}
      >
        <div style={{ maxWidth: 1200, margin: '0 auto' }}>
          {/* Section header */}
          <div style={{ textAlign: 'center', marginBottom: 52 }}>
            <p
              style={{
                fontSize: 11,
                letterSpacing: 4,
                color: '#00bfff',
                marginBottom: 12,
              }}
            >
              CYBERSECURITY TOOLS & MODULES
            </p>
            <h2
              className="hero-title"
              style={{
                fontSize: 'clamp(28px,4vw,42px)',
                fontWeight: 900,
                color: '#e0e6ff',
                margin: 0,
              }}
            >
              CYBERSHIELD X TOOLKIT
            </h2>
            <div
              style={{
                width: 60,
                height: 2,
                background:
                  'linear-gradient(90deg,transparent,#00bfff,transparent)',
                margin: '20px auto 0',
              }}
            />
            <p
              style={{
                fontSize: 12,
                color: '#5a7fa8',
                maxWidth: 600,
                margin: '16px auto 0',
                lineHeight: 1.6,
              }}
            >
              Scan websites, inspect network security, analyze threats, and check
              data breaches with easy-to-use tools.
            </p>
          </div>

          {/* Nexus Category Grid Selector with approved 3D faces and animations */}
          <NexusCategoryGrid onAlternatives={(tool) => setSelectedAlternativeTool(tool)} />

          {/* Explore Button */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: 40,
            }}
          >
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
                transition: 'all 0.3s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.12)';
                e.currentTarget.style.borderColor = '#00bfff';
                e.currentTarget.style.boxShadow = '0 0 20px rgba(0,191,255,0.2)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(0,191,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(0,191,255,0.3)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              Explore All Security Tools →
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
            <p
              style={{
                fontSize: 11,
                letterSpacing: 4,
                color: '#00ff88',
                marginBottom: 12,
              }}
            >
              {t('home.workflow.subtitle') || 'WORKFLOW PIPELINE'}
            </p>
            <h2
              className="hero-title"
              style={{
                fontSize: 'clamp(24px,3.5vw,36px)',
                fontWeight: 900,
                color: '#e0e6ff',
                margin: 0,
              }}
            >
              {t('home.workflow.title') || 'HOW CYBERSHIELD X WORKS'}
            </h2>
          </motion.div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
              gap: 24,
            }}
          >
            {[
              {
                step: '01',
                title: t('home.workflow.step1Title') || 'Input Target',
                desc:
                  t('home.workflow.step1Desc') ||
                  'Enter an IP, domain, URL, or hash for automated discovery.',
                color: '#00bfff',
                icon: '📋',
              },
              {
                step: '02',
                title: t('home.workflow.step2Title') || 'Run Analysis',
                desc:
                  t('home.workflow.step2Desc') ||
                  'Dispatch non-invasive probes across 35+ global intel sources.',
                color: '#00ff88',
                icon: '⚡',
              },
              {
                step: '03',
                title: t('home.workflow.step3Title') || 'Review Intelligence',
                desc:
                  t('home.workflow.step3Desc') ||
                  'Generate comprehensive risk telemetry and actionable defense plans.',
                color: '#ff8c00',
                icon: '🎯',
              },
            ].map((s, i) => (
              <motion.div
                key={i}
                initial={{
                  opacity: 0,
                  x: i === 0 ? -30 : i === 2 ? 30 : 0,
                  y: i === 1 ? 30 : 0,
                }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.2 }}
                style={{
                  background: 'rgba(10,18,35,0.85)',
                  border: '1px solid rgba(0,191,255,0.1)',
                  borderRadius: 12,
                  padding: 24,
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 28 }}>{s.icon}</span>
                  <span
                    style={{
                      fontFamily: 'Orbitron,monospace',
                      fontSize: 22,
                      fontWeight: 900,
                      color: s.color,
                    }}
                  >
                    {s.step}
                  </span>
                </div>
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#e0e6ff',
                    margin: '0 0 10px',
                  }}
                >
                  {s.title}
                </h3>
                <p
                  style={{
                    fontSize: 12,
                    color: '#5a7fa8',
                    lineHeight: 1.7,
                    margin: 0,
                  }}
                >
                  {s.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTEL SOURCES ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '60px 24px',
          background: 'rgba(0,8,20,0.7)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', textAlign: 'center' }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: 4,
              color: '#5a7fa8',
              marginBottom: 28,
            }}
          >
            {t('home.intelSources.subtitle') || 'INTEGRATED THREAT INTELLIGENCE NETWORKS'}
          </p>
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: 16,
              justifyContent: 'center',
            }}
          >
            {[
              {
                name: 'UrlEngine',
                desc: t('home.intelSources.vtDesc') || 'Malware & URL scanner',
                color: '#00bfff',
                path: '/toolkit/url-engine',
              },
              {
                name: 'UrlEngine Abuse',
                desc: t('home.intelSources.abuseDesc') || 'Global IP abuse reporter',
                color: '#ff8c00',
                path: '/toolkit/ip-reputation',
              },
              {
                name: 'Pulsedive',
                desc: 'Real-time threat feeds & risk scoring',
                color: '#00ff88',
                path: '/toolkit/threat-intel',
              },
              {
                name: 'AlienVault OTX',
                desc: 'World largest open threat community',
                color: '#b400ff',
                path: '/toolkit/cve-search',
              },
              {
                name: 'GreyNoise',
                desc: 'Analyzing global internet scanning noise',
                color: '#ff2244',
                path: '/toolkit/port-scanner',
              },
              {
                name: 'PortEngine',
                desc: 'Deep device & network discovery intel',
                color: '#00d4ff',
                path: '/toolkit/dns-enum',
              },
              {
                name: 'Cisco Talos',
                desc: 'Industry-leading threat intelligence',
                color: '#ffffff',
                path: '/toolkit/ssl-checker',
              },
              {
                name: 'HIBP (Breach)',
                desc: t('home.intelSources.hibpDesc') || 'Check compromised account records',
                color: '#ff2244',
                externalUrl: 'https://haveibeenpwned.com/',
              },
              {
                name: 'TLS / OpenSSL',
                desc: t('home.intelSources.tlsDesc') || 'SSL certificate validation',
                color: '#00ff88',
                path: '/toolkit/ssl-checker',
              },
            ].map((src, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                whileHover={{
                  scale: 1.05,
                  borderColor: src.color,
                  boxShadow: `0 0 20px ${src.color}30`,
                }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                onClick={() => {
                  if (src.externalUrl) {
                    window.open(src.externalUrl, '_blank', 'noopener,noreferrer');
                  } else {
                    navigate(user ? src.path : '/signup');
                  }
                }}
                style={{
                  background: 'rgba(10,18,35,0.9)',
                  border: `1px solid ${src.color}25`,
                  borderRadius: 10,
                  padding: '16px 22px',
                  minWidth: 180,
                  transition: 'border-color 0.2s',
                  cursor: 'pointer',
                }}
              >
                <div
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: src.color,
                    marginBottom: 4,
                  }}
                >
                  {src.name}
                </div>
                <div style={{ fontSize: 11, color: '#3b5a7a' }}>{src.desc}</div>
              </motion.div>
            ))}
          </div>

          {/* Discreet HIBP Entry */}
          <div style={{ marginTop: 24 }}>
            <a
              href="https://haveibeenpwned.com/"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11,
                color: '#5a7fa8',
                textDecoration: 'none',
                letterSpacing: '1px',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#00bfff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#5a7fa8')}
            >
              Check Your Data: Have I Been Pwned ↗
            </a>
          </div>
        </div>
      </section>

      {/* ── FINAL CTA ── */}
      <section
        style={{
          position: 'relative',
          zIndex: 2,
          padding: '60px 24px',
          textAlign: 'center',
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          style={{ maxWidth: 600, margin: '0 auto' }}
        >
          <div
            style={{
              position: 'relative',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 24,
            }}
          >
            <motion.div
              animate={{
                boxShadow: [
                  '0 0 20px rgba(0,212,255,0.2)',
                  '0 0 45px rgba(0,212,255,0.5)',
                  '0 0 20px rgba(0,212,255,0.2)',
                ],
              }}
              transition={{ duration: 2.5, repeat: Infinity }}
              style={{
                width: 84,
                height: 84,
                background:
                  'linear-gradient(135deg, rgba(0,51,102,0.6), rgba(0,102,153,0.4))',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(0,212,255,0.3)',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto',
              }}
            >
              <BrandLogo size={46} />
            </motion.div>
            <div
              style={{
                position: 'absolute',
                inset: -8,
                borderRadius: '50%',
                border: '1px solid rgba(0,212,255,0.3)',
                animation: 'pulse-ring 2s infinite',
              }}
            />
          </div>
          <h2
            className="hero-title"
            style={{
              fontSize: 'clamp(24px,4vw,38px)',
              fontWeight: 900,
              color: '#e0e6ff',
              margin: '0 0 16px',
            }}
          >
            {t('home.finalCta.title') || 'LAUNCH CYBERSHIELD X TODAY'}
          </h2>
          <p
            style={{
              fontSize: 14,
              color: '#5a7fa8',
              lineHeight: 1.8,
              marginBottom: 36,
            }}
          >
            {t('home.finalCta.desc') ||
              'Access 111+ cybersecurity utilities, automated cloud telemetry, and centralized security workstations in one unified interface.'}
          </p>
          <div
            style={{
              display: 'flex',
              gap: 14,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            <button
              className="btn-primary"
              onClick={() => navigate('/signup')}
              style={{ fontSize: 14, padding: '14px 36px' }}
            >
              {t('home.hero.ctaLaunch') || 'LAUNCH PLATFORM'}
            </button>
            <button
              className="btn-secondary"
              onClick={() => navigate('/login')}
              style={{ fontSize: 14, padding: '14px 36px' }}
            >
              {t('home.hero.ctaSignIn') || 'SIGN IN'}
            </button>
          </div>
        </motion.div>
      </section>

      {/* ── PREMIUM FOOTER ── */}
      <footer
        style={{
          position: 'relative',
          zIndex: 2,
          marginTop: 20,
          background:
            'linear-gradient(180deg, rgba(2,8,20,0) 0%, rgba(2,8,20,0.95) 20%, #020814 100%)',
          borderTop: '1px solid rgba(0,191,255,0.1)',
          padding: '30px 24px 20px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 32,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 10,
            textAlign: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              fontFamily: 'Orbitron,monospace',
              fontSize: 16,
              fontWeight: 900,
              letterSpacing: 1,
            }}
          >
            <span style={{ color: '#e0e6ff' }}>CYBER</span>
            <span
              style={{
                color: '#00bfff',
                textShadow: '0 0 10px rgba(0,191,255,0.5)',
              }}
            >
              SHIELD
            </span>
            <span style={{ color: '#00ff88', fontSize: '0.6em', marginLeft: 4 }}>
              X
            </span>
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              color: '#64748b',
              fontSize: 10,
              fontFamily: '"JetBrains Mono", monospace',
            }}
          >
            <span style={{ color: '#00bfff' }}>✉</span>
            <a
              href="mailto:official.cybershieldx@gmail.com"
              style={{
                color: '#64748b',
                textDecoration: 'none',
                transition: 'color 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#fff')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748b')}
            >
              official.cybershieldx@gmail.com
            </a>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            flexWrap: 'wrap',
            justifyContent: 'center',
          }}
        >
          {[
            { label: 'Platform', path: '/login' },
            { label: 'Security', path: '/security' },
            { label: 'Core Team', path: '/team' },
            { label: 'Live Models', path: '/toolkit' },
            { label: 'Contact Us', path: '/contact' },
            { label: 'Create Account', path: '/signup' },
            { label: 'Comms Line', path: 'tel:+919351636193', external: true },
            ...(user?.role === 'admin'
              ? [{ label: 'Admin Portal', path: '/nexus-admin' }]
              : []),
          ].map((item, i) =>
            item.external ? (
              <a
                key={i}
                href={item.path}
                style={{
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00bfff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#475569';
                }}
              >
                {item.label}
              </a>
            ) : (
              <Link
                key={i}
                to={item.path}
                style={{
                  color: '#475569',
                  textDecoration: 'none',
                  fontSize: 9,
                  fontWeight: 700,
                  letterSpacing: 1,
                  textTransform: 'uppercase',
                  transition: 'all 0.3s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#00bfff';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#475569';
                }}
              >
                {item.label}
              </Link>
            )
          )}
        </div>

        <div
          style={{
            width: '100%',
            maxWidth: 1000,
            borderTop: '1px solid rgba(255,255,255,0.06)',
            paddingTop: 16,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: 10,
            textAlign: 'center',
          }}
        >
          {/* CENTER: Clean in-flow Tactical Version Badge in footer */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: '"JetBrains Mono", monospace',
              fontSize: 10,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                background: '#00ff88',
                boxShadow: '0 0 6px #00ff88',
                display: 'inline-block',
              }}
            />
            <span style={{ color: '#94a3b8', fontWeight: 600, letterSpacing: '0.8px' }}>
              CYBERSHIELD X
            </span>
            <span style={{ color: 'rgba(0, 212, 255, 0.4)' }}>•</span>
            <span
              style={{
                fontWeight: 700,
                color: '#00d4ff',
                background: 'rgba(0, 212, 255, 0.1)',
                padding: '2px 7px',
                borderRadius: 4,
                border: '1px solid rgba(0, 212, 255, 0.25)',
              }}
            >
              v62.5.2
            </span>
          </div>

          {/* CENTER: Legal & Copyright Links */}
          <div
            style={{
              color: '#64748b',
              fontSize: 10,
              letterSpacing: 0.5,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            <span>© {new Date().getFullYear()} CYBERSHIELD X. ALL RIGHTS RESERVED.</span>
            <span style={{ color: '#334155' }}>|</span>
            <Link
              to="/privacy"
              style={{ color: '#00bfff', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Privacy Policy
            </Link>
            <span style={{ color: '#334155' }}>|</span>
            <Link
              to="/terms"
              style={{ color: '#00bfff', textDecoration: 'none' }}
              onMouseEnter={(e) => (e.currentTarget.style.textDecoration = 'underline')}
              onMouseLeave={(e) => (e.currentTarget.style.textDecoration = 'none')}
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>

      {/* ── Verified External Alternatives Modal ── */}
      <ExternalAlternativesModal
        tool={selectedAlternativeTool}
        isOpen={Boolean(selectedAlternativeTool)}
        onClose={() => setSelectedAlternativeTool(null)}
      />
    </div>
  );
}
