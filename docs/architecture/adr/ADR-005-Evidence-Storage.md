# ADR-005: Evidence Storage Abstraction

**Status**: Accepted
**Date**: 2026-07-10
**Deciders**: Architecture Lead, Database Architect, Evidence Engine Architect
**Categories**: Architecture, Evidence, Storage

---

## Context

CSI engines produce raw evidence artifacts: PEM certificates, DNS JSON dumps, HTTP header blobs, socket hex captures. These must be stored persistently and immutably for forensic reconstruction. The question is: where and how?

## Decision

Evidence storage is abstracted behind the `IEvidenceStorage` interface. V1 ships with `LocalEvidenceStorage`, which writes to the local filesystem. The interface allows a transparent future migration to S3/MinIO without changing any engine code.

**Immutability Rules**:
- Once `IEvidenceStorage.store()` is called, the raw bytes are written and the `sha256Hash` is computed and sealed.
- No `update()` method exists on `IEvidenceStorage`. Only `store()`, `retrieve()`, `exists()`, and `delete()` are permitted.
- `delete()` exists only for GDPR/data-retention compliance and logs an immutable audit event before removal.
- `EvidenceDTO.sha256Hash` is a read-only field — it cannot be overwritten after construction.

**FindingDTO Traceability** (new requirement from Architecture Lead):
Every `FindingDTO` must include:
- `engineVersion`: The semantic version of the engine that produced the finding.
- `collectionTime`: ISO-8601 timestamp of when the raw data was collected.
- `executionId`: UUID of the orchestration job that triggered collection.
- `evidenceHash`: SHA-256 of the raw evidence artifact linked to this finding.

This enables complete forensic reconstruction: given a `FindingDTO`, an auditor can locate the exact raw evidence artifact, verify its hash, and confirm the engine version that produced it.

**Storage Path Convention**:
```
/var/cybershield/evidence/{YYYY-MM-DD}/{sha256Hash}.{contentType}
```

## Consequences

**Positive**:
- Evidence is forensically sound and independently verifiable.
- V1 works with zero infrastructure cost (local disk).
- V2 can migrate to cloud storage (S3/MinIO) with a single swap of `LocalEvidenceStorage` → `S3EvidenceStorage` in `csiComposition.js`.

**Negative**:
- Local disk evidence is vulnerable to server failure. Backup strategy required for production.

## Alternatives Rejected

- **Storing evidence in PostgreSQL BLOB columns**: Rejected. Binary large objects in RDBMS cause table bloat and slow index scans.
- **Direct S3 from Day 1**: Rejected for V1. Adds infrastructure dependency (AWS credentials, bucket setup) before the engine layer is proven.
