/**
 * 🛡️ CyberShield X — Phase 81 Step 1: Data Models & Schema Foundations
 *
 * Acceptance test battery covering:
 *  A. IntegrationConfig enum extension (ServiceNow, Webhook)
 *  B. IntegrationConfig toSafeObject secret masking (webhookSecret, password)
 *  C. Case.js externalTickets subdocument schema validation
 *  D. Case.js externalTickets compound indexes
 *  E. IntegrationSyncEvent model schema validation
 *  F. IntegrationSyncEvent compound indexes
 *  G. RetentionPolicy integration_audit enum registration
 *  H. DataLifecycleService integration_audit resolver
 *  I. Backward compatibility — existing IntegrationConfig types preserved
 *  J. Backward compatibility — existing Case fields preserved
 *  K. Phase boundary — zero Phase 80 interference
 *  L. Phase boundary — zero Phase 79 interference
 */

const mongoose = require('mongoose');

// ─── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Extracts index specifications from a Mongoose schema.
 * Returns an array of objects, each representing an index's key definition.
 */
function getSchemaIndexes(schema) {
  const indexes = [];
  // Schema-level indexes declared via schema.index()
  if (schema._indexes && Array.isArray(schema._indexes)) {
    schema._indexes.forEach(entry => {
      if (entry && entry[0]) indexes.push(entry[0]);
    });
  }
  return indexes;
}

/**
 * Checks if a specific compound index key pattern exists in a list of index keys.
 */
function hasIndex(indexes, keyPattern) {
  return indexes.some(idx => {
    const idxKeys = Object.keys(idx);
    const patternKeys = Object.keys(keyPattern);
    if (idxKeys.length !== patternKeys.length) return false;
    return patternKeys.every(
      k => idx[k] !== undefined && idx[k] === keyPattern[k]
    );
  });
}

// ─── Models Under Test ─────────────────────────────────────────────────────────

const IntegrationConfig = require('../models/IntegrationConfig');
const Case = require('../models/Case');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const RetentionPolicy = require('../models/RetentionPolicy');

// ─── Service Under Test ────────────────────────────────────────────────────────

const DataLifecycleService = require('../services/soc/DataLifecycleService');

// ─── Protected Boundary Models (Phase 80, 79) ─────────────────────────────────

const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE A: IntegrationConfig Enum Extension
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate A: IntegrationConfig Enum Extension', () => {
  const typePath = IntegrationConfig.schema.path('type');
  const enumValues = typePath.enumValues;

  test('A-01: type enum includes original values (Jira, GitHub, Slack, Teams, PagerDuty)', () => {
    expect(enumValues).toContain('Jira');
    expect(enumValues).toContain('GitHub');
    expect(enumValues).toContain('Slack');
    expect(enumValues).toContain('Teams');
    expect(enumValues).toContain('PagerDuty');
  });

  test('A-02: type enum includes Phase 81 ServiceNow', () => {
    expect(enumValues).toContain('ServiceNow');
  });

  test('A-03: type enum includes Phase 81 Webhook', () => {
    expect(enumValues).toContain('Webhook');
  });

  test('A-04: type enum has exactly 7 values', () => {
    expect(enumValues).toHaveLength(7);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE B: IntegrationConfig Secret Masking
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate B: IntegrationConfig Secret Masking', () => {
  test('B-01: toSafeObject masks webhookSecret', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'Jira',
      name: 'Test Jira',
      config: { baseUrl: 'https://test.atlassian.net', webhookSecret: 'super-secret-hmac-key' },
    });
    const safe = doc.toSafeObject();
    expect(safe.config.webhookSecret).toBe('••••••••');
    expect(safe.config.baseUrl).toBe('https://test.atlassian.net');
  });

  test('B-02: toSafeObject masks password (ServiceNow)', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'ServiceNow',
      name: 'Test ServiceNow',
      config: { instanceUrl: 'https://dev12345.service-now.com', username: 'admin', password: 'p@ssw0rd!' },
    });
    const safe = doc.toSafeObject();
    expect(safe.config.password).toBe('••••••••');
    expect(safe.config.instanceUrl).toBe('https://dev12345.service-now.com');
    expect(safe.config.username).toBe('admin');
  });

  test('B-03: toSafeObject masks apiToken (PagerDuty)', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'PagerDuty',
      name: 'Test PD',
      config: { routingKey: 'routing-key-123', apiToken: 'pd-api-token', serviceId: 'PSVC123', webhookSecret: 'hmac-key' },
    });
    const safe = doc.toSafeObject();
    expect(safe.config.routingKey).toBe('••••••••');
    expect(safe.config.apiToken).toBe('••••••••');
    expect(safe.config.webhookSecret).toBe('••••••••');
    expect(safe.config.serviceId).toBe('PSVC123');
  });

  test('B-04: toSafeObject preserves non-sensitive fields unchanged', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'ServiceNow',
      name: 'SN Prod',
      config: { instanceUrl: 'https://prod.service-now.com', defaultTable: 'incident', callerId: 'user123' },
    });
    const safe = doc.toSafeObject();
    expect(safe.config.instanceUrl).toBe('https://prod.service-now.com');
    expect(safe.config.defaultTable).toBe('incident');
    expect(safe.config.callerId).toBe('user123');
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE C: Case.js externalTickets Subdocument
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate C: Case externalTickets Schema', () => {
  const caseSchema = Case.schema;

  test('C-01: externalTickets field exists on Case schema', () => {
    const path = caseSchema.path('externalTickets');
    expect(path).toBeDefined();
  });

  test('C-02: externalTickets is an Array type', () => {
    const path = caseSchema.path('externalTickets');
    expect(path).toBeDefined();
    expect(path.instance).toBe('Array');
  });

  test('C-03: externalTickets.provider has correct enum', () => {
    const providerPath = caseSchema.path('externalTickets.provider');
    expect(providerPath).toBeDefined();
    expect(providerPath.enumValues).toEqual(
      expect.arrayContaining(['JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC'])
    );
    expect(providerPath.enumValues).toHaveLength(4);
  });

  test('C-04: externalTickets.syncStatus has correct enum and default', () => {
    const syncPath = caseSchema.path('externalTickets.syncStatus');
    expect(syncPath).toBeDefined();
    expect(syncPath.enumValues).toEqual(
      expect.arrayContaining(['IN_SYNC', 'SYNC_PENDING', 'SYNC_FAILED', 'MANUAL_OVERRIDE'])
    );
    expect(syncPath.defaultValue).toBe('IN_SYNC');
  });

  test('C-05: externalTickets.syncDirection has correct enum and default', () => {
    const dirPath = caseSchema.path('externalTickets.syncDirection');
    expect(dirPath).toBeDefined();
    expect(dirPath.enumValues).toEqual(
      expect.arrayContaining(['BIDIRECTIONAL', 'OUTBOUND_ONLY', 'INBOUND_ONLY'])
    );
    expect(dirPath.defaultValue).toBe('BIDIRECTIONAL');
  });

  test('C-06: externalTickets.integrationId references IntegrationConfig', () => {
    const refPath = caseSchema.path('externalTickets.integrationId');
    expect(refPath).toBeDefined();
    expect(refPath.options.ref).toBe('IntegrationConfig');
  });

  test('C-07: externalTickets required fields enforced (provider, integrationId, ticketId, ticketKey, ticketUrl, externalStatus)', () => {
    const requiredFields = ['provider', 'integrationId', 'ticketId', 'ticketKey', 'ticketUrl', 'externalStatus'];
    requiredFields.forEach(field => {
      const fieldPath = caseSchema.path(`externalTickets.${field}`);
      expect(fieldPath).toBeDefined();
      expect(fieldPath.isRequired).toBeTruthy();
    });
  });

  test('C-08: existing Case can be created without externalTickets (backward compatible)', () => {
    const caseDoc = new Case({
      caseId: 'CASE-BC-001',
      title: 'Backward Compat Test',
      analystId: 'analyst-1',
      organizationId: new mongoose.Types.ObjectId(),
    });
    expect(caseDoc.externalTickets).toBeDefined();
    expect(caseDoc.externalTickets).toHaveLength(0);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE D: Case.js externalTickets Compound Indexes
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate D: Case externalTickets Indexes', () => {
  const indexes = getSchemaIndexes(Case.schema);

  test('D-01: compound index on { externalTickets.ticketKey: 1, organizationId: 1 } exists', () => {
    expect(hasIndex(indexes, { 'externalTickets.ticketKey': 1, organizationId: 1 })).toBe(true);
  });

  test('D-02: compound index on { externalTickets.ticketId: 1, externalTickets.provider: 1 } exists', () => {
    expect(hasIndex(indexes, { 'externalTickets.ticketId': 1, 'externalTickets.provider': 1 })).toBe(true);
  });

  test('D-03: existing Case indexes preserved', () => {
    expect(hasIndex(indexes, { status: 1, severity: 1 })).toBe(true);
    expect(hasIndex(indexes, { organizationId: 1, status: 1 })).toBe(true);
    expect(hasIndex(indexes, { organizationId: 1, severity: 1 })).toBe(true);
    expect(hasIndex(indexes, { organizationId: 1, createdAt: -1 })).toBe(true);
    expect(hasIndex(indexes, { 'assets': 1 })).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE E: IntegrationSyncEvent Model
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate E: IntegrationSyncEvent Model Schema', () => {
  const schema = IntegrationSyncEvent.schema;

  test('E-01: syncId field exists and is unique', () => {
    const path = schema.path('syncId');
    expect(path).toBeDefined();
    expect(path.options.unique).toBe(true);
    expect(path.isRequired).toBeTruthy();
  });

  test('E-02: organizationId field exists and is required', () => {
    const path = schema.path('organizationId');
    expect(path).toBeDefined();
    expect(path.isRequired).toBeTruthy();
  });

  test('E-03: integrationId references IntegrationConfig', () => {
    const path = schema.path('integrationId');
    expect(path).toBeDefined();
    expect(path.options.ref).toBe('IntegrationConfig');
    expect(path.isRequired).toBeTruthy();
  });

  test('E-04: provider enum is [JIRA, SERVICENOW, PAGERDUTY, GENERIC]', () => {
    const path = schema.path('provider');
    expect(path.enumValues).toEqual(
      expect.arrayContaining(['JIRA', 'SERVICENOW', 'PAGERDUTY', 'GENERIC'])
    );
    expect(path.enumValues).toHaveLength(4);
  });

  test('E-05: direction enum is [INBOUND, OUTBOUND]', () => {
    const path = schema.path('direction');
    expect(path.enumValues).toEqual(
      expect.arrayContaining(['INBOUND', 'OUTBOUND'])
    );
    expect(path.enumValues).toHaveLength(2);
  });

  test('E-06: targetEntityType enum is [CASE, INCIDENT, APPROVAL]', () => {
    const path = schema.path('targetEntityType');
    expect(path.enumValues).toEqual(
      expect.arrayContaining(['CASE', 'INCIDENT', 'APPROVAL'])
    );
    expect(path.enumValues).toHaveLength(3);
  });

  test('E-07: status enum is [SUCCESS, DUPLICATE, FAILED, REJECTED]', () => {
    const path = schema.path('status');
    expect(path.enumValues).toEqual(
      expect.arrayContaining(['SUCCESS', 'DUPLICATE', 'FAILED', 'REJECTED'])
    );
    expect(path.enumValues).toHaveLength(4);
  });

  test('E-08: payloadHash is required', () => {
    const path = schema.path('payloadHash');
    expect(path).toBeDefined();
    expect(path.isRequired).toBeTruthy();
  });

  test('E-09: attempt defaults to 1', () => {
    const path = schema.path('attempt');
    expect(path).toBeDefined();
    expect(path.defaultValue).toBe(1);
  });

  test('E-10: durationMs defaults to 0', () => {
    const path = schema.path('durationMs');
    expect(path).toBeDefined();
    expect(path.defaultValue).toBe(0);
  });

  test('E-11: timestamps enabled, versionKey disabled', () => {
    expect(schema.options.timestamps).toBe(true);
    expect(schema.options.versionKey).toBe(false);
  });

  test('E-12: zero native TTL index on processedAt', () => {
    // Verify no TTL index (expires option) is set on any path
    const processedAtPath = schema.path('processedAt');
    expect(processedAtPath.options.expires).toBeUndefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE F: IntegrationSyncEvent Compound Indexes
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate F: IntegrationSyncEvent Compound Indexes', () => {
  const indexes = getSchemaIndexes(IntegrationSyncEvent.schema);

  test('F-01: compound index on { organizationId: 1, processedAt: -1 } exists', () => {
    expect(hasIndex(indexes, { organizationId: 1, processedAt: -1 })).toBe(true);
  });

  test('F-02: compound index on { organizationId: 1, provider: 1, processedAt: -1 } exists', () => {
    expect(hasIndex(indexes, { organizationId: 1, provider: 1, processedAt: -1 })).toBe(true);
  });

  test('F-03: compound index on { organizationId: 1, targetEntityId: 1 } exists', () => {
    expect(hasIndex(indexes, { organizationId: 1, targetEntityId: 1 })).toBe(true);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE G: RetentionPolicy integration_audit Registration
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate G: RetentionPolicy Enum Registration', () => {
  const entityTypePath = RetentionPolicy.schema.path('entityType');

  test('G-01: integration_audit is a valid entityType value', () => {
    expect(entityTypePath.enumValues).toContain('integration_audit');
  });

  test('G-02: all previous entityType values preserved', () => {
    const expected = [
      'audit_events', 'reports', 'evidence_packages', 'incidents', 'cases',
      'findings', 'alerts', 'threat_hunts', 'threat_hunt_executions',
      'detection_rules', 'metric_snapshots', 'cloud_telemetry',
    ];
    expected.forEach(val => {
      expect(entityTypePath.enumValues).toContain(val);
    });
  });

  test('G-03: entityType enum has exactly 13 values (12 existing + 1 new)', () => {
    expect(entityTypePath.enumValues).toHaveLength(13);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE H: DataLifecycleService integration_audit Resolver
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate H: DataLifecycleService Resolver', () => {
  // DataLifecycleService exports a singleton instance, not a class
  const service = DataLifecycleService;

  test('H-01: _resolveEntityModel resolves integration_audit to IntegrationSyncEvent', () => {
    const result = service._resolveEntityModel('integration_audit');
    expect(result).toBeDefined();
    expect(result.model).toBe(IntegrationSyncEvent);
    expect(result.dateField).toBe('processedAt');
    expect(result.idField).toBe('syncId');
  });

  test('H-02: existing entity type cloud_telemetry still resolves correctly', () => {
    const result = service._resolveEntityModel('cloud_telemetry');
    expect(result).toBeDefined();
    expect(result.model).toBe(CloudTelemetryEvent);
    expect(result.dateField).toBe('eventTime');
    expect(result.idField).toBe('canonicalEventId');
  });

  test('H-03: unsupported entity type still throws', () => {
    expect(() => service._resolveEntityModel('nonexistent_type')).toThrow(
      'Unsupported entityType for data retention: nonexistent_type'
    );
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE I: Backward Compatibility — IntegrationConfig
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate I: IntegrationConfig Backward Compatibility', () => {
  test('I-01: existing Jira config validates without error', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'Jira',
      name: 'Existing Jira',
      config: { baseUrl: 'https://acme.atlassian.net', email: 'user@acme.com', apiToken: 'token123' },
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('I-02: existing PagerDuty config validates without error', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'PagerDuty',
      name: 'Existing PD',
      config: { routingKey: 'rk-123', serviceId: 'PSVC' },
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('I-03: new ServiceNow config validates without error', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'ServiceNow',
      name: 'New ServiceNow',
      config: { instanceUrl: 'https://dev.service-now.com', username: 'admin', password: 'pass' },
    });
    const err = doc.validateSync();
    expect(err).toBeUndefined();
  });

  test('I-04: invalid type still rejected', () => {
    const doc = new IntegrationConfig({
      organizationId: new mongoose.Types.ObjectId(),
      type: 'InvalidType',
      name: 'Bad Type',
      config: {},
    });
    const err = doc.validateSync();
    expect(err).toBeDefined();
    expect(err.errors.type).toBeDefined();
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE J: Backward Compatibility — Case
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate J: Case Backward Compatibility', () => {
  test('J-01: existing Case fields are preserved', () => {
    const requiredPaths = [
      'caseId', 'title', 'analystId', 'severity', 'status',
      'tags', 'assets', 'scans', 'evidence', 'timeline',
      'sla.policyId', 'closure.closedAt',
    ];
    requiredPaths.forEach(p => {
      expect(Case.schema.path(p)).toBeDefined();
    });
  });

  test('J-02: Case status enum unchanged', () => {
    const statusPath = Case.schema.path('status');
    expect(statusPath.enumValues).toEqual([
      'NEW', 'OPEN', 'IN_PROGRESS', 'ESCALATED', 'CONTAINED', 'RESOLVED', 'CLOSED', 'ARCHIVED',
    ]);
  });

  test('J-03: Case severity enum unchanged', () => {
    const sevPath = Case.schema.path('severity');
    expect(sevPath.enumValues).toEqual(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE K: Phase Boundary — Phase 80
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate K: Phase 80 Boundary Isolation', () => {
  test('K-01: CloudTelemetryEvent model is unchanged (schema paths)', () => {
    const expectedPaths = [
      'canonicalEventId', 'organizationId', 'provider', 'nativeEventId',
      'eventTime', 'action.service', 'actor.principalId', 'severity',
    ];
    expectedPaths.forEach(p => {
      expect(CloudTelemetryEvent.schema.path(p)).toBeDefined();
    });
  });

  test('K-02: cloud_telemetry entityType still resolves in DataLifecycleService', () => {
    const service = DataLifecycleService;
    const result = service._resolveEntityModel('cloud_telemetry');
    expect(result.model).toBe(CloudTelemetryEvent);
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// TEST SUITE L: Phase Boundary — Phase 79
// ═══════════════════════════════════════════════════════════════════════════════

describe('Phase 81 Step 1 — Gate L: Phase 79 Boundary Isolation', () => {
  test('L-01: IntegrationSyncEvent does NOT import or reference DecisionIntelligenceService', () => {
    // Verify the IntegrationSyncEvent model file does not require DI-related modules
    const modelSource = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'models', 'IntegrationSyncEvent.js'),
      'utf8'
    );
    expect(modelSource).not.toContain('DecisionIntelligence');
    expect(modelSource).not.toContain('DecisionTrace');
    expect(modelSource).not.toContain('DecisionEvaluation');
    expect(modelSource).not.toContain('DecisionAssessment');
  });

  test('L-02: IntegrationSyncEvent does NOT import or reference SecurityGraphNode', () => {
    const modelSource = require('fs').readFileSync(
      require('path').join(__dirname, '..', 'models', 'IntegrationSyncEvent.js'),
      'utf8'
    );
    expect(modelSource).not.toContain('SecurityGraphNode');
    expect(modelSource).not.toContain('SecurityGraphEdge');
  });
});
