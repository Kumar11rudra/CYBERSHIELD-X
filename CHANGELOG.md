# Changelog

All notable changes to this project will be documented in this file.

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
