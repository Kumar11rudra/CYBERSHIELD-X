import React, { useMemo, useState } from 'react';
import { getScanGuidance } from '../../utils/scanInsights';
import { useLanguage } from '../../context/LanguageContext';

const RISK_ACCENTS = {
  dangerous: {
    border: 'border-cyber-red/40',
    background: 'bg-red-900/10',
    text: 'text-cyber-red',
    dot: 'rgb(var(--cyber-red-rgb))',
  },
  medium: {
    border: 'border-cyber-orange/40',
    background: 'bg-orange-900/10',
    text: 'text-cyber-orange',
    dot: 'rgb(var(--cyber-orange-rgb))',
  },
  low: {
    border: 'border-yellow-500/30',
    background: 'bg-yellow-500/10',
    text: 'text-cyber-yellow',
    dot: 'rgb(var(--cyber-yellow-rgb))',
  },
  safe: {
    border: 'border-cyber-green/30',
    background: 'bg-cyber-green/10',
    text: 'text-cyber-green',
    dot: 'rgb(var(--cyber-green-rgb))',
  },
};

export default function ScanGuidance({ scan, collapsible = false, defaultOpen }) {
  const { language } = useLanguage();
  const riskLevel = scan?.risk?.level || scan?.riskLevel || 'safe';
  const accent = RISK_ACCENTS[riskLevel] || RISK_ACCENTS.safe;
  const guidance = useMemo(() => getScanGuidance(scan, language), [scan, language]);
  const copy = {
    explanation: 'Plain-language explanation',
    signals: 'Main signals',
    influenced: 'What influenced the score',
    coverage: 'Coverage note',
    steps: 'Suggested next steps',
    why: 'Why this score?',
    summary: 'Simple explanation with recommended actions',
    guided: 'Guided analysis',
    hide: 'Hide explanation',
    see: 'See simple explanation and next steps',
    close: 'Close',
    open: 'Open',
  };
  const [open, setOpen] = useState(() => {
    if (!collapsible) return true;
    if (defaultOpen !== undefined) return defaultOpen;
    return riskLevel === 'dangerous' || riskLevel === 'medium';
  });

  const content = (
    <div className={`${collapsible ? 'border-t border-cyber-border/40 px-4 py-4' : 'px-5 py-5'} space-y-4`}>
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.explanation}</p>
        <p className="font-mono text-xs text-cyber-text mt-2 leading-relaxed">{guidance.summary}</p>
      </div>

      {guidance.primaryDrivers.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.signals}</span>
          {guidance.primaryDrivers.map((source) => (
            <span
              key={source}
              className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${accent.border} ${accent.background} ${accent.text}`}
            >
              {source}
            </span>
          ))}
        </div>
      )}

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.influenced}</p>
        <div className="mt-2 space-y-2">
          {guidance.reasons.map((reason) => (
            <div key={reason} className="rounded-lg border border-cyber-border/40 bg-cyber-surface/40 px-3 py-3">
              <p className="font-mono text-xs text-cyber-text leading-relaxed">{reason}</p>
            </div>
          ))}
        </div>
      </div>

      {guidance.coverageNotes.length > 0 && (
        <div className="rounded-lg border border-cyber-border/50 bg-cyber-surface/30 px-3 py-3">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.coverage}</p>
          <div className="mt-2 space-y-2">
            {guidance.coverageNotes.map((note) => (
              <p key={note} className="font-mono text-xs text-cyber-muted leading-relaxed">{note}</p>
            ))}
          </div>
        </div>
      )}

      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.steps}</p>
        <div className="mt-2 space-y-2">
          {guidance.actions.map((action) => (
            <div key={action} className="flex items-start gap-3 rounded-lg border border-cyber-border/40 bg-cyber-surface/40 px-3 py-3">
              <div className="mt-1 h-2 w-2 rounded-full" style={{ backgroundColor: accent.dot }} />
              <p className="font-mono text-xs text-cyber-text leading-relaxed">{action}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (!collapsible) {
    return (
      <div className={`cyber-card overflow-hidden border ${accent.border}`}>
        <div className="px-5 py-4 flex items-center justify-between gap-3 flex-wrap">
          <div>
            <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.why}</p>
            <p className={`font-mono text-xs mt-1 ${accent.text}`}>{copy.summary}</p>
          </div>
          <div className={`rounded-full border px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] ${accent.border} ${accent.background} ${accent.text}`}>
            {copy.guided}
          </div>
        </div>
        {content}
      </div>
    );
  }

  return (
    <div className={`rounded-xl border overflow-hidden ${accent.border} ${accent.background}`}>
      <button
        type="button"
        onClick={() => setOpen((current) => !current)}
        className="w-full px-4 py-3 text-left flex items-center justify-between gap-3"
      >
        <div>
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{copy.why}</p>
          <p className={`font-mono text-xs mt-1 ${accent.text}`}>{open ? copy.hide : copy.see}</p>
        </div>
        <span className="font-mono text-cyber-text text-xs uppercase tracking-[0.22em]">
          {open ? copy.close : copy.open}
        </span>
      </button>
      {open && content}
    </div>
  );
}
