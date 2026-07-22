class SecurityScoringService {
    calculateScore(allScans) {
        let dnsScore = 25;
        let sslScore = 25;
        let subScore = 20;
        let threatScore = 15;
        let historyScore = 0;

        if (allScans.length > 15) historyScore = 15;
        else if (allScans.length > 5) historyScore = 10;
        else if (allScans.length > 0) historyScore = 5;

        let dangerousScans = 0;
        let warningScans = 0;

        allScans.forEach(scan => {
            if (scan.riskLevel === 'dangerous') dangerousScans++;
            else if (scan.riskLevel === 'medium') warningScans++;
        });

        const dnsScans = allScans.filter(s => s.tool === 'dig' || s.targetType === 'domain');
        if (dnsScans.length > 0) {
            const latestDns = dnsScans[0];
            const failed = latestDns.riskLevel === 'dangerous'; // simplified
            dnsScore = failed ? 10 : 25;
        }

        const sslScans = allScans.filter(s => s.tool === 'ssl');
        if (sslScans.length > 0) {
            const isValid = sslScans[0].riskLevel !== 'dangerous';
            sslScore = isValid ? 25 : 5;
        }

        const subScans = allScans.filter(s => s.tool === 'subfinder');
        if (subScans.length > 0) {
            subScore = 20; // simplified
        }

        if (dangerousScans > 0) threatScore = 5;
        else if (warningScans > 0) threatScore = 10;

        return dnsScore + sslScore + subScore + threatScore + historyScore;
    }
}
module.exports = SecurityScoringService;
