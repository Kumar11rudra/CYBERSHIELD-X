import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// ─── Constants & Data ────────────────────────────────────────────────────────
const CATEGORIES = [
  { id: 'all', label: 'toolkit.categories.all' },
  { id: 'recon', label: 'toolkit.categories.recon' },
  { id: 'vulnerability', label: 'toolkit.categories.vulnerability' },
  { id: 'web', label: 'toolkit.categories.web' },
  { id: 'password', label: 'toolkit.categories.password' },
  { id: 'wireless', label: 'toolkit.categories.wireless' },
  { id: 'packet', label: 'toolkit.categories.packet' },
  { id: 'exploitation', label: 'toolkit.categories.exploitation' },
  { id: 'forensics', label: 'toolkit.categories.forensics' },
  { id: 'malware', label: 'toolkit.categories.malware' },
  { id: 'soc', label: 'toolkit.categories.soc' },
  { id: 'endpoint', label: 'toolkit.categories.endpoint' },
  { id: 'cloud', label: 'toolkit.categories.cloud' },
  { id: 'devsecops', label: 'toolkit.categories.devsecops' },
  { id: 'mobile', label: 'toolkit.categories.mobile' },
  { id: 'intelligence', label: 'toolkit.categories.intelligence' },
];

const TOOLS = [
  // 📡 Reconnaissance
  { id: 'nmap', category: 'recon', icon: '📡', name: 'Nexus Port Sentinel', original: 'Nmap', status: 'active', color: '#00d4ff' },
  { id: 'harvester', category: 'recon', icon: '👤', name: 'Identity Harvester', original: 'theHarvester', status: 'coming_soon', color: '#00ff88' },
  { id: 'shodan', category: 'recon', icon: '👁️', name: 'IoT Watchtower', original: 'Shodan', status: 'coming_soon', color: '#ff8c00' },
  { id: 'maltego', category: 'recon', icon: '🕸️', name: 'Graph Intelligence', original: 'Maltego', status: 'coming_soon', color: '#b400ff' },
  { id: 'recon-ng', category: 'recon', icon: '🔎', name: 'Nexus Recon OS', original: 'Recon-ng', status: 'coming_soon', color: '#00d4ff' },
  { id: 'amass', category: 'recon', icon: '🌐', name: 'Domain Cartographer', original: 'Amass', status: 'coming_soon', color: '#00ff88' },
  { id: 'subfinder', category: 'recon', icon: '🛰️', name: 'Subdomain Recon', original: 'Subfinder', status: 'coming_soon', color: '#ff2244' },
  
  // 🔍 Vulnerability Analysis
  { id: 'openvas', category: 'vulnerability', icon: '🛡️', name: 'Vulnerability Radar', original: 'OpenVAS', status: 'coming_soon', color: '#ff2244' },
  { id: 'nessus', category: 'vulnerability', icon: '⚡', name: 'Enterprise Auditor', original: 'Nessus', status: 'coming_soon', color: '#00d4ff' },
  { id: 'qualys', category: 'vulnerability', icon: '☁️', name: 'Cloud Risk VMDR', original: 'Qualys VMDR', status: 'coming_soon', color: '#00ff88' },
  { id: 'nikto', category: 'vulnerability', icon: '🧪', name: 'Web Config Auditor', original: 'Nikto', status: 'active', color: '#ff8c00' },
  { id: 'acunetix', category: 'vulnerability', icon: '🔬', name: 'Deep Web Scanner', original: 'Acunetix', status: 'coming_soon', color: '#b400ff' },
  
  // 🌐 Web Security
  { id: 'burp', category: 'web', icon: '🧤', name: 'Aegis Web Proxy', original: 'Burp Suite', status: 'coming_soon', color: '#ff8c00' },
  { id: 'zap', category: 'web', icon: '⚡', name: 'Sentinel Web Proxy', original: 'OWASP ZAP', status: 'coming_soon', color: '#00ff88' },
  { id: 'sqlmap', category: 'web', icon: '💉', name: 'Injection Defense Lab', original: 'SQLMap', status: 'active', color: '#ff2244' },
  { id: 'xsstrike', category: 'web', icon: '💥', name: 'XSS Striker', original: 'XSStrike', status: 'coming_soon', color: '#00d4ff' },
  { id: 'dirsearch', category: 'web', icon: '📂', name: 'Directory Hunter', original: 'Dirsearch', status: 'active', color: '#00ff88' },
  
  // 🔐 Passwords
  { id: 'john', category: 'password', icon: '🔨', name: 'Aegis Password Hardener', original: 'John the Ripper', status: 'active', color: '#b400ff' },
  { id: 'hashcat', category: 'password', icon: '🔥', name: 'Quantum Hash Cracker', original: 'Hashcat', status: 'active', color: '#ff2244' },
  { id: 'hydra', category: 'password', icon: '🐉', name: 'Brute-Force Shield', original: 'Hydra', status: 'coming_soon', color: '#ff8c00' },
  { id: 'medusa', category: 'password', icon: '🏺', name: 'Credential Medusa', original: 'Medusa', status: 'coming_soon', color: '#00ff88' },
  
  // 📶 Wireless
  { id: 'aircrack', category: 'wireless', icon: '📶', name: 'Sky-Shield WiFi Audit', original: 'Aircrack-ng', status: 'coming_soon', color: '#00d4ff' },
  { id: 'kismet', category: 'wireless', icon: '🛰️', name: 'Spectral Sniffer', original: 'Kismet', status: 'coming_soon', color: '#00ff88' },
  { id: 'reaver', category: 'wireless', icon: '🔧', name: 'WPS Logic Auditor', original: 'Reaver', status: 'coming_soon', color: '#ff8c00' },
  { id: 'wifite', category: 'wireless', icon: '⚡', name: 'Auto-WiFi Auditor', original: 'Wifite', status: 'coming_soon', color: '#ff2244' },
  
  // 🕵️ Packet Analysis
  { id: 'wireshark', category: 'packet', icon: '🦈', name: 'Ghost Packet Analyzer', original: 'Wireshark', status: 'coming_soon', color: '#00d4ff' },
  { id: 'tcpdump', category: 'packet', icon: '📜', name: 'CLI Stream Capture', original: 'tcpdump', status: 'coming_soon', color: '#00ff88' },
  { id: 'ettercap', category: 'packet', icon: '🎭', name: 'MITM Intelligence', original: 'Ettercap', status: 'coming_soon', color: '#ff2244' },

  // ⚔️ Exploitation
  { id: 'metasploit', category: 'exploitation', icon: '💣', name: 'Exploit Simulation Hub', original: 'Metasploit', status: 'coming_soon', color: '#ff2244' },
  { id: 'cobalt', category: 'exploitation', icon: '💎', name: 'Red Team Command', original: 'Cobalt Strike', status: 'coming_soon', color: '#00d4ff' },
  { id: 'empire', category: 'exploitation', icon: '🏰', name: 'Post-Exploit Empire', original: 'Empire', status: 'coming_soon', color: '#ff8c00' },
  { id: 'zerothreat', category: 'exploitation', icon: '🤖', name: 'AI Pentest Automator', original: 'ZeroThreat', status: 'active', color: '#00ff88' },
  { id: 'kali', category: 'exploitation', icon: '🐉', name: 'Nexus OS Armory', original: 'Kali Linux', status: 'coming_soon', color: '#b400ff' },
  { id: 'parrot', category: 'exploitation', icon: '🦜', name: 'Parrot Security OS', original: 'Parrot OS', status: 'coming_soon', color: '#00ff88' },

  // 🏛️ SOC & SIEM
  { id: 'splunk', category: 'soc', icon: '📊', name: 'Nexus Enterprise SOC', original: 'Splunk', status: 'active', color: '#ff8c00' },
  { id: 'wazuh', category: 'soc', icon: '🐕', name: 'Sentinel Monitoring', original: 'Wazuh', status: 'active', color: '#00ff88' },
  { id: 'qradar', category: 'soc', icon: '📡', name: 'Quantum Threat SIEM', original: 'IBM QRadar', status: 'coming_soon', color: '#b400ff' },
  { id: 'sentinel', category: 'soc', icon: '💂', name: 'Microsoft Sentinel SIEM', original: 'MS Sentinel', status: 'coming_soon', color: '#00d4ff' },

  // 🛡️ Endpoint Protection
  { id: 'crowdstrike', category: 'endpoint', icon: '🦅', name: 'Endpoint Fortress EDR', original: 'CrowdStrike', status: 'coming_soon', color: '#ff2244' },
  { id: 'sentinelone', category: 'endpoint', icon: '🎯', name: 'AI Endpoint Singularity', original: 'SentinelOne', status: 'coming_soon', color: '#00ff88' },
  { id: 'defender', category: 'endpoint', icon: '🛡️', name: 'Defender for Endpoint', original: 'MS Defender', status: 'coming_soon', color: '#00d4ff' },

  // ☁️ Cloud
  { id: 'wiz', category: 'cloud', icon: '🧙', name: 'Nexus Cloud Guard', original: 'Wiz', status: 'active', color: '#00d4ff' },
  { id: 'prisma', category: 'cloud', icon: '💎', name: 'Prisma Workload Shield', original: 'Prisma Cloud', status: 'coming_soon', color: '#00ff88' },
  { id: 'lacework', category: 'cloud', icon: '🧶', name: 'Cloud Lacework Engine', original: 'Lacework', status: 'coming_soon', color: '#ff8c00' },

  // 📱 Mobile
  { id: 'mobsf', category: 'mobile', icon: '📱', name: 'Mobile Sentinel Hub', original: 'MobSF', status: 'coming_soon', color: '#ff2244' },
  { id: 'frida', category: 'mobile', icon: '💉', name: 'Runtime App Injector', original: 'Frida', status: 'coming_soon', color: '#00d4ff' },
  { id: 'apktool', category: 'mobile', icon: '📦', name: 'APK Binary Decompiler', original: 'APKTool', status: 'coming_soon', color: '#00ff88' },

  // 🧬 DevSecOps
  { id: 'snyk', category: 'devsecops', icon: '🐶', name: 'Nexus Dependency Guard', original: 'Snyk', status: 'coming_soon', color: '#b400ff' },
  { id: 'trivy', category: 'devsecops', icon: '🐳', name: 'Container Integrity Radar', original: 'Trivy', status: 'coming_soon', color: '#00d4ff' },
  { id: 'checkov', category: 'devsecops', icon: '🏗️', name: 'IaC Security Scanner', original: 'Checkov', status: 'coming_soon', color: '#00ff88' },
  { id: 'sonarqube', category: 'devsecops', icon: '🎼', name: 'Secure Code Orchestrator', original: 'SonarQube', status: 'coming_soon', color: '#ff8c00' },

  // 🕵️ Forensics
  { id: 'autopsy', category: 'forensics', icon: '🔍', name: 'Ghost Forensics Lab', original: 'Autopsy', status: 'active', color: '#00d4ff' },
  { id: 'ftk', category: 'forensics', icon: '📸', name: 'Evidence Imaging Lab', original: 'FTK Imager', status: 'active', color: '#00ff88' },
  { id: 'volatility', category: 'forensics', icon: '🧠', name: 'Memory Intelligence', original: 'Volatility', status: 'active', color: '#ff2244' },
  { id: 'sleuthkit', category: 'forensics', icon: '🕵️', name: 'File System Sleuth', original: 'Sleuth Kit', status: 'coming_soon', color: '#ff8c00' },

  // 🧠 Reverse Engineering
  { id: 'ghidra', category: 'malware', icon: '🐉', name: 'Ghidra Reverse Engine', original: 'Ghidra', status: 'coming_soon', color: '#ff2244' },
  { id: 'idapro', category: 'malware', icon: '🔬', name: 'IDA Pro Analyzer', original: 'IDA Pro', status: 'coming_soon', color: '#00d4ff' },
  { id: 'radare2', category: 'malware', icon: '🔢', name: 'Radare2 Binary Suite', original: 'Radare2', status: 'coming_soon', color: '#00ff88' },
  { id: 'cuckoo', category: 'malware', icon: '🐦', name: 'Cuckoo Malware Sandbox', original: 'Cuckoo', status: 'coming_soon', color: '#b400ff' },

  // 🧠 Intelligence
  { id: 'virustotal', category: 'intelligence', icon: '☣️', name: 'Global Threat Engine', original: 'VirusTotal', status: 'active', color: '#ff2244' },
  { id: 'misp', category: 'intelligence', icon: '🤝', name: 'Threat Intelligence MISP', original: 'MISP', status: 'coming_soon', color: '#00ff88' },
  { id: 'opencti', category: 'intelligence', icon: '📑', name: 'Open Threat Intelligence', original: 'OpenCTI', status: 'coming_soon', color: '#00d4ff' },
];


// ─── Component ───────────────────────────────────────────────────────────────

const ToolCard = ({ tool, t }) => {
  const navigate = useNavigate();
  const [hovered, setHovered] = React.useState(false);

  const rgb = tool.color.replace('#', '').match(/.{2}/g).map(h => parseInt(h, 16)).join(',');

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => tool.status === 'active' && navigate(`/toolkit/${tool.id}`)}
      className={`relative group cursor-pointer p-5 rounded-2xl border transition-all duration-300 ${
        tool.status === 'active' 
          ? 'bg-cyber-card/40 border-white/5 hover:border-cyber-accent/40' 
          : 'bg-black/20 border-white/5 opacity-60 grayscale cursor-not-allowed'
      }`}
      style={{
        boxShadow: hovered && tool.status === 'active' ? `0 8px 30px rgba(${rgb}, 0.15)` : 'none'
      }}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="text-3xl">{tool.icon}</div>
        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border ${
          tool.status === 'active' ? 'bg-cyber-accent/10 border-cyber-accent/30 text-cyber-accent' : 'bg-white/5 border-white/10 text-white/40'
        }`}>
          {tool.status === 'active' ? 'SYSTEM.ACTIVE' : 'LOCKED.SYS'}
        </span>
      </div>

      <h3 className="font-display text-sm font-bold text-white uppercase tracking-wider mb-1 group-hover:text-cyber-accent transition-colors">
        {tool.name}
      </h3>
      <p className="text-[9px] font-mono text-cyber-muted uppercase tracking-widest mb-3">
        Based on: <span className="text-white/40">{tool.original}</span>
      </p>

      {tool.status === 'coming_soon' && (
        <div className="flex items-center gap-2 mt-2">
          <div className="flex-1 h-[1px] bg-white/5" />
          <span className="text-[7px] font-mono text-cyber-accent/50 animate-pulse uppercase tracking-[0.2em]">Decrypting Data...</span>
          <div className="flex-1 h-[1px] bg-white/5" />
        </div>
      )}

      {tool.status === 'active' && (
        <div className="flex items-center gap-1.5 text-cyber-accent opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-[9px] font-mono uppercase tracking-widest">Execute Module</span>
          <span className="text-xs">→</span>
        </div>
      )}
      
      {/* Decorative Corner */}
      <div className="absolute bottom-0 right-0 w-8 h-8 opacity-10 pointer-events-none group-hover:opacity-20 transition-opacity"
           style={{ background: `linear-gradient(135deg, transparent 50%, ${tool.color} 50%)` }} />
    </motion.div>
  );
};

export default function ToolkitPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const filteredTools = useMemo(() => {
    return TOOLS.filter(tool => {
      const matchesSearch = tool.name.toLowerCase().includes(search.toLowerCase()) || 
                          tool.original.toLowerCase().includes(search.toLowerCase());
      const matchesCategory = activeCategory === 'all' || tool.category === activeCategory;
      return matchesSearch && matchesCategory;
    });
  }, [search, activeCategory]);

  return (
    <div className="min-h-screen pt-4 pb-20 px-4 sm:px-6 relative">
      {/* Background Decor */}
      <div className="bloom-bg top-[-10%] left-[-10%] bg-cyber-accent/5" />
      <div className="bloom-bg bottom-[-10%] right-[-10%] bg-purple-500/5" />
      
      <div className="max-w-7xl mx-auto relative z-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 border-b border-white/5 pb-10">
          <div className="flex-1">
            <motion.p 
              initial={{ opacity: 0, x: -10 }} 
              animate={{ opacity: 1, x: 0 }}
              className="text-[10px] font-mono tracking-[0.5em] text-cyber-accent uppercase mb-2"
            >
              System Operations Center
            </motion.p>
            <motion.h1 
              initial={{ opacity: 0, y: 10 }} 
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl md:text-5xl font-display font-black tracking-tight text-white"
            >
              NEXUS <span className="text-cyber-accent">TOOLKIT</span>
            </motion.h1>
            <p className="mt-3 text-xs text-cyber-muted font-mono max-w-xl uppercase tracking-wider leading-relaxed">
              Explore the ultimate A-Z security encyclopedia. 15+ specialized modules for reconnaissance, auditing, and defensive operations.
            </p>
          </div>

          <div className="w-full md:w-80">
            <div className="relative group">
              <input 
                type="text" 
                placeholder="Search Nexus Database..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 font-mono text-[11px] text-white focus:border-cyber-accent outline-none transition-all"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-cyber-muted font-mono text-[10px]">🔎</span>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="flex gap-2 overflow-x-auto pb-6 mb-8 custom-scrollbar no-scrollbar">
          {CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`whitespace-nowrap px-4 py-2 rounded-full font-mono text-[10px] uppercase tracking-widest border transition-all duration-300 ${
                activeCategory === cat.id 
                  ? 'bg-cyber-accent/10 border-cyber-accent text-cyber-accent shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                  : 'bg-white/5 border-white/10 text-cyber-muted hover:border-white/20'
              }`}
            >
              {cat.id === 'all' ? 'All Modules' : cat.id.toUpperCase()}
            </button>
          ))}
        </div>

        {/* Tools Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4"
        >
          <AnimatePresence mode='popLayout'>
            {filteredTools.map(tool => (
              <ToolCard key={tool.id} tool={tool} t={t} />
            ))}
          </AnimatePresence>
        </motion.div>

        {filteredTools.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <span className="text-4xl mb-4 opacity-40">🛸</span>
            <p className="font-mono text-xs text-cyber-muted uppercase tracking-[0.4em] animate-pulse">
              No matching signals in the Nexus database
            </p>
          </div>
        )}

      </div>
    </div>
  );
}
