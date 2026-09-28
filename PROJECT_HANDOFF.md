# CyberShield X — Project Handoff

## Current Release
`v62.5.3`

## Current Git Commit
`fa0da3cb4ecd3bd9c36e24e2d80ff8a6deaa9648` (Tag: `v62.5.3`, `HEAD == origin/main`)

## Production URLs
- **Apex Domain**: [https://cybershieldx.in](https://cybershieldx.in)
- **Primary Website**: [https://www.cybershieldx.in](https://www.cybershieldx.in)
- **Cloudflare Pages CDN**: [https://cybershield-x.pages.dev](https://cybershield-x.pages.dev)
- **Production Backend API**: [https://cybershield-x.onrender.com](https://cybershield-x.onrender.com)
- **Production Health Telemetry**: [https://cybershield-x.onrender.com/health](https://cybershield-x.onrender.com/health)
- **Production Readiness Check**: [https://cybershield-x.onrender.com/api/health/readiness](https://cybershield-x.onrender.com/api/health/readiness)

## Architecture
CyberShield X is a full-stack, enterprise-grade cybersecurity threat detection and interactive security operations center (CyberSOC) platform.
- **Frontend**: Single-page application built on React 18, React Router v6, Tailwind CSS, and Framer Motion. Deployed to Cloudflare Pages edge CDN. Features responsive 4-column pastel tool grid, Canvas-rendered 0/1 binary matrix rain, 3D animated tool avatars, and clean top-header navigation decoupled from legacy sidebars.
- **Backend**: Node.js and Express RESTful API with Socket.IO real-time event streaming. Deployed to Render web service. Features robust multi-tenant organization isolation (`req.organizationId`), JWT authentication with database-backed session revocation, and security middleware (Helmet, CORS, rate limiting).
- **Data Fabric & Storage**: MongoDB database storing user accounts, audit trails, scan histories, case management records, and cloud telemetry events.
- **Network & Host Security**: Defense-in-depth SSRF protection engine with DNS resolution checks, strict binary allowlisting, process spawning with `shell: false`, and 10-second kill timers.

## Major Capabilities
- **111 Canonical Security Tools**: Exhaustive operations coverage across 24 cybersecurity archetypes (Recon, DNS, Web, Vulnerability, Threat Intel, OSINT, Cloud, Identity, Mobile, Containers, DevSecOps, Forensics, Wireless, etc.).
- **24 Operational Categories**: Managed via `NexusCategoryGrid.jsx` and `toolConfig.js`.
- **111 Approved External Alternatives**: 1-to-1 parity mapping in `externalAlternatives.js` with secure modal routing (`ExternalAlternativesModal.jsx`) and zero credential forwarding.
- **Centralized Native Terminal Workstation**: Dedicated `/terminal` console executing allowlisted host CLI utilities (`nmap`, `dig`, `whois`, `curl`, `openssl`, `ping`, `traceroute`) with ANSI output formatting.
- **AI Security Copilot**: Context-aware security intelligence powered by Google Gemini 2.5 Flash, equipped with adversarial prompt injection defenses and read-only advisory suggestions.
- **Phase 80 Cloud Telemetry Ingestion**: Multi-cloud activity ingestion normalizing AWS CloudTrail, GCP Cloud Audit, and Azure Activity Logs into a unified event graph.
- **Phase 81 External Workflow & SOAR Collaboration**: Bidirectional ticketing and approval webhooks with Jira, ServiceNow, PagerDuty, Slack, and Microsoft Teams. Features constant-time HMAC validation and replay protection.

## Documentation
Permanent engineering documentation is organized under a strict truth hierarchy:
- [PROJECT_MASTER.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_MASTER.md): Canonical technical master document covering all 22 operational and architectural subsystems.
- [README.md](file:///Users/anil/Documents/New%20project/cybershield-x/README.md): Public repository overview, feature highlights, live production links, and quick-start instructions.
- [CHANGELOG.md](file:///Users/anil/Documents/New%20project/cybershield-x/CHANGELOG.md): Comprehensive release history and detailed version changelogs.
- [PROJECT_STATE.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_STATE.md): Single source of truth (SSOT) tracking phase status and historical milestones.
- [.agents/AGENTS.md](file:///Users/anil/Documents/New%20project/cybershield-x/.agents/AGENTS.md): Permanent rules, constitution, and definition of done for AI engineering assistants.
- [CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md](file:///Users/anil/Documents/New%20project/cybershield-x/CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md): Complete catalog mapping of all 111 security tools and underlying AI models.
- [docs/](file:///Users/anil/Documents/New%20project/cybershield-x/docs/): Specialized operational guides, including `PRODUCTION_OPERATIONS_RUNBOOK.md`, `AUTHENTICATION_ARCHITECTURE.md`, and `DEPLOYMENT_RUNBOOK.md`.

## Development & Verification Commands
- **Install Dependencies**:
  ```bash
  npm run install:all
  ```
- **Start Local Full-Stack Environment**:
  ```bash
  npm run dev
  ```
- **Run Client Tests (122 tests)**:
  ```bash
  cd client && CI=true npm test -- --watchAll=false
  ```
- **Run Backend Security Tests (115 tests)**:
  ```bash
  cd server && npm test -- tests/validators.test.js tests/phase81_step4_webhook_security.test.js tests/phase81_finding01_webhook_failure_semantics.test.js tests/auth/auth_hardening.test.js tests/terminal_production_hardening.test.js tests/production_readiness.test.js
  ```
- **Compile Production Frontend Build**:
  ```bash
  cd client && npm run build
  ```

## Certified Security Baseline
- **Zero Active Production Secrets**: Tracked repository files contain zero private keys, API tokens, unencrypted connection strings, or administrative credentials.
- **SSRF Immunity**: Network boundaries block loopback, link-local, private subnets (RFC 1918), and cloud metadata (`169.254.169.254`).
- **Command Sanitization**: Process execution disallows shell expansion (`shell: false`) with strict regex argument validation.
- **Client Privacy Invariant**: Zero passwords, session tokens, or personal identifiers are stored or forwarded. Have I Been Pwned operations use pure external navigation or range-hashed k-anonymity queries (NIST SP 800-63B).

## Known Accepted Architectural Limitation
- **Phase 81 Process-Local Queue (FINDING-05)**: Outbound dispatch in single-node topologies utilizes an in-memory queue (`MemoryQueue`) and in-memory retry timers. `IntegrationSyncEvent` provides durable audit history with SHA-256 hashes, but pending retry state does not survive process termination. Multi-worker durable queue leasing is scheduled for Phase 82.

## Final Technical Validation
- **Client Test Suite**: **122 / 122 PASS** (10 test suites)
- **Backend Security Battery**: **115 / 115 PASS** (6 test suites)
- **Combined Security Baseline**: **237 / 237 PASS**
- **Phase 80 Multi-Cloud Telemetry**: **262 / 262 PASS** (8 test suites)
- **Phase 81 Enterprise Collaboration**: **273 / 273 PASS** (10 test suites)
- **Core Platform & Terminal**: **29 / 29 PASS** (2 test suites: `centralized_native_terminal_step1` [14] + `centralized_native_terminal_step2` [15])
- **Production Frontend Build**: `Compiled successfully` (Exit Code 0)
- **Critical Defects (P0)**: **0**
- **High Severity Defects (P1)**: **0**

## Maintenance Rule
Future maintainers must adhere to the two-tier documentation rule:
1. Update [PROJECT_MASTER.md](file:///Users/anil/Documents/New%20project/cybershield-x/PROJECT_MASTER.md) whenever architectural boundaries, data models, or service designs change.
2. Update [CHANGELOG.md](file:///Users/anil/Documents/New%20project/cybershield-x/CHANGELOG.md) whenever a new version is tagged and released.

## Project Status
**FINAL — PRODUCTION READY**
