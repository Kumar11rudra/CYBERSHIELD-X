import React from 'react';
import { useNavigate } from 'react-router-dom';
import { CATEGORIES, getAllTools } from '../toolkit/toolConfig';

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
  [CATEGORIES.VULN]: 'Analyze daemons versions, scan configuration blueprints, and plan CVE remediation.',
  [CATEGORIES.INTEL]: 'Cross-examine target nodes against known security abuse feeds and IP reputation lists.',
  [CATEGORIES.OSINT]: 'Query public internet indexes, leak databases, and exposed metadata registries.',
  [CATEGORIES.CLOUD]: 'Audit AWS, GCP, and Azure public configuration buckets and IAM permission exposures.',
  [CATEGORIES.API]: 'Analyze REST endpoints patterns, map parameters, and detect broken access controls.',
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
  const tools = getAllTools();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {Object.values(CATEGORIES).map(catName => {
        const catTools = tools.filter(t => t.category === catName);
        const icon = CATEGORY_ICONS[catName] || '🔧';
        const desc = CATEGORY_DESCS[catName] || 'Security diagnostic tools.';

        return (
          <div 
            key={catName}
            onClick={() => navigate(`/toolkit?category=${encodeURIComponent(catName)}`)}
            className="cursor-pointer p-6 rounded-2xl border bg-cyber-card/40 border-white/5 hover:border-cyber-accent/40 hover:shadow-[0_4px_20px_rgba(0,191,255,0.06)] transition-all group flex flex-col justify-between"
          >
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-3xl">{icon}</span>
                <div className="flex gap-2">
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-[#00ff88]/10 border-[#00ff88]/20 text-[#00ff88] flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00ff88] animate-pulse" />
                    <span>{catTools.length} MODELS</span>
                  </span>
                  <span className="text-[8px] font-mono font-bold px-2 py-0.5 rounded border bg-[#00bfff]/10 border-[#00bfff]/20 text-[#00bfff]">
                    &gt;_ TERMINAL READY
                  </span>
                </div>
              </div>
              <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-2 group-hover:text-cyber-accent transition-colors">
                {catName}
              </h3>
              <p className="text-[10px] font-mono text-cyber-muted tracking-wide leading-relaxed mb-4">
                {desc}
              </p>
            </div>
            <div className="text-[9px] font-mono text-cyber-accent uppercase tracking-widest flex items-center gap-1">
              <span>Launch Terminal Suite</span>
              <span>→</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
