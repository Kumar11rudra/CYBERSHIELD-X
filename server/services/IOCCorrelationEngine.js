const cveParser = require('../utils/cveParser');

/**
 * IOC Correlation Engine (Phase 5) - PURE COMPUTATIONAL MODULE
 * Combines feed intelligence, asset criticality parameters, port profiles, SSL health, and CVE vulnerabilities.
 * 
 * Formula:
 * - IOC Match: 40%
 * - Asset Criticality: 20% (Critical: 20, High: 15, Medium: 10, Low: 5)
 * - Open Ports: 15%
 * - SSL Status: 10%
 * - CVE Findings: 15%
 */
const computeCorrelation = (target, targetType, intelData) => {
    const cleanTarget = target.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0];
    const findings = [];
    let score = 0;

    // 1. IOC Threat Feed Match (40%)
    if (intelData.iocMatch || intelData.feedMatch) {
        score += 40;
        const sourceFeed = intelData.iocMatch?.source || intelData.feedMatch?.source || 'Public Feed';
        findings.push(`[THREAT-FEED] Match detected in Threat Intelligence indicators (Source: ${sourceFeed}) (+40 risk weight).`);
    } else {
        findings.push('[THREAT-FEED] Target is clean; no matching indicators in Threat Intelligence feeds.');
    }

    // 2. Asset Criticality (20%)
    if (intelData.asset) {
        const criticalityWeights = { Critical: 20, High: 15, Medium: 10, Low: 5 };
        const weight = criticalityWeights[intelData.asset.criticality] || 10;
        score += weight;
        findings.push(`[ASSETS] Target mapped to managed asset inventory (Criticality: ${intelData.asset.criticality}) (+${weight} risk weight).`);
    } else {
        findings.push('[ASSETS] Target is not currently provisioned in your managed asset inventory.');
    }

    // 3. Open Ports (15%) & 5. CVE Findings (15%)
    if (intelData.latestScan) {
        const rawLog = intelData.latestScan.breakdown?.UrlEngine?.rawLog || '';
        
        // Parse open ports
        const openPorts = [];
        const lines = rawLog.split('\n');
        for (const line of lines) {
            if (line.match(/^(\d+)\/tcp\s+open/i)) {
                openPorts.push(line.trim());
            }
        }

        if (openPorts.length > 0) {
            score += 15;
            findings.push(`[PORTS] Recent scan exposed ${openPorts.length} open TCP ports (+15 risk weight).`);
        } else {
            findings.push('[PORTS] No exposed ports detected in recent scan profiles.');
        }

        // Parse CVEs
        const bannerFindings = cveParser.lookupCVEsFromBanners(rawLog);
        if (bannerFindings.length > 0) {
            score += 15;
            const cveIds = bannerFindings.map(f => f.cve);
            findings.push(`[VULNERABILITIES] Discovered banner software CVE indicators: ${cveIds.join(', ')} (+15 risk weight).`);
        } else {
            findings.push('[VULNERABILITIES] Banner software versions appear updated; zero CVE matches.');
        }
    } else {
        findings.push('[PORTS] No ports scanned; historical logs missing.');
        findings.push('[VULNERABILITIES] No vulnerability scans found; banners audit skipped.');
    }

    // 4. SSL Status (10%)
    if (targetType === 'domain' || targetType === 'url') {
        const sslRes = intelData.sslRes;
        if (sslRes) {
            if (!sslRes.success || sslRes.daysLeft <= 30) {
                score += 10;
                const msg = sslRes.success 
                    ? `SSL certificate expires soon in ${sslRes.daysLeft} days`
                    : `SSL/TLS securing check failed: ${sslRes.error || 'Connection failed'}`;
                findings.push(`[SSL] ${msg} (+10 risk weight).`);
            } else {
                findings.push(`[SSL] SSL certificate is valid and healthy (${sslRes.daysLeft} days remaining).`);
            }
        } else {
            findings.push('[SSL] Target SSL information not provided.');
        }
    } else {
        findings.push('[SSL] Target is an IP address; SSL certificate audits skipped.');
    }

    // Upgrade risk levels per Enterprise V5 requirements
    let riskLevel = 'Informational';
    if (score >= 75) riskLevel = 'Critical';
    else if (score >= 50) riskLevel = 'High';
    else if (score >= 30) riskLevel = 'Medium';
    else if (score >= 15) riskLevel = 'Low';

    return {
        score,
        riskLevel,
        findings
    };
};

const correlateTarget = (...args) => {
    const { getIntelligenceModule } = require('./intelligenceComposition');
    const mod = getIntelligenceModule();
    return mod.correlationService.correlateTarget(...args);
};

module.exports = {
    computeCorrelation,
    correlateTarget
};
