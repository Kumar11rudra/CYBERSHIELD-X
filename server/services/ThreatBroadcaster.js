/**
 * ThreatBroadcaster.js - Real-Time Global Threat Intelligence Broadcaster
 * Broadcasts simulated live threat signals to all connected socket.io clients.
 * Acts as a real-time OSINT feed layer on top of the existing CyberShield X platform.
 */

const THREAT_TEMPLATES = [
  { type: 'MALWARE', severity: 'CRITICAL', source: 'VirusTotal Intel', message: 'New polymorphic rootkit detected — SHA256: a4f3...c891', region: 'Global' },
  { type: 'PHISHING', severity: 'HIGH', source: 'CERT-In Advisory', message: 'Active phishing campaign targeting Indian banking users via SMS', region: 'India' },
  { type: 'BREACH', severity: 'HIGH', source: 'DarkWeb Monitor', message: 'Credential dump detected: 52,000 records from e-commerce sector on RaidForums', region: 'Asia-Pacific' },
  { type: 'DDoS', severity: 'MEDIUM', source: 'AbuseIPDB', message: 'Botnet C2 traffic spike detected — Source ASN: 45899 (VNPT-AS)', region: 'Southeast Asia' },
  { type: 'EXPLOIT', severity: 'CRITICAL', source: 'CISA KEV', message: 'CVE-2024-3094 (XZ backdoor) exploitation confirmed in the wild', region: 'North America' },
  { type: 'RANSOMWARE', severity: 'HIGH', source: 'NCIIPC', message: 'LockBit 3.0 variant targeting MSME sector in Maharashtra', region: 'India' },
  { type: 'IOC', severity: 'MEDIUM', source: 'Threat Intel Feed', message: 'New C2 infrastructure: 185.220.101.x range flagged for Cobalt Strike beacons', region: 'Eastern Europe' },
  { type: 'PHISHING', severity: 'MEDIUM', source: 'Google Safe Browsing', message: 'Spoofed IRCTC login page detected at hxxps://irctc-secure[.]in', region: 'India' },
  { type: 'BREACH', severity: 'CRITICAL', source: 'HaveIBeenPwned', message: 'New database added: 8.3M email addresses from Indian EdTech platform', region: 'India' },
  { type: 'MALWARE', severity: 'HIGH', source: 'DRDO Advisory', message: 'DarkComet RAT sample targeting defense contractors via spear-phishing', region: 'India' },
  { type: 'EXPLOIT', severity: 'HIGH', source: 'NVD', message: 'Critical RCE in Apache Struts (CVE-2024-53677) — Patch immediately', region: 'Global' },
  { type: 'IOC', severity: 'LOW', source: 'Shodan Monitor', message: '1,240 exposed MongoDB instances found with no authentication (Port 27017)', region: 'Global' },
];

const SEVERITY_COLORS = {
  CRITICAL: '#ff2244',
  HIGH: '#ff8c00',
  MEDIUM: '#e5c100',
  LOW: '#00d4ff',
};

let broadcasterInterval = null;

/**
 * Generates a randomized threat event
 */
const generateThreatEvent = () => {
  const template = THREAT_TEMPLATES[Math.floor(Math.random() * THREAT_TEMPLATES.length)];
  return {
    id: `threat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    ...template,
    color: SEVERITY_COLORS[template.severity] || '#00d4ff',
    timestamp: new Date().toISOString(),
    confidence: Math.floor(70 + Math.random() * 30) + '%',
  };
};

/**
 * Starts the real-time threat broadcast loop.
 * @param {import('socket.io').Server} io - The socket.io server instance
 * @param {number} intervalMs - How often to emit a new threat (default: 12 seconds)
 */
const startThreatBroadcaster = (io, intervalMs = 12000) => {
  if (broadcasterInterval) {
    clearInterval(broadcasterInterval);
  }

  // Emit one immediately on start
  const firstThreat = generateThreatEvent();
  io.emit('threat:new', firstThreat);

  broadcasterInterval = setInterval(() => {
    const threat = generateThreatEvent();
    io.emit('threat:new', threat);
    console.log(`📡 [BROADCAST] ${threat.severity} // ${threat.type} >> ${threat.message.slice(0, 60)}...`);
  }, intervalMs);

  console.log(`[ThreatBroadcaster] Started — broadcasting every ${intervalMs / 1000}s`);
};

const stopThreatBroadcaster = () => {
  if (broadcasterInterval) {
    clearInterval(broadcasterInterval);
    broadcasterInterval = null;
  }
};

module.exports = { startThreatBroadcaster, stopThreatBroadcaster, generateThreatEvent };
