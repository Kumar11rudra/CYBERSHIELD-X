/**
 * 🛡️ CyberShield X — Cloud Ingestion Router (Phase 80 Step 7)
 *
 * Webhook routing for Multi-Cloud Telemetry Ingestion:
 * - AWS SNS / CloudTrail: /api/ingestion/cloud/aws/:connectorId (and /aws)
 * - GCP Pub/Sub / Cloud Audit: /api/ingestion/cloud/gcp/:connectorId (and /gcp)
 * - Azure Event Grid / Activity Log: /api/ingestion/cloud/azure/:connectorId (and /azure)
 *
 * Safeguards:
 * - Dedicated connector-scoped rate limiting (600 requests/minute per connector).
 * - Maximum request body size of 2 MB enforced before payload consumption.
 * - Rejection of query-string secrets across all endpoints.
 */

'use strict';

const express = require('express');
const rateLimit = require('express-rate-limit');
const cloudIngestionController = require('../controllers/cloudIngestionController');

const router = express.Router();

// Maximum body size limit: 2 MB
const MAX_BODY_BYTES = 2 * 1024 * 1024;

// ─── Health & Telemetry Metrics Endpoints (Observability) ─────────────────────
router.get('/health', (req, res) => cloudIngestionController.getHealth(req, res));
router.get('/metrics', (req, res) => cloudIngestionController.getMetrics(req, res));

/**
 * Early Body-Size Protection Middleware
 */
router.use((req, res, next) => {
  if (req.headers['content-length'] && parseInt(req.headers['content-length'], 10) > MAX_BODY_BYTES) {
    req.on('data', () => {});
    req.on('end', () => {
      if (!res.headersSent) {
        res.status(413).json({
          error: 'PAYLOAD_TOO_LARGE',
          message: 'Request body exceeds the maximum allowed size of 2MB',
        });
      }
    });
    req.resume();
    return;
  }
  next();
});

// Enforce 2MB json parsing limit
router.use(express.json({ limit: '2mb' }));

/**
 * Connector-Scoped Rate Limiter (600 req/min per connector)
 */
const cloudIngestionRateLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const pathMatch = req.path ? req.path.match(/^\/(?:aws|gcp|azure)\/([^/?]+)/i) : null;
    const urlConnectorId = pathMatch ? pathMatch[1] : null;
    return (
      urlConnectorId ||
      req.headers['x-connector-id'] ||
      req.headers['x-cybershield-connector-id'] ||
      req.ip
    );
  },
  handler: (req, res) => {
    const rawProvider = req.path.includes('/aws')
      ? 'AWS'
      : req.path.includes('/gcp')
      ? 'GCP'
      : req.path.includes('/azure')
      ? 'AZURE'
      : 'UNKNOWN';
    cloudIngestionController.safeRecord((obs) => obs.recordRateLimited(rawProvider));
    res.setHeader('Retry-After', '60');
    return res.status(429).json({
      error: 'RATE_LIMIT_EXCEEDED',
      message: 'Connector rate limit of 600 requests/minute exceeded. Please retry after 60 seconds.',
    });
  },
});

router.use(cloudIngestionRateLimiter);

// ─── AWS SNS Ingestion Endpoints ──────────────────────────────────────────────
router.post('/aws/:connectorId', (req, res) => cloudIngestionController.handleAws(req, res));
router.post('/aws', (req, res) => cloudIngestionController.handleAws(req, res));

// ─── GCP Pub/Sub Ingestion Endpoints ──────────────────────────────────────────
router.post('/gcp/:connectorId', (req, res) => cloudIngestionController.handleGcp(req, res));
router.post('/gcp', (req, res) => cloudIngestionController.handleGcp(req, res));

// ─── Azure Event Grid Ingestion Endpoints ─────────────────────────────────────
router.post('/azure/:connectorId', (req, res) => cloudIngestionController.handleAzure(req, res));
router.post('/azure', (req, res) => cloudIngestionController.handleAzure(req, res));

// Handle oversized JSON payload error from body-parser
router.use((err, req, res, next) => {
  if (err && (err.type === 'entity.too.large' || err.status === 413)) {
    return res.status(413).json({
      error: 'PAYLOAD_TOO_LARGE',
      message: 'Request body exceeds the maximum allowed size of 2MB',
    });
  }
  next(err);
});

module.exports = router;
