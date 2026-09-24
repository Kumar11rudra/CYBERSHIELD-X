import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useReducedMotion } from 'framer-motion';
import { CATEGORIES, getAllTools } from '../toolkit/toolConfig';
import { getCategoryTheme } from '../toolkit/cards/toolThemes';
import { ChevronRight } from 'lucide-react';

const CATEGORY_ICONS = {
  [CATEGORIES.RECON]: '🌐',
  [CATEGORIES.DNS_NET]: '📡',
  [CATEGORIES.WEB]: '🌍',
  [CATEGORIES.VULN]: '🧪',
  [CATEGORIES.INTEL]: '☣️',
  [CATEGORIES.OSINT]: '🕵️',
  [CATEGORIES.CLOUD]: '☁️',
  [CATEGORIES.API]: '🔑',
  [CATEGORIES.AUTH_IDENTITY]: '🛡️',
  [CATEGORIES.MOBILE]: '📱',
  [CATEGORIES.CONTAINER]: '🐳',
  [CATEGORIES.DEVSECOPS]: '📦',
  [CATEGORIES.MALWARE]: '👾',
  [CATEGORIES.FORENSICS]: '💾',
  [CATEGORIES.REVERSE]: '⚙️',
  [CATEGORIES.WIRELESS]: '📶',
  [CATEGORIES.EMAIL]: '📧',
  [CATEGORIES.SOCIAL_PHISHING]: '🎣',
  [CATEGORIES.AI]: '🤖',
  [CATEGORIES.PRIVACY]: '🔒',
  [CATEGORIES.INCIDENT]: '🚨',
  [CATEGORIES.MONITORING]: '👁️',
  [CATEGORIES.COMPLIANCE]: '📋',
  [CATEGORIES.UTILITIES]: '🔢'
};

const CATEGORY_DESCS = {
  [CATEGORIES.RECON]: 'Map network boundaries, scan ports, discover hostnames, and lookup registry records.',
  [CATEGORIES.DNS_NET]: 'Resolve DNS structures, identify name server topology, and trace routing hops.',
  [CATEGORIES.WEB]: 'Audit HTTP configurations, inspect active TLS certificates, and identify web server risk factors.',
  [CATEGORIES.VULN]: 'Analyze daemon versions, scan configuration blueprints, and plan CVE remediation.',
  [CATEGORIES.INTEL]: 'Cross-examine target nodes against known security abuse feeds and IP reputation lists.',
  [CATEGORIES.OSINT]: 'Query public internet indexes, leak databases, and exposed metadata registries.',
  [CATEGORIES.CLOUD]: 'Audit AWS, GCP, and Azure public configuration buckets and IAM permission exposures.',
  [CATEGORIES.API]: 'Analyze REST endpoint patterns, map parameters, and detect broken access controls.',
  [CATEGORIES.AUTH_IDENTITY]: 'Verify credential leak records, audit password strengths, and decode authentication tokens.',
  [CATEGORIES.MOBILE]: 'Decompile mobile packages (APK/IPA) and analyze embedded API keys and parameters.',
  [CATEGORIES.CONTAINER]: 'Scan container layers and verify Kubernetes namespace isolation boundaries.',
  [CATEGORIES.DEVSECOPS]: 'Audit package dependency graphs and check lock files for software vulnerabilities.',
  [CATEGORIES.MALWARE]: 'Inspect execution headers, extract strings, and check files against virus feeds.',
  [CATEGORIES.FORENSICS]: 'Recover deleted sectors, carve raw disk images, and audit volatile memory frames.',
  [CATEGORIES.REVERSE]: 'Decompile binary instructions, trace registers, and inspect raw assembly paths.',
  [CATEGORIES.WIRELESS]: 'Analyze wireless beacon frames, check handshake strengths, and map local signals.',
  [CATEGORIES.EMAIL]: 'Audit SPF, DKIM, and DMARC configurations to check for spoofing vectors.',
  [CATEGORIES.SOCIAL_PHISHING]: 'Identify suspect domain markers, brand hijacking parameters, and credential harvest templates.',
  [CATEGORIES.AI]: 'Audit model prompts, detect prompt injections, and verify output guardrails.',
  [CATEGORIES.PRIVACY]: 'Verify encryption settings, audit cookies, and identify metadata leakage.',
  [CATEGORIES.INCIDENT]: 'Coordinate playbooks, trace attack paths, and assemble remediation check-lists.',
  [CATEGORIES.MONITORING]: 'Audit system logs, detect suspicious traffic patterns, and trace anomalous processes.',
  [CATEGORIES.COMPLIANCE]: 'Assess configuration controls against SOC2, ISO27001, and NIST frameworks.',
  [CATEGORIES.UTILITIES]: 'Client-side JWT decoding, Base64 conversion, and text heuristics toolkits.'
};

export default function NexusCategoryGrid() {
  const navigate = useNavigate();
  const shouldReduceMotion = useReducedMotion();
  const tools = getAllTools();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
      {Object.values(CATEGORIES).map((catName, index) => {
        const catTools = tools.filter(t => t.category === catName);
        const icon = CATEGORY_ICONS[catName] || '🔧';
        const desc = CATEGORY_DESCS[catName] || 'Security diagnostic tools and automated analysis.';
        const theme = getCategoryTheme(catName);

        const handleCategoryClick = () => {
          navigate(`/toolkit?category=${encodeURIComponent(catName)}`);
        };

        return (
          <motion.div
            key={catName}
            initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-40px' }}
            transition={{ duration: 0.25, delay: shouldReduceMotion ? 0 : Math.min(index * 0.03, 0.3) }}
            whileHover={shouldReduceMotion ? {} : { y: -3 }}
            role="button"
            tabIndex={0}
            onClick={handleCategoryClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleCategoryClick();
              }
            }}
            style={{
              borderColor: 'rgba(51, 65, 85, 0.4)',
            }}
            className="cursor-pointer p-5 sm:p-6 rounded-2xl border bg-[#0c162d]/80 hover:bg-[#0f1c3a] backdrop-blur-xl transition-all duration-200 group flex flex-col justify-between shadow-[0_8px_30px_rgba(0,0,0,0.3)] hover:shadow-[0_12px_35px_rgba(0,0,0,0.5)] focus:outline-none focus:ring-2 focus:ring-cyan-400"
          >
            <div>
              {/* Category Card Header */}
              <div className="flex justify-between items-center mb-4">
                <span className="text-2xl sm:text-3xl p-2 rounded-xl bg-slate-900/60 border border-slate-800 group-hover:scale-105 transition-transform" aria-hidden="true">
                  {icon}
                </span>
                <div className="flex items-center gap-1.5">
                  <span
                    style={{
                      background: theme.badgeBg,
                      borderColor: theme.badgeBorder,
                      color: theme.badgeText,
                    }}
                    className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 uppercase tracking-wider"
                  >
                    <span
                      style={{ background: theme.accent }}
                      className="w-1.5 h-1.5 rounded-full animate-pulse"
                    />
                    <span>{catTools.length} {catTools.length === 1 ? 'MODEL' : 'MODELS'}</span>
                  </span>
                </div>
              </div>

              {/* Title & Description */}
              <h3 className="text-sm font-bold text-white tracking-tight mb-2 group-hover:text-cyan-400 transition-colors">
                {catName}
              </h3>
              <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
                {desc}
              </p>
            </div>

            {/* Action link */}
            <div
              style={{ color: theme.accent }}
              className="text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1 pt-2 border-t border-slate-800/60 group-hover:translate-x-0.5 transition-transform"
            >
              <span>Explore Capability</span>
              <ChevronRight size={13} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
