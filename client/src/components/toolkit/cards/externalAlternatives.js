/**
 * 🌐 EXTERNAL ALTERNATIVES REGISTRY — CyberShield X
 * Phase 2B Step 10B / Step 11: Production External Provider Mapping
 *
 * SOURCE OF TRUTH: PHASE_2B_STEP_10A_EXTERNAL_ALTERNATIVES_AUDIT.md
 *
 * STRICT SECURITY BOUNDARIES:
 * 1. Outbound informational navigation only (target="_blank" rel="noopener noreferrer").
 * 2. ZERO automated target parameter interpolation (targets are NEVER appended to URLs).
 * 3. ZERO automated credential, JWT, cookie, token, or tenant forwarding.
 * 4. 100% decoupled from native first-party execution (POST /api/toolkit/execute).
 * 5. HIGH / CRITICAL tools mandate explicit operator acknowledgment before external navigation.
 */

export const EXTERNAL_ALTERNATIVES = {
  "dns": {
    "toolId": "dns",
    "toolName": "DNS Enumeration Engine",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MXToolbox",
        "product": "SuperTool DNS Lookup",
        "officialUrl": "https://mxtoolbox.com/SuperTool.aspx",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "whois": {
    "toolId": "whois",
    "toolName": "WHOIS Record Engine",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ICANN",
        "product": "ICANN Registration Data Lookup",
        "officialUrl": "https://lookup.icann.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "port": {
    "toolId": "port",
    "toolName": "Port Scanner",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "HackerTarget",
        "product": "HackerTarget Online Port Scan",
        "officialUrl": "https://hackertarget.com/tcp-port-scan/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "Public IP",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "service_fingerprint": {
    "toolId": "service_fingerprint",
    "toolName": "Service Fingerprinting",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Shodan",
        "product": "Shodan Host Search",
        "officialUrl": "https://www.shodan.io/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free account",
        "dataExposure": "Public IP",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "subfinder": {
    "toolId": "subfinder",
    "toolName": "Subdomain Discovery Engine",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Sectigo",
        "product": "crt.sh Certificate Search",
        "officialUrl": "https://crt.sh/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "masscan": {
    "toolId": "masscan",
    "toolName": "Masscan Parallel Port Prober",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Robert Graham (GitHub)",
        "product": "Masscan Official Engine",
        "officialUrl": "https://github.com/robertdavidgraham/masscan",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Target IP",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "shodan-query": {
    "toolId": "shodan-query",
    "toolName": "Shodan Node & Intelligence Search",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Shodan",
        "product": "Shodan Search Engine",
        "officialUrl": "https://www.shodan.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "IP / Query",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "censys-search": {
    "toolId": "censys-search",
    "toolName": "Censys Host & Certificate Explorer",
    "category": "Reconnaissance",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Censys Inc.",
        "product": "Censys Search",
        "officialUrl": "https://search.censys.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "IP / Query",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "dnsx": {
    "toolId": "dnsx",
    "toolName": "Dnsx Multi-Record Resolver",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google",
        "product": "Google Public DNS Web Resolver",
        "officialUrl": "https://dns.google/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "traceroute": {
    "toolId": "traceroute",
    "toolName": "Traceroute Visualizer",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "jsDelivr / Hivelocity",
        "product": "Globalping Network Prober",
        "officialUrl": "https://globalping.io/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "Public IP",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "bgp-route-audit": {
    "toolId": "bgp-route-audit",
    "toolName": "BGP Routing & RPKI Validator",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Hurricane Electric",
        "product": "BGP Toolkit",
        "officialUrl": "https://bgp.he.net/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "ASN / IP",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "dnssec-audit": {
    "toolId": "dnssec-audit",
    "toolName": "DNSSEC Key Validator",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Verisign / DNSViz",
        "product": "DNSViz DNSSEC Visualizer",
        "officialUrl": "https://dnsviz.net/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "ipv6-checker": {
    "toolId": "ipv6-checker",
    "toolName": "IPv6 Address Validator",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Jason Fesler",
        "product": "Test-IPv6",
        "officialUrl": "https://test-ipv6.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mac-lookup": {
    "toolId": "mac-lookup",
    "toolName": "MAC OUI Parser",
    "category": "DNS & Network Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Wireshark Foundation",
        "product": "Wireshark OUI Lookup",
        "officialUrl": "https://www.wireshark.org/tools/oui-lookup.html",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "MAC Address",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "tech_detection": {
    "toolId": "tech_detection",
    "toolName": "Technology Detection",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Wappalyzer",
        "product": "Wappalyzer Technology Profiler",
        "officialUrl": "https://www.wappalyzer.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Extension",
        "dataExposure": "Target URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "http": {
    "toolId": "http",
    "toolName": "HTTP Header Auditor",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Probely",
        "product": "Security Headers Scanner",
        "officialUrl": "https://securityheaders.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Target URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "ssl": {
    "toolId": "ssl",
    "toolName": "SSL/TLS Certificate Audit",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Qualys SSL Labs",
        "product": "SSL Server Test",
        "officialUrl": "https://www.ssllabs.com/ssltest/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "whatweb": {
    "toolId": "whatweb",
    "toolName": "WhatWeb Technology Scanner",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "BuiltWith Pty Ltd",
        "product": "BuiltWith Technology Lookup",
        "officialUrl": "https://builtwith.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "dirsearch": {
    "toolId": "dirsearch",
    "toolName": "Dirsearch Path Prober",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Ben Allen (GitHub)",
        "product": "Feroxbuster Fast Content Discovery",
        "officialUrl": "https://github.com/epi052/feroxbuster",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Target URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "wpscan": {
    "toolId": "wpscan",
    "toolName": "WPScan WordPress Auditor",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Automattic / WPScan",
        "product": "WPScan WordPress Vulnerability Database",
        "officialUrl": "https://wpscan.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "Target URL",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "cors-scanner": {
    "toolId": "cors-scanner",
    "toolName": "CORS Configuration Auditor",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Monsur Hossain (GitHub)",
        "product": "Test CORS Online",
        "officialUrl": "https://test-cors.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Target URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "csp-evaluator": {
    "toolId": "csp-evaluator",
    "toolName": "CSP Policy Evaluator",
    "category": "Web Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google",
        "product": "CSP Evaluator",
        "officialUrl": "https://csp-evaluator.withgoogle.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "CSP Text",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "cve-lookup": {
    "toolId": "cve-lookup",
    "toolName": "CVE Vulnerability Inspector",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "NIST",
        "product": "National Vulnerability Database (NVD)",
        "officialUrl": "https://nvd.nist.gov/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "CVE ID",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "nikto": {
    "toolId": "nikto",
    "toolName": "Nikto Web Vulnerability Scanner",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "CIRT.net / Sullo",
        "product": "Nikto Web Server Scanner",
        "officialUrl": "https://cirt.net/Nikto2",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Target URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "sqlmap": {
    "toolId": "sqlmap",
    "toolName": "SQLmap Injection & Database Auditor",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Bernardo Damele (GitHub)",
        "product": "SQLmap Official Project",
        "officialUrl": "https://sqlmap.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Target URL",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "trivy": {
    "toolId": "trivy",
    "toolName": "Trivy Container & Lockfile Auditor",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Aqua Security",
        "product": "Trivy Vulnerability Scanner",
        "officialUrl": "https://trivy.dev/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Code / Image",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "zap": {
    "toolId": "zap",
    "toolName": "OWASP ZAP Dynamic Web App Scanner",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Checkmarx / OWASP",
        "product": "OWASP ZAP Official Project",
        "officialUrl": "https://www.zaproxy.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI/GUI",
        "dataExposure": "Target URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "burp": {
    "toolId": "burp",
    "toolName": "Burp Suite Enterprise DAST",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "PortSwigger Ltd.",
        "product": "Burp Suite Community & Pro",
        "officialUrl": "https://portswigger.net/burp",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI/GUI",
        "dataExposure": "Target URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "nuclei": {
    "toolId": "nuclei",
    "toolName": "Nuclei Template-Based Scanner",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ProjectDiscovery",
        "product": "Nuclei Scanner",
        "officialUrl": "https://projectdiscovery.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Target URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "openvas": {
    "toolId": "openvas",
    "toolName": "OpenVAS Network Vulnerability Engine",
    "category": "Vulnerability Assessment",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Greenbone Networks",
        "product": "OpenVAS Network Vulnerability Scanner",
        "officialUrl": "https://www.openvas.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "Target IP",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "url": {
    "toolId": "url",
    "toolName": "URL Threat Intelligence",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "urlscan.io GmbH",
        "product": "urlscan.io Sandbox & Scanner",
        "officialUrl": "https://urlscan.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Target URL",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "breach": {
    "toolId": "breach",
    "toolName": "Breach Checker",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Troy Hunt",
        "product": "Have I Been Pwned",
        "officialUrl": "https://haveibeenpwned.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Email",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "alienvault-otx": {
    "toolId": "alienvault-otx",
    "toolName": "AlienVault OTX Threat Pulse Search",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "AT&T Cybersecurity",
        "product": "AlienVault Open Threat Exchange",
        "officialUrl": "https://otx.alienvault.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "Domain / IP",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "virusshare": {
    "toolId": "virusshare",
    "toolName": "VirusShare Malware Hash Searcher",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google / VirusTotal",
        "product": "VirusTotal File & Hash Search",
        "officialUrl": "https://www.virustotal.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free account",
        "dataExposure": "File Hash",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "misp-lookup": {
    "toolId": "misp-lookup",
    "toolName": "MISP Threat Sharing IOC Checker",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "CIRCL Luxembourg",
        "product": "CIRCL Hashlookup",
        "officialUrl": "https://hashlookup.circl.lu/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "Hash / IOC",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "abuseipdb": {
    "toolId": "abuseipdb",
    "toolName": "AbuseIPDB Threat Reporter",
    "category": "Threat Intelligence",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "AbuseIPDB LLC",
        "product": "AbuseIPDB IP Checker",
        "officialUrl": "https://www.abuseipdb.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Public IP",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "harvester": {
    "toolId": "harvester",
    "toolName": "TheHarvester Intelligence Gatherer",
    "category": "OSINT",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Christian Martorella",
        "product": "theHarvester Project",
        "officialUrl": "https://github.com/laramies/theHarvester",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Domain",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "sherlock": {
    "toolId": "sherlock",
    "toolName": "Sherlock Social Profiler",
    "category": "OSINT",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Micah Hoffman / OSINT Combine",
        "product": "WhatsMyName.app",
        "officialUrl": "https://whatsmyname.app/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Username",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "hunter-io": {
    "toolId": "hunter-io",
    "toolName": "Hunter Domain Email Pattern Search",
    "category": "OSINT",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Hunter.io",
        "product": "Hunter.io Domain Search",
        "officialUrl": "https://hunter.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "intelx": {
    "toolId": "intelx",
    "toolName": "Intelligence X Archive Explorer",
    "category": "OSINT",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Intelligence X",
        "product": "Intelligence X Search Engine",
        "officialUrl": "https://intelx.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "Search String",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "prowler": {
    "toolId": "prowler",
    "toolName": "Prowler AWS CIS Benchmark Auditor",
    "category": "Cloud Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Prowler Cloud Inc.",
        "product": "Prowler Cloud Security",
        "officialUrl": "https://prowler.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Cloud Config",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "scoutsuite": {
    "toolId": "scoutsuite",
    "toolName": "Scout Suite Multi-Cloud Auditor",
    "category": "Cloud Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "NCC Group (GitHub)",
        "product": "Scout Suite Multi-Cloud Audit",
        "officialUrl": "https://github.com/nccgroup/ScoutSuite",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Cloud Config",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "bucket-finder": {
    "toolId": "bucket-finder",
    "toolName": "Cloud Storage Bucket Finder",
    "category": "Cloud Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "GrayhatWarfare",
        "product": "GrayhatWarfare Public Bucket Search",
        "officialUrl": "https://grayhatwarfare.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free account",
        "dataExposure": "Keyword",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "iam-policy-audit": {
    "toolId": "iam-policy-audit",
    "toolName": "IAM Policy Security Linter",
    "category": "Cloud Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Salesforce (GitHub)",
        "product": "Policy Sentry IAM Generator & Linter",
        "officialUrl": "https://github.com/salesforce/policy_sentry",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "IAM JSON",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "postman-audit": {
    "toolId": "postman-audit",
    "toolName": "Postman Collection Auditor",
    "category": "API Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Postman Inc.",
        "product": "Postman API Governance & Security",
        "officialUrl": "https://www.postman.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free account",
        "dataExposure": "Collection JSON",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "jwt-strength": {
    "toolId": "jwt-strength",
    "toolName": "JWT Strength & Signature Auditor",
    "category": "API Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Auth0 / Okta",
        "product": "jwt.io Token Debugger",
        "officialUrl": "https://jwt.io/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "JWT Token",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "api-fuzzer": {
    "toolId": "api-fuzzer",
    "toolName": "API Endpoint Fuzzer & Injection Tester",
    "category": "API Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Akto Inc.",
        "product": "Akto API Security Platform",
        "officialUrl": "https://www.akto.io/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free tier",
        "dataExposure": "API URL",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "oas-linter": {
    "toolId": "oas-linter",
    "toolName": "OpenAPI / Swagger Spec Linter",
    "category": "API Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Stoplight",
        "product": "Spectral API Linter",
        "officialUrl": "https://stoplight.io/open-source/spectral",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "OpenAPI YAML",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "hydra": {
    "toolId": "hydra",
    "toolName": "Hydra Protocol Authentication Auditor",
    "category": "Authentication & Identity",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "van Hauser / The Hacker's Choice",
        "product": "THC-Hydra Official Engine",
        "officialUrl": "https://github.com/vanhauser-thc/thc-hydra",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Host/User/Pass",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "ldap-audit": {
    "toolId": "ldap-audit",
    "toolName": "LDAP Policy Auditor",
    "category": "Authentication & Identity",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Vincent LE TOUX",
        "product": "PingCastle Active Directory Auditor",
        "officialUrl": "https://www.pingcastle.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Tool",
        "dataExposure": "AD Domain",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "saml-decoder": {
    "toolId": "saml-decoder",
    "toolName": "SAML Assertion Decoder",
    "category": "Authentication & Identity",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "OneLogin / SAMLTool",
        "product": "SAMLTool Online Decoder",
        "officialUrl": "https://www.samltool.com/decode.php",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "SAML XML",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "oauth-validator": {
    "toolId": "oauth-validator",
    "toolName": "OAuth Route Validator",
    "category": "Authentication & Identity",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Aaron Parecki / OAuth.net",
        "product": "OAuth.net Playground & Guides",
        "officialUrl": "https://oauth.net/",
        "capabilityMatch": "STRONG",
        "accessModel": "Public/no login",
        "dataExposure": "OAuth URL",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mobsf-apk": {
    "toolId": "mobsf-apk",
    "toolName": "MobSF Android Manifest Analyzer",
    "category": "Mobile Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MobSF Team",
        "product": "Mobile Security Framework (MobSF)",
        "officialUrl": "https://mobsf.github.io/Mobile-Security-Framework-MobSF/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "APK Binary",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "ipa-signer-check": {
    "toolId": "ipa-signer-check",
    "toolName": "iOS IPA & Entitlements Validator",
    "category": "Mobile Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MobSF Team",
        "product": "MobSF Mobile Security Framework",
        "officialUrl": "https://mobsf.github.io/Mobile-Security-Framework-MobSF/",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Server",
        "dataExposure": "IPA Binary",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "apk-leak-finder": {
    "toolId": "apk-leak-finder",
    "toolName": "APK Credentials & Secrets Extractor",
    "category": "Mobile Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Truffle Security",
        "product": "TruffleHog Secrets Scanner",
        "officialUrl": "https://trufflesecurity.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Code / APK",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "androguard": {
    "toolId": "androguard",
    "toolName": "Androguard Dalvik Bytecode Disassembler",
    "category": "Mobile Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Anthony Desnos (GitHub)",
        "product": "Androguard Framework",
        "officialUrl": "https://github.com/androguard/androguard",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Dalvik Dex",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "kube-bench": {
    "toolId": "kube-bench",
    "toolName": "Kube-Bench CIS Benchmark Auditor",
    "category": "Container & Kubernetes",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Aqua Security",
        "product": "Kube-Bench Benchmark Tool",
        "officialUrl": "https://github.com/aquasecurity/kube-bench",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "K8s Config",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "kubesec": {
    "toolId": "kubesec",
    "toolName": "Kubesec Manifest Linter",
    "category": "Container & Kubernetes",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Kubesec.io",
        "product": "Kubesec.io Web & API Scanner",
        "officialUrl": "https://kubesec.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "K8s YAML",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "docker-bench": {
    "toolId": "docker-bench",
    "toolName": "Docker CIS Benchmark Auditor",
    "category": "Container & Kubernetes",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Docker Inc.",
        "product": "Docker Bench for Security",
        "officialUrl": "https://github.com/docker/docker-bench-security",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Host Docker",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "falco-logs": {
    "toolId": "falco-logs",
    "toolName": "Falco Container Syscall Inspector",
    "category": "Container & Kubernetes",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Cloud Native Computing Foundation",
        "product": "Falco Cloud Native Runtime Security",
        "officialUrl": "https://falco.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Engine",
        "dataExposure": "Syscall Logs",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "semgrep": {
    "toolId": "semgrep",
    "toolName": "Semgrep SAST Code Auditor",
    "category": "DevSecOps / Supply Chain",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Semgrep Inc.",
        "product": "Semgrep Community & Cloud SAST",
        "officialUrl": "https://semgrep.dev/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free tier",
        "dataExposure": "Source Code",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "gitleaks": {
    "toolId": "gitleaks",
    "toolName": "Gitleaks Secrets Scanner",
    "category": "DevSecOps / Supply Chain",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Zachary Rice (Gitleaks)",
        "product": "Gitleaks Secrets Scanner",
        "officialUrl": "https://gitleaks.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Git Repo / Code",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "dependency-track": {
    "toolId": "dependency-track",
    "toolName": "Dependency-Track SBOM Auditor",
    "category": "DevSecOps / Supply Chain",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "OWASP Foundation",
        "product": "OWASP Dependency-Track",
        "officialUrl": "https://dependencytrack.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "SBOM CycloneDX",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "snyk-test": {
    "toolId": "snyk-test",
    "toolName": "Snyk Dependency & CVE Checker",
    "category": "DevSecOps / Supply Chain",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Snyk Ltd.",
        "product": "Snyk Open Source Vulnerability Database",
        "officialUrl": "https://snyk.io/vuln/",
        "capabilityMatch": "EXACT",
        "accessModel": "Free account",
        "dataExposure": "Package Name",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "yara-rules": {
    "toolId": "yara-rules",
    "toolName": "YARA Signature Matcher",
    "category": "Malware Analysis",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "VirusTotal",
        "product": "YARA Pattern Matching Engine",
        "officialUrl": "https://virustotal.github.io/yara/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "File / Rule",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "peframe": {
    "toolId": "peframe",
    "toolName": "PE Binary Header & Packer Analyzer",
    "category": "Malware Analysis",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "hasherezade (GitHub)",
        "product": "PE-bear Reversing Tool",
        "officialUrl": "https://github.com/hasherezade/pe-bear",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted GUI",
        "dataExposure": "PE Binary",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "cuckoo-sandbox": {
    "toolId": "cuckoo-sandbox",
    "toolName": "Cuckoo Dynamic Sandbox Detonator",
    "category": "Malware Analysis",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ANY.RUN LLC",
        "product": "ANY.RUN Interactive Malware Sandbox",
        "officialUrl": "https://any.run/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free tier",
        "dataExposure": "Executable/Doc",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "pdfid": {
    "toolId": "pdfid",
    "toolName": "PDF Security & Malware Inspector",
    "category": "Malware Analysis",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Didier Stevens",
        "product": "Didier Stevens PDF Tools",
        "officialUrl": "https://blog.didierstevens.com/programs/pdf-tools/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "PDF File",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "autopsy": {
    "toolId": "autopsy",
    "toolName": "Autopsy Digital Forensics & File Carving",
    "category": "Digital Forensics",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Basis Technology",
        "product": "Autopsy Digital Forensics Platform",
        "officialUrl": "https://www.autopsy.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted GUI",
        "dataExposure": "Disk Image",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "volatility": {
    "toolId": "volatility",
    "toolName": "Volatility Memory Analysis",
    "category": "Digital Forensics",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Volatility Foundation",
        "product": "Volatility Memory Forensics Framework",
        "officialUrl": "https://www.volatilityfoundation.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "RAM Dump",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "sleuthkit": {
    "toolId": "sleuthkit",
    "toolName": "The Sleuth Kit (TSK)",
    "category": "Digital Forensics",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Brian Carrier",
        "product": "The Sleuth Kit",
        "officialUrl": "https://www.sleuthkit.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Raw Image",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "plaso": {
    "toolId": "plaso",
    "toolName": "Plaso Super-Timeline Engine",
    "category": "Digital Forensics",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google (GitHub)",
        "product": "Plaso (log2timeline) Engine",
        "officialUrl": "https://github.com/log2timeline/plaso",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Forensic Dump",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "ghidra": {
    "toolId": "ghidra",
    "toolName": "Ghidra Headless Decompiler",
    "category": "Binary / Reverse Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "National Security Agency (NSA)",
        "product": "Ghidra Software Reverse Engineering",
        "officialUrl": "https://ghidra-sre.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted GUI/CLI",
        "dataExposure": "Binary File",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "radare2": {
    "toolId": "radare2",
    "toolName": "Radare2 Analysis & Shellcode Inspector",
    "category": "Binary / Reverse Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "The Radare Project",
        "product": "Radare2 Forensic Shell",
        "officialUrl": "https://rada.re/n/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Binary / Hex",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "binwalk": {
    "toolId": "binwalk",
    "toolName": "Binwalk Firmware Analyzer",
    "category": "Binary / Reverse Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ReFirm Labs (GitHub)",
        "product": "Binwalk Firmware Analysis Tool",
        "officialUrl": "https://github.com/ReFirmLabs/binwalk",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Firmware ROM",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "capstone": {
    "toolId": "capstone",
    "toolName": "Capstone Opcode Disassembler",
    "category": "Binary / Reverse Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Nguyen Anh Quynh",
        "product": "Capstone Disassembly Framework",
        "officialUrl": "https://www.capstone-engine.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Lib",
        "dataExposure": "Hex Opcodes",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "aircrack-ng": {
    "toolId": "aircrack-ng",
    "toolName": "Aircrack-ng Interface",
    "category": "Wireless Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Aircrack-ng Team",
        "product": "Aircrack-ng Wireless Security Suite",
        "officialUrl": "https://www.aircrack-ng.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "PCAP capture",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "kismet": {
    "toolId": "kismet",
    "toolName": "Kismet Wireless Survey Parser",
    "category": "Wireless Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Mike Kershaw (Dragorn)",
        "product": "Kismet Wireless Network Detector",
        "officialUrl": "https://www.kismetwireless.net/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "RF Logs",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "wifite": {
    "toolId": "wifite",
    "toolName": "Wifite Wireless Security Auditor",
    "category": "Wireless Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "derv82 (GitHub)",
        "product": "Wifite2 Automated Wireless Auditor",
        "officialUrl": "https://github.com/derv82/wifite2",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "RF Interface",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "bt-scanner": {
    "toolId": "bt-scanner",
    "toolName": "Bluetooth Low Energy (BLE) Scanner",
    "category": "Wireless Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Simone Margaritelli",
        "product": "Bettercap Swiss Army Knife",
        "officialUrl": "https://www.bettercap.org/",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "BLE Packets",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mail-spoof-checker": {
    "toolId": "mail-spoof-checker",
    "toolName": "Email Spoofing & DMARC Auditor",
    "category": "Email Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "DMARCly",
        "product": "DMARCly Domain Checker",
        "officialUrl": "https://dmarcly.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mxtoolbox-check": {
    "toolId": "mxtoolbox-check",
    "toolName": "MX Blacklist & RBL Auditor",
    "category": "Email Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MXToolBox Inc.",
        "product": "MXToolbox Blacklists Check",
        "officialUrl": "https://mxtoolbox.com/blacklists.aspx",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Mail Server IP",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "phishmeister": {
    "toolId": "phishmeister",
    "toolName": "Email Header & Hop Route Analyzer",
    "category": "Email Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google",
        "product": "Google Admin Toolbox Messageheader",
        "officialUrl": "https://toolbox.googleapps.com/apps/messageheader/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Email Headers",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "phishing": {
    "toolId": "phishing",
    "toolName": "Phishing Detector",
    "category": "Social Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Cisco Talos / PhishTank",
        "product": "PhishTank Community Database",
        "officialUrl": "https://phishtank.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Suspect URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "gophish": {
    "toolId": "gophish",
    "toolName": "GoPhish Phishing Simulation Tracker",
    "category": "Social Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Jordan Wright",
        "product": "Gophish Open-Source Phishing Framework",
        "officialUrl": "https://getgophish.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "Campaign Data",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "domain-twist": {
    "toolId": "domain-twist",
    "toolName": "Domain Typosquatting Searcher",
    "category": "Social Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Marcin Ulikowski (GitHub)",
        "product": "dnstwist Permutation Engine",
        "officialUrl": "https://github.com/elceef/dnstwist",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Domain",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "evilginx-audit": {
    "toolId": "evilginx-audit",
    "toolName": "Evilginx Reverse-Proxy MFA Auditor",
    "category": "Social Engineering",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Kuba Gretzky (Breakdev)",
        "product": "Evilginx Man-in-the-Middle Framework",
        "officialUrl": "https://breakdev.org/evilginx-advanced-phishing/",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Tool",
        "dataExposure": "Auth URL",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "prompt-guard": {
    "toolId": "prompt-guard",
    "toolName": "Prompt Injection & Jailbreak Guard",
    "category": "AI / LLM Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "NVIDIA",
        "product": "NeMo Guardrails Framework",
        "officialUrl": "https://github.com/NVIDIA/NeMo-Guardrails",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Python",
        "dataExposure": "Prompt Text",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "garak": {
    "toolId": "garak",
    "toolName": "Garak LLM Vulnerability Scanner",
    "category": "AI / LLM Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Leon Derczynski (GitHub)",
        "product": "Garak LLM Vulnerability Scanner",
        "officialUrl": "https://github.com/leondz/garak",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted CLI",
        "dataExposure": "Model / Prompts",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "llm-redteam": {
    "toolId": "llm-redteam",
    "toolName": "AI Red-Teaming & Alignment CLI",
    "category": "AI / LLM Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Microsoft",
        "product": "PyRIT (Python Risk Identification Toolkit)",
        "officialUrl": "https://github.com/Azure/PyRIT",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Python",
        "dataExposure": "Model Endpoint",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "prompt-fuzzer": {
    "toolId": "prompt-fuzzer",
    "toolName": "LLM System Prompt Boundary Fuzzer",
    "category": "AI / LLM Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Confident AI (GitHub)",
        "product": "DeepEval LLM Evaluation Framework",
        "officialUrl": "https://github.com/confident-ai/deepeval",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Python",
        "dataExposure": "Model / Prompts",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "gdpr-cookie-audit": {
    "toolId": "gdpr-cookie-audit",
    "toolName": "GDPR Cookie & Consent Auditor",
    "category": "Privacy & Data Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Usercentrics",
        "product": "Cookiebot Consent Scanner",
        "officialUrl": "https://www.cookiebot.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Free tier",
        "dataExposure": "Website URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "exif-stripper": {
    "toolId": "exif-stripper",
    "toolName": "Image EXIF & Geolocation Inspector",
    "category": "Privacy & Data Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Jimpl",
        "product": "Jimpl Online Exif Viewer",
        "officialUrl": "https://jimpl.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Image Metadata",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "pii-scanner": {
    "toolId": "pii-scanner",
    "toolName": "Sensitive PII & Compliance Scanner",
    "category": "Privacy & Data Security",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Microsoft",
        "product": "Presidio Data Protection Engine",
        "officialUrl": "https://microsoft.github.io/presidio/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "Text Data",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "remediation": {
    "toolId": "remediation",
    "toolName": "AI Remediation Planner",
    "category": "Incident Response",
    "hasAlternative": false,
    "alternatives": [],
    "rationale": "NO SUITABLE VERIFIED ALTERNATIVE"
  },
  "thehive": {
    "toolId": "thehive",
    "toolName": "TheHive Incident Case Manager",
    "category": "Incident Response",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "StrangeBee",
        "product": "TheHive Incident Response Platform",
        "officialUrl": "https://strangebee.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted / Cloud",
        "dataExposure": "Case Dossier",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "misp-feed": {
    "toolId": "misp-feed",
    "toolName": "MISP Threat Feed Publisher",
    "category": "Incident Response",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MISP Project",
        "product": "MISP Core Project",
        "officialUrl": "https://www.misp-project.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "Threat Event",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "playbook-runner": {
    "toolId": "playbook-runner",
    "toolName": "SOC Playbook Orchestrator",
    "category": "Incident Response",
    "hasAlternative": false,
    "alternatives": [],
    "rationale": "NO SUITABLE VERIFIED ALTERNATIVE"
  },
  "wazuh-agent-audit": {
    "toolId": "wazuh-agent-audit",
    "toolName": "Wazuh SIEM Agent Auditor",
    "category": "Security Monitoring",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Wazuh Inc.",
        "product": "Wazuh Open Source SIEM & XDR",
        "officialUrl": "https://wazuh.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "SIEM Events",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "zeek-logs": {
    "toolId": "zeek-logs",
    "toolName": "Zeek Network Transaction Parser",
    "category": "Security Monitoring",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Zeek Project",
        "product": "Zeek Network Security Monitor",
        "officialUrl": "https://zeek.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Self-hosted Server",
        "dataExposure": "PCAP / Logs",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "auditd-viewer": {
    "toolId": "auditd-viewer",
    "toolName": "Linux Auditd Syscall Tracer",
    "category": "Security Monitoring",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Elastic N.V.",
        "product": "Auditbeat Syscall Collector",
        "officialUrl": "https://www.elastic.co/beats/auditbeat",
        "capabilityMatch": "STRONG",
        "accessModel": "Self-hosted Agent",
        "dataExposure": "Syscall Logs",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "cis-cat": {
    "toolId": "cis-cat",
    "toolName": "CIS-CAT Host Baseline Auditor",
    "category": "Compliance / Security Posture",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Center for Internet Security",
        "product": "CIS-CAT Pro Benchmark Tool",
        "officialUrl": "https://www.cisecurity.org/cybersecurity-tools/cis-cat-pro",
        "capabilityMatch": "EXACT",
        "accessModel": "Paid / Member",
        "dataExposure": "Host Config",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "soc2-checklist": {
    "toolId": "soc2-checklist",
    "toolName": "SOC 2 Trust Services Posture Evaluator",
    "category": "Compliance / Security Posture",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Vanta Inc.",
        "product": "Vanta Trust Management Platform",
        "officialUrl": "https://www.vanta.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Paid SaaS",
        "dataExposure": "Compliance Gaps",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "hipaa-auditor": {
    "toolId": "hipaa-auditor",
    "toolName": "HIPAA ePHI Security Rule Auditor",
    "category": "Compliance / Security Posture",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Accountable HQ Inc.",
        "product": "Accountable HIPAA Compliance Platform",
        "officialUrl": "https://www.accountablehq.com/",
        "capabilityMatch": "STRONG",
        "accessModel": "Paid SaaS",
        "dataExposure": "ePHI Safeguards",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "jwt-parser": {
    "toolId": "jwt-parser",
    "toolName": "JWT Security Decoder",
    "category": "Utilities / Cryptography",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Auth0 / Okta",
        "product": "jwt.io Token Debugger",
        "officialUrl": "https://jwt.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "JWT Token",
        "privacyRisk": "CRITICAL",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE WITH WARNING"
      }
    ]
  },
  "base64-decoder": {
    "toolId": "base64-decoder",
    "toolName": "Base64 Converter",
    "category": "Utilities / Cryptography",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "GCHQ",
        "product": "CyberChef Swiss Army Knife",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Text Payload",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "url-sanitizer": {
    "toolId": "url-sanitizer",
    "toolName": "URL Sanitizer",
    "category": "Utilities / Cryptography",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "GCHQ",
        "product": "CyberChef URL Parse Operation",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Target URL",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "sms": {
    "toolId": "sms",
    "toolName": "SMS Analyzer",
    "category": "Utilities / Cryptography",
    "hasAlternative": false,
    "alternatives": [],
    "rationale": "NO SUITABLE VERIFIED ALTERNATIVE"
  },
  "upi": {
    "toolId": "upi",
    "toolName": "UPI Verifier",
    "category": "Utilities / Cryptography",
    "hasAlternative": false,
    "alternatives": [],
    "rationale": "NO SUITABLE VERIFIED ALTERNATIVE"
  },
  "hash-generator": {
    "toolId": "hash-generator",
    "toolName": "Cryptographic Hash Generator",
    "category": "Utilities / Cryptography",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "GCHQ",
        "product": "CyberChef Hashing Suite",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Text String",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "hex-editor": {
    "toolId": "hex-editor",
    "toolName": "Dossier Hex & Binary Frame Inspector",
    "category": "Utilities / Cryptography",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Jens Duttke",
        "product": "HexEd.it Online Hex Editor",
        "officialUrl": "https://hexed.it/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public/no login",
        "dataExposure": "Binary / Text",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-16",
        "recommendation": "INCLUDE"
      }
    ]
  }
};

/**
 * Retrieves the verified alternative providers for a canonical tool.
 * @param {string} toolId - Canonical tool ID
 * @returns {Array<Object>} Array of verified alternative provider objects, or [] if none
 */
export function getAlternativesForTool(toolId) {
  if (!toolId || typeof toolId !== 'string') return [];
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return entry && Array.isArray(entry.alternatives) ? entry.alternatives : [];
}

/**
 * Checks whether a tool has verified external alternatives.
 * @param {string} toolId - Canonical tool ID
 * @returns {boolean} True if verified external alternatives exist
 */
export function hasAlternatives(toolId) {
  if (!toolId || typeof toolId !== 'string') return false;
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return Boolean(entry && entry.hasAlternative && entry.alternatives && entry.alternatives.length > 0);
}

/**
 * Returns the tool's alternatives metadata entry including rationale for unmapped tools.
 * @param {string} toolId - Canonical tool ID
 * @returns {Object|null}
 */
export function getToolAlternativesEntry(toolId) {
  if (!toolId || typeof toolId !== 'string') return null;
  return EXTERNAL_ALTERNATIVES[toolId] || null;
}

export default EXTERNAL_ALTERNATIVES;
