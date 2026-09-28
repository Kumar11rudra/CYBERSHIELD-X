/**
 * 🛡️ CyberShield X — Phase 80 Step 4 Test Suite
 *
 * Normalization & Operation Classification Adapters Test Battery:
 * Tests A through AU covering all provider adapters, 5-tier classification,
 * sanitization, resource bounding, tenant boundaries, and persistence isolation.
 */

'use strict';

const CloudTelemetryNormalizer = require('../services/ingestion/CloudTelemetryNormalizer');
const ActionClassifier = require('../services/ingestion/adapters/ActionClassifier');
const BaseCloudAdapter = require('../services/ingestion/adapters/BaseCloudAdapter');
const AwsCloudTrailAdapter = require('../services/ingestion/adapters/AwsCloudTrailAdapter');
const GcpCloudAuditAdapter = require('../services/ingestion/adapters/GcpCloudAuditAdapter');
const AzureActivityLogAdapter = require('../services/ingestion/adapters/AzureActivityLogAdapter');

// Models to verify zero persistence calls
const CloudTelemetryEvent = require('../models/CloudTelemetryEvent');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const SecurityGraphEdge = require('../models/SecurityGraphEdge');
const DecisionAssessment = require('../models/DecisionAssessment');

describe('Phase 80 Step 4 — Normalization & Operation Classification Adapters', () => {
  const baseContext = {
    organizationId: 'org-alpha-123',
    connectorId: 'conn-primary-999',
    status: 'VERIFIED',
    provider: 'AWS',
    enrolledAccountIds: ['123456789012', 'project-sec-999', 'sub-azure-111'],
  };

  // ---------------------------------------------------------------------------
  // AWS CloudTrail Tests
  // ---------------------------------------------------------------------------
  describe('AWS CloudTrail Normalization', () => {
    const validAwsRecord = {
      eventVersion: '1.08',
      userIdentity: {
        type: 'IAMUser',
        principalId: 'AIDAEXAMPLEUSER',
        arn: 'arn:aws:iam::123456789012:user/Alice',
        accountId: '123456789012',
        userName: 'Alice',
      },
      eventTime: '2026-09-17T08:30:00Z',
      eventSource: 'iam.amazonaws.com',
      eventName: 'CreateUser',
      awsRegion: 'us-east-1',
      sourceIPAddress: '198.51.100.42',
      userAgent: 'aws-cli/2.0',
      requestParameters: {
        userName: 'Bob',
        tags: [{ key: 'Department', value: 'Security' }],
      },
      responseElements: { user: { userName: 'Bob' } },
      requestID: 'req-aws-001',
      eventID: 'evt-aws-uuid-001',
      recipientAccountId: '123456789012',
    };

    test('TEST A: AWS basic CloudTrail normalization succeeds', () => {
      const res = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.provider).toBe('AWS');
      expect(res.event.nativeEventId).toBe('evt-aws-uuid-001');
      expect(res.event.cloudAccountId).toBe('123456789012');
      expect(res.event.region).toBe('us-east-1');
      expect(res.event.organizationId).toBe('org-alpha-123');
    });

    test('TEST B: AWS IAM user normalization extracts identity attributes', () => {
      const res = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.actor.principalType).toBe('IAMUser');
      expect(res.event.actor.principalId).toBe('AIDAEXAMPLEUSER');
      expect(res.event.actor.username).toBe('Alice');
      expect(res.event.actor.callerIp).toBe('198.51.100.42');
    });

    test('TEST C: AWS assumed-role normalization resolves session context', () => {
      const assumedRoleRecord = {
        ...validAwsRecord,
        eventID: 'evt-aws-assumed-role-002',
        userIdentity: {
          type: 'AssumedRole',
          principalId: 'AROAWWWWWWW:session-name',
          arn: 'arn:aws:sts::123456789012:assumed-role/SecOpsRole/session-name',
          accountId: '123456789012',
          sessionContext: {
            sessionIssuer: {
              type: 'Role',
              principalId: 'AROAWWWWWWW',
              arn: 'arn:aws:iam::123456789012:role/SecOpsRole',
              userName: 'SecOpsRole',
            },
          },
        },
      };
      const res = CloudTelemetryNormalizer.normalize(assumedRoleRecord, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.actor.principalType).toBe('AssumedRole');
      expect(res.event.actor.username).toBe('SecOpsRole');
    });

    test('TEST D: AWS service identity normalization (AWSService)', () => {
      const serviceRecord = {
        ...validAwsRecord,
        eventID: 'evt-aws-service-003',
        userIdentity: {
          type: 'AWSService',
          invokedBy: 'config.amazonaws.com',
        },
      };
      const res = CloudTelemetryNormalizer.normalize(serviceRecord, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.actor.principalType).toBe('AWSService');
      expect(res.event.actor.principalName).toBe('config.amazonaws.com');
      expect(res.event.actor.serviceAccount).toBe('config.amazonaws.com');
    });

    test('TEST E: AWS native event ID extraction is stable and non-empty', () => {
      const res = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(res.event.nativeEventId).toBe('evt-aws-uuid-001');
      expect(res.event.nativeEventId).not.toContain(Date.now().toString());
    });

    test('TEST F: AWS eventTime extraction parses ISO 8601 into JavaScript Date', () => {
      const res = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(res.event.eventTime).toBeInstanceOf(Date);
      expect(res.event.eventTime.toISOString()).toBe('2026-09-17T08:30:00.000Z');
    });

    test('TEST G: AWS action and service extraction removes domain suffix', () => {
      const res = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(res.event.action.name).toBe('CreateUser');
      expect(res.event.action.operation).toBe('CreateUser');
      expect(res.event.action.service).toBe('iam');
      expect(res.event.action.tier).toBe(1); // CreateUser is Tier 1 Mutating
      expect(res.event.action.isMutating).toBe(true);
    });

    test('TEST H: AWS outcome normalization distinguishes SUCCESS, FAILURE, and DENIED', () => {
      // 1. Success
      const successRes = CloudTelemetryNormalizer.normalize(validAwsRecord, baseContext);
      expect(successRes.event.outcome).toBe('SUCCESS');

      // 2. Denied
      const deniedRecord = {
        ...validAwsRecord,
        eventID: 'evt-aws-denied-001',
        errorCode: 'AccessDenied',
        errorMessage: 'User is not authorized to perform: iam:CreateUser',
      };
      const deniedRes = CloudTelemetryNormalizer.normalize(deniedRecord, baseContext);
      expect(deniedRes.event.outcome).toBe('DENIED');

      // 3. Failure
      const failureRecord = {
        ...validAwsRecord,
        eventID: 'evt-aws-fail-001',
        errorCode: 'InternalFailure',
        errorMessage: 'An internal error occurred',
      };
      const failRes = CloudTelemetryNormalizer.normalize(failureRecord, baseContext);
      expect(failRes.event.outcome).toBe('FAILURE');
    });

    test('TEST I: AWS resource normalization extracts bounded resources', () => {
      const recordWithResources = {
        ...validAwsRecord,
        eventID: 'evt-aws-res-001',
        resources: [
          {
            ARN: 'arn:aws:s3:::cyber-shield-test-bucket',
            accountId: '123456789012',
            type: 'AWS::S3::Bucket',
          },
        ],
      };
      const res = CloudTelemetryNormalizer.normalize(recordWithResources, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.resources).toHaveLength(1);
      expect(res.event.resources[0].resourceType).toBe('AWS::S3::Bucket');
      expect(res.event.resources[0].resourceId).toBe('arn:aws:s3:::cyber-shield-test-bucket');
    });

    test('TEST J: AWS sensitive parameter redaction sanitizes credentials', () => {
      const recordWithSecrets = {
        ...validAwsRecord,
        eventID: 'evt-aws-sec-001',
        requestParameters: {
          userName: 'Bob',
          password: 'SuperSecretPassword!@#',
          secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
          sessionToken: 'FwoGZXIvYXdzEEXAMPLE',
          apiKey: 'sec-api-key-12345',
          nested: {
            adminToken: 'bearer-token-val',
            safeField: 'harmless-value',
          },
        },
      };
      const res = CloudTelemetryNormalizer.normalize(recordWithSecrets, baseContext);
      expect(res.success).toBe(true);
      expect(res.event.parameters.password).toBe('[REDACTED]');
      expect(res.event.parameters.secretAccessKey).toBe('[REDACTED]');
      expect(res.event.parameters.sessionToken).toBe('[REDACTED]');
      expect(res.event.parameters.apiKey).toBe('[REDACTED]');
      expect(res.event.parameters.nested.adminToken).toBe('[REDACTED]');
      expect(res.event.parameters.nested.safeField).toBe('harmless-value');
    });
  });

  // ---------------------------------------------------------------------------
  // GCP Cloud Audit Tests
  // ---------------------------------------------------------------------------
  describe('GCP Cloud Audit Normalization', () => {
    const validGcpRecord = {
      insertId: 'gcp-insert-id-9988',
      resource: {
        type: 'gce_instance',
        labels: {
          project_id: 'project-sec-999',
          zone: 'us-central1-a',
          instance_id: 'inst-77665544',
        },
      },
      timestamp: '2026-09-17T08:35:00Z',
      protoPayload: {
        serviceName: 'compute.googleapis.com',
        methodName: 'v1.compute.instances.insert',
        authenticationInfo: {
          principalEmail: 'deployer@project-sec-999.iam.gserviceaccount.com',
          authoritySelector: 'ServiceAccount',
        },
        requestMetadata: {
          callerIp: '34.68.12.34',
        },
        resourceName: 'projects/project-sec-999/zones/us-central1-a/instances/vm-worker-1',
        request: {
          name: 'vm-worker-1',
          machineType: 'n1-standard-2',
          serviceAccounts: [{ email: 'worker@project-sec-999.iam.gserviceaccount.com' }],
        },
      },
    };

    const gcpContext = {
      ...baseContext,
      provider: 'GCP',
    };

    test('TEST K: GCP basic Cloud Audit normalization succeeds', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.success).toBe(true);
      expect(res.event.provider).toBe('GCP');
      expect(res.event.nativeEventId).toBe('gcp-insert-id-9988');
      expect(res.event.cloudAccountId).toBe('project-sec-999');
      expect(res.event.region).toBe('us-central1-a');
    });

    test('TEST L: GCP service-account identity normalization identifies SA', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.success).toBe(true);
      expect(res.event.actor.principalType).toBe('ServiceAccount');
      expect(res.event.actor.serviceAccount).toBe('deployer@project-sec-999.iam.gserviceaccount.com');
      expect(res.event.actor.username).toBe('deployer@project-sec-999.iam.gserviceaccount.com');
    });

    test('TEST M: GCP caller IP extraction retrieves callerIp', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.event.actor.callerIp).toBe('34.68.12.34');
    });

    test('TEST N: GCP insertId extraction extracts stable nativeEventId', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.event.nativeEventId).toBe('gcp-insert-id-9988');
    });

    test('TEST O: GCP timestamp normalization parses ISO 8601 into Date', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.event.eventTime).toBeInstanceOf(Date);
      expect(res.event.eventTime.toISOString()).toBe('2026-09-17T08:35:00.000Z');
    });

    test('TEST P: GCP method and service extraction removes domain suffix', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.event.action.name).toBe('v1.compute.instances.insert');
      expect(res.event.action.service).toBe('compute');
      expect(res.event.action.tier).toBe(3); // compute.instances.insert is Tier 3 Lifecycle
      expect(res.event.action.isMutating).toBe(true);
    });

    test('TEST Q: GCP status -> outcome maps 7 (PERMISSION_DENIED) to DENIED', () => {
      const deniedGcp = {
        ...validGcpRecord,
        insertId: 'gcp-denied-001',
        protoPayload: {
          ...validGcpRecord.protoPayload,
          status: {
            code: 7,
            message: 'PERMISSION_DENIED: User lacks compute.instances.insert permission',
          },
        },
      };
      const res = CloudTelemetryNormalizer.normalize(deniedGcp, gcpContext);
      expect(res.event.outcome).toBe('DENIED');
    });

    test('TEST R: GCP resource normalization captures resourceName and resourceType', () => {
      const res = CloudTelemetryNormalizer.normalize(validGcpRecord, gcpContext);
      expect(res.event.resources).toHaveLength(1);
      expect(res.event.resources[0].resourceName).toBe(
        'projects/project-sec-999/zones/us-central1-a/instances/vm-worker-1'
      );
    });

    test('TEST S: GCP sensitive field redaction redacts access tokens and secrets', () => {
      const sensitiveGcp = {
        ...validGcpRecord,
        insertId: 'gcp-sec-002',
        protoPayload: {
          ...validGcpRecord.protoPayload,
          request: {
            clientSecret: 'shhh-secret-value',
            oauthToken: 'ya29.a0AfH6SMDEXAMPLE',
            private_key: '-----BEGIN PRIVATE KEY-----...',
          },
        },
      };
      const res = CloudTelemetryNormalizer.normalize(sensitiveGcp, gcpContext);
      expect(res.event.parameters.clientSecret).toBe('[REDACTED]');
      expect(res.event.parameters.oauthToken).toBe('[REDACTED]');
      expect(res.event.parameters.private_key).toBe('[REDACTED]');
    });
  });

  // ---------------------------------------------------------------------------
  // Azure Activity Log Tests
  // ---------------------------------------------------------------------------
  describe('Azure Activity Log Normalization', () => {
    const validAzureRecord = {
      correlationId: 'azure-corr-7788-9900',
      subscriptionId: 'sub-azure-111',
      resourceLocation: 'eastus',
      eventTimestamp: '2026-09-17T08:40:00Z',
      operationName: {
        value: 'Microsoft.Network/networkSecurityGroups/write',
        localizedValue: 'Create or Update Network Security Group',
      },
      status: {
        value: 'Succeeded',
        localizedValue: 'Succeeded',
      },
      caller: 'sec-admin@enterprise.com',
      callerIpAddress: '20.42.15.60',
      resourceId: '/subscriptions/sub-azure-111/resourceGroups/rg-prod/providers/Microsoft.Network/networkSecurityGroups/nsg-web',
      claims: {
        oid: 'usr-oid-azure-5544',
        ipaddr: '20.42.15.60',
      },
      properties: {
        securityRules: [{ name: 'AllowHTTPS', access: 'Allow', port: 443 }],
      },
    };

    const azureContext = {
      ...baseContext,
      provider: 'AZURE',
    };

    test('TEST T: Azure basic Activity Log normalization succeeds', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.success).toBe(true);
      expect(res.event.provider).toBe('AZURE');
      expect(res.event.nativeEventId).toBe('azure-corr-7788-9900');
      expect(res.event.cloudAccountId).toBe('sub-azure-111');
      expect(res.event.region).toBe('eastus');
    });

    test('TEST U: Azure caller normalization extracts UPN and principalId', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.event.actor.principalName).toBe('sec-admin@enterprise.com');
      expect(res.event.actor.principalId).toBe('usr-oid-azure-5544');
      expect(res.event.actor.callerIp).toBe('20.42.15.60');
      expect(res.event.actor.principalType).toBe('User');
    });

    test('TEST V: Azure subscription and resource extraction parses resourceId', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.event.cloudAccountId).toBe('sub-azure-111');
      expect(res.event.resources).toHaveLength(1);
      expect(res.event.resources[0].resourceName).toBe('nsg-web');
      expect(res.event.resources[0].resourceId).toBe(validAzureRecord.resourceId);
    });

    test('TEST W: Azure event timestamp extraction parses eventTimestamp into Date', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.event.eventTime).toBeInstanceOf(Date);
      expect(res.event.eventTime.toISOString()).toBe('2026-09-17T08:40:00.000Z');
    });

    test('TEST X: Azure operation and service extraction parses Microsoft namespace', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.event.action.name).toBe('Microsoft.Network/networkSecurityGroups/write');
      expect(res.event.action.service).toBe('Microsoft.Network');
      expect(res.event.action.tier).toBe(1); // NSG write is Tier 1 Mutating
      expect(res.event.action.isMutating).toBe(true);
    });

    test('TEST Y: Azure status -> outcome maps subStatus 403 / Forbidden to DENIED', () => {
      const deniedAzure = {
        ...validAzureRecord,
        correlationId: 'azure-denied-001',
        status: { value: 'Failed' },
        subStatus: { value: 'Forbidden' },
      };
      const res = CloudTelemetryNormalizer.normalize(deniedAzure, azureContext);
      expect(res.event.outcome).toBe('DENIED');
    });

    test('TEST Z: Azure resource normalization bounds long resource strings', () => {
      const res = CloudTelemetryNormalizer.normalize(validAzureRecord, azureContext);
      expect(res.event.resources[0].resourceType).toBe('Microsoft.Network/networkSecurityGroups');
      expect(res.event.resources[0].resourceName).toBe('nsg-web');
    });

    test('TEST AA: Azure sensitive field redaction removes SAS tokens and passwords', () => {
      const secretAzure = {
        ...validAzureRecord,
        correlationId: 'azure-sec-002',
        properties: {
          adminPassword: 'P@ssword12345!',
          storageSasToken: 'sv=2020-08-04&ss=b&srt=sco&sp=rwdlacx',
          sharedKey: 'key-12345-secret',
        },
      };
      const res = CloudTelemetryNormalizer.normalize(secretAzure, azureContext);
      expect(res.event.parameters.adminPassword).toBe('[REDACTED]');
      expect(res.event.parameters.storageSasToken).toBe('[REDACTED]');
      expect(res.event.parameters.sharedKey).toBe('[REDACTED]');
    });
  });

  // ---------------------------------------------------------------------------
  // Cross-Provider Security, Edge Cases & Guardrails
  // ---------------------------------------------------------------------------
  describe('Cross-Provider Validation & Guardrails', () => {
    test('TEST AB: Unknown provider rejected with structured reason', () => {
      const res = CloudTelemetryNormalizer.normalize({ some: 'data' }, {
        ...baseContext,
        provider: 'ORACLE_CLOUD',
      });
      expect(res.success).toBe(false);
      expect(res.reason).toBe('UNSUPPORTED_PROVIDER');
    });

    test('TEST AC: Missing native event ID handled deterministically without crashing', () => {
      const invalidEvent = {
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '123456789012',
      };
      const res = CloudTelemetryNormalizer.normalize(invalidEvent, baseContext);
      expect(res.success).toBe(false);
      expect(res.reason).toBe('MISSING_NATIVE_EVENT_ID');
    });

    test('TEST AD: Invalid eventTime rejected deterministically', () => {
      const invalidTimeEvent = {
        eventID: 'evt-invalid-time',
        eventTime: 'not-a-valid-date-time',
        recipientAccountId: '123456789012',
      };
      const res = CloudTelemetryNormalizer.normalize(invalidTimeEvent, baseContext);
      expect(res.success).toBe(false);
      expect(res.reason).toBe('INVALID_EVENT_TIME');
    });

    test('TEST AE: Future / transport timestamp remains separate from eventTime', () => {
      const pastEventTime = '2026-09-15T12:00:00Z'; // 2 days ago (valid cloud log acceptance window)
      const event = {
        eventID: 'evt-separate-timestamps',
        eventTime: pastEventTime,
        recipientAccountId: '123456789012',
        eventName: 'DescribeInstances',
      };
      const contextWithTransportTime = {
        ...baseContext,
        transportTimestamp: new Date('2026-09-17T08:45:00Z'), // current delivery
      };
      const res = CloudTelemetryNormalizer.normalize(event, contextWithTransportTime);
      expect(res.success).toBe(true);
      expect(res.event.eventTime.toISOString()).toBe('2026-09-15T12:00:00.000Z');
      expect(contextWithTransportTime.transportTimestamp.toISOString()).toBe('2026-09-17T08:45:00.000Z');
    });

    test('TEST AF: Tenant identity cannot be overridden by payload (TENANT_MISMATCH)', () => {
      const spoofedPayload = {
        eventID: 'evt-tenant-spoof',
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '123456789012',
        organizationId: 'malicious-org-attacker',
      };
      const res = CloudTelemetryNormalizer.normalize(spoofedPayload, baseContext);
      expect(res.success).toBe(false);
      expect(res.reason).toBe('TENANT_MISMATCH');
    });

    test('TEST AG: Enrolled cloud account context enforced (CLOUD_ACCOUNT_MISMATCH)', () => {
      const unenrolledAccountPayload = {
        eventID: 'evt-account-unauthorized',
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '999999999999', // Not in enrolledAccountIds
        eventName: 'DescribeInstances',
      };
      const res = CloudTelemetryNormalizer.normalize(unenrolledAccountPayload, baseContext);
      expect(res.success).toBe(false);
      expect(res.reason).toBe('CLOUD_ACCOUNT_MISMATCH');
    });

    test('TEST AH: Tier classification deterministic across all 5 tiers', () => {
      // Tier 1: Mutating IAM
      expect(ActionClassifier.classify('AWS', 'AuthorizeSecurityGroupIngress').tier).toBe(1);
      expect(ActionClassifier.classify('GCP', 'SetIamPolicy').tier).toBe(1);
      expect(ActionClassifier.classify('AZURE', 'Microsoft.Authorization/roleAssignments/write').tier).toBe(1);

      // Tier 2: Security / Auth
      expect(ActionClassifier.classify('AWS', 'ConsoleLogin').tier).toBe(2);
      expect(ActionClassifier.classify('AWS', 'AssumeRole').tier).toBe(2);
      expect(ActionClassifier.classify('AZURE', 'Microsoft.Storage/storageAccounts/listKeys/action').tier).toBe(2);

      // Tier 3: Lifecycle
      expect(ActionClassifier.classify('AWS', 'RunInstances').tier).toBe(3);
      expect(ActionClassifier.classify('GCP', 'v1.compute.instances.insert').tier).toBe(3);
      expect(ActionClassifier.classify('AZURE', 'Microsoft.Compute/virtualMachines/write').tier).toBe(3);

      // Tier 4: High-Frequency Read/List
      expect(ActionClassifier.classify('AWS', 'DescribeInstances').tier).toBe(4);
      expect(ActionClassifier.classify('AWS', 'ListBuckets').tier).toBe(4);
      expect(ActionClassifier.classify('GCP', 'v1.compute.instances.list').tier).toBe(4);
      expect(ActionClassifier.classify('AZURE', 'Microsoft.Compute/virtualMachines/read').tier).toBe(4);

      // Tier 5: Unknown
      expect(ActionClassifier.classify('AWS', 'CustomInternalTelemetryAction').tier).toBe(5);
    });

    test('TEST AI: Unknown operation receives explicit safe classification (Tier 5)', () => {
      const unknownClass = ActionClassifier.classify('AWS', 'NonExistentVendorApiCall');
      expect(unknownClass.tier).toBe(5);
      expect(unknownClass.category).toBe('UNCLASSIFIED');
      expect(unknownClass.isMutating).toBe(false);
    });

    test('TEST AJ: Severity normalization deterministic without LLM', () => {
      expect(BaseCloudAdapter.normalizeSeverity(null, 1, 'DENIED')).toBe('HIGH');
      expect(BaseCloudAdapter.normalizeSeverity(null, 1, 'SUCCESS')).toBe('MEDIUM');
      expect(BaseCloudAdapter.normalizeSeverity(null, 4, 'SUCCESS')).toBe('INFORMATIONAL');
      expect(BaseCloudAdapter.normalizeSeverity('CRITICAL', 4, 'SUCCESS')).toBe('CRITICAL');
      expect(BaseCloudAdapter.normalizeSeverity(null, 2, 'SUCCESS', true)).toBe('CRITICAL'); // root actor
    });

    test('TEST AK: Outcome normalization deterministic for diverse provider codes', () => {
      expect(BaseCloudAdapter.normalizeOutcome('Succeeded')).toBe('SUCCESS');
      expect(BaseCloudAdapter.normalizeOutcome('AccessDenied')).toBe('DENIED');
      expect(BaseCloudAdapter.normalizeOutcome('PERMISSION_DENIED')).toBe('DENIED');
      expect(BaseCloudAdapter.normalizeOutcome('Failed')).toBe('FAILURE');
      expect(BaseCloudAdapter.normalizeOutcome('UnmappedStatusValue')).toBe('UNKNOWN');
    });

    test('TEST AL: Resource count and string sizes remain bounded', () => {
      const hugeResources = [];
      for (let i = 0; i < 50; i++) {
        hugeResources.push({
          type: 'AWS::S3::Bucket',
          ARN: `arn:aws:s3:::bucket-${i}-${'x'.repeat(1000)}`,
          name: `bucket-${i}`,
        });
      }
      const bounded = BaseCloudAdapter.boundResources(hugeResources);
      expect(bounded).toHaveLength(25); // Bounded to max 25
      expect(bounded[0].resourceId.length).toBeLessThanOrEqual(512); // Truncated to 512
    });

    test('TEST AM: Parameter size and depth bounded to prevent CPU/memory exhaustion', () => {
      // 10 levels deep object
      let deepObj = { level: 10 };
      for (let i = 9; i >= 1; i--) {
        deepObj = { level: i, child: deepObj };
      }
      const sanitized = BaseCloudAdapter.sanitizeParameters(deepObj);
      expect(sanitized.child.child.child.child).toBe('[DEPTH_LIMIT_REACHED]');
    });

    test('TEST AN: Credential-shaped parameter redaction covers all common auth keys', () => {
      const params = {
        db_password: 'pw1',
        api_token: 'tok1',
        access_key_id: 'key1',
        session_token: 'sess1',
        authorization_bearer: 'auth1',
        cookie_header: 'cookie1',
        client_secret: 'sec1',
        safe_param: 'ok',
      };
      const sanitized = BaseCloudAdapter.sanitizeParameters(params);
      expect(sanitized.db_password).toBe('[REDACTED]');
      expect(sanitized.api_token).toBe('[REDACTED]');
      expect(sanitized.access_key_id).toBe('[REDACTED]');
      expect(sanitized.session_token).toBe('[REDACTED]');
      expect(sanitized.authorization_bearer).toBe('[REDACTED]');
      expect(sanitized.cookie_header).toBe('[REDACTED]');
      expect(sanitized.client_secret).toBe('[REDACTED]');
      expect(sanitized.safe_param).toBe('ok');
    });

    test('TEST AO: Raw payload hash is deterministic and valid 64-char SHA-256', () => {
      const payloadA = { eventID: 'evt-hash-1', data: 'foo' };
      const payloadB = { eventID: 'evt-hash-1', data: 'foo' };
      const payloadC = { eventID: 'evt-hash-2', data: 'bar' };

      const hashA = BaseCloudAdapter.computePayloadHash(payloadA);
      const hashB = BaseCloudAdapter.computePayloadHash(payloadB);
      const hashC = BaseCloudAdapter.computePayloadHash(payloadC);

      expect(hashA).toBe(hashB);
      expect(hashA).not.toBe(hashC);
      expect(hashA).toMatch(/^[a-f0-9]{64}$/);
    });

    test('TEST AP: Raw payload is never returned in error diagnostics', () => {
      const malformedPayloadWithSecrets = {
        password: 'LeakedPassword123!',
        token: 'SuperSecretToken',
        brokenField: NaN,
      };
      const res = CloudTelemetryNormalizer.normalize(malformedPayloadWithSecrets, baseContext);
      expect(res.success).toBe(false);
      const jsonRes = JSON.stringify(res);
      expect(jsonRes).not.toContain('LeakedPassword123!');
      expect(jsonRes).not.toContain('SuperSecretToken');
    });

    test('TEST AQ: Prototype-pollution-shaped input handled safely without polluting Object.prototype', () => {
      const maliciousPayload = JSON.parse('{"__proto__": {"polluted": true}, "constructor": {"prototype": {"polluted": true}}, "eventID": "evt-proto-001", "eventTime": "2026-09-17T08:00:00Z", "recipientAccountId": "123456789012"}');

      const res = CloudTelemetryNormalizer.normalize(maliciousPayload, baseContext);
      expect(res.success).toBe(true);
      expect(Object.prototype.polluted).toBeUndefined();
      expect({}.polluted).toBeUndefined();
    });

    test('TEST AR: Zero MongoDB writes occur during normalization', async () => {
      const saveSpy = jest.spyOn(CloudTelemetryEvent.prototype, 'save');
      const createSpy = jest.spyOn(CloudTelemetryEvent, 'create');
      const insertManySpy = jest.spyOn(CloudTelemetryEvent, 'insertMany');

      const payload = {
        eventID: 'evt-no-db-writes',
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '123456789012',
        eventName: 'DescribeInstances',
      };
      const res = CloudTelemetryNormalizer.normalize(payload, baseContext);
      expect(res.success).toBe(true);

      expect(saveSpy).not.toHaveBeenCalled();
      expect(createSpy).not.toHaveBeenCalled();
      expect(insertManySpy).not.toHaveBeenCalled();

      saveSpy.mockRestore();
      createSpy.mockRestore();
      insertManySpy.mockRestore();
    });

    test('TEST AS: Zero Data Fabric writes occur during normalization', () => {
      const nodeSpy = jest.spyOn(SecurityGraphNode.prototype, 'save');
      const edgeSpy = jest.spyOn(SecurityGraphEdge.prototype, 'save');

      const payload = {
        eventID: 'evt-no-df-writes',
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '123456789012',
        eventName: 'CreateUser',
      };
      const res = CloudTelemetryNormalizer.normalize(payload, baseContext);
      expect(res.success).toBe(true);

      expect(nodeSpy).not.toHaveBeenCalled();
      expect(edgeSpy).not.toHaveBeenCalled();

      nodeSpy.mockRestore();
      edgeSpy.mockRestore();
    });

    test('TEST AT: Zero Decision Intelligence writes occur during normalization', () => {
      const diSpy = jest.spyOn(DecisionAssessment.prototype, 'save');

      const payload = {
        eventID: 'evt-no-di-writes',
        eventTime: '2026-09-17T08:00:00Z',
        recipientAccountId: '123456789012',
        eventName: 'ConsoleLogin',
      };
      const res = CloudTelemetryNormalizer.normalize(payload, baseContext);
      expect(res.success).toBe(true);

      expect(diSpy).not.toHaveBeenCalled();
      diSpy.mockRestore();
    });

    test('TEST AU: Step 3 verification boundary remains unchanged', () => {
      const { CloudSignatureVerifier } = require('../services/ingestion/CloudSignatureVerifier');
      const verifier = new CloudSignatureVerifier();
      expect(typeof verifier.verify).toBe('function');
      expect(typeof verifier.verifyTransportFreshness).toBe('function');
      expect(typeof verifier._validateSigningCertUrl).toBe('function');
    });
  });
});
