'use strict';

/**
 * 🛡️ CyberShield X — Inbound Webhook Router (Phase 81 Step 4)
 *
 * Webhook routing for Enterprise ITSM & SOAR Inbound Events:
 * - Provider-scoped: POST /api/webhooks/itsm/:provider/:integrationId
 * - Direct integration-scoped: POST /api/webhooks/itsm/:integrationId
 * - Alias/Facade: POST /api/integrations/:integrationId/webhook
 *
 * Safeguards:
 * - Early body-size limit: 1 MB (HTTP 413)
 * - Raw request body buffer preservation for HMAC verification
 * - Dedicated rate limiting: 300 requests/minute per integration
 * - Constant-time cryptographic verification (HMAC-SHA256, shared tokens)
 */

const express = require('express');
const rateLimit = require('express-rate-limit');
const inboundWebhookController = require('../controllers/inboundWebhookController');

const router = express.Router();

// Maximum body size limit: 1 MB
const MAX_BODY_BYTES = 1 * 1024 * 1024;

/**
 * Early Body-Size Protection Middleware
 */
router.use((req, res, next) => {
  const contentLength = req.headers['content-length'];
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    req.on('data', () => {});
    req.on('end', () => {
      if (!res.headersSent) {
        res.status(413).json({
          success: false,
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds the maximum allowed size of 1MB',
        });
      }
    });
    req.resume();
    return;
  }
  next();
});

/**
 * Capture raw buffer if not already captured by upstream middleware
 */
router.use(
  express.json({
    limit: '1mb',
    verify: (req, res, buf) => {
      if (!req.rawBody) {
        req.rawBody = buf;
      }
    },
  })
);

/**
 * Rate Limiter: 300 requests per minute per IP / integration
 */
const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'RATE_LIMITED',
    message: 'Webhook rate limit exceeded. Please throttle requests.',
  },
  keyGenerator: (req) => {
    return req.params.integrationId || req.ip;
  },
});

router.use(webhookRateLimiter);

// ─── Webhook Endpoints ────────────────────────────────────────────────────────

// Provider-specified route: POST /api/webhooks/itsm/:provider/:integrationId
router.post('/itsm/:provider/:integrationId', (req, res) => inboundWebhookController.handleWebhook(req, res));

// Direct route: POST /api/webhooks/itsm/:integrationId
router.post('/itsm/:integrationId', (req, res) => inboundWebhookController.handleWebhook(req, res));

// Route facade: POST /:integrationId/webhook (when mounted under /api/integrations)
router.post('/:integrationId/webhook', (req, res) => inboundWebhookController.handleWebhook(req, res));

// Direct integration webhook: POST /:integrationId
router.post('/:integrationId', (req, res) => inboundWebhookController.handleWebhook(req, res));

module.exports = router;
