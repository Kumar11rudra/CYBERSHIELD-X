# ADR-003: Deterministic Risk Engine

**Status**: Accepted
**Date**: 2026-07-10
**Deciders**: Architecture Lead, Chief AI Architect, Risk Scoring Architect
**Categories**: Architecture, Risk, AI Boundaries

---

## Context

CyberShield's CSI V1 must produce a numerical risk score (0–100) for every target. The question is: should AI be involved in calculating this score?

## Decision

The `RiskScoringEngine` is **fully deterministic** and **completely isolated from AI**.

- It accepts `FindingDTO[]` as input.
- It applies a hardcoded, versioned `FINDING_WEIGHTS` table.
- It produces an `RiskDTO` with `numericalScore` sealed via `Object.freeze()`.
- The `RiskDTO` is immutable after creation — no downstream layer (including AI) can modify it.

The mandatory execution order is:
```
Engines → Evidence → Risk Engine → AI → Report
```

The AI Reasoning Layer **reads** `RiskDTO.numericalScore` to produce a human-readable explanation but can **never recalculate, override, or estimate** it.

## Consequences

**Positive**:
- Risk scores are reproducible, auditable, and forensically defensible.
- No AI hallucination can inflate or deflate a reported risk score.
- Regulators and auditors can verify score logic from the `FINDING_WEIGHTS` table alone.

**Negative**:
- The weights table requires manual tuning by security experts.
- AI cannot apply nuanced contextual weighting (e.g., "this CVE is not exploitable in this environment").

## Alternatives Rejected

- **AI-generated risk scores**: Rejected. LLM outputs are probabilistic and non-reproducible. A target scanned twice could receive different scores. Forensically indefensible.
- **Hybrid model (AI adjusts deterministic base score)**: Rejected for V1. May be reconsidered in V3 with strict audit controls.
