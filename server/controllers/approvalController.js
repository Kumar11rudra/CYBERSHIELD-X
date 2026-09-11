/**
 * 🛡️ CyberShield X — ApprovalController (Phase 70)
 *
 * REST API controller for Human-in-the-Loop approval gates.
 */

const PendingApproval = require('../models/PendingApproval');
const safePlaybookAutomationService = require('../services/soc/SafePlaybookAutomationService');
const logger = require('../utils/logger');

class ApprovalController {
  /**
   * List pending and historical approvals
   * GET /api/approvals
   */
  async listApprovals(req, res) {
    try {
      const { status, riskLevel, page = 1, limit = 50 } = req.query;
      const filter = {};

      if (req.user?.organizationId) {
        filter.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      if (status) filter.status = status;
      if (riskLevel) filter.riskLevel = riskLevel;

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await PendingApproval.countDocuments(filter);
      const approvals = await PendingApproval.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      res.json({
        success: true,
        data: {
          approvals,
          pagination: {
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
      });
    } catch (err) {
      logger.error('Failed to list approvals:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Propose a new action
   * POST /api/approvals
   */
  async proposeAction(req, res) {
    try {
      const { incidentId, playbookId, actionType, riskLevel, target, tool, parameters, reason, evidenceRef } = req.body;

      const requestedBy = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const approval = await safePlaybookAutomationService.proposeAction({
        incidentId,
        playbookId,
        actionType,
        riskLevel,
        target,
        tool,
        parameters,
        reason,
        evidenceRef,
        requestedBy,
        organizationId: req.user?.organizationId || null,
      });

      res.status(201).json({ success: true, data: approval });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Approve and execute an action
   * POST /api/approvals/:approvalId/approve
   */
  async approveAction(req, res) {
    try {
      const { approvalId } = req.params;
      const { decisionReason } = req.body;

      const approver = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const result = await safePlaybookAutomationService.approveAndExecuteAction(
        approvalId,
        approver,
        decisionReason
      );

      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Deny an action
   * POST /api/approvals/:approvalId/deny
   */
  async denyAction(req, res) {
    try {
      const { approvalId } = req.params;
      const { reason = 'Denied by operator' } = req.body;

      const actor = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const result = await safePlaybookAutomationService.denyAction(approvalId, actor, reason);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
}

module.exports = new ApprovalController();
