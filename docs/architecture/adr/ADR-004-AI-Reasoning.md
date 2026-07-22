# ADR-004: AI Reasoning Layer Boundaries

**Status**: Accepted
**Date**: 2026-07-10
**Deciders**: Architecture Lead, Chief AI Architect
**Categories**: Architecture, AI, Safety

---

## Context

AI is a powerful tool for explaining complex security findings in human-readable language. However, AI Large Language Models are also known to hallucinate — generating plausible-sounding but entirely fabricated technical data. This is catastrophic in a security context (e.g., fabricating open ports, inventing CVEs, or manufacturing evidence).

## Decision

The AI Reasoning Layer operates under the following hard boundaries:

**What AI MAY do:**
- Analyze `FindingDTO[]` and `RiskDTO` and produce narrative explanations.
- Identify attack chain patterns across findings (e.g., "the combination of exposed SSH and outdated OpenSSH creates a lateral movement risk").
- Suggest remediation actions.
- Generate executive summaries for non-technical stakeholders.
- Load and apply externalized prompts from the `server/ai/prompts/csi/` Prompt Registry.

**What AI MAY NOT do:**
- Generate new `FindingDTO` objects.
- Modify any field in `RiskDTO`, including `numericalScore`.
- Call the Risk Engine.
- Make network requests.
- Access the Evidence Store directly.
- Return data outside the validated JSON schema (`{ summary, attackChains, remediation }`).

**Hallucination Guard**: All AI output is validated against a strict JSON schema before acceptance. Any response containing unrecognized keys or new finding types triggers a `CsiAiHallucinationError` and the AI output is discarded. The report proceeds without the AI narrative.

**Prompt Externalization**: Zero hardcoded prompt strings exist anywhere in service code. All prompts live in `server/ai/prompts/csi/*.prompt.md` and are loaded at runtime.

## Consequences

**Positive**:
- Security reports are always grounded in real, collected evidence.
- AI hallucination cannot corrupt the technical findings layer.
- Prompts can be updated/tuned without redeployment.

**Negative**:
- AI cannot fill gaps in evidence (e.g., it cannot infer a technology from indirect clues if no engine collected it).

## Alternatives Rejected

- **Unconstrained AI (full report generation)**: Rejected. Creates liability when AI invents technical findings that are presented to clients as factual.
- **No AI**: Rejected. Manual report writing defeats the platform's productivity advantage.
