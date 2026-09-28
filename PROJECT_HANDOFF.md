# CyberShield X — Project Handoff

## Current Release
`v62.6.0`

## Current Git Commit
`dc9f5f0c1ed7cccb8c5e38fa1733976f01b023c8` (Tag: `v62.6.0`, `HEAD == origin/main`)

## Production URLs
- **Apex Domain**: [https://cybershieldx.in](https://cybershieldx.in)
- **Primary Website**: [https://www.cybershieldx.in](https://www.cybershieldx.in)
- **Cloudflare Pages CDN**: [https://cybershield-x.pages.dev](https://cybershield-x.pages.dev) (Deployment ID: `2d51d1a3-502f-40ea-bc3e-7c03105b229d`)
- **Production Backend API**: [https://cybershield-x.onrender.com](https://cybershield-x.onrender.com) (Render Server ID: `908ee21c-4d59-4667`)
- **Production Health Telemetry**: [https://cybershield-x.onrender.com/health](https://cybershield-x.onrender.com/health)
- **Production Detailed Health**: [https://cybershield-x.onrender.com/api/health/details](https://cybershield-x.onrender.com/api/health/details)
- **CISA Threat Feed API**: [https://cybershield-x.onrender.com/api/threat-feed](https://cybershield-x.onrender.com/api/threat-feed)
- **Interactive Terminal**: [https://www.cybershieldx.in/terminal](https://www.cybershieldx.in/terminal)

## Architecture
CyberShield X is a full-stack, enterprise-grade cybersecurity threat detection and interactive security operations center (CyberSOC) platform.
- **Frontend**: Single-page application built on React 18, React Router v6, Tailwind CSS, and Framer Motion. Deployed to Cloudflare Pages edge CDN. Features responsive 4-column pastel tool grid, single-canvas 0/1 binary matrix rain on Homepage & Dashboard, real-data CISA KEV threat ticker, and clean top-header navigation decoupled from legacy sidebars.
- **Backend**: Node.js and Express RESTful API with Socket.IO real-time event streaming. Deployed to Render web service. Features robust multi-tenant organization isolation (`req.organizationId`), JWT authentication with database-backed session revocation, and security middleware (Helmet, CORS, rate limiting).
- **Data Fabric & Storage**: MongoDB database storing user accounts, audit trails, scan histories, case management records, and cloud telemetry events.
- **Network & Host Security**: Defense-in-depth SSRF protection engine with DNS resolution checks, strict binary allowlisting, process spawning with `shell: false`, and 10-second kill timers.

## Major Capabilities
- **111 Canonical Security Tools**: Exhaustive operations coverage across 24 cybersecurity archetypes (Recon, DNS, Web, Vulnerability, Threat Intel, OSINT, Cloud, Identity, Mobile, Containers, DevSecOps, Forensics, Wireless, etc.).
- **24 Operational Categories**: Managed via `toolConfig.js`.
- **111 Approved External Alternatives**: 1-to-1 parity mapping in `externalAlternatives.js` (41 ONLINE with "External Website ↗", 70 COMING_SOON) with secure modal routing (`ExternalAlternativesModal.jsx`) and zero credential forwarding.
- **Real-Data Threat Streaming**: Official CISA KEV catalog streaming live CVE exploits to the top alert ticker via an Express proxy with 15-minute caching.
- **Centralized Native Terminal Workstation**: Dedicated `/terminal` console executing allowlisted host CLI utilities (`nmap`, `dig`, `whois`, `curl`, `openssl`, `ping`, `traceroute`, `host`, `nslookup`) with ANSI output formatting.
- **AI Security Copilot**: Context-aware security intelligence powered by Google Gemini 2.5 Flash, equipped with adversarial prompt injection defenses and read-only advisory suggestions.
- **Phase 80 Cloud Telemetry Ingestion**: Multi-cloud activity ingestion normalizing AWS CloudTrail, GCP Cloud Audit, and Azure Activity Logs into a unified event graph.
- **Phase 81 External Workflow & SOAR Collaboration**: Bidirectional ticketing and approval webhooks with Jira, ServiceNow, PagerDuty, Slack, and Microsoft Teams. Features constant-time HMAC validation and replay protection.

## Documentation Hierarchy
Permanent engineering documentation is organized under a strict truth hierarchy:
1. Actual source code and live production runtime.
2. [PROJECT_MASTER.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_MASTER.md): Canonical technical master document covering all operational and architectural subsystems (FROZEN ARCHITECTURE).
3. [README.md](file:///Users/anil/Documents/New%20project/cybershield-x/README.md): Public repository overview, feature highlights, live production links, and quick-start instructions.
4. [CHANGELOG.md](file:///Users/anil/Documents/New%20project/cybershield-x/CHANGELOG.md): Comprehensive release history and detailed version changelogs.
5. [PROJECT_STATE.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_STATE.md): Single source of truth (SSOT) tracking phase status and historical milestones.
6. [FINAL_PROJECT_COMPLETION_REPORT.md](file:///Users/anil/Documents/New%20project/cybershield-x/FINAL_PROJECT_COMPLETION_REPORT.md): Formal project completion and closure certification.
7. [.agents/AGENTS.md](file:///Users/anil/Documents/New%20project/cybershield-x/.agents/AGENTS.md): Permanent rules, constitution, and definition of done for AI engineering assistants.

## Development & Verification Commands
- **Install Dependencies**:
  ```bash
  npm run install:all
  ```
- **Start Local Full-Stack Environment**:
  ```bash
  npm run dev
  ```
- **Bootstrap Administrator (Development Only)**:
  ```bash
  cd server && ADMIN_PASSWORD=your_dev_secret npm run seed:admin
  ```
- **Run Client Tests (133 tests)**:
  ```bash
  cd client && CI=true npm test -- --watchAll=false
  ```
- **Run Server Baseline Tests (77 tests)**:
  ```bash
  cd server && npm test -- tests/threatFeed.test.js tests/nativeTerminal.test.js tests/production_readiness.test.js
  ```
- **Compile Production Frontend Build**:
  ```bash
  npm run build
  ```

## Certified Security Baseline
- **Zero Active Production Secrets**: Tracked repository files contain zero private keys, API tokens, unencrypted connection strings, or administrative credentials.
- **Admin Seeding Hardening**: `server/scripts/seedAdmin.js` strictly requires `ADMIN_PASSWORD` from the environment; zero hardcoded fallback passwords.
- **SSRF Immunity**: Network boundaries block loopback, link-local, private subnets (RFC 1918), and cloud metadata (`169.254.169.254`) via `secureAxios`.
- **Command Sanitization**: Process execution disallows shell expansion (`shell: false`) with strict regex argument validation.
- **Client Privacy Invariant**: Zero passwords, session tokens, or personal identifiers are stored or forwarded. Have I Been Pwned operations use pure external navigation or range-hashed k-anonymity queries (NIST SP 800-63B).

## Known Accepted Architectural Limitation
- **In-Memory Outbound Dispatch Queue (Phase 81)**: Outbound dispatch in single-node topologies utilizes an in-memory queue (`MemoryQueue` in `server/workers/queueProvider.js`) and in-memory retry timers. `IntegrationSyncEvent` provides durable audit history with SHA-256 hashes, but pending retry state does not survive process termination. This is an explicit, accepted platform trade-off for single-instance deployments avoiding external broker dependencies.

## Final Technical Validation
- **Client Test Suite**: **133 / 133 PASS** (12 test suites)
- **Server Baseline Battery**: **77 / 77 PASS**
- **Phase 80 Multi-Cloud Telemetry**: **262 / 262 PASS** (8 test suites)
- **Phase 81 Enterprise Collaboration**: **273 / 273 PASS** (10 test suites)
- **Core Platform & Terminal**: **29 / 29 PASS** (2 test suites)
- **Production Frontend Build**: `Compiled successfully` (Exit Code 0)
- **Critical Defects (P0)**: **0**
- **High Severity Defects (P1)**: **0**
- **Material Defects (P2)**: **0**

## Maintenance Rule & Hard-Lock
Future maintainers must adhere to the permanent project rules:
1. **Architecture Hard-Lock**: The architecture is officially frozen. Never introduce redundant implementations of threat feed, tool registry, or terminal routing.
2. **Maintenance-Only Policy**: No new product features, exploratory modules, or speculative refactoring. Only critical security fixes, dependency patches, and upstream API adaptations are permitted.
3. **Synchronize Documentation**: Update [PROJECT_MASTER.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_MASTER.md) and [CHANGELOG.md](file:///Users/anil/Documents/New%20project/cybershield-x/CHANGELOG.md) whenever any operational change is authorized.

## Project Status
**FINAL PROJECT CLOSURE — CERTIFIED**
**ARCHITECTURE FROZEN — MAINTENANCE-ONLY MODE ENABLED**
