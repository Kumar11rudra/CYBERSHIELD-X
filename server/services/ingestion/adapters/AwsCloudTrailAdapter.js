/**
 * 🛡️ CyberShield X — AwsCloudTrailAdapter (Phase 80 Step 4)
 *
 * Normalization adapter for AWS CloudTrail telemetry events delivered directly
 * or wrapped via Amazon SNS envelopes.
 */

'use strict';

const BaseCloudAdapter = require('./BaseCloudAdapter');
const ActionClassifier = require('./ActionClassifier');

class AwsCloudTrailAdapter {
  /**
   * Normalize an AWS CloudTrail telemetry envelope into a provider-neutral NormalizedCloudEvent.
   *
   * @param {Object|string} rawInput - Raw CloudTrail record or SNS envelope
   * @param {Object} verificationContext - Trusted context from Step 3 verification
   * @returns {{ success: boolean, event?: Object, reason?: string, message?: string }}
   */
  static normalize(rawInput, verificationContext = {}) {
    if (!rawInput) {
      return BaseCloudAdapter.fail('EMPTY_PAYLOAD', 'Received empty AWS telemetry payload');
    }

    // 1. Validate trusted verification context from Step 3
    const organizationId = verificationContext.organizationId;
    if (!organizationId) {
      return BaseCloudAdapter.fail('MISSING_VERIFICATION_CONTEXT', 'Missing authoritative organizationId in verification context');
    }

    // 2. Compute deterministic raw payload hash before mutation/unwrapping
    const rawPayloadHash = BaseCloudAdapter.computePayloadHash(rawInput);

    // 3. Unwrap SNS envelope or parse JSON string if necessary
    let record = rawInput;
    if (typeof record === 'string') {
      try {
        record = JSON.parse(record);
      } catch {
        return BaseCloudAdapter.fail('MALFORMED_JSON', 'Failed to parse AWS telemetry JSON payload');
      }
    }

    // If SNS Notification envelope wrapping CloudTrail
    if (record && record.Type === 'Notification' && record.Message) {
      try {
        const unwrapped = typeof record.Message === 'string' ? JSON.parse(record.Message) : record.Message;
        if (unwrapped && unwrapped.Records && Array.isArray(unwrapped.Records) && unwrapped.Records.length > 0) {
          record = unwrapped.Records[0];
        } else if (unwrapped && typeof unwrapped === 'object') {
          record = unwrapped;
        }
      } catch {
        // Continue with record as is if message parsing fails
      }
    } else if (record && record.Records && Array.isArray(record.Records) && record.Records.length > 0) {
      record = record.Records[0];
    }

    if (!record || typeof record !== 'object') {
      return BaseCloudAdapter.fail('INVALID_RECORD_FORMAT', 'CloudTrail record is not an object');
    }

    // 4. Extract and validate nativeEventId
    const nativeEventId = record.eventID || record.eventId;
    if (!nativeEventId || typeof nativeEventId !== 'string' || !nativeEventId.trim()) {
      return BaseCloudAdapter.fail('MISSING_NATIVE_EVENT_ID', 'AWS CloudTrail event missing native eventID');
    }

    // 5. Extract and validate eventTime
    const eventTime = BaseCloudAdapter.parseEventTime(record.eventTime);
    if (!eventTime) {
      return BaseCloudAdapter.fail('INVALID_EVENT_TIME', 'AWS CloudTrail event missing or unparseable eventTime');
    }

    // 6. Extract cloudAccountId and verify enrolled accounts
    const cloudAccountId =
      record.recipientAccountId ||
      (record.userIdentity && record.userIdentity.accountId) ||
      (record.resources && record.resources[0] && record.resources[0].accountId);

    if (!cloudAccountId || typeof cloudAccountId !== 'string' || !cloudAccountId.trim()) {
      return BaseCloudAdapter.fail('MISSING_CLOUD_ACCOUNT_ID', 'AWS CloudTrail event missing recipientAccountId');
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
    const region = record.awsRegion || 'GLOBAL';

    // 9. Extract Actor
    const userIdentity = record.userIdentity || {};
    const principalType = userIdentity.type || (userIdentity.sessionContext ? 'AssumedRole' : 'UNKNOWN');
    const isRoot = principalType === 'Root';

    let principalId = userIdentity.principalId || userIdentity.arn || null;
    let principalName = userIdentity.userName || null;

    if (isRoot) {
      principalName = 'root';
    } else if (principalType === 'AssumedRole') {
      const issuer = userIdentity.sessionContext && userIdentity.sessionContext.sessionIssuer;
      principalName = issuer && issuer.userName ? issuer.userName : (userIdentity.userName || principalId);
      if (issuer && issuer.arn && !principalId) {
        principalId = issuer.arn;
      }
    } else if (principalType === 'AWSService') {
      principalName = userIdentity.invokedBy || principalId || 'AWSService';
    }

    const callerIp = record.sourceIPAddress || null;

    const actor = {
      principalId,
      principalType,
      principalName: principalName || 'unknown',
      username: principalName || 'unknown',
      serviceAccount: principalType === 'AWSService' ? principalName : null,
      callerIp,
    };

    // 10. Extract Action and Service
    const operation = record.eventName || 'UnknownOperation';
    let service = 'aws';
    if (record.eventSource && typeof record.eventSource === 'string') {
      service = record.eventSource.replace('.amazonaws.com', '');
    }

    // 5-Tier Classification
    const classification = ActionClassifier.classify('AWS', operation, verificationContext.tierOverrides);
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
    if (record.errorCode || record.errorMessage) {
      const errCode = String(record.errorCode || '');
      if (/AccessDenied|UnauthorizedOperation|AuthFailure/i.test(errCode)) {
        outcome = 'DENIED';
      } else {
        outcome = 'FAILURE';
      }
    }

    // 12. Normalize Severity
    const severity = BaseCloudAdapter.normalizeSeverity(null, action.tier, outcome, isRoot);

    // 13. Extract and Bound Resources
    let rawResources = record.resources;
    if (!Array.isArray(rawResources) || rawResources.length === 0) {
      rawResources = [];
      const params = record.requestParameters || {};
      if (params.bucketName) {
        rawResources.push({ resourceType: 'AWS::S3::Bucket', resourceName: params.bucketName, resourceId: params.bucketName });
      } else if (params.instanceId) {
        rawResources.push({ resourceType: 'AWS::EC2::Instance', resourceName: params.instanceId, resourceId: params.instanceId });
      } else if (params.userName) {
        rawResources.push({ resourceType: 'AWS::IAM::User', resourceName: params.userName, resourceId: params.userName });
      } else if (params.roleName) {
        rawResources.push({ resourceType: 'AWS::IAM::Role', resourceName: params.roleName, resourceId: params.roleName });
      } else if (params.groupName) {
        rawResources.push({ resourceType: 'AWS::IAM::Group', resourceName: params.groupName, resourceId: params.groupName });
      }
    }
    const resources = BaseCloudAdapter.boundResources(rawResources);

    // 14. Bounded and Sanitized Parameters
    const parameters = BaseCloudAdapter.sanitizeParameters(record.requestParameters) || {};

    // 15. Construct Normalized Result
    const normalizedEvent = {
      provider: 'AWS',
      nativeEventId,
      cloudAccountId,
      region,
      eventTime,
      organizationId,
      connectorId: verificationContext.connectorId || 'aws-connector-default',
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

module.exports = AwsCloudTrailAdapter;
