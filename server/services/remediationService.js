const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const logger = require('../utils/logger');

// TTL cache: 24 hours
const cache = new Map();
const TTL_MS = 24 * 60 * 60 * 1000;

const getFromCache = (cve) => {
  const cached = cache.get(cve);
  if (cached) {
    if (cached.expiresAt > Date.now()) {
      logger.info(`[REMEDIATION-CACHE] Cache hit for ${cve}`);
      return cached.data;
    } else {
      logger.info(`[REMEDIATION-CACHE] Expiring cache entry for ${cve}`);
      cache.delete(cve);
    }
  }
  return null;
};

const setToCache = (cve, data) => {
  cache.set(cve, {
    data,
    expiresAt: Date.now() + TTL_MS,
  });
  logger.info(`[REMEDIATION-CACHE] Cached result for ${cve} (TTL: 24h)`);
};

/**
 * Generate fallback remediation plan
 */
const getFallbackRemediation = (cve) => {
  return {
    executiveSummary: `This remediation plan addresses the vulnerability ${cve} detected on your infrastructure. Implementing this guidance helps reduce the risk surface.`,
    rootCause: `The vulnerability ${cve} is typically caused by software version obsolescence or configuration flaws that permit unauthorized manipulation or information leakage.`,
    recommendedFix: `1. Identify the software component mapping to ${cve}.\n2. Upgrade the service or library to the vendor's patched version.\n3. Configure default firewalls to isolate critical ports from general web exposure.`,
    verificationChecklist: `- [ ] Verify the application of the package/system patch.\n- [ ] Execute an asset port scan to verify the service is secure.\n- [ ] Monitor logs to identify any subsequent scan attempts.`,
    references: `- NVD Advisory: https://nvd.nist.gov/vuln/detail/${cve}\n- Vendor Patches: Reference the official CVE advisory page.`
  };
};

/**
 * Clean LLM response to extract clean JSON if LLM outputs markdown formatting
 */
const cleanJsonResponse = (text) => {
  try {
    let clean = text.trim();
    if (clean.startsWith('```json')) {
      clean = clean.substring(7);
    }
    if (clean.endsWith('```')) {
      clean = clean.substring(0, clean.length - 3);
    }
    return JSON.parse(clean.trim());
  } catch (err) {
    logger.warn(`[REMEDIATION] AI output not strict JSON, converting to object: ${err.message}`);
    // Parsing helper to build object from plain text sections
    const obj = {};
    const sections = [
      { key: 'executiveSummary', label: 'Executive Summary' },
      { key: 'rootCause', label: 'Root Cause' },
      { key: 'recommendedFix', label: 'Recommended Fix' },
      { key: 'verificationChecklist', label: 'Verification Checklist' },
      { key: 'references', label: 'References' },
    ];
    sections.forEach((sec, idx) => {
      const startIdx = text.toLowerCase().indexOf(sec.label.toLowerCase());
      if (startIdx !== -1) {
        const nextSec = sections[idx + 1];
        const endIdx = nextSec ? text.toLowerCase().indexOf(nextSec.label.toLowerCase()) : text.length;
        obj[sec.key] = text.substring(startIdx + sec.label.length, endIdx).replace(/^[:\-\*\s]+/, '').trim();
      }
    });
    return {
      executiveSummary: obj.executiveSummary || text.substring(0, 150) + '...',
      rootCause: obj.rootCause || 'Undetermined root cause.',
      recommendedFix: obj.recommendedFix || 'Apply generic vendor patch.',
      verificationChecklist: obj.verificationChecklist || '- [ ] Run vulnerability verification scan.',
      references: obj.references || `CVE: https://nvd.nist.gov/vuln/detail`,
    };
  }
};

/**
 * Generate remediation plan from LLM (Gemini or Ollama) or fallback
 */
const generateRemediationPlan = async (cve, contextInfo = '') => {
  if (!cve) return getFallbackRemediation('N/A');

  // Check cache first
  const cached = getFromCache(cve);
  if (cached) return cached;

  const prompt = `You are an expert Cybersecurity Incident Responder and AI Security Assistant.
Provide a detailed vulnerability remediation plan for "${cve}" based on this context: "${contextInfo}".

Output your response in STRICT JSON format with EXACTLY these fields (no extra text outside the JSON block):
{
  "executiveSummary": "Brief overview of what this vulnerability is and why it matters.",
  "rootCause": "Technical cause of this vulnerability (e.g. buffer overflow, missing input validation).",
  "recommendedFix": "Detailed, step-by-step instructions on how to patch or mitigate this vulnerability.",
  "verificationChecklist": "Checklist items starting with '- [ ] ' describing how to verify that the vulnerability is successfully remediated.",
  "references": "Useful links, vendor advisories, or reference details."
}`;

  // 1. Try Gemini API
  if (process.env.GEMINI_API_KEY) {
    try {
      logger.info(`[REMEDIATION] Querying Gemini for ${cve}...`);
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      const plan = cleanJsonResponse(text);
      setToCache(cve, plan);
      return plan;
    } catch (err) {
      logger.warn(`[REMEDIATION] Gemini generation failed: ${err.message}. Trying Ollama...`);
    }
  }

  // 2. Try Ollama (Local Llama)
  const ollamaUrl = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
  try {
    logger.info(`[REMEDIATION] Querying Ollama for ${cve}...`);
    const response = await axios.post(`${ollamaUrl}/api/chat`, {
      model: 'llama3',
      messages: [
        { role: 'user', content: prompt }
      ],
      stream: false
    }, { timeout: 8000 });

    if (response.data && response.data.message && response.data.message.content) {
      const plan = cleanJsonResponse(response.data.message.content);
      setToCache(cve, plan);
      return plan;
    }
  } catch (err) {
    logger.warn(`[REMEDIATION] Ollama execution failed: ${err.message}. Serving signature fallback.`);
  }

  // 3. Fallback to signature templates
  const fallbackPlan = getFallbackRemediation(cve);
  setToCache(cve, fallbackPlan);
  return fallbackPlan;
};

module.exports = {
  generateRemediationPlan,
  getFallbackRemediation,
  clearCache: () => cache.clear(),
};
