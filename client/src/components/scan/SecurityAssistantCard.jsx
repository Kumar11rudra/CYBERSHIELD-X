import React, { useMemo } from 'react';
import { getAssistantBrief } from '../../utils/scanInsights';
import { useLanguage } from '../../context/LanguageContext';

const TONE_BY_RISK = {
  dangerous: {
    border: 'border-cyber-red/40',
    badge: 'border-cyber-red/30 bg-cyber-red/10 text-cyber-red',
    glow: '0 0 24px rgb(var(--cyber-red-rgb) / 0.12)',
  },
  medium: {
    border: 'border-cyber-orange/40',
    badge: 'border-cyber-orange/30 bg-cyber-orange/10 text-cyber-orange',
    glow: '0 0 24px rgb(var(--cyber-orange-rgb) / 0.12)',
  },
  low: {
    border: 'border-yellow-500/30',
    badge: 'border-yellow-500/30 bg-yellow-500/10 text-cyber-yellow',
    glow: '0 0 24px rgb(var(--cyber-yellow-rgb) / 0.12)',
  },
  safe: {
    border: 'border-cyber-green/30',
    badge: 'border-cyber-green/30 bg-cyber-green/10 text-cyber-green',
    glow: '0 0 24px rgb(var(--cyber-green-rgb) / 0.12)',
  },
};

export default function SecurityAssistantCard({ scan, compact = false }) {
  const { language } = useLanguage();
  const brief = useMemo(() => getAssistantBrief(scan, language), [scan, language]);
  const tone = TONE_BY_RISK[brief.riskLevel] || TONE_BY_RISK.safe;
  const copy = {
    assistant: 'Security assistant',
    move: 'Recommended move',
    drivenBy: 'Driven by',
  };

  return (
    <div
      className={`rounded-xl border ${tone.border} bg-cyber-surface/45 px-4 py-4`}
      style={{ boxShadow: tone.glow }}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.assistant}</p>
          <h3 className="font-display text-lg text-cyber-text mt-2">{brief.headline}</h3>
        </div>
        <div className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${tone.badge}`}>
          {brief.confidence}
        </div>
      </div>

      <p className="font-mono text-xs text-cyber-text mt-3 leading-relaxed">{brief.narrative}</p>

      <div className={`mt-4 rounded-lg border ${tone.border} bg-cyber-bg/25 px-3 py-3`}>
        <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-cyber-muted">{copy.move}</p>
        <p className="font-mono text-xs text-cyber-text mt-2 leading-relaxed">{brief.primaryAction}</p>
      </div>

      {!compact && brief.primaryDrivers.length > 0 && (
        <div className="mt-4 flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.drivenBy}</span>
          {brief.primaryDrivers.map((driver) => (
            <span
              key={driver}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${tone.badge}`}
            >
              {driver}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
