/**
 * 🛠️ Central Tool Configuration
 * Maps each toolId to its real name, type, description, and capabilities.
 * Single source of truth for the entire toolkit ecosystem.
 */

// Tool template types
export const TOOL_TYPES = {
  SCANNER: 'scanner',       // Input + Live scan results (Nmap, Nikto)
  ANALYZER: 'analyzer',     // Input + Analysis report (UrlEngine, WHOIS)
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
  dns: {
    id: 'dns',
    name: 'DNS Enumeration Engine',
    tagline: 'Query primary DNS records for infrastructure mapping',
    description: 'Lookup primary DNS records (A, MX, NS) and discover subdomains to map remote hosting architecture.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.DOMAIN,
    inputPlaceholder: 'Enter domain name (e.g., example.com)',
    apiEndpoint: '/toolkit/execute',
    icon: '🌐',
    color: '#0ea5e9',
    capabilities: ['A/MX/NS lookup', 'Subdomain discovery', 'Zone enumeration'],
  },
  http: {
    id: 'http',
    name: 'HTTP Security Engine',
    tagline: 'Audit HTTP headers and server configurations',
    description: 'Perform deep HTTP analysis, header inspection, and check for misconfigurations.',
    category: 'Web',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter URL (e.g., https://example.com)',
    apiEndpoint: '/toolkit/execute',
    icon: '🌍',
    color: '#f59e0b',
    capabilities: ['Header analysis', 'Security headers', 'Status codes'],
  },
  port: {
    id: 'port',
    name: 'Port & Service Engine',
    tagline: 'Discover open ports and network services',
    description: 'Scan open ports and discover network services running on target hosts.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP or hostname',
    apiEndpoint: '/toolkit/execute',
    icon: '📡',
    color: '#00ff88',
    capabilities: ['Port scanning', 'Service detection'],
  },
  service_fingerprint: {
    id: 'service_fingerprint',
    name: 'Service Fingerprint Engine',
    tagline: 'Identify and fingerprint running software',
    description: 'Analyze network responses to fingerprint operating systems and specific service versions.',
    category: 'Vulnerability',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.IP,
    inputPlaceholder: 'Enter IP or hostname',
    apiEndpoint: '/toolkit/execute',
    icon: '🧪',
    color: '#ff6b6b',
    capabilities: ['OS detection', 'Version fingerprinting'],
  },
  ssl: {
    id: 'ssl',
    name: 'SSL/TLS Security Engine',
    tagline: 'Inspect active TLS protocols and certificates',
    description: 'Connect directly to retrieve certificate details, TLS protocol version, and calculate a trust grade.',
    category: 'Vulnerability',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.DOMAIN,
    inputPlaceholder: 'Enter domain name',
    apiEndpoint: '/toolkit/execute',
    icon: '🔒',
    color: '#10b981',
    capabilities: ['TLS version detection', 'Cipher suite check', 'Expiry date checks'],
  },
  tech_detection: {
    id: 'tech_detection',
    name: 'Technology Detection Engine',
    tagline: 'Identify tech stacks and content engines',
    description: 'Fingerprint remote web applications to identify frameworks, CMS, and analytics tools.',
    category: 'Recon',
    type: TOOL_TYPES.SCANNER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter website URL',
    apiEndpoint: '/toolkit/execute',
    icon: '🕸️',
    color: '#ec4899',
    capabilities: ['Technology detection', 'CMS identification', 'Framework fingerprinting'],
  },
  url: {
    id: 'url',
    name: 'URL & Threat Intel Engine',
    tagline: 'Check reputation marks and analyze malicious links',
    description: 'Scan URLs and IPs against threat intelligence databases to identify malware and abuse.',
    category: 'Intelligence',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Enter URL or IP',
    apiEndpoint: '/toolkit/execute',
    icon: '☣️',
    color: '#394eff',
    capabilities: ['Reputation check', 'Malware detection', 'Phishing detection'],
  },
  whois: {
    id: 'whois',
    name: 'WHOIS Record Engine',
    tagline: 'Query public records for domain ownership data',
    description: 'Look up registration details, registrar, creation date, and name servers.',
    category: 'Recon',
    type: TOOL_TYPES.ANALYZER,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.DOMAIN,
    inputPlaceholder: 'Enter domain name',
    apiEndpoint: '/toolkit/execute',
    icon: '🌐',
    color: '#06b6d4',
    capabilities: ['Registrar info', 'Expiry dates', 'Name servers'],
  },
  'jwt-parser': {
    id: 'jwt-parser',
    name: 'JWT Security Decoder',
    tagline: 'Inspect JSON Web Tokens',
    description: 'Decode and inspect JWT tokens.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Paste your JWT token here',
    apiEndpoint: null,
    icon: '🔑',
    color: '#f59e0b',
    capabilities: ['Header decode', 'Payload inspection'],
  },
  'base64-decoder': {
    id: 'base64-decoder',
    name: 'Base64 Converter',
    tagline: 'Encode and decode Base64 strings',
    description: 'Instantly convert text to/from Base64.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.TEXT,
    inputPlaceholder: 'Enter text',
    apiEndpoint: null,
    icon: '🔄',
    color: '#8b5cf6',
    capabilities: ['Base64 encode', 'Base64 decode'],
  },
  'url-sanitizer': {
    id: 'url-sanitizer',
    name: 'URL Sanitizer',
    tagline: 'Parse and sanitize URLs',
    description: 'Parse URLs, extract query parameters, and identify payloads.',
    category: 'Utility',
    type: TOOL_TYPES.UTILITY,
    status: TOOL_STATUS.LIVE,
    inputType: INPUT_TYPES.URL,
    inputPlaceholder: 'Paste a URL',
    apiEndpoint: null,
    icon: '🔗',
    color: '#06b6d4',
    capabilities: ['URL parsing', 'Query extraction'],
  }
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
