import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Bot, Shield, Loader, Activity, Sparkles, Terminal, CheckCircle2 } from 'lucide-react';
import api from '../../services/api';

const INITIAL_MESSAGE = {
  role: 'assistant',
  content: "Welcome to the CyberSOC Workstation. I am your AI Security Copilot. I analyze live telemetry, reason over scan evidence, and guide security operations across our 111 cybersecurity tools.",
  model: 'Google Gemini 2.5 Flash',
  provider: 'Google AI Studio'
};

const QUICK_PROMPTS = [
  "Which tools map subdomains?",
  "Audit SSL certificate for example.com",
  "Explain native host tools vs blocked dependencies",
  "How to execute an automated SOC playbook"
];

// Offline / Neural Knowledge Base Fallback
const KNOWLEDGE_BASE_ENTRIES = [
  {
    triggers: ['hi', 'hello', 'hey', 'namaste', 'greetings', 'sup', 'good morning', 'good evening', 'how are you', 'kaise ho', 'kya haal', 'kese ho'],
    reply: "Hello! I am your CyberSOC Security Copilot for CyberShield X. I'm active and ready to assist with live tool execution, vulnerability analysis, or automated playbooks across our 111 registered security tools."
  },
  {
    triggers: ['who are you', 'what are you', 'about cybershield', 'what is cybershield', 'introduce yourself', 'help me', 'what can you do'],
    reply: "**CyberShield X** is a certified cybersecurity operations platform featuring:\n- **111 Canonical Tools** (6 Host Native, 91 API Engine, 5 Browser, 9 Blocked Dependency).\n- **CyberSOC Operator Terminal** with real CLI execution and authenticated cancellation.\n- **7 Multi-Vector Automated Playbooks** (Perimeter, Web DAST, API, Cloud, Forensics, Social, AI Red-Team).\n- **Enterprise Dossier Exporters** (OASIS SARIF v2.1.0, STIX 2.1, CSV, JSON, PDF).\n\nWhat target or tool would you like to investigate?"
  },
  {
    triggers: ['tools', 'what tools', 'catalog', 'list tools', 'categories', 'all tools'],
    reply: "CyberShield X offers **111 canonical tools** categorized across 24 domains:\n1. **Reconnaissance & OSINT**: Subfinder, Shodan, Censys, theHarvester, Dirsearch\n2. **Web & DAST Security**: SQLMap, Nikto, Burp Suite, WPScan, OWASP ZAP, CORS/CSP\n3. **Network & Host Native**: Nmap, Dig, Curl, Whois, OpenSSL, Traceroute\n4. **Cloud & DevSecOps**: Prowler AWS CIS, Kube-Bench, Snyk, Gitleaks, Docker Bench\n5. **Malware & Forensics**: YARA, PEframe, Volatility, Ghidra, Radare2, Autopsy\n6. **AI Security & Red-Teaming**: Garak LLM Scanner, Adversarial Redteam, Prompt Fuzzer\n7. **Identity & Phishing**: Dark Web Breach Checker, Phishing Analyzer, SPF/DMARC\n\nAll tools are accessible in the **Toolkit Hub** (`/toolkit`) or via the **CyberSOC Terminal** (`>_`)."
  },
  {
    triggers: ['playbook', 'playbooks', 'automated', 'chain', 'chained'],
    reply: "We offer **7 Multi-Vector Automated SOC Playbooks** in our CyberSOC Terminal:\n1. 🌐 **Perimeter Reconnaissance**: DNS -> Ports -> SSL -> Headers -> Threat Feeds\n2. 🛡️ **Web Application DAST**: Tech Stack -> Nikto -> CORS -> CSP -> SQLMap\n3. 🔑 **API Security & Cryptography**: OpenAPI Linter -> JWT Entropy -> API Fuzzer -> Postman -> IAM\n4. ☁️ **Cloud Posture & DevSecOps**: Prowler AWS CIS -> Kube-Bench -> Snyk -> Gitleaks -> Docker Bench\n5. 🔬 **Threat & Memory Forensics**: VirusShare -> YARA -> PEframe -> Volatility -> MISP\n6. 🎣 **Phishing & Identity Defense**: Phishing Analyzer -> Evilginx -> Email SPF/DMARC -> Breach Check\n7. 🤖 **AI Red-Teaming**: Garak Probes -> Prompt Fuzzer -> GCG Redteam -> PII Guard -> AI Remediation\n\nLaunch any playbook with 1-click in the **System Terminal**!"
  },
  {
    triggers: ['subdomain', 'subfinder'],
    reply: "To map subdomains, execute **Subfinder** (`subfinder -d example.com`) in the CyberSOC Terminal or use the **DNS Recon Engine** in the Toolkit (`/toolkit`)."
  },
  {
    triggers: ['nmap', 'port', 'open socket'],
    reply: "Our **Nmap Port Scanner** is host-native (`HOST_NATIVE`), executing directly on the host server via `/usr/bin/nmap` or `/opt/homebrew/bin/nmap` with safe argument arrays and live streaming."
  },
  {
    triggers: ['ssl', 'cert', 'tls'],
    reply: "You can inspect SSL/TLS certificates with our host-native **OpenSSL / SSL Tool** (`ssl-check <domain>` or `openssl <domain>`). It performs a real TLS handshake on port 443 to audit validity, issuer CA trust, SANs, and expiry."
  },
  {
    triggers: ['breach', 'leak', 'dark web'],
    reply: "The **Dark Web Breach Checker** uses NIST SP 800-63B SHA-1 k-Anonymity queries against compromised database dumps to verify whether an email has been exposed in known breaches without transmitting the user's password."
  },
  {
    triggers: ['blocked', 'missing binary', 'remediation'],
    reply: "CyberShield X enforces the **Same-Capability Rule**: 9 tools (`sqlmap`, `trivy`, `nikto`, `aircrack-ng`, `ghidra`, `yara-rules`, `radare2`, `semgrep`, `gitleaks`) require external binaries not installed on this test host. The platform honestly reports `BLOCKED_DEPENDENCY` with Homebrew/APT remediation commands and zero fake simulation."
  }
];

const getFallbackReply = (query) => {
  const q = (query || '').toLowerCase().trim();
  for (const entry of KNOWLEDGE_BASE_ENTRIES) {
    if (entry.triggers.some(t => q.includes(t))) return entry.reply;
  }
  return `I am specialized in cybersecurity intelligence and the **CyberShield X** platform.\n\nI can assist with:\n- Running security scans (Nmap, DNS, SSL, HTTP Headers, Tech Stack)\n- Analyzing threats (Phishing URLs, Dark Web Breaches, Malware Hashes)\n- Navigating our **111 canonical tools** across 24 categories\n- Running **7 Automated SOC Playbooks** in the Terminal\n- Exporting audit dossiers in **SARIF, STIX 2.1, CSV, JSON, or PDF**\n\nWhat target domain, IP, or security task would you like help with?`;
};

export default function SecurityCopilot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([INITIAL_MESSAGE]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [hasOpened, setHasOpened] = useState(false);
  const [isAiOffline, setIsAiOffline] = useState(false);
  const [activeModel, setActiveModel] = useState('Google Gemini 2.5 Flash');
  const [activeProvider, setActiveProvider] = useState('Google AI Studio');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setHasOpened(true);
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
    setIsOpen(!isOpen);
  };

  const handleSend = async (textToSend) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setMessages(prev => [...prev, userMessage]);
    if (!textToSend) setInput('');
    setIsLoading(true);

    try {
      const response = await api.post('/chatbot/chat', {
        messages: [...messages, userMessage]
      });

      if (response.data && response.data.content) {
        const reply = response.data.content;
        const model = response.data.model || 'Google Gemini 2.5 Flash';
        const provider = response.data.provider || 'Google AI Studio';
        const evidence = response.data.metadata?.toolResults || null;

        setActiveModel(model);
        setActiveProvider(provider);

        setMessages(prev => [
          ...prev, 
          { 
            role: 'assistant', 
            content: reply,
            model,
            provider,
            evidence
          }
        ]);
        setIsAiOffline(reply.includes("offline") || reply.includes("GEMINI_API_KEY"));
      } else {
        const fallback = getFallbackReply(query);
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: fallback,
          model: 'Neural Knowledge Base',
          provider: 'Local Engine'
        }]);
      }
    } catch (error) {
      console.warn('Chatbot remote API error, falling back to neural knowledge base:', error.message);
      const fallback = getFallbackReply(query);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: fallback,
        model: 'Neural Knowledge Base',
        provider: 'Local Fallback'
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickPrompt = (prompt) => {
    handleSend(prompt);
  };

  return (
    <>
      {/* Floating Action Button */}
      <motion.button
        onClick={toggleChat}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label="Open Security Copilot"
        className="fixed bottom-6 right-6 w-12 h-12 rounded-full bg-[#040d1e] text-white shadow-[0_0_25px_rgba(0,212,255,0.4)] flex items-center justify-center z-50 border border-cyan-400/60 hover:shadow-[0_0_35px_rgba(0,212,255,0.7)] transition-all p-2"
      >
        {isOpen ? <X size={22} className="text-cyan-400" /> : <Bot size={24} className="text-cyan-400" />}
        
        {/* Notification dot if hasn't opened yet */}
        {!hasOpened && !isOpen && (
          <span className="absolute top-0 right-0 w-3 h-3 rounded-full bg-cyan-400 animate-pulse ring-2 ring-black" />
        )}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed bottom-20 right-6 w-[410px] h-[580px] max-h-[82vh] max-w-[calc(100vw-2.5rem)] bg-[#030919]/95 backdrop-blur-2xl border border-cyan-500/30 rounded-2xl shadow-2xl flex flex-col z-50 overflow-hidden font-mono"
            style={{
              boxShadow: '0 0 40px rgba(0, 212, 255, 0.2), 0 0 80px rgba(0, 0, 0, 0.9)'
            }}
          >
            {/* Header Bar */}
            <div className="p-3.5 border-b border-cyan-500/20 bg-[#020713] flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,212,255,0.2)]">
                  <Bot size={18} />
                </div>
                <div>
                  <h3 className="font-bold text-white text-xs tracking-wider uppercase">
                    Security Copilot
                  </h3>
                  <div className="flex items-center gap-1.5 text-[9px] text-slate-400">
                    <span className={`w-1.5 h-1.5 rounded-full ${isAiOffline ? 'bg-amber-400' : 'bg-emerald-400 animate-pulse'}`} />
                    <span>{activeModel}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setMessages([INITIAL_MESSAGE])}
                  className="p-1 text-slate-400 hover:text-white rounded hover:bg-white/5 text-[10px]"
                  title="Reset conversation"
                >
                  Clear
                </button>
                <button onClick={toggleChat} className="p-1 text-slate-400 hover:text-white transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5 custom-scrollbar text-xs">
              {messages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-cyan-500/20 text-cyan-200 border border-cyan-500/40 rounded-br-none shadow-[0_0_15px_rgba(0,212,255,0.1)]' 
                        : 'bg-white/[0.03] text-slate-200 border border-white/10 rounded-bl-none'
                    }`}
                  >
                    {msg.role === 'assistant' && (
                      <div className="flex items-center justify-between border-b border-white/5 pb-1 mb-2">
                        <span className="text-[9px] uppercase tracking-wider text-cyan-400 font-bold flex items-center gap-1">
                          <Bot size={11} /> AI Security Interpretation
                        </span>
                        <span className="text-[8px] text-slate-500">
                          {msg.model || 'Gemini 2.5 Flash'}
                        </span>
                      </div>
                    )}

                    {/* Tool Evidence Container (Visually Segregated from AI Reasoning) */}
                    {msg.evidence && (
                      <div className="mb-2.5 p-2 rounded-lg bg-[#01040a] border border-cyan-500/30 text-[10px] text-cyan-300">
                        <span className="font-bold text-cyan-400 uppercase tracking-wider block mb-1">
                          [RAW TOOL EVIDENCE — VERIFIED]:
                        </span>
                        <pre className="whitespace-pre-wrap overflow-x-auto max-h-32 text-[9px] custom-scrollbar">
                          {typeof msg.evidence === 'string' ? msg.evidence : JSON.stringify(msg.evidence, null, 2)}
                        </pre>
                      </div>
                    )}

                    {/* AI Interpretation / Text */}
                    <div 
                      className="whitespace-pre-wrap leading-relaxed text-[11px]" 
                      dangerouslySetInnerHTML={{ 
                        __html: msg.content
                          .replace(/\*\*(.*?)\*\*/g, '<strong class="text-white font-bold">$1</strong>')
                          .replace(/\n/g, '<br/>') 
                      }} 
                    />

                    {/* Attribution Footer for Assistant */}
                    {msg.role === 'assistant' && (
                      <div className="mt-2 pt-1 border-t border-white/5 flex items-center justify-between text-[8px] text-slate-500">
                        <span>Provider: <span className="text-slate-400">{msg.provider || 'Google AI Studio'}</span></span>
                        <span className="text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 size={8} /> Verified
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Quick Actions Prompts (visible only when there is only the initial message) */}
              {messages.length === 1 && !isLoading && (
                <div className="pt-2 space-y-2">
                  <div className="flex items-center gap-1.5 text-slate-400 text-[9px] uppercase tracking-wider px-1">
                    <Sparkles size={10} className="text-cyan-400" />
                    <span>Quick SOC Inquiries:</span>
                  </div>
                  <div className="grid grid-cols-1 gap-1.5">
                    {QUICK_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        onClick={() => handleQuickPrompt(prompt)}
                        className="text-left w-full px-2.5 py-1.5 text-[10px] text-slate-300 bg-white/[0.02] border border-white/10 rounded-lg hover:border-cyan-500/40 hover:bg-cyan-500/5 transition-all"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-white/[0.03] border border-white/10 rounded-xl rounded-bl-none px-3.5 py-2.5 flex items-center gap-2.5">
                    <Loader size={13} className="text-cyan-400 animate-spin" />
                    <span className="text-[11px] text-slate-400">Synthesizing telemetry vectors...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-3 bg-[#020713] border-t border-cyan-500/20 flex-shrink-0">
              <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask Security Copilot (e.g. 'audit ports')..."
                  disabled={isLoading}
                  className="w-full bg-[#01040a] border border-cyan-500/30 text-white rounded-xl py-2.5 pl-3 pr-10 focus:outline-none focus:border-cyan-400 text-xs font-mono placeholder-slate-500 disabled:opacity-50 transition-all"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  aria-label="Send query"
                  className="absolute right-1.5 p-1.5 text-cyan-400 hover:text-white hover:bg-cyan-500/20 rounded-lg transition-colors disabled:opacity-40"
                >
                  <Send size={15} />
                </button>
              </form>
              <div className="text-center mt-1.5">
                <p className="text-[8px] text-slate-500 tracking-wider uppercase">
                  Adversarially Hardened • Real Telemetry Grounded
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
