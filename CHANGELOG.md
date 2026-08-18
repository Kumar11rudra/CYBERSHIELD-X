# Changelog

All notable changes to this project will be documented in this file.

## [v34.0.0] - 2026-08-18
### Phase 36: Security Tool Catalog Expansion (Batch 1: Reconnaissance & Network Suite)
- **Subdomain Discovery Engine (`subfinder`)**: Upgraded to `TOOL_STATUS.LIVE`. Implemented live Certificate Transparency log ingestion (`crt.sh`) paired with DNS A-record resolvers, wildcard cleanup, and real-time live host identification.
- **DNSSEC Cryptographic Trust Chain Validator (`dnssec-audit`)**: Upgraded to `TOOL_STATUS.LIVE`. Implemented DNS over HTTPS (DoH) DS and DNSKEY query engine with cryptographic delegation verification and actionable RFC 6781 guidance.
- **IPv6 Dual-Stack & Connectivity Auditor (`ipv6-checker`)**: Upgraded to `TOOL_STATUS.LIVE`. Implemented AAAA record resolution, IPv4/IPv6 dual-stack readiness score calculation, and NAT64 compatibility insights.
- **MAC OUI Hardware/Vendor Parser (`mac-lookup`)**: Upgraded to `TOOL_STATUS.LIVE`. Implemented offline database containing 40+ enterprise hardware vendors (Apple, Cisco, Dell, Intel, TP-Link, Espressif, Raspberry Pi, etc.) with live registry fallback.
- **CVE Vulnerability & CVSS 3.1 Inspector (`cve-lookup`)**: Added to `VULNERABILITY ASSESSMENT` and upgraded to `TOOL_STATUS.LIVE`. Integrated instant offline high-severity CVE cache (Log4Shell, Spring4Shell, Heartbleed, EternalBlue, XZ Backdoor) with CIRCL live query fallback.
- **Dedicated GUI Visual Cards (`ScannerToolView.jsx`)**: Enhanced scanner interface with dynamic visual cards for subdomains (live IP badges, copy actions) and IPv6 dual-stack readiness widgets alongside real-time terminal output.
- **Security & SSRF Hardening (`networkToolService.js` & `toolkitController.js`)**: Guarded all live network probes with asynchronous hostname resolution and loopback/private IP blocks.
- **Verification**: Created `server/tests/batch1_recon_network_tools.test.js` (8/8 tests passing) and confirmed production build (`npm run build` exit code 0).

## [v33.1.0] - 2026-08-18
### Phase 35: Copy De-AI-ification & Simple US English Translation Across All Pages
- **Localization Overhaul (`en.json` & `hi.json`)**: Replaced robotic, sci-fi, and overly academic jargon across all 763 lines of `client/src/locales/en.json` and synchronized `client/src/locales/hi.json`. Removed terms like "Aegis", "Neural Node", "Nexus Command", "Self-Destruct", "Global Hive Feed", "Quantum Vault", replacing them with humanized, accessible cybersecurity terminology.
- **Auth Pages Transformation (`SignupPage.jsx`, `LoginPage.jsx`, `AdminLoginPage.jsx`, `VerifyEmailPage.jsx`)**: Updated headers from "Nexus Registry" to "Create Account", "Central Command Access Granted" to "Admin Login Successful", and updated sample placeholders from `operator@nexus.io` to `user@example.com`.
- **Security Standards & Team Transformation (`SecurityPosturePage.jsx`, `TeamPage.jsx`)**: Humanized security headers to "CyberShield X Security Standards", replaced military clearance labels with clear functional roles ("FOUNDER & LEAD", "CORE SPECIALIST"), and simplified action CTAs to "VIEW PROFILE →" and "ADMIN CONSOLE →".
- **Tool Catalog Category Modernization (`toolConfig.js`)**: Rewrote purpose and description fields for all 24 cybersecurity categories in clean, actionable US English.
- **Pages & Components Cleanup (`ThreatIntelligencePage.jsx`, `VaultPage.jsx`, `SecurityCopilot.jsx`, `CyberTerminalModal.jsx`)**: Updated status messages, empty states, and terminal startup headers to clear, user-friendly language.
- **Verification**: Verified zero broken JSX tags, zero missing translation keys, and successful client production build (`npm run build` exit code 0).
### Phase 31: Partial-to-Live Security Catalog Expansion (16 Live Models)
- **AI Remediation Planner Live Activation**: Transitioned `remediation` tool to `TOOL_STATUS.LIVE`. Upgraded `server/services/remediationService.js` to reuse shared `cache.js` (24h TTL) with Gemini 2.5 Flash, deterministic NVD signature fallbacks, and IDOR ownership authorization.
- **Threat Breach Checker Live Activation**: Transitioned `breach` tool to `TOOL_STATUS.LIVE`. Implemented SHA-1 k-Anonymity range queries (NIST SP 800-63B) in `server/services/breachService.js` with zero-knowledge password caching guarantees, 1-hour cache on prefix ranges, and email/phone checks.
- **Authoritative Catalog Expansion**: Reconciled the security catalog from 14 Live Models to **16 Live Models** (16 LIVE / 0 PARTIAL / 94 UPCOMING).
- **Dashboard Dynamic Derivation**: Dynamically computed live model counts across dashboard views from the authoritative registry.
- **Verification**: Created `server/scripts/test_phase31_live_models.js` passing all live model assertions.
### Production Hardening Maintenance Patch
- **Trust Proxy Hardening**: Configured `app.set('trust proxy', 1)` in `server/index.js` for accurate originating client IP resolution and per-client rate limit accounting behind Cloudflare Pages / Render reverse proxies.
- **X-Request-Id Validation**: Enforced strict regex validation (`/^[a-zA-Z0-9_-]{1,64}$/`) for incoming `X-Request-Id` headers to eliminate header injection and oversized log payloads; falls back cleanly to server-generated UUIDs on invalid inputs.
- **Safe Uncaught Exception Shutdown**: Hardened `uncaughtException` listener to initiate idempotent graceful shutdown (`shutdown('uncaughtException', 1)`) so container supervisors (Docker/Render) can cleanly restart the process rather than running with corrupted state.
- **Verification**: Created `server/scripts/test_v29_4_1_verification.js` passing 7/7 verification test assertions.

## [v29.4.0] - 2026-08-15
### Observability, Process Resilience, AI Quota Defense & Database Index Optimization
- **Request Correlation Tracing**: Added `X-Request-Id` correlation middleware; surfaced request IDs in Winston logger context and client 500 error responses (`code: 'NEXUS_CORE_FAULT'`).
- **AI Quota Protection Engine**: Applied dedicated `aiLimiter` rate limiting (15 requests / 15 minutes) on `/api/ai/*` to guard Google Gemini API usage.
- **Database Background Index Optimization**: Added compound indexes on `Vulnerability` (`{ status: 1, slaDeadline: 1, slaStatus: 1 }`), `Watchlist` (`{ isActive: 1, nextRunAt: 1 }`), and `AIAnalysis` (`{ scanId: 1, model: 1 }`).
- **AI Generation Telemetry**: Persisted `durationMs` and metadata in `AIAnalysis` records; formatted findings as clean strings to guarantee React and PDF export stability.
### Final Production Release & Custom Domain Activation
- **Cloudflare Pages Production Deployment**: Deployed compiled React SPA build to Cloudflare Pages project `cybershieldx` (`cybershieldx.pages.dev`) with `REACT_APP_API_URL=https://cybershield-x.onrender.com`.
- **Render Backend Verification**: Verified `https://cybershield-x.onrender.com/health` returns HTTP 200 OK. Enforced CORS allowed origin controls for `https://cybershieldx.in` and `https://cybershieldx.pages.dev`.
- **Custom Domain Activation (`cybershieldx.in`)**: Checked GoDaddy domain WHOIS status confirming identity verification completed and `clientHold` cleared. Provided GoDaddy DNS setup mapping for Cloudflare Pages CNAME configuration.
- **Production Verification & Test Pass**: Verified `npm run verify:release` (exit 0) and `npm run verify:staging` (exit 0). All 8 core production Jest test suites (79/79 tests) passing cleanly.
- **SEO & Search Console Readiness**: Verified `sitemap.xml` (7 URLs) and `robots.txt` canonical URL alignment to `https://cybershieldx.in/`.

## [v27.0.0] - 2026-08-11
### Final Production Readiness & Launch Gate (CODE READY)
- **Release Verification CLI**: Implemented `server/scripts/releaseCheck.js` CLI registered under `npm run verify:release` in `server/package.json` and root `package.json`. Non-destructively audits infrastructure blueprints (`render.yaml`), build manifests (`_headers`, `_redirects`), release checklists, and target deployment alignment.
- **Operator Launch Checklist**: Created [`docs/RELEASE_CHECKLIST.md`](file:///Users/anil/Documents/New%20project/cybershield-x/docs/RELEASE_CHECKLIST.md) providing a 15-section launch checklist categorizing automated checks, operator cloud deployment actions, and post-deployment verification procedures.
- **Automated Tests**: Added `release_verification.test.js` (6/6 passing, 85 total backend tests passing across 9 test suites).
- **SEO & Canonical Domain Integration (Phase 22)**: Replaced generic domain placeholders with `https://cybershieldx.pages.dev` in `index.html`, `sitemap.xml`, and `robots.txt`. Added OpenGraph, Twitter Card, and Schema.org JSON-LD metadata.
- **GitHub Open Source Governance (Phase 23)**: Created official repository standards files: `LICENSE` (MIT), `CONTRIBUTING.md`, `SECURITY.md`, `.github/ISSUE_TEMPLATE/bug_report.md`, `.github/ISSUE_TEMPLATE/feature_request.md`, and `.github/PULL_REQUEST_TEMPLATE.md`.

## [v26.0.0] - 2026-08-11
### Nexus Toolkit 2.0: Live Model Performance & Timeout Hardening Engine
- **Live Model Response Deadlines**: Enforced a global **10–15 second maximum execution response window** across all 14 live defensive models in CyberShield X.
- **Timeout Fallback Resilience**: Implemented `Promise.race()` 10,000ms hard timeouts and structured degraded fallback contracts (`status: 'DEGRADED_TIMEOUT'`) on WHOIS, DNS, SSL, and network probes to prevent infinite loading or Express crashes.
- **Active Vercel Removal**: Updated `DeploymentConfigValidator.js` to categorize unconfigured Vercel environment variables as `NOT_ACTIVE_TARGET`, reflecting the active Cloudflare Pages + Render + MongoDB Atlas target architecture.
- **Automated Tests**: Created `live_model_performance.test.js` verifying model timings, local utility performance (`< 100ms`), timeout fallbacks, and zero credential exposure (7/7 passing, 68 total backend tests passing).

## [v25.0.0] - 2026-08-11
### Pre-Flight Staging Verification CLI & Production Operator Runbook
- **Staging Verification CLI**: Implemented `server/scripts/stagingCheck.js` CLI registered under `npm run verify:staging` in `server/package.json` and root `package.json`. Non-destructively audits static build assets (`client/build/_headers`, `_redirects`), CORS origin regex security, health probes, and production configuration schemas without secret exposure.
- **Production Operator Runbook**: Created [`docs/DEPLOYMENT_RUNBOOK.md`](file:///Users/anil/Documents/New%20project/cybershield-x/docs/DEPLOYMENT_RUNBOOK.md) providing step-by-step deployment guidance for Cloudflare Pages (Frontend SPA), Render Web Service (Backend API via `render.yaml`), and MongoDB Atlas cluster.
- **Automated Tests**: Created `staging_verification.test.js` verifying CLI instantiation, manifest file detection, security header verification, CORS regex matching, and zero credential exposure (10/10 passing, 61 total backend tests passing).

## [v24.0.0] - 2026-08-11
### Cloudflare Pages & Render Operational Hardening & Production Deployment Readiness
- **Cloudflare Security Headers**: Created `client/public/_headers` establishing Content Security Policy (CSP), Strict-Transport-Security (HSTS), X-Frame-Options (`DENY`), X-Content-Type-Options (`nosniff`), and Referrer-Policy alongside existing `/* /index.html 200` SPA fallback in `client/public/_redirects`.
- **Render Backend CORS Hardening**: Enhanced `server/index.js` CORS origin validator to support `CLIENT_URL`, `ALT_CLIENT_URL`, `https://cybershieldx.pages.dev`, and legitimate Cloudflare Pages deployment aliases (`https://*.pages.dev`) via strict regex pattern matching without wildcard fallback.
- **Render Infrastructure Blueprint**: Created `render.yaml` defining Node environment, `server/` root directory, `npm start`, `/health` health check path, and required environment variable definitions without hardcoded credentials.
- **Production Config Validator**: Created `server/scripts/verifyProductionConfig.js` for non-destructive environment variable validation without credential exposure or network dependencies.
- **Automated Tests**: Created `production_readiness.test.js` verifying CORS regex security, security headers presence, SPA fallback preservation, `/health` contract, and dry-run environment validation (10/10 passing, 51 total backend tests passing).

## [v23.0.0] - 2026-08-11
### Nexus Deployment Health Correlation & Configuration Validation
- **Deployment Health Correlator**: Created `DeploymentHealthCorrelator.js` to automatically link 30-minute system health anomalies (error rate > 5%, API latency > 300ms, DB disconnects) with recent deployment history.
- **Provider Config Validator**: Created `DeploymentConfigValidator.js` to audit environment variable formatting and readiness scores across GitHub Actions, Vercel, and Render with zero secret exposure.
- **Admin Correlation Endpoint**: Registered `GET /api/admin/deployments/correlation` protected by `authenticate` and `requireAdmin` RBAC guards.
- **SOC Dashboard Panels**: Extended `NexusDeploymentHealth.jsx` with Deployment Health Correlation Risk Panel (`STABLE`, `CORRELATED_DEGRADATION`, `POST_DEPLOY_LATENCY_SPIKE`, `NO_RECENT_DEPLOYMENTS`) and Provider Configuration Readiness Matrix (`READY`, `MISSING CONFIG`).
- **Automated Tests**: Created `deployment_correlation.test.js` covering RBAC guards (401/403/200), correlation calculation algorithms, config readiness scores, and leak audits (10/10 passing).

## [v22.0.0] - 2026-08-11
### Nexus Deployment Data Integrity & Production Verification
- **Zero-Fabrication Enforcement**: Eliminated inferred `LIVE` deployment statuses (`NODE_ENV === 'production'`) in `DeploymentService.js`. Deployment status becomes `LIVE` or `PASSED` strictly when backed by authoritative provider responses.
- **Authoritative Pipeline Visualizer**: Sourced `BUILD`, `TEST`, and `DEPLOY` pipeline stages directly from provider API responses. Unconfigured stages report `NOT_CONFIGURED` instead of defaulting to `PASSED`.
- **Metadata Nullability Normalization**: Server-side normalization converts unconfirmed commit SHAs, branches, deployment timestamps, and duration metrics to `null`.
- **Frontend Fallback Sanitization**: Purged unsafe positive fallbacks from `NexusDeploymentHealth.jsx`. UI cleanly renders `UNKNOWN` and `NOT AVAILABLE` for null metadata.
- **Data-Integrity Automated Tests**: Added 5 new tests to `deployment_observability.test.js` covering inferred status elimination, pipeline stage integrity, and null metadata normalization (14/14 passing).

## [v21.0.0] - 2026-08-11
### Nexus Real Deployment Observability
- **Deployment Adapter Architecture**: Created `DeploymentService.js` and decoupled adapters (`GitHubDeploymentAdapter.js`, `VercelDeploymentAdapter.js`, `RenderDeploymentAdapter.js`) with 3-second timeouts for server-side REST telemetry.
- **Admin Deployment Endpoint**: Registered `GET /api/admin/deployments` protected by `authenticate` and `requireAdmin` RBAC guards.
- **Pipeline Visualizer & History**: Extended `NexusDeploymentHealth.jsx` with visual CI/CD pipeline stage indicators (`BUILD` → `TEST` → `DEPLOY` → `HEALTH CHECK`), provider deployment cards, bounded deployment history table (max 10 records), and metadata inspection drawer.
- **Strict Read-Only & Zero-Fabrication**: Purely observational architecture without write buttons. Returns `NOT_CONFIGURED` when tokens are unconfigured without fabricating fake deployment records.
- **Security Audit**: Verified zero exposure of provider tokens, API keys, JWT secrets, or DB URIs.
- **Automated Tests**: Created `deployment_observability.test.js` covering RBAC guards (401/403/200), provider adapter fallbacks, failure isolation, history bounds, and leak audits (9/9 passing).

## [v20.0.0] - 2026-08-11
### Nexus Command — Deployment & Infrastructure Observability
- **System Health Aggregator**: Built `SystemHealthService.js` to collect live telemetry across Backend API, MongoDB, Auth Engine, AI/CyboBot node, Threat Intel providers, and Deployment status.
- **Admin Observability Endpoint**: Registered `GET /api/admin/system-health` protected by `authenticate` and `requireAdmin` RBAC guards.
- **Enterprise SOC Dashboard**: Created `NexusDeploymentHealth.jsx` UI component in `AdminPage.jsx` with System Overview cards, Deployment Status panel, Connected Services grid, 30s auto-polling, and manual refresh controls.
- **Zero Fake Data Policy**: Transparently displays `DEPLOYMENT MONITORING NOT CONFIGURED` / `DEFERRED — DEPLOYMENT PROVIDER INTEGRATION REQUIRED` when live deployment provider APIs are unconfigured.
- **Security Audit**: Verified zero exposure of JWT secrets, database connection URIs, passwords, API keys, or private tokens.
- **Automated Tests**: Created `admin_system_health.test.js` covering RBAC guards (401/403/200), telemetry contracts, degraded status handling, and leak audits (7/7 passing).

## [v18.0.0] - 2026-08-10
### Complete Security Audit, Attack-Surface Review & Production Hardening
- **Centralized SSRF Validator**: Created centralized `ssrfValidator.js` to normalize IP addresses (hex, octal, decimal, mixed, IPv4-mapped IPv6) and check private/loopback/multicast address boundaries.
- **DNS Rebinding Prevention**: Integrated connection-time socket DNS validation (`ssrfLookup`) inside `HttpClient.js` and `HttpAdapter.js` to block DNS-rebinding windows.
- **Recursive Redirect SSRF Checks**: Strengthened outbound HTTP clients to recursively re-validate redirect locations against SSRF address ranges before execution.
- **Role Verification Harmonization**: Standardized admin authorization checks to the canonical lowercase singular string `role === 'admin'`.
- **CORS Hardening**: Enforced Express and Socket.IO origin checks to restrict arbitrary host reflections, allowing only explicit development localhost origins and production `CLIENT_URL` configurations.
- **Middleware Cleanup**: Synced sameSite, secure, and HTTPOnly attributes during cookie removal. Deduplicated dual Helmet and IP firewall middleware registrations.
- **Legacy Integration Parity**: Fixed broken imports in `routes/workflow.js`, resolved constructor parameter wiring mismatches in `RoleRepository` and `PermissionRepository`, and added auto-slug generation to `Organization` schema validation.

## [v17.0.0] - 2026-08-09
### Zero-Cost Public-First Access & Security Hardening
- **Zero-Cost Access**: Cancelled paid WhatsApp messaging dependencies. Signup is a simple, one-step account registration details form.
- **Public-First Access**: Opened DNS, WHOIS, SSL/TLS, technology stack, and other scans to public guest runs without requiring login.
- **Authentication Download Gate**: Secured PDF report downloads behind a server-side authentication gate (401/403) checking user identity.
- **IDOR / BOLA Prevention**: Added owner check inside report generation; returns 403 Forbidden if a user attempts to fetch another user's scan report.
- **SSRF Scanner Hardening**: Strengthened `isPrivateOrLoopback()` to parse full URLs, extract hostnames, and strip port numbers, preventing loopback scan bypasses.
- **Safe Return-To Navigation**: Implemented relative URL routing validation (`getSafeReturnUrl`) blocking open-redirect attempts during download gates.
- **Cleanup**: Obsoleted and deleted `WhatsAppOTPService.js`, `whatsapp_otp.test.js`, and removed all verification endpoint dependencies.

## [v16.0.0] - 2026-08-09
### Two-Step Registration & WhatsApp OTP Authentication Migration
- **Two-Step Registration Flow**: Replaced the legacy 3-step account creation with a clean, exactly 2-step registration process (Step 1: Account Details, Step 2: WhatsApp OTP Verification).
- **Pluggable OTP Architecture**: Created `WhatsAppOTPService` implementing secure 6-digit random code generation, SHA256 hashing before persistence, a 5-minute TTL, a maximum of 3 failed attempts, and a 60-second resend cooldown timer.
- **Pending Account Lockout**: Added user account status isolation (`status: 'pending'`, `'active'`, `'suspended'`). New signups are created in a `'pending'` state and prevented from logging in until they successfully verify their WhatsApp OTP.
- **Security Validation Controls**: Implemented backend input validation checking for duplicate emails, usernames, and phone numbers, returning generic validation errors to prevent credential enumeration.
- **Development OTP Bypass**: Integrated a development verification mechanism writing the current OTP to `scratch/last_whatsapp_otp.txt` inside non-production workspaces for test automation without stdout leaks.
- **Frontend Signup Redesign**: Updated `SignupPage.jsx` and `AuthContext.jsx` to manage the transition from Account Details to WhatsApp verification with active cooldown countdowns and automatic dashboard redirection upon success.
- **Programmatic Testing**: Created `whatsapp_otp.test.js` validating signup states, cooldown boundaries, failed attempt lockouts, duplicate checks, and replay protection. All tests passed.

## [v15.1.0] - 2026-08-09
### Database Foundation & Core Capability Registry
- **Capability Registry Model**: Implemented `ToolRegistry` model containing fields for tool ID, permissions, roadmap status, and custom metadata.
- **Auditable Execution Logs**: Created `ToolExecution` model to capture execution status, timings, durations, and result signatures without storing credentials or sensitive PII.
- **Verification Schema Upgrade**: Modified `Verification` model with new helper parameters (destination, purpose, channel, status, and cooldownUntil) to support the future WhatsApp OTP two-step registration flow.
- **Reconciliation Seed Script**: Built `seedTools.js` to automatically synchronize the authoritative 110-tool catalog from `toolConfig.js` to MongoDB, with detailed counts and safety overrides.
- **Validation Suite**: Added `database_integration.test.js` to programmatically verify schema constraints, unique indices, and reconciliation statistics.

## [v15.0.0] - 2026-08-09
### Nexus Toolkit 2.0 Redesign & Dedicated Team Portal
- **Authoritative Catalog**: Unified tool settings and metadata into a single-source configuration file `toolConfig.js` supporting dynamic statistics calculation and categorization.
- **Category Grid Navigation**: Implemented custom landing page cards mapping security disciplines to URL parameters, filtering the main toolkit instantly.
- **Route State History**: Added category state tracking in React Router to return to filtered tabs dynamically on Back button clicks.
- **Visual Status Badges**: Added visually distinct tags mapping LIVE, PARTIAL, and COMING SOON tools correctly to their implementation state.
- **Roadmap Handling**: Disabled execution paths and blocked mock results for upcoming models, displaying honest, premium roadmap dossier details.
- **Partial Capabilities Banner**: Created status notification bars explaining Gemini AI key dependencies on the Remediation and Breach Checker tools.
- **Company Team Page**: Extracted the core team grid from `HomePage.jsx` into a dedicated `/team` route, adding animated profile cards and a dossier viewer modal.
- **Unreachable Code Cleanup**: Deleted over 1,000 lines of legacy, dead chatbot codes from `ToolDetailPage.jsx`, simplifying it to a lightweight orchestrator.
- **AI Assistant Routing**: Configured the AI Assistant's backend controller to utilize real Gemini API capabilities when configured, or transparently notify users if offline.
- **E2E Validation & Hardening**: Fixed a missing export on the private IP validator; mapped breach and remediation endpoints to their functional backend controllers; enforced strict COMING_SOON response schemas for upcoming models.
- **SSRF Redirect Boundary Control**: Added `0.0.0.0/8` checks and integrated active, recursive redirect SSRF resolution inside `HttpClient` to secure outbound network queries.

## [v14.0.0-rc.1] - 2026-08-09
### Production Launch Stabilization & Hardening
- **Authentication Improvements**: Complete removal of dead Google OAuth components; implemented `/check-username`, `/request-email-otp`, and `/verify-email-otp` endpoints; fixed sign-up parameter destruction to preserve profile details (mobile number, age, country, gender).
- **Nexus Tools Corrections**: Fixed parameter mapping mismatches for SMS and UPI scanners; wrapped passive analyzer payloads (Phishing, SMS, UPI, WHOIS, SSL) inside structured formats expected by the UI.
- **Reference & Stub Implementations**: Fixed ReferenceError (unimported `axios`) inside breach service; resolved stubs in breach and remediation controllers to connect them to MongoDB models and fallback indicators.
- **SEO & Compliance Pages**: Added robots.txt and sitemap.xml domain placeholders; integrated premium dark-mode Cookie Policy, Acceptable Use, Security Info, and Contact pages with crawlable navigation.

## [CSI-v1.0.0-M6.5] - 2026-07-12
### CyberShield Core Intelligence — Executive Report Generation Layer
- **Stateless Exporters**: Introduced perfectly decoupled Markdown, HTML, JSON, SARIF, and STIX rendering pipelines mapped to externalized, frozen templates.
- **Strict Presentation Boundary**: The Reporting layer is guaranteed incapable of logic mutation or hallucinated finding injection.
- **Immutability Enforcement**: DTO payloads (ExecutiveReportDTO, ExportBundleDTO) undergo recursive freezing preceding export logic.

## [CSI-v1.0.0-M6.4-PhaseC] - 2026-07-12
### CyberShield Core Intelligence — AI Reasoning Layer
- **Prompt Registry**: LLM templates externalized from code to strictly validated file schemas with SHA-256 integrity checksums.
- **Strict Validations**: Rejection of UUID hallucinations, payload injections (HTML/Markdown code blocks), and contextual bloat.
- **ILLMProvider**: Deeply decoupled provider abstraction guaranteeing logic neutrality from AI vendors.

## [CSI-v1.0.0-M6.4-PhaseB] - 2026-07-12
### CyberShield Core Intelligence — Threat Correlation Engine (Deterministic Graph)
- **Configuration-Driven Logic**: Correlation mapped definitively via `correlation-rules.json` avoiding any AI heuristics.
- **Lexicographical Graph Generation**: UUID seeding and explicit sorting ensure identical directed-graph outputs natively across regression suites.
- **Fail-Fast Validation**: Averted node, edge, finding duplicate injections alongside explicitly defined path cycle blocking prior to score aggregation.

## [CSI-v1.0.0-M6.4-PhaseA] - 2026-07-12
### CyberShield Core Intelligence — Risk Engine (Deterministic Baseline)
- **Configuration-Driven**: Extracted all weights, categories, and normalizations to `risk-rules.json` and `risk-weights.json`.
- **Pure Functions**: Risk computation operates purely mathematically via `RiskScoringEngine`, with no network, filesystem, or AI integration.
- **Deep Immutability**: All inputs (`FindingDTO[]`) and outputs (`RiskResultDTO`, `RiskFactorDTO`) strictly enforce deep `Object.freeze()`.
- **Traceability**: `RiskExplanationBuilder` outputs machine-readable `calculationTrace` documenting every individual score step for mathematical audibility.
- **Validation**: Enforced synchronous config checks ensuring no duplicate rules, invalid domains, or negative weights map to runtime logic.

## [CSI-v1.0.0-M6.3] - 2026-07-11
### CyberShield Core Intelligence — Architecture Corrections & Certification
- **Concurrency Constraints**: Replaced chunked iteration with `WorkerPool` ensuring predictable fail-fast tasks capped identically per limits.
- **Hash Integrity**: Added automated Read-After-Write SHA-256 verifications via `LocalEvidenceStorage`.
- **Regression Lock**: Baseline raw payloads locked against exact deterministic finding signatures verifying 0-drift.
- **Stress Hardening**: Handled HTTP bounds for `2MB` memory buffers, socket aborts, and infinite redirects directly emitting deterministic Engine findings.

## [CSI-v1.0.0-M6.2] - 2026-07-11
- **DnsEngine**: Resolves A, AAAA, MX, TXT, SOA, NS, and DMARC. Detects missing SPF/DMARC, absent MX/NS, and fast-flux structures without active probing.
- **WhoisEngine**: Queries TCP port 43 with automated fallback to RDAP (HTTPS/JSON). Extracts creation date, expiry date, and registrar data. Flags newly registered (<90 days) and expiring (<30 days) domains, and detects privacy-protected WHOIS details.
- **SslEngine**: Performs raw TLS handshakes (rejectUnauthorized: false). Captures X.509 chains. Checks expiry dates, self-signed certificates, SAN mismatch, weak ciphers (e.g. RC4, DES), and deprecated protocols (e.g. TLSv1.0, SSLv3).
- **Network Clients**: Implemented `DnsClient`, `TcpClient`, and `TlsClient` exclusively with Node.js built-ins (`dns.promises`, `net`, `tls`). No third-party network libraries.
- **Immutability & Evidence**: Implemented `LocalEvidenceStorage`. All raw network responses are persisted to disk and SHA-256 hashed *before* being processed into findings.
- **Diagnostics & Safety**: Enforced strict timeouts. Implemented comprehensive error model (`CsiTimeoutError`, `CsiDnsError`, etc.). All engines expose `.healthCheck()` against stable public targets.
- **Testing**: 42 Contract tests, 25 Unit tests, and 10 Integration tests passing.

## [CSI-v1.0.0-M6.1] - 2026-07-10
- **IIntelligenceEngine**: Abstract base class enforcing 6-method contract (`initialize`, `supports`, `collect`, `validate`, `healthCheck`, `metadata`) with `CsiNotImplementedError` guard.
- **INetworkClient / IEvidenceStorage**: Abstract interfaces enabling future protocol and storage swaps without touching engine code.
- **Shared DTOs** (5 classes): `TargetDTO`, `EvidenceDTO`, `FindingDTO`, `RiskDTO`, `ReportDTO` — all `Object.freeze()`'d and immutable. `FindingDTO` includes full forensic traceability: `engineVersion`, `collectionTime`, `executionId`, `evidenceHash`.
- **TargetNormalizer**: Pure normalization — strips scheme, trailing slashes, port suffixes, IPv6 brackets.
- **TargetClassifier**: RFC-compliant classification into `ip`, `domain`, `url`, `email` with `CsiValidationError` on rejection.
- **EngineRegistry**: Central resolution registry with feature-flag support and passive-first ordering.
- **csiComposition.js**: Isolated Composition Root — zero modifications to existing `platformComposition.js`.
- **Architecture Decision Records**: ADR-001 through ADR-005 created in `docs/architecture/adr/`.
- **CSI Capability Matrix**: Official reference for all 12 engines, timeouts, and risk contributions.
- **Verification**: 31/31 tests passing. Zero V13 files modified. Rollback-safe.

## [v13.0.0-rc.1] - 2026-07-09
### Architecture Overhaul
- **Repository Pattern**: Extracted all Mongoose and database dependencies into 30 isolated Repositories. Controllers and Services no longer access the database directly.
- **Constructor Dependency Injection**: Completely eliminated static imports of business logic and models. All dependencies are now injected via Composition Roots.
- **Provider Abstraction**: Established `ProviderManager` architecture for third-party integrations (AI, Threat Intelligence, Breach data) with built-in failover capabilities.
- **Data Transfer Objects (DTOs)**: Enforced immutable DTOs for all data flowing in and out of the API.
- **Thin Controllers**: Rewrote all 28 controllers to contain zero business logic. Controllers now solely handle HTTP mechanics, delegating work to injected Services.

### Security Enhancements
- **Vault Crypto Isolation**: Decoupled AES-256-GCM encryption/decryption into an isolated `VaultCryptoProvider`, keeping the crypto path strictly separated from the business logic layer.
- **Secrets Management**: Refactored provider keys and vault keys to inject securely through environment variables.
- **Audit Logging**: Enhanced `ActivityLogRepository` injection across all critical services (Auth, Vault, Scans) to guarantee non-repudiable audit trails.

### Performance
- **Aggregation Optimizations**: Decoupled `DashboardAggregationService` and `AnalyticsAggregationService` for scalable reporting.
- **Failover Redundancy**: Configured Threat Intelligence and AI providers to gracefully fallback locally upon rate-limiting or network timeouts.
