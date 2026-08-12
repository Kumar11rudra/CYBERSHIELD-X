import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';

const sections = [
  {
    id: 'what-are-cookies',
    title: '1. What Are Cookies',
    icon: '🍪',
    content: [
      'Cookies are small text files stored on your device (computer, tablet, or mobile) when you visit websites. They are widely used to make websites work, or work more efficiently, as well as to provide reporting information.',
      'We use both session cookies (which expire once you close your web browser) and persistent cookies (which stay on your device for a set period or until you delete them) to deliver a seamless cyber defense interface.',
      'Legal Note: This document serves as informational policy. It is strongly recommended to have all platform policies reviewed by professional legal counsel prior to formal business production.'
    ]
  },
  {
    id: 'how-we-use-them',
    title: '2. How We Use Cookies',
    icon: '⚙️',
    content: [
      '**Essential / Operational**: These cookies are critical to authenticate users, manage sessions, prevent cross-site request forgery (CSRF), and maintain access controls.',
      '**Preferences**: We store your selected preferences (such as language, light/dark mode theme, and dashboard layout settings) so you do not have to reset them on each visit.',
      '**Security Diagnostics**: Temporary session identifiers allow us to monitor brute-force access attempts, detect session hijacking indicators, and manage rate-limiting thresholds.',
      '**Analytics**: We do NOT use invasive tracking cookies. We track basic performance metrics and load latency locally to optimize our server performance.'
    ]
  },
  {
    id: 'managing-cookies',
    title: '3. Managing Your Choices',
    icon: '🛠️',
    content: [
      'You can control and manage cookies in various ways. Removing or blocking cookies may impact your user experience and parts of this platform (such as active sessions) may no longer be fully accessible.',
      '**Browser Controls**: Most browsers allow you to view, manage, delete, and block cookies for websites. You can find instructions in your browser\'s help documentation.',
      '**Theme & Context**: Clearing your local browser storage will reset your selected dashboard layouts and dark-mode preferences to system defaults.'
    ]
  }
];

export default function CookiePolicyPage() {
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
          <span className="text-[10px] text-cyber-accent uppercase tracking-widest font-bold">Policy Module</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">COOKIE POLICY</h1>
        <p className="text-cyber-muted text-xs uppercase tracking-[.3em] mb-4">
          Effective: August 2026 · Version 1.0 · Transparency Report
        </p>
        <p className="text-sm text-cyber-text/70 leading-relaxed">
          This Cookie Policy explains how CyberShield X uses cookies and similar technologies to recognize you when you visit our threat intelligence dashboard.
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
