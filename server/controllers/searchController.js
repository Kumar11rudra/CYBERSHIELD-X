const Case = require('../models/Case');
const Finding = require('../models/Finding');
const Alert = require('../models/Alert');
const DetectionRule = require('../models/DetectionRule');
const Incident = require('../models/Incident');
const IncidentTask = require('../models/IncidentTask');
const EvidenceRecord = require('../models/EvidenceRecord');
const IOCRecord = require('../models/IOCRecord');
const Playbook = require('../models/Playbook');
const PendingApproval = require('../models/PendingApproval');
const ThreatHunt = require('../models/ThreatHunt');
const ThreatHuntTemplate = require('../models/ThreatHuntTemplate');
const ThreatActorProfile = require('../models/ThreatActorProfile');
const Campaign = require('../models/Campaign');
const DetectionContentPack = require('../models/DetectionContentPack');
const DetectionGap = require('../models/DetectionGap');
const SOCReport = require('../models/SOCReport');
const ComplianceControl = require('../models/ComplianceControl');
const ComplianceEvidence = require('../models/ComplianceEvidence');
const GovernancePolicy = require('../models/GovernancePolicy');
const RetentionPolicy = require('../models/RetentionPolicy');
const BreakGlassSession = require('../models/BreakGlassSession');
const IntegrationCredentialMetadata = require('../models/IntegrationCredentialMetadata');
const SLODefinition = require('../models/SLODefinition');
const RecoveryExercise = require('../models/RecoveryExercise');
const BackupVerification = require('../models/BackupVerification');
const AutomationPlaybook = require('../models/AutomationPlaybook');
const SecurityDrift = require('../models/SecurityDrift');
const ControlValidation = require('../models/ControlValidation');
const AutomationExecution = require('../models/AutomationExecution');
const SecurityGraphNode = require('../models/SecurityGraphNode');
const CorrelationRule = require('../models/CorrelationRule');
const CorrelationResult = require('../models/CorrelationResult');
const InvestigationGraphSnapshot = require('../models/InvestigationGraphSnapshot');
const DecisionAssessment = require('../models/DecisionAssessment');
const RiskAssessment = require('../models/RiskAssessment');
const AnalystRecommendation = require('../models/AnalystRecommendation');
const InvestigationHypothesis = require('../models/InvestigationHypothesis');
const RiskSnapshot = require('../models/RiskSnapshot');
const terminalJobService = require('../services/TerminalJobService');
const { getCanonicalToolsWithStatus } = require('../utils/canonicalTools');
const logger = require('../utils/logger');



/**
 * Global Multi-Entity Search honoring RBAC & Organization Scope (Phase 70)
 * GET /api/search?q=query
 */
exports.search = async (req, res) => {
  try {
    const rawQuery = (req.query.q || '').trim();
    if (!rawQuery) {
      return res.json({
        success: true,
        data: {
          query: '',
          totalCount: 0,
          results: {
            tools: [],
            cases: [],
            findings: [],
            alerts: [],
            jobs: [],
            detections: [],
            incidents: [],
            iocs: [],
            playbooks: [],
            approvals: [],
          },
        },
      });
    }

    const regex = new RegExp(rawQuery, 'i');
    const user = req.user;
    const userRole = (user?.role || 'viewer').toLowerCase();
    const isOperatorOrAdmin = ['operator', 'admin'].includes(userRole);
    const orgId = user?.organizationId || null;

    const orgFilter = orgId ? { $or: [{ organizationId: orgId }, { organizationId: null }] } : {};

    // 1. Search Canonical Tools
    const allTools = getCanonicalToolsWithStatus();
    const matchedTools = allTools
      .filter((t) => regex.test(t.id) || regex.test(t.name) || regex.test(t.description) || regex.test(t.category))
      .slice(0, 10);

    // 2. Search Cases
    const caseFilter = {
      ...orgFilter,
      $or: [
        { caseId: regex },
        { title: regex },
        { description: regex },
        { tags: { $in: [regex] } },
        { assets: { $in: [regex] } },
      ],
    };
    const matchedCases = await Case.find(caseFilter)
      .select('caseId title severity status tags assets updatedAt createdAt')
      .limit(10)
      .lean();

    // 3. Search Findings
    const findingFilter = {
      $or: [
        { findingId: regex },
        { title: regex },
        { description: regex },
        { asset: regex },
        { sourceTool: regex },
      ],
    };
    const matchedFindings = await Finding.find(findingFilter)
      .select('findingId caseId asset sourceTool title severity status createdAt')
      .limit(10)
      .lean();

    // 4. Search Alerts
    const alertFilter = {
      $or: [
        { alertId: regex },
        { title: regex },
        { description: regex },
        { source: regex },
        { asset: regex },
      ],
    };
    const matchedAlerts = await Alert.find(alertFilter)
      .select('alertId title severity category status source asset createdAt')
      .limit(10)
      .lean();

    // 5. Search Jobs
    const jobsResult = terminalJobService.getJobs({ user, limit: 100 });
    const matchedJobs = (jobsResult.jobs || [])
      .filter((j) => regex.test(j.jobId) || regex.test(j.tool) || regex.test(j.target) || regex.test(j.status))
      .slice(0, 10);

    // 6. Search Detection Rules (Phase 73 Enhanced)
    const detectionFilter = {
      ...orgFilter,
      $or: [
        { ruleId: regex },
        { contentId: regex },
        { name: regex },
        { description: regex },
        { category: regex },
        { tags: { $in: [regex] } },
        { 'mitreAttack.techniqueId': regex },
        { 'mitreAttack.techniqueName': regex },
      ],
    };
    const matchedDetections = await DetectionRule.find(detectionFilter)
      .select('ruleId contentId name severity category status enabled ruleVersion revision healthStatus matchCount')
      .limit(10)
      .lean();

    // 6b. Search Content Packs & Detection Gaps (Phase 73)
    const packFilter = {
      ...orgFilter,
      $or: [{ packId: regex }, { name: regex }, { description: regex }, { category: regex }],
    };
    const matchedPacks = await DetectionContentPack.find(packFilter)
      .select('packId name version category status author rules')
      .limit(10)
      .lean();

    const gapFilter = {
      ...orgFilter,
      $or: [{ gapId: regex }, { title: regex }, { description: regex }, { techniqueId: regex }],
    };
    const matchedGaps = await DetectionGap.find(gapFilter)
      .select('gapId title techniqueId techniqueName tactic severity status')
      .limit(10)
      .lean();

    // 7. Search Incidents (Phase 72 Enhanced)
    const incidentFilter = {
      ...orgFilter,
      $or: [
        { incidentId: regex },
        { title: regex },
        { description: regex },
        { affectedAssets: { $in: [regex] } },
        { 'classification.tactic': regex },
        { 'classification.incidentType': regex },
        { 'closure.rootCause': regex },
        { 'assignment.primaryAnalyst.name': regex },
        { 'responseActions.type': regex },
        { 'priority.level': regex },
      ],
    };
    const matchedIncidents = await Incident.find(incidentFilter)
      .select('incidentId title severity status confidence riskScore priority classification assignment affectedAssets createdAt')
      .limit(10)
      .lean();

    // 8. Search IOCs
    const iocFilter = {
      ...orgFilter,
      $or: [{ indicator: regex }, { rawIndicator: regex }, { tags: { $in: [regex] } }],
    };
    const matchedIocs = await IOCRecord.find(iocFilter)
      .select('indicator type reputation confidence occurrenceCount lastSeen')
      .limit(10)
      .lean();

    // 9. Search Playbooks
    const playbookFilter = {
      ...orgFilter,
      $or: [{ name: regex }, { description: regex }],
    };
    const matchedPlaybooks = await Playbook.find(playbookFilter)
      .select('name description enabled version runCount')
      .limit(10)
      .lean();

    // 10. Search Pending Approvals (Visible to Analysts / Operators / Admins)
    let matchedApprovals = [];
    if (['analyst', 'operator', 'admin'].includes(userRole)) {
      const approvalFilter = {
        ...orgFilter,
        $or: [{ approvalId: regex }, { target: regex }, { tool: regex }, { reason: regex }],
      };
      matchedApprovals = await PendingApproval.find(approvalFilter)
        .select('approvalId actionType riskLevel target tool status reason expiresAt')
        .limit(10)
        .lean();
    }

    // 11. Search Threat Hunts (Phase 71)
    const huntFilter = {
      ...orgFilter,
      $or: [{ huntId: regex }, { name: regex }, { hypothesis: regex }, { category: regex }, { tags: { $in: [regex] } }],
    };
    const matchedHunts = await ThreatHunt.find(huntFilter)
      .select('huntId name category status hypothesis createdAt')
      .limit(10)
      .lean();

    // 12. Search Threat Hunt Templates (Phase 71)
    const templateFilter = {
      ...orgFilter,
      $or: [{ templateId: regex }, { name: regex }, { description: regex }, { category: regex }],
    };
    const matchedTemplates = await ThreatHuntTemplate.find(templateFilter)
      .select('templateId name category description defaultTimeWindow')
      .limit(10)
      .lean();

    // 13. Search Threat Actors (Phase 71)
    const actorFilter = {
      ...orgFilter,
      $or: [{ actorId: regex }, { name: regex }, { aliases: { $in: [regex] } }, { motivation: regex }],
    };
    const matchedActors = await ThreatActorProfile.find(actorFilter)
      .select('actorId name aliases motivation attributionStatus')
      .limit(10)
      .lean();

    // 14. Search Campaigns (Phase 71)
    const campaignFilter = {
      ...orgFilter,
      $or: [{ campaignId: regex }, { name: regex }, { description: regex }, { threatActorName: regex }],
    };
    const matchedCampaigns = await Campaign.find(campaignFilter)
      .select('campaignId name threatActorName status timeframe')
      .limit(10)
      .lean();

    // 15. Search Incident Tasks (Phase 72)
    const taskFilter = {
      ...orgFilter,
      $or: [
        { taskId: regex },
        { title: regex },
        { description: regex },
        { priority: regex },
        { 'assignee.name': regex },
        { status: regex },
      ],
    };
    const matchedTasks = await IncidentTask.find(taskFilter)
      .select('taskId incidentId title status priority assignee dueAt createdAt')
      .limit(10)
      .lean();

    // 16. Search Evidence Records (Phase 72)
    const evidenceFilter = {
      ...orgFilter,
      $or: [
        { evidenceId: regex },
        { sourceEntity: regex },
        { sourceId: regex },
        { hash: regex },
        { integrityStatus: regex },
      ],
    };
    const matchedEvidence = await EvidenceRecord.find(evidenceFilter)
      .select('evidenceId incidentId caseId sourceEntity hash integrityStatus timestamp')
      .limit(10)
      .lean();

    // 17. Search SOC Reports (Phase 74)
    const reportFilter = {
      ...orgFilter,
      $or: [
        { reportId: regex },
        { title: regex },
        { reportType: regex },
        { status: regex },
      ],
    };
    const matchedReports = await SOCReport.find(reportFilter)
      .select('reportId title reportType status version generatedAt')
      .limit(10)
      .lean();

    // 18. Search Compliance Controls (Phase 74)
    const controlFilter = {
      $or: [
        { controlId: regex },
        { title: regex },
        { domain: regex },
        { description: regex },
      ],
    };
    const matchedControls = await ComplianceControl.find(controlFilter)
      .select('controlId title domain status evidenceCount')
      .limit(10)
      .lean();

    // 19. Search Compliance Evidence Packages (Phase 74)
    const packageFilter = {
      ...orgFilter,
      $or: [
        { packageId: regex },
        { controlId: regex },
        { controlTitle: regex },
        { controlDomain: regex },
      ],
    };
    const matchedPackages = await ComplianceEvidence.find(packageFilter)
      .select('packageId controlId controlTitle controlDomain evidenceCount packageHash generatedAt')
      .limit(10)
      .lean();

    // 22. Search Governance Policies (Phase 75)
    const policyFilter = {
      ...orgFilter,
      $or: [
        { policyId: regex },
        { name: regex },
        { description: regex },
        { policyType: regex },
      ],
    };
    const matchedGovernancePolicies = await GovernancePolicy.find(policyFilter)
      .select('policyId name policyType status currentVersion enforcementMode updatedAt')
      .limit(10)
      .lean();

    // 23. Search Retention Policies (Phase 75)
    const retentionFilter = {
      ...orgFilter,
      $or: [
        { retentionId: regex },
        { name: regex },
        { entityType: regex },
        { description: regex },
      ],
    };
    const matchedRetentionPolicies = await RetentionPolicy.find(retentionFilter)
      .select('retentionId name entityType retentionDays retentionClass legalHoldActive updatedAt')
      .limit(10)
      .lean();

    // 24. Search Break-Glass Sessions (Phase 75)
    const breakGlassFilter = {
      ...orgFilter,
      $or: [
        { sessionId: regex },
        { reason: regex },
        { 'requester.username': regex },
        { scope: { $in: [regex] } },
      ],
    };
    const matchedBreakGlass = await BreakGlassSession.find(breakGlassFilter)
      .select('sessionId reason status requester approver durationMinutes startedAt expiresAt')
      .limit(10)
      .lean();

    // 25. Search Integration Metadata (Phase 75 - NO credentials exposed)
    const integrationFilter = {
      ...orgFilter,
      $or: [
        { integrationId: regex },
        { name: regex },
        { type: regex },
      ],
    };
    const matchedIntegrations = await IntegrationCredentialMetadata.find(integrationFilter)
      .select('integrationId name type status expiresAt rotationIntervalDays')
      .limit(10)
      .lean();

    // 26. Search SLO Definitions (Phase 76)
    const sloFilter = {
      ...orgFilter,
      $or: [
        { sloId: regex },
        { name: regex },
        { description: regex },
        { service: regex },
      ],
    };
    const matchedSLOs = await SLODefinition.find(sloFilter)
      .select('sloId name service metricType targetPercent status currentAttainmentPercent')
      .limit(10)
      .lean();

    // 27. Search Recovery Exercises (Phase 76)
    const recoveryFilter = {
      ...orgFilter,
      $or: [
        { exerciseId: regex },
        { name: regex },
        { scope: regex },
      ],
    };
    const matchedRecoveryExercises = await RecoveryExercise.find(recoveryFilter)
      .select('exerciseId name scope status observedRTOSeconds observedRPOSeconds createdAt')
      .limit(10)
      .lean();

    // 28. Search Backup Verifications (Phase 76)
    const backupFilter = {
      ...orgFilter,
      $or: [
        { backupId: regex },
        { source: regex },
        { location: regex },
      ],
    };
    const matchedBackups = await BackupVerification.find(backupFilter)
      .select('backupId source status backupTimestamp checksum integrityVerified restoreTested')
      .limit(10)
      .lean();

    // 29. Search Automation Playbooks (Phase 77)
    const autoPlaybookFilter = {
      ...orgFilter,
      $or: [
        { playbookId: regex },
        { name: regex },
        { description: regex }
      ]
    };
    const matchedAutoPlaybooks = await AutomationPlaybook.find(autoPlaybookFilter)
      .select('playbookId name description category status version')
      .limit(10)
      .lean();

    // 30. Search Security Drifts (Phase 77)
    const driftFilter = {
      ...orgFilter,
      $or: [
        { driftId: regex },
        { driftType: regex },
        { sourceRecord: regex }
      ]
    };
    const matchedDrifts = await SecurityDrift.find(driftFilter)
      .select('driftId driftType sourceRecord severity status detectedAt')
      .limit(10)
      .lean();

    // 31. Search Automation Executions (Phase 77)
    const executionFilter = {
      ...orgFilter,
      $or: [
        { executionId: regex },
        { playbookId: regex },
        { status: regex },
        { idempotencyKey: regex }
      ]
    };
    const matchedExecutions = await AutomationExecution.find(executionFilter)
      .select('executionId playbookId status triggerType startedAt completedAt')
      .limit(10)
      .lean();

    // 32. Search Security Graph Nodes (Phase 78)
    const graphNodeFilter = {
      ...orgFilter,
      $or: [
        { nodeId: regex },
        { displayName: regex },
        { entityId: regex },
        { entityType: regex }
      ]
    };
    const matchedGraphNodes = await SecurityGraphNode.find(graphNodeFilter)
      .select('nodeId displayName entityType entityId classification source')
      .limit(10)
      .lean();

    // 33. Search Correlation Rules (Phase 78)
    const corrRuleFilter = {
      ...orgFilter,
      $or: [
        { ruleId: regex },
        { name: regex },
        { description: regex }
      ]
    };
    const matchedCorrRules = await CorrelationRule.find(corrRuleFilter)
      .select('ruleId name description relationshipType status')
      .limit(10)
      .lean();

    // 34. Search Investigation Graph Snapshots (Phase 78)
    const snapshotFilter = {
      ...orgFilter,
      $or: [
        { snapshotId: regex },
        { contentHash: regex }
      ]
    };
    const matchedSnapshots = await InvestigationGraphSnapshot.find(snapshotFilter)
      .select('snapshotId nodeCount edgeCount generatedAt contentHash')
      .limit(10)
      .lean();

    // 35. Search Decision Assessments (Phase 79)
    const decisionAssessFilter = {
      ...orgFilter,
      $or: [
        { assessmentId: regex },
        { subjectId: regex },
        { rationale: regex }
      ]
    };
    const matchedDecisionAssessments = await DecisionAssessment.find(decisionAssessFilter)
      .select('assessmentId subjectType subjectId priority severity determination rationale')
      .limit(10)
      .lean();

    // 36. Search Risk Assessments (Phase 79)
    const riskAssessFilter = {
      ...orgFilter,
      $or: [
        { assessmentId: regex },
        { subjectId: regex },
        { riskBand: regex }
      ]
    };
    const matchedRiskAssessments = await RiskAssessment.find(riskAssessFilter)
      .select('assessmentId subjectType subjectId riskScore riskBand calculatedAt')
      .limit(10)
      .lean();

    // 37. Search Analyst Recommendations (Phase 79)
    const recommendationFilter = {
      ...orgFilter,
      $or: [
        { recommendationId: regex },
        { title: regex },
        { rationale: regex }
      ]
    };
    const matchedAnalystRecommendations = await AnalystRecommendation.find(recommendationFilter)
      .select('recommendationId title recommendationType priority authorization status')
      .limit(10)
      .lean();

    // 38. Search Investigation Hypotheses (Phase 79)
    const hypothesisFilter = {
      ...orgFilter,
      $or: [
        { hypothesisId: regex },
        { title: regex },
        { statement: regex }
      ]
    };
    const matchedHypotheses = await InvestigationHypothesis.find(hypothesisFilter)
      .select('hypothesisId title statement status createdBy')
      .limit(10)
      .lean();

    // 39. Search Risk Snapshots (Phase 79)
    const riskSnapshotFilter = {
      ...orgFilter,
      $or: [
        { snapshotId: regex },
        { subjectId: regex },
        { contentHash: regex }
      ]
    };
    const matchedRiskSnapshots = await RiskSnapshot.find(riskSnapshotFilter)
      .select('snapshotId subjectType subjectId calculatedRisk riskBand contentHash')
      .limit(10)
      .lean();

    const totalCount =
      matchedTools.length +
      matchedCases.length +
      matchedFindings.length +
      matchedAlerts.length +
      matchedJobs.length +
      matchedDetections.length +
      matchedIncidents.length +
      matchedIocs.length +
      matchedPlaybooks.length +
      matchedApprovals.length +
      matchedHunts.length +
      matchedTemplates.length +
      matchedActors.length +
      matchedCampaigns.length +
      matchedTasks.length +
      matchedEvidence.length +
      matchedPacks.length +
      matchedGaps.length +
      matchedReports.length +
      matchedControls.length +
      matchedPackages.length +
      matchedGovernancePolicies.length +
      matchedRetentionPolicies.length +
      matchedBreakGlass.length +
      matchedIntegrations.length +
      matchedSLOs.length +
      matchedRecoveryExercises.length +
      matchedBackups.length +
      matchedAutoPlaybooks.length +
      matchedDrifts.length +
      matchedExecutions.length +
      matchedGraphNodes.length +
      matchedCorrRules.length +
      matchedSnapshots.length +
      matchedDecisionAssessments.length +
      matchedRiskAssessments.length +
      matchedAnalystRecommendations.length +
      matchedHypotheses.length +
      matchedRiskSnapshots.length;

    res.json({
      success: true,
      data: {
        query: rawQuery,
        totalCount,
        results: {
          tools: matchedTools,
          cases: matchedCases,
          findings: matchedFindings,
          alerts: matchedAlerts,
          jobs: matchedJobs,
          detections: matchedDetections,
          packs: matchedPacks,
          gaps: matchedGaps,
          incidents: matchedIncidents,
          iocs: matchedIocs,
          playbooks: matchedPlaybooks,
          approvals: matchedApprovals,
          hunts: matchedHunts,
          templates: matchedTemplates,
          threatActors: matchedActors,
          campaigns: matchedCampaigns,
          tasks: matchedTasks,
          evidence: matchedEvidence,
          reports: matchedReports,
          complianceControls: matchedControls,
          evidencePackages: matchedPackages,
          governancePolicies: matchedGovernancePolicies,
          retentionPolicies: matchedRetentionPolicies,
          breakGlassSessions: matchedBreakGlass,
          integrations: matchedIntegrations,
          slos: matchedSLOs,
          recoveryExercises: matchedRecoveryExercises,
          backups: matchedBackups,
          automationPlaybooks: matchedAutoPlaybooks,
          securityDrifts: matchedDrifts,
          automationExecutions: matchedExecutions,
          securityGraphNodes: matchedGraphNodes,
          correlationRules: matchedCorrRules,
          investigationSnapshots: matchedSnapshots,
          decisionAssessments: matchedDecisionAssessments,
          riskAssessments: matchedRiskAssessments,
          analystRecommendations: matchedAnalystRecommendations,
          investigationHypotheses: matchedHypotheses,
          riskSnapshots: matchedRiskSnapshots,
        },
      },
    });


  } catch (error) {
    logger.error('Global search failed:', error);
    res.status(500).json({
      success: false,
      error: 'Search operation failed'
    });
  }
};

exports.searchAllEntities = exports.search;
