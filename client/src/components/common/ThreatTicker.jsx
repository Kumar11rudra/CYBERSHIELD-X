import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';

const toneClasses = {
  dangerous: 'text-cyber-red',
  review: 'text-cyber-orange',
  watch: 'text-cyber-accent',
};

export default function ThreatTicker() {
  const [items, setItems] = useState([]);
  const [sourceLabel, setSourceLabel] = useState('CISA live feed');

  useEffect(() => {
    let active = true;

    const loadFeed = async () => {
      try {
        const res = await api.get('/threat-feed');
        if (!active) return;
        setItems(Array.isArray(res.data.items) ? res.data.items : []);
        setSourceLabel(res.data.source || 'CISA live feed');
      } catch {
        if (!active) return;
        setItems([]);
      }
    };

    loadFeed();
    const timer = window.setInterval(loadFeed, 15 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(timer);
    };
  }, []);

  const tickerItems = useMemo(() => {
    if (items.length > 0) return items;
    return [{
      id: 'fallback',
      title: 'Live threat ticker is preparing the latest advisory stream.',
      advisoryType: 'System',
      tone: 'watch',
      link: 'https://www.cisa.gov/news-events/cybersecurity-advisories',
    }];
  }, [items]);

  const renderedItems = [...tickerItems, ...tickerItems];

  return (
    <div className="border-b border-cyber-border bg-cyber-surface/75 backdrop-blur-md overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-4">
        <div className="shrink-0 inline-flex items-center gap-2 rounded-full border border-cyber-accent/25 bg-cyber-accent/5 px-3 py-1">
          <span className="h-2 w-2 rounded-full bg-cyber-red animate-pulse" />
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-accent">
            Live threat ticker
          </span>
        </div>

        <div className="min-w-0 flex-1 overflow-hidden">
          <div className="threat-ticker-track">
            {renderedItems.map((item, index) => (
              <a
                key={`${item.id}-${index}`}
                href={item.link}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 px-5 hover:opacity-90 transition-opacity"
              >
                <span className={`font-mono text-[11px] uppercase tracking-[0.2em] ${toneClasses[item.tone] || toneClasses.watch}`}>
                  {item.advisoryType}
                </span>
                <span className="font-mono text-xs text-cyber-text whitespace-nowrap">{item.title}</span>
              </a>
            ))}
          </div>
        </div>

        <div className="hidden xl:block shrink-0">
          <span className="font-mono text-[11px] uppercase tracking-[0.22em] text-cyber-muted">{sourceLabel}</span>
        </div>
      </div>
    </div>
  );
}
