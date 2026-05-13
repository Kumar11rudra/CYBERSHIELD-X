import React from 'react';

export default function BrandLogo({ size = 40, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`${className} cyber-logo-animate`}
    >
      <style>
        {`
          @keyframes nodePulse {
            0%, 100% { opacity: 0.4; r: 1.5; }
            50% { opacity: 1; r: 2.5; }
          }
          @keyframes radarRotate {
            from { transform: rotate(0deg); transform-origin: center; }
            to { transform: rotate(360deg); transform-origin: center; }
          }
          @keyframes shieldBreath {
            0%, 100% { filter: drop-shadow(0 0 5px rgba(0,212,255,0.2)); }
            50% { filter: drop-shadow(0 0 15px rgba(0,212,255,0.5)); }
          }
          .animate-node { animation: nodePulse 2s infinite ease-in-out; }
          .animate-radar { animation: radarRotate 10s infinite linear; }
          .animate-shield { animation: shieldBreath 4s infinite ease-in-out; }
        `}
      </style>
      <defs>
        <linearGradient id="shieldGrad" x1="0" y1="0" x2="100" y2="0">
          <stop offset="50%" stopColor="#00d4ff" />
          <stop offset="50%" stopColor="#00ff88" />
        </linearGradient>
        <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
        <filter id="heavyGlow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feComposite in="SourceGraphic" in2="blur" operator="over" />
        </filter>
      </defs>

      {/* Outer Shield Outline */}
      <path
        d="M50 5 L90 20 L90 60 C90 80 50 95 50 95 C50 95 10 80 10 60 L10 20 Z"
        stroke="url(#shieldGrad)"
        strokeWidth="4"
        fill="rgba(5, 10, 20, 0.8)"
        filter="url(#neonGlow)"
        className="animate-shield"
      />

      {/* Inner Shield Trim */}
      <path
        d="M50 14 L82 25 L82 58 C82 72 50 85 50 85 C50 85 18 72 18 58 L18 25 Z"
        stroke="url(#shieldGrad)"
        strokeWidth="1.5"
        fill="none"
        opacity="0.6"
      />

      {/* Circuit Nodes (Left Blue Side) */}
      <circle cx="25" cy="35" r="1.5" fill="#00d4ff" filter="url(#neonGlow)" className="animate-node" />
      <path d="M25 35 L35 35 L40 40" stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.6" />
      <circle cx="28" cy="50" r="1.5" fill="#00d4ff" filter="url(#neonGlow)" className="animate-node" style={{ animationDelay: '0.5s' }} />
      <path d="M28 50 L35 50 L40 45" stroke="#00d4ff" strokeWidth="1" fill="none" opacity="0.6" />

      {/* Radar arcs (Right Green Side) - now rotating */}
      <g className="animate-radar">
        <path d="M70 30 A 25 25 0 0 1 80 50" stroke="#00ff88" strokeWidth="1" strokeDasharray="2 4" fill="none" opacity="0.6" />
        <path d="M60 25 A 35 35 0 0 1 85 60" stroke="#00ff88" strokeWidth="1" strokeDasharray="1 6" fill="none" opacity="0.3" />
      </g>

      {/* The Central 'X' Symbol */}
      <path
        d="M30 35 L45 50 L30 65 L40 65 L50 55 L60 65 L70 65 L55 50 L70 35 L60 35 L50 45 L40 35 Z"
        fill="url(#shieldGrad)"
        filter="url(#heavyGlow)"
      />
      <path
        d="M34 37 L45 48 L45 52 L34 63 L38 63 L50 51 L62 63 L66 63 L55 52 L55 48 L66 37 L62 37 L50 49 L38 37 Z"
        fill="#ffffff"
      />

      {/* Keyhole dead center over the X */}
      <path d="M50 46 A 3.5 3.5 0 1 0 50 52 L 47 57.5 L 53 57.5 Z" fill="#050a14" />
    </svg>
  );
}
