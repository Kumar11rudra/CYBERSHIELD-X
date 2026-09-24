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
 * 1. Cyber Scout — Compact Cyber Helmet + Scanning Visor + Antenna Beacon
 */
function RenderCyberScout({ accent }) {
  return (
    <g>
      {/* Helmet Shell */}
      <path
        d="M18 22 C18 14, 46 14, 46 22 L48 40 C48 48, 40 54, 32 54 C24 54, 16 48, 16 40 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Head Crest */}
      <path
        d="M26 15 L32 12 L38 15"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.8"
      />
      {/* Side Antenna */}
      <path
        d="M48 28 L54 22 M54 22 L54 17"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="54" cy="17" r="2" fill={accent} />
      {/* Visor Enclosure */}
      <rect
        x="20"
        y="26"
        width="24"
        height="8"
        rx="4"
        fill={accent}
        fillOpacity="0.25"
        stroke={accent}
        strokeWidth="1.2"
      />
      {/* Inner Visor Scanner Slit */}
      <rect
        x="23"
        y="28.5"
        width="18"
        height="3"
        rx="1.5"
        fill={accent}
      />
      {/* Forehead Optical Sensor */}
      <circle cx="32" cy="20" r="1.5" fill={accent} />
      {/* Jawline Reinforcement */}
      <path
        d="M26 46 L38 46"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
    </g>
  );
}

/**
 * 2. Net Warden — Hexagonal Defensive Shield Helmet + Network Connection Nodes
 */
function RenderNetWarden({ accent }) {
  return (
    <g>
      {/* Shield Silhouette */}
      <path
        d="M32 12 L48 19 L48 37 C48 46, 32 54, 32 54 C32 54, 16 46, 16 37 L16 19 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Upper Defense Crest */}
      <path
        d="M26 16 L32 20 L38 16"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Dual Angular Visor Slits */}
      <path
        d="M21 28 L28 28 L30 32 L23 32 Z"
        fill={accent}
      />
      <path
        d="M43 28 L36 28 L34 32 L41 32 Z"
        fill={accent}
      />
      {/* Network Node Cluster */}
      <circle cx="32" cy="38" r="2" fill={accent} />
      <line
        x1="24"
        y1="38"
        x2="40"
        y2="38"
        stroke={accent}
        strokeWidth="1"
        strokeDasharray="1.5 1.5"
        strokeOpacity="0.8"
      />
      <circle cx="24" cy="38" r="1.2" fill={accent} />
      <circle cx="40" cy="38" r="1.2" fill={accent} />
    </g>
  );
}

/**
 * 3. Web Shield — Browser Frame Head + Central Port Security Shield
 */
function RenderWebShield({ accent }) {
  return (
    <g>
      {/* Browser Frame Chassis */}
      <rect
        x="16"
        y="15"
        width="32"
        height="38"
        rx="8"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Window Controls */}
      <circle cx="21" cy="20" r="1.2" fill="#ef4444" opacity="0.9" />
      <circle cx="25" cy="20" r="1.2" fill="#facc15" opacity="0.9" />
      <circle cx="29" cy="20" r="1.2" fill="#22c55e" opacity="0.9" />
      <line x1="16" y1="24" x2="48" y2="24" stroke="#1e293b" strokeWidth="1" />
      {/* Central Web Defense Shield */}
      <path
        d="M32 29 L39 33 V39 C39 44, 32 47, 32 47 C32 47, 25 44, 25 39 V33 Z"
        fill={accent}
        fillOpacity="0.25"
        stroke={accent}
        strokeWidth="1.3"
      />
      {/* SSL Lock Core */}
      <circle cx="32" cy="36.5" r="2" fill={accent} />
      <path
        d="M30.5 35 V33 C30.5 32, 33.5 32, 33.5 33 V35"
        fill="none"
        stroke={accent}
        strokeWidth="1"
      />
    </g>
  );
}

/**
 * 4. Code Breaker — Angular Chiseled Mask + Code Bracket Optics (< / >)
 */
function RenderCodeBreaker({ accent }) {
  return (
    <g>
      {/* Angular Chiseled Shell */}
      <polygon
        points="32,13 47,20 45,43 32,53 19,43 17,20"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Code Left Bracket Optic < */}
      <path
        d="M27 28 L23 32 L27 36"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Code Right Bracket Optic > */}
      <path
        d="M37 28 L41 32 L37 36"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Center Delimiter / */}
      <line
        x1="33"
        y1="28"
        x2="31"
        y2="36"
        stroke={accent}
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeOpacity="0.6"
      />
      {/* Circuit Traces */}
      <path
        d="M21 42 L26 47 M43 42 L38 47"
        stroke={accent}
        strokeWidth="1.2"
        strokeOpacity="0.5"
        strokeLinecap="round"
      />
    </g>
  );
}

/**
 * 5. Bio-Scanner — Hazmat Diagnostics Respirator + Concentric Analytical Eye
 */
function RenderBioScanner({ accent }) {
  return (
    <g>
      {/* Domed Respirator Shell */}
      <path
        d="M20 25 C20 15, 44 15, 44 25 L45 38 C45 44, 41 48, 38 50 L26 50 C23 48, 19 44, 19 38 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Curved Hazmat Visor */}
      <path
        d="M21 28 C21 23, 43 23, 43 28 C43 33, 21 33, 21 28 Z"
        fill={accent}
        fillOpacity="0.25"
        stroke={accent}
        strokeWidth="1.3"
      />
      {/* Concentric Diagnostic Iris */}
      <circle cx="32" cy="28" r="2.5" fill={accent} />
      <circle
        cx="32"
        cy="28"
        r="4.8"
        fill="none"
        stroke={accent}
        strokeWidth="0.8"
        strokeDasharray="2 1"
      />
      {/* Dual Particle Filters */}
      <circle cx="25" cy="44" r="3.5" fill="#0f172a" stroke={accent} strokeWidth="1" />
      <circle cx="39" cy="44" r="3.5" fill="#0f172a" stroke={accent} strokeWidth="1" />
      <line x1="23.5" y1="44" x2="26.5" y2="44" stroke={accent} strokeWidth="1" />
      <line x1="37.5" y1="44" x2="40.5" y2="44" stroke={accent} strokeWidth="1" />
    </g>
  );
}

/**
 * 6. AI Sentinel — Android Visage + Forehead Synaptic Node + Slit Visor
 */
function RenderAISentinel({ accent }) {
  return (
    <g>
      {/* Android Head Contour */}
      <path
        d="M32 14 C22 14, 18 22, 18 32 C18 42, 24 51, 32 54 C40 51, 46 42, 46 32 C46 22, 42 14, 32 14 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Synaptic Forehead Diamond */}
      <polygon points="32,18 35.5,22 32,26 28.5,22" fill={accent} />
      {/* Dual Robotic Eye Slits */}
      <path d="M22 32.5 L29 32.5" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M35 32.5 L42 32.5" stroke={accent} strokeWidth="2.2" strokeLinecap="round" />
      {/* Neural Core Spine */}
      <line
        x1="32"
        y1="27"
        x2="32"
        y2="42"
        stroke={accent}
        strokeWidth="1"
        strokeOpacity="0.6"
        strokeDasharray="1.5 1.5"
      />
      {/* Audio Baffle */}
      <line
        x1="28"
        y1="46"
        x2="36"
        y2="46"
        stroke={accent}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeOpacity="0.75"
      />
    </g>
  );
}

/**
 * 7. Forensics Investigator — Asymmetric Optical Monocle + Scanner Reticle
 */
function RenderForensicsInvestigator({ accent }) {
  return (
    <g>
      {/* Tactical Chassis */}
      <path
        d="M19 22 C19 15, 45 15, 45 22 L47 41 C47 48, 40 53, 32 53 C24 53, 17 48, 17 41 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Tactical Visor Brow */}
      <path d="M17 24 L47 24" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
      {/* Left Optical Slit */}
      <rect x="22" y="30.5" width="7" height="3" rx="1.5" fill={accent} fillOpacity="0.75" />
      {/* Right Forensic Monocle Aperture */}
      <circle cx="37" cy="32" r="6.5" fill="#070d1d" stroke={accent} strokeWidth="1.4" />
      <circle cx="37" cy="32" r="3.5" fill={accent} fillOpacity="0.3" stroke={accent} strokeWidth="0.8" />
      <line x1="37" y1="24.5" x2="37" y2="39.5" stroke={accent} strokeWidth="0.8" strokeOpacity="0.6" />
      <line x1="29.5" y1="32" x2="44.5" y2="32" stroke={accent} strokeWidth="0.8" strokeOpacity="0.6" />
      <circle cx="37" cy="32" r="1.3" fill={accent} />
    </g>
  );
}

/**
 * 8. Compliance Auditor — Symmetric Shield Crown + Verification Check Emblem
 */
function RenderComplianceAuditor({ accent }) {
  return (
    <g>
      {/* Crested Shield Crown */}
      <path
        d="M32 12 L47 17 V34 C47 44, 32 53, 32 53 C32 53, 17 44, 17 34 V17 Z"
        fill="#0c162d"
        stroke="#1e293b"
        strokeWidth="1.5"
      />
      {/* Verification Checkmark Emblem */}
      <path
        d="M27 21 L31 25 L37 18"
        fill="none"
        stroke={accent}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Steady Visor Bar */}
      <rect
        x="21"
        y="30"
        width="22"
        height="4.5"
        rx="2"
        fill={accent}
      />
      {/* Dual Balance Pillars */}
      <line x1="25" y1="38" x2="25" y2="43" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="39" y1="38" x2="39" y2="43" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
      <line x1="23" y1="43" x2="41" y2="43" stroke={accent} strokeWidth="1.2" strokeLinecap="round" strokeOpacity="0.7" />
    </g>
  );
}

/**
 * Dispatches to the appropriate archetype renderer
 */
function RenderArchetypeContent({ archetype, accent }) {
  switch (archetype) {
    case 'Net Warden':
      return <RenderNetWarden accent={accent} />;
    case 'Web Shield':
      return <RenderWebShield accent={accent} />;
    case 'Code Breaker':
      return <RenderCodeBreaker accent={accent} />;
    case 'Bio-Scanner':
      return <RenderBioScanner accent={accent} />;
    case 'AI Sentinel':
      return <RenderAISentinel accent={accent} />;
    case 'Forensics Investigator':
      return <RenderForensicsInvestigator accent={accent} />;
    case 'Compliance Auditor':
      return <RenderComplianceAuditor accent={accent} />;
    case 'Cyber Scout':
    default:
      return <RenderCyberScout accent={accent} />;
  }
}

/**
 * 🤖 AnimatedToolAvatar
 *
 * Lightweight, accessible, vector-animated avatar for CyberShield X tool cards.
 * Renders 8 distinct cyber archetypes with idle breathing and hover micro-animations.
 *
 * @param {Object} props
 * @param {string} [props.archetype='Cyber Scout'] - Archetype name
 * @param {string} [props.accent='#00d4ff'] - Primary theme accent color
 * @param {number} [props.size=64] - Size in pixels (width and height)
 * @param {string} [props.className=''] - Additional CSS classes
 * @param {boolean} [props.reducedMotion=false] - Explicit override to disable animations
 * @param {string} [props.alt=''] - Descriptive label if used as non-decorative image
 */
export default function AnimatedToolAvatar({
  archetype = 'Cyber Scout',
  accent = '#00d4ff',
  size = 64,
  className = '',
  reducedMotion = false,
  alt = '',
}) {
  const prefersReduced = useReducedMotion();
  const shouldReduce = Boolean(reducedMotion || prefersReduced);

  const normalizedArchetype = normalizeArchetype(archetype);
  const safeAccent = accent && typeof accent === 'string' && accent.startsWith('#') ? accent : '#00d4ff';
  const safeSize = Number.isFinite(size) && size > 0 ? size : 64;

  const isDecorative = !alt;

  // Animation variants
  const containerVariants = {
    idle: shouldReduce
      ? { y: 0 }
      : {
          y: [0, -2.5, 0],
          transition: {
            duration: 3.5,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        },
    hover: shouldReduce
      ? { scale: 1 }
      : {
          scale: 1.06,
          transition: {
            duration: 0.2,
            ease: 'easeOut',
          },
        },
  };

  return (
    <motion.div
      className={`relative flex items-center justify-center select-none ${className}`}
      style={{
        width: safeSize,
        height: safeSize,
        filter: `drop-shadow(0 0 10px ${safeAccent}35)`,
      }}
      initial="idle"
      animate="idle"
      whileHover="hover"
      variants={containerVariants}
    >
      <svg
        viewBox="0 0 64 64"
        width={safeSize}
        height={safeSize}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        focusable="false"
        aria-hidden={isDecorative ? 'true' : 'false'}
        role={isDecorative ? 'presentation' : 'img'}
        aria-label={isDecorative ? undefined : alt}
        className="w-full h-full overflow-visible"
      >
        {/* Subtle Ambient Radial Glow */}
        <defs>
          <radialGradient id={`halo-${normalizedArchetype.replace(/\s+/g, '-')}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={safeAccent} stopOpacity="0.25" />
            <stop offset="100%" stopColor={safeAccent} stopOpacity="0" />
          </radialGradient>
        </defs>

        <circle
          cx="32"
          cy="32"
          r="26"
          fill={`url(#halo-${normalizedArchetype.replace(/\s+/g, '-')})`}
        />

        {/* Archetype SVG Geometry */}
        <RenderArchetypeContent archetype={normalizedArchetype} accent={safeAccent} />
      </svg>
    </motion.div>
  );
}

export { AnimatedToolAvatar };
