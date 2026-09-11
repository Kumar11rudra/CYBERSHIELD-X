/**
 * 🛡️ CyberShield X — EntityNormalizationService (Phase 78)
 *
 * Normalizes heterogeneous platform record references across Assets, Users,
 * Incidents, Cases, Findings, Alerts, Detections, IOCs, Hunts, Automation,
 * Governance, Reliability, Compliance, and Evidence into canonical graph descriptors.
 */

class EntityNormalizationService {
  /**
   * Derive canonical node ID from entityType and entityId
   */
  static toNodeId(entityType, entityId) {
    return `NODE-${entityType.toUpperCase()}-${entityId}`;
  }

  /**
   * Derive canonical edge ID from fromNodeId, toNodeId, and relationshipType
   */
  static toEdgeId(fromNodeId, toNodeId, relationshipType) {
    return `EDGE-${fromNodeId}-TO-${toNodeId}-${relationshipType.toUpperCase()}`;
  }

  /**
   * Normalize an arbitrary platform record reference into standard graph node attributes
   */
  static normalizeRecord(entityType, record) {
    if (!record) return null;

    let entityId = null;
    let displayName = 'Unknown Entity';
    let classification = 'INFORMATIONAL';
    let source = 'CyberShield Core';
    let metadata = {};

    switch (entityType.toUpperCase()) {
      case 'INCIDENT':
        entityId = record.incidentId || record._id?.toString();
        displayName = record.title || record.name || `Incident ${entityId}`;
        classification = record.severity || 'HIGH';
        source = 'IncidentResponseEngine';
        metadata = { status: record.status, priority: record.priority, assignedTo: record.assignedTo };
        break;

      case 'CASE':
        entityId = record.caseId || record._id?.toString();
        displayName = record.title || record.name || `Case ${entityId}`;
        classification = record.severity || 'MEDIUM';
        source = 'CaseOrchestrationService';
        metadata = { status: record.status, leadAnalyst: record.leadAnalyst };
        break;

      case 'FINDING':
        entityId = record.findingId || record._id?.toString();
        displayName = record.title || record.name || `Finding ${entityId}`;
        classification = record.severity || 'MEDIUM';
        source = 'FindingEngine';
        metadata = { type: record.type, category: record.category };
        break;

      case 'ALERT':
        entityId = record.alertId || record._id?.toString();
        displayName = record.title || record.ruleName || `Alert ${entityId}`;
        classification = record.severity || 'HIGH';
        source = 'AlertingEngine';
        metadata = { ruleId: record.ruleId, status: record.status };
        break;

      case 'ASSET':
        entityId = record.assetId || record.id || record._id?.toString();
        displayName = record.hostname || record.name || record.ipAddress || `Asset ${entityId}`;
        classification = record.criticality || 'MEDIUM';
        source = 'AssetInventoryService';
        metadata = { ipAddress: record.ipAddress, os: record.os, type: record.type };
        break;

      case 'USER':
      case 'IDENTITY':
        entityId = record.userId || record.username || record.email || record._id?.toString();
        displayName = record.username || record.email || record.name || `User ${entityId}`;
        classification = record.role === 'admin' ? 'HIGH' : 'LOW';
        source = 'AuthenticationService';
        metadata = { role: record.role, email: record.email };
        break;

      case 'IOC':
        entityId = record.iocId || record.value || record._id?.toString();
        displayName = `${record.type || 'IOC'}: ${record.value || entityId}`;
        classification = record.severity || 'HIGH';
        source = 'ThreatIntelFusionService';
        metadata = { iocType: record.type, value: record.value, threatLevel: record.threatLevel };
        break;

      case 'DETECTION_RULE':
        entityId = record.contentId || record.ruleId || record._id?.toString();
        displayName = record.name || `Detection Rule ${entityId}`;
        classification = record.severity || 'MEDIUM';
        source = 'DetectionEngineeringService';
        metadata = { version: record.version, enabled: record.enabled, status: record.status };
        break;

      case 'THREAT_HUNT':
        entityId = record.huntId || record._id?.toString();
        displayName = record.name || record.hypothesis || `Hunt ${entityId}`;
        classification = 'MEDIUM';
        source = 'ThreatHuntingService';
        metadata = { category: record.category, status: record.status };
        break;

      case 'AUTOMATION_EXECUTION':
        entityId = record.executionId || record._id?.toString();
        displayName = `Execution: ${record.playbookId || entityId}`;
        classification = record.status === 'FAILED' ? 'HIGH' : 'INFORMATIONAL';
        source = 'AutomationExecutionEngine';
        metadata = { playbookId: record.playbookId, status: record.status, idempotencyKey: record.idempotencyKey };
        break;

      case 'GOVERNANCE_POLICY':
        entityId = record.policyId || record._id?.toString();
        displayName = record.name || `Policy ${entityId}`;
        classification = 'HIGH';
        source = 'GovernancePolicyService';
        metadata = { policyType: record.policyType, status: record.status, version: record.version };
        break;

      case 'EVIDENCE_RECORD':
        entityId = record.evidenceId || record._id?.toString();
        displayName = record.name || `Evidence ${entityId}`;
        classification = 'INFORMATIONAL';
        source = 'EvidenceService';
        metadata = { hash: record.sha256Hash || record.checksum, status: record.status };
        break;

      default:
        entityId = record.id || record._id?.toString() || `RAW-${Date.now()}`;
        displayName = record.name || record.title || `${entityType} ${entityId}`;
        classification = 'INFORMATIONAL';
        source = 'PlatformRecord';
        metadata = {};
        break;
    }

    return {
      nodeId: this.toNodeId(entityType, entityId),
      entityType: entityType.toUpperCase(),
      entityId,
      displayName,
      classification,
      source,
      metadata,
      firstObservedAt: record.createdAt || record.firstObservedAt || new Date(),
      lastObservedAt: record.updatedAt || record.lastObservedAt || new Date()
    };
  }
}

module.exports = EntityNormalizationService;
