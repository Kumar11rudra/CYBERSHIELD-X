/**
 * 🛠️ ToolkitModelCard — CyberShield X
 * Modernized Tool Card matching the reference UI layout:
 * - Top-left: Category colored icon
 * - Top-right: Category tag badge
 * - Title & Description
 * - Hashtag chips (#recon, #port-scan, #osint)
 * - >_ LAUNCH TERMINAL action button with popout icon
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ExternalLink, Terminal } from 'lucide-react';
import ToolkitStatusBadge from './ToolkitStatusBadge';

// Helper to derive authentic hashtags matching the reference UI
const getToolTags = (tool) => {
  if (tool.tags && Array.isArray(tool.tags) && tool.tags.length > 0) {
    return tool.tags;
  }

  const id = (tool.id || '').toLowerCase();
  const cat = (tool.category || '').toLowerCase();

  if (id.includes('port') || id.includes('nmap')) return ['#port-scan', '#network'];
  if (id.includes('dns') || id.includes('dig')) return ['#dns', '#network'];
  if (id.includes('whois')) return ['#whois', '#recon'];
  if (id.includes('ssl') || id.includes('cert')) return ['#ssl', '#tls'];
  if (id.includes('http') || id.includes('header')) return ['#web', '#headers'];
  if (id.includes('phishing')) return ['#phishing', '#social'];
  if (id.includes('breach') || id.includes('dark')) return ['#breach', '#osint'];
  if (id.includes('jwt')) return ['#jwt', '#tokens'];
  if (id.includes('base64')) return ['#encoding', '#crypto'];
  if (id.includes('subdomain') || id.includes('subfinder')) return ['#recon', '#subdomains'];
  if (id.includes('traceroute')) return ['#network', '#hops'];
  if (id.includes('email') || id.includes('spf')) return ['#email', '#dmarc'];
  if (id.includes('hash')) return ['#hash', '#forensics'];
  if (id.includes('remediation') || id.includes('cve')) return ['#ai', '#remediation'];
  if (id.includes('sms')) return ['#sms', '#fraud'];
  if (id.includes('upi')) return ['#upi', '#fintech'];
  if (id.includes('sql') || id.includes('sqlmap')) return ['#sql', '#injection'];
  if (id.includes('burp')) return ['#web', '#proxy'];
  if (id.includes('shodan')) return ['#recon', '#osint'];
  if (id.includes('wireshark')) return ['#packet-capture', '#network'];
  if (id.includes('yara')) return ['#malware', '#forensics'];
  if (id.includes('metasploit')) return ['#exploit', '#pentest'];
  if (id.includes('snort')) return ['#ids', '#network'];
  if (id.includes('autopsy')) return ['#forensics', '#disk'];
  if (id.includes('trivy')) return ['#container', '#docker'];
  if (id.includes('hashcat') || id.includes('john')) return ['#password', '#crack'];

  if (cat.includes('recon')) return ['#recon', '#intel'];
  if (cat.includes('network') || cat.includes('dns')) return ['#network', '#protocol'];
  if (cat.includes('web')) return ['#web', '#security'];
  if (cat.includes('vuln')) return ['#vuln', '#audit'];
  if (cat.includes('intel')) return ['#threat', '#ioc'];
  if (cat.includes('identity') || cat.includes('auth')) return ['#auth', '#tokens'];
  if (cat.includes('ai')) return ['#ai', '#neural'];

  return ['#security', '#diagnostic'];
};

// Map category to concise badge text
const getCategoryLabel = (category) => {
  if (!category) return 'Security';
  if (category.includes('DNS') || category.includes('Network')) return 'Network';
  if (category.includes('Web')) return 'Web';
  if (category.includes('Recon')) return 'Recon';
  if (category.includes('Identity') || category.includes('Auth')) return 'Password';
  if (category.includes('Forensics') || category.includes('Malware')) return 'Forensics';
  if (category.includes('Threat')) return 'Intel';
  if (category.includes('AI')) return 'AI';
  if (category.includes('Vulnerability')) return 'Vuln';
  if (category.includes('Cloud')) return 'Cloud';
  if (category.includes('Container')) return 'Container';
  return category.split(' ')[0] || 'Security';
};

export default function ToolkitModelCard({ tool, onLaunchTerminal }) {
  const [hovered, setHovered] = useState(false);

  const tags = getToolTags(tool);
  const categoryLabel = getCategoryLabel(tool.category);
  const isLive = tool.status === 'live' || tool.status === 'partial';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`relative group p-5 rounded-2xl border transition-all duration-300 flex flex-col justify-between ${
        hovered
          ? 'bg-[#081224]/90 border-cyber-accent shadow-[0_0_30px_rgba(0,191,255,0.2)]'
          : 'bg-[#050b18]/80 border-white/5 hover:border-white/20'
      }`}
    >
      <div>
        {/* Top Header: Icon + Category Badge */}
        <div className="flex justify-between items-start mb-3">
          <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-xl group-hover:scale-105 group-hover:border-cyber-accent/40 transition-all">
            {tool.icon || '🛡️'}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[9px] font-mono text-cyber-muted tracking-wider uppercase">
              {categoryLabel}
            </span>
            <ToolkitStatusBadge status={tool.status} />
          </div>
        </div>

        {/* Tool Name & Tagline */}
        <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1.5 group-hover:text-cyber-accent transition-colors">
          {tool.name}
        </h3>

        <p className="text-[10px] font-mono text-cyber-muted leading-relaxed line-clamp-2 mb-4">
          {tool.description || tool.tagline}
        </p>
      </div>

      {/* Footer Area: Hashtags & Launch Button */}
      <div className="space-y-3 pt-2">
        {/* Hashtags */}
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="text-[9px] font-mono px-2 py-0.5 rounded bg-white/5 text-cyber-muted border border-white/5 group-hover:border-white/10 group-hover:text-slate-300 transition-colors"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Launch Terminal Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onLaunchTerminal) {
              onLaunchTerminal(tool);
            }
          }}
          className={`w-full py-2.5 px-3 rounded-xl font-mono text-[11px] font-bold tracking-wider uppercase transition-all flex items-center justify-between ${
            isLive
              ? 'bg-[#00bfff]/10 border border-[#00bfff]/40 text-[#00bfff] hover:bg-[#00bfff] hover:text-[#020814] hover:shadow-[0_0_20px_rgba(0,191,255,0.4)]'
              : 'bg-white/5 border border-white/10 text-white/70 hover:border-cyber-accent/40 hover:text-white hover:bg-cyber-accent/10'
          }`}
        >
          <div className="flex items-center gap-1.5">
            <Terminal size={13} />
            <span>&gt;_ LAUNCH TERMINAL</span>
          </div>
          <ExternalLink size={12} className="opacity-70 group-hover:opacity-100" />
        </button>
      </div>

      {/* Decorative Cyber Corner */}
      <div 
        className="absolute bottom-0 right-0 w-6 h-6 opacity-5 pointer-events-none group-hover:opacity-20 transition-opacity"
        style={{ background: 'linear-gradient(135deg, transparent 50%, #00bfff 50%)' }}
      />
    </motion.div>
  );
}
