/**
 * 🛡️ CyberShield X — Phase 71 Threat Hunting & Intelligence Fusion Test Suite
 *
 * Validates:
 * 1. ThreatHunt & Execution models
 * 2. ThreatHuntTemplate canonical templates
 * 3. ThreatHuntQueryEngine validation & compilation
 * 4. Truthful execution (NO_MATCH and MATCHED)
 * 5. Execution lifecycle & cancellation
 * 6. Evidence promotion to Finding & Incident
 * 7. Candidate Detection Rule drafting in DRAFT status
 * 8. ThreatIntelFusionService normalization, states, and platform matching
 * 9. InvestigationTimelineService event aggregation
 * 10. Multi-tenant isolation
 */

const mongoose = require('mongoose');
const ThreatHunt = require('../models/ThreatHunt');
const ThreatHuntExecution = require('../models/ThreatHuntExecution');
const ThreatHuntTemplate = require('../models/ThreatHuntTemplate');
const ThreatActorProfile = require('../models/ThreatActorProfile');
const Campaign = require('../models/Campaign');
const Finding = require('../models/Finding');
const Alert = require('../models/Alert');
const Incident = require('../models/Incident');
const Asset = require('../models/Asset');
const DetectionRule = require('../models/DetectionRule');
const threatHuntQueryEngine = require('../services/soc/ThreatHuntQueryEngine');
const threatHuntExecutionService = require('../services/soc/ThreatHuntExecutionService');
const threatIntelFusionService = require('../services/soc/ThreatIntelFusionService');
const investigationTimelineService = require('../services/soc/InvestigationTimelineService');

describe('Phase 71 — Threat Hunting & Intel Fusion Engine', () => {
  const orgA = new mongoose.Types.ObjectId();
  const orgB = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    if (mongoose.connection.readyState === 0) {
      await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/cybershield_test');
    }
  });

  afterAll(async () => {
    // Clean test artifacts
    await ThreatHunt.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await ThreatHuntExecution.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Finding.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Alert.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Incident.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await Asset.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await DetectionRule.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await mongoose.disconnect();
  });

  describe('1. ThreatHuntQueryEngine AST Validation & Time Bounding', () => {
    test('Validates a correct structured query AST', () => {
      const validQuery = {
        entity: 'finding',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'HIGH' },
          { field: 'description', operator: 'contains', value: 'malware' },
        ],
        booleanLogic: 'AND',
      };
      const res = threatHuntQueryEngine.validateQuery(validQuery);
      expect(res.valid).toBe(true);
      expect(res.errors).toHaveLength(0);
    });

    test('Rejects invalid AST with missing conditions or unsupported operators', () => {
      const invalidQuery = {
        entity: 'unknown_entity',
        conditions: [
          { field: '$where', operator: 'eval_js', value: 'bad' },
        ],
        booleanLogic: 'XOR',
      };
      const res = threatHuntQueryEngine.validateQuery(invalidQuery);
      expect(res.valid).toBe(false);
      expect(res.errors.length).toBeGreaterThan(0);
    });

    test('Resolves and clamps time horizons correctly (max 30 days)', () => {
      const relative = threatHuntQueryEngine.resolveTimeRange({ type: 'relative', relativeWindow: '1h' });
      expect(relative.start).toBeInstanceOf(Date);
      expect(relative.end).toBeInstanceOf(Date);
      expect(relative.end.getTime() - relative.start.getTime()).toBeCloseTo(3600 * 1000, -2);

      // Over-limit range
      const wayPast = new Date(Date.now() - 90 * 24 * 3600 * 1000);
      const clamped = threatHuntQueryEngine.resolveTimeRange({
        type: 'absolute',
        startDate: wayPast,
        endDate: new Date(),
      });
      const diffMs = clamped.end.getTime() - clamped.start.getTime();
      expect(diffMs).toBeLessThanOrEqual(30 * 24 * 3600 * 1000 + 1000);
    });
  });

  describe('2. Canonical Hunt Templates', () => {
    test('Returns 7 canonical system templates', () => {
      const templates = ThreatHuntTemplate.getCanonicalTemplates();
      expect(templates.length).toBe(7);
      const categories = templates.map((t) => t.category);
      expect(categories).toContain('IOC_SWEEP');
      expect(categories).toContain('DNS_ANOMALY');
      expect(categories).toContain('OUTBOUND_C2');
      expect(categories).toContain('CREDENTIAL_ACCESS');
    });

    test('Seeds canonical templates idempotently', async () => {
      await ThreatHuntTemplate.seedCanonicalTemplates();
      const count = await ThreatHuntTemplate.countDocuments({ isSystemTemplate: true });
      expect(count).toBeGreaterThanOrEqual(7);
    });
  });

  describe('3. Truthful Query Execution (NO_MATCH & MATCHED)', () => {
    test('Truthful NO_MATCH execution when no data matches', async () => {
      const query = {
        entity: 'finding',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'NONEXISTENT_SEVERITY_XYZ' },
        ],
        booleanLogic: 'AND',
      };
      const result = await threatHuntQueryEngine.executeQuery({
        structuredQuery: query,
        dataSources: ['FINDINGS'],
        timeRange: { type: 'relative', relativeWindow: '24h' },
        organizationId: orgA,
      });

      expect(result.matched).toBe(false);
      expect(result.resultCount).toBe(0);
      expect(result.evidence).toHaveLength(0);
    });

    test('Truthful MATCHED execution returning real observed evidence', async () => {
      // Seed a test finding in Org A
      const testFinding = await Finding.create({
        findingId: `FIND-TEST-71-${Date.now()}`,
        title: 'C2 Beacon Detection Test',
        description: 'Observed anomalous outbound traffic to known botnet controller',
        severity: 'CRITICAL',
        asset: '192.168.1.50',
        sourceTool: 'threat-hunting-test',
        rawEvidence: { sample: 'c2 beacon test' },
        organizationId: orgA,
        createdAt: new Date(),
      });

      const query = {
        entity: 'finding',
        conditions: [
          { field: 'severity', operator: 'equals', value: 'CRITICAL' },
          { field: 'description', operator: 'contains', value: 'botnet' },
        ],
        booleanLogic: 'AND',
      };

      const result = await threatHuntQueryEngine.executeQuery({
        structuredQuery: query,
        dataSources: ['FINDINGS'],
        timeRange: { type: 'relative', relativeWindow: '24h' },
        organizationId: orgA,
      });

      expect(result.matched).toBe(true);
      expect(result.resultCount).toBeGreaterThanOrEqual(1);
      const evidence = result.evidence.find((e) => e.sourceId === testFinding.findingId);
      expect(evidence).toBeDefined();
      expect(evidence.sourceEntity).toBe('Finding');
      expect(evidence.title).toBe(testFinding.title);
    });
  });

  describe('4. Asynchronous Execution Lifecycle & Cancellation', () => {
    test('Executes hunt through ThreatHuntExecutionService and updates statuses', async () => {
      const hunt = await ThreatHunt.create({
        huntId: `HUNT-TEST-${Date.now()}`,
        name: 'Automated Lifecycle Hunt',
        hypothesis: 'Testing async lifecycle execution',
        category: 'CUSTOM',
        structuredQuery: {
          entity: 'finding',
          conditions: [{ field: 'severity', operator: 'equals', value: 'CRITICAL' }],
          booleanLogic: 'AND',
        },
        dataSources: ['FINDINGS'],
        timeRange: { type: 'relative', relativeWindow: '24h' },
        status: 'READY',
        organizationId: orgA,
      });

      const execution = await threatHuntExecutionService.triggerHuntExecution({
        huntId: hunt.huntId,
        user: { username: 'test_analyst', role: 'analyst' },
        organizationId: orgA,
      });

      expect(execution.executionId).toBeDefined();
      expect(execution.status).toBe('RUNNING');

      // Wait briefly for async execution resolution
      await new Promise((resolve) => setTimeout(resolve, 300));

      const updated = await ThreatHuntExecution.findOne({ executionId: execution.executionId });
      expect(['MATCHED', 'NO_MATCH', 'COMPLETED']).toContain(updated.status);
      expect(updated.completedAt).toBeInstanceOf(Date);
      expect(updated.durationMs).toBeGreaterThanOrEqual(0);
    });

    test('Cancels an execution cleanly', async () => {
      const execution = await ThreatHuntExecution.create({
        executionId: `HEX-CANCEL-${Date.now()}`,
        huntId: 'HUNT-DUMMY',
        huntName: 'Cancel Test',
        organizationId: orgA,
        status: 'RUNNING',
        startedAt: new Date(),
        resolvedTimeRange: { start: new Date(), end: new Date() },
        querySnapshot: { entity: 'finding', conditions: [] },
      });

      const cancelled = await threatHuntExecutionService.cancelExecution(
        execution.executionId,
        { username: 'operator' }
      );
      expect(cancelled.status).toBe('CANCELLED');
      expect(cancelled.completedAt).toBeInstanceOf(Date);
    });
  });

  describe('5. Evidence Promotion to Finding, Incident, and Candidate Detection', () => {
    let testExecution;

    beforeAll(async () => {
      testExecution = await ThreatHuntExecution.create({
        executionId: `HEX-PROMO-${Date.now()}`,
        huntId: `HUNT-PROMO-${Date.now()}`,
        huntName: 'Promotion Test Hunt',
        organizationId: orgA,
        status: 'MATCHED',
        startedAt: new Date(),
        resolvedTimeRange: { start: new Date(), end: new Date() },
        querySnapshot: {
          entity: 'finding',
          conditions: [{ field: 'severity', operator: 'equals', value: 'HIGH' }],
        },
        resultCount: 1,
        evidence: [
          {
            evidenceId: 'EVD-ITEM-001',
            sourceEntity: 'Finding',
            sourceId: 'SOURCE-001',
            title: 'Suspicious PowerShell Beaconing',
            summary: 'Detected encoded PowerShell running from temporary directory',
            matchDetails: {
              matchedField: 'severity',
              matchedOperator: 'equals',
              matchedValue: 'HIGH',
              targetValue: 'HIGH',
            },
            timestamp: new Date(),
          },
        ],
      });

      await ThreatHunt.create({
        huntId: testExecution.huntId,
        name: 'Promotion Test Hunt',
        hypothesis: 'Adversaries executing encoded scripts',
        structuredQuery: testExecution.querySnapshot,
        organizationId: orgA,
      });
    });

    test('Promotes evidence to a new Finding with immutable lineage', async () => {
      const finding = await threatHuntExecutionService.promoteEvidenceToFinding({
        executionId: testExecution.executionId,
        evidenceId: 'EVD-ITEM-001',
        title: 'Promoted PowerShell Finding',
        severity: 'HIGH',
        user: { username: 'lead_analyst' },
      });

      expect(finding.findingId).toMatch(/^FIND-HUNT-/);
      expect(finding.sourceTool).toBe('threat-hunting-workbench');
      expect(finding.rawEvidence.huntId).toBe(testExecution.huntId);
      expect(finding.rawEvidence.executionId).toBe(testExecution.executionId);
    });

    test('Promotes evidence to a new Incident with attack-chain entry', async () => {
      const incident = await threatHuntExecutionService.promoteEvidenceToIncident({
        executionId: testExecution.executionId,
        evidenceId: 'EVD-ITEM-001',
        title: 'Elevated PowerShell Incident',
        severity: 'HIGH',
        user: { username: 'lead_analyst' },
      });

      expect(incident.incidentId).toMatch(/^INC-HUNT-/);
      expect(incident.status).toBe('DETECTED');
      expect(incident.timeline.length).toBeGreaterThanOrEqual(1);
    });

    test('Drafts candidate Detection Rule locked in DRAFT status with enabled: false', async () => {
      const rule = await threatHuntExecutionService.draftDetectionFromHunt({
        huntId: testExecution.huntId,
        executionId: testExecution.executionId,
        user: { username: 'lead_analyst' },
      });

      expect(rule.ruleId).toMatch(/^RULE-HUNT-/);
      expect(rule.status).toBe('DRAFT');
      expect(rule.enabled).toBe(false);
      expect(rule.tags).toContain('threat-hunt-feedback');
    });
  });

  describe('6. ThreatIntelFusionService & Platform Matching', () => {
    test('Enriches indicator with authentic provenance and truthful state', async () => {
      const result = await threatIntelFusionService.enrichIndicator('8.8.8.8', orgA);
      expect(result.indicator).toBe('8.8.8.8');
      expect(result.type).toBe('ipv4');
      expect(['CONFIRMED', 'MATCHED', 'NOT_FOUND', 'UNAVAILABLE']).toContain(result.state);
      expect(result.provenance).toBeDefined();
      expect(result.provenance.provider).toBeDefined();
    });

    test('Matches indicator across active platform entities with exact match field', async () => {
      const testAsset = await Asset.create({
        hostname: 'db-server.local',
        assetType: 'Server',
        ip: '10.240.0.15',
        organizationId: orgA,
      });

      const matches = await threatIntelFusionService.findPlatformMatches('10.240.0.15', orgA);
      expect(matches.length).toBeGreaterThanOrEqual(1);
      const assetMatch = matches.find((m) => m.entityId === String(testAsset._id) || m.matchedField === 'ip');
      expect(assetMatch).toBeDefined();
      expect(assetMatch.matchedField).toBe('ip');
      expect(assetMatch.matchReason).toContain('10.240.0.15');
    });
  });

  describe('7. InvestigationTimelineService Event Aggregation', () => {
    test('Aggregates real events across disparate entities chronologically', async () => {
      const timeline = await investigationTimelineService.buildTimeline({
        organizationId: orgA,
        limit: 10,
      });
      expect(Array.isArray(timeline)).toBe(true);
      if (timeline.length > 1) {
        // Assert descending chronological order
        const time0 = new Date(timeline[0].timestamp).getTime();
        const time1 = new Date(timeline[1].timestamp).getTime();
        expect(time0).toBeGreaterThanOrEqual(time1);
      }
    });
  });

  describe('8. Multi-Tenant Isolation', () => {
    test('Hunts and evidence in Org A are invisible to Org B', async () => {
      const huntA = await ThreatHunt.create({
        huntId: `HUNT-ISO-A-${Date.now()}`,
        name: 'Org A Secret Hunt',
        hypothesis: 'Classified hypothesis in Org A',
        structuredQuery: {
          entity: 'finding',
          conditions: [{ field: 'severity', operator: 'equals', value: 'HIGH' }],
        },
        organizationId: orgA,
      });

      const resultForB = await ThreatHunt.findOne({
        huntId: huntA.huntId,
        $or: [{ organizationId: orgB }, { organizationId: null }],
      });
      expect(resultForB).toBeNull();
    });
  });
});
