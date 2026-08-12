const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * AIOrchestrator Service
 * Central coordinator. Contains NO business logic.
 * Uses Dependency Injection to coordinate other modules.
 */
class AIOrchestrator {
  /**
   * Constructs the AIOrchestrator.
   * @param {Object} deps - Injected dependencies.
   * @param {Object} deps.contextAggregator - ContextAggregator instance.
   * @param {Object} deps.memoryManager - MemoryManager instance.
   * @param {Object} deps.permissionManager - PermissionManager instance.
   * @param {Object} deps.policyEngine - PolicyEngine instance.
   * @param {Object} deps.responseFormatter - ResponseFormatter instance.
   * @param {Object} deps.runtimePipeline - RuntimePipeline instance.
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
      // 1. Get Unified Application Snapshot
      const snapshotResult = await this.contextAggregator.generateSnapshot(req);
      const appSnapshot = snapshotResult.data.snapshot;
      
      const latestMessage = messages[messages.length - 1].content;
      
      // 2. Check if Gemini AI provider is configured
      if (this.genAI) {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const systemPrompt = `You are CyberShield X Copilot, an AI assistant built to help security analysts.
You have access to the Nexus Security Toolkit catalog.
Here is the available tools catalog:
- dns: DNS Enumeration Engine (LIVE). Query primary DNS records (A, MX, NS) and discover subdomains.
- whois: WHOIS Record Engine (LIVE). Query public records for domain ownership data.
- port: Port Scanner (LIVE). Discover open ports and network services on target hosts.
- tech_detection: Technology Detection Engine (LIVE). Identify remote tech stacks, CMS, frameworks.
- http: HTTP Security Headers Audit (LIVE). Audit HTTP headers and server configurations.
- ssl: SSL/TLS Certificate Audit (LIVE). Inspect active TLS protocols and certificates.
- phishing: Phishing URL Detection (LIVE). Analyze URL structures, brands, heuristics.
- remediation: AI Remediation Planner (PARTIAL). Configure external Gemini provider to suggest remediation playbooks.
- breach: Breach Checker (PARTIAL). Dark web email compromise checks.
- jwt-parser: JWT Security Decoder (LIVE). Decode and inspect JWT tokens.
- base64-decoder: Base64 Converter (LIVE). Base64 encoder/decoder utility.
- url-sanitizer: URL Sanitizer (LIVE). Parse and sanitize query parameters.
- sms: SMS Analyzer (LIVE). Heuristic smishing text scanner.
- upi: UPI Verifier (LIVE). UPI VPA pattern validator.
- All other tools (Subfinder, Dnsx, WhatWeb, Nmap Scanner, Nikto Web Scanner, SQLmap Injection Audit, Trivy Container Audit, OWASP ZAP, Burp Suite, Autopsy, Volatility, Ghidra, Radare2, Prompt Injection Guard) are UPCOMING (Coming Soon) and NOT yet executable.

Current System Snapshot context:
${JSON.stringify(appSnapshot || {})}

User request: "${latestMessage}"

Instructions:
1. Provide a professional, helpful security response.
2. If the user asks which tool to use or wants to scan a target, guide them to the appropriate Nexus tool ID or explain that the tool is upcoming or partial.
3. Keep the response concise and in clear Markdown format. Do not fabricate scan execution results unless a capability was actually ran by the system pipeline.
`;

        const result = await model.generateContent(systemPrompt);
        const responseText = result.response.text();
        return this.responseFormatter.formatResponse(responseText, { status: 'COMPLETED' });
      }

      // 3. Fallback: transparently indicate that the AI model is offline (not configured)
      return this.responseFormatter.formatResponse(
        "CyberShield X Copilot is currently offline. To enable intelligent security recommendations and AI-driven playbooks, please configure GEMINI_API_KEY in the server environment configuration file.",
        { status: 'OFFLINE' }
      );
    } catch (error) {
      console.error('AIOrchestrator Error:', error);
      return this.responseFormatter.formatError('Internal system error occurred.', 'SYSTEM_ERROR');
    }
  }
}

module.exports = AIOrchestrator;
