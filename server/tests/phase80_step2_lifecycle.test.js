/**
 * 🛡️ CyberShield X — Phase 80 Step 2 Acceptance Test Suite
 *
 * Validates Phase 75 DataLifecycleService integration for 'cloud_telemetry':
 * - TEST A: cloud_telemetry resolves to CloudTelemetryEvent (dateField: 'eventTime', idField: 'canonicalEventId')
 * - TEST B: tenant retention pruning removes only eligible cloud telemetry records for the target organization
 * - TEST C: active legal hold prevents deletion of eligible cloud telemetry (ZERO records deleted)
 * - TEST D: released legal hold allows normal retention pruning
 * - TEST E: retention cutoff strictly uses eventTime (not createdAt / ingestionTime)
 * - TEST F: pruning remains bounded by the existing batch limit (MAX_BATCH_SIZE <= 500)
 * - TEST G: existing Phase 75 entity types still behave identically
 * - TEST H: no TTL index exists on CloudTelemetryEvent schema
 */

const mongoose = require('mongoose');
const crypto = require('crypto');

const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const RetentionPolicy = require('../models/RetentionPolicy');
const Incident = require('../models/Incident');
const AuditEvent = require('../models/AuditEvent');

const DataLifecycleService = require('../services/soc/DataLifecycleService');
const { connectTestDb, closeTestDb } = require('./helpers/testDbHelper');

describe('Phase 80 Step 2 — DataLifecycleService Integration for cloud_telemetry', () => {
  const orgA = 'org-p80-alpha';
  const orgB = 'org-p80-beta';

  const userAdminA = { _id: 'admin-p80-a', username: 'admin_a', role: 'ADMIN', organizationId: orgA };
  const userAnalystA = { _id: 'analyst-p80-a', username: 'analyst_a', role: 'ANALYST', organizationId: orgA };
  const userAdminB = { _id: 'admin-p80-b', username: 'admin_b', role: 'ADMIN', organizationId: orgB };

  const cleanup = async () => {
    await CloudTelemetryEvent.deleteMany({ organizationId: { $in: [orgA, orgB] } });
    await RetentionPolicy.deleteMany({ organizationId: { $in: [orgA, orgB] } });
  };

  beforeAll(async () => {
    await connectTestDb();
    await cleanup();
  });

  afterAll(async () => {
    await cleanup();
    await closeTestDb();
  });

  // TEST A: Model & Field Resolution
  test('TEST A: cloud_telemetry resolves to CloudTelemetryEvent with eventTime and canonicalEventId', () => {
    const resolved = DataLifecycleService._resolveEntityModel('cloud_telemetry');
    expect(resolved).toBeDefined();
    expect(resolved.model).toBe(CloudTelemetryEvent);
    expect(resolved.dateField).toBe('eventTime');
    expect(resolved.idField).toBe('canonicalEventId');
  });

  // TEST B: Tenant Scoping & Eligibility
  test('TEST B: Tenant retention pruning removes only eligible records for target organization', async () => {
    await cleanup();

    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000); // 100 days old (eligible for 90d policy)
    const freshDate = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000); // 10 days old (ineligible)

    // Org A: 2 eligible, 1 recent
    await CloudTelemetryEvent.create([
      {
        canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-1',
        organizationId: orgA,
        connectorId: 'conn-aws-1',
        provider: 'AWS',
        nativeEventId: 'ev-1',
        cloudAccountId: '111122223333',
        eventTime: oldDate,
        rawPayloadHash: 'hash-1',
      },
      {
        canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-2',
        organizationId: orgA,
        connectorId: 'conn-aws-1',
        provider: 'AWS',
        nativeEventId: 'ev-2',
        cloudAccountId: '111122223333',
        eventTime: oldDate,
        rawPayloadHash: 'hash-2',
      },
      {
        canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-recent',
        organizationId: orgA,
        connectorId: 'conn-aws-1',
        provider: 'AWS',
        nativeEventId: 'ev-recent',
        cloudAccountId: '111122223333',
        eventTime: freshDate,
        rawPayloadHash: 'hash-recent',
      },
    ]);

    // Org B: 2 eligible records (must NEVER be touched when pruning Org A)
    await CloudTelemetryEvent.create([
      {
        canonicalEventId: 'CLOUD-AWS-org-p80-beta-ev-b1',
        organizationId: orgB,
        connectorId: 'conn-aws-2',
        provider: 'AWS',
        nativeEventId: 'ev-b1',
        cloudAccountId: '444455556666',
        eventTime: oldDate,
        rawPayloadHash: 'hash-b1',
      },
      {
        canonicalEventId: 'CLOUD-AWS-org-p80-beta-ev-b2',
        organizationId: orgB,
        connectorId: 'conn-aws-2',
        provider: 'AWS',
        nativeEventId: 'ev-b2',
        cloudAccountId: '444455556666',
        eventTime: oldDate,
        rawPayloadHash: 'hash-b2',
      },
    ]);

    // Configure 90-day retention policy for Org A
    await DataLifecycleService.upsertRetentionPolicy(
      orgA,
      { entityType: 'cloud_telemetry', retentionDays: 90, retentionClass: 'EXPIRE' },
      userAdminA
    );

    // Dry-run verification
    const dryRun = await DataLifecycleService.dryRunRetention(orgA, 'cloud_telemetry');
    expect(dryRun.dryRun).toBe(true);
    expect(dryRun.eligibleCount).toBe(2);

    // Execute retention for Org A
    const execResult = await DataLifecycleService.executeRetention(orgA, 'cloud_telemetry', userAdminA);
    expect(execResult.status).toBe('SUCCESS');
    expect(execResult.deletedCount).toBe(2);

    // Verify Org A state: only the recent event remains
    const orgARecords = await CloudTelemetryEvent.find({ organizationId: orgA });
    expect(orgARecords.length).toBe(1);
    expect(orgARecords[0].canonicalEventId).toBe('CLOUD-AWS-org-p80-alpha-ev-recent');

    // Verify Org B state: 100% untouched
    const orgBRecords = await CloudTelemetryEvent.find({ organizationId: orgB });
    expect(orgBRecords.length).toBe(2);
  });

  // TEST C: Active Legal Hold Blocks Deletion
  test('TEST C: Active legal hold strictly prevents deletion of eligible cloud telemetry', async () => {
    // Seed new aged event for Org A
    const oldDate = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000);
    await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-hold',
      organizationId: orgA,
      connectorId: 'conn-aws-1',
      provider: 'AWS',
      nativeEventId: 'ev-hold',
      cloudAccountId: '111122223333',
      eventTime: oldDate,
      rawPayloadHash: 'hash-hold',
    });

    // Engage Legal Hold on Org A for cloud_telemetry
    await DataLifecycleService.setLegalHold(
      orgA,
      'cloud_telemetry',
      true,
      'Federal subpoena SEC-2026-CLOUD',
      userAdminA
    );

    // Dry-run should report BLOCKED
    const dryRun = await DataLifecycleService.dryRunRetention(orgA, 'cloud_telemetry');
    expect(dryRun.legalHoldActive).toBe(true);
    expect(dryRun.projectedAction).toBe('BLOCKED');

    // Execution must be blocked
    const execResult = await DataLifecycleService.executeRetention(orgA, 'cloud_telemetry', userAdminA);
    expect(execResult.blocked).toBe(true);
    expect(execResult.status).toBe('LEGAL_HOLD');
    expect(execResult.deletedCount).toBe(0);

    // Verify document was NOT deleted
    const count = await CloudTelemetryEvent.countDocuments({
      organizationId: orgA,
      canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-hold',
    });
    expect(count).toBe(1);
  });

  // TEST D: Released Legal Hold Allows Pruning
  test('TEST D: Released legal hold allows normal retention pruning', async () => {
    // Release Legal Hold
    await DataLifecycleService.setLegalHold(orgA, 'cloud_telemetry', false, '', userAdminA);

    const dryRun = await DataLifecycleService.dryRunRetention(orgA, 'cloud_telemetry');
    expect(dryRun.legalHoldActive).toBe(false);
    expect(dryRun.projectedAction).toBe('DELETE');

    // Execution should now succeed
    const execResult = await DataLifecycleService.executeRetention(orgA, 'cloud_telemetry', userAdminA);
    expect(execResult.status).toBe('SUCCESS');
    expect(execResult.deletedCount).toBe(1);

    const count = await CloudTelemetryEvent.countDocuments({
      organizationId: orgA,
      canonicalEventId: 'CLOUD-AWS-org-p80-alpha-ev-hold',
    });
    expect(count).toBe(0);
  });

  // TEST E: eventTime is Used for Cutoff (Not createdAt or ingestionTime)
  test('TEST E: Retention cutoff strictly uses eventTime instead of createdAt or ingestionTime', async () => {
    await cleanup();

    const pastEventTime = new Date(Date.now() - 150 * 24 * 60 * 60 * 1000); // 150 days ago
    const recentEventTime = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago

    // Event 1: Ingested recently, but eventTime is old (e.g. backfilled cloud log) -> SHOULD BE PRUNED
    await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-p80-alpha-backfill-old',
      organizationId: orgA,
      connectorId: 'conn-aws-1',
      provider: 'AWS',
      nativeEventId: 'bf-old',
      cloudAccountId: '111122223333',
      eventTime: pastEventTime,
      ingestionTime: new Date(),
      rawPayloadHash: 'hash-bf-old',
    });

    // Event 2: Ingested today, eventTime is recent -> MUST BE PRESERVED
    await CloudTelemetryEvent.create({
      canonicalEventId: 'CLOUD-AWS-org-p80-alpha-fresh',
      organizationId: orgA,
      connectorId: 'conn-aws-1',
      provider: 'AWS',
      nativeEventId: 'fresh-1',
      cloudAccountId: '111122223333',
      eventTime: recentEventTime,
      ingestionTime: new Date(),
      rawPayloadHash: 'hash-fresh',
    });

    await DataLifecycleService.upsertRetentionPolicy(
      orgA,
      { entityType: 'cloud_telemetry', retentionDays: 90, retentionClass: 'EXPIRE' },
      userAdminA
    );

    const execResult = await DataLifecycleService.executeRetention(orgA, 'cloud_telemetry', userAdminA);
    expect(execResult.status).toBe('SUCCESS');
    expect(execResult.deletedCount).toBe(1);

    const remaining = await CloudTelemetryEvent.find({ organizationId: orgA });
    expect(remaining.length).toBe(1);
    expect(remaining[0].canonicalEventId).toBe('CLOUD-AWS-org-p80-alpha-fresh');
  });

  // TEST F: Batch Limit Bounding (<= 500 records)
  test('TEST F: Pruning remains strictly bounded by MAX_BATCH_SIZE (500 limit)', async () => {
    await cleanup();

    const oldDate = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);

    // Generate 550 eligible documents
    const docs = [];
    for (let i = 0; i < 550; i++) {
      docs.push({
        canonicalEventId: `CLOUD-AWS-org-p80-alpha-batch-${i}`,
        organizationId: orgA,
        connectorId: 'conn-aws-1',
        provider: 'AWS',
        nativeEventId: `batch-${i}`,
        cloudAccountId: '111122223333',
        eventTime: oldDate,
        rawPayloadHash: `hash-${i}`,
      });
    }
    await CloudTelemetryEvent.insertMany(docs);

    await DataLifecycleService.upsertRetentionPolicy(
      orgA,
      { entityType: 'cloud_telemetry', retentionDays: 90, retentionClass: 'EXPIRE' },
      userAdminA
    );

    // Request batch size of 1000; service must clamp to MAX_BATCH_SIZE (500)
    const execResult = await DataLifecycleService.executeRetention(
      orgA,
      'cloud_telemetry',
      userAdminA,
      { batchSize: 1000 }
    );

    expect(execResult.batchLimit).toBeLessThanOrEqual(500);
    expect(execResult.deletedCount).toBe(500);

    // 50 documents must remain for subsequent cycle
    const remainingCount = await CloudTelemetryEvent.countDocuments({ organizationId: orgA });
    expect(remainingCount).toBe(50);
  });

  // TEST G: Existing Phase 75 Entity Types & RBAC Remain Identical
  test('TEST G: Existing Phase 75 entity types and RBAC gates behave identically', async () => {
    // Non-admin cannot execute retention on cloud_telemetry
    await expect(
      DataLifecycleService.executeRetention(orgA, 'cloud_telemetry', userAnalystA)
    ).rejects.toThrow('UNAUTHORIZED');

    // Existing entities resolve correctly
    const resIncident = DataLifecycleService._resolveEntityModel('incidents');
    expect(resIncident.model).toBe(Incident);
    expect(resIncident.dateField).toBe('createdAt');

    const resAudit = DataLifecycleService._resolveEntityModel('audit_events');
    expect(resAudit.model).toBe(AuditEvent);
    expect(resAudit.dateField).toBe('timestamp');
  });

  // TEST H: No TTL Index on CloudTelemetryEvent Schema
  test('TEST H: Verified that zero native MongoDB TTL indexes exist on CloudTelemetryEvent', () => {
    const indexes = CloudTelemetryEvent.schema.indexes();
    const ttlIndexes = indexes.filter(([keys, opts]) => opts && opts.expireAfterSeconds !== undefined);
    expect(ttlIndexes.length).toBe(0);

    // Explicit check on eventTime index
    const eventTimeIndex = indexes.find(([keys]) => keys.eventTime !== undefined && Object.keys(keys).length === 1);
    expect(eventTimeIndex).toBeDefined();
    expect(eventTimeIndex[1]?.expireAfterSeconds).toBeUndefined();
  });
});
