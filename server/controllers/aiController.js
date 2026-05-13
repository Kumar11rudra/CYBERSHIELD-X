const axios = require('axios');

// ─── GROQ CONFIG (Ultra-reliable, OpenAI-compatible) ──────────────────────────
const GROQ_API_KEY = process.env.GROQ_API_KEY;
const GROQ_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';
const GROQ_MODEL = 'llama3-70b-8192'; // Fast + accurate

const SYSTEM_PROMPT = `You are "CyboBot Ultra", the elite AI security sidekick for the CyberShield X platform.
Your persona is a mix of a high-tech security specialist and a friendly "Dost" (friend).

CORE CAPABILITIES & CONTEXT:
1. Live Scanner (/scan): Analyzing URLs, IPs, and Files.
2. SMS/UPI Analyzer: Detecting phishing in messages and payment links.
3. Breach Explorer (/breach-checker): Checking if personal data (email/phone) is leaked.
4. Password Security: Validating password strength and breach status.

YOUR COMMUNICATION STYLE:
- Language: Respond in the SAME language the user writes in. If they write in Hindi, reply in Hindi. If English, reply in English.
- Tone: Cyberpunk, sharp, proactive, and professional. Use emojis like 🛡️, 🤖, ⚡, 🔍.
- Structure: Clear headings or bullet points for complex answers. Keep responses concise.

ACTION TRIGGERING RULES:
If the user wants to scan something, append this at the end of your response:
[ACTION: {"type": "NAVIGATE", "payload": "/scan"}]
If they send a URL to scan:
[ACTION: {"type": "NAVIGATE_SCAN", "payload": "<the_url>"}]
If they want to check breach:
[ACTION: {"type": "NAVIGATE", "payload": "/breach-checker"}]

MANDATORY SAFETY:
- Never provide actual malicious code.
- If asked about illegal activities, refuse politely but firmly.
- You are an AI assistant; recommend real experts for critical situations.
- If user is not logged in and wants to scan, tell them to login first.`;

const { generateSecurityGuidance } = require('../services/aiService');

const processChat = async (req, res, next) => {
  try {
    const { message, context, tool } = req.body;
    const user = req.user;

    if (!message) return res.status(400).json({ error: 'Message is required' });

    const currentName = user?.preferredNickname || user?.username || 'Explorer Dost';
    const aiContext = `User: ${currentName}, Path: ${context?.currentPath || 'Dashboard'}, LoggedIn: ${context?.isLoggedIn ? 'Yes' : 'No'}`;

    const intel = await generateSecurityGuidance(tool || 'General Chat', message, aiContext);

    if (intel.error) {
      return res.status(503).json({ error: intel.error });
    }

    let rawText = intel.guidance || '🤖 No response.';

    // Action parsing logic
    let action = null;
    const actionMatch = rawText.match(/\[ACTION:\s*({.*?})\]/);
    if (actionMatch) {
      try { action = JSON.parse(actionMatch[1]); } catch (_) {}
      rawText = rawText.replace(actionMatch[0], '').trim();
    }

    return res.json({
      success: true,
      data: {
        text: rawText,
        action,
        mode: 'ultra',
        model: 'gpt-4o',
        source: intel.source
      }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = { processChat };
