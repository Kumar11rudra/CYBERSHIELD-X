import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'permitted-activities',
    title: '1. Permitted Scanning Scope',
    icon: '✓',
    content: [
      '**Passive Reconnaissance**: Querying public domain databases (WHOIS, DNS records), checking SSL/TLS certificate transparency logs, and analyzing SMS patterns locally are permitted.',
      '**Authorized Systems Only**: You may only submit search targets (URLs, domains, IPs) that you own, represent, or have obtained explicit, written authorization to analyze.',
      '**Security Education**: Using platform telemetry for academic research or personal cybersecurity training is highly encouraged.'
    ]
  },
  {
    id: 'prohibited-activities',
    title: '2. Strictly Prohibited Exploits',
    icon: '✗',
    content: [
      '**Unauthorized Intrusive Scans**: You must NOT launch active vulnerability scanning (e.g. port sweeps, fuzzing, brute force) against systems without express permission.',
      '**Malicious Automation**: You must NOT script or automate our search fields to bulk-query endpoints, scrape intelligence databases, or bypass our rate-limiting handlers.',
      '**Phishing/Spoofing Impersonation**: You must NOT use findings or reports to construct brand spoofing templates or deceptive communications targeting third parties.',
      '**Denial of Service**: You must NOT perform actions that deliberately degrade the availability of our systems, external breach engines, or third-party DNS components.'
    ]
  },
  {
    id: 'enforcement',
    title: '3. Detection & Enforcement',
    icon: '🛡️',
    content: [
      '**Session Revocation**: We actively log and monitor API usage patterns. Accounts found attempting SSRF loops, scanning private/loopback address blocks, or performing API abuse will face immediate credential revocation.',
      '**Legal Reporting**: Extreme violations (such as staging attacks or harvesting user credentials) will be catalogued and reported to relevant national law enforcement or cyber emergency response teams (CERTs).'
    ]
  }
];

export default function AcceptableUsePolicyPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 font-mono text-[#e0e6ff] relative z-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12 border border-[#00bfff]/20 bg-[#070f21]/80 rounded-2xl p-6 shadow-[0_0_24px_rgba(0,191,255,0.06)]"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-accent/10 border border-cyber-accent/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
          <span className="text-[10px] text-cyber-accent uppercase tracking-widest font-bold">Scope Module</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">ACCEPTABLE USE POLICY</h1>
        <p className="text-cyber-muted text-xs uppercase tracking-[.3em] mb-4">
          Effective: August 2026 · Version 1.0 · Ethics Charter
        </p>
        <p className="text-sm text-cyber-text/70 leading-relaxed">
          This Acceptable Use Policy defines the parameters for permitted security analysis using CyberShield X passive scanning systems.
        </p>
        <div className="mt-4 flex gap-3 flex-wrap">
          <Link to="/privacy" className="text-xs text-cyber-accent hover:underline">→ Privacy Policy</Link>
          <span className="text-cyber-muted text-xs">|</span>
          <Link to="/terms" className="text-xs text-cyber-accent hover:underline">→ Terms of Service</Link>
        </div>
      </motion.div>

      <div className="space-y-4">
        {sections.map((sec) => (
          <div key={sec.id} className="border border-[#224466]/40 bg-[#070f21]/70 rounded-xl overflow-hidden">
            <div
              onClick={() => setExpandedSection(expandedSection === sec.id ? null : sec.id)}
              className="p-5 flex items-center justify-between cursor-pointer hover:bg-white/[0.01] transition-all"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{sec.icon}</span>
                <span className="text-sm font-bold text-white uppercase tracking-wider">{sec.title}</span>
              </div>
              <span className="text-cyber-muted text-xs">{expandedSection === sec.id ? '▲' : '▼'}</span>
            </div>

            <AnimatePresence>
              {expandedSection === sec.id && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-5 bg-black/30 border-t border-[#224466]/20 space-y-4 text-xs leading-relaxed text-gray-300">
                    {sec.content.map((p, idx) => (
                      <p key={idx} dangerouslySetInnerHTML={{ __html: p.replace(/\*\*(.*?)\*\*/g, '<strong class="text-white">$1</strong>') }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>
    </div>
  );
}
