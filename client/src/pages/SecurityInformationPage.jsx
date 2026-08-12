import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'encryption',
    title: '1. Local Data Protection & CSFLE',
    icon: '🔐',
    content: [
      '**AES-256-GCM Encryption**: All sensitive profile identifiers (such as phone numbers, emails, and active API tokens) are encrypted locally prior to persistence using Client-Side Field-Level Encryption (CSFLE).',
      '**JWT & Cookie Integrity**: User access tokens are delivered via cryptographically signed `httpOnly` secure cookies. This prevents script-based token extraction (XSS protection) and protects session integrity.'
    ]
  },
  {
    id: 'passwords',
    title: '2. Identity & Credential Vaults',
    icon: '🔑',
    content: [
      '**Salted Password Hashing**: Passwords are never stored in plaintext. We utilize bcrypt hashing with a workload factor of 12 to ensure robust defense against offline dictionary and rainbow table attacks.',
      '**Session Revocation**: System administrators can revoke compromised user sessions globally. Compromised or suspicious IP ranges are firewall-blocked in real-time.'
    ]
  },
  {
    id: 'reporting',
    title: '3. Vulnerability Disclosure & Audit',
    icon: '🚨',
    content: [
      '**Responsible Disclosure**: If you discover a security vulnerability affecting our services, please email details directly to our security response team at **security@YOUR-DOMAIN.com**.',
      '**Information Needed**: Include a detailed proof-of-concept description, replication steps, and the affected endpoint. We request that you give our response team reasonable time to remediate before disclosing details publicly.'
    ]
  }
];

export default function SecurityInformationPage() {
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
          <span className="text-[10px] text-cyber-accent uppercase tracking-widest font-bold">Security Module</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">SECURITY INFORMATION</h1>
        <p className="text-cyber-muted text-xs uppercase tracking-[.3em] mb-4">
          Effective: August 2026 · Version 1.0 · Technical Report
        </p>
        <p className="text-sm text-cyber-text/70 leading-relaxed">
          This document details the cryptographic safeguards and vulnerability reporting protocols configured to protect active accounts on CyberShield X.
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
