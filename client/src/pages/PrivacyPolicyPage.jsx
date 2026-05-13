import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const sections = [
  {
    id: 'overview',
    title: '1. Overview & Scope',
    icon: '🛡️',
    content: [
      'CyberShield X ("the Platform", "we", "us", or "our") is a cybersecurity threat intelligence platform operated by CyberShield X Technologies. This Privacy Policy governs how we collect, use, store, and protect your personal information when you use our web platform and mobile applications.',
      'This policy applies to all users globally, including users in the European Union (GDPR), India (IT Act 2000 & DPDP Act 2023), and other jurisdictions. By using our services, you consent to the practices described herein.',
    ],
  },
  {
    id: 'data-collected',
    title: '2. Data We Collect',
    icon: '📊',
    subsections: [
      {
        heading: 'A. Account Information (Required)',
        items: [
          'Full name / Username',
          'Email address (used for OTP verification, alerts)',
          'Mobile number (optional, for identity verification)',
          'Encrypted password (bcrypt hashed, never stored in plaintext)',
        ],
      },
      {
        heading: 'B. Scan & Intelligence Data',
        items: [
          'URLs, IP addresses, domains, file hashes submitted for scanning',
          'Scan results including threat scores and risk assessments',
          'Timestamps of all scan activities',
        ],
      },
      {
        heading: 'C. Technical & Device Data',
        items: [
          'IP address and approximate geographic location (city/country)',
          'Browser type, operating system, device model',
          'Session timestamps (login/logout events)',
          'Activity logs for security auditing',
        ],
      },
    ],
  },
  {
    id: 'data-use',
    title: '3. How We Use Your Data',
    icon: '⚙️',
    content: [
      'To provide and improve our threat intelligence services',
      'To verify your identity and protect your account (OTP, 2FA)',
      'To send security alerts when dangerous threats are detected (if enabled)',
      'To detect and prevent fraud, abuse, and unauthorized access',
      'To analyze platform usage patterns and improve user experience',
      'To comply with legal obligations and law enforcement requests when required',
    ],
    note: 'We do NOT sell, rent, or trade your personal data to any third-party advertisers or data brokers.',
  },
  {
    id: 'data-storage',
    title: '4. Data Storage & Security',
    icon: '🔒',
    content: [
      'All data is encrypted at rest using AES-256 encryption standards.',
      'All data in transit is protected by TLS 1.2+ (HTTPS enforced in production).',
      'Passwords are hashed using bcrypt with a cost factor of 12 — they cannot be recovered.',
      'Authentication uses short-lived JWT tokens (15 minutes) with rotating refresh tokens.',
      'Our MongoDB database is hosted with access-controlled, encrypted storage.',
      'We perform regular security audits and penetration tests.',
    ],
  },
  {
    id: 'retention',
    title: '5. Data Retention Policy',
    icon: '📅',
    items: [
      { label: 'Account Data', value: 'Retained until account deletion is requested' },
      { label: 'Scan History', value: '12 months from scan date, then auto-deleted' },
      { label: 'Activity / Audit Logs', value: '6 months (security auditing purposes)' },
      { label: 'OTPs & Reset Tokens', value: 'Deleted immediately after use or expiry (10 min)' },
      { label: 'Backup Data', value: 'Retained for maximum 30 days in encrypted backups' },
    ],
  },
  {
    id: 'user-rights',
    title: '6. Your Rights (GDPR / DPDP)',
    icon: '⚖️',
    content: [
      '**Right to Access**: Request a copy of all personal data we hold about you.',
      '**Right to Rectification**: Request correction of inaccurate or incomplete data.',
      '**Right to Erasure ("The Purge")**: Permanently delete your account and ALL associated data — scans, logs, identity records — via the Settings page. No data is retained after purge.',
      '**Right to Portability**: Request your scan history in JSON format.',
      '**Right to Object**: Opt out of non-essential data processing (e.g., disable email alerts).',
      '**Right to Restriction**: Request temporary suspension of processing while disputes are resolved.',
    ],
    note: 'To exercise any of these rights, use the account settings or contact us at privacy@cybershieldx.com',
  },
  {
    id: 'third-party',
    title: '7. Third-Party Services',
    icon: '🌐',
    items: [
      { label: 'VirusTotal', value: 'Threat intelligence scanning — submitted targets are sent to their API' },
      { label: 'AbuseIPDB', value: 'IP reputation — submitted IPs are checked against their database' },
      { label: 'Google Gemini AI', value: 'AI-powered analysis — query context is processed by Google\'s AI' },
      { label: 'ip-api.com', value: 'Geographic location lookup for scanned targets (not your personal IP)' },
      { label: 'CIRCL Hashlookup', value: 'File hash reputation — hash values are sent to CIRCL\'s public API' },
    ],
    note: 'We only share the minimum data necessary with each provider. We do not share account credentials or personal identity data with third parties.',
  },
  {
    id: 'cookies',
    title: '8. Cookies & Local Storage',
    icon: '🍪',
    content: [
      '**Authentication Cookie** (HttpOnly, Secure, SameSite=Strict): Stores your session token. Required for login functionality. Cannot be accessed by JavaScript — protects against XSS.',
      '**Refresh Token Cookie** (HttpOnly, path-restricted): Used for silent session renewal. Automatically expires in 7 days.',
      '**Language Preference** (localStorage): Stores your selected language. Not transmitted to our servers.',
      '**Theme Preference** (localStorage): Stores UI color preferences. Not transmitted to our servers.',
    ],
    note: 'We do not use advertising cookies, tracking pixels, or analytics cookies from third parties.',
  },
  {
    id: 'children',
    title: '9. Children\'s Privacy',
    icon: '👶',
    content: [
      'CyberShield X is intended for users aged 16 and above. We do not knowingly collect personal data from children under the age of 16.',
      'If you believe a child has registered on our platform, please contact us immediately at privacy@cybershieldx.com and we will delete the account.',
    ],
  },
  {
    id: 'contact',
    title: '10. Contact & Grievance Officer',
    icon: '📧',
    content: [
      'For privacy concerns, data requests, or to report a data breach:',
      'Email: privacy@cybershieldx.com',
      'Grievance Officer (India): grievance@cybershieldx.com',
      'Response Time: Within 72 hours for standard requests, 24 hours for breach notifications.',
    ],
  },
];

export default function PrivacyPolicyPage() {
  const [expandedSection, setExpandedSection] = useState(null);

  return (
    <div className="max-w-4xl mx-auto py-12 px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-12"
      >
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-accent/10 border border-cyber-accent/20 mb-4">
          <span className="w-2 h-2 rounded-full bg-cyber-accent animate-pulse" />
          <span className="font-mono text-[10px] text-cyber-accent uppercase tracking-widest">Legal Document</span>
        </div>
        <h1 className="text-4xl font-display font-black text-white tracking-tight mb-3">Privacy Policy</h1>
        <p className="text-cyber-muted font-mono text-xs uppercase tracking-[.3em]">
          Effective: April 2026 · Version 2.0 · GDPR + Indian DPDP Compliant
        </p>
        <p className="mt-4 text-sm text-cyber-text/70 leading-relaxed">
          This Privacy Policy explains how CyberShield X collects, uses, stores, and protects your personal information.
          We are committed to transparency and your right to privacy.
        </p>
      </motion.div>

      <div className="space-y-4">
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="cyber-bento-card border-white/5 hover:border-cyber-accent/20 transition-all overflow-hidden"
          >
            <button
              onClick={() => setExpandedSection(expandedSection === section.id ? null : section.id)}
              className="w-full flex items-center justify-between p-6 text-left"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">{section.icon}</span>
                <h2 className="text-sm font-display font-bold text-white uppercase tracking-widest">{section.title}</h2>
              </div>
              <motion.span
                animate={{ rotate: expandedSection === section.id ? 180 : 0 }}
                className="text-cyber-accent text-lg"
              >
                ▾
              </motion.span>
            </button>

            <AnimatePresence>
              {expandedSection === section.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-6 pb-6"
                >
                  <div className="border-t border-white/5 pt-4 space-y-3">
                    {/* Plain content array */}
                    {section.content && section.content.map((line, i) => (
                      <p key={i} className="text-sm text-cyber-text/80 leading-relaxed">
                        {line.startsWith('**') ? (
                          <>
                            <span className="font-bold text-cyber-accent">{line.match(/\*\*(.*?)\*\*/)?.[1]}:</span>{' '}
                            {line.replace(/\*\*(.*?)\*\*:?\s*/g, '')}
                          </>
                        ) : line}
                      </p>
                    ))}

                    {/* Subsections */}
                    {section.subsections && section.subsections.map((sub, si) => (
                      <div key={si} className="mt-3">
                        <p className="text-xs font-mono text-cyber-accent uppercase tracking-widest mb-2">{sub.heading}</p>
                        <ul className="space-y-1">
                          {sub.items.map((item, ii) => (
                            <li key={ii} className="text-sm text-cyber-text/70 flex gap-2">
                              <span className="text-cyber-accent mt-1">›</span>{item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}

                    {/* Item tables */}
                    {section.items && (
                      <div className="space-y-2 mt-2">
                        {section.items.map((item, ii) => (
                          <div key={ii} className="flex gap-3 items-start py-2 border-b border-white/5 last:border-0">
                            <span className="font-mono text-[11px] text-cyber-accent min-w-[160px] shrink-0">{item.label}</span>
                            <span className="text-sm text-cyber-text/70">{item.value}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Note box */}
                    {section.note && (
                      <div className="mt-3 p-3 rounded-lg bg-cyber-accent/5 border border-cyber-accent/20">
                        <p className="text-xs text-cyber-accent/90 leading-relaxed">ℹ️ {section.note}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="mt-10 p-6 rounded-2xl bg-white/5 border border-white/10 text-center"
      >
        <p className="text-[10px] font-mono text-cyber-muted uppercase tracking-widest">
          Last Updated: April 2026 · CyberShield X v2.0 · Governed under Indian IT Act 2000 & DPDP Act 2023
        </p>
        <p className="text-[10px] font-mono text-cyber-muted mt-1">
          Questions? Contact us at <span className="text-cyber-accent">privacy@cybershieldx.com</span>
        </p>
      </motion.div>
    </div>
  );
}

