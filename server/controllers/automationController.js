const PlaybookService = require('../services/automation/PlaybookService');
const ControlValidationService = require('../services/automation/ControlValidationService');
const DriftDetectionService = require('../services/automation/DriftDetectionService');
const RemediationService = require('../services/automation/RemediationService');
const AutomationExecutionEngine = require('../services/automation/AutomationExecutionEngine');
const AutomationRecoveryService = require('../services/automation/AutomationRecoveryService');
const AutomationPlaybook = require('../models/AutomationPlaybook');
const AutomationPlaybookRevision = require('../models/AutomationPlaybookRevision');
const ControlValidation = require('../models/ControlValidation');
const SecurityDrift = require('../models/SecurityDrift');
const AutomationExecution = require('../models/AutomationExecution');

class AutomationController {
  // --- PLAYBOOKS ---
  static async listPlaybooks(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { status, category } = req.query;
      const query = orgId ? { organizationId: orgId } : {};
      if (status) query.status = status;
      if (category) query.category = category;

      const playbooks = await AutomationPlaybook.find(query).sort({ updatedAt: -1 }).lean();
      return res.json({ success: true, count: playbooks.length, playbooks });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getPlaybookDetail(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const query = { playbookId };
      if (orgId) query.organizationId = orgId;

      const playbook = await AutomationPlaybook.findOne(query).lean();
      if (!playbook) return res.status(404).json({ success: false, error: 'Playbook not found' });

      const revisions = await AutomationPlaybookRevision.find({ playbookId }).sort({ version: -1 }).lean();

      return res.json({ success: true, playbook, revisions });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createPlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const playbook = await PlaybookService.createPlaybook(req.body, req.user, orgId);
      return res.status(201).json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async revisePlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const { steps, changeSummary } = req.body;
      const playbook = await PlaybookService.revisePlaybook(playbookId, steps, changeSummary, req.user, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async submitReview(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const playbook = await PlaybookService.submitReview(playbookId, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approvePlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const playbook = await PlaybookService.approvePlaybook(playbookId, req.user, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async activatePlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const playbook = await PlaybookService.activatePlaybook(playbookId, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async disablePlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const playbook = await PlaybookService.disablePlaybook(playbookId, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async retirePlaybook(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId } = req.params;
      const playbook = await PlaybookService.retirePlaybook(playbookId, orgId);
      return res.json({ success: true, playbook });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- CONTROL VALIDATIONS ---
  static async getPostureSummary(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const posture = await ControlValidationService.getPostureSummary(orgId);
      return res.json({ success: true, posture });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runValidations(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await ControlValidationService.validateAllControls(orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getValidationHistory(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const query = orgId ? { organizationId: orgId } : {};
      const validations = await ControlValidation.find(query).sort({ evaluatedAt: -1 }).limit(100).lean();
      return res.json({ success: true, count: validations.length, validations });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- DRIFT DETECTION ---
  static async listDrift(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const drifts = await DriftDetectionService.getActiveDrifts(orgId);
      return res.json({ success: true, count: drifts.length, drifts });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async runDriftDetection(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await DriftDetectionService.detectAllDrift(orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async acknowledgeDrift(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { driftId } = req.params;
      const drift = await DriftDetectionService.acknowledgeDrift(driftId, orgId);
      return res.json({ success: true, drift });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async proposeRemediation(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { driftId } = req.params;
      const proposal = await RemediationService.proposeRemediation(driftId, orgId);
      return res.json({ success: true, proposal });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async acceptRisk(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { driftId } = req.params;
      const { justification } = req.body;
      const drift = await DriftDetectionService.acceptRiskOnDrift(driftId, justification || 'Accepted risk by operator', orgId);
      return res.json({ success: true, drift });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async verifyRemediation(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { driftId } = req.params;
      const result = await RemediationService.verifyRemediation(driftId, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- EXECUTIONS ---
  static async requestExecution(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { playbookId, idempotencyKey, triggerType } = req.body;
      const result = await AutomationExecutionEngine.requestExecution(playbookId, { idempotencyKey, triggerType }, req.user, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async approveExecution(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { executionId } = req.params;
      const execution = await AutomationExecutionEngine.approveExecution(executionId, req.user, orgId);
      return res.json({ success: true, execution });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async cancelExecution(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { executionId } = req.params;
      const { reason } = req.body;
      const execution = await AutomationRecoveryService.cancelExecution(executionId, reason, req.user, orgId);
      return res.json({ success: true, execution });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  static async listExecutions(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const query = orgId ? { organizationId: orgId } : {};
      const executions = await AutomationExecution.find(query).sort({ createdAt: -1 }).limit(100).lean();
      return res.json({ success: true, count: executions.length, executions });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getExecutionDetail(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { executionId } = req.params;
      const query = { executionId };
      if (orgId) query.organizationId = orgId;

      const execution = await AutomationExecution.findOne(query).lean();
      if (!execution) return res.status(404).json({ success: false, error: 'Execution record not found' });

      return res.json({ success: true, execution });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async rollbackExecution(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { executionId } = req.params;
      const result = await RemediationService.executeRollback(executionId, orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(400).json({ success: false, error: err.message });
    }
  }

  // --- HEALTH & RECOVERY ---
  static async getAutomationHealth(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const health = await AutomationRecoveryService.getAutomationHealth(orgId);
      return res.json({ success: true, health });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async recoverStuckExecutions(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const result = await AutomationRecoveryService.recoverStuckExecutions(orgId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = AutomationController;
