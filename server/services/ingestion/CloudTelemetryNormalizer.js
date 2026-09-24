/**
 * 🛡️ CyberShield X — CloudTelemetryNormalizer (Phase 80 Step 4)
 *
 * Enterprise Multi-Cloud Telemetry Normalization & Operation Classification Coordinator:
 * - Ingests verified envelopes from AWS CloudTrail / SNS, GCP Cloud Audit / Pub/Sub, and Azure Activity Log / Event Grid.
 * - Dispatches to provider-specific adapters (AwsCloudTrailAdapter, GcpCloudAuditAdapter, AzureActivityLogAdapter).
 * - Enforces the canonical provider-neutral NormalizedCloudEvent contract.
 * - Enforces the approved 5-tier action classification hierarchy (Section 3 & ADR 80-09).
 * - Sanitizes parameters, redacting credential-shaped keys and bounding object/string depth.
 * - Guarantees zero database writes, zero Data Fabric graph mutations, and zero network egress.
 */

'use strict';

const BaseCloudAdapter = require('./adapters/BaseCloudAdapter');
const ActionClassifier = require('./adapters/ActionClassifier');
const AwsCloudTrailAdapter = require('./adapters/AwsCloudTrailAdapter');
const GcpCloudAuditAdapter = require('./adapters/GcpCloudAuditAdapter');
const AzureActivityLogAdapter = require('./adapters/AzureActivityLogAdapter');

class CloudTelemetryNormalizer {
  /**
   * Normalize an incoming verified cloud telemetry payload into a provider-neutral NormalizedCloudEvent.
   *
   * @param {Object|string} providerPayload - Raw or unwrapped telemetry payload from provider
   * @param {Object} verificationContext - Trusted context originating from Step 3 verification
   * @returns {{ success: boolean, event?: Object, reason?: string, message?: string }}
   */
  static normalize(providerPayload, verificationContext = {}) {
    // 1. Guard against empty payload
    if (!providerPayload) {
      return BaseCloudAdapter.fail('EMPTY_PAYLOAD', 'Payload cannot be null or undefined');
    }

    // 2. Guard against missing or unauthenticated verification context
    if (!verificationContext || typeof verificationContext !== 'object') {
      return BaseCloudAdapter.fail('INVALID_VERIFICATION_CONTEXT', 'Verification context must be an object');
    }

    if (!verificationContext.organizationId) {
      return BaseCloudAdapter.fail('UNAUTHENTICATED_TENANT', 'Authoritative organizationId is missing from verification context');
    }

    // 3. Resolve and validate provider
    let provider = verificationContext.provider;
    if (!provider && typeof providerPayload === 'object' && providerPayload !== null) {
      // Fallback inference if context omitted provider but payload has strong markers
      if (providerPayload.Records || providerPayload.eventSource || providerPayload.awsRegion) {
        provider = 'AWS';
      } else if (providerPayload.protoPayload || (providerPayload.resource && providerPayload.resource.type && providerPayload.resource.type.startsWith('gce_'))) {
        provider = 'GCP';
      } else if (providerPayload.correlationId || (providerPayload.data && providerPayload.data.subscriptionId) || providerPayload.subscriptionId) {
        provider = 'AZURE';
      }
    }

    if (!provider || typeof provider !== 'string') {
      return BaseCloudAdapter.fail('UNSUPPORTED_PROVIDER', 'Missing or unresolvable cloud provider');
    }

    const normalizedProvider = provider.trim().toUpperCase();

    // 4. Dispatch to provider-specific adapter
    let adapterResult;
    switch (normalizedProvider) {
      case 'AWS':
        adapterResult = AwsCloudTrailAdapter.normalize(providerPayload, verificationContext);
        break;

      case 'GCP':
        adapterResult = GcpCloudAuditAdapter.normalize(providerPayload, verificationContext);
        break;

      case 'AZURE':
        adapterResult = AzureActivityLogAdapter.normalize(providerPayload, verificationContext);
        break;

      default:
        return BaseCloudAdapter.fail('UNSUPPORTED_PROVIDER', `Unsupported cloud provider: ${provider}`);
    }

    // If adapter failed, return structured failure safely without leaking raw payload
    if (!adapterResult || !adapterResult.success) {
      return {
        success: false,
        reason: (adapterResult && adapterResult.reason) || 'NORMALIZATION_FAILED',
        message: (adapterResult && adapterResult.message) || 'Failed to normalize cloud telemetry event',
      };
    }

    const event = adapterResult.event;

    // 5. Post-adapter validation of the normalized event contract
    const contractValidation = CloudTelemetryNormalizer.validateContract(event);
    if (!contractValidation.valid) {
      return BaseCloudAdapter.fail('SCHEMA_CONTRACT_VIOLATION', contractValidation.reason);
    }

    return {
      success: true,
      event,
    };
  }

  /**
   * Validate that the normalized event adheres strictly to the canonical CloudTelemetryEvent contract.
   *
   * @param {Object} event - Normalized event candidate
   * @returns {{ valid: boolean, reason?: string }}
   */
  static validateContract(event) {
    if (!event || typeof event !== 'object') {
      return { valid: false, reason: 'Event is not an object' };
    }

    // Required root fields
    const requiredFields = [
      'provider',
      'nativeEventId',
      'cloudAccountId',
      'region',
      'eventTime',
      'organizationId',
      'actor',
      'action',
      'resources',
      'outcome',
      'severity',
      'rawPayloadHash',
      'parameters',
    ];

    for (const field of requiredFields) {
      if (event[field] === undefined || event[field] === null) {
        return { valid: false, reason: `Missing required normalized field: ${field}` };
      }
    }

    // Validate provider
    if (!['AWS', 'AZURE', 'GCP'].includes(event.provider)) {
      return { valid: false, reason: `Invalid provider in normalized event: ${event.provider}` };
    }

    // Validate eventTime is valid Date
    if (!(event.eventTime instanceof Date) || isNaN(event.eventTime.getTime())) {
      return { valid: false, reason: 'eventTime must be a valid Date object' };
    }

    // Validate actor structure
    if (typeof event.actor !== 'object' || event.actor === null) {
      return { valid: false, reason: 'actor must be an object' };
    }

    // Validate action structure & 5-tier classification
    if (typeof event.action !== 'object' || event.action === null) {
      return { valid: false, reason: 'action must be an object' };
    }
    if (![1, 2, 3, 4, 5].includes(event.action.tier)) {
      return { valid: false, reason: `action.tier must be 1, 2, 3, 4, or 5 (received: ${event.action.tier})` };
    }

    // Validate outcome
    if (!['SUCCESS', 'FAILURE', 'DENIED', 'UNKNOWN'].includes(event.outcome)) {
      return { valid: false, reason: `Invalid outcome in normalized event: ${event.outcome}` };
    }

    // Validate severity
    if (!['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFORMATIONAL'].includes(event.severity)) {
      return { valid: false, reason: `Invalid severity in normalized event: ${event.severity}` };
    }

    // Validate resources is array
    if (!Array.isArray(event.resources)) {
      return { valid: false, reason: 'resources must be an array' };
    }

    // Validate rawPayloadHash is a valid 64-char SHA-256 hex string
    if (typeof event.rawPayloadHash !== 'string' || event.rawPayloadHash.length !== 64) {
      return { valid: false, reason: 'rawPayloadHash must be a 64-character hex string' };
    }

    return { valid: true };
  }
}

module.exports = CloudTelemetryNormalizer;
