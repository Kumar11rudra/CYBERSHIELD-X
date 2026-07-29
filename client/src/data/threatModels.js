/**
 * Threat Models Catalog
 * Static database mapping security engine properties, categories, and colors.
 */
export const THREAT_MODELS = [
  { id: 'dns', icon: '🌐', name: 'DNS Enumeration Engine', tag: 'RECON', color: '#0ea5e9', desc: 'Query DNS and discover subdomains' },
  { id: 'http', icon: '🌍', name: 'HTTP Security Engine', tag: 'WEB', color: '#f59e0b', desc: 'Audit HTTP headers and server configs' },
  { id: 'port', icon: '📡', name: 'Port & Service Engine', tag: 'RECON', color: '#00ff88', desc: 'Scan open ports and discover services' },
  { id: 'service_fingerprint', icon: '🧪', name: 'Service Fingerprint Engine', tag: 'VULNERABILITY', color: '#ff6b6b', desc: 'Identify running software versions' },
  { id: 'ssl', icon: '🔒', name: 'SSL/TLS Security Engine', tag: 'VULNERABILITY', color: '#10b981', desc: 'Inspect active TLS certificates' },
  { id: 'tech_detection', icon: '🕸️', name: 'Technology Detection Engine', tag: 'RECON', color: '#ec4899', desc: 'Identify tech stacks and CMS' },
  { id: 'url', icon: '☣️', name: 'URL & Threat Intel Engine', tag: 'INTEL', color: '#394eff', desc: 'Check malware and phishing reputation' },
  { id: 'whois', icon: '🌐', name: 'WHOIS Record Engine', tag: 'RECON', color: '#06b6d4', desc: 'Query public records for domain ownership' },
];

export const TAG_COLORS = {
  RECON: '#0ea5e9', VULNERABILITY: '#f97316', WEB: '#ef4444', PASSWORD: '#a855f7',
  FORENSICS: '#78716c', SOC: '#65a30d', CLOUD: '#10b981', INTEL: '#394eff',
  AI: '#e11d48', MOBILE: '#0ea5e9', OSINT: '#a855f7', PRIVACY: '#7c3aed',
  WEB3: '#6366f1', EXPLOIT: '#991b1b', CONTAINER: '#0284c7'
};

export default THREAT_MODELS;
