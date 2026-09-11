const crypto = require('crypto');
const RiskSynthesisService = require('../services/intelligence/RiskSynthesisService');
const AnalystPriorityService = require('../services/intelligence/AnalystPriorityService');
const InvestigationRecommendationService = require('../services/intelligence/InvestigationRecommendationService');
const CampaignClusteringService = require('../services/intelligence/CampaignClusteringService');
const DecisionExplanationService = require('../services/intelligence/DecisionExplanationService');

const DecisionAssessment = require('../models/DecisionAssessment');
const RiskAssessment = require('../models/RiskAssessment');
const AnalystRecommendation = require('../models/AnalystRecommendation');
const InvestigationHypothesis = require('../models/InvestigationHypothesis');
const RiskSnapshot = require('../models/RiskSnapshot');

const riskSynthesisService = new RiskSynthesisService();
const analystPriorityService = new AnalystPriorityService();
const recommendationService = new InvestigationRecommendationService();
const clusteringService = new CampaignClusteringService();
const explanationService = new DecisionExplanationService();

class IntelligenceController {
  // --- RISK ---
  static async getSubjectRisk(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE' } = req.query;
      const result = await riskSynthesisService.calculateSubjectRisk(orgId, subjectType, subjectId);
      return res.json({ success: true, result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRiskFactors(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE' } = req.query;
      const assessment = await riskSynthesisService.calculateSubjectRisk(orgId, subjectType, subjectId);
      return res.json({
        success: true,
        subjectType,
        subjectId,
        factors: assessment.factors || [],
        positiveEvidence: assessment.positiveEvidence || [],
        negativeEvidence: assessment.negativeEvidence || []
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getRiskHistory(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE', limit = 10 } = req.query;
      const history = await riskSynthesisService.getRiskHistory(orgId, subjectType, subjectId, Number(limit));
      return res.json({ success: true, history });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createRiskSnapshot(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE', metadata } = req.body || {};
      const snapshot = await riskSynthesisService.createRiskSnapshot(orgId, subjectType, subjectId, { metadata });
      return res.status(201).json({ success: true, snapshot });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async explainRisk(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE' } = req.body || req.query;
      const assessment = await riskSynthesisService.calculateSubjectRisk(orgId, subjectType, subjectId);
      const explanation = explanationService.explainAssessment(assessment);
      return res.json({ success: true, explanation, assessment });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- PRIORITIZATION ---
  static async getPrioritizationQueue(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const limit = Number(req.query.limit) || 50;
      const result = await analystPriorityService.getPrioritizedQueue(orgId, { limit });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async explainPriority(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType, subjectId } = req.body || req.query;
      if (!subjectType || !subjectId) {
        return res.status(400).json({ success: false, error: 'subjectType and subjectId are required' });
      }
      const explanation = await analystPriorityService.explainPriority(orgId, subjectType, subjectId);
      return res.json({ success: true, explanation });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- RECOMMENDATIONS ---
  static async getRecommendations(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { status, subjectType, subjectId } = req.query;
      const filter = {};
      if (status) filter.status = status;
      if (subjectType) filter.subjectType = subjectType;
      if (subjectId) filter.subjectId = subjectId;

      const recommendations = await recommendationService.getRecommendations(orgId, filter);
      return res.json({ success: true, recommendations });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async generateRecommendations(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType, subjectId } = req.body;
      if (!subjectType || !subjectId) {
        return res.status(400).json({ success: false, error: 'subjectType and subjectId are required' });
      }
      const recommendations = await recommendationService.generateRecommendations(orgId, subjectType, subjectId);
      return res.json({ success: true, recommendations });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async feedbackRecommendation(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const { status, notes } = req.body;
      const analystId = req.user?.id || req.user?.userId || 'ANALYST';

      if (status === 'ACCEPTED') {
        const result = await recommendationService.acceptRecommendation(orgId, id, analystId, notes);
        return res.json({ success: true, result });
      } else if (status === 'REJECTED') {
        const result = await recommendationService.rejectRecommendation(orgId, id, analystId, notes);
        return res.json({ success: true, result });
      }

      return res.status(400).json({ success: false, error: 'Valid status (ACCEPTED or REJECTED) is required' });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- CAMPAIGNS & CLUSTERS ---
  static async getClusters(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const limit = Number(req.query.limit) || 20;
      const result = await clusteringService.discoverClusters(orgId, { limit });
      return res.json({ success: true, ...result });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getClusterDetails(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const cluster = await clusteringService.getClusterDetails(orgId, id);
      return res.json({ success: true, cluster });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async explainCluster(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const explanation = await clusteringService.explainCluster(orgId, id);
      return res.json({ success: true, explanation });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- HYPOTHESES ---
  static async getHypotheses(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { status } = req.query;
      const filter = orgId ? { organizationId: orgId } : {};
      if (status) filter.status = status;

      const hypotheses = await InvestigationHypothesis.find(filter).sort({ createdAt: -1 }).lean();
      return res.json({ success: true, hypotheses });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createHypothesis(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { title, statement, relatedEntities = [] } = req.body;
      if (!title || !statement) {
        return res.status(400).json({ success: false, error: 'title and statement are required' });
      }

      const hypothesis = await InvestigationHypothesis.create({
        hypothesisId: `HYP-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        organizationId: orgId,
        title,
        statement,
        status: 'OPEN',
        supportingEvidence: [],
        contradictingEvidence: [],
        relatedEntities,
        createdBy: req.user?.email || req.user?.username || 'ANALYST'
      });

      return res.status(201).json({ success: true, hypothesis });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async supportHypothesis(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const { evidenceId, description, source } = req.body;

      const query = { hypothesisId: id };
      if (orgId) query.organizationId = orgId;

      const hypothesis = await InvestigationHypothesis.findOne(query);
      if (!hypothesis) return res.status(404).json({ success: false, error: 'Hypothesis not found' });

      hypothesis.supportingEvidence.push({
        evidenceId: evidenceId || `EV-${Date.now()}`,
        description: description || 'Supporting forensic observation',
        source: source || 'INVESTIGATION',
        addedAt: new Date()
      });
      hypothesis.status = 'SUPPORTED';
      hypothesis.updatedAt = new Date();
      await hypothesis.save();

      return res.json({ success: true, hypothesis });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async refuteHypothesis(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const { evidenceId, description, source } = req.body;

      const query = { hypothesisId: id };
      if (orgId) query.organizationId = orgId;

      const hypothesis = await InvestigationHypothesis.findOne(query);
      if (!hypothesis) return res.status(404).json({ success: false, error: 'Hypothesis not found' });

      hypothesis.contradictingEvidence.push({
        evidenceId: evidenceId || `EV-${Date.now()}`,
        description: description || 'Contradicting observation',
        source: source || 'INVESTIGATION',
        addedAt: new Date()
      });
      hypothesis.status = 'REFUTED';
      hypothesis.updatedAt = new Date();
      await hypothesis.save();

      return res.json({ success: true, hypothesis });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async closeHypothesis(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const { status = 'CLOSED', resolutionNotes } = req.body;

      const query = { hypothesisId: id };
      if (orgId) query.organizationId = orgId;

      const hypothesis = await InvestigationHypothesis.findOne(query);
      if (!hypothesis) return res.status(404).json({ success: false, error: 'Hypothesis not found' });

      hypothesis.status = status;
      hypothesis.resolutionNotes = resolutionNotes;
      hypothesis.closedAt = new Date();
      hypothesis.reviewedBy = req.user?.email || req.user?.username || 'LEAD_ANALYST';
      await hypothesis.save();

      return res.json({ success: true, hypothesis });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- DECISION ASSESSMENTS ---
  static async getAssessments(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { subjectType, subjectId } = req.query;
      const filter = orgId ? { organizationId: orgId } : {};
      if (subjectType) filter.subjectType = subjectType;
      if (subjectId) filter.subjectId = subjectId;

      const assessments = await DecisionAssessment.find(filter).sort({ evaluatedAt: -1 }).limit(50).lean();
      return res.json({ success: true, assessments });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async createAssessment(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const {
        subjectType,
        subjectId,
        decisionType = 'INCIDENT_TRIAGE',
        priority = 'MEDIUM',
        severity = 'MEDIUM',
        rationale,
        determination = 'DERIVED',
        evidenceReferences = [],
        relatedEntities = [],
        recommendedActions = []
      } = req.body;

      if (!subjectType || !subjectId || !rationale) {
        return res.status(400).json({ success: false, error: 'subjectType, subjectId, and rationale are required' });
      }

      const contentHash = crypto.createHash('sha256').update(JSON.stringify({
        orgId, subjectType, subjectId, decisionType, rationale, determination
      })).digest('hex');

      const assessment = await DecisionAssessment.create({
        assessmentId: `ASSESS-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
        organizationId: orgId,
        subjectType,
        subjectId,
        decisionType,
        priority,
        severity,
        rationale,
        determination,
        evidenceReferences,
        relatedEntities,
        recommendedActions,
        evaluatedAt: new Date(),
        engineVersion: 'v62.2.0',
        contentHash
      });

      return res.status(201).json({ success: true, assessment });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async getAssessmentById(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { id } = req.params;
      const query = { assessmentId: id };
      if (orgId) query.organizationId = orgId;

      const assessment = await DecisionAssessment.findOne(query).lean();
      if (!assessment) return res.status(404).json({ success: false, error: 'Assessment not found' });

      return res.json({ success: true, assessment });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  static async compareAssessments(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const { assessmentIdA, assessmentIdB } = req.body;

      const queryA = { assessmentId: assessmentIdA };
      const queryB = { assessmentId: assessmentIdB };
      if (orgId) {
        queryA.organizationId = orgId;
        queryB.organizationId = orgId;
      }

      const a = await DecisionAssessment.findOne(queryA).lean();
      const b = await DecisionAssessment.findOne(queryB).lean();

      if (!a || !b) {
        return res.status(404).json({ success: false, error: 'One or both assessments not found' });
      }

      const comparison = {
        assessmentA: { id: a.assessmentId, priority: a.priority, severity: a.severity, determination: a.determination },
        assessmentB: { id: b.assessmentId, priority: b.priority, severity: b.severity, determination: b.determination },
        isPriorityChanged: a.priority !== b.priority,
        isSeverityChanged: a.severity !== b.severity,
        evidenceAdded: (b.evidenceReferences || []).filter(x => !(a.evidenceReferences || []).includes(x)),
        evidenceRemoved: (a.evidenceReferences || []).filter(x => !(b.evidenceReferences || []).includes(x)),
        comparedAt: new Date()
      };

      return res.json({ success: true, comparison });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  // --- EXECUTIVE DECISION SUMMARY ---
  static async getExecutiveDecisionSummary(req, res) {
    try {
      const orgId = req.user?.organizationId || null;
      const risk = await riskSynthesisService.calculateExecutiveRisk(orgId);
      const queue = await analystPriorityService.getPrioritizedQueue(orgId, { limit: 5 });
      const clusters = await clusteringService.discoverClusters(orgId, { limit: 5 });

      return res.json({
        success: true,
        summary: {
          executiveRisk: risk,
          topPriorities: queue.queue || [],
          activeClusters: clusters.clusters || [],
          generatedAt: new Date(),
          engineVersion: 'v62.2.0',
          disclaimer: 'Executive Summary reflects real deterministic signals; inferences and unknown factors are transparently identified.'
        }
      });
    } catch (err) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

module.exports = IntelligenceController;
