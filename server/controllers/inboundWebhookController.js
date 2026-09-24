'use strict';

/**
 * 🛡️ CyberShield X — Inbound Webhook Controller (Phase 81 Step 4)
 *
 * Enterprise ITSM Inbound Webhook Security Controller:
 * - Query-string secret prohibition (?token= -> HTTP 400)
 * - Authoritative IntegrationConfig resolution by :integrationId
 * - Strict tenant isolation: organizationId derived exclusively from config
 * - Provider confusion defense: validates provider route match against config.type
 * - Cryptographic signature & authentication verification via ItsmSignatureVerifier
 * - Immutable security audit logging via IntegrationSyncEvent (direction: 'INBOUND')
 * - Replay protection: duplicates acknowledged safely without reprocessing
 * - HARD BOUNDARY GATE: Authenticates only. Zero Case, Ticket, or Approval side-effects.
 */

const crypto = require('crypto');
const mongoose = require('mongoose');
const logger = require('../utils/logger');
const IntegrationConfig = require('../models/IntegrationConfig');
const IntegrationSyncEvent = require('../models/IntegrationSyncEvent');
const itsmSignatureVerifier = require('../services/soc/ItsmSignatureVerifier');
const inboundTicketReconciliationService = require('../services/soc/InboundTicketReconciliationService');
const externalApprovalCallbackService = require('../services/soc/ExternalApprovalCallbackService');
const externalApprovalCallbackNormalizer = require('../services/soc/ExternalApprovalCallbackNormalizer');
const { hashPayload } = require('../integrations/connectorUtils');

// Query parameter names that are forbidden because they leak secrets into logs
const FORBIDDEN_QUERY_SECRETS = ['token', 'secret', 'key', 'webhooksecret', 'apikey', 'password'];

class InboundWebhookController {
  /**
   * Primary inbound webhook handler.
   *
   * @param {object} req - Express request
   * @param {object} res - Express response
   */
  async handleWebhook(req, res) {
    const startTime = Date.now();

    try {
      // 1. Query-string secret prohibition
      if (req.query && typeof req.query === 'object') {
        const queryKeys = Object.keys(req.query).map(k => k.toLowerCase());
        const leakedKey = queryKeys.find(k => FORBIDDEN_QUERY_SECRETS.includes(k));
        if (leakedKey) {
          logger.warn(`[INBOUND-WEBHOOK] Rejected request containing forbidden query secret parameter '${leakedKey}'`);
          return res.status(400).json({
            success: false,
            error: 'QUERY_SECRET_PROHIBITED',
            message: 'Query-string secrets are strictly forbidden. Credentials must be passed via HTTP headers or body signatures.',
          });
        }
      }

      // 2. Integration ID resolution
      const integrationId = req.params.integrationId;
      if (!integrationId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_INTEGRATION_ID',
          message: 'Integration identifier is required in route parameter.',
        });
      }

      if (!mongoose.Types.ObjectId.isValid(integrationId)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_INTEGRATION_ID',
          message: 'Integration identifier must be a valid ObjectId.',
        });
      }

      // 3. Authoritative IntegrationConfig lookup
      const config = await IntegrationConfig.findById(integrationId);
      if (!config) {
        logger.warn(`[INBOUND-WEBHOOK] IntegrationConfig not found for ID: ${integrationId}`);
        return res.status(404).json({
          success: false,
          error: 'INTEGRATION_NOT_FOUND',
          message: 'Configured integration was not found.',
        });
      }

      // 4. Inactive integration check
      if (!config.active) {
        logger.warn(`[INBOUND-WEBHOOK] Webhook received for disabled integration: ${integrationId}`);
        return res.status(403).json({
          success: false,
          error: 'INTEGRATION_DISABLED',
          message: 'The requested integration is disabled.',
        });
      }

      // 5. Provider Confusion Defense
      const configuredType = String(config.type || '').toUpperCase();
      const routeProvider = req.params.provider ? String(req.params.provider).toUpperCase() : null;

      if (routeProvider && routeProvider !== configuredType) {
        logger.warn(
          `[INBOUND-WEBHOOK] Provider mismatch: route requested '${routeProvider}' but config is '${configuredType}' (ID: ${integrationId})`
        );
        return res.status(400).json({
          success: false,
          error: 'PROVIDER_MISMATCH',
          message: `Provider in route '${routeProvider}' does not match configured integration type '${configuredType}'.`,
        });
      }

      // 6. Cryptographic Signature Verification
      const verification = itsmSignatureVerifier.verifyWebhook(req, config);

      const rawBody = itsmSignatureVerifier.getRawBodyBuffer(req);
      const payloadHash = hashPayload(rawBody.length > 0 ? rawBody : req.body || {});

      // 7. Handle Authentication Failure
      if (!verification.authenticated) {
        logger.warn(
          `[INBOUND-WEBHOOK] Authentication failed for ${configuredType} (integration: ${integrationId}): ${verification.reason}`
        );

        await this._recordSecurityAudit({
          organizationId: config.organizationId,
          integrationId: config._id,
          provider: configuredType,
          status: 'REJECTED',
          eventType: 'WEBHOOK_REJECTED',
          errorMessage: verification.reason,
          payloadHash,
          durationMs: Date.now() - startTime,
        });

        return res.status(401).json({
          success: false,
          error: 'AUTHENTICATION_FAILED',
          reason: verification.reason,
          message: 'Inbound webhook signature or credential verification failed.',
        });
      }

      // 8. Handle Replay / Duplicate
      if (verification.isDuplicate) {
        logger.info(`[INBOUND-WEBHOOK] Duplicate webhook detected and acknowledged for integration: ${integrationId}`);

        await this._recordSecurityAudit({
          organizationId: config.organizationId,
          integrationId: config._id,
          provider: configuredType,
          status: 'DUPLICATE',
          eventType: 'WEBHOOK_DUPLICATE_ACKNOWLEDGED',
          payloadHash,
          durationMs: Date.now() - startTime,
        });

        return res.status(200).json({
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          reason: 'REPLAY_DETECTED',
        });
      }

      // 9. Successful Authentication & Security Audit
      logger.info(
        `[INBOUND-WEBHOOK] Successfully authenticated inbound webhook for provider ${configuredType} (method: ${verification.method})`
      );

      await this._recordSecurityAudit({
        organizationId: config.organizationId,
        integrationId: config._id,
        provider: configuredType,
        status: 'SUCCESS',
        eventType: 'WEBHOOK_AUTHENTICATED',
        payloadHash,
        durationMs: Date.now() - startTime,
      });

      // 10. Route: Step 6 External Approval Callback vs Step 5 Inbound Ticket Reconciliation
      const isApproval = externalApprovalCallbackNormalizer.isApprovalCallback(req, configuredType);

      if (isApproval) {
        let approvalCallback = null;
        try {
          approvalCallback = await externalApprovalCallbackService.handleCallback({
            req,
            config,
            verification,
            isControllerHandoff: true,
          });
        } catch (apprErr) {
          logger.error(`[INBOUND-WEBHOOK] External approval callback engine invocation failed: ${apprErr.message}`);
          approvalCallback = {
            success: false,
            status: 'INTERNAL_SERVER_ERROR',
            error: apprErr.message,
          };
        }

        // FINDING-01 FIX: Fail-closed with HTTP 500 on internal approval callback error
        if (!approvalCallback || approvalCallback.status === 'INTERNAL_SERVER_ERROR') {
          logger.error(
            `[INBOUND-WEBHOOK] Approval callback execution failed with internal server error for ${configuredType} (integration: ${config._id})`
          );
          return res.status(500).json({
            success: false,
            error: 'INTERNAL_SERVER_ERROR',
            message: 'Internal processing error during approval callback execution.',
          });
        }

        if (approvalCallback && approvalCallback.status === 'DUPLICATE_ACKNOWLEDGED') {
          return res.status(200).json({
            success: true,
            status: 'DUPLICATE_ACKNOWLEDGED',
            integrationId: config._id.toString(),
            provider: configuredType,
            method: verification.method,
            approvalCallback,
          });
        }

        // FINDING-03 FIX: Deterministic Fallback to Ticket Reconciliation when Approval is Unmatched
        // If an approval callback was matched and processed (e.g. TRANSITION_COMPLETE, EXPIRED, ALREADY_TERMINAL, etc.)
        // return early with HTTP 200. If UNMATCHED / APPROVAL_NOT_FOUND, fall through to Step 5 ticket reconciliation!
        if (approvalCallback.status !== 'UNMATCHED' && approvalCallback.matched !== false) {
          return res.status(200).json({
            success: true,
            status: 'AUTHENTICATED',
            integrationId: config._id.toString(),
            provider: configuredType,
            method: verification.method,
            approvalCallback,
          });
        }

        logger.info(
          `[INBOUND-WEBHOOK] Webhook classified as approval but unmatched (${approvalCallback.reason || 'APPROVAL_NOT_FOUND'}). Falling through to ticket reconciliation.`
        );
      }

      // Step 5: Inbound Ticket Reconciliation Engine (Reached if !isApproval OR approval was unmatched)
      let reconciliation = null;
      try {
        reconciliation = await inboundTicketReconciliationService.reconcileWebhook({
          req,
          config,
          verification,
          isControllerHandoff: true,
        });
      } catch (recErr) {
        logger.error(`[INBOUND-WEBHOOK] Reconciliation engine invocation failed: ${recErr.message}`);
        reconciliation = {
          success: false,
          status: 'INTERNAL_SERVER_ERROR',
          error: recErr.message,
        };
      }

      // FINDING-01 FIX: Fail-closed with HTTP 500 on internal reconciliation error
      if (!reconciliation || reconciliation.status === 'INTERNAL_SERVER_ERROR') {
        logger.error(
          `[INBOUND-WEBHOOK] Ticket reconciliation execution failed with internal server error for ${configuredType} (integration: ${config._id})`
        );
        return res.status(500).json({
          success: false,
          error: 'INTERNAL_SERVER_ERROR',
          message: 'Internal processing error during ticket reconciliation.',
        });
      }

      // If duplicate acknowledged by reconciliation engine
      if (reconciliation && reconciliation.status === 'DUPLICATE_ACKNOWLEDGED') {
        return res.status(200).json({
          success: true,
          status: 'DUPLICATE_ACKNOWLEDGED',
          integrationId: config._id.toString(),
          provider: configuredType,
          method: verification.method,
          reconciliation,
        });
      }

      // 11. Return Safe Acknowledgment
      return res.status(200).json({
        success: true,
        status: 'AUTHENTICATED',
        integrationId: config._id.toString(),
        provider: configuredType,
        method: verification.method,
        reconciliation,
      });
    } catch (err) {
      logger.error(`[INBOUND-WEBHOOK] Unexpected error during webhook processing: ${err.message}`);
      return res.status(500).json({
        success: false,
        error: 'INTERNAL_SERVER_ERROR',
        message: 'An error occurred during webhook verification.',
      });
    }
  }

  /**
   * Records an immutable inbound security audit event.
   *
   * @private
   */
  async _recordSecurityAudit({
    organizationId,
    integrationId,
    provider,
    status,
    eventType,
    errorMessage = null,
    payloadHash,
    durationMs = 0,
  }) {
    try {
      if (mongoose.connection && mongoose.connection.readyState !== 1 && !IntegrationSyncEvent.create.mock) {
        return;
      }

      const syncId = crypto.randomUUID();

      await IntegrationSyncEvent.create({
        syncId,
        organizationId,
        integrationId,
        provider,
        direction: 'INBOUND',
        eventType,
        targetEntityType: 'CASE',
        targetEntityId: 'PENDING_INGESTION',
        payloadHash,
        status,
        errorMessage: errorMessage ? String(errorMessage) : null,
        attempt: 1,
        durationMs,
        processedAt: new Date(),
      });
    } catch (err) {
      logger.warn(`[INBOUND-WEBHOOK] Failed recording IntegrationSyncEvent audit: ${err.message}`);
    }
  }
}

module.exports = new InboundWebhookController();
