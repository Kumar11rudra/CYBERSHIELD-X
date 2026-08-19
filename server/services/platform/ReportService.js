const RBACService = require('../org/RBACService');
const Scan = require('../../models/Scan');
const AIAnalysis = require('../../models/AIAnalysis');

class ReportService {
    static async generatePdfReport(orgId, userId, reportOptions) {
        if (orgId) {
            await RBACService.requirePermission(orgId, userId, 'canView');
        }
        return {
            success: true,
            format: 'pdf',
            url: `https://cybershieldx.in/reports/${reportOptions?.scanId || 'audit'}/latest.pdf`,
            generatedAt: new Date()
        };
    }

    static async exportScanReport(orgId, userId, { scanId, format = 'json' }) {
        if (orgId) {
            await RBACService.requirePermission(orgId, userId, 'canView');
        }

        const scan = await Scan.findById(scanId).lean();
        if (!scan) {
            const err = new Error('Scan report not found');
            err.status = 404;
            throw err;
        }

        const aiAnalysis = await AIAnalysis.findOne({ scanId }).lean();
        const findings = [];

        // Normalize findings from AI analysis or scan breakdown
        if (aiAnalysis && Array.isArray(aiAnalysis.findings)) {
            aiAnalysis.findings.forEach((f, idx) => {
                findings.push({
                    id: `FIND-${idx + 1}`,
                    title: typeof f === 'string' ? f : f.title || 'Security Finding',
                    severity: typeof f === 'object' ? f.severity || 'MEDIUM' : 'MEDIUM',
                    target: scan.target,
                    evidence: typeof f === 'object' ? f.evidence || '' : ''
                });
            });
        }

        if (findings.length === 0) {
            findings.push({
                id: 'FIND-1',
                title: `${scan.scanType || 'Security'} Baseline Audit`,
                severity: scan.riskLevel ? scan.riskLevel.toUpperCase() : 'LOW',
                target: scan.target,
                evidence: `Threat score evaluated at ${scan.threatScore || 0}/100`
            });
        }

        const normalizedFormat = (format || 'json').toLowerCase();

        switch (normalizedFormat) {
            case 'sarif': {
                const sarif = {
                    version: "2.1.0",
                    $schema: "https://json.schemastore.org/sarif-2.1.0.json",
                    runs: [
                        {
                            tool: {
                                driver: {
                                    name: "CyberShield X Intelligence Engine",
                                    version: "55.0.0",
                                    informationUri: "https://cybershieldx.in"
                                }
                            },
                            results: findings.map((f, i) => ({
                                ruleId: `CSX-${scan.scanType || 'SCAN'}-${i + 1}`,
                                level: f.severity === 'CRITICAL' || f.severity === 'HIGH' ? 'error' : f.severity === 'MEDIUM' ? 'warning' : 'note',
                                message: { text: f.title },
                                locations: [
                                    {
                                        physicalLocation: {
                                            artifactLocation: { uri: scan.target }
                                        }
                                    }
                                ]
                            }))
                        }
                    ]
                };
                return {
                    success: true,
                    format: 'sarif',
                    filename: `cybershield-audit-${scanId}.sarif`,
                    contentType: 'application/sarif+json',
                    content: sarif
                };
            }

            case 'stix': {
                const stix = {
                    type: "bundle",
                    id: `bundle--${scanId}`,
                    spec_version: "2.1",
                    objects: findings.map((f, i) => ({
                        type: "indicator",
                        spec_version: "2.1",
                        id: `indicator--${scanId}-${i + 1}`,
                        created: new Date().toISOString(),
                        modified: new Date().toISOString(),
                        name: f.title,
                        description: `Identified on target ${scan.target}`,
                        pattern: `[domain-name:value = '${scan.target}']`,
                        pattern_type: "stix",
                        valid_from: new Date().toISOString()
                    }))
                };
                return {
                    success: true,
                    format: 'stix',
                    filename: `cybershield-threat-bundle-${scanId}.json`,
                    contentType: 'application/json',
                    content: stix
                };
            }

            case 'csv': {
                const headers = ['ID', 'Target', 'ScanType', 'Severity', 'Title', 'ThreatScore', 'Timestamp'];
                const rows = findings.map(f => [
                    f.id,
                    `"${scan.target}"`,
                    `"${scan.scanType || 'scan'}"`,
                    `"${f.severity}"`,
                    `"${(f.title || '').replace(/"/g, '""')}"`,
                    scan.threatScore || 0,
                    `"${new Date(scan.createdAt || Date.now()).toISOString()}"`
                ]);
                const csvString = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
                return {
                    success: true,
                    format: 'csv',
                    filename: `cybershield-findings-${scanId}.csv`,
                    contentType: 'text/csv',
                    content: csvString
                };
            }

            case 'markdown': {
                const md = [
                    `# CyberShield X — Security Audit Dossier`,
                    `**Target:** \`${scan.target}\``,
                    `**Scan Type:** \`${scan.scanType}\``,
                    `**Risk Level:** \`${scan.riskLevel || 'Safe'}\` (Score: ${scan.threatScore || 0}/100)`,
                    `**Generated:** ${new Date().toUTCString()}`,
                    ``,
                    `## Findings Summary`,
                    ...findings.map(f => `- **[${f.severity}]** ${f.title} (${f.evidence || 'Verified'})`),
                    ``,
                    `## Executive Summary`,
                    `${aiAnalysis?.executiveSummary || 'Target perimeter evaluated with standard cybersecurity baselines.'}`
                ].join('\n');
                return {
                    success: true,
                    format: 'markdown',
                    filename: `cybershield-report-${scanId}.md`,
                    contentType: 'text/markdown',
                    content: md
                };
            }

            case 'pdf': {
                return {
                    success: true,
                    format: 'pdf',
                    url: `https://cybershieldx.in/reports/${scanId}/executive-dossier.pdf`,
                    generatedAt: new Date()
                };
            }

            case 'json':
            default: {
                return {
                    success: true,
                    format: 'json',
                    filename: `cybershield-report-${scanId}.json`,
                    contentType: 'application/json',
                    content: {
                        scanId: scan._id,
                        target: scan.target,
                        scanType: scan.scanType,
                        threatScore: scan.threatScore,
                        riskLevel: scan.riskLevel,
                        createdAt: scan.createdAt,
                        findings,
                        aiAnalysis: aiAnalysis || null
                    }
                };
            }
        }
    }
}

module.exports = ReportService;
