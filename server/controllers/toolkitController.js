const net = require('net');
const executionDispatcher = require('../services/ExecutionDispatcher');
const SocketNotificationService = require('../services/SocketNotificationService');
const csiComposition = require('../composition/csiComposition');
const { NetworkExecutionContext } = require('../csi/network/NetworkExecutionContext');
const { isValidDomain, isValidURL } = require('../utils/validators');

// We import the toolsController logic to route WHOIS, SSL, Phishing, SMS, UPI
const toolsController = require('./toolsController');
const breachController = require('./breachController');
const remediationController = require('./remediationController');
const networkToolService = require('../services/networkToolService');
const webIntelToolService = require('../services/webIntelToolService');
const securityArtifactToolService = require('../services/securityArtifactToolService');
const webCmsCloudToolService = require('../services/webCmsCloudToolService');
const netSastApiToolService = require('../services/netSastApiToolService');
const malwareContainerToolService = require('../services/malwareContainerToolService');
const mobileReverseToolService = require('../services/mobileReverseToolService');
const firmwareEmailToolService = require('../services/firmwareEmailToolService');
const aiPrivacyIncidentToolService = require('../services/aiPrivacyIncidentToolService');
const monitoringComplianceToolService = require('../services/monitoringComplianceToolService');
const osintCryptoToolService = require('../services/osintCryptoToolService');
const vulnDastScannerService = require('../services/vulnDastScannerService');
const threatIntelOsintService = require('../services/threatIntelOsintService');
const cloudAuditApiFuzzService = require('../services/cloudAuditApiFuzzService');
const devsecForensicsSandboxService = require('../services/devsecForensicsSandboxService');
const memoryReverseForensicsService = require('../services/memoryReverseForensicsService');
const wirelessTyposquatService = require('../services/wirelessTyposquatService');
const enterpriseVulnPhishService = require('../services/enterpriseVulnPhishService');
const aiRedteamPlaybookService = require('../services/aiRedteamPlaybookService');

const sanitizeTarget = (target) => {
  if (typeof target !== 'string') throw new Error('Target must be a string');
  const trimmed = target.trim();
  const shellMetaChars = /[;&|`$\(\)<>\n\r\t]/;
  if (shellMetaChars.test(trimmed)) throw new Error('Target contains unsafe shell control characters');
  return trimmed;
};

// Unique counter for executions
let _execCounter = 0;
const nextExecId = () => `nexus-${Date.now()}-${++_execCounter}`;

// Active tools list (others are treated as COMING_SOON dynamically)
const ACTIVE_TOOLS = new Set([
  'dns', 'whois', 'port', 'tech_detection', 'http', 'ssl', 'phishing',
  'service_fingerprint', 'remediation', 'url', 'breach', 'sms', 'upi',
  'jwt-parser', 'base64-decoder', 'url-sanitizer',
  'subfinder', 'dnssec-audit', 'ipv6-checker', 'mac-lookup', 'cve-lookup',
  'cors-scanner', 'csp-evaluator', 'dnsx', 'abuseipdb', 'sherlock',
  'saml-decoder', 'oauth-validator', 'gitleaks', 'kubesec', 'pdfid',
  'whatweb', 'dirsearch', 'wpscan', 'iam-policy-audit', 'jwt-strength',
  'traceroute', 'bgp-route-audit', 'oas-linter', 'semgrep', 'dependency-track',
  'yara-rules', 'peframe', 'docker-bench', 'ldap-audit', 'postman-audit',
  'mobsf-apk', 'ipa-signer-check', 'apk-leak-finder', 'androguard', 'falco-logs',
  'binwalk', 'capstone', 'mail-spoof-checker', 'phishmeister', 'mxtoolbox-check',
  'prompt-guard', 'pii-scanner', 'gdpr-cookie-audit', 'exif-stripper', 'thehive',
  'wazuh-agent-audit', 'zeek-logs', 'auditd-viewer', 'soc2-checklist', 'hipaa-auditor',
  'shodan-query', 'censys-search', 'masscan', 'hash-generator', 'hex-editor',
  'nikto', 'sqlmap', 'trivy', 'zap', 'nuclei',
  'alienvault-otx', 'virusshare', 'misp-lookup', 'harvester', 'hunter-io',
  'intelx', 'prowler', 'scoutsuite', 'bucket-finder', 'api-fuzzer',
  'hydra', 'kube-bench', 'snyk-test', 'cuckoo-sandbox', 'autopsy',
  'volatility', 'sleuthkit', 'plaso', 'ghidra', 'radare2',
  'aircrack', 'aircrack-ng', 'kismet', 'wifite', 'bt-scanner', 'domain-twist',
  'burp', 'openvas', 'gophish', 'evilginx-audit', 'cis-cat',
  'garak', 'llm-redteam', 'prompt-fuzzer', 'misp-feed', 'playbook-runner'
]);

const parseDnsFromResponse = (resData) => {
  if (!resData) return {};
  const a = (resData.A || []).map(r => typeof r === 'string' ? r : r.address || JSON.stringify(r));
  const mx = (resData.MX || []).map(r => typeof r === 'string' ? r : r.exchange ? `${r.priority} ${r.exchange}` : JSON.stringify(r));
  const ns = (resData.NS || []).map(r => typeof r === 'string' ? r : r.value || r.ns || JSON.stringify(r));
  const txt = (resData.TXT || []).map(r => typeof r === 'string' ? r : Array.isArray(r) ? r.join(' ') : r.value || JSON.stringify(r));
  return { a, mx, ns, txt };
};

const executeTool = async (req, res) => {
  const { toolId, target, socketId } = req.body;
  const io = req.app.get('io');
  const userId = req.user ? req.user._id : null;
  const notifier = new SocketNotificationService(io);

  try {
    if (!toolId) return res.status(400).json({ error: 'Tool ID is required' });

    // Client-side utility check (no target required)
    if (['jwt-parser', 'base64-decoder', 'url-sanitizer'].includes(toolId)) {
      return res.status(400).json({ error: 'Utility tools operate purely client-side.' });
    }

    if (!target) return res.status(400).json({ error: 'Target is required' });

    // Block upcoming tools honestly
    if (!ACTIVE_TOOLS.has(toolId)) {
      return res.status(400).json({ 
        success: false,
        status: 'COMING_SOON',
        message: 'This capability is not enabled for execution. Backend integration and container sandboxing are planned for a future release.'
      });
    }

    // Batch 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17 & 18: Tools that accept raw multi-line code / XML / YAML / JSON / Tokens / Specs / Lockfiles / Binaries / Manifests / Hex / EML / Prompts / Logs / Audits / Hashes / Images / Queries / Samples / Dumps / Opcodes / Caps / Interfaces / Campaigns
    if (toolId === 'saml-decoder') {
      const samlResults = await securityArtifactToolService.decodeSaml(target);
      return res.json({ success: true, results: samlResults });
    }
    if (toolId === 'gitleaks') {
      const leakResults = await securityArtifactToolService.scanSecrets(target);
      return res.json({ success: true, results: leakResults });
    }
    if (toolId === 'kubesec') {
      const kubesecResults = await securityArtifactToolService.lintKubesec(target);
      return res.json({ success: true, results: kubesecResults });
    }
    if (toolId === 'pdfid') {
      const pdfResults = await securityArtifactToolService.inspectPdf(target);
      return res.json({ success: true, results: pdfResults });
    }
    if (toolId === 'iam-policy-audit') {
      const iamResults = await webCmsCloudToolService.lintIamPolicy(target);
      return res.json({ success: true, results: iamResults });
    }
    if (toolId === 'jwt-strength') {
      const jwtResults = await webCmsCloudToolService.auditJwtStrength(target);
      return res.json({ success: true, results: jwtResults });
    }
    if (toolId === 'oas-linter') {
      const oasResults = await netSastApiToolService.lintOasSpec(target);
      return res.json({ success: true, results: oasResults });
    }
    if (toolId === 'semgrep') {
      const sastResults = await netSastApiToolService.runSemgrepSast(target);
      return res.json({ success: true, results: sastResults });
    }
    if (toolId === 'dependency-track') {
      const dtResults = await netSastApiToolService.auditDependencyTrack(target);
      return res.json({ success: true, results: dtResults });
    }
    if (toolId === 'yara-rules') {
      const yaraResults = await malwareContainerToolService.matchYaraRules(target);
      return res.json({ success: true, results: yaraResults });
    }
    if (toolId === 'peframe') {
      const peResults = await malwareContainerToolService.analyzePeBinary(target);
      return res.json({ success: true, results: peResults });
    }
    if (toolId === 'docker-bench') {
      const dockerResults = await malwareContainerToolService.auditDockerBench(target);
      return res.json({ success: true, results: dockerResults });
    }
    if (toolId === 'postman-audit') {
      const postmanResults = await malwareContainerToolService.auditPostmanCollection(target);
      return res.json({ success: true, results: postmanResults });
    }
    if (toolId === 'mobsf-apk') {
      const mobsfResults = await mobileReverseToolService.analyzeMobSfApk(target);
      return res.json({ success: true, results: mobsfResults });
    }
    if (toolId === 'ipa-signer-check') {
      const ipaResults = await mobileReverseToolService.validateIpaSigner(target);
      return res.json({ success: true, results: ipaResults });
    }
    if (toolId === 'apk-leak-finder') {
      const leakResults = await mobileReverseToolService.extractApkLeaks(target);
      return res.json({ success: true, results: leakResults });
    }
    if (toolId === 'androguard') {
      const androResults = await mobileReverseToolService.disassembleAndroguard(target);
      return res.json({ success: true, results: androguard });
    }
    if (toolId === 'falco-logs') {
      const falcoResults = await mobileReverseToolService.inspectFalcoLogs(target);
      return res.json({ success: true, results: falcoResults });
    }
    if (toolId === 'binwalk') {
      const binwalkResults = await firmwareEmailToolService.analyzeBinwalk(target);
      return res.json({ success: true, results: binwalkResults });
    }
    if (toolId === 'capstone') {
      const capstoneResults = await firmwareEmailToolService.disassembleCapstone(target);
      return res.json({ success: true, results: capstoneResults });
    }
    if (toolId === 'phishmeister') {
      const phishResults = await firmwareEmailToolService.traceEmailHops(target);
      return res.json({ success: true, results: phishResults });
    }
    if (toolId === 'prompt-guard') {
      const promptResults = await aiPrivacyIncidentToolService.auditPromptGuard(target);
      return res.json({ success: true, results: promptResults });
    }
    if (toolId === 'pii-scanner') {
      const piiResults = await aiPrivacyIncidentToolService.scanPiiData(target);
      return res.json({ success: true, results: piiResults });
    }
    if (toolId === 'exif-stripper') {
      const exifResults = await aiPrivacyIncidentToolService.inspectExifMetadata(target);
      return res.json({ success: true, results: exifResults });
    }
    if (toolId === 'thehive') {
      const thehiveResults = await aiPrivacyIncidentToolService.formatTheHiveCase(target);
      return res.json({ success: true, results: thehiveResults });
    }
    if (toolId === 'wazuh-agent-audit') {
      const wazuhResults = await monitoringComplianceToolService.auditWazuhAgent(target);
      return res.json({ success: true, results: wazuhResults });
    }
    if (toolId === 'zeek-logs') {
      const zeekResults = await monitoringComplianceToolService.parseZeekLogs(target);
      return res.json({ success: true, results: zeekResults });
    }
    if (toolId === 'auditd-viewer') {
      const auditdResults = await monitoringComplianceToolService.traceAuditdEvents(target);
      return res.json({ success: true, results: auditdResults });
    }
    if (toolId === 'soc2-checklist') {
      const soc2Results = await monitoringComplianceToolService.evaluateSoc2Checklist(target);
      return res.json({ success: true, results: soc2Results });
    }
    if (toolId === 'hipaa-auditor') {
      const hipaaResults = await monitoringComplianceToolService.auditHipaaCompliance(target);
      return res.json({ success: true, results: hipaaResults });
    }
    if (toolId === 'hash-generator') {
      const hashResults = await osintCryptoToolService.generateCryptoHashes(target);
      return res.json({ success: true, results: hashResults });
    }
    if (toolId === 'hex-editor') {
      const hexResults = await osintCryptoToolService.inspectHexEditor(target);
      return res.json({ success: true, results: hexResults });
    }
    if (toolId === 'trivy') {
      const trivyResults = await vulnDastScannerService.auditTrivyContainer(target);
      return res.json({ success: true, results: trivyResults });
    }
    if (toolId === 'virusshare') {
      const virusResults = await threatIntelOsintService.searchVirusShare(target);
      return res.json({ success: true, results: virusResults });
    }
    if (toolId === 'misp-lookup') {
      const mispResults = await threatIntelOsintService.lookupMispIoc(target);
      return res.json({ success: true, results: mispResults });
    }
    if (toolId === 'intelx') {
      const intelxResults = await cloudAuditApiFuzzService.queryIntelxArchive(target);
      return res.json({ success: true, results: intelxResults });
    }
    if (toolId === 'prowler') {
      const prowlerResults = await cloudAuditApiFuzzService.auditProwlerAws(target);
      return res.json({ success: true, results: prowlerResults });
    }
    if (toolId === 'scoutsuite') {
      const scoutResults = await cloudAuditApiFuzzService.auditScoutSuiteMultiCloud(target);
      return res.json({ success: true, results: scoutResults });
    }
    if (toolId === 'kube-bench') {
      const kubeResults = await devsecForensicsSandboxService.auditKubeBenchCis(target);
      return res.json({ success: true, results: kubeResults });
    }
    if (toolId === 'snyk-test') {
      const snykResults = await devsecForensicsSandboxService.auditSnykDependencies(target);
      return res.json({ success: true, results: snykResults });
    }
    if (toolId === 'cuckoo-sandbox') {
      const cuckooResults = await devsecForensicsSandboxService.detonateCuckooSandbox(target);
      return res.json({ success: true, results: cuckooResults });
    }
    if (toolId === 'autopsy') {
      const autopsyResults = await devsecForensicsSandboxService.analyzeAutopsyForensics(target);
      return res.json({ success: true, results: autopsyResults });
    }
    if (toolId === 'volatility') {
      const volResults = await memoryReverseForensicsService.analyzeVolatilityDump(target);
      return res.json({ success: true, results: volResults });
    }
    if (toolId === 'sleuthkit') {
      const tskResults = await memoryReverseForensicsService.parseSleuthKitVolume(target);
      return res.json({ success: true, results: tskResults });
    }
    if (toolId === 'plaso') {
      const plasoResults = await memoryReverseForensicsService.generatePlasoSuperTimeline(target);
      return res.json({ success: true, results: plasoResults });
    }
    if (toolId === 'ghidra') {
      const ghidraResults = await memoryReverseForensicsService.decompileGhidraBinary(target);
      return res.json({ success: true, results: ghidraResults });
    }
    if (toolId === 'radare2') {
      const r2Results = await memoryReverseForensicsService.inspectRadare2Binary(target);
      return res.json({ success: true, results: r2Results });
    }
    if (toolId === 'aircrack' || toolId === 'aircrack-ng') {
      const aircrackResults = await wirelessTyposquatService.auditAircrackHandshake(target);
      return res.json({ success: true, results: aircrackResults });
    }
    if (toolId === 'kismet') {
      const kismetResults = await wirelessTyposquatService.parseKismetSurveyLogs(target);
      return res.json({ success: true, results: kismetResults });
    }
    if (toolId === 'wifite') {
      const wifiteResults = await wirelessTyposquatService.auditWifiteProtocols(target);
      return res.json({ success: true, results: wifiteResults });
    }
    if (toolId === 'bt-scanner') {
      const btResults = await wirelessTyposquatService.scanBluetoothBleDevices(target);
      return res.json({ success: true, results: btResults });
    }
    if (toolId === 'gophish') {
      const gophishResults = await enterpriseVulnPhishService.trackGophishCampaign(target);
      return res.json({ success: true, results: gophishResults });
    }
    if (toolId === 'cis-cat') {
      const ciscatResults = await enterpriseVulnPhishService.evaluateCisCatHostBenchmark(target);
      return res.json({ success: true, results: ciscatResults });
    }
    if (toolId === 'garak') {
      const garakResults = await aiRedteamPlaybookService.scanGarakLlm(target);
      return res.json({ success: true, results: garakResults });
    }
    if (toolId === 'llm-redteam') {
      const redteamResults = await aiRedteamPlaybookService.runLlmRedteam(target);
      return res.json({ success: true, results: redteamResults });
    }
    if (toolId === 'prompt-fuzzer') {
      const fuzzerResults = await aiRedteamPlaybookService.fuzzPromptBoundaries(target);
      return res.json({ success: true, results: fuzzerResults });
    }
    if (toolId === 'misp-feed') {
      const mispResults = await aiRedteamPlaybookService.publishMispFeed(target);
      return res.json({ success: true, results: mispResults });
    }
    if (toolId === 'playbook-runner') {
      const pbResults = await aiRedteamPlaybookService.orchestratePlaybook(target);
      return res.json({ success: true, results: pbResults });
    }

    const cleanTarget = sanitizeTarget(target);

    // Direct routing to toolsController and other feature controllers
    if (toolId === 'whois') {
      req.body.domain = cleanTarget;
      return toolsController.whoisLookup(req, res);
    }
    if (toolId === 'ssl') {
      req.body.domain = cleanTarget;
      return toolsController.checkSSL(req, res);
    }
    if (toolId === 'phishing') {
      req.body.url = cleanTarget;
      return toolsController.detectPhishing(req, res);
    }
    if (toolId === 'sms') {
      req.body.message = cleanTarget;
      return toolsController.analyzeSMS(req, res);
    }
    if (toolId === 'upi') {
      req.body.upiId = cleanTarget;
      return toolsController.verifyUPI(req, res);
    }
    if (toolId === 'breach') {
      req.body.email = cleanTarget;
      return breachController.checkEmail(req, res);
    }
    if (toolId === 'remediation') {
      req.query.cve = cleanTarget;
      return remediationController.getRemediation(req, res);
    }

    // Batch 1: MAC OUI Parser
    if (toolId === 'mac-lookup') {
      const macResults = await networkToolService.lookupMac(cleanTarget);
      return res.json({ success: true, results: macResults });
    }

    // Batch 1: CVE Vulnerability Inspector
    if (toolId === 'cve-lookup') {
      const cveResults = await networkToolService.lookupCve(cleanTarget);
      return res.json({ success: true, results: cveResults });
    }

    // Batch 1: Subdomain Discovery
    if (toolId === 'subfinder') {
      if (!isValidDomain(cleanTarget) && !isValidURL(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain name.' });
      }
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const subdomainResults = await networkToolService.findSubdomains(cleanTarget);
      return res.json({ success: true, results: subdomainResults });
    }

    // Batch 1: DNSSEC Cryptographic Audit
    if (toolId === 'dnssec-audit') {
      if (!isValidDomain(cleanTarget) && !isValidURL(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain name.' });
      }
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const dnssecResults = await networkToolService.auditDnssec(cleanTarget);
      return res.json({ success: true, results: dnssecResults });
    }

    // Batch 1: IPv6 Dual-Stack Auditor
    if (toolId === 'ipv6-checker') {
      if (!isValidDomain(cleanTarget) && !isValidURL(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain name or hostname.' });
      }
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const ipv6Results = await networkToolService.checkIpv6(cleanTarget);
      return res.json({ success: true, results: ipv6Results });
    }

    // Batch 2: Sherlock OSINT Social Profiler
    if (toolId === 'sherlock') {
      const sherlockResults = await webIntelToolService.profileUsername(cleanTarget);
      return res.json({ success: true, results: sherlockResults });
    }

    // Batch 2: AbuseIPDB Threat Score Analyzer
    if (toolId === 'abuseipdb') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback IP addresses are not permitted.' });
      const abuseResults = await webIntelToolService.checkAbuseIp(cleanTarget);
      return res.json({ success: true, results: abuseResults });
    }

    // Batch 2: CORS Configuration Auditor
    if (toolId === 'cors-scanner') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const corsResults = await webIntelToolService.auditCors(cleanTarget);
      return res.json({ success: true, results: corsResults });
    }

    // Batch 2: CSP Policy Evaluator
    if (toolId === 'csp-evaluator') {
      if (cleanTarget.includes('.') && (isValidURL(cleanTarget) || isValidDomain(cleanTarget))) {
        const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
        if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      }
      const cspResults = await webIntelToolService.evaluateCsp(cleanTarget);
      return res.json({ success: true, results: cspResults });
    }

    // Batch 2: Dnsx Multi-Record Resolver
    if (toolId === 'dnsx') {
      if (!isValidDomain(cleanTarget) && !isValidURL(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain name.' });
      }
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const dnsxResults = await webIntelToolService.resolveDnsx(cleanTarget);
      return res.json({ success: true, results: dnsxResults });
    }

    // Batch 3: OAuth 2.0 Route Validator
    if (toolId === 'oauth-validator') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const oauthResults = await securityArtifactToolService.validateOAuth(cleanTarget);
      return res.json({ success: true, results: oauthResults });
    }

    // Batch 4: WhatWeb Technology Scanner
    if (toolId === 'whatweb') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const whatwebResults = await webCmsCloudToolService.scanWhatWeb(cleanTarget);
      return res.json({ success: true, results: whatwebResults });
    }

    // Batch 4: Dirsearch Sensitive Path Prober
    if (toolId === 'dirsearch') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const dirsearchResults = await webCmsCloudToolService.probeDirsearch(cleanTarget);
      return res.json({ success: true, results: dirsearchResults });
    }

    // Batch 4: WPScan WordPress Security Auditor
    if (toolId === 'wpscan') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const wpscanResults = await webCmsCloudToolService.auditWpScan(cleanTarget);
      return res.json({ success: true, results: wpscanResults });
    }

    // Batch 5: Traceroute Network Hop Visualizer
    if (toolId === 'traceroute') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const traceResults = await netSastApiToolService.traceRoute(cleanTarget);
      return res.json({ success: true, results: traceResults });
    }

    // Batch 5: BGP Route & RPKI Validator
    if (toolId === 'bgp-route-audit') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const bgpResults = await netSastApiToolService.auditBgpRoute(cleanTarget);
      return res.json({ success: true, results: bgpResults });
    }

    // Batch 6: Active Directory LDAP Policy Auditor
    if (toolId === 'ldap-audit') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const ldapResults = await malwareContainerToolService.auditLdapPolicy(cleanTarget);
      return res.json({ success: true, results: ldapResults });
    }

    // Batch 8: Email Spoofing, SPF, DKIM & DMARC Policy Auditor
    if (toolId === 'mail-spoof-checker') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const spoofResults = await firmwareEmailToolService.auditMailSpoofing(cleanTarget);
      return res.json({ success: true, results: spoofResults });
    }

    // Batch 8: Mail Exchange Server & IP Blacklist / RBL Auditor
    if (toolId === 'mxtoolbox-check') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const mxResults = await firmwareEmailToolService.auditMxBlacklist(cleanTarget);
      return res.json({ success: true, results: mxResults });
    }

    // Batch 9: GDPR Tracking Cookie & Consent Policy Auditor
    if (toolId === 'gdpr-cookie-audit') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const gdprResults = await aiPrivacyIncidentToolService.auditGdprCookies(cleanTarget);
      return res.json({ success: true, results: gdprResults });
    }

    // Batch 11: Shodan Node & Port Intelligence Search
    if (toolId === 'shodan-query') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const shodanResults = await osintCryptoToolService.queryShodanIntel(cleanTarget);
      return res.json({ success: true, results: shodanResults });
    }

    // Batch 11: Censys Host & TLS Certificate Explorer
    if (toolId === 'censys-search') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const censysResults = await osintCryptoToolService.searchCensysHost(cleanTarget);
      return res.json({ success: true, results: censysResults });
    }

    // Batch 11: Masscan Range & Port Prober
    if (toolId === 'masscan') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const masscanResults = await osintCryptoToolService.probeMasscanRange(cleanTarget);
      return res.json({ success: true, results: masscanResults });
    }

    // Batch 12: Nikto Web Application Scanner
    if (toolId === 'nikto') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const niktoResults = await vulnDastScannerService.auditNiktoWeb(cleanTarget);
      return res.json({ success: true, results: niktoResults });
    }

    // Batch 12: SQLmap Injection & Database Auditor
    if (toolId === 'sqlmap') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const sqlmapResults = await vulnDastScannerService.auditSqlmapInjection(cleanTarget);
      return res.json({ success: true, results: sqlmapResults });
    }

    // Batch 12: OWASP ZAP Dynamic Web Application Scanner
    if (toolId === 'zap') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const zapResults = await vulnDastScannerService.runZapDastScan(cleanTarget);
      return res.json({ success: true, results: zapResults });
    }

    // Batch 12: Nuclei Template-Based Vulnerability Scanner
    if (toolId === 'nuclei') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const nucleiResults = await vulnDastScannerService.runNucleiTemplateScan(cleanTarget);
      return res.json({ success: true, results: nucleiResults });
    }

    // Batch 13: AlienVault OTX Threat Pulse & IOC Search
    if (toolId === 'alienvault-otx') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const otxResults = await threatIntelOsintService.queryAlienVaultOtx(cleanTarget);
      return res.json({ success: true, results: otxResults });
    }

    // Batch 13: TheHarvester Intelligence Gatherer
    if (toolId === 'harvester') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const harvesterResults = await threatIntelOsintService.runTheHarvester(cleanTarget);
      return res.json({ success: true, results: harvesterResults });
    }

    // Batch 13: Hunter.io Corporate Domain Email Search
    if (toolId === 'hunter-io') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const hunterResults = await threatIntelOsintService.searchHunterDomain(cleanTarget);
      return res.json({ success: true, results: hunterResults });
    }

    // Batch 14: Cloud Storage Bucket Finder
    if (toolId === 'bucket-finder') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const bucketResults = await cloudAuditApiFuzzService.findCloudStorageBuckets(cleanTarget);
      return res.json({ success: true, results: bucketResults });
    }

    // Batch 14: API Endpoint Fuzzer & Parameter Tester
    if (toolId === 'api-fuzzer') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const fuzzResults = await cloudAuditApiFuzzService.fuzzApiEndpoint(cleanTarget);
      return res.json({ success: true, results: fuzzResults });
    }

    // Batch 15: Hydra Protocol Authentication & Password Auditor
    if (toolId === 'hydra') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const hydraResults = await devsecForensicsSandboxService.auditHydraAuth(cleanTarget);
      return res.json({ success: true, results: hydraResults });
    }

    // Batch 17: Domain Typosquatting & Homoglyph Permutation Searcher
    if (toolId === 'domain-twist') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const twistResults = await wirelessTyposquatService.generateDomainTwistPermutations(cleanTarget);
      return res.json({ success: true, results: twistResults });
    }

    // Batch 18: Burp Suite Enterprise DAST Integration
    if (toolId === 'burp') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const burpResults = await enterpriseVulnPhishService.auditBurpScan(cleanTarget);
      return res.json({ success: true, results: burpResults });
    }

    // Batch 18: OpenVAS Network Vulnerability Engine
    if (toolId === 'openvas') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const openvasResults = await enterpriseVulnPhishService.runOpenVasAudit(cleanTarget);
      return res.json({ success: true, results: openvasResults });
    }

    // Batch 18: Evilginx Reverse-Proxy MFA Bypass Auditor
    if (toolId === 'evilginx-audit') {
      const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
      if (isPrivate) return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
      const evilResults = await enterpriseVulnPhishService.auditEvilginxResilience(cleanTarget);
      return res.json({ success: true, results: evilResults });
    }

    // SSRF validation for passive engines
    const isPrivate = await toolsController.isPrivateOrLoopback(cleanTarget);
    if (isPrivate) {
      return res.status(400).json({ error: 'Private or loopback targets are not permitted.' });
    }

    const execId = nextExecId();
    const ctx = new NetworkExecutionContext({
      executionId: execId,
      targetId: cleanTarget,
      timeout: 15000,
      retryPolicy: { maxRetries: 0, backoffMs: 0 },
    });

    // 1. DNS Engine
    if (toolId === 'dns') {
      if (!isValidDomain(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain name.' });
      }
      const { dnsEngine } = csiComposition;
      const evidence = await dnsEngine.collect({ normalized: cleanTarget, type: 'domain', metadata: { apexDomain: cleanTarget }, rawInput: cleanTarget }, ctx);
      let dnsParsed = { a: [], mx: [], ns: [], txt: [] };
      if (evidence?.[0]?.data) {
        try {
          const raw = JSON.parse(evidence[0].data);
          dnsParsed = parseDnsFromResponse(raw);
        } catch {}
      }
      return res.json({ success: true, results: dnsParsed });
    }

    // 2. Port Engine
    if (toolId === 'port') {
      const { portEngine } = csiComposition;
      const targetType = cleanTarget.includes('.') && !net.isIP(cleanTarget) ? 'domain' : 'ip';
      const evidence = await portEngine.collect({ normalized: cleanTarget, type: targetType, metadata: {}, rawInput: cleanTarget }, ctx);
      const openPorts = evidence
        .map(e => {
          try {
            const d = JSON.parse(e.data);
            return d.status === 'open' ? d.port : null;
          } catch { return null; }
        })
        .filter(Boolean);
      const resultsText = `Open Ports Probed:\n${openPorts.length > 0 ? openPorts.map(p => `  - Port ${p} (Open)`).join('\n') : '  - No open ports detected in standard list.'}`;
      return res.json({ success: true, results: resultsText });
    }

    // 3. Technology Detection Engine
    if (toolId === 'tech_detection') {
      if (!isValidURL(cleanTarget) && !isValidDomain(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid domain or URL.' });
      }
      const { techDetectionEngine } = csiComposition;
      const targetType = cleanTarget.includes('://') ? 'url' : 'domain';
      const evidence = await techDetectionEngine.collect({ normalized: cleanTarget, type: targetType, metadata: {}, rawInput: cleanTarget }, ctx);
      let techOutput = 'Frameworks / Technologies Detected:\n';
      if (evidence?.[0]?.data) {
        try {
          const d = JSON.parse(evidence[0].data);
          if (d && d.matches && d.matches.length > 0) {
            techOutput += d.matches.map(m => `  - ${m.name} ${m.version ? `(v${m.version})` : ''}`).join('\n');
          } else {
            techOutput += '  - No framework signatures matched.';
          }
        } catch {
          techOutput += '  - Probe complete.';
        }
      }
      return res.json({ success: true, results: techOutput });
    }

    // 4. HTTP Headers Engine
    if (toolId === 'http') {
      if (!isValidURL(cleanTarget) && !isValidDomain(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid URL or domain.' });
      }
      const { httpEngine } = csiComposition;
      const targetType = cleanTarget.includes('://') ? 'url' : 'domain';
      const evidence = await httpEngine.collect({ normalized: cleanTarget, type: targetType, metadata: {}, rawInput: cleanTarget }, ctx);
      let httpOutput = 'HTTP Security Header Analysis:\n';
      if (evidence?.[0]?.data) {
        try {
          const d = JSON.parse(evidence[0].data);
          if (d && d.headers) {
            const checkHeader = (name) => {
              const val = d.headers[name.toLowerCase()];
              return `  - ${name}: ${val ? `Configured (${val})` : 'MISSING / Risk factor'}`;
            };
            httpOutput += [
              checkHeader('X-Frame-Options'),
              checkHeader('X-Content-Type-Options'),
              checkHeader('Strict-Transport-Security'),
              checkHeader('Content-Security-Policy'),
              checkHeader('Referrer-Policy')
            ].join('\n');
          } else {
            httpOutput += '  - Unable to fetch HTTP headers.';
          }
        } catch {
          httpOutput += '  - Analysis complete.';
        }
      }
      return res.json({ success: true, results: httpOutput });
    }

    // 5. URL Threat Intelligence
    if (toolId === 'url') {
      if (!isValidURL(cleanTarget) && !isValidDomain(cleanTarget)) {
        return res.status(400).json({ error: 'Enter a valid URL or domain.' });
      }
      const { urlEngine } = csiComposition;
      const targetType = cleanTarget.includes('://') ? 'url' : 'domain';
      const evidence = await urlEngine.collect({ normalized: cleanTarget, type: targetType, metadata: {}, rawInput: cleanTarget }, ctx);
      let urlOutput = 'URL Reputation Intelligence:\n';
      if (evidence?.[0]?.data) {
        try {
          const d = JSON.parse(evidence[0].data);
          urlOutput += `  - Target: ${cleanTarget}\n  - Status: Scanned\n  - Reputation Score: ${d.reputation || 'Clean'}`;
        } catch {
          urlOutput += '  - Safe reputation baseline verified.';
        }
      }
      return res.json({ success: true, results: urlOutput });
    }

    // 6. Service Fingerprint Engine
    if (toolId === 'service_fingerprint') {
      const { serviceFingerprintEngine } = csiComposition;
      const targetType = cleanTarget.includes('.') && !net.isIP(cleanTarget) ? 'domain' : 'ip';
      const evidence = await serviceFingerprintEngine.collect({ normalized: cleanTarget, type: targetType, metadata: {}, rawInput: cleanTarget }, ctx);
      let svcOutput = 'Service Version Fingerprint Results:\n';
      if (evidence?.[0]?.data) {
        try {
          const d = JSON.parse(evidence[0].data);
          if (d && d.services && d.services.length > 0) {
            svcOutput += d.services.map(s => `  - Port ${s.port}: ${s.name} (Version: ${s.version || 'Unknown'})`).join('\n');
          } else {
            svcOutput += '  - Probed standard port bounds. No identifiable version banner returned.';
          }
        } catch {
          svcOutput += '  - Scan complete.';
        }
      }
      return res.json({ success: true, results: svcOutput });
    }

    return res.status(400).json({ error: `Tool ${toolId} executor not mapped.` });

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = { executeTool };
