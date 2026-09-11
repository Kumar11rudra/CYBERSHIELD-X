/**
 * 🛡️ CyberShield X — ComplianceEvidenceService (Phase 74)
 *
 * Evaluates real platform evidence mapped across 9 modular compliance domains.
 * Generates immutable compliance evidence bundles backed by actual persisted records
 * and cryptographic SHA-256 hashes.
 */

const crypto = require('crypto');
const ComplianceControl = require('../../models/ComplianceControl');
const ComplianceEvidence = require('../../models/ComplianceEvidence');
const AuditEvent = require('../../models/AuditEvent');
const Incident = require('../../models/Incident');
const Finding = require('../../models/Finding');
const DetectionRule = require('../../models/DetectionRule');
const DetectionRuleRevision = require('../../models/DetectionRuleRevision');
const EvidenceRecord = require('../../models/EvidenceRecord');
const User = require('../../models/User');
const Asset = require('../../models/Asset');
const Playbook = require('../../models/Playbook');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

const CANONICAL_CONTROLS = [
  {
    controlId: 'CTRL-AC-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'ACCESS_CONTROL',
    title: 'Role-Based Access Control (RBAC) & Identity Isolation',
    description: 'Enforces strict tenant scoping and granular role tiers (VIEWER, ANALYST, OPERATOR, ADMIN).',
    requiredEvidenceTypes: ['USER_RECORD', 'AUDIT_AUTH_EVENT'],
  },
  {
    controlId: 'CTRL-LM-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'LOGGING_MONITORING',
    title: 'Immutable Audit Logging & Continuous SOC Monitoring',
    description: 'All state transitions, executions, and security decisions emit tamper-resistant audit logs.',
    requiredEvidenceTypes: ['AUDIT_EVENT'],
  },
  {
    controlId: 'CTRL-VM-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'VULNERABILITY_MANAGEMENT',
    title: 'Vulnerability Detection & Normalized Findings Lifecycle',
    description: 'System captures, scores, and tracks security vulnerabilities to remediation.',
    requiredEvidenceTypes: ['FINDING_RECORD'],
  },
  {
    controlId: 'CTRL-IR-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'INCIDENT_RESPONSE',
    title: '14-State Incident Response Lifecycle & Post-Incident Review',
    description: 'Governs security incidents through structured containment, eradication, and mandatory PIR.',
    requiredEvidenceTypes: ['INCIDENT_RECORD', 'POSTMORTEM_EVIDENCE'],
  },
  {
    controlId: 'CTRL-CM-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'CHANGE_MANAGEMENT',
    title: 'Detection Rule Revisions & Rollback Control',
    description: 'Logic modifications increment immutable revisions with required justifications and rollback safety.',
    requiredEvidenceTypes: ['DETECTION_REVISION', 'AUDIT_CHANGE_EVENT'],
  },
  {
    controlId: 'CTRL-AM-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'ASSET_MANAGEMENT',
    title: 'Monitored Assets & Perimeter Inventory Tracking',
    description: 'Authoritative catalog of monitored targets, internal servers, and cloud infrastructure.',
    requiredEvidenceTypes: ['TARGET_RECORD'],
  },
  {
    controlId: 'CTRL-DP-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'DATA_PROTECTION',
    title: 'Forensic Evidence Integrity & Cryptographic Hashing',
    description: 'Forensic artifacts capture SHA-256 hashes upon ingestion with tamper detection verification.',
    requiredEvidenceTypes: ['EVIDENCE_RECORD_HASH'],
  },
  {
    controlId: 'CTRL-TD-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'THREAT_DETECTION',
    title: 'Enterprise Detection Engineering & MITRE ATT&CK Coverage',
    description: 'Detection rules verified by deterministic test fixtures and mapped to MITRE ATT&CK techniques.',
    requiredEvidenceTypes: ['DETECTION_RULE', 'ATTACK_COVERAGE'],
  },
  {
    controlId: 'CTRL-BC-01',
    framework: 'CYBERSHIELD_CORE',
    domain: 'BUSINESS_CONTINUITY',
    title: 'Disaster Recovery, Automated Playbooks & Operational Runbooks',
    description: 'Maintains verified operational recovery SOPs and safe human-in-the-loop automation playbooks.',
    requiredEvidenceTypes: ['PLAYBOOK_RECORD'],
  },
];

class ComplianceEvidenceService {
  constructor(io = null) {
    this.io = io;
  }

  setIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(event, data) {
    if (this.io) {
      try {
        this.io.emit(event, data);
      } catch (err) {
        logger.warn(`Failed to emit ${event} via Socket.IO: ${err.message}`);
      }
    }
  }

  _buildTenantQuery(organizationId, baseQuery = {}) {
    if (!organizationId) return { ...baseQuery };
    return {
      ...baseQuery,
      $or: [{ organizationId }, { organizationId: null }],
    };
  }

  /**
   * Seeds canonical compliance controls idempotently
   */
  async seedCanonicalControls(organizationId = null) {
    const seeded = [];
    for (const ctrlDef of CANONICAL_CONTROLS) {
      let control = await ComplianceControl.findOne({
        controlId: ctrlDef.controlId,
        $or: [{ organizationId }, { organizationId: null }],
      });

      if (!control) {
        control = new ComplianceControl({
          ...ctrlDef,
          organizationId,
        });
        await control.save();
      }
      seeded.push(control);
    }
    return seeded;
  }

  /**
   * Evaluates evidence presence for a specific control against actual database records
   */
  async evaluateControlEvidence(controlId, organizationId = null) {
    const orgFilter = this._buildTenantQuery(organizationId);
    let control = await ComplianceControl.findOne({
      controlId,
      $or: [{ organizationId }, { organizationId: null }],
    });

    if (!control) {
      const canonical = CANONICAL_CONTROLS.find((c) => c.controlId === controlId);
      if (canonical) {
        control = new ComplianceControl({ ...canonical, organizationId });
        await control.save();
      } else {
        throw new Error(`Compliance control ${controlId} not recognized`);
      }
    }

    const sourceRecords = [];
    const auditEventRefs = [];
    let status = 'NO_EVIDENCE';
    let summary = '';

    switch (control.domain) {
      case 'ACCESS_CONTROL': {
        const users = await User.find({}).limit(5).select('_id username role');
        const authAudits = await AuditEvent.find(
          this._buildTenantQuery(organizationId, { action: /AUTH|LOGIN|SIGNUP|ROLE/ })
        )
          .limit(5)
          .select('eventId action timestamp');

        for (const u of users) {
          sourceRecords.push({
            entityType: 'User',
            entityId: String(u._id),
            summary: `User ${u.username} with role ${u.role}`,
          });
        }
        for (const a of authAudits) {
          auditEventRefs.push(a.eventId);
        }

        if (sourceRecords.length >= 2 && auditEventRefs.length > 0) status = 'EVIDENCE_PRESENT';
        else if (sourceRecords.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Identified ${sourceRecords.length} identity/role records and ${auditEventRefs.length} access audit events.`;
        break;
      }

      case 'LOGGING_MONITORING': {
        const auditCount = await AuditEvent.countDocuments(orgFilter);
        const audits = await AuditEvent.find(orgFilter).sort({ timestamp: -1 }).limit(10).select('eventId action timestamp outcome');
        for (const a of audits) {
          auditEventRefs.push(a.eventId);
          sourceRecords.push({
            entityType: 'AuditEvent',
            entityId: a.eventId,
            summary: `${a.action} (${a.outcome})`,
            timestamp: a.timestamp,
          });
        }

        if (auditCount >= 5) status = 'EVIDENCE_PRESENT';
        else if (auditCount > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Verified ${auditCount} immutable audit events stored in compliance logging store.`;
        break;
      }

      case 'VULNERABILITY_MANAGEMENT': {
        const findings = await Finding.find(orgFilter).limit(10).select('findingId title severity status');
        for (const f of findings) {
          sourceRecords.push({
            entityType: 'Finding',
            entityId: f.findingId || String(f._id),
            summary: `${f.severity} - ${f.title} (${f.status})`,
          });
        }
        if (findings.length >= 3) status = 'EVIDENCE_PRESENT';
        else if (findings.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Observed ${findings.length} findings tracked under active vulnerability management.`;
        break;
      }

      case 'INCIDENT_RESPONSE': {
        const incidents = await Incident.find(orgFilter).limit(10).select('incidentId title status closure');
        for (const i of incidents) {
          const hasPIR = Boolean(i.closure?.postIncidentReviewCompleted);
          sourceRecords.push({
            entityType: 'Incident',
            entityId: i.incidentId,
            summary: `${i.title} [Status: ${i.status}${hasPIR ? ', PIR: Verified' : ''}]`,
          });
        }
        if (incidents.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (incidents.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Found ${incidents.length} security incidents governed by response state machine.`;
        break;
      }

      case 'CHANGE_MANAGEMENT': {
        const revisions = await DetectionRuleRevision.find(orgFilter).limit(10).select('revisionId ruleId revision author changeReason');
        for (const r of revisions) {
          sourceRecords.push({
            entityType: 'DetectionRuleRevision',
            entityId: r.revisionId,
            summary: `Rule ${r.ruleId} rev ${r.revision} by ${r.author}: ${r.changeReason}`,
          });
        }
        if (revisions.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (revisions.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Found ${revisions.length} immutable rule revisions capturing change control logs.`;
        break;
      }

      case 'ASSET_MANAGEMENT': {
        const assets = await Asset.find(orgFilter).limit(10).select('_id hostname ip domain');
        for (const a of assets) {
          sourceRecords.push({
            entityType: 'Asset',
            entityId: String(a._id),
            summary: `Monitored asset: ${a.hostname || a.ip || a.domain || a._id}`,
          });
        }
        if (assets.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (assets.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Tracked ${assets.length} monitored perimeter and internal assets.`;
        break;
      }

      case 'DATA_PROTECTION': {
        const evidenceRecs = await EvidenceRecord.find(
          this._buildTenantQuery(organizationId, { sha256: { $exists: true } })
        )
          .limit(10)
          .select('evidenceId sha256 verificationStatus');

        for (const ev of evidenceRecs) {
          sourceRecords.push({
            entityType: 'EvidenceRecord',
            entityId: ev.evidenceId,
            hash: ev.sha256,
            summary: `SHA-256 Hash: ${ev.sha256?.substring(0, 16)}... [Status: ${ev.verificationStatus}]`,
          });
        }
        if (evidenceRecs.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (evidenceRecs.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Verified ${evidenceRecs.length} forensic evidence records secured with SHA-256 hashes.`;
        break;
      }

      case 'THREAT_DETECTION': {
        const rules = await DetectionRule.find(orgFilter).limit(10).select('ruleId name status healthStatus');
        for (const r of rules) {
          sourceRecords.push({
            entityType: 'DetectionRule',
            entityId: r.ruleId,
            summary: `${r.name} [Status: ${r.status}, Health: ${r.healthStatus}]`,
          });
        }
        const activeRules = rules.filter((r) => r.status === 'ACTIVE');
        if (activeRules.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (rules.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Identified ${activeRules.length} active detection rules (${rules.length} total).`;
        break;
      }

      case 'BUSINESS_CONTINUITY': {
        const playbooks = await Playbook.find(orgFilter).limit(10).select('_id name category');
        for (const p of playbooks) {
          sourceRecords.push({
            entityType: 'Playbook',
            entityId: String(p._id),
            summary: `Automated recovery playbook: ${p.name}`,
          });
        }
        if (playbooks.length >= 2) status = 'EVIDENCE_PRESENT';
        else if (playbooks.length > 0) status = 'PARTIAL_EVIDENCE';
        summary = `Verified ${playbooks.length} response and business continuity playbooks.`;
        break;
      }

      default:
        status = 'NOT_ASSESSED';
        summary = 'Domain not currently under automated assessment.';
    }

    return {
      controlId: control.controlId,
      domain: control.domain,
      title: control.title,
      status,
      summary,
      evidenceCount: sourceRecords.length,
      sourceRecords,
      auditEventRefs,
    };
  }

  /**
   * Generates a versioned, cryptographically hashed Compliance Evidence Package
   */
  async generateEvidencePackage(controlId, options = {}, user = null) {
    let organizationId = null;
    let operator = {};

    if (user && user.organizationId) {
      organizationId = user.organizationId;
      operator = user;
    } else if (user && (typeof user === 'string' || user._bsontype)) {
      organizationId = user;
    } else if (options && options.organizationId) {
      organizationId = options.organizationId;
    } else if (options && options._id) {
      operator = options;
      organizationId = options.organizationId;
    }

    const evaluation = await this.evaluateControlEvidence(controlId, organizationId);
    const packageId = `PKG-${controlId}-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    const evidenceId = packageId;

    // Compute checksum over evidence records
    const packageChecksum = crypto
      .createHash('sha256')
      .update(JSON.stringify(evaluation.sourceRecords || []))
      .digest('hex');

    const pkg = new ComplianceEvidence({
      evidenceId,
      packageId,
      controlId,
      controlTitle: evaluation.title || controlId,
      controlDomain: evaluation.domain,
      status: evaluation.status,
      sourceType: evaluation.domain,
      sourceRecords: evaluation.sourceRecords,
      evidenceRecords: evaluation.sourceRecords,
      evidenceCount: (evaluation.sourceRecords || []).length,
      auditEventRefs: evaluation.auditEventRefs,
      summary: evaluation.summary,
      verifiedAt: new Date(),
      verifiedBy: operator.username || operator.name || options.requestedBy || 'OPERATOR',
      packageChecksum,
      packageHash: packageChecksum,
      organizationId,
    });

    await pkg.save();

    await auditLogger.log({
      actor: operator,
      organizationId,
      action: 'COMPLIANCE_EVIDENCE_PACKAGE_GENERATED',
      resource: { type: 'COMPLIANCE_EVIDENCE', id: evidenceId },
      outcome: 'SUCCESS',
      details: { controlId, status: evaluation.status, checksum: packageChecksum },
    });

    this.emitRealTimeEvent('compliance:evidence-updated', {
      controlId,
      evidenceId,
      status: evaluation.status,
    });

    return pkg;
  }

  /**
   * Evaluates all compliance controls across the organization
   */
  async getComplianceFrameworkSummary(organizationId = null) {
    await this.seedCanonicalControls(organizationId);

    const controls = await ComplianceControl.find(this._buildTenantQuery(organizationId));
    const evaluations = [];

    let evidencePresentCount = 0;
    let partialEvidenceCount = 0;
    let noEvidenceCount = 0;
    let notAssessedCount = 0;

    for (const ctrl of controls) {
      const evalRes = await this.evaluateControlEvidence(ctrl.controlId, organizationId);
      evaluations.push(evalRes);

      if (evalRes.status === 'EVIDENCE_PRESENT') evidencePresentCount++;
      else if (evalRes.status === 'PARTIAL_EVIDENCE') partialEvidenceCount++;
      else if (evalRes.status === 'NO_EVIDENCE') noEvidenceCount++;
      else notAssessedCount++;
    }

    const totalControls = controls.length;
    const completenessRate =
      totalControls > 0
        ? Math.round(((evidencePresentCount * 1 + partialEvidenceCount * 0.5) / totalControls) * 1000) / 10
        : 0;

    return {
      organizationId,
      timestamp: new Date(),
      totalControls,
      statusDistribution: {
        evidencePresent: evidencePresentCount,
        partialEvidence: partialEvidenceCount,
        noEvidence: noEvidenceCount,
        notAssessed: notAssessedCount,
      },
      completenessRate, // percentage of evidence-backed posture
      frameworkReadiness: completenessRate >= 80 ? 'HIGH_READINESS' : completenessRate >= 50 ? 'PARTIAL_READINESS' : 'NEEDS_EVIDENCE',
      controls: evaluations,
    };
  }

  async evaluateAllControls(organizationId = null) {
    const summary = await this.getComplianceFrameworkSummary(organizationId);
    return summary.controls;
  }
}

module.exports = new ComplianceEvidenceService();
