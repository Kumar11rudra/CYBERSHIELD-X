const IntelligenceReportDTO = require('./dto/IntelligenceReportDTO');
const crypto = require('crypto');

class IntelligenceReportService {
    /**
     * @param {import('./dto/ScanCorrelationDTO')[]} correlations 
     * @param {string} target 
     * @returns {IntelligenceReportDTO}
     */
    generateReport(correlations, target) {
        let critical = 0;
        let high = 0;
        let medium = 0;
        let low = 0;
        let informational = 0;

        for (const c of correlations) {
            switch (c.riskScore.severity) {
                case 'Critical': critical++; break;
                case 'High': high++; break;
                case 'Medium': medium++; break;
                case 'Low': low++; break;
                case 'Informational': informational++; break;
            }
        }

        const total = critical + high + medium + low + informational;

        let executiveSummary = `Security scan completed for ${target}. Found ${total} total issues.`;
        if (critical > 0 || high > 0) {
            executiveSummary += ` Immediate action required for ${critical + high} high/critical vulnerabilities.`;
        } else {
            executiveSummary += ' No critical issues found.';
        }

        const recommendations = [];
        if (critical > 0) recommendations.push('Remediate critical vulnerabilities immediately.');
        if (high > 0) recommendations.push('Review and patch high severity issues.');

        return new IntelligenceReportDTO({
            reportId: crypto.randomUUID(),
            target: target,
            generatedAt: Date.now(),
            correlations: correlations,
            summary: {
                executiveSummary,
                technicalSummary: `Engine processed ${correlations.length} correlated findings.`
            },
            statistics: {
                critical, high, medium, low, informational, total
            },
            recommendations
        });
    }
}

module.exports = IntelligenceReportService;
