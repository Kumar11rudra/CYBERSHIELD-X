/**
 * 🛠️ Central Tool Configuration
 * Maps each toolId to its real name, type, description, and capabilities.
 * Single source of truth for the entire toolkit ecosystem.
 */

// Tool template types
export const TOOL_TYPES = {
  SCANNER: 'scanner',       // Input + Live scan results (Nmap, Nikto)
  ANALYZER: 'analyzer',     // Input + Analysis report (VirusTotal, WHOIS)
  UTILITY: 'utility',       // Interactive client-side tool (JWT, Base64)
  COMING_SOON: 'coming_soon', // Not yet available
};

// Tool status levels
export const TOOL_STATUS = {
  LIVE: 'live',             // Real scanning, fully functional
  BETA: 'beta',             // Works but limited/fallback
  DEMO: 'demo',             // Demonstration mode
  COMING_SOON: 'coming_soon', // Not available yet
};

// Input types for tools
export const INPUT_TYPES = {
  IP: 'ip',
  URL: 'url',
  DOMAIN: 'domain',
  HASH: 'hash',
  USERNAME: 'username',
  TEXT: 'text',
  FILE: 'file',
  NONE: 'none', // Utility tools with inline UI
};

/**
 * Complete tool configuration registry
 * toolId must match backend's toolId in /api/toolkit/execute
 */
const TOOL_CONFIG = {
  // ══════════════════════════════════════════════════════════
  //  LIVE TOOLS — Real backend execution
  // ══════════════════════════════════════════════════════════
  nmap: {
    id: 'nmap',
    name: 'Nmap',
    tagline: 'Network Port Scanner',
    description: 'Scan open ports and discover running services on any IP address or hostname. Uses real TCP scanning.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP address or hostname (e.g., 192.168.1.1)',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🔍',
    color: '#00ff88',
    capabilities: ['Port scanning', 'Service detection', 'OS fingerprinting'],
  },

  nikto: {
    id: 'nikto',
    name: 'Nikto',
    tagline: 'Web Server Scanner',
    description: 'Audit web server configurations, security headers, and common vulnerabilities.',
    category: 'Vulnerability',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter website URL (e.g., https://example.com)',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🛡️',
    color: '#ff6b6b',
    capabilities: ['Security header check', 'Server fingerprinting', 'Vulnerability detection'],
  },

  virustotal: {
    id: 'virustotal',
    name: 'VirusTotal',
    tagline: 'Multi-Engine Threat Scanner',
    description: 'Scan URLs, IPs, domains, and file hashes against 70+ antivirus engines. Uses the real VirusTotal API.',
    category: 'Intelligence',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter URL, IP, domain, or file hash',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🦠',
    color: '#394eff',
    capabilities: ['URL scanning', 'IP reputation', 'Hash lookup', 'Domain analysis'],
  },

  abuseipdb: {
    id: 'abuseipdb',
    name: 'AbuseIPDB',
    tagline: 'IP Reputation & Abuse Checker',
    description: 'Check any IP address against the AbuseIPDB community blacklist — see abuse score, reports, ISP, and location.',
    category: 'Intelligence',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP address (e.g., 1.1.1.1)',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🚨',
    color: '#ff4d4d',
    capabilities: ['Abuse score', 'Report history', 'ISP detection', 'Country lookup'],
  },

  whois: {
    id: 'whois',
    name: 'WHOIS',
    tagline: 'Domain Registration Lookup',
    description: 'Look up registration details for any domain — registrar, creation date, expiry, name servers, and more.',
    category: 'Recon',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.DOMAIN,
    inputPlaceholder: 'Enter domain name (e.g., example.com)',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🌐',
    color: '#06b6d4',
    capabilities: ['Registrar info', 'Expiry dates', 'Name servers', 'DNSSEC status'],
  },

  // ══════════════════════════════════════════════════════════
  //  UTILITY TOOLS — 100% Client-side
  // ══════════════════════════════════════════════════════════
  'jwt-parser': {
    id: 'jwt-parser',
    name: 'JWT Parser',
    tagline: 'JSON Web Token Decoder',
    description: 'Decode and inspect JWT tokens — view header, payload, and signature.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Paste your JWT token here',
    apiEndpoint: null,
    icon: '🔑',
    color: '#f59e0b',
    capabilities: ['Header decode', 'Payload inspection', 'Expiry check'],
  },

  'base64-decoder': {
    id: 'base64-decoder',
    name: 'Base64 Tool',
    tagline: 'Base64 Encoder & Decoder',
    description: 'Encode and decode Base64 strings instantly.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter text to encode/decode',
    apiEndpoint: null,
    icon: '🔄',
    color: '#8b5cf6',
    capabilities: ['Base64 encode', 'Base64 decode', 'URL-safe encoding'],
  },

  'url-sanitizer': {
    id: 'url-sanitizer',
    name: 'URL Sanitizer',
    tagline: 'URL Parser & Payload Analyzer',
    description: 'Parse URLs, extract query parameters, and identify suspicious payloads.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Paste a URL to analyze',
    apiEndpoint: null,
    icon: '🔗',
    color: '#06b6d4',
    capabilities: ['URL parsing', 'Query extraction', 'Payload detection'],
  },

  // ══════════════════════════════════════════════════════════
  //  BETA TOOLS — Real API with fallback
  // ══════════════════════════════════════════════════════════
  wazuh: {
    id: 'wazuh',
    name: 'Wazuh',
    tagline: 'SIEM & Threat Detection',
    description: 'Security Information and Event Management — monitor alerts and security events.',
    category: 'SOC',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.BETA,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter agent ID or search query',
    apiEndpoint: '/api/toolkit/execute',
    icon: '📊',
    color: '#3b82f6',
    capabilities: ['Alert monitoring', 'Log analysis', 'Compliance checking'],
  },

  wiz: {
    id: 'wiz',
    name: 'Wiz',
    tagline: 'Cloud Security Scanner',
    description: 'Cloud infrastructure security assessment and misconfiguration detection.',
    category: 'Cloud',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.BETA,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter cloud resource or config path',
    apiEndpoint: '/api/toolkit/execute',
    icon: '☁️',
    color: '#10b981',
    capabilities: ['Cloud audit', 'Misconfiguration detection', 'Compliance check'],
  },

  // ══════════════════════════════════════════════════════════
  //  COMING SOON — Previously simulated, now honest
  // ══════════════════════════════════════════════════════════
  sherlock: {
    id: 'sherlock',
    name: 'Sherlock',
    tagline: 'Username OSINT Search',
    description: 'Search for a username across 300+ social media platforms and websites.',
    category: 'Recon',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.USERNAME,
    inputPlaceholder: 'Enter username to search',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🕵️',
    color: '#a855f7',
    capabilities: ['Social media search', 'Account enumeration', 'Profile linking'],
  },

  whatweb: {
    id: 'whatweb',
    name: 'WhatWeb',
    tagline: 'Web Technology Profiler',
    description: 'Identify technologies used on websites — CMS, frameworks, analytics, and more.',
    category: 'Recon',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter website URL',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🌐',
    color: '#ec4899',
    capabilities: ['Technology detection', 'CMS identification', 'Framework fingerprinting'],
  },

  sqlmap: {
    id: 'sqlmap',
    name: 'SQLMap',
    tagline: 'SQL Injection Testing',
    description: 'Automated SQL injection detection and exploitation testing tool.',
    category: 'Web',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target URL with parameters',
    apiEndpoint: '/api/toolkit/execute',
    icon: '💉',
    color: '#ef4444',
    capabilities: ['SQL injection detection', 'Database enumeration', 'Payload testing'],
  },

  dirsearch: {
    id: 'dirsearch',
    name: 'Dirsearch',
    tagline: 'Directory & File Brute-Forcer',
    description: 'Discover hidden directories and files on web servers.',
    category: 'Web',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target URL',
    apiEndpoint: '/api/toolkit/execute',
    icon: '📂',
    color: '#f97316',
    capabilities: ['Directory scanning', 'File discovery', 'Path enumeration'],
  },

  john: {
    id: 'john',
    name: 'John the Ripper',
    tagline: 'Password Hash Cracker',
    description: 'Test password strength by cracking password hashes.',
    category: 'Password',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.HASH,
    inputPlaceholder: 'Enter password hash',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🔓',
    color: '#eab308',
    capabilities: ['Hash cracking', 'Dictionary attack', 'Password audit'],
  },

  hashcat: {
    id: 'hashcat',
    name: 'Hashcat',
    tagline: 'Advanced Hash Recovery',
    description: 'GPU-accelerated password hash recovery and analysis.',
    category: 'Password',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.HASH,
    inputPlaceholder: 'Enter hash to analyze',
    apiEndpoint: '/api/toolkit/execute',
    icon: '⚡',
    color: '#f59e0b',
    capabilities: ['Hash analysis', 'Rule-based attack', 'Mask attack'],
  },

  splunk: {
    id: 'splunk',
    name: 'Splunk',
    tagline: 'Enterprise SIEM Platform',
    description: 'Enterprise-grade security information and event management.',
    category: 'SOC',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter SPL query',
    apiEndpoint: '/api/toolkit/execute',
    icon: '📈',
    color: '#65a30d',
    capabilities: ['Log analysis', 'SPL queries', 'Alert management'],
  },

  mobsf: {
    id: 'mobsf',
    name: 'MobSF',
    tagline: 'Mobile App Security Scanner',
    description: 'Static and dynamic analysis of Android and iOS applications.',
    category: 'Mobile',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload APK/IPA file',
    apiEndpoint: '/api/toolkit/execute',
    icon: '📱',
    color: '#0ea5e9',
    capabilities: ['APK analysis', 'IPA analysis', 'Permissions audit'],
  },

  slither: {
    id: 'slither',
    name: 'Slither',
    tagline: 'Smart Contract Auditor',
    description: 'Static analysis framework for Solidity smart contracts.',
    category: 'DevSecOps',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter contract address or paste Solidity code',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🔐',
    color: '#6366f1',
    capabilities: ['Vulnerability detection', 'Reentrancy check', 'Gas optimization'],
  },

  autopsy: {
    id: 'autopsy',
    name: 'Autopsy',
    tagline: 'Digital Forensics Platform',
    description: 'Comprehensive digital forensics and incident response platform.',
    category: 'Forensics',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload disk image or evidence file',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🔬',
    color: '#78716c',
    capabilities: ['Disk forensics', 'File recovery', 'Timeline analysis'],
  },

  ftk: {
    id: 'ftk',
    name: 'FTK Imager',
    tagline: 'Forensic Disk Imaging',
    description: 'Create forensic images of hard drives for evidence preservation.',
    category: 'Forensics',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Select evidence source',
    apiEndpoint: '/api/toolkit/execute',
    icon: '💾',
    color: '#a3a3a3',
    capabilities: ['Disk imaging', 'Evidence preservation', 'Hash verification'],
  },

  volatility: {
    id: 'volatility',
    name: 'Volatility',
    tagline: 'Memory Forensics Framework',
    description: 'Analyze RAM dumps for malware, rootkits, and forensic artifacts.',
    category: 'Forensics',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload memory dump file',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🧠',
    color: '#dc2626',
    capabilities: ['Process analysis', 'Network connections', 'Malware detection'],
  },

  stegano: {
    id: 'stegano',
    name: 'Steghide',
    tagline: 'Steganography Detector',
    description: 'Detect and extract hidden data embedded in image and audio files.',
    category: 'Forensics',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload image or audio file',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🖼️',
    color: '#059669',
    capabilities: ['Hidden data detection', 'Payload extraction', 'LSB analysis'],
  },

  exiftool: {
    id: 'exiftool',
    name: 'ExifTool',
    tagline: 'Metadata Analyzer',
    description: 'Read, write, and analyze metadata in images, documents, and media files.',
    category: 'Forensics',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload file to analyze metadata',
    apiEndpoint: '/api/toolkit/execute',
    icon: '📋',
    color: '#7c3aed',
    capabilities: ['EXIF data extraction', 'GPS location', 'Camera information'],
  },

  zerothreat: {
    id: 'zerothreat',
    name: 'ZeroThreat',
    tagline: 'AI Penetration Tester',
    description: 'Automated AI-driven penetration testing and vulnerability assessment.',
    category: 'Exploitation',
    type: TOOL_TYPES.COMING_SOON,
    status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target for assessment',
    apiEndpoint: '/api/toolkit/execute',
    icon: '🤖',
    color: '#e11d48',
    capabilities: ['Automated pentesting', 'Vulnerability assessment', 'Report generation'],
  },

  // ══════════════════════════════════════════════════════════
  //  LOCKED — Always Coming Soon (38 tools)
  // ══════════════════════════════════════════════════════════
  metasploit: {
    id: 'metasploit', name: 'Metasploit', tagline: 'Exploit Framework',
    description: 'World\'s most used penetration testing framework.',
    category: 'Exploitation', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.IP, icon: '💀', color: '#991b1b',
    capabilities: ['Exploit execution', 'Payload delivery', 'Post-exploitation'],
  },
  trivy: {
    id: 'trivy', name: 'Trivy', tagline: 'Container Scanner',
    description: 'Comprehensive vulnerability scanner for containers and IaC.',
    category: 'DevSecOps', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.TEXT, icon: '🐳', color: '#0284c7',
    capabilities: ['Container scanning', 'IaC scanning', 'SBOM generation'],
  },
  aircrack: {
    id: 'aircrack', name: 'Aircrack-ng', tagline: 'WiFi Security Auditor',
    description: 'WiFi network security assessment and WPA/WPA2 testing.',
    category: 'Wireless', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    inputType: INPUT_TYPES.FILE, icon: '📡', color: '#4338ca',
    capabilities: ['WiFi monitoring', 'WPA cracking', 'Packet capture'],
  },
  theharvester: {
    id: 'theharvester', name: 'theHarvester', tagline: 'OSINT Gatherer',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🌾', color: '#65a30d',
  },
  shodan: {
    id: 'shodan', name: 'Shodan', tagline: 'IoT Search Engine',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '👁️', color: '#dc2626',
  },
  maltego: {
    id: 'maltego', name: 'Maltego', tagline: 'OSINT & Link Analysis',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🕸️', color: '#7c3aed',
  },
  'recon-ng': {
    id: 'recon-ng', name: 'Recon-ng', tagline: 'Reconnaissance Framework',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🎯', color: '#0ea5e9',
  },
  amass: {
    id: 'amass', name: 'Amass', tagline: 'Subdomain Enumeration',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🗺️', color: '#14b8a6',
  },
  subfinder: {
    id: 'subfinder', name: 'Subfinder', tagline: 'Subdomain Discovery',
    category: 'Recon', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔎', color: '#f59e0b',
  },
  openvas: {
    id: 'openvas', name: 'OpenVAS', tagline: 'Vulnerability Assessment',
    category: 'Vulnerability', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🛡️', color: '#22c55e',
  },
  nessus: {
    id: 'nessus', name: 'Nessus', tagline: 'Vulnerability Scanner',
    category: 'Vulnerability', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔰', color: '#3b82f6',
  },
  qualys: {
    id: 'qualys', name: 'Qualys', tagline: 'Cloud Security Platform',
    category: 'Vulnerability', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '☁️', color: '#ef4444',
  },
  acunetix: {
    id: 'acunetix', name: 'Acunetix', tagline: 'Web App Scanner',
    category: 'Vulnerability', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🌐', color: '#f97316',
  },
  burpsuite: {
    id: 'burpsuite', name: 'Burp Suite', tagline: 'Web Security Testing',
    category: 'Web', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔥', color: '#ef4444',
  },
  zap: {
    id: 'zap', name: 'OWASP ZAP', tagline: 'Web App Security Scanner',
    category: 'Web', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '⚡', color: '#0ea5e9',
  },
  xsstrike: {
    id: 'xsstrike', name: 'XSStrike', tagline: 'XSS Detection',
    category: 'Web', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '💥', color: '#dc2626',
  },
  hydra: {
    id: 'hydra', name: 'Hydra', tagline: 'Login Brute-Forcer',
    category: 'Password', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🐙', color: '#7c3aed',
  },
  medusa: {
    id: 'medusa', name: 'Medusa', tagline: 'Parallel Login Tester',
    category: 'Password', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🐍', color: '#059669',
  },
  'aircrack-ng': {
    id: 'aircrack-ng', name: 'Aircrack-ng', tagline: 'WiFi Cracker',
    category: 'Wireless', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📡', color: '#4338ca',
  },
  kismet: {
    id: 'kismet', name: 'Kismet', tagline: 'Wireless Network Detector',
    category: 'Wireless', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📶', color: '#0891b2',
  },
  wireshark: {
    id: 'wireshark', name: 'Wireshark', tagline: 'Packet Analyzer',
    category: 'Packet', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🦈', color: '#1e40af',
  },
  tcpdump: {
    id: 'tcpdump', name: 'tcpdump', tagline: 'CLI Packet Capture',
    category: 'Packet', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📦', color: '#78716c',
  },
  ettercap: {
    id: 'ettercap', name: 'Ettercap', tagline: 'MITM Attack Tool',
    category: 'Packet', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🕷️', color: '#b91c1c',
  },
  cobaltstrike: {
    id: 'cobaltstrike', name: 'Cobalt Strike', tagline: 'Red Team C2',
    category: 'Exploitation', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '⚔️', color: '#991b1b',
  },
  empire: {
    id: 'empire', name: 'Empire', tagline: 'Post-Exploitation Framework',
    category: 'Exploitation', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '👑', color: '#6d28d9',
  },
  qradar: {
    id: 'qradar', name: 'IBM QRadar', tagline: 'Enterprise SIEM',
    category: 'SOC', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🏢', color: '#1e40af',
  },
  sentinel: {
    id: 'sentinel', name: 'Microsoft Sentinel', tagline: 'Cloud SIEM',
    category: 'SOC', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🛡️', color: '#0078d4',
  },
  crowdstrike: {
    id: 'crowdstrike', name: 'CrowdStrike', tagline: 'EDR Platform',
    category: 'Endpoint', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🦅', color: '#dc2626',
  },
  sentinelone: {
    id: 'sentinelone', name: 'SentinelOne', tagline: 'Autonomous EDR',
    category: 'Endpoint', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🤖', color: '#7c3aed',
  },
  defender: {
    id: 'defender', name: 'Microsoft Defender', tagline: 'Endpoint Protection',
    category: 'Endpoint', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🛡️', color: '#0078d4',
  },
  prismacloud: {
    id: 'prismacloud', name: 'Prisma Cloud', tagline: 'CNAPP',
    category: 'Cloud', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '☁️', color: '#f97316',
  },
  lacework: {
    id: 'lacework', name: 'Lacework', tagline: 'Cloud Security',
    category: 'Cloud', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔒', color: '#0891b2',
  },
  frida: {
    id: 'frida', name: 'Frida', tagline: 'Dynamic Instrumentation',
    category: 'Mobile', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔧', color: '#ef4444',
  },
  apktool: {
    id: 'apktool', name: 'APKTool', tagline: 'APK Decompiler',
    category: 'Mobile', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📦', color: '#22c55e',
  },
  snyk: {
    id: 'snyk', name: 'Snyk', tagline: 'Developer Security',
    category: 'DevSecOps', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🐕', color: '#4338ca',
  },
  checkov: {
    id: 'checkov', name: 'Checkov', tagline: 'IaC Security',
    category: 'DevSecOps', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '✅', color: '#16a34a',
  },
  sonarqube: {
    id: 'sonarqube', name: 'SonarQube', tagline: 'Code Quality',
    category: 'DevSecOps', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📊', color: '#4c9aff',
  },
  sleuthkit: {
    id: 'sleuthkit', name: 'Sleuth Kit', tagline: 'Forensic Toolkit',
    category: 'Forensics', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔍', color: '#78716c',
  },
  ghidra: {
    id: 'ghidra', name: 'Ghidra', tagline: 'Reverse Engineering',
    category: 'Forensics', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🐲', color: '#dc2626',
  },
  idapro: {
    id: 'idapro', name: 'IDA Pro', tagline: 'Disassembler',
    category: 'Forensics', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔬', color: '#7c3aed',
  },
  radare2: {
    id: 'radare2', name: 'Radare2', tagline: 'Binary Analysis',
    category: 'Forensics', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🔩', color: '#f97316',
  },
  cuckoo: {
    id: 'cuckoo', name: 'Cuckoo', tagline: 'Malware Sandbox',
    category: 'Malware', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🐦', color: '#22c55e',
  },
  misp: {
    id: 'misp', name: 'MISP', tagline: 'Threat Intelligence Platform',
    category: 'Intelligence', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '🌍', color: '#1e40af',
  },
  opencti: {
    id: 'opencti', name: 'OpenCTI', tagline: 'Cyber Threat Intelligence',
    category: 'Intelligence', type: TOOL_TYPES.COMING_SOON, status: TOOL_STATUS.COMING_SOON,
    icon: '📡', color: '#0ea5e9',
  },
};

/**
 * Get tool configuration by ID
 * @param {string} toolId
 * @returns {object|null}
 */
export const getToolConfig = (toolId) => TOOL_CONFIG[toolId] || null;

/**
 * Get all tools as array
 * @returns {Array}
 */
export const getAllTools = () => Object.values(TOOL_CONFIG);

/**
 * Get tools by status
 * @param {string} status - TOOL_STATUS value
 * @returns {Array}
 */
export const getToolsByStatus = (status) =>
  Object.values(TOOL_CONFIG).filter((t) => t.status === status);

/**
 * Get tools by category
 * @param {string} category
 * @returns {Array}
 */
export const getToolsByCategory = (category) =>
  Object.values(TOOL_CONFIG).filter((t) => t.category === category);

/**
 * Get tools by type
 * @param {string} type - TOOL_TYPES value
 * @returns {Array}
 */
export const getToolsByType = (type) =>
  Object.values(TOOL_CONFIG).filter((t) => t.type === type);

/**
 * Get all unique categories
 * @returns {Array<string>}
 */
export const getAllCategories = () =>
  [...new Set(Object.values(TOOL_CONFIG).map((t) => t.category))];

/**
 * Check if a tool is functional (not coming soon)
 * @param {string} toolId
 * @returns {boolean}
 */
export const isToolActive = (toolId) => {
  const tool = TOOL_CONFIG[toolId];
  return tool && tool.status !== TOOL_STATUS.COMING_SOON;
};

/**
 * Get status badge info
 * @param {string} status
 * @returns {object}
 */
export const getStatusBadge = (status) => {
  switch (status) {
    case TOOL_STATUS.LIVE:
      return { label: 'LIVE', color: '#00ff88', bg: 'rgba(0,255,136,0.1)' };
    case TOOL_STATUS.BETA:
      return { label: 'BETA', color: '#f59e0b', bg: 'rgba(245,158,11,0.1)' };
    case TOOL_STATUS.DEMO:
      return { label: 'DEMO', color: '#8b5cf6', bg: 'rgba(139,92,246,0.1)' };
    case TOOL_STATUS.COMING_SOON:
      return { label: 'COMING SOON', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
    default:
      return { label: 'UNKNOWN', color: '#6b7280', bg: 'rgba(107,114,128,0.1)' };
  }
};

export default TOOL_CONFIG;
