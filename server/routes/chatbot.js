const express = require('express');
const router = express.Router();
const {
  handleChat,
  handleInvestigate,
  handleAnalyzeDetection,
  handleCorrelateFindings,
  handleDraftRule,
  handleSummarizeIncident,
  handleHuntingHypothesis,
  handleHuntingQuery,
  handleHuntingExplain,
  handleHuntingSummarize,
  handleHuntingDraftDetection,
  handleHuntingNextStep,
  handleIncidentSummarize,
  handleIncidentTriage,
  handleIncidentInvestigate,
  handleIncidentRecommendContainment,
  handleIncidentDraftTasks,
  handleIncidentPostmortem,
  handleDetectionReview,
  handleDetectionTune,
  handleDetectionMapAttack,
  handleDetectionFindGaps,
  handleDetectionTestPlan,
  handleReportSummarize,
  handleReportExecutive,
  handleExplainMetric,
  handleExplainControl,
  handleRecommendReportActions,
  handleGovernanceSummarize,
  handleGovernanceExplainPolicy,
  handleGovernanceExplainGap,
  handleGovernanceRecommendRemediation,
  handleReliabilitySummarize,
  handleReliabilityExplainHealth,
  handleReliabilityExplainSLO,
  handleReliabilityRecommendRemediation,
  handleAutomationSummarize,
  handleAutomationExplainDrift,
  handleAutomationRecommendRemediation,
  handleAutomationDraftPlaybook,
  handleInvestigationSummarize,
  handleInvestigationExplainRelationship,
  handleInvestigationSuggestPivots,
  handleInvestigationSummarizeTimeline,
  handleIntelligenceSummarize,
  handleIntelligenceExplainRisk,
  handleIntelligencePrioritize,
  handleIntelligenceSuggestInvestigation,
  handleIntelligenceSummarizeCluster,
} = require('../controllers/chatbot/chatbotController');
const { tryAuthenticate } = require('../middleware/auth');

// Endpoint to handle chatbot interaction (supports both guests and authenticated operators)
router.post('/chat', tryAuthenticate, handleChat);

// Bounded AI Investigation Assistant (Phase 69)
router.post('/investigate', tryAuthenticate, handleInvestigate);

// AI Detection Engineering & Incident Intelligence (Phase 70)
router.post('/detection/analyze', tryAuthenticate, handleAnalyzeDetection);
router.post('/detection/correlate', tryAuthenticate, handleCorrelateFindings);
router.post('/detection/draft-rule', tryAuthenticate, handleDraftRule);
router.post('/detection/summarize-incident', tryAuthenticate, handleSummarizeIncident);

// Bounded AI Detection Engineering (Phase 73)
router.post('/detection/review', tryAuthenticate, handleDetectionReview);
router.post('/detection/tune', tryAuthenticate, handleDetectionTune);
router.post('/detection/map-attack', tryAuthenticate, handleDetectionMapAttack);
router.post('/detection/find-gaps', tryAuthenticate, handleDetectionFindGaps);
router.post('/detection/test-plan', tryAuthenticate, handleDetectionTestPlan);

// Bounded AI Threat Hunting (Phase 71)
router.post('/hunting/hypothesis', tryAuthenticate, handleHuntingHypothesis);
router.post('/hunting/query', tryAuthenticate, handleHuntingQuery);
router.post('/hunting/explain', tryAuthenticate, handleHuntingExplain);
router.post('/hunting/summarize', tryAuthenticate, handleHuntingSummarize);
router.post('/hunting/draft-detection', tryAuthenticate, handleHuntingDraftDetection);
router.post('/hunting/next-step', tryAuthenticate, handleHuntingNextStep);

// Bounded AI Incident Copilot (Phase 72)
router.post('/incidents/summarize', tryAuthenticate, handleIncidentSummarize);
router.post('/incidents/triage', tryAuthenticate, handleIncidentTriage);
router.post('/incidents/investigate', tryAuthenticate, handleIncidentInvestigate);
router.post('/incidents/recommend-containment', tryAuthenticate, handleIncidentRecommendContainment);
router.post('/incidents/draft-tasks', tryAuthenticate, handleIncidentDraftTasks);
router.post('/incidents/postmortem', tryAuthenticate, handleIncidentPostmortem);

// Bounded AI Reporting & Compliance Copilot (Phase 74)
router.post('/reports/summarize', tryAuthenticate, handleReportSummarize);
router.post('/reports/executive', tryAuthenticate, handleReportExecutive);
router.post('/reports/explain-metric', tryAuthenticate, handleExplainMetric);
router.post('/reports/explain-control', tryAuthenticate, handleExplainControl);
router.post('/reports/recommend-actions', tryAuthenticate, handleRecommendReportActions);

// Bounded AI Governance Copilot (Phase 75)
router.post('/governance/summarize', tryAuthenticate, handleGovernanceSummarize);
router.post('/governance/explain-policy', tryAuthenticate, handleGovernanceExplainPolicy);
router.post('/governance/explain-gap', tryAuthenticate, handleGovernanceExplainGap);
router.post('/governance/recommend-remediation', tryAuthenticate, handleGovernanceRecommendRemediation);

// Bounded AI Reliability Copilot (Phase 76)
router.post('/reliability/summarize', tryAuthenticate, handleReliabilitySummarize);
router.post('/reliability/explain-health', tryAuthenticate, handleReliabilityExplainHealth);
router.post('/reliability/explain-slo', tryAuthenticate, handleReliabilityExplainSLO);
router.post('/reliability/recommend-remediation', tryAuthenticate, handleReliabilityRecommendRemediation);

// Bounded AI Automation Copilot (Phase 77)
router.post('/automation/summarize', tryAuthenticate, handleAutomationSummarize);
router.post('/automation/explain-drift', tryAuthenticate, handleAutomationExplainDrift);
router.post('/automation/recommend-remediation', tryAuthenticate, handleAutomationRecommendRemediation);
router.post('/automation/draft-playbook', tryAuthenticate, handleAutomationDraftPlaybook);

// Bounded AI Investigation Copilot (Phase 78)
router.post('/investigation/summarize', tryAuthenticate, handleInvestigationSummarize);
router.post('/investigation/explain-relationship', tryAuthenticate, handleInvestigationExplainRelationship);
router.post('/investigation/suggest-pivots', tryAuthenticate, handleInvestigationSuggestPivots);
router.post('/investigation/summarize-timeline', tryAuthenticate, handleInvestigationSummarizeTimeline);

// Bounded AI Decision Intelligence Copilot (Phase 79)
router.post('/intelligence/summarize', tryAuthenticate, handleIntelligenceSummarize);
router.post('/intelligence/explain-risk', tryAuthenticate, handleIntelligenceExplainRisk);
router.post('/intelligence/prioritize', tryAuthenticate, handleIntelligencePrioritize);
router.post('/intelligence/suggest-investigation', tryAuthenticate, handleIntelligenceSuggestInvestigation);
router.post('/intelligence/summarize-cluster', tryAuthenticate, handleIntelligenceSummarizeCluster);

module.exports = router;



