/**
 * 🛡️ CyberShield X — Compliance Routes (Phase 74)
 *
 * Exposes compliance controls, automated evidence evaluation,
 * evidence packages, and cryptographic audit proofs.
 */

const express = require('express');
const router = express.Router();
const complianceController = require('../controllers/complianceController');
const { authenticate, tryAuthenticate } = require('../middleware/auth');
const { requireMinimumRole } = require('../middleware/rbac');

// ─── Compliance Controls (Viewer and Above) ──────────────────────────────────
router.get('/controls', tryAuthenticate, complianceController.listControls);

// ─── Control Seeding & Automated Evaluation (Analyst and Above) ──────────────
router.post('/controls/seed', authenticate, requireMinimumRole('operator'), complianceController.seedControls);
router.post('/controls/:controlId/evaluate', authenticate, requireMinimumRole('analyst'), complianceController.evaluateControl);
router.post('/evaluate-all', authenticate, requireMinimumRole('analyst'), complianceController.evaluateAllControls);

// ─── Evidence Packages (Analyst and Above) ───────────────────────────────────
router.get('/evidence-packages', tryAuthenticate, complianceController.listEvidencePackages);
router.post('/evidence-packages', authenticate, requireMinimumRole('analyst'), complianceController.createEvidencePackage);
router.get('/evidence-packages/:packageId', tryAuthenticate, complianceController.getEvidencePackage);

module.exports = router;
