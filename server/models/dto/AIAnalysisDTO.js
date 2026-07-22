class AIAnalysisDTO {
    constructor({ scanId, model, executiveSummary, findings, recommendations, remediationPlan, createdAt }) {
        this.scanId = scanId;
        this.model = model;
        this.executiveSummary = executiveSummary;
        this.findings = findings || [];
        this.recommendations = recommendations || [];
        this.remediationPlan = remediationPlan;
        this.createdAt = createdAt || new Date().toISOString();
        Object.freeze(this);
    }
}
module.exports = AIAnalysisDTO;
