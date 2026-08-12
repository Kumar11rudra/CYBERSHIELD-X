# Security Policy

## Reporting Vulnerabilities

The CyberShield X team takes platform security and threat safety seriously. If you discover a security vulnerability, we appreciate your responsible disclosure.

---

## Disclosure Guidelines

> [!IMPORTANT]
> **Please do NOT publicly disclose unpatched vulnerabilities** in public GitHub issues, forum discussions, or pull requests.

1. **Private Reporting**: Contact the CyberShield X Core Security Team via our official disclosure portal or security advisory interface on GitHub ([GitHub Security Advisories](https://github.com/Kumar11rudra/CYBERSHIELD-X/security/advisories/new)).
2. **Details to Include**:
   - Description of the issue and affected component (`server/middleware`, `HttpClient.js`, etc.).
   - Step-by-step proof-of-concept (PoC) or reproduction steps.
   - Potential impact (e.g. SSRF, CORS misconfiguration, authentication bypass).
3. **Response SLA**:
   - Initial acknowledgement: Within 48 hours.
   - Vulnerability triage & patch timeline: Priority resolution based on severity score (CVSS v3.1).

---

## Defensive Boundaries

CyberShield X incorporates strict built-in security protections:
* **SSRF Prevention**: All scanner targets pass through `ssrfValidator.js` to block private (`10.0.0.0/8`, `192.168.0.0/16`), loopback (`127.0.0.0/8`), and multicast address ranges.
* **Strict CORS Matching**: Origin matching strictly accepts `https://*.pages.dev` and configured `CLIENT_URL`.
* **PII Encryption**: User data is encrypted at rest using AES-256 field vault encryption.
