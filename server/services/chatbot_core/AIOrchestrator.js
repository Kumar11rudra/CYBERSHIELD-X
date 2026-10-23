const { GoogleGenerativeAI } = require('@google/generative-ai');

// Built-in intelligent conversational & comprehensive cybersecurity/technical knowledge engine
const FALLBACK_KNOWLEDGE = [
  {
    triggers: ['hi', 'hello', 'hey', 'namaste', 'greetings', 'sup', 'good morning', 'good afternoon', 'good evening', 'how are you', 'kaise ho', 'kya haal', 'kese ho', 'hiii', 'heyy'],
    response: "Hello! I am **CyberBot**, your AI Cybersecurity & Technical Copilot for **CyberShield X**. I am active and ready to assist you! You can ask me anything about cybersecurity, software engineering, network diagnostics, vulnerability remediation, or our **125 canonical security tools**. What would you like to explore today?"
  },
  {
    triggers: ['thank', 'thanks', 'dhanyawad', 'shukriya', 'thx', 'thank you'],
    response: "You're very welcome! If you have any further questions regarding threat analysis, secure programming, infrastructure hardening, or our platform utilities, feel free to ask anytime. Stay secure!"
  },
  {
    triggers: ['who are you', 'what are you', 'what is this', 'about cybershield', 'what is cybershield', 'introduce yourself', 'kya hai', 'help me', 'what can you do'],
    response: "**CyberBot** is an advanced AI Cybersecurity & Technical Intelligence Copilot integrated into **CyberShield X**.\n\n### Core Capabilities:\n1. **Omniscient Technical Reasoning**: Deep expertise in cybersecurity (OWASP Top 10, CWE, CVEs), network engineering (TCP/IP, DNS, TLS 1.3), programming (**Python**, **JavaScript/Node.js**, **Go**, **Bash**, **C/C++**, **SQL**), DevSecOps, and cloud security (AWS, Azure, GCP, K8s).\n2. **125 Canonical Security Tools**: Interactive guidance for all 125 tools across 24 security domains available in the **Workstation Dashboard** (`/dashboard`).\n3. **Interactive Terminal Operations**: Live CLI commands and parameters for the **CyberSOC Terminal** (`/terminal`).\n4. **Automated SOC Playbooks**: Guidance on executing 7 automated multi-vector playbooks (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming).\n5. **Audit Dossiers**: Verification and interpretation of compliance dossiers in **OASIS SARIF v2.1.0**, **OASIS STIX 2.1**, CSV, JSON, and PDF.\n\nWhat security task or technical inquiry would you like to explore?"
  },
  {
    triggers: ['tools', 'what tools', 'catalog', 'list tools', 'categories', 'all tools'],
    response: "CyberShield X features **125 canonical security tools** categorized across 24 domains:\n1. **Reconnaissance & OSINT**: Subfinder, Shodan, Censys, crt.sh, theHarvester, Dirsearch, Sherlock\n2. **Web & DAST Security**: SQLMap, Nikto, Burp Suite, WPScan, OWASP ZAP, CORS/CSP\n3. **Network & Host Native**: Nmap, Dig, Curl, Whois, OpenSSL, PacketTotal, CloudShark, Traceroute\n4. **Cloud & DevSecOps**: Prowler AWS CIS, Kube-Bench, Snyk, GitGuardian, TruffleHog, OSV, Docker Bench\n5. **Malware & Forensics**: YARA, PEframe, Volatility, Ghidra, ExifTool, Aperi'Solve, MalwareBazaar\n6. **Vulnerability & Prioritization**: CISA KEV Catalog, EPSS Risk Calculator, NVD CVE Lookup\n7. **AI Security & Red-Teaming**: Garak LLM Scanner, Universal Adversarial Redteam, Prompt Fuzzer\n8. **Identity & Phishing**: Dark Web Breach Checker, Phishing Analyzer, SPF/DMARC\n\nAll tools are accessible in the **Workstation Dashboard** (`/dashboard`) or via the **CyberSOC Terminal** (`/terminal`)."
  },
  {
    triggers: ['playbook', 'playbooks', 'automated', 'chain', 'chained'],
    response: "We provide **7 Multi-Vector Automated SOC Playbooks** in the CyberSOC Terminal:\n1. 🌐 **Perimeter Reconnaissance**: DNS -> Ports -> SSL -> Headers -> Threat Feeds\n2. 🛡️ **Web Application DAST**: Tech Stack -> Nikto -> CORS -> CSP -> SQLMap\n3. 🔑 **API Security & Cryptography**: OpenAPI Linter -> JWT Entropy -> API Fuzzer -> Postman -> IAM\n4. ☁️ **Cloud Posture & DevSecOps**: Prowler AWS CIS -> Kube-Bench -> Snyk -> GitGuardian -> Docker Bench\n5. 🔬 **Threat & Memory Forensics**: VirusShare -> YARA -> PEframe -> Volatility -> MISP\n6. 🎣 **Phishing & Identity Defense**: Phishing Analyzer -> Evilginx -> Email SPF/DMARC -> Breach Check\n7. 🤖 **AI Red-Teaming**: Garak Probes -> Prompt Fuzzer -> GCG Redteam -> PII Guard -> AI Remediation\n\nOpen the **CyberSOC Terminal** (`/terminal`) to launch any automated playbook!"
  },
  {
    triggers: ['export', 'sarif', 'stix', 'pdf', 'csv', 'report', 'download dossier'],
    response: "You can export comprehensive security dossiers from any Scan Details page (`/scan/:id`):\n- 🛡️ **OASIS SARIF v2.1.0**: Standardized format for GitHub Code Scanning & CI/CD pipelines.\n- ⚡ **OASIS STIX 2.1**: Threat intelligence format for SIEM, SOAR, and MISP.\n- 📊 **CSV**: Tabular breakdown of findings and severities.\n- 📄 **PDF & JSON**: Publication-grade executive summaries and machine-readable telemetry."
  },
  {
    triggers: ['subdomain', 'subfinder'],
    response: "To map subdomains, utilize **Subfinder** or the **DNS Recon Engine** in the **Workstation Dashboard** (`/dashboard`). You can also execute `subfinder -d target.com` directly in the interactive **CyberSOC Terminal** (`/terminal`)."
  },
  {
    triggers: ['nmap', 'port', 'open socket', 'port scan'],
    response: "Our **Nmap Port Scanner** probes target TCP/UDP sockets to identify open ports, service banners, and daemon versions. Run it via the **Workstation Dashboard** (`/dashboard`) or execute `nmap -sV target.com` in the native **CyberSOC Terminal** (`/terminal`)."
  },
  {
    triggers: ['ssl', 'cert', 'tls', 'certificate'],
    response: "Inspect SSL/TLS configurations with our **OpenSSL Certificate Audit** tool or run `ssl-check domain.com` in the terminal to verify expiration, issuer CA trust, SANs, cipher suites, and TLS 1.3 protocol compliance."
  },
  {
    triggers: ['breach', 'leak', 'dark web', 'haveibeenpwned', 'compromise'],
    response: "The **Dark Web Breach Checker** uses NIST SP 800-63B SHA-1 k-Anonymity queries against compromised database records to determine exposure without transmitting the user's password."
  },
  {
    triggers: ['phish', 'phishing', 'fake site', 'scam url'],
    response: "The **Phishing URL Analyzer** performs multi-layer structural heuristics, brand impersonation detection, and global reputation cross-referencing in real time."
  },
  {
    triggers: ['sql injection', 'sqli', 'sqlmap', 'database injection'],
    response: "### SQL Injection (SQLi) Overview & Defense\n\nSQL Injection occurs when untrusted user input is directly concatenated into dynamic SQL queries without parameterized sanitization.\n\n#### Prevention (Python Example):\n```python\n# ❌ VULNERABLE\ncursor.execute(f\"SELECT * FROM users WHERE username = '{user_input}'\")\n\n# ✅ SECURE (Parameterized Query)\ncursor.execute(\"SELECT * FROM users WHERE username = %s\", (user_input,))\n```\n\nTo audit applications for SQLi vulnerabilities, launch **SQLMap** in the **Workstation Dashboard** (`/dashboard`) or execute the **Web DAST Playbook** in `/terminal`."
  },
  {
    triggers: ['xss', 'cross site scripting', 'stored xss', 'reflected xss'],
    response: "### Cross-Site Scripting (XSS) Overview & Defense\n\nXSS allows attackers to execute malicious scripts in victim browsers, leading to session hijacking, defacement, or credential theft.\n\n#### Key Defenses:\n1. **Context-Aware Output Encoding**: HTML-encode all user input before rendering (`&lt;`, `&gt;`, `&quot;`).\n2. **Content Security Policy (CSP)**: Deploy strict CSP headers rejecting inline scripts (`script-src 'self'`).\n3. **HttpOnly Cookies**: Prevent JavaScript from accessing authentication session tokens (`Set-Cookie: session=...; HttpOnly; Secure; SameSite=Strict`)."
  },
  {
    triggers: ['dns', 'domain name system', 'nameserver'],
    response: "### DNS (Domain Name System)\n\nDNS maps human-friendly hostnames (e.g., `cybershieldx.in`) into routable IP addresses.\n\n#### Key Record Types:\n- **A / AAAA**: Maps hostnames to IPv4 / IPv6 addresses.\n- **MX**: Directs email to authoritative mail servers.\n- **TXT**: Houses SPF (`v=spf1 ...`), DKIM, and DMARC anti-spoofing policies.\n- **NS**: Identifies authoritative nameservers for the zone.\n\nUse our **DNS Recon Engine** in `/dashboard` or run `dig target.com ANY` in `/terminal` to inspect all records."
  },
  {
    triggers: ['firewall', 'waf', 'ids', 'ips', 'defense in depth'],
    response: "### Network Defenses: Firewalls, WAFs & IDS/IPS\n\n- **Network Firewall (L3/L4)**: Filters traffic based on IP addresses, ports, and protocols.\n- **Web Application Firewall (WAF, L7)**: Inspects HTTP/HTTPS traffic to prevent application exploits such as SQLi, XSS, and SSRF.\n- **IDS / IPS**: Analyzes packet streams against attack signatures and behavioral anomalies."
  },
  {
    triggers: ['garak', 'redteam', 'jailbreak', 'llm security', 'prompt injection'],
    response: "CyberShield X provides dedicated **AI Security & Red-Teaming Utilities**:\n- **Garak LLM Scanner**: Probes model endpoints for hallucinations and safety boundaries.\n- **Universal Adversarial Redteam (GCG)**: Tests model robustness against adversarial prefixes.\n- **Prompt Delimiter Fuzzer**: Evaluates system prompt leak vulnerabilities.\n- **Prompt Injection Guard**: Detects adversarial injection payloads in real time."
  }
];

function generateIntelligentFallback(query) {
  const q = (query || '').toLowerCase().trim();
  if (!q) {
    return "Hello! I am **CyberBot**, your AI Cybersecurity & Technical Copilot for **CyberShield X**. How can I assist you with your security audits, code analysis, or platform tools today?";
  }

  // 1. Check exact trigger patterns in knowledge base
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

  // 2. Synthesize an intelligent, structured technical response with highlighted key entities
  return `### CyberBot Technical Copilot

Regarding your inquiry: **"${query}"**

1. **Strategic Defense**: Always implement **defense-in-depth**, **least privilege**, and **zero-trust authentication** across application, network, and cloud layers.
2. **Platform Capabilities**: **CyberShield X** provides **125 canonical security tools** across 24 domains in the [Workstation Dashboard](/dashboard) to analyze, scan, and audit target assets.
3. **Interactive Investigation**: You can execute live commands and multi-vector playbooks directly in the [CyberSOC Terminal](/terminal) for instant diagnostic verification.

Feel free to ask a specific follow-up question or provide a target domain/IP to inspect!`;
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

      // Prepare system prompt & multi-turn history for all cloud LLM providers
      const conversationHistory = (messages || [])
        .slice(-6)
        .map(m => `${m.role === 'user' ? 'User' : 'CyberBot'}: ${m.content}`)
        .join('\n\n');

      const currentDate = new Date().toISOString().split('T')[0];
      const currentYear = new Date().getFullYear();

      const systemPrompt = `You are CyberBot (Security Copilot), an expert, versatile, and highly knowledgeable AI Assistant for CyberShield X and all domains of Cybersecurity, Computer Science, IT Infrastructure, and Software Engineering.
Today's Date: ${currentDate}. Current Year: ${currentYear}.

Core Knowledge & Answering Capabilities:
1. You are fully capable of answering ANY user query with depth, clarity, and authority:
   - Cybersecurity: Threat analysis, vulnerability identification & remediation (OWASP Top 10, CWE, CVEs), network defense, penetration testing concepts, ethical hacking, digital forensics, cryptography, malware analysis, OSINT, compliance (ISO 27001, SOC 2, NIST, GDPR), and zero-trust architecture.
   - Engineering & Code: Writing, explaining, and debugging code in Python, JavaScript/Node.js, Go, Rust, Bash, C/C++, SQL, and regex. Providing secure coding examples and patches.
   - Infrastructure & Cloud: Linux/Unix systems, Windows security, Docker, Kubernetes, AWS, Azure, GCP, CI/CD DevSecOps, firewalls, reverse proxies, and system administration.
   - Networking: Protocols (TCP/UDP, DNS, HTTP/1-3, TLS/SSL, BGP, ARP, ICMP), packet analysis, routing, VPNs, and proxies.
   - General, Real-World & Factuality: Answer general technical and real-world inquiries accurately and factually. Be aware of real-world transitions (e.g., in Indian football, Sunil Chhetri retired from international football in June 2024 and Gurpreet Singh Sandhu assumed captaincy; current national leaders; recent tech releases). Always provide genuine, up-to-date facts.

2. CyberShield X Platform Integration:
   - When a user's question relates to a security capability, proactively reference relevant tools from CyberShield X's 125 canonical security tools in the Workstation Dashboard (/dashboard) or CLI commands in the interactive CyberSOC Terminal (/terminal) to give hands-on assistance.
   - Mention automated SOC playbooks (Perimeter Recon, Web DAST, API Security, Cloud CIS, Threat Forensics, Phishing Defense, AI Red-Teaming) where applicable.

3. Formatting & Aesthetic Highlighting:
   - Provide answers in clean, well-structured GitHub-flavored Markdown.
   - Highlight key entities, official names, tools, ports, CVEs, and important commands in bold (**like this**) so they render with bright cyber-glow highlighting in the operator console.
   - Keep narrative descriptions and body text soft, polite, and natural.
   - Use headings (###), bullet points, and syntax-highlighted code blocks where code or commands are shown.
   - Be direct, professional, thorough, and helpful. Avoid unhelpful refusals.

4. Ethical Safety Guidelines:
   - Explain attack concepts and mechanics defensively and educationally.
   - Provide secure defensive code, detection rules (YARA, Sigma, Snort), and remediation steps rather than creating active exploit weapons against unconsenting targets.

Conversation History:
${conversationHistory || latestMessage}

Respond directly to the user's latest query:`;

      let geminiSuccess = false;

      // 2. Query Gemini AI provider with multi-model resilience and fast-failover
      if (this.genAI) {
        const candidateModels = [
          process.env.AI_TRIAGE_MODEL || 'gemini-2.5-flash',
          'gemini-1.5-flash'
        ];

        let lastGeminiError = null;

        const callWithTimeout = (promise, ms = 3500) => {
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
          try {
            const model = this.genAI.getGenerativeModel({ model: candidateModel });
            const result = await callWithTimeout(model.generateContent(systemPrompt), 3500);
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
            // Immediate break to next provider on quota limit / timeout
            break;
          }
          if (geminiSuccess) break;
        }

        if (!geminiSuccess) {
          fallbackUsed = true;
          fallbackReason = 'Primary Google Gemini quota reached — activating high-speed cloud LLM';
        }
      }

      // 3. Resilient Secondary Cloud Provider: Groq (via GROQ_API_KEY)
      if (!process.env.GROQ_API_KEY) {
        try {
          require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
        } catch {}
      }
      const groqApiKey = process.env.GROQ_API_KEY;
      if (!geminiSuccess && groqApiKey) {
        const groqCandidateModels = [
          process.env.GROQ_MODEL || 'qwen/qwen3.8-27b',
          'openai/gpt-oss-120b'
        ];

        for (const groqModel of groqCandidateModels) {
          try {
            const axios = require('axios');
            const groqMessages = [
              { role: 'system', content: systemPrompt },
              ...(messages || []).map(m => ({
                role: m.role === 'user' ? 'user' : 'assistant',
                content: m.content
              }))
            ];

            const groqRes = await axios.post(
              'https://api.groq.com/openai/v1/chat/completions',
              {
                model: groqModel,
                messages: groqMessages,
                temperature: 0.7,
                max_tokens: 1800
              },
              {
                headers: {
                  Authorization: `Bearer ${groqApiKey}`,
                  'Content-Type': 'application/json'
                },
                timeout: 10000
              }
            );

            const groqText = groqRes.data?.choices?.[0]?.message?.content;
            if (groqText && groqText.trim().length > 0) {
              actualModelUsed = groqModel;
              provider = 'Groq Cloud';

              const latencyMs = Date.now() - startTime;
              return this.responseFormatter.formatResponse(groqText.trim(), {
                status: 'COMPLETED',
                requestedModel,
                actualModelUsed,
                provider,
                fallbackUsed: true,
                fallbackReason: 'Primary cloud model quota exceeded — routed to high-speed secondary cloud LLM',
                latencyMs
              });
            }
          } catch (groqErr) {
            fallbackUsed = true;
            fallbackReason = `Secondary cloud AI error: ${groqErr.message}`;
          }
        }
      }

      // 4. Fallback to built-in cybersecurity knowledge base (clean, friendly presentation)
      let fallbackText = generateIntelligentFallback(latestMessage);

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
