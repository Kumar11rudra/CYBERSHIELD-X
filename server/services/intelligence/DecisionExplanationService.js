class DecisionExplanationService {
  constructor(dependencies = {}) {
    this.dependencies = dependencies;
  }

  explainAssessment(assessment) {
    if (!assessment) {
      return {
        conclusion: 'UNKNOWN',
        determination: 'INSUFFICIENT_EVIDENCE',
        observedFacts: [],
        derivedFactors: [],
        unresolvedUncertainty: ['Assessment object is null or undefined.'],
        supportingEvidence: [],
        contradictoryEvidence: [],
        calculationVersion: 'v62.2.0',
        limitations: 'No assessment data provided to generate explanation.'
      };
    }

    const observedFacts = [];
    if (assessment.subjectType && assessment.subjectId) {
      observedFacts.push(`Evaluation performed for subject ${assessment.subjectType}:${assessment.subjectId}`);
    }
    if (assessment.riskScore !== null && assessment.riskScore !== undefined) {
      observedFacts.push(`Calculated risk score is ${assessment.riskScore}/100 (${assessment.riskBand || 'UNKNOWN'})`);
    }

    const derivedFactors = (assessment.factors || []).map(f =>
      `${f.factorName}: contributes ${f.contribution} points (basis: ${f.basis || 'Standard weighting'})`
    );

    const unresolvedUncertainty = [];
    if (assessment.determination === 'INSUFFICIENT_EVIDENCE' || assessment.riskScore === null) {
      unresolvedUncertainty.push('Incomplete telemetry: insufficient observed signals to determine high-confidence risk.');
    }
    if (!assessment.negativeEvidence || assessment.negativeEvidence.length === 0) {
      unresolvedUncertainty.push('Absence of observed negative indicators does not guarantee absence of intrusion.');
    }

    return {
      conclusion: assessment.determination || 'DERIVED',
      determination: assessment.determination || 'DERIVED',
      observedFacts,
      derivedFactors,
      unresolvedUncertainty,
      supportingEvidence: assessment.evidenceReferences || [],
      contradictoryEvidence: assessment.positiveEvidence || [],
      calculationVersion: assessment.engineVersion || assessment.algorithmVersion || 'v62.2.0',
      limitations: 'Analysis is bounded strictly by ingested platform telemetry and explicit Data Fabric relationships. Non-monitored egress/ingress is excluded from calculation.'
    };
  }
}

module.exports = DecisionExplanationService;
