# ADR-002: Engine Registry Pattern

**Status**: Accepted
**Date**: 2026-07-10
**Deciders**: Architecture Lead, Chief System Architect
**Categories**: Architecture, Engine Design

---

## Context

CSI V1 introduces 8 intelligence engines. As the platform grows, more engines will be added (Subdomain Discovery, Certificate Transparency, OSINT) in future versions. A mechanism is needed to resolve the correct engine(s) for a given target type without coupling the Orchestrator to engine implementations.

## Decision

Introduce an **`EngineRegistry`** as the single point of engine resolution.

- All engines are registered via `registry.register(engine)` inside `csiComposition.js`.
- The `CsiOrchestrationService` never instantiates engines directly.
- Engine selection is performed via `registry.resolve(targetDTO)`, which calls `engine.supports(targetDTO)` on all registered engines and returns the matching subset.
- Engines are ordered passively-first, actively-second, by the Registry's internal sort.

The `ExecutionDispatcher` uses the EngineRegistry exclusively — never direct engine imports.

## Consequences

**Positive**:
- Adding a new engine in V2 requires only: (a) implementing `IIntelligenceEngine`, (b) registering it in `csiComposition.js`, (c) setting its feature flag.
- No changes to the Orchestrator, Dispatcher, or any existing engine.
- Engine independence is structurally enforced — engines never import each other.

**Negative**:
- A runtime registration step is required during application startup.

## Alternatives Rejected

- **Direct engine instantiation in Orchestrator**: Rejected. Creates tight coupling; every new engine requires modifying the Orchestrator.
- **Static engine maps (switch/case)**: Rejected. Anti-pattern that becomes a maintenance liability.
