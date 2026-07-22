const ScanCorrelationDTO = require('./dto/ScanCorrelationDTO');
const crypto = require('crypto');

class FindingDeduplicator {
    /**
     * @param {import('./RiskScoringService')} riskScoringService 
     */
    constructor(riskScoringService) {
        this.riskScoringService = riskScoringService;
    }

    /**
     * @param {import('./dto/SecurityFindingDTO')[]} findings 
     * @returns {ScanCorrelationDTO[]}
     */
    deduplicate(findings) {
        // Simple deduplication strategy based on target + type + basic title keyword match
        const clusters = new Map();

        for (const finding of findings) {
            // A crude correlation key. In a real system, this would use semantic similarity or strict asset matching.
            let key = `${finding.target}_${finding.type}`;
            
            // For ports, group by port number
            if (finding.type === 'port' && finding.metadata.port) {
                key += `_${finding.metadata.port}`;
            } else {
                // Group by first 2 words of title as a naive proxy
                key += `_${finding.title.split(' ').slice(0,2).join('_').toLowerCase()}`;
            }

            if (!clusters.has(key)) {
                clusters.set(key, []);
            }
            clusters.get(key).push(finding);
        }

        const correlations = [];

        for (const [key, clusterFindings] of clusters.entries()) {
            const primary = clusterFindings[0];
            const riskScore = this.riskScoringService.score(clusterFindings);

            const correlation = new ScanCorrelationDTO({
                correlationId: crypto.randomUUID(),
                title: primary.title, // Use primary title for the correlated issue
                description: `Correlated finding from ${clusterFindings.length} source(s).`,
                target: primary.target,
                issueType: primary.type,
                findings: clusterFindings,
                riskScore
            });

            correlations.push(correlation);
        }

        return correlations;
    }
}

module.exports = FindingDeduplicator;
