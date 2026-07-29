import React from 'react';

const TICKER_ITEMS = [
  '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure',
  '🔴 ALERT: New Lumma Stealer campaign targeting Indian banks',
  '⚡ UrlEngine: 2.3M new IOCs detected in last 24h',
  '🛡 UrlEngine: 14,000+ IPs reported for DDoS activity today',
  '⚠ NCIIPC Advisory: Phishing attacks targeting UPI users',
  '🔴 CERT-In: Ransomware targeting MSME sector in India',
];

/**
 * ThreatTicker Component
 * Renders the top-header real-time warning indicators.
 */
export default function ThreatTicker() {
  return (
    <div className="threat-ticker-track flex gap-8 whitespace-nowrap text-[10px] font-mono text-cyber-muted uppercase tracking-widest italic opacity-50">
      {[...TICKER_ITEMS, ...TICKER_ITEMS].map((t, i) => (
        <span key={i}>{t}</span>
      ))}
    </div>
  );
}
