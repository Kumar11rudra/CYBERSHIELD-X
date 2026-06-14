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
  nmap: {
    id: 'nmap',
    name: 'Network Port & Device Scanner',
    tagline: 'Discover open ports and services running on target hosts [Powered by Nmap]',
    description: 'Scan open ports and discover running services on any IP address or hostname. Uses real TCP scanning.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP address or hostname (e.g., 192.168.1.1)',
    apiEndpoint: '/toolkit/execute',
    icon: '🔍',
    color: '#00ff88',
    capabilities: ['Port scanning', 'Service detection', 'OS fingerprinting'],
  },

  nikto: {
    id: 'nikto',
    name: 'Web Server Vulnerability Scanner',
    tagline: 'Audit remote web servers for configuration faults [Powered by Nikto]',
    description: 'Audit web server configurations, security headers, and common vulnerabilities.',
    category: 'Vulnerability',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter website URL (e.g., https://example.com)',
    apiEndpoint: '/toolkit/execute',
    icon: '🛡️',
    color: '#ff6b6b',
    capabilities: ['Security header check', 'Server fingerprinting', 'Vulnerability detection'],
  },

  virustotal: {
    id: 'virustotal',
    name: 'Threat Intelligence & File Scanner',
    tagline: 'Check reputation marks against 70+ global vendors [Powered by VirusTotal]',
    description: 'Scan URLs, IPs, domains, and file hashes against 70+ antivirus engines. Uses the real VirusTotal API.',
    category: 'Intelligence',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter URL, IP, domain, or file hash',
    apiEndpoint: '/toolkit/execute',
    icon: '🦠',
    color: '#394eff',
    capabilities: ['URL scanning', 'IP reputation', 'Hash lookup', 'Domain analysis'],
  },

  abuseipdb: {
    id: 'abuseipdb',
    name: 'IP Abuse & Blacklist Reputation Checker',
    tagline: 'Audit IP addresses against community abuse blacklist reports [Powered by AbuseIPDB]',
    description: 'Check any IP address against the AbuseIPDB community blacklist — see abuse score, reports, ISP, and location.',
    category: 'Intelligence',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP address (e.g., 1.1.1.1)',
    apiEndpoint: '/toolkit/execute',
    icon: '🚨',
    color: '#ff4d4d',
    capabilities: ['Abuse score', 'Report history', 'ISP detection', 'Country lookup'],
  },

  whois: {
    id: 'whois',
    name: 'Domain Registration & WHOIS Record Lookup',
    tagline: 'Query public records for domain ownership & expiry data',
    description: 'Look up registration details for any domain — registrar, creation date, expiry, name servers, and more.',
    category: 'Recon',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.DOMAIN,
    inputPlaceholder: 'Enter domain name (e.g., example.com)',
    apiEndpoint: '/toolkit/execute',
    icon: '🌐',
    color: '#06b6d4',
    capabilities: ['Registrar info', 'Expiry dates', 'Name servers', 'DNSSEC status'],
  },

  // ══════════════════════════════════════════════════════════
  //  UTILITY TOOLS — 100% Client-side
  // ══════════════════════════════════════════════════════════
  'jwt-parser': {
    id: 'jwt-parser',
    name: 'JWT Security Decoder & Payload Inspector',
    tagline: 'Inspect JSON Web Tokens for claims structure',
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
    name: 'Base64 Encryption & Decryption Converter',
    tagline: 'Convert standard textual signals to/from Base64 values',
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
    name: 'URL Security Sanitizer & Parameter Parser',
    tagline: 'Audit URLs and queries for malicious payload signals',
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
    name: 'Wazuh Endpoint Threat & Vulnerability Monitoring',
    tagline: 'Enterprise host-level event logging and integrity checks [Powered by Wazuh]',
    description: 'Security Information and Event Management — monitor alerts and security events.',
    category: 'SOC',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter agent ID or search query',
    apiEndpoint: '/toolkit/execute',
    icon: '📊',
    color: '#3b82f6',
    capabilities: ['Alert monitoring', 'Log analysis', 'Compliance checking'],
  },

  wiz: {
    id: 'wiz',
    name: 'Wiz Multi-Cloud Infrastructure Risk Assessment',
    tagline: 'Audit cloud workload security and exposure graphs [Powered by Wiz]',
    description: 'Cloud infrastructure security assessment and misconfiguration detection.',
    category: 'Cloud',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter cloud resource or config path',
    apiEndpoint: '/toolkit/execute',
    icon: '☁️',
    color: '#10b981',
    capabilities: ['Cloud audit', 'Misconfiguration detection', 'Compliance check'],
  },

  // ══════════════════════════════════════════════════════════
  //  ACTIVE SCANNERS — Previously simulated
  // ══════════════════════════════════════════════════════════
  sherlock: {
    id: 'sherlock',
    name: 'Sherlock Username Footprint OSINT Tracker',
    tagline: 'Locate user handle footprints across 300+ web platforms [Powered by Sherlock]',
    description: 'Search for a username across 300+ social media platforms and websites.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.USERNAME,
    inputPlaceholder: 'Enter username to search',
    apiEndpoint: '/toolkit/execute',
    icon: '🕵️',
    color: '#a855f7',
    capabilities: ['Social media search', 'Account enumeration', 'Profile linking'],
  },

  whatweb: {
    id: 'whatweb',
    name: 'WhatWeb Website Technology Profiler & CMS Fingerprinter',
    tagline: 'Fingerprint remote server assets and content engines [Powered by WhatWeb]',
    description: 'Identify technologies used on websites — CMS, frameworks, analytics, and more.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter website URL',
    apiEndpoint: '/toolkit/execute',
    icon: '🌐',
    color: '#ec4899',
    capabilities: ['Technology detection', 'CMS identification', 'Framework fingerprinting'],
  },

  sqlmap: {
    id: 'sqlmap',
    name: 'SQLMap Database SQL Injection Vulnerability Scanner',
    tagline: 'Audit application endpoints for SQL injection vulnerabilities [Powered by SQLMap]',
    description: 'Automated SQL injection detection and exploitation testing tool.',
    category: 'Web',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target URL with parameters',
    apiEndpoint: '/toolkit/execute',
    icon: '💉',
    color: '#ef4444',
    capabilities: ['SQL injection detection', 'Database enumeration', 'Payload testing'],
  },

  dirsearch: {
    id: 'dirsearch',
    name: 'Dirsearch Hidden Directory & File Finder',
    tagline: 'Brute-force remote endpoints for hidden folders or logs [Powered by Dirsearch]',
    description: 'Discover hidden directories and files on web servers.',
    category: 'Web',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target URL',
    apiEndpoint: '/toolkit/execute',
    icon: '📂',
    color: '#f97316',
    capabilities: ['Directory scanning', 'File discovery', 'Path enumeration'],
  },

  john: {
    id: 'john',
    name: 'John the Ripper Password Hash Strength Auditor',
    tagline: 'Audit credential databases and crack offline password hashes [Powered by John]',
    description: 'Test password strength by cracking password hashes.',
    category: 'Password',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.HASH,
    inputPlaceholder: 'Enter password hash',
    apiEndpoint: '/toolkit/execute',
    icon: '🔓',
    color: '#eab308',
    capabilities: ['Hash cracking', 'Dictionary attack', 'Password audit'],
  },

  hashcat: {
    id: 'hashcat',
    name: 'Hashcat GPU-Accelerated Password Recovery Auditor',
    tagline: 'Test password strength using mathematical attack engines [Powered by Hashcat]',
    description: 'GPU-accelerated password hash recovery and analysis.',
    category: 'Password',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.HASH,
    inputPlaceholder: 'Enter hash to analyze',
    apiEndpoint: '/toolkit/execute',
    icon: '⚡',
    color: '#f59e0b',
    capabilities: ['Hash analysis', 'Rule-based attack', 'Mask attack'],
  },

  splunk: {
    id: 'splunk',
    name: 'Splunk Enterprise Security Logs & Event Monitor',
    tagline: 'Ingest and query real-time event logs for threat hunting [Powered by Splunk]',
    description: 'Enterprise-grade security information and event management.',
    category: 'SOC',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter SPL query',
    apiEndpoint: '/toolkit/execute',
    icon: '📈',
    color: '#65a30d',
    capabilities: ['Log analysis', 'SPL queries', 'Alert management'],
  },

  mobsf: {
    id: 'mobsf',
    name: 'MobSF Mobile App (Android/iOS) Binary Scanner',
    tagline: 'Audit mobile application packages for security warnings [Powered by MobSF]',
    description: 'Static and dynamic analysis of Android and iOS applications.',
    category: 'Mobile',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload APK/IPA file',
    apiEndpoint: '/toolkit/execute',
    icon: '📱',
    color: '#0ea5e9',
    capabilities: ['APK analysis', 'IPA analysis', 'Permissions audit'],
  },

  slither: {
    id: 'slither',
    name: 'Slither Solidity Smart Contract Security Auditor',
    tagline: 'Static audit Solidity smart contracts for reentrancy bugs [Powered by Slither]',
    description: 'Static analysis framework for Solidity smart contracts.',
    category: 'DevSecOps',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter contract address or paste Solidity code',
    apiEndpoint: '/toolkit/execute',
    icon: '🔐',
    color: '#6366f1',
    capabilities: ['Vulnerability detection', 'Reentrancy check', 'Gas optimization'],
  },

  autopsy: {
    id: 'autopsy',
    name: 'Autopsy Digital Cyber Forensics Investigation Suite',
    tagline: 'Perform chronological timeline forensics on disk images [Powered by Autopsy]',
    description: 'Comprehensive digital forensics and incident response platform.',
    category: 'Forensics',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload disk image or evidence file',
    apiEndpoint: '/toolkit/execute',
    icon: '🔬',
    color: '#78716c',
    capabilities: ['Disk forensics', 'File recovery', 'Timeline analysis'],
  },

  ftk: {
    id: 'ftk',
    name: 'FTK Imager Forensic Disk Imaging & Hash Verifier',
    tagline: 'Preserve storage sectors and capture bit-perfect clones [Powered by FTK Imager]',
    description: 'Create forensic images of hard drives for evidence preservation.',
    category: 'Forensics',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Select evidence source',
    apiEndpoint: '/toolkit/execute',
    icon: '💾',
    color: '#a3a3a3',
    capabilities: ['Disk imaging', 'Evidence preservation', 'Hash verification'],
  },

  volatility: {
    id: 'volatility',
    name: 'Volatility RAM Memory Dump Cyber Forensics Analyzer',
    tagline: 'Extract system states and kernel logs from volatile RAM [Powered by Volatility]',
    description: 'Analyze RAM dumps for malware, rootkits, and forensic artifacts.',
    category: 'Forensics',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload memory dump file',
    apiEndpoint: '/toolkit/execute',
    icon: '🧠',
    color: '#dc2626',
    capabilities: ['Process analysis', 'Network connections', 'Malware detection'],
  },

  stegano: {
    id: 'stegano',
    name: 'Steghide Steganography Hidden Data Extractor',
    tagline: 'Scan files for hidden data payloads and watermarks [Powered by Steghide]',
    description: 'Detect and extract hidden data embedded in image and audio files.',
    category: 'Forensics',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload image or audio file',
    apiEndpoint: '/toolkit/execute',
    icon: '🖼️',
    color: '#059669',
    capabilities: ['Hidden data detection', 'Payload extraction', 'LSB analysis'],
  },

  exiftool: {
    id: 'exiftool',
    name: 'ExifTool Image Metadata & GPS Tracker Remover',
    tagline: 'Inspect and clean metadata tags from visual media [Powered by ExifTool]',
    description: 'Read, write, and analyze metadata in images, documents, and media files.',
    category: 'Forensics',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Upload file to analyze metadata',
    apiEndpoint: '/toolkit/execute',
    icon: '📋',
    color: '#7c3aed',
    capabilities: ['EXIF data extraction', 'GPS location', 'Camera information'],
  },

  zerothreat: {
    id: 'zerothreat',
    name: 'ZeroThreat Autonomous AI-Driven Penetration Tester',
    tagline: 'Launch autonomous multi-agent testing pipelines [Powered by ZeroThreat]',
    description: 'Automated AI-driven penetration testing and vulnerability assessment.',
    category: 'Exploitation',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter target for assessment',
    apiEndpoint: '/toolkit/execute',
    icon: '🤖',
    color: '#e11d48',
    capabilities: ['Automated pentesting', 'Vulnerability assessment', 'Report generation'],
  },

  // ══════════════════════════════════════════════════════════
  //  LOCKED — Always Coming Soon (38 tools)
  // ══════════════════════════════════════════════════════════
  metasploit: {
    id: 'metasploit',
    name: 'Metasploit Exploit Verification & CVE Auditor',
    tagline: 'Simulate vulnerability validation and exploits database [Powered by Metasploit]',
    description: 'World\'s most used penetration testing framework.',
    category: 'Exploitation',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter target IP or host (e.g. 192.168.1.1)',
    apiEndpoint: '/toolkit/execute',
    icon: '💀',
    color: '#991b1b',
    capabilities: ['Exploit execution', 'Payload delivery', 'Post-exploitation'],
  },
  trivy: {
    id: 'trivy',
    name: 'Trivy Docker Container Image Vulnerability Auditor',
    tagline: 'Scan container layers and packages for security issues [Powered by Trivy]',
    description: 'Comprehensive vulnerability scanner for containers and IaC.',
    category: 'DevSecOps',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter container image (e.g. postgres:15-alpine)',
    apiEndpoint: '/toolkit/execute',
    icon: '🐳',
    color: '#0284c7',
    capabilities: ['Container scanning', 'IaC scanning', 'SBOM generation'],
  },
  aircrack: {
    id: 'aircrack',
    name: 'Aircrack-ng Wireless WiFi Security Auditor',
    tagline: 'Audit wireless networks and capture WPA handshakes [Powered by Aircrack-ng]',
    description: 'WiFi network security assessment and WPA/WPA2 testing.',
    category: 'Wireless',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.FILE,
    inputPlaceholder: 'Select WiFi handshake file (.cap)',
    apiEndpoint: '/toolkit/execute',
    icon: '📡',
    color: '#4338ca',
    capabilities: ['WiFi monitoring', 'WPA cracking', 'Packet capture'],
  },
  theharvester: {
    id: 'theharvester', name: 'theHarvester OSINT Gatherer', tagline: 'OSINT Gatherer',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🌾', color: '#65a30d',
  },
  shodan: {
    id: 'shodan', name: 'Shodan IoT Search Engine', tagline: 'IoT Search Engine',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '👁️', color: '#dc2626',
  },
  maltego: {
    id: 'maltego', name: 'Maltego OSINT & Link Analysis', tagline: 'OSINT & Link Analysis',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🕸️', color: '#7c3aed',
  },
  'recon-ng': {
    id: 'recon-ng', name: 'Recon-ng Reconnaissance Framework', tagline: 'Reconnaissance Framework',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🎯', color: '#0ea5e9',
  },
  amass: {
    id: 'amass', name: 'Amass Subdomain Enumeration', tagline: 'Subdomain Enumeration',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🗺️', color: '#14b8a6',
  },
  subfinder: {
    id: 'subfinder', name: 'Subfinder Subdomain Discovery', tagline: 'Subdomain Discovery',
    category: 'Recon', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔎', color: '#f59e0b',
  },
  openvas: {
    id: 'openvas', name: 'OpenVAS Vulnerability Assessment', tagline: 'Vulnerability Assessment',
    category: 'Vulnerability', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🛡️', color: '#22c55e',
  },
  nessus: {
    id: 'nessus', name: 'Nessus Vulnerability Scanner', tagline: 'Vulnerability Scanner',
    category: 'Vulnerability', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔰', color: '#3b82f6',
  },
  qualys: {
    id: 'qualys', name: 'Qualys Cloud Security Platform', tagline: 'Cloud Security Platform',
    category: 'Vulnerability', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '☁️', color: '#ef4444',
  },
  acunetix: {
    id: 'acunetix', name: 'Acunetix Web App Scanner', tagline: 'Web App Scanner',
    category: 'Vulnerability', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🌐', color: '#f97316',
  },
  burpsuite: {
    id: 'burpsuite', name: 'Burp Suite Web Security Testing', tagline: 'Web Security Testing',
    category: 'Web', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔥', color: '#ef4444',
  },
  zap: {
    id: 'zap', name: 'OWASP ZAP Web App Security Scanner', tagline: 'Web App Security Scanner',
    category: 'Web', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '⚡', color: '#0ea5e9',
  },
  xsstrike: {
    id: 'xsstrike', name: 'XSStrike XSS Detection', tagline: 'XSS Detection',
    category: 'Web', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '💥', color: '#dc2626',
  },
  hydra: {
    id: 'hydra', name: 'Hydra Login Brute-Forcer', tagline: 'Login Brute-Forcer',
    category: 'Password', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🐙', color: '#7c3aed',
  },
  medusa: {
    id: 'medusa', name: 'Medusa Parallel Login Tester', tagline: 'Parallel Login Tester',
    category: 'Password', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🐍', color: '#059669',
  },
  'aircrack-ng': {
    id: 'aircrack-ng', name: 'Aircrack-ng WiFi Cracker', tagline: 'WiFi Cracker',
    category: 'Wireless', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '📡', color: '#4338ca',
  },
  kismet: {
    id: 'kismet', name: 'Kismet Wireless Network Detector', tagline: 'Wireless Network Detector',
    category: 'Wireless', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '📶', color: '#0891b2',
  },
  wireshark: {
    id: 'wireshark', name: 'Wireshark Packet Analyzer', tagline: 'Packet Analyzer',
    category: 'Packet', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🦈', color: '#1e40af',
  },
  tcpdump: {
    id: 'tcpdump', name: 'tcpdump CLI Packet Capture', tagline: 'CLI Packet Capture',
    category: 'Packet', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '📦', color: '#78716c',
  },
  ettercap: {
    id: 'ettercap', name: 'Ettercap MITM Attack Tool', tagline: 'MITM Attack Tool',
    category: 'Packet', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🕷️', color: '#b91c1c',
  },
  cobaltstrike: {
    id: 'cobaltstrike', name: 'Cobalt Strike Red Team C2', tagline: 'Red Team C2',
    category: 'Exploitation', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '⚔️', color: '#991b1b',
  },
  empire: {
    id: 'empire', name: 'Empire Post-Exploitation Framework', tagline: 'Post-Exploitation Framework',
    category: 'Exploitation', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '👑', color: '#6d28d9',
  },
  qradar: {
    id: 'qradar', name: 'IBM QRadar Enterprise SIEM', tagline: 'Enterprise SIEM',
    category: 'SOC', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🏢', color: '#1e40af',
  },
  sentinel: {
    id: 'sentinel', name: 'Microsoft Sentinel Cloud SIEM', tagline: 'Cloud SIEM',
    category: 'SOC', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🛡️', color: '#0078d4',
  },
  crowdstrike: {
    id: 'crowdstrike', name: 'CrowdStrike EDR Platform', tagline: 'EDR Platform',
    category: 'Endpoint', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🦅', color: '#dc2626',
  },
  sentinelone: {
    id: 'sentinelone', name: 'SentinelOne Autonomous EDR', tagline: 'Autonomous EDR',
    category: 'Endpoint', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🤖', color: '#7c3aed',
  },
  defender: {
    id: 'defender', name: 'Microsoft Defender Endpoint Protection', tagline: 'Endpoint Protection',
    category: 'Endpoint', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🛡️', color: '#0078d4',
  },
  prismacloud: {
    id: 'prismacloud', name: 'Prisma Cloud CNAPP', tagline: 'CNAPP',
    category: 'Cloud', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '☁️', color: '#f97316',
  },
  lacework: {
    id: 'lacework', name: 'Lacework Cloud Security', tagline: 'Cloud Security',
    category: 'Cloud', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔒', color: '#0891b2',
  },
  frida: {
    id: 'frida', name: 'Frida Dynamic Instrumentation', tagline: 'Dynamic Instrumentation',
    category: 'Mobile', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔧', color: '#ef4444',
  },
  apktool: {
    id: 'apktool', name: 'APKTool APK Decompiler', tagline: 'APK Decompiler',
    category: 'Mobile', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '📦', color: '#22c55e',
  },
  snyk: {
    id: 'snyk', name: 'Snyk Developer Security', tagline: 'Developer Security',
    category: 'DevSecOps', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🐕', color: '#4338ca',
  },
  checkov: {
    id: 'checkov', name: 'Checkov IaC Security', tagline: 'IaC Security',
    category: 'DevSecOps', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '✅', color: '#16a34a',
  },
  sonarqube: {
    id: 'sonarqube', name: 'SonarQube Code Quality', tagline: 'Code Quality',
    category: 'DevSecOps', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '📊', color: '#4c9aff',
  },
  sleuthkit: {
    id: 'sleuthkit', name: 'Sleuth Kit Forensic Toolkit', tagline: 'Forensic Toolkit',
    category: 'Forensics', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔍', color: '#78716c',
  },
  ghidra: {
    id: 'ghidra', name: 'Ghidra Reverse Engineering', tagline: 'Reverse Engineering',
    category: 'Forensics', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🐲', color: '#dc2626',
  },
  idapro: {
    id: 'idapro', name: 'IDA Pro Disassembler', tagline: 'Disassembler',
    category: 'Forensics', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔬', color: '#7c3aed',
  },
  radare2: {
    id: 'radare2', name: 'Radare2 Binary Analysis', tagline: 'Binary Analysis',
    category: 'Forensics', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🔩', color: '#f97316',
  },
  cuckoo: {
    id: 'cuckoo', name: 'Cuckoo Malware Sandbox', tagline: 'Malware Sandbox',
    category: 'Malware', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🐦', color: '#22c55e',
  },
  misp: {
    id: 'misp', name: 'MISP Threat Intelligence Platform', tagline: 'Threat Intelligence Platform',
    category: 'Intelligence', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
    icon: '🌍', color: '#1e40af',
  },
  opencti: {
    id: 'opencti', name: 'OpenCTI Cyber Threat Intelligence', tagline: 'Cyber Threat Intelligence',
    category: 'Intelligence', type: TOOL_TYPES.SCANNER, status: TOOL_STATUS.LIVE,
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
