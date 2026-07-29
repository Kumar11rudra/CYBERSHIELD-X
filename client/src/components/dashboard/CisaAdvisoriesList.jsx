import React from 'react';

/**
 * CisaAdvisoriesList Component
 * Renders the list of real-time CISA advisories.
 */
export default function CisaAdvisoriesList({ threats = [] }) {
  return (
    <div className="flex flex-col border border-cyber-border/10 bg-cyber-card rounded-xl p-4 shadow-sm h-[400px]">
      <div className="border-b border-cyber-border/10 pb-3 mb-3 flex justify-between items-center">
        <span className="text-xs font-bold text-cyber-text tracking-widest uppercase">
          CISA CYBERSECURITY ADVISORIES
        </span>
        <span className="text-[9px] text-cyber-orange font-bold border border-cyber-orange/20 bg-cyber-orange/10 px-2 py-0.5 rounded animate-pulse">
          REALTIME
        </span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
        {threats.length === 0 ? (
          <p className="text-xs text-cyber-muted italic text-center mt-8">
            No live advisories available at this moment.
          </p>
        ) : (
          threats.map((t, idx) => {
            let badgeColor = 'bg-cyber-green/10 text-cyber-green border border-cyber-green/20';
            if (t.severity === 'Critical') {
              badgeColor = 'bg-cyber-red/10 text-cyber-red border border-cyber-red/20 animate-pulse';
            } else if (t.severity === 'High') {
              badgeColor = 'bg-cyber-orange/10 text-cyber-orange border border-cyber-orange/20';
            } else if (t.severity === 'Medium') {
              badgeColor = 'bg-amber-500/10 text-amber-600 border border-amber-500/20';
            }

            return (
              <div
                key={t.id || idx}
                className="border border-cyber-border/10 bg-cyber-surface rounded-lg p-3 hover:border-cyber-accent/20 transition-all"
              >
                <div className="flex justify-between items-start gap-3 mb-1.5">
                  <span
                    className={`text-[8.5px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${badgeColor}`}
                  >
                    {t.severity || 'LOW'}
                  </span>
                  <span className="text-[9px] text-cyber-muted">{t.publishedAt || 'RECENT'}</span>
                </div>
                <h4 className="text-xs font-bold text-cyber-text leading-relaxed mb-1.5 line-clamp-2">
                  {t.title}
                </h4>
                <div className="flex justify-between items-center border-t border-cyber-border/5 pt-1.5 text-[10px]">
                  <span className="text-cyber-muted italic font-semibold">
                    {t.advisoryType || 'Alert'}
                  </span>
                  <a
                    href={t.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyber-accent hover:underline hover:text-cyber-accent/80 font-bold focus:ring-2 focus:ring-cyber-accent/40 rounded px-1 outline-none transition-all"
                  >
                    READ ADVISORY &gt;
                  </a>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
