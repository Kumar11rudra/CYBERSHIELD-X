const crypto = require('crypto');
const SecurityGraphNode = require('../../models/SecurityGraphNode');
const SecurityGraphEdge = require('../../models/SecurityGraphEdge');
const EntityNormalizationService = require('./EntityNormalizationService');

class SecurityGraphService {
  /**
   * Helper to compute SHA-256 checksum for edge relationships
   */
  static computeEdgeChecksum(fromNode, toNode, relationshipType, organizationId) {
    const raw = `${fromNode}:${toNode}:${relationshipType}:${organizationId || 'GLOBAL'}`;
    return crypto.createHash('sha256').update(raw).digest('hex');
  }

  /**
   * Materialize or update a single SecurityGraphNode from a record descriptor
   */
  static async materializeNode(entityType, record, organizationId = null) {
    const descriptor = EntityNormalizationService.normalizeRecord(entityType, record);
    if (!descriptor) return null;

    const query = { nodeId: descriptor.nodeId };
    if (organizationId) query.organizationId = organizationId;

    let node = await SecurityGraphNode.findOne(query);

    if (!node) {
      node = await SecurityGraphNode.create({
        nodeId: descriptor.nodeId,
        organizationId: organizationId || record.organizationId || null,
        entityType: descriptor.entityType,
        entityId: descriptor.entityId,
        displayName: descriptor.displayName,
        classification: descriptor.classification,
        source: descriptor.source,
        firstObservedAt: descriptor.firstObservedAt,
        lastObservedAt: descriptor.lastObservedAt,
        metadata: descriptor.metadata,
        status: 'ACTIVE'
      });
    } else {
      node.lastObservedAt = new Date();
      node.metadata = { ...node.metadata, ...descriptor.metadata };
      await node.save();
    }

    return node;
  }

  /**
   * Materialize or update a SecurityGraphEdge between two nodes
   */
  static async materializeEdge({
    fromNodeId,
    toNodeId,
    relationshipType,
    provenanceType = 'DIRECT_RECORD_REFERENCE',
    provenanceReferences = [],
    confidence = 1.0,
    attributes = {},
    organizationId = null
  }) {
    const checksum = this.computeEdgeChecksum(fromNodeId, toNodeId, relationshipType, organizationId);
    const edgeId = EntityNormalizationService.toEdgeId(fromNodeId, toNodeId, relationshipType);

    const query = { edgeId };
    if (organizationId) query.organizationId = organizationId;

    let edge = await SecurityGraphEdge.findOne(query);

    if (!edge) {
      edge = await SecurityGraphEdge.create({
        edgeId,
        organizationId,
        fromNode: fromNodeId,
        toNode: toNodeId,
        relationshipType,
        provenanceType,
        provenanceReferences,
        confidence,
        firstObservedAt: new Date(),
        lastObservedAt: new Date(),
        attributes,
        checksum
      });
    } else {
      edge.lastObservedAt = new Date();
      edge.provenanceReferences = Array.from(new Set([...edge.provenanceReferences, ...provenanceReferences]));
      edge.attributes = { ...edge.attributes, ...attributes };
      await edge.save();
    }

    return edge;
  }

  /**
   * Sync active platform records into graph nodes & edges
   */
  static async syncPlatformEntitiesToGraph(organizationId = null) {
    const Incident = require('../../models/Incident');
    const Finding = require('../../models/Finding');
    const Alert = require('../../models/Alert');
    const Case = require('../../models/Case');
    const IOCRecord = require('../../models/IOCRecord');
    const DetectionRuleRevision = require('../../models/DetectionRuleRevision');
    const ThreatHunt = require('../../models/ThreatHunt');
    const AutomationExecution = require('../../models/AutomationExecution');
    const GovernancePolicy = require('../../models/GovernancePolicy');
    const SLODefinition = require('../../models/SLODefinition');

    const query = organizationId ? { organizationId } : {};

    const incidents = await Incident.find(query).limit(50).lean();
    const findings = await Finding.find(query).limit(50).lean();
    const alerts = await Alert.find(query).limit(50).lean();
    const cases = await Case.find(query).limit(20).lean();
    const iocs = await IOCRecord.find(query).limit(50).lean();
    const detections = await DetectionRuleRevision.find(query).limit(30).lean();
    const hunts = await ThreatHunt.find(query).limit(20).lean();
    const executions = await AutomationExecution.find(query).limit(30).lean();
    const policies = await GovernancePolicy.find(query).limit(20).lean();
    const slos = await SLODefinition.find(query).limit(20).lean();

    let nodeCount = 0;
    let edgeCount = 0;

    // Materialize Incident Nodes & Links
    for (const inc of incidents) {
      const incNode = await this.materializeNode('INCIDENT', inc, organizationId);
      nodeCount++;

      // Link to Asset if affectedAsset present
      if (inc.affectedAsset) {
        const assetNode = await this.materializeNode('ASSET', { assetId: inc.affectedAsset, hostname: inc.affectedAsset }, organizationId);
        if (assetNode) {
          nodeCount++;
          await this.materializeEdge({
            fromNodeId: incNode.nodeId,
            toNodeId: assetNode.nodeId,
            relationshipType: 'AFFECTS',
            provenanceType: 'PERSISTED_FOREIGN_KEY',
            provenanceReferences: [`INCIDENT_${inc.incidentId}`],
            organizationId
          });
          edgeCount++;
        }
      }
    }

    // Materialize Alert Nodes & Links to Incidents / Rules
    for (const al of alerts) {
      const alNode = await this.materializeNode('ALERT', al, organizationId);
      nodeCount++;

      if (al.incidentId) {
        const incNodeId = EntityNormalizationService.toNodeId('INCIDENT', al.incidentId);
        await this.materializeEdge({
          fromNodeId: alNode.nodeId,
          toNodeId: incNodeId,
          relationshipType: 'CORRELATED_WITH',
          provenanceType: 'DIRECT_RECORD_REFERENCE',
          provenanceReferences: [`ALERT_${al.alertId}`],
          organizationId
        });
        edgeCount++;
      }
    }

    // Materialize Finding Nodes
    for (const f of findings) {
      await this.materializeNode('FINDING', f, organizationId);
      nodeCount++;
    }

    // Materialize Case Nodes
    for (const c of cases) {
      await this.materializeNode('CASE', c, organizationId);
      nodeCount++;
    }

    // Materialize IOC Nodes
    for (const i of iocs) {
      await this.materializeNode('IOC', i, organizationId);
      nodeCount++;
    }

    // Materialize Detection Rules
    for (const d of detections) {
      await this.materializeNode('DETECTION_RULE', d, organizationId);
      nodeCount++;
    }

    // Materialize Threat Hunts
    for (const h of hunts) {
      await this.materializeNode('THREAT_HUNT', h, organizationId);
      nodeCount++;
    }

    // Materialize Automation Executions
    for (const e of executions) {
      const execNode = await this.materializeNode('AUTOMATION_EXECUTION', e, organizationId);
      nodeCount++;

      const pbNodeId = EntityNormalizationService.toNodeId('AUTOMATION_PLAYBOOK', e.playbookId);
      await this.materializeEdge({
        fromNodeId: execNode.nodeId,
        toNodeId: pbNodeId,
        relationshipType: 'EXECUTED_ON',
        provenanceType: 'DIRECT_RECORD_REFERENCE',
        provenanceReferences: [`EXECUTION_${e.executionId}`],
        organizationId
      });
      edgeCount++;
    }

    // Materialize Governance Policies
    for (const p of policies) {
      await this.materializeNode('GOVERNANCE_POLICY', p, organizationId);
      nodeCount++;
    }

    // Materialize Reliability SLOs
    for (const s of slos) {
      await this.materializeNode('SERVICE_HEALTH', { ...s, entityId: s.sloId, displayName: s.name }, organizationId);
      nodeCount++;
    }

    return {
      organizationId,
      materializedAt: new Date(),
      nodeCount,
      edgeCount
    };
  }
}

module.exports = SecurityGraphService;
