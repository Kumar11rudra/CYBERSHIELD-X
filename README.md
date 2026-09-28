# CyberShield X 🛡️

**Enterprise-Grade AI-Assisted Cybersecurity Threat Intelligence & Interactive CyberSOC Platform**

[![Production Status](https://img.shields.io/badge/Production-v62.6.0%20Live-00ff88?style=for-the-badge&logo=cloudflare)](https://www.cybershieldx.in)
[![Interactive Terminal](https://img.shields.io/badge/CyberSOC%20Terminal-Online-00bfff?style=for-the-badge)](https://www.cybershieldx.in/terminal)
[![Security Catalog](https://img.shields.io/badge/Security%20Tools-111%20Canonical-b400ff?style=for-the-badge)](https://www.cybershieldx.in/dashboard)
[![Architecture Status](https://img.shields.io/badge/Architecture-Frozen%20%2F%20Production-blue?style=for-the-badge)](PROJECT_MASTER.md)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## What It Is

**CyberShield X** is a full-stack, enterprise-grade cybersecurity operations platform built to provide unified vulnerability assessment, threat intelligence monitoring, interactive network diagnostics, multi-cloud telemetry ingestion, and AI-assisted defense workflows.

The platform bridges real-time cybersecurity telemetry with an interactive browser interface, featuring:
* An authoritative catalog of **111 security tools** categorized across **24 operational security domains**.
* A host-native **Interactive CyberSOC Terminal Workstation** (`/terminal`) enforcing process-level allowlists (`shell: false`).
* A real-time **CISA KEV Live Threat Ticker** streaming active exploits and remediation guidance.
* An advisory **AI Security Copilot** powered by Google Gemini with deterministic offline heuristic fallback.
* A single-canvas high-performance **0/1 Binary Matrix Rain** background preserving high-contrast accessibility.

---

## Current Production Status

* **Release Version**: `v62.6.0` (Canonical Frozen Production Release)
* **Release Status**: **LIVE, VERIFIED & FROZEN**
* **Maintenance Mode**: **MAINTENANCE-ONLY MODE ENABLED** (No new feature development permitted)
* **Production Integrity**:
  * Edge Frontend: `HTTP/2 200 OK` on Cloudflare Pages (`https://www.cybershieldx.in`, `https://cybershieldx.in`, `https://cybershield-x.pages.dev`)
  * Backend API: `HTTP 200 OK` on Render (`https://cybershield-x.onrender.com/health`)
  * Database Cluster: `Connected to MongoDB` (MongoDB Atlas Replica Set)
  * Real-Time Threat Feed: `HTTP 200 OK` (`/api/threat-feed`) with 15-minute server-side caching.

---

## Architecture

CyberShield X follows a decoupled client-server architecture with strict separation of concerns and defense-in-depth security:

```
┌─────────────────────────────────────────────────────────────┐
│                 Global Edge Tier (Cloudflare)               │
│    https://www.cybershieldx.in • https://cybershield-x.pages.dev │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / WSS
                               ▼
┌─────────────────────────────────────────────────────────────┐
│               Frontend Tier (React 18 SPA)                  │
│  - HomePage: CISA KEV Live Marquee, HIBP CTA, Matrix Rain   │
│  - Dashboard: 111 Tool Cards, 24 Categories, Welcome Modal  │
│  - Terminal: Standalone Clean Console (Native Backend)      │
│  - Auth: English-Only Universal 3-Way Login / Signup        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API over TLS / Socket.IO
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend API Tier (Node.js Express on Render)    │
│  - Controllers: auth, threatFeed, terminal, tools, cloud    │
│  - Services: threatFeed, breachService, auditLogger         │
│  - Security: Helmet, CORS, Rate Limiters, SSRF DNS-Pinning  │
│  - Terminal Engine: child_process.spawn(shell: false)       │
│  - Workers: In-Memory Integration Queue with DLQ & Retries  │
└──────────────────────────────┬──────────────────────────────┘
                               │ TLS 1.3 Mongoose ODM
                               ▼
┌─────────────────────────────────────────────────────────────┐
│              Data & External Intelligence Tier              │
│  - MongoDB Atlas: Multi-tenant schemas, audit events        │
│  - CISA KEV Catalog: Automated 15-min cached pull           │
│  - Google Gemini 2.5 Flash: AI advisory triage engine        │
│  - Enterprise ITSM: Jira, ServiceNow, PagerDuty, Webhooks   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

1. **Interactive CyberSOC Terminal (`/terminal`)**: Direct execution of host-installed diagnostic binaries (`nmap`, `dig`, `whois`, `ping`, `traceroute`, `curl`, `openssl`) inside a sandboxed console with argument validation.
2. **Authoritative 111-Tool Security Catalog (`/dashboard`)**: Unified registry spanning 24 specialized domains, each tool with precise metadata, risk scoring, category mapping, and external alternative links.
3. **Real-Data Threat Ticker**: Top live banner streaming real vulnerabilities directly from the official CISA Known Exploited Vulnerabilities (KEV) catalog via an Express proxy.
4. **Have I Been Pwned Integration**: Direct external breach query gateway located strictly below Hero stats on the Homepage, ensuring zero-knowledge privacy with no native email retention.
5. **CyboBot AI Security Copilot**: Context-aware security advisor utilizing Gemini 2.5 Flash to analyze scan outputs and recommend defensive remediation steps.
6. **Multi-Cloud Ingestion (Phase 80)**: Normalized security event fabric accepting AWS CloudTrail, GCP Cloud Audit, and Azure Activity Log telemetry.
7. **Enterprise ITSM & SOAR Dispatch (Phase 81)**: Automated incident dispatch to Jira, ServiceNow, PagerDuty, Slack, Teams, and generic webhooks with HMAC validation.

---

## Security Model

* **Zero Trust Mindset**: All API endpoints enforce strict authentication and tenant scoping via `req.organizationId`.
* **Subprocess Sandboxing**: Terminal commands are spawned with `shell: false`, strict binary allowlists, forbidden character filtering, and an automated 10-second kill switch.
* **SSRF Protection**: Outbound requests through connector utilities leverage DNS-pinning agents (`secureAxios`), blocking private IP space (RFC 1918), loopback (`127.0.0.1`), and cloud metadata services (`169.254.169.254`).
* **Credential Hygiene**: Strict recursive scrubbing of Authorization headers, Bearer tokens, cookies, passwords, and MongoDB connection strings from logs, telemetry, and client responses.
* **Immutable Audit Logging**: Every administrative action, authentication attempt, and dispatch event is immutably recorded with organization scoping.

---

## 111 Security Tools / 24 Categories

The canonical security registry defines exactly 111 tools across 24 categories:

| Category | Tool Count | Sample Tools |
| :--- | :---: | :--- |
| **Reconnaissance & OSINT** | 10 | DNS Enumeration, WHOIS Record Engine, Subdomain Discovery, Shodan Search |
| **Web Security** | 8 | Port Scanner, Service Fingerprinting, HTTP Header Auditor, SSL/TLS Audit |
| **Vulnerability Scanning** | 8 | CVE Inspector, Nikto Web Scanner, SQLmap Database Auditor, Trivy Auditor |
| **Threat Intelligence** | 8 | URL Threat Intel, Breach Checker, AlienVault OTX, VirusShare Hash Search |
| **Cloud Security** | 4 | Prowler AWS CIS Benchmark, Scout Suite Multi-Cloud, Bucket Finder, IAM Linter |
| **API Security** | 4 | Postman Auditor, JWT Strength Auditor, API Endpoint Fuzzer, Swagger Spec Linter |
| **Authentication & Identity** | 4 | Hydra Protocol Auditor, LDAP Policy Auditor, SAML Decoder, OAuth Validator |
| **Mobile Security** | 4 | MobSF Android Manifest, iOS IPA Validator, APK Secrets Extractor, Androguard |
| **Container & Kubernetes** | 4 | Kube-Bench CIS, Kubesec Linter, Docker CIS Benchmark, Falco Syscall Inspector |
| **DevSecOps / Supply Chain** | 4 | Semgrep SAST, Gitleaks Secrets Scanner, Dependency-Track SBOM, Snyk Checker |
| **Malware Analysis & Reversing** | 4 | YARA Matcher, PE Binary Header Analyzer, Cuckoo Sandbox, PDF Inspector |
| **Digital Forensics & IR** | 4 | Autopsy Digital Forensics, Volatility Memory Analysis, Sleuth Kit, Plaso Engine |
| **Reverse Engineering** | 4 | Ghidra Decompiler, Radare2 Shellcode Inspector, Binwalk Firmware, Capstone |
| **Wireless Security** | 4 | Aircrack-ng Interface, Kismet Wireless Survey, Wifite Auditor, BLE Scanner |
| **Email Security** | 4 | Email Spoofing & DMARC, MX Blacklist Auditor, Email Hop Analyzer, Phishing Detector |
| **Social Engineering & Phishing** | 4 | GoPhish Simulation, Domain Typosquatting, Evilginx MFA Bypass, Social Profiler |
| **AI / LLM Security** | 4 | Prompt Injection Guard, Garak LLM Scanner, AI Red-Teaming, Prompt Boundary Fuzzer |
| **Privacy & Data Security** | 4 | GDPR Cookie Auditor, Image EXIF Inspector, Sensitive PII Scanner, Compliance Planner |
| **Security Operations & SOAR** | 4 | TheHive Incident Manager, MISP Threat Publisher, SOC Playbook Orchestrator, Wazuh SIEM |
| **Network Traffic Analysis** | 4 | Zeek Transaction Parser, Suricata NIDS Rule Tester, Snort Rule Generator, Tcpdump Filter |
| **Threat Hunting & Detection** | 4 | Sigma Rule Compiler, Atomic Red Team Runner, MITRE ATT&CK Navigator, OSQuery Engine |
| **Active Directory Security** | 4 | BloodHound Graph Ingest, Kerberoasting Detector, Mimikatz Output Parser, ACL Auditor |
| **IoT & ICS / SCADA Security** | 4 | Modbus Protocol Auditor, DNP3 Packet Inspector, MQTT Broker Security, Shodan ICS |
| **Compliance & Posture** | 5 | SOC 2 Posture Evaluator, HIPAA ePHI Auditor, PCI-DSS Assessment, NIST CSF, ISO 27001 |

---

## External Website vs Coming Soon Model

CyberShield X enforces a strict, frozen two-state external alternatives taxonomy:

1. **ONLINE (41 Tools)**: Tools that have genuine, verified browser-based external security services (e.g., MXToolbox, SSL Labs, Shodan, SecurityHeaders, Have I Been Pwned). These render with an active pastel accent and an **"External Website ↗"** CTA button opening an external advisory modal.
2. **COMING_SOON (70 Tools)**: Tools that are desktop or CLI native without a verified browser service. These render with an explicit **"COMING SOON"** badge and an optional **"Official Repository ↗"** link (66 tools) if an official public repository exists.
3. **Repository Invariant**: GitHub URLs are **never** labeled as "External Website". Repositories and external browser utilities are separately classified.

---

## AI/Copilot

* **Canonical Route**: `POST /api/chatbot/chat`
* **Primary LLM**: Google Gemini 2.5 Flash via official Google Generative AI SDK (`@google/generative-ai`).
* **Prompt Hardening**: Server-side system instruction boundaries sanitize inputs and prevent system prompt leakage or jailbreak injection.
* **Deterministic Fallback**: In the absence of an API key or during network disconnection, the platform automatically engages the deterministic heuristic Template Engine, ensuring uninterrupted guidance.

---

## Threat Intelligence

* **Canonical Service**: `server/services/threatFeed.js`
* **Upstream Authority**: Official CISA Known Exploited Vulnerabilities (KEV) Catalog.
* **Data Flow**: Frontend `ThreatTicker` queries the Express endpoint `GET /api/threat-feed`.
* **Caching & Resilience**:
  * 15-minute in-memory cache TTL (`CACHE_TTL_MS = 900000`).
  * 8-second request timeout with 10MB response ceiling.
  * Fail-safe retention of stale cache during upstream network timeouts.
  * Offline emergency fallback dataset ensuring ticker continuity under total network disconnection.
* **Client Privacy**: Zero direct client queries to external threat providers; all requests brokered and sanitized server-side.

---

## Native Terminal

* **Dedicated Route**: `https://www.cybershieldx.in/terminal`
* **Isolated UI**: Clean, standalone console workspace completely decoupled from the Dashboard, tool cards, and sidebars.
* **Allowlisted Executables**: `nmap`, `dig`, `whois`, `ping`, `traceroute`, `curl`, `openssl`, `host`, `nslookup`.
* **Process Safety**:
  * `child_process.spawn()` with `shell: false`.
  * Forbidden shell metacharacters rejected: `;`, `|`, `&`, `` ` ``, `$`, `>`, `<`, `\`.
  * Strict argument length limits and automated 10-second kill timers.

---

## Authentication

* **Universal 3-Way Login**: Sign in with **Username**, **Email Address**, or **Mobile Phone Number** interchangeably with a password.
* **Token Architecture**:
  * Short-lived Access Token (JWT signed with HMAC-SHA256, 15m expiration).
  * Long-lived Refresh Token (JWT with server-side database hash comparison, 7d expiration).
* **Session Revocation**: User logout immediately invalidates the refresh token and terminates the active session.
* **UI Hygiene**: Original 2-column cyber-green layout; zero LanguageSwitcher; English-only interface; zero external breach widgets on authentication pages.

---

## Production Deployment

| Provider | Purpose | Configuration / Target |
| :--- | :--- | :--- |
| **Cloudflare Pages** | Static SPA Edge CDN | Project `cybershield-x`, Deployment ID `2d51d1a3-502f-40ea-bc3e-7c03105b229d` |
| **Render** | Node.js Express API | Service `cybershield-x` (`rndr-id: 908ee21c-4d59-4667`), Auto-Deploy from `main` |
| **MongoDB Atlas** | Multi-Region Database | Production Replica Set Cluster, Mongoose 8 Connection Pooling |
| **Domain Registrar / DNS** | Authoritative Routing | Cloudflare Managed DNS with Full Strict SSL / TLS 1.3 |

---

## Project URLs

* **Official Apex Domain**: [https://cybershieldx.in](https://cybershieldx.in)
* **Official Primary Domain**: [https://www.cybershieldx.in](https://www.cybershieldx.in)
* **Cloudflare Pages Host**: [https://cybershield-x.pages.dev](https://cybershield-x.pages.dev)
* **Production API Gateway**: [https://cybershield-x.onrender.com](https://cybershield-x.onrender.com)
* **Health Endpoint**: [https://cybershield-x.onrender.com/health](https://cybershield-x.onrender.com/health)
* **Detailed Diagnostics**: [https://cybershield-x.onrender.com/api/health/details](https://cybershield-x.onrender.com/api/health/details)
* **Threat Feed API**: [https://cybershield-x.onrender.com/api/threat-feed](https://cybershield-x.onrender.com/api/threat-feed)
* **Interactive Terminal Workstation**: [https://www.cybershieldx.in/terminal](https://www.cybershieldx.in/terminal)

---

## Repository Structure

```
CYBERSHIELD-X/
├── client/                          # React 18 Frontend Application
│   ├── public/                      # Static assets, favicon, manifest
│   ├── src/
│   │   ├── __tests__/               # Client unit & integration test suites
│   │   ├── components/              # Modular UI components
│   │   │   ├── common/              # BinaryMatrixRain, ThreatTicker, Navbar, Footer
│   │   │   └── toolkit/             # ToolGrid, CyberToolCard, toolConfig, externalAlternatives
│   │   ├── pages/                   # Top-level page views (HomePage, DashboardPage, etc.)
│   │   └── services/                # Axios API client, auth services, websocket client
│   └── package.json                 # Client dependencies & scripts
├── server/                          # Node.js Express REST API
│   ├── controllers/                 # Request handlers (auth, threatFeed, terminal, etc.)
│   ├── integrations/                # Connectors (Jira, ServiceNow, PagerDuty, Slack, Teams)
│   ├── middleware/                  # Auth validation, rate limiting, observability, error handlers
│   ├── models/                      # Mongoose schemas (User, AuditEvent, CloudEvent, Scan)
│   ├── routes/                      # Express route registrations
│   ├── scripts/                     # Operational scripts (seedAdmin.js, certification)
│   ├── services/                    # Business logic (threatFeed.js, breachService.js, aiService.js)
│   ├── tests/                       # Jest test suites (unit, integration, regression)
│   ├── utils/                       # Database connector, JWT helper, sanitizers
│   └── workers/                     # In-memory integration queues and workers
├── docs/                            # Architecture Decision Records (ADRs) and runbooks
├── PROJECT_MASTER.md                # Single Source of Operational Memory (Frozen Architecture)
├── PROJECT_STATE.md                 # Single Source of Truth (Current Implementation State)
├── PROJECT_HANDOFF.md               # Operator & Developer Handoff Specification
├── FINAL_PROJECT_COMPLETION_REPORT.md # Formal Phase Completion & Closure Certification
├── CHANGELOG.md                     # Comprehensive Version Release Changelog
├── README.md                        # Primary Human-Facing Documentation (This Document)
└── package.json                     # Root scripts for build, dev, and deployment
```

---

## Local Development

### 1. Prerequisites
* Node.js `18.x` or `20.x` LTS
* npm `9.x` or higher
* Local MongoDB instance (`mongodb://127.0.0.1:27017/cybershield`) or MongoDB Atlas connection URI

### 2. Setup & Installation
```bash
# Clone the repository
git clone https://github.com/Kumar11rudra/CYBERSHIELD-X.git
cd CYBERSHIELD-X

# Install all dependencies across root, server, and client
npm run install:all
```

### 3. Environment Configuration
```bash
# Copy example configuration to active local environment
cp server/.env.example server/.env
```
Ensure `JWT_SECRET`, `JWT_REFRESH_SECRET`, and `MONGODB_URI` are configured.

### 4. Admin Seeding (Optional)
To bootstrap an administrator account for local offline development:
```bash
cd server
ADMIN_EMAIL=admin@cybershieldx.local ADMIN_PASSWORD=your_secure_dev_password npm run seed:admin
```
*(Note: `ADMIN_PASSWORD` is strictly required; the script contains zero default hardcoded passwords).*

### 5. Launch Development Servers
```bash
# Starts Express API (Port 5001) and React Client (Port 3000) concurrently
npm run dev
```

---

## Environment Variables

| Variable | Scope | Required? | Purpose |
| :--- | :--- | :---: | :--- |
| `PORT` | Server | No (Default: 5001) | HTTP listen port |
| `NODE_ENV` | Server | Yes | Runtime environment (`development`, `test`, `production`) |
| `MONGODB_URI` | Server | Yes | MongoDB connection string URI |
| `JWT_SECRET` | Server | Yes | Min 64-character secret for signing access tokens |
| `JWT_REFRESH_SECRET` | Server | Yes | Secret for signing long-lived refresh tokens |
| `SCAN_HMAC_KEY` | Server | Yes | Key for signing report integrity fingerprints |
| `GEMINI_API_KEY` | Server | Optional | Google Gemini API key (defaults to offline template engine if omitted) |
| `ADMIN_EMAIL` | Server | Dev Only | Target email for `npm run seed:admin` |
| `ADMIN_PASSWORD` | Server | Dev Only | Required password for `npm run seed:admin` (no fallback) |
| `REACT_APP_API_URL` | Client | Optional | Custom backend API base URL (defaults to production backend) |

---

## Testing

```bash
# Run server baseline and security suites
cd server && npm test

# Run specific integration suites
cd server && npx jest tests/threatFeed.test.js tests/nativeTerminal.test.js

# Run client component and UI regression suites
cd client && npm test -- --watchAll=false
```

---

## Build

```bash
# Compile production-optimized frontend bundle
npm run build
```
Build output artifacts are emitted to `client/build/` with content hashes and tree-shaken chunks.

---

## Security Notes

1. **Zero Credential Exposure**: Never commit active production credentials, API keys, or JWT tokens to Git.
2. **Environment Isolation**: Production secrets are injected exclusively through hosting platform environment controls (Cloudflare Pages environment variables and Render secret management).
3. **Report Sanitization**: All exported reports and client responses recursively redact sensitive fields.

---

## Known Accepted Limitations

1. **Single-Node In-Memory ITSM Queue (Phase 81)**:
   * The outbound ITSM dispatch queue (`integrationQueue` in `server/workers/queueProvider.js`) is an in-memory queue with DLQ isolation and exponential backoff retry.
   * **Limitation**: Jobs enqueued in memory do not persist across Node.js server restarts. This is an intentional architectural trade-off avoiding Redis/Kafka complexity in single-instance deployments.
2. **Deterministic Offline AI Fallback**:
   * When `GEMINI_API_KEY` is not provided or upstream Google AI quota is reached, CyboBot automatically uses a deterministic heuristic template engine rather than dynamic LLM generation.
3. **Client-Side Alternative CTAs**:
   * For the 70 tools designated as `COMING_SOON`, the platform does not execute native browser emulation; it explicitly displays a Coming Soon badge and links to official repositories where verified.

---

## Maintenance Policy

CyberShield X is officially in **MAINTENANCE-ONLY MODE**.
* **Policy**: The system architecture is completely frozen. No feature expansion, structural redesigns, or speculative abstractions will be accepted.
* **Permitted Changes**: Critical security vulnerability patches, dependency vulnerability fixes, and upstream API deprecation updates only.

---

## Version / Release

* **Current Canonical Version**: `v62.6.0`
* **Release Date**: September 29, 2026
* **Certified Release Commit**: `dc9f5f0c1ed7cccb8c5e38fa1733976f01b023c8` (Base) + Operational Hard-Lock
* **License**: MIT License
