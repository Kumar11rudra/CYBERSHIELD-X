/**
 * 🛡️ CyberShield X — AzureActivityLogAdapter (Phase 80 Step 4)
 *
 * Normalization adapter for Azure Activity Log telemetry events delivered directly
 * or wrapped via Azure Event Grid envelopes.
 */

'use strict';

const BaseCloudAdapter = require('./BaseCloudAdapter');
const ActionClassifier = require('./ActionClassifier');

class AzureActivityLogAdapter {
  /**
   * Normalize an Azure Activity Log telemetry envelope into a provider-neutral NormalizedCloudEvent.
   *
   * @param {Object|string} rawInput - Raw Azure Activity Log record or Event Grid event
   * @param {Object} verificationContext - Trusted context from Step 3 verification
   * @returns {{ success: boolean, event?: Object, reason?: string, message?: string }}
   */
  static normalize(rawInput, verificationContext = {}) {
    if (!rawInput) {
      return BaseCloudAdapter.fail('EMPTY_PAYLOAD', 'Received empty Azure telemetry payload');
    }

    // 1. Validate trusted verification context from Step 3
    const organizationId = verificationContext.organizationId;
    if (!organizationId) {
      return BaseCloudAdapter.fail('MISSING_VERIFICATION_CONTEXT', 'Missing authoritative organizationId in verification context');
    }

    // 2. Compute deterministic raw payload hash before mutation/unwrapping
    const rawPayloadHash = BaseCloudAdapter.computePayloadHash(rawInput);

    // 3. Parse JSON string if necessary
    let record = rawInput;
    if (typeof record === 'string') {
      try {
        record = JSON.parse(record);
      } catch {
        return BaseCloudAdapter.fail('MALFORMED_JSON', 'Failed to parse Azure telemetry JSON payload');
      }
    }

    // If Azure Event Grid array envelope
    if (Array.isArray(record) && record.length > 0) {
      record = record[0];
    }

    if (!record || typeof record !== 'object') {
      return BaseCloudAdapter.fail('INVALID_RECORD_FORMAT', 'Azure event record is not an object');
    }

    // Extract data object if delivered as Event Grid wrapper
    const data = record.data && typeof record.data === 'object' ? record.data : record;

    // 4. Extract and validate nativeEventId
    const nativeEventId =
      data.correlationId ||
      record.correlationId ||
      record.id ||
      data.id ||
      data.operationId;

    if (!nativeEventId || typeof nativeEventId !== 'string' || !nativeEventId.trim()) {
      return BaseCloudAdapter.fail('MISSING_NATIVE_EVENT_ID', 'Azure Activity Log event missing native correlationId/id');
    }

    // 5. Extract and validate eventTime
    const rawTime =
      data.eventTimestamp ||
      record.eventTimestamp ||
      record.eventTime ||
      data.eventTime ||
      data.submissionTimestamp;

    const eventTime = BaseCloudAdapter.parseEventTime(rawTime);
    if (!eventTime) {
      return BaseCloudAdapter.fail('INVALID_EVENT_TIME', 'Azure Activity Log event missing or unparseable eventTimestamp');
    }

    // 6. Extract cloudAccountId (subscriptionId)
    const cloudAccountId =
      data.subscriptionId ||
      record.subscriptionId ||
      (typeof data.resourceId === 'string' && (data.resourceId.match(/\/subscriptions\/([^\/]+)/) || [])[1]) ||
      (typeof record.resourceId === 'string' && (record.resourceId.match(/\/subscriptions\/([^\/]+)/) || [])[1]);

    if (!cloudAccountId || typeof cloudAccountId !== 'string' || !cloudAccountId.trim()) {
      return BaseCloudAdapter.fail('MISSING_CLOUD_ACCOUNT_ID', 'Azure Activity Log event missing subscriptionId');
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
    const region =
      data.resourceLocation ||
      record.resourceLocation ||
      data.location ||
      record.location ||
      'GLOBAL';

    // 9. Extract Actor
    const caller = data.caller || record.caller || null;
    const claims = data.claims || record.claims || {};
    const principalId = claims.oid || claims.sub || claims.nameidentifier || caller;
    const serviceAccount = claims.appid || (caller && caller.includes('@') ? null : caller);
    const principalType = serviceAccount ? 'ServicePrincipal' : (claims.oid ? 'User' : 'UNKNOWN');
    const callerIp = data.callerIpAddress || record.callerIpAddress || claims.ipaddr || null;

    const actor = {
      principalId,
      principalType,
      principalName: caller || principalId || 'unknown',
      username: caller || principalId || 'unknown',
      serviceAccount,
      callerIp,
    };

    // 10. Extract Action and Service
    let operation = 'UnknownOperation';
    const rawOp = data.operationName || record.operationName;
    if (typeof rawOp === 'string') {
      operation = rawOp;
    } else if (rawOp && typeof rawOp === 'object' && rawOp.value) {
      operation = rawOp.value;
    }

    let service = 'azure';
    if (operation && operation.includes('/')) {
      const parts = operation.split('/');
      service = parts[0]; // e.g. Microsoft.Compute
    } else if (data.resourceProvider || record.resourceProvider) {
      service = data.resourceProvider || record.resourceProvider;
    }

    // 5-Tier Classification
    const classification = ActionClassifier.classify('AZURE', operation, verificationContext.tierOverrides);
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
    const rawStatus = data.status || record.status;
    const statusVal = (typeof rawStatus === 'object' && rawStatus.value ? rawStatus.value : String(rawStatus || '')).trim();
    const rawSubStatus = data.subStatus || record.subStatus;
    const subStatusVal = (typeof rawSubStatus === 'object' && rawSubStatus.value ? rawSubStatus.value : String(rawSubStatus || '')).trim();

    if (/Forbidden|Unauthorized|AccessDenied|401|403/i.test(subStatusVal) || /Forbidden|Unauthorized|AccessDenied|401|403/i.test(statusVal)) {
      outcome = 'DENIED';
    } else if (/Failed|Failure|Error/i.test(statusVal)) {
      outcome = 'FAILURE';
    } else if (/Succeeded|Success|Started|Accepted/i.test(statusVal)) {
      outcome = 'SUCCESS';
    } else {
      outcome = BaseCloudAdapter.normalizeOutcome(statusVal);
    }

    // 12. Normalize Severity
    const rawLevel = data.level || record.level || null;
    const severity = BaseCloudAdapter.normalizeSeverity(rawLevel, action.tier, outcome);

    // 13. Extract and Bound Resources
    const rawResources = [];
    const resourceId = data.resourceId || record.resourceId;
    if (resourceId && typeof resourceId === 'string') {
      const resName = resourceId.split('/').pop() || resourceId;
      const resType = (data.resourceType || record.resourceType || (operation.includes('/') ? operation.split('/').slice(0, 2).join('/') : 'azure_resource'));
      rawResources.push({
        resourceType: resType,
        resourceId,
        resourceName: resName,
      });
    }
    const resources = BaseCloudAdapter.boundResources(rawResources);

    // 14. Bounded and Sanitized Parameters
    const rawParams = data.properties || record.properties || {};
    const parameters = BaseCloudAdapter.sanitizeParameters(rawParams) || {};

    // 15. Construct Normalized Result
    const normalizedEvent = {
      provider: 'AZURE',
      nativeEventId,
      cloudAccountId,
      region,
      eventTime,
      organizationId,
      connectorId: verificationContext.connectorId || 'azure-connector-default',
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

module.exports = AzureActivityLogAdapter;
