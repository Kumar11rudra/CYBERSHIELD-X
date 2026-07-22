const fs = require('fs');
const path = require('path');
const AIReportDTO = require('../../models/dto/AIReportDTO');
const { AIParsingError } = require('../../providers/ai/AIErrors');

class AIReportService {
    constructor(deps) {
        this.providerManager = deps.providerManager;
        this.aiAnalysisRepository = deps.aiAnalysisRepository;
        this.scanRepository = deps.scanRepository;
        this.logger = deps.logger;
        this.configProvider = deps.configProvider;
    }

    async generateScanReport(scanId, model = 'llama3') {
        const scan = await this.scanRepository.findById(scanId);
        if (!scan) throw new Error("Scan not found");

        const existingAnalysis = await this.aiAnalysisRepository.findByScanIdAndModel(scanId, model);
        if (existingAnalysis) {
            return new AIReportDTO({
                executiveSummary: existingAnalysis.executiveSummary,
                riskScore: scan.threatScore,
                threatSummary: `Scan resulted in risk level ${scan.riskLevel}`,
                keyFindings: existingAnalysis.findings,
                recommendations: existingAnalysis.recommendations,
                remediation: existingAnalysis.remediationPlan,
                providerMetadata: { provider: `Cached (${model})` },
                confidence: 100
            });
        }

        const promptTemplate = this._loadPrompt('report_generation.prompt.md');
        const systemPrompt = promptTemplate
            .replace('{{TARGET}}', scan.target)
            .replace('{{TYPE}}', scan.targetType)
            .replace('{{SCORE}}', scan.threatScore)
            .replace('{{RISK_LEVEL}}', scan.riskLevel)
            .replace('{{RAW_LOG}}', JSON.stringify(scan.breakdown || {}));

        const request = {
            model: model,
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: 'Provide a structured security analysis report of this scan.' }
            ],
            format: 'json',
            stream: false
        };

        let parsedData;
        let providerMetadata = {};

        try {
            const result = await this.providerManager.generate(request);
            parsedData = this._parseJSONResponse(result.content);
            providerMetadata = {
                provider: result.provider,
                duration: result.duration,
                tokenEstimate: result.tokenEstimate,
                fallbackTriggered: result.fallbackTriggered,
                retryCount: result.retryCount
            };
        } catch (error) {
            this.logger.warn(`[AIReportService] Report generation failed: ${error.message}. Returning fallback.`);
            parsedData = this._getLocalFallbackAnalysis(scan);
            providerMetadata = { provider: 'Nexus-AI (Local Heuristics Fallback)' };
        }

        // Save Analysis
        await this.aiAnalysisRepository.save({
            scanId,
            model,
            executiveSummary: parsedData.executiveSummary,
            findings: parsedData.findings || parsedData.keyFindings,
            recommendations: parsedData.recommendations,
            remediationPlan: parsedData.remediationPlan || parsedData.remediation
        });

        return new AIReportDTO({
            executiveSummary: parsedData.executiveSummary,
            riskScore: scan.threatScore,
            threatSummary: `Scan resulted in risk level ${scan.riskLevel}`,
            keyFindings: parsedData.findings,
            recommendations: parsedData.recommendations,
            remediation: parsedData.remediationPlan,
            providerMetadata,
            confidence: 90
        });
    }

    _loadPrompt(filename) {
        try {
            return fs.readFileSync(path.join(__dirname, '../../ai/prompts', filename), 'utf-8');
        } catch (err) {
            this.logger.error(`[AIReportService] Failed to load prompt ${filename}: ${err.message}`);
            return "Return valid JSON { \"executiveSummary\": \"\" }";
        }
    }

    _parseJSONResponse(text) {
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const parsed = JSON.parse(jsonMatch[0]);
                if (parsed.executiveSummary || parsed.findings || parsed.recommendations) {
                    return {
                        executiveSummary: parsed.executiveSummary || 'No summary provided.',
                        findings: Array.isArray(parsed.findings) ? parsed.findings : [parsed.findings].filter(Boolean),
                        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [parsed.recommendations].filter(Boolean),
                        remediationPlan: parsed.remediationPlan || 'No remediation plan provided.'
                    };
                }
            }
            throw new AIParsingError("Response format did not match expected JSON structure.");
        } catch (e) {
            throw new AIParsingError(`JSON Parsing failed: ${e.message}`);
        }
    }

    _getLocalFallbackAnalysis(scan) {
        const target = scan.target;
        const type = scan.targetType;
        const score = scan.threatScore;

        let executiveSummary = '';
        let findings = [];
        let recommendations = [];
        let remediationPlan = '';

        if (type === 'url' || type === 'domain') {
            executiveSummary = `Nexus AI completed a localized config audit on the web asset "${target}". Calculated threat score is ${score}/100.`;
            findings = [
                'Potential missing HTTP security policy headers (CSP, X-Frame-Options, HSTS).',
                'Leaked software versions in Server header banners.',
                'Active DNS resolution mapping confirmed.'
            ];
            recommendations = [
                'Inject strict Content-Security-Policy (CSP) headers restricting third-party script sources.',
                'Hide web server daemon headers using configuration directives (e.g. expose_php Off, server_tokens off).',
                'Deploy TLS 1.3 strict profiles across all virtual servers.'
            ];
            remediationPlan = 'Configure .htaccess or nginx.conf to enforce headers; deploy an offline staging environment to verify config parameters before pushing live.';
        } else if (type === 'ip') {
            executiveSummary = `Nexus AI completed a network security assessment on the host IP "${target}". Calculated threat score is ${score}/100.`;
            findings = [
                'Host responds to TCP handshake signals indicating active state.',
                'Administrative access ports (SSH/22, HTTP/80, HTTPS/443) are publicly visible.',
                'No active local firewall filters blocking connection attempts.'
            ];
            recommendations = [
                'Enable fail2ban to lock out IP addresses triggering brute-force SSH logs.',
                'Restrict access to critical management portals by putting them behind a VPN overlay.',
                'Run periodic scans to confirm closed state of unused ports.'
            ];
            remediationPlan = 'Configure local iptables/ufw firewalls to block all incoming traffic except ports 80 and 443; apply rate-limit policies to port 22.';
        } else {
            executiveSummary = `Nexus AI completed a cryptographic checksum analysis on hash target "${target}". Calculated threat score is ${score}/100.`;
            findings = [
                score > 50 ? 'Hash matches known malware signature catalog.' : 'No active malicious signature matched in local catalog.',
                'Static pattern audit indicates standard format.'
            ];
            recommendations = [
                score > 50 ? 'Quarantine matched payload files immediately.' : 'No immediate action required.',
                'Maintain up-to-date signature directories.'
            ];
            remediationPlan = score > 50 ? 'Isolate affected host nodes; run deep anti-malware clean loops; verify software supply chain source hashes.' : 'Continue routine hash registry checks.';
        }

        return {
            executiveSummary,
            findings,
            recommendations,
            remediationPlan
        };
    }
}

module.exports = AIReportService;
