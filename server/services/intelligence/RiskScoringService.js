const RiskScoreDTO = require('./dto/RiskScoreDTO');

class RiskScoringService {
    /**
     * Evaluates a cluster of findings and assigns a unified RiskScoreDTO.
     * @param {import('./dto/SecurityFindingDTO')[]} findings
     * @returns {RiskScoreDTO}
     */
    score(findings) {
        let maxSeverity = 'Informational';
        let maxScore = 0.0;

        const severityMap = {
            'Informational': 1,
            'Low': 2,
            'Medium': 3,
            'High': 4,
            'Critical': 5
        };

        const reverseSeverityMap = {
            1: 'Informational',
            2: 'Low',
            3: 'Medium',
            4: 'High',
            5: 'Critical'
        };

        let currentMaxLevel = 1;

        for (const finding of findings) {
            let level = 1;
            let score = 0.0;

            if (finding.type === 'vulnerability') {
                level = 4; // High default for vulns
                score = 7.5;
                if (finding.metadata && finding.metadata.cvssBaseScore) {
                    score = finding.metadata.cvssBaseScore;
                    if (score >= 9.0) level = 5;
                    else if (score >= 7.0) level = 4;
                    else if (score >= 4.0) level = 3;
                    else level = 2;
                }
            } else if (finding.type === 'port') {
                level = 1;
                score = 0.0;
                // If risky ports
                const riskyPorts = [22, 23, 3389, 445];
                if (finding.metadata.port && riskyPorts.includes(parseInt(finding.metadata.port))) {
                    level = 3;
                    score = 4.0;
                }
            } else if (finding.type === 'misconfiguration') {
                level = 3;
                score = 5.0;
            }

            if (level > currentMaxLevel) {
                currentMaxLevel = level;
            }
            if (score > maxScore) {
                maxScore = score;
            }
        }

        return new RiskScoreDTO({
            severity: reverseSeverityMap[currentMaxLevel],
            score: maxScore
        });
    }
}

module.exports = RiskScoringService;
