class RecommendationService {
    generateRecommendations(allScans) {
        const recommendations = [];
        if (allScans.length === 0) {
            recommendations.push('Run your first DNS, SSL, or Port scan to generate security posture insights.');
            return recommendations;
        }

        allScans.forEach(scan => {
            const targetLower = (scan.target || '').toLowerCase();
            if (scan.rawOutput && scan.rawOutput.includes('open') && (scan.targetType === 'ip' || targetLower.includes('nmap'))) {
                if (!recommendations.some(r => r.includes('port'))) {
                    recommendations.push('Exposed port discovered. Hardening firewall rules is recommended.');
                }
            }
        });

        const dnsScans = allScans.filter(s => s.tool === 'dig' || s.targetType === 'domain');
        if (dnsScans.length > 0 && dnsScans[0].riskLevel === 'dangerous') {
            recommendations.push('Domain resolution error or inactive DNS mapping. Verify host status.');
        }

        const sslScans = allScans.filter(s => s.tool === 'ssl');
        if (sslScans.length > 0 && sslScans[0].riskLevel === 'dangerous') {
            recommendations.push('Expired or invalid SSL certificate detected. Renew immediately to prevent HTTPS downtime.');
        }

        if (recommendations.length === 0) {
            recommendations.push('System posture healthy. No active threats detected.');
        }

        return recommendations;
    }
}
module.exports = RecommendationService;
