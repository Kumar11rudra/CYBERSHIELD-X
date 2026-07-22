# ADR-001: CSI Domain Isolation

**Status**: Accepted
**Date**: 2026-07-10
**Deciders**: Architecture Lead, Chief System Architect
**Categories**: Architecture, Domain Design

---

## Context

CyberShield V13 completed a full migration to a Repository Pattern, Constructor DI, and Thin Controllers. The next phase introduces a new intelligence sub-system: CyberShield Core Intelligence (CSI) V1.

The question is: how should CSI integrate into the existing V13 domain structure without polluting it?

## Decision

CSI is implemented as a **fully isolated domain** under `server/csi/`. It maintains its own:
- Interface contracts (`IIntelligenceEngine`, `INetworkClient`, `IEvidenceStorage`)
- Shared DTOs (`TargetDTO`, `FindingDTO`, `EvidenceDTO`, `RiskDTO`, `ReportDTO`)
- Composition Root (`csiComposition.js`)
- Repository layer (`server/repositories/csi/`)
- Prompt Registry (`server/ai/prompts/csi/`)

The existing V13 code (controllers, services, repositories, `platformComposition.js`) is **not modified**. The V13 `ExecutionDispatcher` integrates CSI by calling `csiComposition.csiOrchestrationService` as a native capability — a single registration line is the only addition to existing code.

## Consequences

**Positive**:
- Rollback requires removing `server/csi/`, `server/repositories/csi/`, and `csiComposition.js` — zero V13 impact.
- Future CSI versions can evolve independently.
- Testing is fully isolated.

**Negative**:
- Slight duplication of patterns (e.g., separate composition root).

## Alternatives Rejected

- **Embedding CSI inside existing Platform Services**: Rejected. Would pollute the Platform composition root and create cross-domain coupling.
- **Microservice approach**: Rejected for V1. Adds deployment complexity before the domain is proven.
