/**
 * 🛡️ CyberShield X — GcpCloudAuditAdapter (Phase 80 Step 4)
 *
 * Normalization adapter for GCP Cloud Audit logs delivered directly
 * or wrapped via GCP Cloud Pub/Sub envelopes.
 */

'use strict';

const BaseCloudAdapter = require('./BaseCloudAdapter');
const ActionClassifier = require('./ActionClassifier');

class GcpCloudAuditAdapter {
  /**
   * Normalize a GCP Cloud Audit telemetry envelope into a provider-neutral NormalizedCloudEvent.
   *
   * @param {Object|string} rawInput - Raw GCP LogEntry or Pub/Sub envelope
   * @param {Object} verificationContext - Trusted context from Step 3 verification
   * @returns {{ success: boolean, event?: Object, reason?: string, message?: string }}
   */
  static normalize(rawInput, verificationContext = {}) {
    if (!rawInput) {
      return BaseCloudAdapter.fail('EMPTY_PAYLOAD', 'Received empty GCP telemetry payload');
    }

    // 1. Validate trusted verification context from Step 3
    const organizationId = verificationContext.organizationId;
    if (!organizationId) {
      return BaseCloudAdapter.fail('MISSING_VERIFICATION_CONTEXT', 'Missing authoritative organizationId in verification context');
    }

    // 2. Compute deterministic raw payload hash before mutation/unwrapping
    const rawPayloadHash = BaseCloudAdapter.computePayloadHash(rawInput);

    // 3. Unwrap Pub/Sub envelope or parse JSON string if necessary
    let record = rawInput;
    if (typeof record === 'string') {
      try {
        record = JSON.parse(record);
      } catch {
        return BaseCloudAdapter.fail('MALFORMED_JSON', 'Failed to parse GCP telemetry JSON payload');
      }
    }

    // If Pub/Sub envelope wrapping Cloud Audit LogEntry in base64 data
    if (record && record.message && record.message.data) {
      try {
        const decoded = Buffer.from(record.message.data, 'base64').toString('utf8');
        record = JSON.parse(decoded);
      } catch {
        return BaseCloudAdapter.fail('MALFORMED_PUBSUB_DATA', 'Failed to decode or parse GCP Pub/Sub base64 message data');
      }
    }

    if (!record || typeof record !== 'object') {
      return BaseCloudAdapter.fail('INVALID_RECORD_FORMAT', 'GCP LogEntry is not an object');
    }

    // 4. Extract and validate nativeEventId (insertId)
    const nativeEventId = record.insertId || record.insert_id || record.id;
    if (!nativeEventId || typeof nativeEventId !== 'string' || !nativeEventId.trim()) {
      return BaseCloudAdapter.fail('MISSING_NATIVE_EVENT_ID', 'GCP Cloud Audit event missing native insertId');
    }

    // 5. Extract and validate eventTime (timestamp)
    const eventTime = BaseCloudAdapter.parseEventTime(record.timestamp || record.receiveTimestamp);
    if (!eventTime) {
      return BaseCloudAdapter.fail('INVALID_EVENT_TIME', 'GCP Cloud Audit event missing or unparseable timestamp');
    }

    // 6. Extract cloudAccountId (project_id)
    const labels = (record.resource && record.resource.labels) || record.labels || {};
    const cloudAccountId = labels.project_id || labels.projectId || record.project_id || record.projectId;

    if (!cloudAccountId || typeof cloudAccountId !== 'string' || !cloudAccountId.trim()) {
      return BaseCloudAdapter.fail('MISSING_CLOUD_ACCOUNT_ID', 'GCP Cloud Audit event missing project_id');
    }

    // Verify enrolled accounts whitelist if supplied in verification context
    if (
      verificationContext.enrolledAccountIds &&
      Array.isArray(verificationContext.enrolledAccountIds) &&
      verificationContext.enrolledAccountIds.length > 0
    ) {
      if (!verificationContext.enrolledAccountIds.includes(cloudAccountId)) {
        return BaseCloudAdapter.fail('CLOUD_ACCOUNT_MISMATCH', `Cloud account ${cloudAccountId} is not enrolled for this connector`);
      }
    }

    // 7. Prevent payload from overriding authoritative organizationId
    if (record.organizationId && String(record.organizationId) !== String(organizationId)) {
      return BaseCloudAdapter.fail('TENANT_MISMATCH', 'Payload organizationId conflicts with authenticated connector tenant');
    }

    // 8. Extract Region
    const region = labels.location || labels.zone || labels.region || 'GLOBAL';

    // 9. Extract Actor
    const protoPayload = record.protoPayload || record.payload || {};
    const authInfo = protoPayload.authenticationInfo || {};
    const requestMetadata = protoPayload.requestMetadata || {};

    const principalEmail = authInfo.principalEmail || null;
    const isServiceAccount = principalEmail && principalEmail.endsWith('.gserviceaccount.com');
    const principalType = isServiceAccount ? 'ServiceAccount' : (authInfo.authoritySelector || 'User');
    const principalId = authInfo.principalSubject || principalEmail || null;
    const callerIp = requestMetadata.callerIp || null;

    const actor = {
      principalId,
      principalType,
      principalName: principalEmail || principalId || 'unknown',
      username: principalEmail || principalId || 'unknown',
      serviceAccount: isServiceAccount ? principalEmail : null,
      callerIp,
    };

    // 10. Extract Action and Service
    const operation = protoPayload.methodName || 'UnknownMethod';
    let service = 'gcp';
    if (protoPayload.serviceName && typeof protoPayload.serviceName === 'string') {
      service = protoPayload.serviceName.replace('.googleapis.com', '');
    } else if (record.resource && record.resource.type) {
      service = record.resource.type;
    }

    // 5-Tier Classification
    const classification = ActionClassifier.classify('GCP', operation, verificationContext.tierOverrides);
    const action = {
      name: operation,
      operation,
      service,
      category: classification.category,
      tier: classification.tier,
      isMutating: classification.isMutating,
    };

    // 11. Normalize Outcome
    let outcome = 'SUCCESS';
    const status = protoPayload.status;
    if (status && typeof status === 'object') {
      if (status.code === 7 || status.code === 403 || /PERMISSION_DENIED/i.test(status.message || '')) {
        outcome = 'DENIED';
      } else if (status.code > 0 || status.message) {
        outcome = 'FAILURE';
      }
    }

    // 12. Normalize Severity
    const explicitSeverity = record.severity || null;
    const severity = BaseCloudAdapter.normalizeSeverity(explicitSeverity, action.tier, outcome);

    // 13. Extract and Bound Resources
    const rawResources = [];
    if (protoPayload.resourceName) {
      rawResources.push({
        resourceType: (record.resource && record.resource.type) || 'gcp_resource',
        resourceId: protoPayload.resourceName,
        resourceName: protoPayload.resourceName,
      });
    } else if (record.resource && record.resource.type) {
      rawResources.push({
        resourceType: record.resource.type,
        resourceId: labels.instance_id || labels.bucket_name || labels.name || cloudAccountId,
        resourceName: labels.name || labels.instance_id || record.resource.type,
      });
    }
    const resources = BaseCloudAdapter.boundResources(rawResources);

    // 14. Bounded and Sanitized Parameters
    const rawParams = protoPayload.request || protoPayload.metadata || record.jsonPayload || {};
    const parameters = BaseCloudAdapter.sanitizeParameters(rawParams) || {};

    // 15. Construct Normalized Result
    const normalizedEvent = {
      provider: 'GCP',
      nativeEventId,
      cloudAccountId,
      region,
      eventTime,
      organizationId,
      connectorId: verificationContext.connectorId || 'gcp-connector-default',
      signatureStatus: verificationContext.status || 'VERIFIED',
      actor,
      action,
      resources,
      outcome,
      severity,
      rawPayloadHash,
      parameters,
    };

    return {
      success: true,
      event: normalizedEvent,
    };
  }
}

module.exports = GcpCloudAuditAdapter;
