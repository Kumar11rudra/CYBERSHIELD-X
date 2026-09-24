/**
 * 🛰️ Terminal Native Tool Registry — CyberShield X (Step 2)
 *
 * Authoritative Single Source of Truth for host-native execution tools.
 *
 * CRITICAL ARCHITECTURAL BOUNDARY:
 * This registry represents ONLY the tools supported natively by HostEnvironmentService.
 * It does NOT mirror the 111-tool product catalog.
 * The 111 canonical tools remain the broader product catalog (accessible via /toolkit).
 * This registry is strictly for local host execution via POST /api/terminal/execute-native.
 */

export const TERMINAL_NATIVE_REGISTRY = [
  {
    id: 'nmap',
    label: 'Nmap Port Scanner',
    executable: 'nmap',
    alias: 'port',
    category: 'Network',
    description: 'Safe TCP port scanning and listening socket discovery',
    supported: true,
    argumentProfile: '-sT -Pn -T4 -p 21,22,25,80,443,8080,8443 --host-timeout 8s {TARGET}',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: 'scanme.nmap.org',
    placeholder: 'domain or IP (e.g. scanme.nmap.org)',
    template: 'nmap scanme.nmap.org',
    exampleUsage: ['nmap scanme.nmap.org', 'nmap 192.168.1.1'],
    availability: 'AVAILABLE'
  },
  {
    id: 'dig',
    label: 'DNS Dig Resolver',
    executable: 'dig',
    alias: 'dns',
    category: 'DNS & Network',
    description: 'Authoritative DNS record and zone lookup',
    supported: true,
    argumentProfile: '+noall +answer +question {TARGET}',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: 'cloudflare.com',
    placeholder: 'domain (e.g. cloudflare.com)',
    template: 'dig cloudflare.com',
    exampleUsage: ['dig cloudflare.com', 'dig google.com'],
    availability: 'AVAILABLE'
  },
  {
    id: 'curl',
    label: 'HTTP Security Headers',
    executable: 'curl',
    alias: 'http',
    category: 'Web Security',
    description: 'HTTP response header inspection and TLS protocol audit',
    supported: true,
    argumentProfile: '-ILsS --connect-timeout 8 --max-time 10 {TARGET}',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: 'https://example.com',
    placeholder: 'URL or host (e.g. https://example.com)',
    template: 'curl https://example.com',
    exampleUsage: ['curl https://example.com', 'curl https://cybershield.local'],
    availability: 'AVAILABLE'
  },
  {
    id: 'whois',
    label: 'WHOIS Registry Query',
    executable: 'whois',
    alias: 'whois',
    category: 'Reconnaissance',
    description: 'Domain registrar, ASN, and IP allocation intelligence',
    supported: true,
    argumentProfile: '{TARGET}',
    outputFormat: 'text',
    dangerous: false,
    defaultTarget: 'google.com',
    placeholder: 'domain (e.g. google.com)',
    template: 'whois google.com',
    exampleUsage: ['whois google.com', 'whois 8.8.8.8'],
    availability: 'AVAILABLE'
  },
  {
    id: 'openssl',
    label: 'SSL/TLS Certificate Audit',
    executable: 'openssl',
    alias: 'ssl',
    category: 'Web Security',
    description: 'TLS handshake, cipher suites, and certificate chain dossier',
    supported: true,
    argumentProfile: 's_client -connect {HOST}:443 -servername {HOST} -brief',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: 'example.com',
    placeholder: 'host or domain (e.g. example.com)',
    template: 'openssl example.com',
    exampleUsage: ['openssl example.com', 'openssl github.com'],
    availability: 'AVAILABLE'
  },
  {
    id: 'ping',
    label: 'ICMP Ping Reachability',
    executable: 'ping',
    alias: 'ping',
    category: 'Network',
    description: 'ICMP packet transmission and round-trip latency probe',
    supported: true,
    argumentProfile: '-c 2 {TARGET}',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: '8.8.8.8',
    placeholder: 'domain or IP (e.g. 8.8.8.8)',
    template: 'ping 8.8.8.8',
    exampleUsage: ['ping 8.8.8.8', 'ping 1.1.1.1'],
    availability: 'AVAILABLE'
  },
  {
    id: 'traceroute',
    label: 'Network Route Traceroute',
    executable: 'traceroute',
    alias: 'traceroute',
    category: 'Network',
    description: 'Network gateway hop path and transit latency trace',
    supported: true,
    argumentProfile: '-m 8 -q 1 -w 2 {TARGET}',
    outputFormat: 'table',
    dangerous: false,
    defaultTarget: 'example.com',
    placeholder: 'domain or IP (e.g. example.com)',
    template: 'traceroute example.com',
    exampleUsage: ['traceroute example.com', 'traceroute 8.8.8.8'],
    availability: 'AVAILABLE'
  }
];

/**
 * Set of approved executable names and aliases for fast O(1) lookup
 */
export const NATIVE_EXECUTABLES_SET = new Set(
  TERMINAL_NATIVE_REGISTRY.map(t => t.executable)
);

const baseAliasEntries = TERMINAL_NATIVE_REGISTRY.flatMap(t => [
  [t.id.toLowerCase(), t],
  [t.executable.toLowerCase(), t],
  [t.alias.toLowerCase(), t]
]);
// Common tactical aliases
baseAliasEntries.push(
  ['network-map', TERMINAL_NATIVE_REGISTRY.find(t => t.id === 'nmap')],
  ['dns-lookup', TERMINAL_NATIVE_REGISTRY.find(t => t.id === 'dig')],
  ['whois-lookup', TERMINAL_NATIVE_REGISTRY.find(t => t.id === 'whois')],
  ['trace', TERMINAL_NATIVE_REGISTRY.find(t => t.id === 'traceroute')]
);

export const NATIVE_ALIASES_MAP = new Map(baseAliasEntries);

/**
 * Resolves a native tool definition from an ID, alias, or command string.
 * Returns null if the tool is not in the native terminal registry.
 */
export function resolveNativeTool(identifier) {
  if (!identifier || typeof identifier !== 'string') return null;
  const clean = identifier.trim().toLowerCase();
  return NATIVE_ALIASES_MAP.get(clean) || null;
}

/**
 * Checks if a given tool ID/executable is authorized for native execution.
 */
export function isNativeToolAuthorized(identifier) {
  return Boolean(resolveNativeTool(identifier));
}

/**
 * Annotates the centralized registry with real-time host capability availability.
 * Resolves each tool to:
 * - 'AVAILABLE' (Installed on host & authorized for native execution)
 * - 'NOT INSTALLED' (Binary missing on host workstation)
 * - 'RESTRICTED' (Tool not permitted in native terminal)
 * - 'UNAVAILABLE' (Host environment unreachable or indeterminate)
 */
export function getAnnotatedNativeRegistry(hostCapabilities) {
  if (!hostCapabilities) {
    return TERMINAL_NATIVE_REGISTRY.map(t => ({
      ...t,
      availability: 'AVAILABLE',
      isExecutable: true
    }));
  }

  const binaries = hostCapabilities.binaries || {};
  const nativeCaps = Array.isArray(hostCapabilities.nativeCapabilities)
    ? new Map(hostCapabilities.nativeCapabilities.map(c => [c.executable || c.id, c]))
    : null;

  return TERMINAL_NATIVE_REGISTRY.map(tool => {
    let availability = 'AVAILABLE';

    if (nativeCaps && nativeCaps.has(tool.executable)) {
      const cap = nativeCaps.get(tool.executable);
      availability = cap.availability || (cap.installed ? 'AVAILABLE' : 'NOT INSTALLED');
    } else if (binaries[tool.executable]) {
      const binInfo = binaries[tool.executable];
      availability = binInfo.installed ? 'AVAILABLE' : 'NOT INSTALLED';
    }

    return {
      ...tool,
      availability,
      isExecutable: availability === 'AVAILABLE'
    };
  });
}

/**
 * Evaluates the availability state for a specific tool against live host capabilities.
 */
export function getToolAvailability(toolIdentifier, hostCapabilities) {
  const tool = resolveNativeTool(toolIdentifier);
  if (!tool) {
    return 'RESTRICTED';
  }
  if (!hostCapabilities) {
    return 'AVAILABLE';
  }
  const registry = getAnnotatedNativeRegistry(hostCapabilities);
  const found = registry.find(t => t.id === tool.id);
  return found ? found.availability : 'AVAILABLE';
}
