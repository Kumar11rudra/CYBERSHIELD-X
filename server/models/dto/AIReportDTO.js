class AIReportDTO {
    constructor({ 
        executiveSummary, 
        riskScore, 
        threatSummary, 
        keyFindings, 
        recommendations, 
        remediation, 
        references, 
        confidence, 
        providerMetadata 
    }) {
        this.executiveSummary = executiveSummary;
        this.riskScore = riskScore || 0;
        this.threatSummary = threatSummary || '';
        this.keyFindings = keyFindings || [];
        this.recommendations = recommendations || [];
        this.remediation = remediation || '';
        this.references = references || [];
        this.confidence = confidence || 0;
        this.providerMetadata = providerMetadata || {};
        
        Object.freeze(this);
    }
}
module.exports = AIReportDTO;
