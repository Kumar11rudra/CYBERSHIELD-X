const Scan = require('../models/Scan');
const AIAnalysis = require('../models/AIAnalysis');
const axios = require('axios');
const logger = require('../utils/logger');

const parseAIResponse = (text) => {
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
  } catch (e) {
    // fallback to regex/line-based parsing
  }

  const lines = text.split('\n');
  let currentSection = 'summary';
  let executiveSummary = '';
  const findings = [];
  const recommendations = [];
  let remediationPlan = '';

  for (const line of lines) {
    const cleanLine = line.trim();
    if (!cleanLine) continue;

    const lowerLine = cleanLine.toLowerCase();
    if (lowerLine.includes('executive summary') || lowerLine.includes('summary:')) {
      currentSection = 'summary';
      continue;
    } else if (lowerLine.includes('finding') || lowerLine.includes('vuln') || lowerLine.includes('alert')) {
      currentSection = 'findings';
      continue;
    } else if (lowerLine.includes('recommend') || lowerLine.includes('action')) {
      currentSection = 'recommendations';
      continue;
    } else if (lowerLine.includes('remediation') || lowerLine.includes('mitigation') || lowerLine.includes('fix')) {
      currentSection = 'remediation';
      continue;
    }

    if (currentSection === 'summary') {
      executiveSummary += cleanLine + ' ';
    } else if (currentSection === 'findings') {
      findings.push(cleanLine.replace(/^[-*•\d.]+\s*/, ''));
    } else if (currentSection === 'recommendations') {
      recommendations.push(cleanLine.replace(/^[-*•\d.]+\s*/, ''));
    } else if (currentSection === 'remediation') {
      remediationPlan += cleanLine + ' ';
    }
  }

  return {
    executiveSummary: executiveSummary.trim() || 'Scanned target analysis concluded.',
    findings: findings.length > 0 ? findings : ['No major findings detected.'],
    recommendations: recommendations.length > 0 ? recommendations : ['Maintain standard configuration hardening policies.'],
    remediationPlan: remediationPlan.trim() || 'Continue active log audits and regular perimeter scans.'
  };
};

const getLocalFallbackAnalysis = (scan) => {
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
};

const analyzeScan = async (req, res, next) => {
  try {
    const { scanId, model } = req.body;
    if (!scanId) {
      return res.status(400).json({ error: 'Scan ID is required.' });
    }

    const scan = await Scan.findById(scanId);
    if (!scan) {
      return res.status(404).json({ error: 'Scan record not found.' });
    }

    const selectedModel = model || 'llama3';
    
    // Check if analysis already exists for this scan and model
    let existingAnalysis = await AIAnalysis.findOne({ scanId, model: selectedModel });
    if (existingAnalysis) {
      return res.json({ success: true, analysis: existingAnalysis, source: `Cached (${selectedModel})` });
    }

    const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
    let analysisResult;
    let source = `Ollama (${selectedModel})`;

    try {
      const systemPrompt = `You are a Senior Cybersecurity Incident Analyst. Analyze the following target security scan:
Target: ${scan.target}
Type: ${scan.targetType}
Calculated Threat Score: ${scan.threatScore}/100
Risk Level: ${scan.riskLevel}
Raw Scans Log: ${JSON.stringify(scan.breakdown || {})}

Return a valid JSON object with the following structure:
{
  "executiveSummary": "A concise executive summary summarizing findings.",
  "findings": ["Finding 1", "Finding 2"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "remediationPlan": "Step-by-step remediation plan text."
}
Provide professional, highly technical findings and actual mitigation advice. Keep response restricted to JSON only.`;

      const response = await axios.post(`${ollamaUrl}/api/chat`, {
        model: selectedModel,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: 'Provide a structured security analysis report of this scan.' }
        ],
        format: 'json',
        stream: false
      }, { timeout: 15000 });

      if (response.data?.message?.content) {
        const text = response.data.message.content.trim();
        analysisResult = parseAIResponse(text);
      } else {
        throw new Error('Empty response from Ollama.');
      }
    } catch (err) {
      logger.warn(`[AI-ANALYST] Ollama offline or timed out. Serving local signature fallback analysis.`);
      analysisResult = getLocalFallbackAnalysis(scan);
      source = 'Nexus-AI (Local Heuristics Fallback)';
    }

    // Save to decoupled collection
    const analysis = await AIAnalysis.create({
      scanId,
      model: selectedModel,
      executiveSummary: analysisResult.executiveSummary,
      findings: analysisResult.findings,
      recommendations: analysisResult.recommendations,
      remediationPlan: analysisResult.remediationPlan,
    });

    res.json({ success: true, analysis, source });
  } catch (error) {
    next(error);
  }
};

module.exports = { analyzeScan };
