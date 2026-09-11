/**
 * 🛡️ CyberShield X — EvidenceLifecycleService (Phase 72)
 *
 * Implements immutable evidence collection, SHA-256 cryptographic verification,
 * tamper detection, and audit-grade chain of custody.
 *
 * Strict Rules:
 * - Raw evidence is immutable once registered.
 * - Integrity status is strictly computed via real hash comparison (zero fake VALID).
 * - Safe collection only uses certified tools via HostEnvironmentService (no arbitrary shell).
 */

const crypto = require('crypto');
const EvidenceRecord = require('../../models/EvidenceRecord');
const Incident = require('../../models/Incident');
const Case = require('../../models/Case');
const hostEnvironmentService = require('../HostEnvironmentService');
const auditLogger = require('../../utils/auditLogger');
const logger = require('../../utils/logger');

class EvidenceLifecycleService {
  constructor() {
    this.io = null;
  }

  setSocketIO(io) {
    this.io = io;
  }

  emitRealTimeEvent(eventName, payload) {
    if (!this.io) return;
    try {
      this.io.emit(eventName, {
        eventId: `ev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toISOString(),
        ...payload,
      });
    } catch (err) {
      logger.warn(`Failed to emit Socket.IO event ${eventName}: ${err.message}`);
    }
  }

  /**
   * Computes SHA-256 hash of a string
   */
  computeHash(data) {
    if (typeof data !== 'string') {
      data = JSON.stringify(data);
    }
    return crypto.createHash('sha256').update(data, 'utf8').digest('hex');
  }

  /**
   * Registers a new immutable evidence record
   */
  async registerEvidence({
    incidentId = null,
    caseId = null,
    sourceEntity = 'MANUAL_UPLOAD',
    sourceId = null,
    rawEvidence,
    artifactType = 'TEXT',
    collector = {},
    analystNotes = [],
    organizationId = null,
  }) {
    if (!rawEvidence) {
      throw new Error('rawEvidence is required to register evidence');
    }

    const rawStr = typeof rawEvidence === 'string' ? rawEvidence : JSON.stringify(rawEvidence, null, 2);
    const hash = this.computeHash(rawStr);
    const evidenceId = `EVID-${Date.now()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`;

    const initialCustody = [
      {
        action: 'COLLECTED',
        actor: {
          id: collector.id || collector.userId || 'system',
          name: collector.name || collector.username || 'SYSTEM',
          email: collector.email || null,
        },
        timestamp: new Date(),
        verificationHash: hash,
        notes: `Initial evidence registration via ${sourceEntity} (${sourceId || 'N/A'})`,
      },
    ];

    const record = await EvidenceRecord.create({
      evidenceId,
      incidentId,
      caseId,
      sourceEntity,
      sourceId,
      collector: {
        id: collector.id || collector.userId || 'system',
        name: collector.name || collector.username || 'SYSTEM',
        tool: collector.tool || 'native-collector',
      },
      hash,
      integrityStatus: 'VALID',
      rawEvidence: rawStr,
      artifactType,
      chainOfCustody: initialCustody,
      analystNotes: Array.isArray(analystNotes)
        ? analystNotes.map((n, i) => ({
            noteId: `NOTE-${Date.now()}-${i}`,
            author: n.author || { name: 'ANALYST' },
            content: n.content || n,
            createdAt: new Date(),
          }))
        : [],
      organizationId,
    });

    // If attached to Incident, add reference to incident timeline
    if (incidentId) {
      try {
        const inc = await Incident.findOne({ incidentId });
        if (inc) {
          inc.timeline.push({
            timestamp: new Date(),
            eventType: 'OBSERVED',
            description: `Immutable evidence ${evidenceId} registered (SHA-256: ${hash.substring(0, 16)}...)`,
            actor: collector.name || collector.username || 'SYSTEM',
            evidenceRef: evidenceId,
          });
          await inc.save();
        }
      } catch (incErr) {
        logger.warn(`Failed to link evidence to incident ${incidentId}: ${incErr.message}`);
      }
    }

    // If attached to Case, link in case evidence array
    if (caseId) {
      try {
        const cs = await Case.findOne({ caseId });
        if (cs) {
          cs.evidence.push({
            evidenceId,
            tool: collector.tool || 'native-collector',
            executionId: sourceId,
            rawOutput: rawStr.substring(0, 5000),
            hash,
            artifactType,
            capturedAt: new Date(),
          });
          cs.timeline.push({
            action: 'EVIDENCE_ATTACHED',
            performedBy: collector.name || 'SYSTEM',
            timestamp: new Date(),
            details: `Evidence ${evidenceId} registered and attached`,
          });
          await cs.save();
        }
      } catch (csErr) {
        logger.warn(`Failed to link evidence to case ${caseId}: ${csErr.message}`);
      }
    }

    this.emitRealTimeEvent('incident:evidence-added', {
      evidenceId,
      incidentId,
      caseId,
      hash,
      integrityStatus: 'VALID',
    });

    await auditLogger.log({
      actor: collector,
      action: 'EVIDENCE_REGISTERED',
      resource: { type: 'EVIDENCE', id: evidenceId },
      outcome: 'SUCCESS',
      details: { hash, incidentId, caseId, sourceEntity },
    });

    return record;
  }

  /**
   * Cryptographically verifies evidence integrity against stored SHA-256 hash
   */
  async verifyIntegrity(evidenceId, actor = {}, organizationId = null) {
    const query = { evidenceId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const evidence = await EvidenceRecord.findOne(query);
    if (!evidence) {
      throw new Error(`Evidence record ${evidenceId} not found`);
    }

    // Real SHA-256 recalculation
    const recomputedHash = this.computeHash(evidence.rawEvidence);
    const isValid = recomputedHash === evidence.hash;
    const newStatus = isValid ? 'VALID' : 'TAMPER_DETECTED';

    evidence.integrityStatus = newStatus;
    evidence.chainOfCustody.push({
      action: 'VERIFIED',
      actor: {
        id: actor.id || actor.userId || 'system',
        name: actor.name || actor.username || 'SYSTEM',
        email: actor.email || null,
      },
      timestamp: new Date(),
      verificationHash: recomputedHash,
      notes: isValid
        ? `Cryptographic verification passed. Recomputed hash matched original SHA-256: ${recomputedHash}`
        : `TAMPER DETECTED! Recomputed hash (${recomputedHash}) does NOT match stored hash (${evidence.hash})`,
    });

    await evidence.save();

    await auditLogger.log({
      actor,
      action: 'EVIDENCE_VERIFIED',
      resource: { type: 'EVIDENCE', id: evidenceId },
      outcome: isValid ? 'SUCCESS' : 'TAMPER_DETECTED',
      details: {
        storedHash: evidence.hash,
        recomputedHash,
        match: isValid,
        integrityStatus: newStatus,
      },
    });

    return {
      evidenceId,
      storedHash: evidence.hash,
      recomputedHash,
      match: isValid,
      integrityStatus: newStatus,
      verifiedAt: new Date(),
    };
  }

  /**
   * Safely collects evidence via HostEnvironmentService (authorized native tools)
   */
  async collectEvidenceSafely({
    incidentId = null,
    caseId = null,
    tool,
    target,
    args = [],
    reason,
    collector = {},
    organizationId = null,
  }) {
    if (!tool || !target) {
      throw new Error('Tool and target are required for safe evidence collection');
    }

    const executionId = `evid_exec_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const userId = collector.id || collector.userId || 'operator';

    // Dispatches through certified native tool runner with argument whitelist
    const execResult = await hostEnvironmentService.executeNativeTool(
      tool,
      target,
      args,
      executionId,
      userId
    );

    const rawOutput = execResult.stdout || execResult.output || JSON.stringify(execResult);

    const record = await this.registerEvidence({
      incidentId,
      caseId,
      sourceEntity: 'CANONICAL_TOOL',
      sourceId: execResult.executionId || executionId,
      rawEvidence: rawOutput,
      artifactType: 'TOOL_OUTPUT',
      collector: {
        ...collector,
        tool,
      },
      organizationId,
    });

    return {
      execution: execResult,
      evidence: record,
    };
  }

  /**
   * Appends an analyst note to evidence without modifying rawEvidence
   */
  async addAnalystNote(evidenceId, content, author = {}, organizationId = null) {
    if (!content || !content.trim()) {
      throw new Error('Note content cannot be empty');
    }

    const query = { evidenceId };
    if (organizationId) {
      query.$or = [{ organizationId }, { organizationId: null }];
    }

    const evidence = await EvidenceRecord.findOne(query);
    if (!evidence) {
      throw new Error(`Evidence ${evidenceId} not found`);
    }

    const noteId = `NOTE-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    evidence.analystNotes.push({
      noteId,
      author: {
        id: author.id || author.userId || null,
        name: author.name || author.username || 'ANALYST',
      },
      content: content.trim(),
      createdAt: new Date(),
    });

    evidence.chainOfCustody.push({
      action: 'NOTE_ADDED',
      actor: {
        id: author.id || author.userId || null,
        name: author.name || author.username || 'ANALYST',
      },
      timestamp: new Date(),
      verificationHash: evidence.hash,
      notes: `Analyst note added: "${content.substring(0, 60)}..."`,
    });

    await evidence.save();

    return evidence;
  }
}

module.exports = new EvidenceLifecycleService();
