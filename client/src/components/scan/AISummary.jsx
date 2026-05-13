import React from 'react';
import { motion } from 'framer-motion';

const buildSummary = (scan) => {
  if (!scan) return null;

  const { threatScore, riskLevel, targetType, breakdown } = scan;
  const vt = breakdown?.virusTotal;
  const abuse = breakdown?.abuseIPDB;
  const pos = vt?.positives ?? 0;
  const total = vt?.total ?? 0;
  const conf = abuse?.abuseConfidenceScore ?? 0;

  if (riskLevel === 'dangerous') {
    if (targetType === 'url' || targetType === 'domain') return {
      headline: '⚠ Active Phishing / Malware Site',
      body: `This ${targetType} was flagged as malicious by ${pos} out of ${total} security engines. It is likely a phishing trap designed to steal credentials, spread malware, or conduct fraud. Do not visit or share this link.`,
      action: 'Block this domain immediately in your firewall or DNS filter.',
      severity: 'dangerous',
    };

    if (targetType === 'ip') return {
      headline: '⚠ Malicious IP Address',
      body: `This IP has an abuse confidence score of ${conf}% — actively used for attacks (spam, DDoS, brute-force, or botnet). Connections from this IP should be treated as hostile.`,
      action: 'Block this IP at your firewall. Consider reporting to AbuseIPDB.',
      severity: 'dangerous',
    };

    if (targetType === 'hash') return {
      headline: '⚠ Known Malware File',
      body: `This file hash matches a known malware signature. ${pos} out of ${total} antivirus engines identified it as malicious. If this file exists on any system, quarantine it immediately.`,
      action: 'Quarantine and delete this file. Run a full system scan.',
      severity: 'dangerous',
    };
  }

  if (riskLevel === 'medium') return {
    headline: '⚡ Suspicious Activity — Proceed With Caution',
    body: `This ${targetType} shows suspicious behavior (score: ${threatScore}/100). It has been flagged by ${pos > 0 ? `${pos} security engines` : 'threat intelligence sources'} and warrants investigation before trusting it.`,
    action: 'Do not enter credentials or download files from this source until verified.',
    severity: 'medium',
  };

  if (riskLevel === 'low') return {
    headline: '🔍 Minor Risk — Low Confidence Flags',
    body: `This ${targetType} has a low threat score of ${threatScore}/100. Minor concerns were raised by a small number of engines but no confirmed malicious activity was found.`,
    action: 'Monitor for further activity. Treat as untrusted until verified.',
    severity: 'low',
  };

  return {
    headline: '✓ No Threats Found',
    body: `This ${targetType} appears clean. Out of ${total > 0 ? total : 'all queried'} security engines, none flagged it as malicious.`,
    action: null,
    severity: 'safe',
  };
};

const COLORS = {
  dangerous: '#ff2244',
  medium: '#ff8c00',
  low: '#ffdd00',
  safe: '#00ff88',
};

export default function AISummary({ scan }) {
  const summary = buildSummary(scan);
  if (!summary) return null;

  const c = COLORS[summary.severity] || COLORS.safe;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="rounded-lg p-5"
      style={{ border: `1px solid ${c}40`, background: `${c}09` }}>
      <div className="flex items-center gap-2 mb-3">
        <span className="font-mono text-[10px] tracking-widest uppercase px-2 py-0.5 rounded"
          style={{ color: c, border: `1px solid ${c}50`, background: `${c}15` }}>
          AI Plain-English Summary
        </span>
      </div>
      <h3 className="font-mono text-sm font-bold mb-2" style={{ color: c }}>{summary.headline}</h3>
      <p className="font-sans text-sm text-cyber-text/80 leading-relaxed mb-3">{summary.body}</p>
      {summary.action && (
        <div className="flex items-start gap-2 mt-3 pt-3 border-t" style={{ borderColor: `${c}25` }}>
          <span className="font-mono text-xs" style={{ color: c }}>→</span>
          <p className="font-mono text-xs" style={{ color: c }}>
            <strong>Recommended action:</strong> {summary.action}
          </p>
        </div>
      )}
    </motion.div>
  );
}
