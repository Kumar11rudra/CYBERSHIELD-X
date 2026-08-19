const { GoogleGenerativeAI } = require('@google/generative-ai');

// Built-in intelligent conversational & platform knowledge engine
const FALLBACK_KNOWLEDGE = [
  {
    triggers: ['hi', 'hello', 'hey', 'namaste', 'greetings', 'sup', 'good morning', 'good afternoon', 'good evening', 'how are you', 'kaise ho', 'kya haal', 'kese ho'],
    response: "Hello! I am CyberBot, your AI Cybersecurity Assistant for CyberShield X. I'm doing great and ready to help! How can I assist you with security audits, threat scans, or exploring our 110 cybersecurity tools today?"
  },
  {
    triggers: ['who are you', 'what are you', 'what is this', 'about cybershield', 'what is cybershield', 'introduce yourself', 'kya hai', 'help me', 'what can you do'],
    response: "**CyberShield X** is a next-generation enterprise cybersecurity intelligence platform featuring:\n- **110 Live Security Tools** across 24 specialized categories.\n- **Interactive CyberSOC Terminal** with CLI command execution and natural language intent parsing.\n- **7 Multi-Vector Automated Playbooks** (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming).\n- **Enterprise Dossier Exporters** (OASIS SARIF v2.1.0, OASIS STIX 2.1 Threat Objects, CSV, JSON, Markdown, PDF).\n\nHow can I assist your security team today?"
  },
  {
    triggers: ['tools', 'what tools', 'catalog', 'list tools', 'categories', 'all tools'],
    response: "CyberShield X features **110 live security tools** across 24 categories:\n1. **Reconnaissance & OSINT** (Subfinder, Shodan, Censys, theHarvester, Dirsearch, Sherlock)\n2. **Web & DAST Security** (SQLMap, Nikto, Burp Suite, WPScan, OWASP ZAP, CORS/CSP)\n3. **Network & Wireless** (Nmap, Aircrack-ng, Kismet, Wifite, Wireshark, Traceroute)\n4. **Cloud & DevSecOps** (Prowler AWS CIS, Kube-Bench, Snyk, Gitleaks, Docker Bench, Semgrep)\n5. **Malware & Forensics** (YARA, PEframe, Volatility, Ghidra, Radare2, Autopsy, VirusShare)\n6. **AI Security & Red-Teaming** (Garak LLM Scanner, Adversarial Redteam, Prompt Fuzzer, Prompt Guard)\n7. **Identity & Phishing** (Dark Web Breach Checker, Phishing Analyzer, Email SPF/DMARC, SMS Fraud)\n\nYou can access every tool in the **Tools Hub** (`/toolkit`) or run CLI commands directly in the **CyberSOC Terminal**."
  },
  {
    triggers: ['playbook', 'playbooks', 'automated', 'chain', 'chained'],
    response: "We offer **7 Multi-Vector Automated SOC Playbooks** in our CyberSOC Terminal:\n1. 🌐 **Perimeter Reconnaissance**: DNS -> Ports -> SSL -> Headers -> Threat Feeds\n2. 🛡️ **Web Application DAST**: Tech Stack -> Nikto -> CORS -> CSP -> SQLMap\n3. 🔑 **API Security & Cryptography**: OpenAPI Linter -> JWT Entropy -> API Fuzzer -> Postman -> IAM\n4. ☁️ **Cloud Posture & DevSecOps**: Prowler AWS CIS -> Kube-Bench -> Snyk -> Gitleaks -> Docker Bench\n5. 🔬 **Threat & Memory Forensics**: VirusShare -> YARA -> PEframe -> Volatility -> MISP\n6. 🎣 **Phishing & Identity Defense**: Phishing Analyzer -> Evilginx -> Email SPF/DMARC -> Breach Check\n7. 🤖 **AI Red-Teaming**: Garak Probes -> Prompt Fuzzer -> GCG Redteam -> PII Guard -> AI Remediation\n\nOpen the **Terminal** (`/toolkit` -> Cyber Terminal) to launch any playbook with 1 click!"
  },
  {
    triggers: ['export', 'sarif', 'stix', 'pdf', 'csv', 'report', 'download dossier'],
    response: "You can export comprehensive security audit dossiers directly from any Scan Details page (`/scan/:id`):\n- 🛡️ **OASIS SARIF v2.1.0**: For GitHub Code Scanning & GitLab CI/CD pipelines.\n- ⚡ **OASIS STIX 2.1**: For SIEM, SOAR, OpenCTI, and MISP threat sharing.\n- 📊 **CSV**: Tabular spreadsheets with all findings and severity ratings.\n- **{ } JSON**: Raw structured audit payload.\n- 📄 **Browser & Server PDF**: Publication-ready executive audit reports."
  },
  {
    triggers: ['subdomain', 'subfinder'],
    response: "To map subdomains, use **Subfinder** or our **DNS Recon Engine** in the Tools Hub (`/toolkit`). You can also execute `subfinder -d example.com` in the interactive CyberSOC terminal."
  },
  {
    triggers: ['nmap', 'port', 'open socket', 'port scan'],
    response: "Our **Nmap Port Scanner** probes target TCP/UDP sockets to identify open ports, service banners, and daemon versions. Run it in `/toolkit` or type `nmap -sV target.com` in the terminal."
  },
  {
    triggers: ['ssl', 'cert', 'tls', 'certificate'],
    response: "You can audit SSL/TLS certificates with our **SSL Certificate Audit** tool or run `ssl-check domain.com` in the terminal to inspect certificate expiry, issuer CA trust, SANs, and TLS 1.3 compliance."
  },
  {
    triggers: ['breach', 'leak', 'dark web', 'haveibeenpwned', 'compromise'],
    response: "Our **Dark Web Breach Checker** uses NIST SP 800-63B SHA-1 k-Anonymity queries against compromised database dumps to check if your credentials have been leaked without exposing your password."
  },
  {
    triggers: ['phish', 'phishing', 'fake site', 'scam url'],
    response: "Our **Phishing URL Analyzer** performs multi-layer structural heuristics, brand impersonation detection, and global blacklist cross-checks. You can test URLs via `/toolkit` or run `phish-check <url>`."
  },
  {
    triggers: ['garak', 'redteam', 'jailbreak', 'llm security', 'prompt injection'],
    response: "CyberShield X includes dedicated **AI Security & Red-Teaming Tools**:\n- **Garak LLM Scanner**: Probes for hallucinations, prompt leaks, and safety bounds.\n- **Universal Adversarial Redteam (GCG)**: Tests model robustness against Crescendo jailbreaks.\n- **Prompt Delimiter Fuzzer**: Evaluates system prompt leak vulnerabilities.\n- **Prompt Injection Guard**: Detects adversarial injection payloads in real time."
  }
];

function generateIntelligentFallback(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return "Hello! I am CyberBot, your AI Cybersecurity Assistant for CyberShield X. How can I assist you with your security audits or platform tools today?";
  }

  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.triggers.some(trigger => q.includes(trigger))) {
      return item.response;
    }
  }

  return `I'm specialized in cybersecurity intelligence, threat scanning, and the **CyberShield X** platform.\n\nI can help you with:\n- Running security scans (DNS, Open Ports, SSL, Tech Stack, HTTP Headers)\n- Analyzing threats (Phishing URLs, Dark Web Breaches, Malware Hashes, SMS fraud)\n- Navigating our **110 cybersecurity tools** across 24 categories\n- Running **7 Automated SOC Playbooks** in our CyberSOC Terminal\n- Exporting audit dossiers in **SARIF, STIX 2.1, CSV, JSON, or PDF**\n\nWhat target domain, IP, or security task would you like to explore?`;
}

class AIOrchestrator {
  /**
   * Constructs the AIOrchestrator.
   */
  constructor(deps) {
    this.contextAggregator = deps.contextAggregator;
    this.memoryManager = deps.memoryManager;
    this.permissionManager = deps.permissionManager;
    this.policyEngine = deps.policyEngine;
    this.responseFormatter = deps.responseFormatter;
    this.decisionEngine = deps.decisionEngine;
    this.runtimePipeline = deps.runtimePipeline;
    this.storageManager = deps.storageManager;

    const apiKey = process.env.GEMINI_API_KEY;
    this.genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;
  }

  /**
   * Processes an incoming chat request.
   * @param {Object} req - The Express request object.
   * @param {Array} messages - The conversation messages array.
   * @returns {Object} Structured response containing the formatted AI output.
   */
  async processChatRequest(req, messages) {
    try {
      const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';
      
      // 1. If Gemini AI provider is configured with a valid key, query the model
      if (this.genAI) {
        try {
          const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
          
          let appSnapshot = {};
          if (this.contextAggregator && typeof this.contextAggregator.generateSnapshot === 'function') {
            try {
              const snapshotResult = await this.contextAggregator.generateSnapshot(req);
              appSnapshot = snapshotResult?.data?.snapshot || {};
            } catch (snapErr) {
              // Non-blocking snapshot fallback
            }
          }

          const systemPrompt = `You are CyberBot (Security Copilot), the authoritative, friendly, and expert AI assistant for the CyberShield X Cybersecurity Intelligence Platform.

About CyberShield X:
- A comprehensive cybersecurity platform featuring 110 LIVE cybersecurity tools across 24 categories (Reconnaissance, Web DAST, Cloud CIS, API Security, Forensics, Malware Analysis, Wireless, AI Red-Teaming, Phishing, Identity, DevSecOps, Financial Security, Compliance).
- Interactive CyberSOC Terminal with CLI execution, auto-complete, and natural language intent parsing.
- 7 Multi-Vector Automated Playbooks (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming).
- Enterprise Multi-Format Dossier Exporters (OASIS SARIF v2.1.0, OASIS STIX 2.1, CSV, JSON, Markdown, PDF).

Instructions:
1. Be warm, polite, and conversational for casual greetings ("Hi", "Hello", "How are you", "Thanks"). Proactively ask how you can help with their security posture.
2. Provide concise, expert, and actionable cybersecurity guidance in clean Markdown.
3. If the user asks about platform features or tools, explain how they work and guide them to the Tools Hub (/toolkit) or Cyber Terminal.
4. If a query is unclear, ambiguous, or out of scope, politely explain what CyberShield X can do and ask how you can assist with their security tasks.
5. Never hallucinate fake scan results.

Current User query: "${latestMessage}"`;

          const result = await model.generateContent(systemPrompt);
          const responseText = result.response.text();
          return this.responseFormatter.formatResponse(responseText, { status: 'COMPLETED' });
        } catch (geminiErr) {
          console.warn('Gemini API call failed, using intelligent built-in knowledge base:', geminiErr.message);
        }
      }

      // 2. Intelligent conversational & platform knowledge fallback
      const fallbackResponse = generateIntelligentFallback(latestMessage);
      return this.responseFormatter.formatResponse(fallbackResponse, { status: 'COMPLETED' });

    } catch (error) {
      console.error('AIOrchestrator Error:', error);
      const fallbackResponse = generateIntelligentFallback('');
      return this.responseFormatter.formatResponse(fallbackResponse, { status: 'COMPLETED' });
    }
  }
}

module.exports = AIOrchestrator;
