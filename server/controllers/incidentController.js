const Incident = require('../models/Incident');
const IncidentTask = require('../models/IncidentTask');
const EvidenceRecord = require('../models/EvidenceRecord');
const incidentResponseService = require('../services/soc/IncidentResponseService');
const evidenceLifecycleService = require('../services/soc/EvidenceLifecycleService');
const incidentCorrelationEngine = require('../services/soc/IncidentCorrelationEngine');
const logger = require('../utils/logger');

class IncidentController {
  /**
   * List incidents with filters and pagination
   * GET /api/incidents
   */
  async listIncidents(req, res) {
    try {
      const { status, severity, priority, search, asset, page = 1, limit = 25 } = req.query;
      const filter = {};

      if (req.user?.organizationId) {
        filter.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      if (status) filter.status = status.toUpperCase();
      if (severity) filter.severity = severity.toUpperCase();
      if (priority) filter['priority.level'] = priority.toUpperCase();
      if (asset) filter.affectedAssets = asset;

      if (search) {
        filter.$or = [
          { title: { $regex: search, $options: 'i' } },
          { incidentId: { $regex: search, $options: 'i' } },
          { description: { $regex: search, $options: 'i' } },
          { affectedAssets: { $in: [new RegExp(search, 'i')] } },
        ];
      }

      const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
      const total = await Incident.countDocuments(filter);
      const incidents = await Incident.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(parseInt(limit, 10));

      // Dynamically evaluate SLA status using real timestamps
      const formatted = incidents.map((inc) => {
        const obj = inc.toObject ? inc.toObject() : inc;
        if (obj.sla) {
          obj.sla.status = incidentResponseService.evaluateSLAStatus(inc);
        }
        return obj;
      });

      res.json({
        success: true,
        data: {
          incidents: formatted,
          pagination: {
            total,
            page: parseInt(page, 10),
            pages: Math.ceil(total / parseInt(limit, 10)),
          },
        },
      });
    } catch (err) {
      logger.error('Failed to list incidents:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get single incident by incidentId
   * GET /api/incidents/:incidentId
   */
  async getIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const incident = await Incident.findOne({ incidentId });
      if (!incident) {
        return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
      }

      const obj = incident.toObject();
      if (obj.sla) {
        obj.sla.status = incidentResponseService.evaluateSLAStatus(incident);
      }

      res.json({ success: true, data: obj });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Create / Correlate new incident from findings
   * POST /api/incidents
   */
  async createIncident(req, res) {
    try {
      const { findings, title, primaryAsset, severity, assetCriticality } = req.body;

      if (!findings || !Array.isArray(findings) || findings.length === 0) {
        return res.status(400).json({ success: false, error: 'findings array is required to create an incident' });
      }

      const actor = {
        userId: req.user?.id || 'operator',
        username: req.user?.username || 'operator',
        role: req.user?.role || 'OPERATOR',
      };

      const incident = await incidentCorrelationEngine.correlateAndEscalateIncident({
        findings,
        title,
        primaryAsset,
        actor,
        organizationId: req.user?.organizationId || null,
      });

      // Compute initial priority and SLA deadlines
      const priorityInfo = incidentResponseService.calculatePriority({
        assetCriticality: assetCriticality || 'MEDIUM',
        incidentSeverity: severity || incident.severity || 'MEDIUM',
      });
      incident.priority = priorityInfo;
      incident.sla = incidentResponseService.calculateSLADeadlines(priorityInfo.level, incident.createdAt);
      await incident.save();

      res.status(201).json({ success: true, data: incident });
    } catch (err) {
      logger.error('Failed to create incident:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Transition incident state across 14-state machine
   * POST /api/incidents/:incidentId/transition
   */
  async transitionState(req, res) {
    try {
      const { incidentId } = req.params;
      const { toState, reason, evidenceRef } = req.body;

      if (!toState) {
        return res.status(400).json({ success: false, error: 'toState is required' });
      }

      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
        role: req.user?.role || 'ANALYST',
      };

      const updated = await incidentResponseService.transitionState(incidentId, toState, {
        actor,
        reason,
        evidenceRef,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Update incident status (legacy compatibility)
   * PUT /api/incidents/:incidentId/status
   */
  async updateStatus(req, res) {
    try {
      const { incidentId } = req.params;
      const { status, rationale, evidenceRef } = req.body;

      if (!status) {
        return res.status(400).json({ success: false, error: 'Status is required' });
      }

      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
        role: req.user?.role || 'ANALYST',
      };

      const updated = await incidentResponseService.transitionState(incidentId, status, {
        actor,
        reason: rationale,
        evidenceRef,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Assign incident ownership
   * POST /api/incidents/:incidentId/assign
   */
  async assignIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const { primaryAnalyst, backupAnalyst, team, escalationOwner } = req.body;

      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
        role: req.user?.role || 'ANALYST',
      };

      const updated = await incidentResponseService.assignIncident(incidentId, {
        primaryAnalyst,
        backupAnalyst,
        team,
        escalationOwner,
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Claim incident ownership
   * POST /api/incidents/:incidentId/claim
   */
  async claimIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
        email: req.user?.email || null,
        role: req.user?.role || 'ANALYST',
      };

      const updated = await incidentResponseService.claimIncident(incidentId, actor, req.user?.organizationId);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Unassign incident
   * POST /api/incidents/:incidentId/unassign
   */
  async unassignIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const updated = await incidentResponseService.unassignIncident(incidentId, actor, req.user?.organizationId);
      res.json({ success: true, data: updated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Create task for incident
   * POST /api/incidents/:incidentId/tasks
   */
  async createTask(req, res) {
    try {
      const { incidentId } = req.params;
      const { title, description, priority, assignee, dueAt, dependencies, checklist, caseId } = req.body;

      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const task = await incidentResponseService.createTask({
        incidentId,
        caseId,
        title,
        description,
        priority,
        assignee,
        dueAt,
        dependencies,
        checklist,
        createdBy: actor,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: task });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * List tasks for incident
   * GET /api/incidents/:incidentId/tasks
   */
  async listTasks(req, res) {
    try {
      const { incidentId } = req.params;
      const query = { incidentId };
      if (req.user?.organizationId) {
        query.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      const tasks = await IncidentTask.find(query).sort({ createdAt: 1 });
      res.json({ success: true, data: tasks });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Update task status / details
   * PUT /api/incidents/:incidentId/tasks/:taskId
   */
  async updateTask(req, res) {
    try {
      const { taskId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const task = await incidentResponseService.updateTask(taskId, req.body, actor, req.user?.organizationId);
      res.json({ success: true, data: task });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Register immutable evidence for incident
   * POST /api/incidents/:incidentId/evidence
   */
  async registerEvidence(req, res) {
    try {
      const { incidentId } = req.params;
      const { rawEvidence, sourceEntity, sourceId, artifactType, analystNotes, caseId } = req.body;

      const collector = {
        id: req.user?.id || req.user?._id,
        name: req.user?.username || 'ANALYST',
        email: req.user?.email || null,
        tool: 'manual_collector',
      };

      const record = await evidenceLifecycleService.registerEvidence({
        incidentId,
        caseId,
        sourceEntity: sourceEntity || 'MANUAL_UPLOAD',
        sourceId,
        rawEvidence,
        artifactType,
        collector,
        analystNotes,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: record });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * List evidence records for incident
   * GET /api/incidents/:incidentId/evidence
   */
  async listEvidence(req, res) {
    try {
      const { incidentId } = req.params;
      const query = { incidentId };
      if (req.user?.organizationId) {
        query.$or = [{ organizationId: req.user.organizationId }, { organizationId: null }];
      }

      const records = await EvidenceRecord.find(query).sort({ timestamp: -1 });
      res.json({ success: true, data: records });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Cryptographically verify evidence integrity
   * POST /api/incidents/:incidentId/evidence/:evidenceId/verify
   */
  async verifyEvidence(req, res) {
    try {
      const { evidenceId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const result = await evidenceLifecycleService.verifyIntegrity(evidenceId, actor, req.user?.organizationId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Safely collect native evidence
   * POST /api/incidents/:incidentId/evidence/collect
   */
  async collectEvidence(req, res) {
    try {
      const { incidentId } = req.params;
      const { tool, target, args, reason, caseId } = req.body;

      const collector = {
        id: req.user?.id || req.user?._id,
        name: req.user?.username || 'ANALYST',
      };

      const result = await evidenceLifecycleService.collectEvidenceSafely({
        incidentId,
        caseId,
        tool,
        target,
        args,
        reason,
        collector,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Propose response action
   * POST /api/incidents/:incidentId/response/propose
   */
  async proposeResponseAction(req, res) {
    try {
      const { incidentId } = req.params;
      const { actionType, playbookId, target, parameters, riskClass, reason } = req.body;

      const actor = {
        userId: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
        role: req.user?.role || 'ANALYST',
      };

      const action = await incidentResponseService.proposeResponseAction(incidentId, {
        actionType,
        playbookId,
        target,
        parameters,
        riskClass,
        reason,
        actor,
        organizationId: req.user?.organizationId,
      });

      res.status(201).json({ success: true, data: action });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Execute response action
   * POST /api/incidents/:incidentId/response/:actionId/execute
   */
  async executeResponseAction(req, res) {
    try {
      const { incidentId, actionId } = req.params;
      const actor = {
        userId: req.user?.id || req.user?._id,
        username: req.user?.username || 'OPERATOR',
        role: req.user?.role || 'OPERATOR',
      };

      const result = await incidentResponseService.executeResponseAction(incidentId, actionId, actor, req.user?.organizationId);
      res.json({ success: true, data: result });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Independently verify response action
   * POST /api/incidents/:incidentId/response/:actionId/verify
   */
  async verifyResponseAction(req, res) {
    try {
      const { incidentId, actionId } = req.params;
      const { verificationMethod, evidenceId, result, notes } = req.body;

      const verifier = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'INDEPENDENT_VERIFIER',
      };

      const verified = await incidentResponseService.verifyResponseAction(
        incidentId,
        actionId,
        {
          verificationMethod,
          evidenceId,
          result,
          notes,
          verifier,
        },
        req.user?.organizationId
      );

      res.json({ success: true, data: verified });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Close incident with postmortem
   * POST /api/incidents/:incidentId/close
   */
  async closeIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const closed = await incidentResponseService.closeIncident(incidentId, {
        ...req.body,
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: closed });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Reopen incident with real triggering evidence
   * POST /api/incidents/:incidentId/reopen
   */
  async reopenIncident(req, res) {
    try {
      const { incidentId } = req.params;
      const { reason, triggeringEvidenceId } = req.body;

      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const reopened = await incidentResponseService.reopenIncident(incidentId, {
        reason,
        triggeringEvidenceId,
        actor,
        organizationId: req.user?.organizationId,
      });

      res.json({ success: true, data: reopened });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Generate detection gap feedback
   * POST /api/incidents/:incidentId/feedback/gap
   */
  async generateDetectionGapFeedback(req, res) {
    try {
      const { incidentId } = req.params;
      const actor = {
        id: req.user?.id || req.user?._id,
        username: req.user?.username || 'ANALYST',
      };

      const feedback = await incidentResponseService.generateDetectionGapFeedback(incidentId, actor, req.user?.organizationId);
      res.json({ success: true, data: feedback });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }

  /**
   * Evidence-backed Incident Report Generation (Executive, Technical, Appendix)
   * GET /api/incidents/:incidentId/report
   */
  async generateReport(req, res) {
    try {
      const { incidentId } = req.params;
      const { type = 'executive' } = req.query;

      const incident = await Incident.findOne({ incidentId }).lean();
      if (!incident) {
        return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
      }

      const tasks = await IncidentTask.find({ incidentId }).lean();
      const evidence = await EvidenceRecord.find({ incidentId }).lean();

      if (type.toLowerCase() === 'technical') {
        return res.json({
          success: true,
          data: {
            reportType: 'TECHNICAL_INCIDENT_REPORT',
            incidentId,
            title: incident.title,
            timeline: incident.timeline || [],
            evidence: evidence.map((e) => ({
              evidenceId: e.evidenceId,
              source: e.sourceEntity,
              hash: e.hash,
              integrityStatus: e.integrityStatus,
            })),
            iocs: incident.iocs || [],
            mitreTactic: incident.classification?.tactic,
            responseActions: incident.responseActions || [],
            postmortem: incident.closure || null,
          },
        });
      }

      if (type.toLowerCase() === 'appendix') {
        return res.json({
          success: true,
          data: {
            reportType: 'EVIDENCE_APPENDIX',
            incidentId,
            evidenceItems: evidence.map((e) => ({
              evidenceId: e.evidenceId,
              sha256: e.hash,
              sourceEntity: e.sourceEntity,
              sourceId: e.sourceId,
              integrityStatus: e.integrityStatus,
              chainOfCustody: e.chainOfCustody,
            })),
          },
        });
      }

      // Default: Executive Report
      res.json({
        success: true,
        data: {
          reportType: 'EXECUTIVE_INCIDENT_SUMMARY',
          incidentId,
          title: incident.title,
          severity: incident.severity,
          priority: incident.priority?.level,
          status: incident.status,
          businessImpact: incident.closure?.impact || 'Under assessment',
          rootCause: incident.closure?.rootCause || 'Under investigation',
          containmentSummary: incident.closure?.containmentSummary || (incident.status === 'CONTAINED' ? 'Contained' : 'In Progress'),
          lessonsLearned: incident.closure?.lessonsLearned || 'Pending formal review',
          evidenceCount: evidence.length,
          taskCount: tasks.length,
          slaStatus: incidentResponseService.evaluateSLAStatus(incident),
        },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get Attack-Chain Graph for incident
   * GET /api/incidents/:incidentId/graph
   */
  async getAttackChainGraph(req, res) {
    try {
      const { incidentId } = req.params;
      const incident = await Incident.findOne({ incidentId }, { attackChainGraph: 1, title: 1, severity: 1, riskScore: 1 });
      if (!incident) {
        return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
      }

      res.json({
        success: true,
        data: incident.attackChainGraph || { nodes: [], edges: [] },
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Get Incident Timeline
   * GET /api/incidents/:incidentId/timeline
   */
  async getTimeline(req, res) {
    try {
      const { incidentId } = req.params;
      const incident = await Incident.findOne({ incidentId }, { timeline: 1, incidentId: 1, title: 1 });
      if (!incident) {
        return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
      }

      res.json({
        success: true,
        data: incident.timeline || [],
      });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }

  /**
   * Add Analyst Note / Decision to Incident
   * POST /api/incidents/:incidentId/notes
   */
  async addAnalystNote(req, res) {
    try {
      const { incidentId } = req.params;
      const { note, rationale, decision } = req.body;
      const incident = await Incident.findOne({ incidentId });
      if (!incident) {
        return res.status(404).json({ success: false, error: `Incident ${incidentId} not found` });
      }

      const noteText = note || rationale || decision || 'Analyst note recorded';
      incident.analystDecisions.push({
        timestamp: new Date(),
        analystId: req.user?.username || req.user?.id || 'ANALYST',
        decision: decision || 'NOTE',
        rationale: noteText,
      });

      incident.timeline.push({
        timestamp: new Date(),
        eventType: 'NOTE_ADDED',
        description: `Analyst Note: ${noteText}`,
        actor: req.user?.username || 'ANALYST',
      });

      await incident.save();
      res.json({ success: true, data: incident });
    } catch (err) {
      res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = new IncidentController();
