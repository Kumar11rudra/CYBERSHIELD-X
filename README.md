# CyberShield X 🛡️

**Enterprise-Grade AI-Assisted Cybersecurity Threat Intelligence & Interactive CyberSOC Platform**

[![Production Status](https://img.shields.io/badge/Production-v62.6.0%20Live-00ff88?style=for-the-badge&logo=cloudflare)](https://www.cybershieldx.in)
[![Interactive Terminal](https://img.shields.io/badge/CyberSOC%20Terminal-Online-00bfff?style=for-the-badge)](https://www.cybershieldx.in/terminal)
[![Security Catalog](https://img.shields.io/badge/Security%20Tools-111%20Canonical-b400ff?style=for-the-badge)](https://www.cybershieldx.in/dashboard)
[![AI Copilot](https://img.shields.io/badge/CyberBot%20AI-Resilient%20Multi--Model-cyan?style=for-the-badge)](https://www.cybershieldx.in)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)

---

## What It Is

**CyberShield X** is a full-stack, enterprise-grade cybersecurity operations platform built to provide unified vulnerability assessment, threat intelligence monitoring, interactive network diagnostics, multi-cloud telemetry ingestion, and AI-assisted defense workflows.

The platform bridges real-time cybersecurity telemetry with an interactive browser interface, featuring:
* An authoritative catalog of **111 security tools** categorized across **24 operational security domains**.
* A host-native **Interactive CyberSOC Terminal Workstation** (`/terminal`) enforcing process-level allowlists (`shell: false`).
* A real-time **CISA KEV Live Threat Ticker** streaming active exploits and remediation guidance.
* A resilient **CyberBot AI Security Copilot** with multi-model failover (`gemini-2.5-flash` → `gemini-3.8-flash`), automatic 503/429 retry, omniscient technical knowledge, and restored high-definition neon shield avatar.
* A single-canvas high-performance **0/1 Binary Matrix Rain** background preserving high-contrast accessibility.
* A decoupled **Core Team Workstation** (`/team`) providing standalone team profiles with dedicated cyber navigation.

---

## Current Production Status

* **Release Version**: `v62.6.0` (Canonical Operational Release)
* **Release Status**: **LIVE, VERIFIED & FROZEN**
* **Maintenance Mode**: **MAINTENANCE-ONLY MODE ENABLED**
* **Production Integrity**:
  * Edge Frontend: `HTTP/2 200 OK` on Cloudflare Pages (`https://www.cybershieldx.in`, `https://cybershieldx.in`, `https://cybershield-x.pages.dev`)
  * Backend API: `HTTP 200 OK` on Render (`https://cybershield-x.onrender.com/health`)
  * Database Cluster: `Connected to MongoDB` (MongoDB Atlas Replica Set)
  * Real-Time Threat Feed: `HTTP 200 OK` (`/api/threat-feed`) with 15-minute server-side caching.
  * AI Copilot Gateway: `HTTP 200 OK` (`/api/chatbot/chat`) with multi-model resilience and zero error leakage.

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
│  - CyberBot: Floating Workstation Copilot with HD Avatar    │
│  - Team Page: Standalone Full-Width Cyber Team Hub          │
│  - Auth: English-Only Universal 3-Way Login / Signup        │
└──────────────────────────────┬──────────────────────────────┘
                               │ REST API over TLS / Socket.IO
                               ▼
┌─────────────────────────────────────────────────────────────┐
│             Backend API Tier (Node.js Express on Render)    │
│  - Controllers: auth, threatFeed, terminal, tools, chatbot  │
│  - Services: AIOrchestrator, threatFeed, breachService      │
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
│  - Google Gemini: 2.5 Flash -> 3.8 Flash resilient failover │
│  - Enterprise ITSM: Jira, ServiceNow, PagerDuty, Webhooks   │
└─────────────────────────────────────────────────────────────┘
```

---

## Core Capabilities

1. **Interactive CyberSOC Terminal (`/terminal`)**: Direct execution of host-installed diagnostic binaries (`nmap`, `dig`, `whois`, `ping`, `traceroute`, `curl`, `openssl`) inside a sandboxed console with argument validation.
2. **Authoritative 111-Tool Security Catalog (`/dashboard`, `/toolkit`)**: Unified registry spanning 24 specialized domains, each tool with precise metadata, risk scoring, category mapping, and external alternative links.
3. **Real-Data Threat Ticker**: Top live banner streaming real vulnerabilities directly from the official CISA Known Exploited Vulnerabilities (KEV) catalog via an Express proxy with a 15-minute TTL cache.
4. **Have I Been Pwned Integration**: Direct external breach query gateway located strictly below Hero stats on the Homepage, ensuring zero-knowledge privacy with no native email retention.
5. **CyberBot AI Security Copilot**:
   - **Multi-Model Fallback Hierarchy**: Replaced single-point failure with candidate model chain (`gemini-2.5-flash` → `gemini-3.8-flash`).
   - **Transient Error Retry**: Automatically retries 503 (high demand) and 429 (rate limits) with backoff before stepping to secondary model.
   - **Zero Technical Error Leakage**: Raw URLs and internal stack traces are completely eliminated from chat outputs.
   - **Omniscient Technical Answering**: Answers queries across Cybersecurity, Software Engineering, Code Remediation (Python, JS, Go, Rust, Bash, SQL, C/C++), Networking, Cloud, and IT Systems.
   - **Restored High-Definition Avatar**: Features CyberShield X's authentic neon shield emblem (`/bot-avatar.png` / `/bot-avatar.svg`) across the floating action trigger, chat header, and response messages.
6. **Multi-Cloud Ingestion (Phase 80)**: Normalized security event fabric accepting AWS CloudTrail, GCP Cloud Audit, and Azure Activity Log telemetry.
7. **Enterprise ITSM & SOAR Dispatch (Phase 81)**: Automated incident dispatch to Jira, ServiceNow, PagerDuty, Slack, Teams, and generic webhooks with HMAC validation.

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

CyberShield X enforces a strict two-state external alternatives taxonomy:

1. **ONLINE (41 Tools)**: Tools that have genuine, verified browser-based external security services (e.g., MXToolbox, SSL Labs, Shodan, SecurityHeaders, Have I Been Pwned). These render with an active pastel accent and an **"External Website ↗"** CTA button opening an external advisory modal.
2. **COMING_SOON (70 Tools)**: Tools that are desktop or CLI native without a verified browser service. These render with an explicit **"COMING SOON"** badge and an optional **"Official Repository ↗"** link (66 tools) if an official public repository exists.
3. **Repository Invariant**: GitHub URLs are **never** labeled as "External Website". Repositories and external browser utilities are separately classified.

---

## AI/Copilot (CyberBot)

* **Canonical Route**: `POST /api/chatbot/chat`
* **Dedicated Route Timeout**: 60 seconds with request-level non-blocking override.
* **Multi-Model Hierarchy**: `gemini-2.5-flash` → `gemini-3.8-flash` candidate cascade.
* **Transient Error Resilience**: Automatic retry with 500ms backoff on HTTP 503 and 429.
* **Execution Bound**: 8-second internal execution bound per model call.
* **Deterministic Fallback**: Comprehensive built-in cybersecurity and systems knowledge base (SQLi, XSS, DNS, Firewalls/WAFs, SOC Playbooks, Tools).
* **Avatar & UI**: High-definition neon shield emblem rendered on floating action trigger button, chat window header bar, and assistant message bubbles.

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
* **UI Hygiene**: 2-column cyber-green layout, English-only interface, and zero external breach widgets on authentication pages.

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
│   ├── public/                      # Static assets, bot-avatar.png, bot-avatar.svg, favicon
│   ├── src/
│   │   ├── __tests__/               # Client test suites (13 suites, 136 tests)
│   │   ├── components/              # Modular UI components
│   │   │   ├── chatbot/             # SecurityCopilot (CyberBot UI & avatar)
│   │   │   ├── common/              # BinaryMatrixRain, ThreatTicker, Navbar, Footer
│   │   │   └── toolkit/             # ToolGrid, CyberToolCard, toolConfig, externalAlternatives
│   │   ├── pages/                   # Top-level page views (HomePage, DashboardPage, TerminalPage, etc.)
│   │   └── services/                # Axios API client, auth services, websocket client
│   └── package.json                 # Client dependencies & scripts
├── server/                          # Node.js Express REST API
│   ├── controllers/                 # Request handlers (auth, threatFeed, terminal, chatbot, etc.)
│   ├── integrations/                # Connectors (Jira, ServiceNow, PagerDuty, Slack, Teams)
│   ├── middleware/                  # Auth validation, rate limiting, observability, error handlers
│   ├── models/                      # Mongoose schemas (User, AuditEvent, CloudEvent, Scan)
│   ├── routes/                      # Express route registrations (16 routers)
│   ├── scripts/                     # Operational scripts (seedAdmin.js, seedTools.js)
│   ├── services/                    # Business logic (AIOrchestrator, threatFeed, breachService)
│   ├── tests/                       # Jest test suites (unit, integration, regression)
│   ├── utils/                       # Database connector, JWT helper, PlatformErrors, sanitizers
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
# Starts Express API (Port 3001/5001) and React Client (Port 3000) concurrently
npm run dev
```

---

## Testing & Quality Gates

```bash
# 1. Run client test battery (13 test suites, 136 passing tests)
npm --prefix client test -- --watchAll=false

# 2. Run client production build
npm --prefix client run build

# 3. Run server core test suites
npm --prefix server test -- tests/threatFeed.test.js tests/ai_provider_routing.test.js tests/canonical_111_tool_registry.test.js
```

---

## Security Model

* **Zero Trust Mindset**: All API endpoints enforce strict authentication and tenant scoping via `req.organizationId`.
* **Subprocess Sandboxing**: Terminal commands are spawned with `shell: false`, strict binary allowlists, forbidden character filtering, and an automated 10-second kill switch.
* **SSRF Protection**: Outbound requests through connector utilities leverage DNS-pinning agents (`secureAxios`), blocking private IP space (RFC 1918), loopback (`127.0.0.1`), and cloud metadata services (`169.254.169.254`).
* **Credential Hygiene**: Strict recursive scrubbing of Authorization headers, Bearer tokens, cookies, passwords, and MongoDB connection strings from logs, telemetry, and client responses.
* **Immutable Audit Logging**: Every administrative action, authentication attempt, and dispatch event is immutably recorded with organization scoping.

---

## Version / Release

* **Current Canonical Version**: `v62.6.0`
* **Release Date**: September 30, 2026
* **Certified Release Commit**: Operational Hard-Lock & AI Copilot Resilience Release
* **License**: MIT License
