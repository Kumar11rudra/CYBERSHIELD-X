import React, { useEffect, useState } from 'react';

const RISK_COLORS = {
  safe: '#00ff88',
  low: '#ffdd00',
  medium: '#ff8c00',
  dangerous: '#ff2244',
};

export default function ThreatGauge({ score = 0, riskLevel = 'safe', size = 180 }) {
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedScore(score), 100);
    return () => clearTimeout(timer);
  }, [score]);

  const radius = size * 0.38;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * radius;
  const arcLength = circumference * 0.75; // 270-degree arc
  const offset = arcLength - (animatedScore / 100) * arcLength;
  const color = RISK_COLORS[riskLevel] || 'rgb(var(--cyber-accent-rgb))';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-[135deg]">
        {/* Background track */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke="rgb(var(--cyber-border-rgb))"
          strokeWidth={size * 0.055}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
        />
        {/* Score arc */}
        <circle
          cx={cx} cy={cy} r={radius}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.055}
          strokeLinecap="round"
          strokeDasharray={`${arcLength} ${circumference}`}
          strokeDashoffset={offset}
          className="threat-gauge"
          style={{
            filter: `drop-shadow(0 0 ${size * 0.04}px ${color})`,
            transition: 'stroke-dashoffset 1.2s cubic-bezier(0.4, 0, 0.2, 1), stroke 0.5s ease',
          }}
        />
      </svg>
      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="font-display font-bold leading-none"
          style={{ fontSize: size * 0.22, color }}
        >
          {animatedScore}
        </span>
        <span className="font-mono text-cyber-muted uppercase tracking-widest" style={{ fontSize: size * 0.07 }}>
          /100
        </span>
        <span
          className="font-mono uppercase tracking-wider mt-1 font-semibold"
          style={{ fontSize: size * 0.07, color }}
        >
          {riskLevel}
        </span>
      </div>
    </div>
  );
}
