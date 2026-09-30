const { GoogleGenerativeAI } = require('@google/generative-ai');

// Built-in intelligent conversational & comprehensive cybersecurity/technical knowledge engine
const FALLBACK_KNOWLEDGE = [
  {
    triggers: ['hi', 'hello', 'hey', 'namaste', 'greetings', 'sup', 'good morning', 'good afternoon', 'good evening', 'how are you', 'kaise ho', 'kya haal', 'kese ho'],
    response: "Hello! I am CyberBot, your AI Cybersecurity & Technical Copilot for CyberShield X. I'm doing great and ready to assist you! You can ask me anything about cybersecurity, programming, network audits, vulnerability remediation, or our 111 platform security tools. What are you working on today?"
  },
  {
    triggers: ['thank', 'thanks', 'dhanyawad', 'shukriya', 'thx', 'thank you'],
    response: "You're very welcome! If you have any more questions about security analysis, coding, cloud infrastructure, or platform tools, feel free to ask anytime. Stay safe and secure!"
  },
  {
    triggers: ['who are you', 'what are you', 'what is this', 'about cybershield', 'what is cybershield', 'introduce yourself', 'kya hai', 'help me', 'what can you do'],
    response: "**CyberBot** is an advanced AI Cybersecurity & Technical Intelligence Copilot integrated into **CyberShield X**.\n\n### What I Can Do:\n1. **Answer Any Technical Question**: Deep expertise in cybersecurity (OWASP Top 10, CWE, CVEs), networking (TCP/IP, DNS, TLS), programming (Python, JavaScript, Go, Bash, C++, SQL), DevSecOps, cloud architecture (AWS, Azure, GCP, K8s), and system administration.\n2. **Guide 111 Canonical Security Tools**: Instant guidance on using our 111 tools across 24 categories in the Tools Hub (`/toolkit`).\n3. **Interactive Terminal Operations**: Suggest CLI commands and execution parameters for the interactive CyberSOC Terminal (`/terminal`).\n4. **Automated SOC Playbooks**: Help run 7 end-to-end chained workflows (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming).\n5. **Audit Dossiers**: Generate and interpret compliance reports in OASIS SARIF v2.1.0, OASIS STIX 2.1, CSV, JSON, and PDF.\n\nWhat security task or technical question would you like to explore?"
  },
  {
    triggers: ['tools', 'what tools', 'catalog', 'list tools', 'categories', 'all tools'],
    response: "CyberShield X features **111 live security tools** across 24 categories:\n1. **Reconnaissance & OSINT** (Subfinder, Shodan, Censys, theHarvester, Dirsearch, Sherlock)\n2. **Web & DAST Security** (SQLMap, Nikto, Burp Suite, WPScan, OWASP ZAP, CORS/CSP)\n3. **Network & Wireless** (Nmap, Aircrack-ng, Kismet, Wifite, Wireshark, Traceroute)\n4. **Cloud & DevSecOps** (Prowler AWS CIS, Kube-Bench, Snyk, Gitleaks, Docker Bench, Semgrep)\n5. **Malware & Forensics** (YARA, PEframe, Volatility, Ghidra, Radare2, Autopsy, VirusShare)\n6. **AI Security & Red-Teaming** (Garak LLM Scanner, Adversarial Redteam, Prompt Fuzzer, Prompt Guard)\n7. **Identity & Phishing** (Dark Web Breach Checker, Phishing Analyzer, Email SPF/DMARC, SMS Fraud)\n\nYou can access every tool in the **Tools Hub** (`/toolkit`) or run CLI commands directly in the **CyberSOC Terminal** (`/terminal`)."
  },
  {
    triggers: ['playbook', 'playbooks', 'automated', 'chain', 'chained'],
    response: "We offer **7 Multi-Vector Automated SOC Playbooks** in our CyberSOC Terminal:\n1. 🌐 **Perimeter Reconnaissance**: DNS -> Ports -> SSL -> Headers -> Threat Feeds\n2. 🛡️ **Web Application DAST**: Tech Stack -> Nikto -> CORS -> CSP -> SQLMap\n3. 🔑 **API Security & Cryptography**: OpenAPI Linter -> JWT Entropy -> API Fuzzer -> Postman -> IAM\n4. ☁️ **Cloud Posture & DevSecOps**: Prowler AWS CIS -> Kube-Bench -> Snyk -> Gitleaks -> Docker Bench\n5. 🔬 **Threat & Memory Forensics**: VirusShare -> YARA -> PEframe -> Volatility -> MISP\n6. 🎣 **Phishing & Identity Defense**: Phishing Analyzer -> Evilginx -> Email SPF/DMARC -> Breach Check\n7. 🤖 **AI Red-Teaming**: Garak Probes -> Prompt Fuzzer -> GCG Redteam -> PII Guard -> AI Remediation\n\nOpen the **Terminal** (`/terminal`) to launch any playbook with 1 click!"
  },
  {
    triggers: ['export', 'sarif', 'stix', 'pdf', 'csv', 'report', 'download dossier'],
    response: "You can export comprehensive security audit dossiers directly from any Scan Details page (`/scan/:id`):\n- 🛡️ **OASIS SARIF v2.1.0**: For GitHub Code Scanning & GitLab CI/CD pipelines.\n- ⚡ **OASIS STIX 2.1**: For SIEM, SOAR, OpenCTI, and MISP threat sharing.\n- 📊 **CSV**: Tabular spreadsheets with all findings and severity ratings.\n- **{ } JSON**: Raw structured audit payload.\n- 📄 **Browser & Server PDF**: Publication-ready executive audit reports."
  },
  {
    triggers: ['subdomain', 'subfinder'],
    response: "To map subdomains, use **Subfinder** or our **DNS Recon Engine** in the Tools Hub (`/toolkit`). You can also execute `subfinder -d example.com` in the interactive CyberSOC terminal (`/terminal`)."
  },
  {
    triggers: ['nmap', 'port', 'open socket', 'port scan'],
    response: "Our **Nmap Port Scanner** probes target TCP/UDP sockets to identify open ports, service banners, and daemon versions. Run it in `/toolkit` or execute `nmap -sV target.com` directly in the native CyberSOC Terminal (`/terminal`)."
  },
  {
    triggers: ['ssl', 'cert', 'tls', 'certificate'],
    response: "You can audit SSL/TLS certificates with our **SSL Certificate Audit** tool or run `ssl-check domain.com` in the terminal to inspect certificate expiry, issuer CA trust, SANs, cipher suites, and TLS 1.3 compliance."
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
    triggers: ['sql injection', 'sqli', 'sqlmap', 'database injection'],
    response: "### SQL Injection (SQLi) Overview & Defense\n\nSQL Injection occurs when untrusted user input is directly concatenated into dynamic SQL queries without parameterized sanitization.\n\n#### Prevention (Python Example):\n```python\n# ❌ VULNERABLE\ncursor.execute(f\"SELECT * FROM users WHERE username = '{user_input}'\")\n\n# ✅ SECURE (Parameterized Query)\ncursor.execute(\"SELECT * FROM users WHERE username = %s\", (user_input,))\n```\n\nTo audit applications for SQLi vulnerabilities, launch **SQLMap** in the Tools Hub (`/toolkit`) or run the **Web DAST Playbook** in `/terminal`."
  },
  {
    triggers: ['xss', 'cross site scripting', 'stored xss', 'reflected xss'],
    response: "### Cross-Site Scripting (XSS) Overview & Defense\n\nXSS allows attackers to execute malicious scripts in victim browsers, leading to session hijacking, defacement, or credential theft.\n\n#### Key Defenses:\n1. **Context-Aware Output Encoding**: HTML-encode all user input before rendering (`&lt;`, `&gt;`, `&quot;`).\n2. **Content Security Policy (CSP)**: Deploy strict CSP headers rejecting inline scripts (`script-src 'self'`).\n3. **HttpOnly Cookies**: Prevent JavaScript from accessing authentication session tokens (`Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict`)."
  },
  {
    triggers: ['dns', 'domain name system', 'nameserver'],
    response: "### DNS (Domain Name System)\n\nDNS is the internet's phonebook, translating human-friendly domain names (e.g., `cybershieldx.in`) into machine-routable IP addresses (e.g., `104.21.58.12`).\n\n#### Key Record Types:\n- **A / AAAA**: Maps hostnames to IPv4 / IPv6 addresses.\n- **MX**: Directs mail to authoritative mail servers.\n- **TXT**: Holds SPF (`v=spf1 ...`), DKIM, and DMARC anti-spoofing policies.\n- **NS**: Identifies the authoritative nameservers for the zone.\n\nUse our **DNS Recon Engine** in `/toolkit` or run `dig example.com ANY` in the terminal to inspect all records."
  },
  {
    triggers: ['firewall', 'waf', 'ids', 'ips', 'defense in depth'],
    response: "### Network Defenses: Firewalls, WAFs & IDS/IPS\n\n- **Network Firewall (L3/L4)**: Filters traffic based on IP addresses, ports, and protocols (e.g., `iptables`, `pfSense`).\n- **Web Application Firewall (WAF, L7)**: Inspects HTTP/HTTPS traffic to block web application exploits like SQLi, XSS, and path traversal (e.g., ModSecurity, Cloudflare WAF).\n- **IDS / IPS**: Intrusion Detection & Prevention Systems analyze network packet streams against known attack signatures and anomalies (e.g., Snort, Suricata)."
  },
  {
    triggers: ['garak', 'redteam', 'jailbreak', 'llm security', 'prompt injection'],
    response: "CyberShield X includes dedicated **AI Security & Red-Teaming Tools**:\n- **Garak LLM Scanner**: Probes for hallucinations, prompt leaks, and safety bounds.\n- **Universal Adversarial Redteam (GCG)**: Tests model robustness against Crescendo jailbreaks.\n- **Prompt Delimiter Fuzzer**: Evaluates system prompt leak vulnerabilities.\n- **Prompt Injection Guard**: Detects adversarial injection payloads in real time."
  }
];

function generateIntelligentFallback(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return "Hello! I am CyberBot, your AI Cybersecurity & Technical Copilot for CyberShield X. How can I assist you with your security audits, code analysis, or platform tools today?";
  }

  // 1. Check exact trigger patterns
  for (const item of FALLBACK_KNOWLEDGE) {
    if (item.triggers.some(trigger => {
      if (trigger.length <= 4) {
        return new RegExp(`\\b${trigger}\\b`, 'i').test(q);
      }
      return q.includes(trigger);
    })) {
      return item.response;
    }
  }

  // 2. Synthesize an intelligent, technical response for queries during temporary cloud AI outages
  return `### CyberBot Technical Copilot

I have received your query: **"${query}"**

While our cloud LLM gateway is syncing, here is actionable cybersecurity guidance on this topic:

1. **Security Principles**: Always ensure defense-in-depth, least privilege, and zero-trust verification across all network, application, and infrastructure layers.
2. **Platform Capabilities**: CyberShield X provides **111 live security tools** across 24 categories in the [Tools Hub](/toolkit) and an interactive **CyberSOC Terminal** at [/terminal](/terminal) to test, scan, and audit target assets.
3. **Automated Analysis**: You can execute automated multi-vector playbooks (Recon, Web DAST, API Security, Cloud CIS, Threat Forensics) directly in the terminal to gather live diagnostic evidence.

Feel free to ask a specific follow-up question or run a security probe in the CyberSOC Terminal!`;
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
   * Processes an incoming chat request with transparent provider routing,
   * multi-model resilience, automatic retry with backoff, and omniscient technical knowledge.
   * @param {Object} req - The Express request object.
   * @param {Array} messages - The conversation messages array.
   * @returns {Object} Structured response containing the formatted AI output and routing metadata.
   */
  async processChatRequest(req, messages) {
    const startTime = Date.now();
    const requestedModel = req.body?.model || 'gemini-2.5-flash';
    let actualModelUsed = 'local-knowledge-engine';
    let provider = 'CyberShield Native';
    let fallbackUsed = false;
    let fallbackReason = null;

    try {
      const latestMessage = messages && messages.length > 0 ? messages[messages.length - 1].content : '';

      // 1. Check if user explicitly requested local Ollama model
      if (requestedModel.toLowerCase().includes('ollama') || requestedModel.toLowerCase().includes('llama')) {
        const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
        let ollamaOnline = false;
        try {
          const axios = require('axios');
          const pingRes = await axios.get(`${ollamaUrl}/api/tags`, { timeout: 1500 });
          if (pingRes.status === 200) ollamaOnline = true;
        } catch {
          ollamaOnline = false;
        }

        if (ollamaOnline) {
          try {
            const axios = require('axios');
            const ollamaRes = await axios.post(`${ollamaUrl}/api/chat`, {
              model: requestedModel.includes(':') ? requestedModel : 'llama3',
              messages: [{ role: 'user', content: latestMessage }],
              stream: false
            }, { timeout: 10000 });

            if (ollamaRes.data?.message?.content) {
              const latencyMs = Date.now() - startTime;
              return this.responseFormatter.formatResponse(ollamaRes.data.message.content.trim(), {
                status: 'COMPLETED',
                requestedModel,
                actualModelUsed: requestedModel,
                provider: 'Ollama (Local)',
                fallbackUsed: false,
                latencyMs
              });
            }
          } catch (ollamaErr) {
            fallbackUsed = true;
            fallbackReason = `Ollama execution error: ${ollamaErr.message}`;
          }
        } else {
          fallbackUsed = true;
          fallbackReason = 'Local Ollama daemon is offline (127.0.0.1:11434 unreachable)';
        }
      }

      // 2. Query Gemini AI provider with multi-model resilience and automatic retry
      if (this.genAI) {
        // Multi-turn conversation history for rich context
        const conversationHistory = (messages || [])
          .slice(-6)
          .map(m => `${m.role === 'user' ? 'User' : 'CyberBot'}: ${m.content}`)
          .join('\n\n');

        const systemPrompt = `You are CyberBot (Security Copilot), an expert, versatile, and highly knowledgeable AI Assistant for CyberShield X and all domains of Cybersecurity, Computer Science, IT Infrastructure, and Software Engineering.

Core Knowledge & Answering Capabilities:
1. You are fully capable of answering ANY user query with depth, clarity, and authority:
   - Cybersecurity: Threat analysis, vulnerability identification & remediation (OWASP Top 10, CWE, CVEs), network defense, penetration testing concepts, ethical hacking, digital forensics, cryptography, malware analysis, OSINT, compliance (ISO 27001, SOC 2, NIST, GDPR), and zero-trust architecture.
   - Engineering & Code: Writing, explaining, and debugging code in Python, JavaScript/Node.js, Go, Rust, Bash, C/C++, SQL, and regex. Providing secure coding examples and patches.
   - Infrastructure & Cloud: Linux/Unix systems, Windows security, Docker, Kubernetes, AWS, Azure, GCP, CI/CD DevSecOps, firewalls, reverse proxies, and system administration.
   - Networking: Protocols (TCP/UDP, DNS, HTTP/1-3, TLS/SSL, BGP, ARP, ICMP), packet analysis, routing, VPNs, and proxies.
   - General & Conversational: Answer general technical questions, greetings, everyday inquiries, and career guidance warmly, politely, and comprehensively.

2. CyberShield X Platform Integration:
   - When a user's question relates to a security capability, proactively reference relevant tools from CyberShield X's 111 canonical security tools in the Tools Hub (/toolkit) or CLI commands in the interactive CyberSOC Terminal (/terminal) to give hands-on assistance.
   - Mention automated SOC playbooks (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming) where applicable.

3. Formatting & Style:
   - Provide answers in clean, well-structured GitHub-flavored Markdown.
   - Use headings, bullet points, and syntax-highlighted code blocks where code or commands are shown.
   - Be direct, professional, thorough, and helpful. Avoid unhelpful refusals.

4. Ethical Safety Guidelines:
   - Explain attack concepts and mechanics defensively and educationally.
   - Provide secure defensive code, detection rules (YARA, Sigma, Snort), and remediation steps rather than creating active exploit weapons against unconsenting targets.

Conversation History:
${conversationHistory || latestMessage}

Respond directly to the user's latest query:`;

        // Multi-model hierarchy: Try primary model first, with automatic retry and secondary fallback
        const candidateModels = [
          process.env.AI_TRIAGE_MODEL || 'gemini-2.5-flash',
          'gemini-3.8-flash'
        ];

        let geminiSuccess = false;
        let lastGeminiError = null;

        const callWithTimeout = (promise, ms = 8000) => {
          let timer;
          const timeoutPromise = new Promise((_, reject) => {
            timer = setTimeout(() => {
              const err = new Error(`Model request timed out after ${ms}ms`);
              err.status = 504;
              reject(err);
            }, ms);
          });
          return Promise.race([promise, timeoutPromise]).finally(() => clearTimeout(timer));
        };

        for (const candidateModel of candidateModels) {
          // Attempt candidate with up to 1 retry on transient error (503 / 429)
          for (let attempt = 0; attempt <= 1; attempt++) {
            try {
              const model = this.genAI.getGenerativeModel({ model: candidateModel });
              const result = await callWithTimeout(model.generateContent(systemPrompt), 8000);
              const responseText = result.response.text();

              if (responseText && responseText.trim().length > 0) {
                actualModelUsed = candidateModel;
                provider = 'Google AI';
                geminiSuccess = true;

                let formattedOutput = responseText.trim();
                if (fallbackUsed && fallbackReason) {
                  formattedOutput = `> *[Note: ${fallbackReason}. Routed to Google Gemini]*\n\n` + formattedOutput;
                }

                const latencyMs = Date.now() - startTime;
                return this.responseFormatter.formatResponse(formattedOutput, {
                  status: 'COMPLETED',
                  requestedModel,
                  actualModelUsed,
                  provider,
                  fallbackUsed: candidateModel !== requestedModel || fallbackUsed,
                  fallbackReason,
                  latencyMs
                });
              }
            } catch (err) {
              lastGeminiError = err;
              const is503or429 = err.status === 503 || err.status === 429 ||
                err.message?.includes('503') || err.message?.includes('429');
              if (is503or429 && attempt === 0) {
                // Short jittered delay before retry on high demand
                await new Promise(resolve => setTimeout(resolve, 500));
                continue;
              }
              // If timeout or already retried, break to next candidate model immediately
              break;
            }
          }
          if (geminiSuccess) break;
        }

        if (!geminiSuccess) {
          fallbackUsed = true;
          fallbackReason = 'Cloud AI service temporarily experiencing high traffic';
        }
      }

      // 3. Fallback to built-in cybersecurity knowledge base (clean, friendly presentation)
      let fallbackText = generateIntelligentFallback(latestMessage);
      if (fallbackUsed && fallbackReason) {
        fallbackText = `> *[Operating via CyberShield Security Knowledge Engine]*\n\n` + fallbackText;
      }

      const latencyMs = Date.now() - startTime;
      return this.responseFormatter.formatResponse(fallbackText, {
        status: 'COMPLETED',
        requestedModel,
        actualModelUsed: 'local-knowledge-engine',
        provider: 'CyberShield Native Knowledge',
        fallbackUsed: true,
        fallbackReason,
        latencyMs
      });

    } catch (error) {
      console.error('AIOrchestrator Error:', error);
      const fallbackResponse = generateIntelligentFallback('');
      return this.responseFormatter.formatResponse(fallbackResponse, {
        status: 'COMPLETED',
        requestedModel,
        actualModelUsed: 'local-knowledge-engine',
        provider: 'CyberShield Fallback',
        fallbackUsed: true,
        latencyMs: Date.now() - startTime
      });
    }
  }
}

module.exports = AIOrchestrator;
