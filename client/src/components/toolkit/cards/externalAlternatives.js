/**
 * 🌐 EXTERNAL ALTERNATIVES REGISTRY — CyberShield X (v62.5.3)
 *
 * MANDATORY 111-TOOL EXTERNAL WEBSITE POLICY ENFORCEMENT:
 *
 * 1. Exactly 111 canonical tools across 24 categories.
 * 2. Every tool has exactly one status: "ONLINE" or "COMING_SOON".
 * 3. ONLINE: Only genuine, verified browser-based security services accessible
 *    in a standard web browser for security workflows.
 * 4. COMING_SOON: Tools where no genuine browser service exists (CLI, desktop,
 *    self-hosted daemons, or proprietary native engines).
 * 5. GITHUB POLICY: GitHub repositories are stored strictly in `officialRepository`
 *    and NEVER in `externalWebsite`.
 * 6. ZERO fake/random substitutes.
 * 7. Native first-party CyberShield X capabilities remain 100% functional.
 */

export const EXTERNAL_ALTERNATIVES = {
  "dns": {
    "toolId": "dns",
    "status": "ONLINE",
    "externalWebsite": "https://mxtoolbox.com/SuperTool.aspx",
    "officialRepository": null,
    "serviceName": "MXToolbox SuperTool DNS Lookup",
    "rationale": "Verified interactive browser-based DNS lookup utility.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MXToolbox",
        "product": "MXToolbox SuperTool DNS Lookup",
        "officialUrl": "https://mxtoolbox.com/SuperTool.aspx",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "whois": {
    "toolId": "whois",
    "status": "ONLINE",
    "externalWebsite": "https://lookup.icann.org/",
    "officialRepository": null,
    "serviceName": "ICANN Registration Data Lookup",
    "rationale": "Authoritative browser-based WHOIS and RDAP domain registration lookup.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ICANN",
        "product": "ICANN Registration Data Lookup",
        "officialUrl": "https://lookup.icann.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "port": {
    "toolId": "port",
    "status": "ONLINE",
    "externalWebsite": "https://hackertarget.com/tcp-port-scan/",
    "officialRepository": null,
    "serviceName": "HackerTarget Online Port Scan",
    "rationale": "Verified interactive browser-based TCP port scanner.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "HackerTarget",
        "product": "HackerTarget Online Port Scan",
        "officialUrl": "https://hackertarget.com/tcp-port-scan/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "service_fingerprint": {
    "toolId": "service_fingerprint",
    "status": "ONLINE",
    "externalWebsite": "https://www.shodan.io/",
    "officialRepository": null,
    "serviceName": "Shodan Host Search",
    "rationale": "Verified web search engine for internet-connected devices and service banners.",
    "accessModel": "Public / Free search",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Shodan",
        "product": "Shodan Host Search",
        "officialUrl": "https://www.shodan.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free search",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "subfinder": {
    "toolId": "subfinder",
    "status": "ONLINE",
    "externalWebsite": "https://crt.sh/",
    "officialRepository": "https://github.com/projectdiscovery/subfinder",
    "serviceName": "crt.sh Certificate Search",
    "rationale": "Authoritative browser-based Certificate Transparency log search for subdomain enumeration.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "crt.sh",
        "product": "crt.sh Certificate Search",
        "officialUrl": "https://crt.sh/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "masscan": {
    "toolId": "masscan",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/robertdavidgraham/masscan",
    "serviceName": null,
    "rationale": "High-speed C CLI port scanner; requires raw socket privilege. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "shodan-query": {
    "toolId": "shodan-query",
    "status": "ONLINE",
    "externalWebsite": "https://www.shodan.io/",
    "officialRepository": null,
    "serviceName": "Shodan Search Engine",
    "rationale": "Web search engine for querying internet-facing assets and security exposures.",
    "accessModel": "Public / Free search",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Shodan",
        "product": "Shodan Search Engine",
        "officialUrl": "https://www.shodan.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free search",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "censys-search": {
    "toolId": "censys-search",
    "status": "ONLINE",
    "externalWebsite": "https://search.censys.io/",
    "officialRepository": null,
    "serviceName": "Censys Search",
    "rationale": "Web platform for searching global internet infrastructure and certificate deployments.",
    "accessModel": "Public / Free search",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Censys",
        "product": "Censys Search",
        "officialUrl": "https://search.censys.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free search",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "dnsx": {
    "toolId": "dnsx",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/projectdiscovery/dnsx",
    "serviceName": null,
    "rationale": "Go CLI multi-purpose DNS toolkit by ProjectDiscovery. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "traceroute": {
    "toolId": "traceroute",
    "status": "ONLINE",
    "externalWebsite": "https://globalping.io/",
    "officialRepository": "https://github.com/jsdelivr/globalping",
    "serviceName": "Globalping Network Prober",
    "rationale": "Interactive browser-based global traceroute and network latency measurement.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Globalping",
        "product": "Globalping Network Prober",
        "officialUrl": "https://globalping.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "bgp-route-audit": {
    "toolId": "bgp-route-audit",
    "status": "ONLINE",
    "externalWebsite": "https://bgp.he.net/",
    "officialRepository": null,
    "serviceName": "Hurricane Electric BGP Toolkit",
    "rationale": "Authoritative web routing and ASN prefix inspection toolkit.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Hurricane",
        "product": "Hurricane Electric BGP Toolkit",
        "officialUrl": "https://bgp.he.net/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "dnssec-audit": {
    "toolId": "dnssec-audit",
    "status": "ONLINE",
    "externalWebsite": "https://dnsviz.net/",
    "officialRepository": null,
    "serviceName": "DNSViz DNSSEC Visualizer",
    "rationale": "Interactive browser-based DNSSEC validation chain and trust tree analyzer.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "DNSViz",
        "product": "DNSViz DNSSEC Visualizer",
        "officialUrl": "https://dnsviz.net/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "ipv6-checker": {
    "toolId": "ipv6-checker",
    "status": "ONLINE",
    "externalWebsite": "https://test-ipv6.com/",
    "officialRepository": null,
    "serviceName": "Test-IPv6",
    "rationale": "Interactive browser-based IPv6 dual-stack connectivity and DNS validation.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Test-IPv6",
        "product": "Test-IPv6",
        "officialUrl": "https://test-ipv6.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mac-lookup": {
    "toolId": "mac-lookup",
    "status": "ONLINE",
    "externalWebsite": "https://www.wireshark.org/tools/oui-lookup.html",
    "officialRepository": null,
    "serviceName": "Wireshark OUI Lookup",
    "rationale": "Authoritative web-based IEEE OUI and MAC manufacturer resolution.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Wireshark",
        "product": "Wireshark OUI Lookup",
        "officialUrl": "https://www.wireshark.org/tools/oui-lookup.html",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "tech_detection": {
    "toolId": "tech_detection",
    "status": "ONLINE",
    "externalWebsite": "https://builtwith.com/",
    "officialRepository": null,
    "serviceName": "BuiltWith Technology Lookup",
    "rationale": "Interactive web profiler for web application framework and technology detection.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "BuiltWith",
        "product": "BuiltWith Technology Lookup",
        "officialUrl": "https://builtwith.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "http": {
    "toolId": "http",
    "status": "ONLINE",
    "externalWebsite": "https://securityheaders.com/",
    "officialRepository": null,
    "serviceName": "Security Headers Scanner",
    "rationale": "Interactive web HTTP security headers analyzer (CSP, HSTS, X-Frame, Referrer).",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Security",
        "product": "Security Headers Scanner",
        "officialUrl": "https://securityheaders.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "ssl": {
    "toolId": "ssl",
    "status": "ONLINE",
    "externalWebsite": "https://www.ssllabs.com/ssltest/",
    "officialRepository": null,
    "serviceName": "Qualys SSL Labs Server Test",
    "rationale": "Authoritative browser-based SSL/TLS certificate and cipher suite analyzer.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Qualys",
        "product": "Qualys SSL Labs Server Test",
        "officialUrl": "https://www.ssllabs.com/ssltest/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "whatweb": {
    "toolId": "whatweb",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/urbanadventurer/WhatWeb",
    "serviceName": null,
    "rationale": "Ruby CLI web application fingerprinter. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "dirsearch": {
    "toolId": "dirsearch",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/maurosoria/dirsearch",
    "serviceName": null,
    "rationale": "Python CLI web path and directory brute-forcing engine. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "wpscan": {
    "toolId": "wpscan",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/wpscanteam/wpscan",
    "serviceName": null,
    "rationale": "Ruby CLI WordPress vulnerability scanner. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "cors-scanner": {
    "toolId": "cors-scanner",
    "status": "ONLINE",
    "externalWebsite": "https://test-cors.org/",
    "officialRepository": null,
    "serviceName": "Test CORS Online",
    "rationale": "Interactive web-based cross-origin resource sharing policy validator.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Test",
        "product": "Test CORS Online",
        "officialUrl": "https://test-cors.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "csp-evaluator": {
    "toolId": "csp-evaluator",
    "status": "ONLINE",
    "externalWebsite": "https://csp-evaluator.withgoogle.com/",
    "officialRepository": "https://github.com/google/csp-evaluator",
    "serviceName": "Google CSP Evaluator",
    "rationale": "Google interactive browser tool to evaluate Content Security Policy headers for bypasses.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google",
        "product": "Google CSP Evaluator",
        "officialUrl": "https://csp-evaluator.withgoogle.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "cve-lookup": {
    "toolId": "cve-lookup",
    "status": "ONLINE",
    "externalWebsite": "https://nvd.nist.gov/",
    "officialRepository": null,
    "serviceName": "National Vulnerability Database (NVD)",
    "rationale": "NIST official browser search portal for Common Vulnerabilities and Exposures.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "National",
        "product": "National Vulnerability Database (NVD)",
        "officialUrl": "https://nvd.nist.gov/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "nikto": {
    "toolId": "nikto",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sullo/nikto",
    "serviceName": null,
    "rationale": "Perl CLI web server vulnerability scanner. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "sqlmap": {
    "toolId": "sqlmap",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sqlmapproject/sqlmap",
    "serviceName": null,
    "rationale": "Python CLI automatic SQL injection detection and exploitation engine. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "trivy": {
    "toolId": "trivy",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/aquasecurity/trivy",
    "serviceName": null,
    "rationale": "Go CLI container, filesystem, and Git repository vulnerability scanner. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "zap": {
    "toolId": "zap",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/zaproxy/zaproxy",
    "serviceName": null,
    "rationale": "Java desktop application and web proxy by OWASP/CrashOverride. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "burp": {
    "toolId": "burp",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Java desktop web security proxy and testing suite by PortSwigger. Proprietary software; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "nuclei": {
    "toolId": "nuclei",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/projectdiscovery/nuclei",
    "serviceName": null,
    "rationale": "Go CLI fast and customizable vulnerability scanner based on simple YAML DSL. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "openvas": {
    "toolId": "openvas",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/greenbone/openvas-scanner",
    "serviceName": null,
    "rationale": "Self-hosted Linux vulnerability scanner and network audit daemon by Greenbone. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "url": {
    "toolId": "url",
    "status": "ONLINE",
    "externalWebsite": "https://urlscan.io/",
    "officialRepository": null,
    "serviceName": "urlscan.io Sandbox & Scanner",
    "rationale": "Interactive browser-based URL sandbox and behavioral analysis service.",
    "accessModel": "Public / No login required",
    "privacyRisk": "MEDIUM",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "urlscan.io",
        "product": "urlscan.io Sandbox & Scanner",
        "officialUrl": "https://urlscan.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "breach": {
    "toolId": "breach",
    "status": "ONLINE",
    "externalWebsite": "https://haveibeenpwned.com/",
    "officialRepository": null,
    "serviceName": "Have I Been Pwned",
    "rationale": "Authoritative web data breach search engine created by Troy Hunt.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Have",
        "product": "Have I Been Pwned",
        "officialUrl": "https://haveibeenpwned.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "alienvault-otx": {
    "toolId": "alienvault-otx",
    "status": "ONLINE",
    "externalWebsite": "https://otx.alienvault.com/",
    "officialRepository": null,
    "serviceName": "AlienVault Open Threat Exchange",
    "rationale": "Interactive web crowd-sourced threat intelligence platform and indicator search.",
    "accessModel": "Public / Free search",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "AlienVault",
        "product": "AlienVault Open Threat Exchange",
        "officialUrl": "https://otx.alienvault.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free search",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "virusshare": {
    "toolId": "virusshare",
    "status": "ONLINE",
    "externalWebsite": "https://www.virustotal.com/",
    "officialRepository": null,
    "serviceName": "VirusTotal File & Hash Search",
    "rationale": "Authoritative multi-engine malware and hash verification portal.",
    "accessModel": "Public / No login required",
    "privacyRisk": "MEDIUM",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "VirusTotal",
        "product": "VirusTotal File & Hash Search",
        "officialUrl": "https://www.virustotal.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "misp-lookup": {
    "toolId": "misp-lookup",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/MISP/MISP",
    "serviceName": null,
    "rationale": "Self-hosted PHP/Python Open Source Threat Intelligence and Sharing Platform. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "abuseipdb": {
    "toolId": "abuseipdb",
    "status": "ONLINE",
    "externalWebsite": "https://www.abuseipdb.com/",
    "officialRepository": null,
    "serviceName": "AbuseIPDB IP Checker",
    "rationale": "Authoritative browser database for reporting and verifying malicious IP addresses.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "AbuseIPDB",
        "product": "AbuseIPDB IP Checker",
        "officialUrl": "https://www.abuseipdb.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "harvester": {
    "toolId": "harvester",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/laramies/theHarvester",
    "serviceName": null,
    "rationale": "Python CLI OSINT gatherer for subdomains, emails, and hosts. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "sherlock": {
    "toolId": "sherlock",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sherlock-project/sherlock",
    "serviceName": null,
    "rationale": "Python CLI tool to find social media accounts by username across social networks. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "hunter-io": {
    "toolId": "hunter-io",
    "status": "ONLINE",
    "externalWebsite": "https://hunter.io/",
    "officialRepository": null,
    "serviceName": "Hunter.io Domain Search",
    "rationale": "Interactive browser search engine for verifying domain email structures and contacts.",
    "accessModel": "Public / Free tier",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Hunter.io",
        "product": "Hunter.io Domain Search",
        "officialUrl": "https://hunter.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free tier",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "intelx": {
    "toolId": "intelx",
    "status": "ONLINE",
    "externalWebsite": "https://intelx.io/",
    "officialRepository": null,
    "serviceName": "Intelligence X Search Engine",
    "rationale": "Authoritative browser search engine for public OSINT archives and leaked records.",
    "accessModel": "Public / Free search",
    "privacyRisk": "MEDIUM",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Intelligence",
        "product": "Intelligence X Search Engine",
        "officialUrl": "https://intelx.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free search",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "MEDIUM",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "prowler": {
    "toolId": "prowler",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/prowler-cloud/prowler",
    "serviceName": null,
    "rationale": "Python CLI security assessment and hardening tool for AWS, Azure, and GCP. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "scoutsuite": {
    "toolId": "scoutsuite",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/nccgroup/ScoutSuite",
    "serviceName": null,
    "rationale": "Python multi-cloud security auditing tool by NCC Group. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "bucket-finder": {
    "toolId": "bucket-finder",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sa7mon/S3Scanner",
    "serviceName": null,
    "rationale": "Python CLI tool to scan open S3 buckets and dump permissions. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "iam-policy-audit": {
    "toolId": "iam-policy-audit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/salesforce/policy_sentry",
    "serviceName": null,
    "rationale": "Python CLI IAM least-privilege policy generator and linter by Salesforce. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "postman-audit": {
    "toolId": "postman-audit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Automated API security collection auditor. Operates as a native first-party capability; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "jwt-strength": {
    "toolId": "jwt-strength",
    "status": "ONLINE",
    "externalWebsite": "https://jwt.io/",
    "officialRepository": null,
    "serviceName": "jwt.io Token Debugger",
    "rationale": "Interactive browser-based JWT signature debugger and algorithm validator.",
    "accessModel": "Public / No login required",
    "privacyRisk": "HIGH",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "jwt.io",
        "product": "jwt.io Token Debugger",
        "officialUrl": "https://jwt.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Tokens / Payloads",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "api-fuzzer": {
    "toolId": "api-fuzzer",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/akto-api-security/akto",
    "serviceName": null,
    "rationale": "Open-source automated API security testing platform. Self-hosted/CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "oas-linter": {
    "toolId": "oas-linter",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/stoplightio/spectral",
    "serviceName": null,
    "rationale": "Spectral JSON/YAML linter CLI for OpenAPI and AsyncAPI specs. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "hydra": {
    "toolId": "hydra",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/vanhauser-thc/thc-hydra",
    "serviceName": null,
    "rationale": "C network login cracker supporting numerous protocols (SSH, FTP, HTTP, etc.). No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "ldap-audit": {
    "toolId": "ldap-audit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Active Directory and LDAP security posture audit tool. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "saml-decoder": {
    "toolId": "saml-decoder",
    "status": "ONLINE",
    "externalWebsite": "https://www.samltool.com/decode.php",
    "officialRepository": null,
    "serviceName": "SAMLTool Online Decoder",
    "rationale": "Interactive browser-based SAML response and assertion decoder.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "SAMLTool",
        "product": "SAMLTool Online Decoder",
        "officialUrl": "https://www.samltool.com/decode.php",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "oauth-validator": {
    "toolId": "oauth-validator",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Automated OAuth 2.0 / OIDC flow validator. Operates as a native first-party capability; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "mobsf-apk": {
    "toolId": "mobsf-apk",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/MobSF/Mobile-Security-Framework-MobSF",
    "serviceName": null,
    "rationale": "Mobile Security Framework (MobSF) automated all-in-one mobile application test framework. Self-hosted server; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "ipa-signer-check": {
    "toolId": "ipa-signer-check",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/MobSF/Mobile-Security-Framework-MobSF",
    "serviceName": null,
    "rationale": "iOS IPA signature and entitlement verification engine. Self-hosted; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "apk-leak-finder": {
    "toolId": "apk-leak-finder",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/trufflesecurity/trufflehog",
    "serviceName": null,
    "rationale": "TruffleHog high-entropy secrets and credential detector. Go CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "androguard": {
    "toolId": "androguard",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/androguard/androguard",
    "serviceName": null,
    "rationale": "Python reverse engineering and analysis tool for Android applications. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "kube-bench": {
    "toolId": "kube-bench",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/aquasecurity/kube-bench",
    "serviceName": null,
    "rationale": "Go CLI checking whether Kubernetes is deployed securely according to CIS Kubernetes Benchmark. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "kubesec": {
    "toolId": "kubesec",
    "status": "ONLINE",
    "externalWebsite": "https://kubesec.io/",
    "officialRepository": "https://github.com/controlplaneio/kubesec",
    "serviceName": "Kubesec.io Web Scanner",
    "rationale": "Interactive web-based Kubernetes manifest security evaluator.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Kubesec.io",
        "product": "Kubesec.io Web Scanner",
        "officialUrl": "https://kubesec.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "docker-bench": {
    "toolId": "docker-bench",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/docker/docker-bench-security",
    "serviceName": null,
    "rationale": "Shell script checking for dozens of common best-practices around deploying Docker containers. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "falco-logs": {
    "toolId": "falco-logs",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/falcosecurity/falco",
    "serviceName": null,
    "rationale": "Cloud-native runtime security daemon detecting anomalous behavior. Linux daemon; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "semgrep": {
    "toolId": "semgrep",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/semgrep/semgrep",
    "serviceName": null,
    "rationale": "Fast, multi-language static analysis command-line engine. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "gitleaks": {
    "toolId": "gitleaks",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/gitleaks/gitleaks",
    "serviceName": null,
    "rationale": "Fast, light-weight Go CLI secrets scanner for Git repositories. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "dependency-track": {
    "toolId": "dependency-track",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/DependencyTrack/dependency-track",
    "serviceName": null,
    "rationale": "Intelligent Component Analysis platform for Software Bill of Materials (SBOM). Self-hosted Java server; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "snyk-test": {
    "toolId": "snyk-test",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/snyk/cli",
    "serviceName": null,
    "rationale": "Snyk developer-first security scanning CLI tool. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "yara-rules": {
    "toolId": "yara-rules",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/VirusTotal/yara",
    "serviceName": null,
    "rationale": "Pattern matching Swiss knife for malware researchers. C library / CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "peframe": {
    "toolId": "peframe",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/hasherezade/pe-bear",
    "serviceName": null,
    "rationale": "Portable Executable reversing and header inspection tool by hasherezade. Desktop GUI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "cuckoo-sandbox": {
    "toolId": "cuckoo-sandbox",
    "status": "ONLINE",
    "externalWebsite": "https://any.run/",
    "officialRepository": null,
    "serviceName": "ANY.RUN Interactive Malware Sandbox",
    "rationale": "Interactive browser-based dynamic malware detonator and behavioral analysis sandbox.",
    "accessModel": "Public / Free tier",
    "privacyRisk": "HIGH",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "ANY.RUN",
        "product": "ANY.RUN Interactive Malware Sandbox",
        "officialUrl": "https://any.run/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free tier",
        "dataExposure": "Tokens / Payloads",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "pdfid": {
    "toolId": "pdfid",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Python CLI script by Didier Stevens to inspect suspicious PDF streams and tags. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "autopsy": {
    "toolId": "autopsy",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sleuthkit/autopsy",
    "serviceName": null,
    "rationale": "Digital forensics platform and graphical interface to The Sleuth Kit. Desktop software; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "volatility": {
    "toolId": "volatility",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/volatilityfoundation/volatility3",
    "serviceName": null,
    "rationale": "Advanced memory forensics framework. Python CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "sleuthkit": {
    "toolId": "sleuthkit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/sleuthkit/sleuthkit",
    "serviceName": null,
    "rationale": "Collection of command line tools for investigating disk images. C library / CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "plaso": {
    "toolId": "plaso",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/log2timeline/plaso",
    "serviceName": null,
    "rationale": "Python timeline extraction engine (log2timeline) for digital forensics. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "ghidra": {
    "toolId": "ghidra",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/NationalSecurityAgency/ghidra",
    "serviceName": null,
    "rationale": "Software reverse engineering (SRE) suite developed by the NSA. Java desktop application; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "radare2": {
    "toolId": "radare2",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/radareorg/radare2",
    "serviceName": null,
    "rationale": "UNIX-like reverse engineering framework and commandline tools. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "binwalk": {
    "toolId": "binwalk",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/ReFirmLabs/binwalk",
    "serviceName": null,
    "rationale": "Fast, easy to use tool for analyzing and extracting firmware images. Python CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "capstone": {
    "toolId": "capstone",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/capstone-engine/capstone",
    "serviceName": null,
    "rationale": "Lightweight multi-platform, multi-architecture disassembly framework. C library; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "aircrack-ng": {
    "toolId": "aircrack-ng",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/aircrack-ng/aircrack-ng",
    "serviceName": null,
    "rationale": "Complete suite of tools to assess WiFi network security. C CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "kismet": {
    "toolId": "kismet",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/kismetwireless/kismet",
    "serviceName": null,
    "rationale": "Wireless network and device detector, sniffer, and WIDS. C++ daemon; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "wifite": {
    "toolId": "wifite",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/derv82/wifite2",
    "serviceName": null,
    "rationale": "Python automated wireless attack tool. CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "bt-scanner": {
    "toolId": "bt-scanner",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/bettercap/bettercap",
    "serviceName": null,
    "rationale": "Swiss army knife for 802.11, BLE, and Ethernet networks reconnaissance. Go daemon; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "mail-spoof-checker": {
    "toolId": "mail-spoof-checker",
    "status": "ONLINE",
    "externalWebsite": "https://dmarcly.com/tools/",
    "officialRepository": null,
    "serviceName": "DMARCly Domain Checker",
    "rationale": "Interactive browser-based DMARC, DKIM, and SPF record validator.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "DMARCly",
        "product": "DMARCly Domain Checker",
        "officialUrl": "https://dmarcly.com/tools/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "mxtoolbox-check": {
    "toolId": "mxtoolbox-check",
    "status": "ONLINE",
    "externalWebsite": "https://mxtoolbox.com/blacklists.aspx",
    "officialRepository": null,
    "serviceName": "MXToolbox Blacklists Check",
    "rationale": "Interactive browser-based IP and domain mailflow blacklist checker.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "MXToolbox",
        "product": "MXToolbox Blacklists Check",
        "officialUrl": "https://mxtoolbox.com/blacklists.aspx",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "phishmeister": {
    "toolId": "phishmeister",
    "status": "ONLINE",
    "externalWebsite": "https://toolbox.googleapps.com/apps/messageheader/",
    "officialRepository": null,
    "serviceName": "Google Admin Toolbox Messageheader",
    "rationale": "Google interactive browser tool to analyze email headers and delivery hops.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Google",
        "product": "Google Admin Toolbox Messageheader",
        "officialUrl": "https://toolbox.googleapps.com/apps/messageheader/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "phishing": {
    "toolId": "phishing",
    "status": "ONLINE",
    "externalWebsite": "https://phishtank.org/",
    "officialRepository": null,
    "serviceName": "PhishTank Community Database",
    "rationale": "Authoritative browser database for looking up and verifying phishing URLs.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "PhishTank",
        "product": "PhishTank Community Database",
        "officialUrl": "https://phishtank.org/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "gophish": {
    "toolId": "gophish",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/gophish/gophish",
    "serviceName": null,
    "rationale": "Open-source phishing framework designed for businesses and penetration testers. Self-hosted server; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "domain-twist": {
    "toolId": "domain-twist",
    "status": "ONLINE",
    "externalWebsite": "https://dnstwist.it/",
    "officialRepository": "https://github.com/elceef/dnstwist",
    "serviceName": "dnstwist.it Permutation Scanner",
    "rationale": "Official web application for generating and detecting domain typosquatting permutations.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "dnstwist.it",
        "product": "dnstwist.it Permutation Scanner",
        "officialUrl": "https://dnstwist.it/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "evilginx-audit": {
    "toolId": "evilginx-audit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/kgretzky/evilginx2",
    "serviceName": null,
    "rationale": "Standalone man-in-the-middle attack framework used for phishing login credentials. Go CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "prompt-guard": {
    "toolId": "prompt-guard",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/NVIDIA/NeMo-Guardrails",
    "serviceName": null,
    "rationale": "NeMo Guardrails Python framework by NVIDIA for controlling LLM outputs. No genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "garak": {
    "toolId": "garak",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/leondz/garak",
    "serviceName": null,
    "rationale": "LLM vulnerability scanner probing for hallucination, data leakage, and jailbreaks. Python CLI; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "llm-redteam": {
    "toolId": "llm-redteam",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/Azure/PyRIT",
    "serviceName": null,
    "rationale": "Python Risk Identification Toolkit for generative AI by Microsoft. Python library; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "prompt-fuzzer": {
    "toolId": "prompt-fuzzer",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/confident-ai/deepeval",
    "serviceName": null,
    "rationale": "DeepEval unit testing and evaluation framework for LLMs. Python library; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "gdpr-cookie-audit": {
    "toolId": "gdpr-cookie-audit",
    "status": "ONLINE",
    "externalWebsite": "https://www.cookiebot.com/",
    "officialRepository": null,
    "serviceName": "Cookiebot Consent Scanner",
    "rationale": "Interactive browser-based website cookie and tracking tag consent scanner.",
    "accessModel": "Public / Free scan",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Cookiebot",
        "product": "Cookiebot Consent Scanner",
        "officialUrl": "https://www.cookiebot.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Free scan",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "exif-stripper": {
    "toolId": "exif-stripper",
    "status": "ONLINE",
    "externalWebsite": "https://jimpl.com/",
    "officialRepository": null,
    "serviceName": "Jimpl Online Exif Viewer",
    "rationale": "Interactive browser-based tool to view and strip EXIF metadata from images.",
    "accessModel": "Public / No login required",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "Jimpl",
        "product": "Jimpl Online Exif Viewer",
        "officialUrl": "https://jimpl.com/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "pii-scanner": {
    "toolId": "pii-scanner",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/microsoft/presidio",
    "serviceName": null,
    "rationale": "Presidio context-aware PII anonymization and detection SDK by Microsoft. Self-hosted Python/Docker; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "remediation": {
    "toolId": "remediation",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Native CyberShield X incident remediation engine. Operates as an integrated first-party orchestrator; no public equivalent exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "thehive": {
    "toolId": "thehive",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/TheHive-Project/TheHive",
    "serviceName": null,
    "rationale": "Scalable, open-source Security Incident Response Platform. Self-hosted Scala/Play server; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "misp-feed": {
    "toolId": "misp-feed",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/MISP/MISP",
    "serviceName": null,
    "rationale": "MISP core threat intelligence publisher. Self-hosted server; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "playbook-runner": {
    "toolId": "playbook-runner",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Native CyberShield X SOC playbook orchestrator. Operates as an integrated first-party engine; no public equivalent exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "wazuh-agent-audit": {
    "toolId": "wazuh-agent-audit",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/wazuh/wazuh",
    "serviceName": null,
    "rationale": "Free and open source platform for threat prevention, detection, and response. Self-hosted SIEM; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "zeek-logs": {
    "toolId": "zeek-logs",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/zeek/zeek",
    "serviceName": null,
    "rationale": "Powerful network analysis framework that is much more than a traditional IDS. C++ daemon; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "auditd-viewer": {
    "toolId": "auditd-viewer",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": "https://github.com/elastic/beats/tree/main/auditbeat",
    "serviceName": null,
    "rationale": "Auditbeat collects Linux audit framework data and monitors file integrity. Go daemon; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "cis-cat": {
    "toolId": "cis-cat",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "CIS-CAT Pro automated host benchmark configuration scanner. Paid desktop/CLI software; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "soc2-checklist": {
    "toolId": "soc2-checklist",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "SOC 2 trust services criteria posture evaluator. Native first-party capability; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "hipaa-auditor": {
    "toolId": "hipaa-auditor",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "HIPAA ePHI security and privacy rule evaluator. Native first-party capability; no genuine browser service exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "jwt-parser": {
    "toolId": "jwt-parser",
    "status": "ONLINE",
    "externalWebsite": "https://jwt.io/",
    "officialRepository": null,
    "serviceName": "jwt.io Token Debugger",
    "rationale": "Authoritative browser-based tool to decode and inspect JWT tokens.",
    "accessModel": "Public / No login required",
    "privacyRisk": "HIGH",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "jwt.io",
        "product": "jwt.io Token Debugger",
        "officialUrl": "https://jwt.io/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / No login required",
        "dataExposure": "Tokens / Payloads",
        "privacyRisk": "HIGH",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "base64-decoder": {
    "toolId": "base64-decoder",
    "status": "ONLINE",
    "externalWebsite": "https://gchq.github.io/CyberChef/",
    "officialRepository": "https://github.com/gchq/CyberChef",
    "serviceName": "CyberChef Swiss Army Knife",
    "rationale": "Client-side browser web application by GCHQ for data decoding and encoding.",
    "accessModel": "Public / Client-side only",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "CyberChef",
        "product": "CyberChef Swiss Army Knife",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Client-side only",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "url-sanitizer": {
    "toolId": "url-sanitizer",
    "status": "ONLINE",
    "externalWebsite": "https://gchq.github.io/CyberChef/",
    "officialRepository": "https://github.com/gchq/CyberChef",
    "serviceName": "CyberChef URL Parse Operation",
    "rationale": "Client-side browser tool for URL parsing, decoding, and sanitization.",
    "accessModel": "Public / Client-side only",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "CyberChef",
        "product": "CyberChef URL Parse Operation",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Client-side only",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "sms": {
    "toolId": "sms",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Native CyberShield X SMS and smishing forensic analyzer. Operates as an integrated first-party engine; no public equivalent exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "upi": {
    "toolId": "upi",
    "status": "COMING_SOON",
    "externalWebsite": null,
    "officialRepository": null,
    "serviceName": null,
    "rationale": "Native CyberShield X UPI payment gateway and VPA fraud verifier. Operates as an integrated first-party engine; no public equivalent exists.",
    "accessModel": "CLI / Self-hosted / Native",
    "privacyRisk": "NONE",
    "hasAlternative": false,
    "alternatives": []
  },
  "hash-generator": {
    "toolId": "hash-generator",
    "status": "ONLINE",
    "externalWebsite": "https://gchq.github.io/CyberChef/",
    "officialRepository": "https://github.com/gchq/CyberChef",
    "serviceName": "CyberChef Hashing Suite",
    "rationale": "Client-side browser tool for generating cryptographic digests (SHA-256, MD5, SHA-1).",
    "accessModel": "Public / Client-side only",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "CyberChef",
        "product": "CyberChef Hashing Suite",
        "officialUrl": "https://gchq.github.io/CyberChef/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Client-side only",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  },
  "hex-editor": {
    "toolId": "hex-editor",
    "status": "ONLINE",
    "externalWebsite": "https://hexed.it/",
    "officialRepository": null,
    "serviceName": "HexEd.it Online Hex Editor",
    "rationale": "Client-side browser web application for inspecting and editing binary files.",
    "accessModel": "Public / Client-side only",
    "privacyRisk": "LOW",
    "hasAlternative": true,
    "alternatives": [
      {
        "provider": "HexEd.it",
        "product": "HexEd.it Online Hex Editor",
        "officialUrl": "https://hexed.it/",
        "capabilityMatch": "EXACT",
        "accessModel": "Public / Client-side only",
        "dataExposure": "Host / Domain / Target",
        "privacyRisk": "LOW",
        "verificationStatus": "VERIFIED",
        "verifiedAt": "2026-09-28",
        "recommendation": "INCLUDE"
      }
    ]
  }
};

/**
 * Checks whether a tool has verified external browser-based service.
 * @param {string} toolId - Canonical tool ID
 * @returns {boolean}
 */
export function isToolOnline(toolId) {
  if (!toolId || typeof toolId !== 'string') return false;
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return Boolean(entry && entry.status === 'ONLINE' && entry.externalWebsite);
}

/**
 * Returns the tool status ('ONLINE' or 'COMING_SOON').
 * @param {string} toolId - Canonical tool ID
 * @returns {string}
 */
export function getToolStatus(toolId) {
  if (!toolId || typeof toolId !== 'string') return 'COMING_SOON';
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return entry?.status || 'COMING_SOON';
}

/**
 * Returns the verified external website URL, or null if COMING_SOON.
 * @param {string} toolId - Canonical tool ID
 * @returns {string|null}
 */
export function getExternalWebsite(toolId) {
  if (!toolId || typeof toolId !== 'string') return null;
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return (entry?.status === 'ONLINE' ? entry.externalWebsite : null) || null;
}

/**
 * Returns the official project repository URL, or null if none.
 * @param {string} toolId - Canonical tool ID
 * @returns {string|null}
 */
export function getOfficialRepository(toolId) {
  if (!toolId || typeof toolId !== 'string') return null;
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return entry?.officialRepository || null;
}

/**
 * Retrieves the verified alternative providers for a canonical tool.
 * (Backward compatibility with existing tests & modal contracts)
 * @param {string} toolId - Canonical tool ID
 * @returns {Array<Object>}
 */
export function getAlternativesForTool(toolId) {
  if (!toolId || typeof toolId !== 'string') return [];
  const entry = EXTERNAL_ALTERNATIVES[toolId];
  return entry && Array.isArray(entry.alternatives) ? entry.alternatives : [];
}

/**
 * Checks whether a tool has verified external alternatives.
 * (Backward compatibility with existing tests)
 * @param {string} toolId - Canonical tool ID
 * @returns {boolean}
 */
export function hasAlternatives(toolId) {
  return isToolOnline(toolId);
}

/**
 * Returns the tool's alternatives metadata entry.
 * @param {string} toolId - Canonical tool ID
 * @returns {Object|null}
 */
export function getToolAlternativesEntry(toolId) {
  if (!toolId || typeof toolId !== 'string') return null;
  return EXTERNAL_ALTERNATIVES[toolId] || null;
}

export default EXTERNAL_ALTERNATIVES;
