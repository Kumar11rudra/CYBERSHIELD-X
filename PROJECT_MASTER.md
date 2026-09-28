# CyberShield X — PROJECT MASTER

> **Single Source of Operational & Architectural Memory**<br/>
> **Platform Version**: `v62.5.3`<br/>
> **Release Commit**: `fa0da3cb4ecd3bd9c36e24e2d80ff8a6deaa9648`<br/>
> **Status**: Production Live & Verified \| Immutable Release Baseline<br/>
> **Lead Architect**: Lead Architect (ChatGPT)<br/>
> **Implementation**: AntiGravity<br/>
> **Last Synchronized**: 2026-09-28

---

## 1. Project Identity

- **Project Name**: CyberShield X
- **Current Version**: `v62.5.3`
- **Release Commit**: `fa0da3cb4ecd3bd9c36e24e2d80ff8a6deaa9648`
- **Current Status**: **PRODUCTION LIVE & CERTIFIED**
- **Purpose**: CyberShield X is a full-stack, enterprise-grade cybersecurity operations, threat intelligence, and interactive CyberSOC platform. It combines an interactive CRT terminal workstation, an authoritative 111-tool catalog across 24 security archetypes, real-time multi-cloud telemetry ingestion, multi-tenant SOAR workflow automation, and an AI Security Copilot powered by Google Gemini 2.5 Flash.

---

## 2. Production Environment

| Component | Target Platform / Provider | Production URL / Identifier | Active State |
| :--- | :--- | :--- | :--- |
| **Primary Web Platform** | Cloudflare Pages (Custom Apex/Subdomain) | `https://www.cybershieldx.in` / `https://cybershieldx.in` | **LIVE (HTTP/2 200 OK)** |
| **Edge CDN Deployment** | Cloudflare Pages (`cybershield-x`) | `https://cybershield-x.pages.dev` (Deployment ID: `bef353f5`) | **LIVE (HTTP/2 200 OK)** |
| **Production API Gateway**| Render Web Service (`cybershield-x`) | `https://cybershield-x.onrender.com` | **LIVE (HTTP 200 OK)** |
| **Health Telemetry API** | Render Web Service Health Endpoint | `https://cybershield-x.onrender.com/health` | **LIVE (`{"status":"ok"}`)** |
| **Detailed Health API** | Render Database & AI Telemetry | `https://cybershield-x.onrender.com/api/health/details` | **LIVE (`{"database":"Connected"}`)**|
| **Database Cluster** | MongoDB Atlas (Multi-Region Replica Set) | Scoped via `MONGODB_URI` environment variable | **CONNECTED & HEALTHY** |
| **Active Frontend Bundle**| Cloudflare Edge Assets | `static/js/main.32a92555.js` / `static/css/main.d8eb9df8.css` | **SYNCHRONIZED (v62.5.3)** |

> *Security Note: Zero passwords, API secrets, JWT private keys, or cloud access tokens are stored in source or documentation. All secrets are managed exclusively through hosting provider environment injection.*

---

## 3. Architecture Overview

```mermaid
graph TD
    Client["React 18 SPA (Cloudflare Pages Edge CDN)"]
    Gateway["Express API Gateway (Node.js on Render)"]
    Socket["Socket.IO Real-Time Push (Tenant Rooms)"]
    CSI["CSI Host Native Execution Engine"]
    Fabric["Security Data Fabric & Aggregator"]
    Decision["Deterministic Decision Intelligence"]
    Copilot["CyboBot AI Copilot (Gemini 2.5 Flash / Fallback)"]
    Atlas[("MongoDB Atlas Database")]
    Cloud["Cloud Telemetry (AWS / GCP / Azure)"]
    ITSM["External SOAR / ITSM (Jira / ServiceNow / PagerDuty)"]

    Client -->|REST API over TLS| Gateway
    Client <-->|WebSocket Events| Socket
    Gateway -->|Authentication & Authorization| Atlas
    Gateway -->|Native Tool Dispatch| CSI
    Gateway -->|Correlation & Feeds| Fabric
    Fabric -->|Telemetry Projection| Decision
    Gateway -->|Advisory Chatbot| Copilot
    Cloud -->|POST /api/ingestion/cloud| Gateway
    ITSM <-->|Inbound / Outbound Webhooks| Gateway
```

CyberShield X follows a layered, decoupled service architecture:
1. **Presentation Layer**: React 18 single-page application hosted on Cloudflare Pages.
2. **API & Orchestration Layer**: Express gateway running on Render with dependency injection composition roots (`authComposition.js`, `csiComposition.js`, `chatbotController.js`).
3. **Execution Layer**: Centralized Native Terminal and CSI worker pool with sanitized system process execution.
4. **Data Fabric Layer**: Real-time event aggregator, correlation engine, and threat intelligence ingestion.
5. **Persistence Layer**: MongoDB Atlas with multi-tenant isolation and field-level encryption.

---

## 4. Frontend Architecture

- **Core Framework**: React 18, React Router v6, TailwindCSS, Framer Motion, Lucide Icons, Three.js.
- **Routing Structure**: Lazy-loaded route architecture (`client/src/App.jsx`) with route-level security via `PrivateRoute.jsx`.
- **Homepage (`HomePage.jsx`)**:
  - Restored approved cyber-dark aesthetic, terminal typography, glowing boundary borders.
  - Interactive canvas-rendered `BinaryMatrixRain.jsx` strictly restricted to `0` and `1` binary streams.
  - Dedicated **Have I Been Pwned Section**: Exactly ONE instance placed strictly immediately below platform stats and immediately above the security toolkit section (`hero -> stats -> hibp -> toolkit`). Outbound link directly routes to `https://haveibeenpwned.com/` (`target="_blank"`, `rel="noopener noreferrer"`) with strictly zero email collection.
  - Expressive 3D character avatars (`AnimatedToolAvatar.jsx`) in category cards.
- **Authentication Pages (`LoginPage.jsx`, `SignupPage.jsx`)**:
  - Original approved 2-column cyber-green layout with operational telemetry, circuit graphic backgrounds, and OTP flows.
  - Have I Been Pwned / Check Your Data sections are completely absent from auth views.
- **Dashboard (`DashboardPage.jsx`)**:
  - Standalone top-header presentation completely decoupled from legacy sidebars.
  - Header layout: Brand logo on left; Terminal launcher, authenticated operator username badge, and Logout on right.
  - Main view: 111 canonical tool cards organized in a 4-column responsive pastel grid.
  - Mobile responsiveness: Compact spacing, truncated username badge (`max-w-[85px]`), and responsive text collapsing (`hidden sm:inline`) guaranteeing **0px horizontal document overflow** across 375px and 390px viewports (DEFECT-210-01 resolution).
- **Tool Card System (`CyberToolCard.jsx`)**:
  - Uniform minimum height (310px), category pills, description fitting.
  - Exactly **ONE** primary action CTA: `"External Website ↗"`.
  - Dispatches to `ExternalAlternativesModal.jsx` with secure preview and zero credential forwarding.
  - Zero fake execution bars, run buttons, or embedded terminals inside tool cards.

---

## 5. Backend Architecture

- **Runtime & Web Framework**: Node.js 18+ and Express 4 on Render.
- **Entrypoint**: `server/index.js` initializing HTTP server, Socket.IO, database connectivity, and routing middleware.
- **Composition Roots (Dependency Injection)**:
  - `server/services/authComposition.js`: Assembles `AuthService`, `UserRepository`, `SessionService`, and `AuthController`.
  - `server/services/csiComposition.js`: Assembles `EngineRegistry`, `CsiExecutionPipeline`, `RiskScoringEngine`, and `ThreatCorrelationEngine`.
  - `server/controllers/chatbot/chatbotController.js`: Manages AI conversational agent instances, tool dispatchers, and memory adapters.
- **Security Middleware Stack**:
  - `helmet`: HTTP header security and policy enforcement.
  - `cors`: Restricted domain origin validation.
  - `express-rate-limit`: Rate limiting on auth, ingestion, and toolkit execution routes.
  - `express-mongo-sanitize`: NoSQL injection defense.
  - `authenticate` (`server/middleware/auth.js`): JWT bearer validation, session revocation verification, and account status check.
  - `socketAuth` (`server/middleware/socketAuth.js`): Authenticated WebSocket handshakes with authoritative tenant room assignment.

---

## 6. Data Architecture

- **Database Engine**: MongoDB 8 (hosted on MongoDB Atlas).
- **Object Modeling**: Mongoose 8 (`server/models/**`).
- **Database Catalog**: **82 canonical models** covering identity, tenant memberships, tool registry, telemetry, incident management, and security cases.
- **Exhaustive Data Reference**: See [CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md](file:///Users/anil/Documents/New%20project/cybershield-x/CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md) for complete field-level mapping of all 82 models.
- **Core Persistence Invariants**:
  - Multi-tenant isolation: All tenant-scoped schemas mandate `organizationId` indexed fields.
  - User field encryption: Sensitive user PII fields protected via `mongoose-field-encryption`.
  - Immutable audit logging: SOC and admin operations persisted to `AuditEvent.js` and `ActivityLog.js`.

---

## 7. AI Architecture

- **Conversational Workstation**: Mounted at `POST /api/chatbot/chat` (`server/controllers/chatbot/chatbotController.js`).
- **Active Model Provider**: Google Gemini 2.5 Flash via `@google/generative-ai` SDK with streaming response capability.
- **Fallback Heuristic Engine**: Local template reasoning engine (`server/services/platform/AIService.js`) activated seamlessly if cloud AI APIs are unreachable or offline.
- **Prompt Registry**: `server/ai/prompts/` (e.g. `ReasoningPrompt.md`, `security_guidance.prompt.md`).
- **Security Boundaries**:
  - Strict input boundary framing in `ContextBuilder.js` preventing prompt injection and jailbreak escapes.
  - Advisory-only output: AI suggestions are strictly read-only recommendations. Autonomous command execution is prohibited without explicit operator authorization.

---

## 8. Native Terminal

- **Route & UI**: Dedicated workstation mounted at `/terminal` (`client/src/pages/TerminalPage.jsx`).
- **Presentation**: `NativeTerminalConsole.jsx` featuring CRT styling, ANSI syntax colorization (`TerminalOutputFormatter.jsx`), and interactive preset command builder.
- **Host Execution Engine**: `server/services/HostEnvironmentService.js` and `server/routes/terminal.js`.
- **Security & Sandboxing Invariants**:
  - Binary allowlist: Strictly whitelisted binaries (`nmap`, `dig`, `curl`, `whois`, `openssl`, `ping`, `traceroute`).
  - Execution via `child_process.execFile` with explicit argument arrays—zero shell interpolation (`sh -c` is prohibited).
  - Strict regex sanitization: All target parameters validated against `^[a-zA-Z0-9_\-\.\:\/]+$`.
  - Process isolation: Automated 10-second kill timer enforced on all child processes.
  - Top-Level Isolation Invariant: The Terminal exists **only** at the `/terminal` route and the Dashboard header launcher. It is never embedded inside tool cards.

---

## 9. Security Tool Architecture

- **Canonical Count**: Exactly **111 tools** defined in `client/src/components/toolkit/toolConfig.js` and `server/utils/canonicalTools.js`.
- **Domain Coverage**: 24 security categories covering OSINT, Recon, Web Security, Cryptography, Cloud Security, Forensics, SAST/DAST, and Incident Response.
- **External Alternatives Policy (Frozen Baseline)**:
  - Defined in `client/src/components/toolkit/cards/externalAlternatives.js`.
  - Strict 1-to-1 parity: Every canonical tool maps to an approved, authoritative alternative entry (111/111).
  - **Tool Availability Classification**:
    - **41 ONLINE**: Genuinely usable, browser-based security utilities accessible directly in standard web browsers. Rendered with single primary CTA: `"External Website ↗"`.
    - **70 COMING_SOON**: Tools lacking a verified browser equivalent (CLI/desktop binaries, network daemons, proprietary agents). Rendered with `"COMING SOON"` status badge.
    - **GitHub Invariant**: GitHub is NEVER classified as an "External Website" (0 GitHub URLs in `externalWebsite`). Where a genuine official repository exists, it appears strictly as `"Official Repository ↗"` (66 verified repositories).
  - Modal navigation via `ExternalAlternativesModal.jsx` enforcing `target="_blank"`, `rel="noopener noreferrer"`.
  - Zero credential leakage: Outbound links strictly omit session tokens, passwords, API keys, and internal tenant parameters.
- **Authoritative Tool Reference**: Complete functional specifications for all 111 tools are documented in [CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md](CYBERSHIELD_X_TOOLS_AND_MODELS_MAP.md).

---

## 10. Authentication & Authorization

- **Supported Auth Flows**: User registration (`/signup`), login (`/login`), email verification with 6-digit OTP (`/verify-email`), password reset request (`/forgot-password`), and password reset confirmation (`/reset-password`).
- **Session Architecture**:
  - Stateless short-lived JWT access tokens (15-minute expiration) signed with `JWT_SECRET`.
  - HTTP-only refresh tokens stored in secure cookies (`path: /api/auth/refresh`).
  - Active session tracking with cryptographic `sessionId` in JWT payload.
  - Instant session revocation via `SessionService.revokeSession(sessionId)` on logout (`POST /api/auth/logout`) or session tampering detection.
  - Anti-hijacking session fingerprinting: SHA-256 hash of `User-Agent` + `IP` validated on protected requests.
- **Multi-Tenant Authorization**:
  - Authoritative tenant resolution via `req.organizationId` determined through user `Membership`.
  - Client-supplied tenant forgery headers rejected with HTTP 403 `TENANT_MISMATCH`.

---

## 11. Security Invariants

1. **SSRF Defense**: Strict input canonicalization (`normalizeScanTarget` in `validators.js`). Resolves and blocks private, loopback, and link-local IP addresses (RFC 1918, RFC 4193, `127.0.0.1`, `169.254.169.254`). HTTP clients enforce `maxRedirects: 0` via `secureAxios`.
2. **Command Injection Prevention**: Strict binary whitelisting, regex argument validation, and invocation via `execFile` without shell wrapper execution.
3. **AI Prompt Injection Guardrails**: System instructions isolated with strong delimiter framing; advisory-only recommendations; zero autonomous execution.
4. **Tenant Isolation**: Mandatory database indexing and filter enforcement on `organizationId` across all data queries and WebSocket rooms.
5. **Constant-Time Verification**: Webhook and authentication HMAC signatures verified using `crypto.timingSafeEqual`.
6. **Rate Limiting & DoS Mitigation**: Tiered rate limiters on auth (5 req/15m) and scan execution endpoints (30 req/min).
7. **Client-Side Privacy Boundaries**: External tool links never forward CyberShield X session tokens, user IDs, or internal infrastructure parameters.

---

## 12. Phase 80 — Cloud Telemetry Ingestion

- **Ingestion Route**: `POST /api/ingestion/cloud` (`server/routes/cloudIngestion.js`, `cloudIngestionController.js`).
- **Multi-Cloud Ingestion Adapters**:
  - AWS: `AwsCloudTrailAdapter.js`
  - GCP: `GcpCloudAuditAdapter.js`
  - Azure: `AzureActivityLogAdapter.js`
- **Telemetry Normalization**: Events parsed and mapped into the canonical `CloudTelemetryEvent.js` model with standardized timestamps (`eventTime`), actors, resource URIs, and risk classifications.
- **Classification Engine**: `ActionClassifier.js` matching security-critical cloud API calls using regex rules.
- **Data Lifecycle**: Tenant-scoped retention pruning bounded by `MAX_BATCH_SIZE` (500) respecting active legal holds.
- **Health Verification**: `GET /api/ingestion/cloud/health` reporting live provider operational status.

---

## 13. Phase 81 — External Workflow & ITSM / SOAR Integrations

- **Inbound Webhook Controller**: `server/controllers/inboundWebhookController.js` mounted at `/api/integrations/webhook/:provider`.
- **Supported Providers**: Jira, ServiceNow, PagerDuty, Slack, Microsoft Teams, Generic Webhooks.
- **Inbound Webhook Security**:
  - Constant-time HMAC signature verification (`ItsmSignatureVerifier.js`).
  - Query-parameter secret prohibition (secrets must reside in headers).
  - Strict 5-layer durable idempotency engine (`IntegrationSyncEvent.js`).
- **Approval Callback Bridge**: Bidirectional operator approval callbacks routed via `ExternalApprovalCallbackService.js` and pushed in real time via Socket.IO (`approval:external_callback`) to `ApprovalCenterPage.jsx`.
- **Accepted Architectural Limitation (Documented)**: Outbound dispatch queue currently operates via process-local in-memory queues (`MemoryQueue` in `queueProvider.js`); full durable queue persistence across process restarts is scheduled for Phase 82.

---

## 14. Important Application Routes

### Frontend Routes (`client/src/App.jsx`)
- `/`: Public Homepage (Hero, Stats, Have I Been Pwned, Toolkit)
- `/login`: 2-Column Cyber Authentication Form
- `/signup`: 2-Column Cyber Registration Form
- `/dashboard`: Protected 111-Tool Catalog & Header Command Bar
- `/terminal`: Centralized Native CyberSOC Terminal Console
- `/scans`: Scan Execution History & Reports
- `/intelligence`: Decision Intelligence & Threat Correlation Graph
- `/reports`: Executive Security Dossier Generator
- `/integrations`: External Cloud & ITSM Provider Configuration
- `/approvals`: SOAR Human-in-the-Loop Approval Center

### Backend API Route Families (`server/index.js`)
- `/health` & `/api/health/details`: System Telemetry & Health Checks
- `/api/auth`: Registration, Login, Session Management, Password Reset
- `/api/toolkit`: Security Tool Catalog Discovery & Execution
- `/api/terminal`: Host Native Binary Invocation & Capability Detection
- `/api/chatbot`: AI Security Copilot Conversational Assistant
- `/api/ingestion/cloud`: Phase 80 Cloud Telemetry Ingestion
- `/api/integrations`: Phase 81 ITSM & SOAR Webhook Management

---

## 15. Deployment Architecture

```
Developer Workspace (Git)
        │
        ├── Push to main branch ──────────────────────────────────┐
        │                                                         │
        ▼                                                         ▼
Cloudflare Pages Build                               Render Web Service
(client/build static deployment)                     (Continuous Deployment from main)
  ├── Edge CDN Caching                                 ├── Node.js 18+ Express Server
  ├── DDoS Mitigation & Universal SSL                  ├── Socket.IO Server Engine
  └── Domains:                                         └── Health Telemetry Endpoint
      ├── https://cybershieldx.in                          https://cybershield-x.onrender.com
      ├── https://www.cybershieldx.in                                  │
      └── https://cybershield-x.pages.dev                              ▼
                                                              MongoDB Atlas
                                                       (Multi-Region TLS Database)
```

### Environment Variable Categories
- **Server Required**: `PORT`, `NODE_ENV`, `MONGODB_URI`, `JWT_SECRET`, `JWT_REFRESH_SECRET`, `FRONTEND_URL`.
- **Server Optional (Integrations)**: `GEMINI_API_KEY`, `ADMIN_PASSWORD`, `SMTP_*`, `AWS_*`, `JIRA_*`, `SERVICENOW_*`.
- **Client Build**: `REACT_APP_API_URL`, `REACT_APP_SOCKET_URL`.

---

## 16. Development Commands

```bash
# Install all dependencies across root, server, and client
npm run install:all

# Start full full-stack local development environment
npm run dev

# Start server only (Node/nodemon on port 3001)
npm run dev:server

# Start client only (React dev server on port 3000)
npm run dev:client

# Execute client test suite (Jest + React Testing Library)
cd client && npm test

# Compile optimized client production build
npm run build

# Deploy client build directly to Cloudflare Pages
npx -y wrangler pages deploy client/build --project-name=cybershield-x --branch=main

# Execute server test suites
cd server && npm test

# Run isolated validator tests
cd server && npm test -- tests/validators.test.js
```

---

## 17. Testing & Quality Gates

- **Client Tests**: 10 test suites covering terminal workflows, tool cards, modal flows, and layout navigation (**122 / 122 PASS**).
- **Core Native Terminal Tests**: 2 test suites verifying command allowlisting, regex sanitization, process sandboxing, and execution constraints: `centralized_native_terminal_step1.test.js` [14] + `centralized_native_terminal_step2.test.js` [15] (**29 / 29 PASS**).
- **Phase 80 Multi-Cloud Telemetry**: 8 test suites verifying lifecycle, normalization, persistence, projection, and observability (**262 / 262 PASS**).
- **Phase 81 Enterprise Collaboration & SOAR**: 10 test suites verifying outbound dispatch, webhook security, approval callbacks, and connection testing (**273 / 273 PASS**).
- **Backend Security Hardening**: 6 test suites verifying SSRF validators, HMAC signatures, fail-closed semantics, IDOR, and production readiness (**115 / 115 PASS**).
- **Combined Security & Regression Baseline**: Full automated platform verification (**237 / 237 PASS [100%]**).
- **Build Quality Gate**: Production build compiles with zero errors (`react-scripts build`, Exit Code 0).
- **Differential Integrity**: `git diff --check` must return clean with zero whitespace or line-ending anomalies.
- **Secret Scan Gate**: Active codebase must contain zero committed credentials, tokens, or private keys.

---

## 18. UI/UX Invariants

1. **Strict Experience Separation**: Homepage and Dashboard are distinct spaces. Dashboard UI must never leak into Homepage.
2. **Matrix Aesthetic**: Homepage Matrix Rain strictly renders binary `0` and `1` streams.
3. **Dedicated HIBP Location**: Have I Been Pwned section exists exactly once on Homepage, strictly placed below Stats and above Toolkit, linking directly to `https://haveibeenpwned.com/` with zero native email input.
4. **Clean Standalone Dashboard**: Dashboard layout is header-only (Logo left; Terminal, Username, Logout right) with zero legacy sidebars.
5. **Mobile Responsiveness**: Zero horizontal document overflow (`scrollWidth <= viewport width`) at all viewports down to 375px.
6. **Single Tool Card Action**: All 111 tool cards render strictly one primary CTA: `"External Website ↗"`.
7. **No Card Terminal Leakage**: Native Terminal execution is strictly isolated to `/terminal`. Tool cards never contain embedded terminal buttons or fake run bars.

---

## 19. Current Known Limitations

- **Phase 81 Outbound Queue**: Outbound ITSM dispatch jobs operate via an in-memory queue (`MemoryQueue`) and in-memory retry timers. Pending dispatch jobs do not survive container restarts. Durable job queue persistence is scheduled for Phase 82.
- **Local AI Mode**: When running offline without a valid `GEMINI_API_KEY`, AI Copilot falls back to the deterministic heuristic Template Engine.
- **Browser Client Security**: In-browser tools (e.g. hash generators, client encoders) execute purely in browser memory; tools requiring raw network sockets (e.g. `nmap`) route to the Native Terminal host execution environment.

---

## 20. Maintenance Rules

1. **Source Code is Primary Truth**: Never assume documentation reflects reality if the active source code differs.
2. **Inspect Before Removal**: Verify all imports, routes, and package script dependencies before deleting any file.
3. **Preserve Invariants**: Never compromise multi-tenant isolation, SSRF filters, or command sanitization.
4. **Never Commit Secrets**: Secrets belong exclusively in hosting provider environment variables.
5. **Sanitize QA Commands**: Never embed passwords or active production JWTs in CLI runners or scripts.
6. **Continuous Documentation Synchronization**: When architecture materially changes, immediately synchronize `PROJECT_MASTER.md` and `CHANGELOG.md`.

---

## 21. Release Governance Sequence

Every production release of CyberShield X must strictly complete the following 8-stage pipeline:
1. **Scope Definition**: Strict boundary definition approved by the Lead Architect.
2. **Implementation**: Minimal code changes respecting existing layered architecture.
3. **Test Validation**: Client test suite (122 tests) and relevant backend test suites green.
4. **Build Compilation**: Optimized production bundle compiles with Exit Code 0.
5. **Git Safety & Clean Tree**: `git diff --check` clean, zero untracked source modifications.
6. **Production Deployment**: Cloudflare Pages deploy (`client/build`) and Render synchronization.
7. **Live Verification**: Automated browser CDP and API probe across all 6 responsive viewports (1440px to 375px).
8. **Documentation Freeze**: Update `CHANGELOG.md` and release sign-off.

---

## 22. Historical Release Summary

- **v62.5.3 (Current)**: Dedicated Homepage Have I Been Pwned placement; HIBP removed from Auth views; clean standalone Dashboard decoupled from sidebar; DEFECT-210-01 mobile header overflow fixed (0px overflow); standardized 111 cards with single External Website action; production verified live.
- **v62.5.2**: Restored original cyber aesthetic structure; restricted Matrix rain strictly to binary `0`/`1`; added 3D animated character avatars; aligned Dashboard cards with authoritative design reference.
- **v62.5.1**: Decommissioned 70 dead/legacy files; reconnected `/reset-password` flow; consolidated AI routing to canonical `/api/chatbot/chat`; deployed to Cloudflare Pages.
- **v62.5.0**: Master coverage audit of all 24 categories (100% dependency closure); Centralized Native Terminal workstation (`/terminal`); external alternatives modal flow.
- **v62.4.1**: Packaging and test isolation fix for Phase 80 runtime files; verified clean Render server bootstrap.
- **v62.4.0**: Multi-cloud telemetry ingestion (Phase 80) and external ITSM/SOAR workflow integrations (Phase 81).
- *Full release history is documented in [CHANGELOG.md](file:///Users/anil/Documents/New%20project/cybershield-x/CHANGELOG.md).*
