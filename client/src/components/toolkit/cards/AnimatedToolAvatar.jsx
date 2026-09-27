import React from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Normalizes input archetype strings (case-insensitive, trims, underscores/hyphens)
 */
const ARCHETYPE_MAP = {
  'cyber scout': 'Cyber Scout',
  'cyberscout': 'Cyber Scout',
  'cyber_scout': 'Cyber Scout',
  'net warden': 'Net Warden',
  'netwarden': 'Net Warden',
  'net_warden': 'Net Warden',
  'web shield': 'Web Shield',
  'webshield': 'Web Shield',
  'web_shield': 'Web Shield',
  'code breaker': 'Code Breaker',
  'codebreaker': 'Code Breaker',
  'code_breaker': 'Code Breaker',
  'bio-scanner': 'Bio-Scanner',
  'bioscanner': 'Bio-Scanner',
  'bio_scanner': 'Bio-Scanner',
  'ai sentinel': 'AI Sentinel',
  'aisentinel': 'AI Sentinel',
  'ai_sentinel': 'AI Sentinel',
  'forensics investigator': 'Forensics Investigator',
  'forensicsinvestigator': 'Forensics Investigator',
  'forensics_investigator': 'Forensics Investigator',
  'compliance auditor': 'Compliance Auditor',
  'complianceauditor': 'Compliance Auditor',
  'compliance_auditor': 'Compliance Auditor',
};

function normalizeArchetype(name) {
  if (!name || typeof name !== 'string') return 'Cyber Scout';
  const key = name.trim().toLowerCase();
  return ARCHETYPE_MAP[key] || 'Cyber Scout';
}

/**
 * 1. Cyber Scout — Green Beanie, Cool Glasses, Playful Winking Smile with Tongue Out
 */
function RenderCyberScout({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="70%" stopColor="#fba66c" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-beanie`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#22c55e" />
          <stop offset="100%" stopColor="#15803d" />
        </linearGradient>
      </defs>
      {/* Ears */}
      <circle cx="16" cy="34" r="5" fill="#fba66c" />
      <circle cx="48" cy="34" r="5" fill="#fba66c" />
      {/* Head / Face */}
      <circle cx="32" cy="34" r="17" fill={`url(#${idPrefix}-skin)`} />
      {/* Beanie Hat */}
      <path d="M16 28 C16 14, 48 14, 48 28 Z" fill={`url(#${idPrefix}-beanie)`} />
      <rect x="14" y="24" width="36" height="6" rx="3" fill="#16a34a" />
      <circle cx="32" cy="14" r="3" fill="#4ade80" />
      {/* Eyebrows */}
      <path d="M22 26 Q25 24 28 26" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      <path d="M36 26 Q39 23 42 25" stroke="#451a03" strokeWidth="1.5" strokeLinecap="round" fill="none" />
      {/* Glasses */}
      <rect x="20" y="27" width="9" height="7" rx="2" fill="none" stroke="#ec4899" strokeWidth="1.6" />
      <rect x="35" y="27" width="9" height="7" rx="2" fill="none" stroke="#ec4899" strokeWidth="1.6" />
      <line x1="29" y1="30" x2="35" y2="30" stroke="#ec4899" strokeWidth="1.6" />
      {/* Eyes: Left Wink, Right Open Sparkle */}
      <path d="M22 31 Q24.5 33 27 31" stroke="#1c1917" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="39.5" cy="30.5" r="2" fill="#1c1917" />
      <circle cx="40.3" cy="29.7" r="0.7" fill="#ffffff" />
      {/* Rosy Cheeks */}
      <circle cx="21" cy="37" r="3" fill="#f43f5e" opacity="0.3" />
      <circle cx="43" cy="37" r="3" fill="#f43f5e" opacity="0.3" />
      {/* Mouth & Playful Tongue */}
      <path d="M27 37 Q32 43 37 37 Z" fill="#450a0a" />
      <path d="M29 39 Q32 45 35 39" fill="#f43f5e" />
    </g>
  );
}

/**
 * 2. Net Warden — Blue Cap, Glasses, Friendly Smile & 3D Thumbs-Up Gesture
 */
function RenderNetWarden({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin2`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="70%" stopColor="#fba66c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-cap`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#1d4ed8" />
        </linearGradient>
      </defs>
      {/* Ears */}
      <circle cx="15" cy="33" r="4.5" fill="#fba66c" />
      <circle cx="47" cy="33" r="4.5" fill="#fba66c" />
      {/* Face */}
      <circle cx="31" cy="33" r="16.5" fill={`url(#${idPrefix}-skin2)`} />
      {/* Blue Cap */}
      <path d="M16 26 C16 13, 46 13, 46 26 Z" fill={`url(#${idPrefix}-cap)`} />
      <path d="M12 25 Q31 22 49 26 Q31 29 12 25" fill="#1e40af" />
      {/* Glasses */}
      <circle cx="24" cy="31" r="5" fill="none" stroke="#334155" strokeWidth="1.5" />
      <circle cx="38" cy="31" r="5" fill="none" stroke="#334155" strokeWidth="1.5" />
      <line x1="29" y1="31" x2="33" y2="31" stroke="#334155" strokeWidth="1.5" />
      {/* Eyes */}
      <circle cx="24" cy="31" r="1.8" fill="#0f172a" />
      <circle cx="38" cy="31" r="1.8" fill="#0f172a" />
      <circle cx="24.6" cy="30.3" r="0.6" fill="#fff" />
      <circle cx="38.6" cy="30.3" r="0.6" fill="#fff" />
      {/* Smile */}
      <path d="M25 38 Q31 43 37 38" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* 3D Thumbs-Up Hand on Right Side */}
      <g transform="translate(45, 27) scale(0.85)">
        <ellipse cx="6" cy="12" rx="4.5" ry="5.5" fill="#fed7aa" stroke="#c2410c" strokeWidth="0.8" />
        {/* Thumb */}
        <path d="M4 10 C4 3, 9 3, 9 10 Z" fill="#fed7aa" stroke="#c2410c" strokeWidth="0.8" />
        {/* Fingers */}
        <line x1="7" y1="9" x2="10" y2="9" stroke="#ea580c" strokeWidth="0.8" />
        <line x1="7" y1="12" x2="10" y2="12" stroke="#ea580c" strokeWidth="0.8" />
        <line x1="7" y1="15" x2="9.5" y2="15" stroke="#ea580c" strokeWidth="0.8" />
      </g>
    </g>
  );
}

/**
 * 3. Web Shield — Auburn Hair, Winking Tongue, Cheerful & Expressive
 */
function RenderWebShield({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin3`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="70%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#f97316" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-hair3`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="100%" stopColor="#451a03" />
        </linearGradient>
      </defs>
      {/* Hair Behind */}
      <circle cx="32" cy="28" r="19" fill={`url(#${idPrefix}-hair3)`} />
      {/* Ears */}
      <circle cx="15" cy="34" r="4.5" fill="#fed7aa" />
      <circle cx="49" cy="34" r="4.5" fill="#fed7aa" />
      {/* Face */}
      <circle cx="32" cy="34" r="16" fill={`url(#${idPrefix}-skin3)`} />
      {/* Hair Bangs */}
      <path d="M17 26 Q32 16 47 26 Q38 21 32 23 Q26 21 17 26 Z" fill={`url(#${idPrefix}-hair3)`} />
      {/* Left Wink Eye */}
      <path d="M22 32 Q26 35 30 32" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />
      {/* Right Open Eye */}
      <circle cx="39" cy="31" r="2.2" fill="#451a03" />
      <circle cx="39.8" cy="30.2" r="0.8" fill="#ffffff" />
      {/* Blush */}
      <circle cx="21" cy="36" r="3" fill="#f43f5e" opacity="0.35" />
      <circle cx="43" cy="36" r="3" fill="#f43f5e" opacity="0.35" />
      {/* Open Smile with Cute Tongue */}
      <path d="M26 37 Q32 44 38 37 Z" fill="#881337" />
      <path d="M29 39 Q32 45 35 39" fill="#fb7185" />
    </g>
  );
}

/**
 * 4. Code Breaker — Yellow Beanie, Winking Tongue, Playful Tech Prodigy
 */
function RenderCodeBreaker({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin4`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="70%" stopColor="#fdba74" />
          <stop offset="100%" stopColor="#ea580c" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-beanie4`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#facc15" />
          <stop offset="100%" stopColor="#ca8a04" />
        </linearGradient>
      </defs>
      <circle cx="16" cy="35" r="4.5" fill="#fdba74" />
      <circle cx="48" cy="35" r="4.5" fill="#fdba74" />
      <circle cx="32" cy="35" r="16.5" fill={`url(#${idPrefix}-skin4)`} />
      {/* Yellow Beanie */}
      <path d="M16 29 C16 15, 48 15, 48 29 Z" fill={`url(#${idPrefix}-beanie4)`} />
      <rect x="14" y="25" width="36" height="6" rx="3" fill="#eab308" />
      {/* Wink & Eye */}
      <path d="M22 33 Q25 36 28 33" stroke="#451a03" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="39" cy="32" r="2.2" fill="#451a03" />
      <circle cx="39.8" cy="31.2" r="0.7" fill="#fff" />
      {/* Mouth & Tongue */}
      <path d="M26 38 Q32 45 38 38 Z" fill="#450a0a" />
      <path d="M28.5 40 Q32 46 35.5 40" fill="#f43f5e" />
    </g>
  );
}

/**
 * 5. Bio-Scanner — Purple Beanie, Thoughtful Hand-on-Chin Pose
 */
function RenderBioScanner({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin5`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fed7aa" />
          <stop offset="70%" stopColor="#fba66c" />
          <stop offset="100%" stopColor="#c2410c" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-beanie5`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#6b21a8" />
        </linearGradient>
      </defs>
      <circle cx="15" cy="33" r="4.5" fill="#fba66c" />
      <circle cx="47" cy="33" r="4.5" fill="#fba66c" />
      <circle cx="31" cy="33" r="16.5" fill={`url(#${idPrefix}-skin5)`} />
      {/* Purple Beanie */}
      <path d="M15 27 C15 13, 47 13, 47 27 Z" fill={`url(#${idPrefix}-beanie5)`} />
      <rect x="13" y="23" width="36" height="6" rx="3" fill="#9333ea" />
      {/* Thoughtful Eyes */}
      <ellipse cx="23" cy="31" rx="2" ry="2.3" fill="#1e1b4b" />
      <ellipse cx="37" cy="31" rx="2" ry="2.3" fill="#1e1b4b" />
      <circle cx="23.7" cy="30.2" r="0.7" fill="#fff" />
      <circle cx="37.7" cy="30.2" r="0.7" fill="#fff" />
      {/* Smirk */}
      <path d="M26 38 Q31 40 36 37" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      {/* 3D Thinking Hand on Chin */}
      <g transform="translate(19, 36) scale(0.9)">
        <ellipse cx="9" cy="8" rx="7" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="0.8" />
        {/* Curled fingers & thumb resting against cheek */}
        <circle cx="4" cy="5" r="2.2" fill="#fba66c" />
        <circle cx="8" cy="5" r="2.2" fill="#fba66c" />
        <circle cx="12" cy="5.5" r="2" fill="#fba66c" />
        <path d="M14 6 C16 3, 17 8, 14 10" stroke="#c2410c" strokeWidth="0.8" fill="#fed7aa" />
      </g>
    </g>
  );
}

/**
 * 6. AI Sentinel — Glamorous Magenta/Purple Hair, Blowing a 3D Heart Kiss
 */
function RenderAISentinel({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin6`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#fce7f3" />
          <stop offset="70%" stopColor="#fbcfe8" />
          <stop offset="100%" stopColor="#f472b6" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-hair6`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ec4899" />
          <stop offset="100%" stopColor="#831843" />
        </linearGradient>
      </defs>
      {/* Hair Behind */}
      <circle cx="32" cy="27" r="19" fill={`url(#${idPrefix}-hair6)`} />
      <circle cx="15" cy="34" r="4" fill="#fbcfe8" />
      <circle cx="49" cy="34" r="4" fill="#fbcfe8" />
      {/* Face */}
      <circle cx="32" cy="34" r="16" fill={`url(#${idPrefix}-skin6)`} />
      {/* Hair Swept Side */}
      <path d="M15 25 Q32 14 49 22 Q40 18 32 20 Q24 18 15 25 Z" fill={`url(#${idPrefix}-hair6)`} />
      {/* Left Wink Eye with Lashes */}
      <path d="M22 31 Q26 34 30 31" stroke="#831843" strokeWidth="2" strokeLinecap="round" fill="none" />
      <path d="M21 30 L19 28" stroke="#831843" strokeWidth="1.2" />
      <path d="M30 30 L32 28" stroke="#831843" strokeWidth="1.2" />
      {/* Right Eye */}
      <circle cx="39" cy="30" r="2.2" fill="#831843" />
      <circle cx="39.8" cy="29.2" r="0.8" fill="#fff" />
      {/* Kissing Lips Pout */}
      <ellipse cx="29" cy="38" rx="2.5" ry="1.8" fill="#be123c" />
      {/* 3D Floating Heart Kiss */}
      <g transform="translate(36, 32) scale(0.95)">
        <path
          d="M6 3.5 C6 1.5, 3 1.5, 3 3.5 C3 5.5, 6 7.5, 6 7.5 C6 7.5, 9 5.5, 9 3.5 C9 1.5, 6 1.5, 6 3.5 Z"
          fill="#ef4444"
          stroke="#b91c1c"
          strokeWidth="0.5"
        />
        <circle cx="4.5" cy="3" r="0.6" fill="#fff" opacity="0.8" />
      </g>
    </g>
  );
}

/**
 * 7. Forensics Investigator — Afro Curls, Round Glasses, Hand Pointing
 */
function RenderForensicsInvestigator({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin7`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="70%" stopColor="#b45309" />
          <stop offset="100%" stopColor="#78350f" />
        </radialGradient>
      </defs>
      {/* Afro Hair Volume */}
      <circle cx="21" cy="22" r="9" fill="#1c1917" />
      <circle cx="32" cy="18" r="10" fill="#1c1917" />
      <circle cx="43" cy="22" r="9" fill="#1c1917" />
      <circle cx="15" cy="30" r="7" fill="#1c1917" />
      <circle cx="49" cy="30" r="7" fill="#1c1917" />
      {/* Face */}
      <circle cx="32" cy="34" r="16" fill={`url(#${idPrefix}-skin7)`} />
      {/* Round Glasses */}
      <circle cx="24" cy="32" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="38" cy="32" r="5" fill="none" stroke="#f59e0b" strokeWidth="1.5" />
      <line x1="29" y1="32" x2="33" y2="32" stroke="#f59e0b" strokeWidth="1.5" />
      <circle cx="24" cy="32" r="1.8" fill="#1c1917" />
      <circle cx="38" cy="32" r="1.8" fill="#1c1917" />
      <circle cx="24.6" cy="31.3" r="0.6" fill="#fff" />
      <circle cx="38.6" cy="31.3" r="0.6" fill="#fff" />
      {/* Bright Smile */}
      <path d="M26 39 Q31 43 36 39 Z" fill="#ffffff" />
      <path d="M26 39 Q31 43 36 39" stroke="#451a03" strokeWidth="1" fill="none" />
      {/* Hand Gesture */}
      <g transform="translate(43, 34) scale(0.8)">
        <ellipse cx="5" cy="8" rx="4" ry="5" fill="#b45309" />
        <circle cx="8" cy="5" r="1.8" fill="#d97706" />
      </g>
    </g>
  );
}

/**
 * 8. Compliance Auditor — Elegant Pink Hijab, Gentle Winking Smile
 */
function RenderComplianceAuditor({ accent, idPrefix }) {
  return (
    <g>
      <defs>
        <radialGradient id={`${idPrefix}-skin8`} cx="45%" cy="40%" r="55%">
          <stop offset="0%" stopColor="#ffedd5" />
          <stop offset="70%" stopColor="#fed7aa" />
          <stop offset="100%" stopColor="#fb923c" />
        </radialGradient>
        <linearGradient id={`${idPrefix}-hijab`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f472b6" />
          <stop offset="100%" stopColor="#db2777" />
        </linearGradient>
      </defs>
      {/* Hijab Outer Drapes */}
      <path d="M14 26 C12 12, 52 12, 50 26 C50 44, 46 54, 32 54 C18 54, 14 44, 14 26 Z" fill={`url(#${idPrefix}-hijab)`} />
      {/* Face Opening */}
      <ellipse cx="32" cy="33" rx="12.5" ry="14" fill={`url(#${idPrefix}-skin8)`} />
      {/* Hijab Inner Wrap Fold */}
      <path d="M19 26 Q32 20 45 26" stroke="#be185d" strokeWidth="1.5" fill="none" />
      {/* Eyes: Wink and Cheerful Eye */}
      <path d="M23 31 Q26 33.5 29 31" stroke="#451a03" strokeWidth="1.8" strokeLinecap="round" fill="none" />
      <circle cx="37" cy="30" r="1.8" fill="#451a03" />
      <circle cx="37.6" cy="29.3" r="0.6" fill="#fff" />
      {/* Rosy Cheeks */}
      <circle cx="23" cy="35" r="2.5" fill="#f43f5e" opacity="0.3" />
      <circle cx="41" cy="35" r="2.5" fill="#f43f5e" opacity="0.3" />
      {/* Gentle Smile */}
      <path d="M27 37 Q32 41 37 37" stroke="#451a03" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
  );
}

const RENDERERS = {
  'Cyber Scout': RenderCyberScout,
  'Net Warden': RenderNetWarden,
  'Web Shield': RenderWebShield,
  'Code Breaker': RenderCodeBreaker,
  'Bio-Scanner': RenderBioScanner,
  'AI Sentinel': RenderAISentinel,
  'Forensics Investigator': RenderForensicsInvestigator,
  'Compliance Auditor': RenderComplianceAuditor,
};

export default function AnimatedToolAvatar({
  archetype = 'Cyber Scout',
  accent = '#00d4ff',
  size = 56,
  className = '',
  alt,
  ...rest
}) {
  const shouldReduceMotion = useReducedMotion();
  const normalized = normalizeArchetype(archetype);
  const Renderer = RENDERERS[normalized] || RenderCyberScout;
  const idPrefix = `avatar-${normalized.replace(/\s+/g, '-').toLowerCase()}-${Math.random().toString(36).substr(2, 5)}`;

  const isDecorative = alt === '';
  const accessibilityProps = isDecorative
    ? { role: 'presentation', 'aria-hidden': 'true' }
    : { role: 'img', 'aria-label': alt || `${normalized} Avatar` };

  return (
    <motion.div
      className={`inline-flex items-center justify-center select-none ${className}`}
      style={{ width: size, height: size }}
      whileHover={shouldReduceMotion ? {} : { scale: 1.08, y: -2 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      {...rest}
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...accessibilityProps}
      >
        <Renderer accent={accent} idPrefix={idPrefix} />
      </svg>
    </motion.div>
  );
}

export { AnimatedToolAvatar };
