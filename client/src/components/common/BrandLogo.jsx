import React from 'react';

export default function BrandLogo({ size = 40, className = "", color }) {
  const grad1 = color ? color : "#00f0ff";
  const grad2 = color ? color : "#00ff88";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cyber-brand-logo`}
      style={{ display: 'inline-block', verticalAlign: 'middle' }}
    >
      <defs>
        <linearGradient id={`brandNeon1_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={grad1} />
          <stop offset="50%" stopColor="#0099ff" />
          <stop offset="100%" stopColor={grad2} />
        </linearGradient>

        <linearGradient id={`brandArmorL_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#0c2548" />
          <stop offset="100%" stopColor="#020813" />
        </linearGradient>

        <linearGradient id={`brandArmorR_${size}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#091d38" />
          <stop offset="100%" stopColor="#01050d" />
        </linearGradient>

        <linearGradient id={`brandBlade1_${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#70eaff" />
          <stop offset="100%" stopColor="#0066cc" />
        </linearGradient>

        <linearGradient id={`brandBlade2_${size}`} x1="100%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="40%" stopColor="#a3ffdb" />
          <stop offset="100%" stopColor="#00aa66" />
        </linearGradient>

        <filter id={`brandGlow_${size}`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {/* Outer Glow Shield Rim */}
      <path
        d="M50 8 L86 22 L78 60 C74 76 50 92 50 92 C50 92 26 76 22 60 L14 22 Z"
        fill="none"
        stroke={`url(#brandNeon1_${size})`}
        strokeWidth="3.5"
        strokeLinejoin="miter"
        filter={`url(#brandGlow_${size})`}
      />

      {/* Shield Left Facet */}
      <path
        d="M50 10 L16 23 L23 59 C27 74 50 89 50 89 Z"
        fill={`url(#brandArmorL_${size})`}
      />

      {/* Shield Right Facet */}
      <path
        d="M50 10 L84 23 L77 59 C73 74 50 89 50 89 Z"
        fill={`url(#brandArmorR_${size})`}
      />

      {/* Spine */}
      <line x1="50" y1="10" x2="50" y2="89" stroke="#00f0ff" strokeWidth="0.8" opacity="0.6" />

      {/* Inner Angular Dashes */}
      <path
        d="M50 18 L76 28 L70 56 C67 67 50 80 50 80 C50 80 33 67 30 56 L24 28 Z"
        fill="none"
        stroke={grad1}
        strokeWidth="1"
        strokeDasharray="3 2"
        opacity="0.5"
      />

      {/* 3D Faceted Diamond X Blades */}
      {/* Top-Left to Bottom-Right */}
      <polygon points="30,28 42,28 70,68 58,68" fill={`url(#brandBlade1_${size})`} />
      {/* Top-Right to Bottom-Left */}
      <polygon points="70,28 58,28 30,68 42,68" fill={`url(#brandBlade2_${size})`} />

      {/* Center Razor Diamond */}
      <polygon
        points="50,39 57,48 50,57 43,48"
        fill="#010611"
        stroke={`url(#brandNeon1_${size})`}
        strokeWidth="1.2"
      />

      {/* Central Core Light */}
      <circle cx="50" cy="48" r="2.2" fill="#ffffff" />
      <circle cx="50" cy="48" r="1.2" fill={grad2} />
    </svg>
  );
}
