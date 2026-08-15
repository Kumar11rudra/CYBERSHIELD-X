'use strict';

const mongoose = require('mongoose');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const Scan = require('../models/Scan');
const AIAnalysis = require('../models/AIAnalysis');
const logger = require('../utils/logger');

// In-flight deduplication: scanId → Promise
const _inFlight = new Map();

/**
 * Safely strip a raw Gemini text response to a JSON object.
 * Returns null on failure.
 */
const _parseGeminiJSON = (text) => {
  try {
    let cleaned = text.trim();
    // Strip markdown fences
    cleaned = cleaned.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
};

/**
 * Validate the parsed AI report against the expected schema.
 * Fails fast for missing required fields.
 */
const _validateReport = (obj) => {
  if (!obj || typeof obj !== 'object') return false;
  if (typeof obj.executiveSummary !== 'string' || obj.executiveSummary.trim().length < 10) return false;
  if (!['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].includes(obj.riskLevel)) return false;
  if (!Array.isArray(obj.findings)) return false;
  if (!Array.isArray(obj.remediationRoadmap)) return false;
  return true;
};

/**
 * Construct a minimal, safe AI input payload from a Scan document.
 * Never forwards credentials, tokens, or full raw breakdown objects.
 */
const _buildScanContext = (scan) => ({
  target: scan.target,
  targetType: scan.targetType,
  threatScore: scan.threatScore,
  riskLevel: scan.riskLevel,
  scanType: scan.scanType || 'general',
  incidentTier: scan.incidentTier || null,
  sourceScores: scan.sourceScores || {},
  tags: scan.tags || [],
  location: scan.location
    ? { country: scan.location.country, city: scan.location.city }
    : null,
  scannedAt: scan.createdAt,
});

/**
 * Generate an AI triage report for a scan, using the Gemini provider
 * already configured in the project (GEMINI_API_KEY env var).
 *
 * POST /api/ai/analyze-scan
 * Body: { scanId: string }
 *
 * Returns: { success: true, analysis: {...}, source: 'ai' | 'cached' }
 */
exports.analyzeScan = async (req, res) => {
  const { scanId } = req.body;
  const userId = req.user?._id;

  // ── 1. Input validation ────────────────────────────────────────────────────
  if (!scanId) {
    return res.status(400).json({ success: false, error: 'scanId is required.' });
  }
  if (!mongoose.Types.ObjectId.isValid(scanId)) {
    return res.status(400).json({ success: false, error: 'Invalid scanId format.' });
  }

  try {
    // ── 2. Load and authorize scan ─────────────────────────────────────────
    const scan = await Scan.findById(scanId).lean();
    if (!scan) {
      return res.status(404).json({ success: false, error: 'Scan not found.' });
    }

    // Authorization: the scan must belong to the authenticated user OR be public OR user has admin/owner privileges.
    const ownedByUser = scan.userId && String(scan.userId) === String(userId);
    const isPublic = scan.isPublic === true;
    const isAdmin = req.user?.role === 'admin' || req.user?.role === 'owner' || req.user?.role === 'superadmin';
    if (!ownedByUser && !isPublic && !isAdmin) {
      return res.status(403).json({ success: false, error: 'Access denied.' });
    }

    // ── 3. Return existing analysis if present ─────────────────────────────
    const existing = await AIAnalysis.findOne({ scanId: scan._id }).lean();
    if (existing) {
      logger.info(`[AI-TRIAGE] Returning cached AIAnalysis for scan ${scanId}`);
      const formattedExistingFindings = Array.isArray(existing.findings)
        ? existing.findings.map(f => typeof f === 'string' ? f : `[${f.severity || 'INFO'}] ${f.title || 'Finding'}${f.evidence ? ` — ${f.evidence}` : ''}`)
        : [];
      return res.json({
        success: true,
        analysis: {
          executiveSummary: existing.executiveSummary,
          findings: formattedExistingFindings,
          recommendations: existing.recommendations,
          remediationPlan: existing.remediationPlan,
          durationMs: existing.durationMs || 0,
          createdAt: existing.createdAt,
        },
        source: 'cached',
      });
    }

    // ── 4. In-flight deduplication ─────────────────────────────────────────
    if (_inFlight.has(scanId)) {
      logger.info(`[AI-TRIAGE] Awaiting in-flight generation for scan ${scanId}`);
      try {
        const result = await _inFlight.get(scanId);
        return res.json({ success: true, analysis: result, source: 'ai' });
      } catch (err) {
        return res.status(502).json({ success: false, error: 'AI analysis generation failed.' });
      }
    }

    // ── 5. Check API key ───────────────────────────────────────────────────
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      logger.warn('[AI-TRIAGE] GEMINI_API_KEY not configured.');
      return res.status(503).json({
        success: false,
        error: 'AI triage is currently offline. Configure GEMINI_API_KEY to enable this feature.',
      });
    }

    // ── 6. Generate AI analysis (coalesced) ───────────────────────────────
    const generationPromise = (async () => {
      const startTime = Date.now();
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: process.env.AI_TRIAGE_MODEL || 'gemini-2.5-flash' });

      const scanContext = _buildScanContext(scan);

      const prompt = `You are a senior cybersecurity analyst performing a structured triage of a security scan result.

Analyze the following scan data and produce a professional, actionable security triage report.

SCAN DATA:
${JSON.stringify(scanContext, null, 2)}

STRICT RULES:
1. Only analyze the scan data provided above. Do not invent ports, vulnerabilities, CVEs, or evidence not present in the data.
2. Distinguish clearly between confirmed observations and inferences.
3. Do not claim exploitation unless the scan data confirms it.
4. If uncertain, state uncertainty explicitly.
5. Keep recommendations specific and actionable.
6. Risk levels: LOW, MEDIUM, HIGH, CRITICAL only.

OUTPUT FORMAT — respond ONLY with valid JSON (no markdown, no extra text):
{
  "executiveSummary": "A concise 2-4 sentence summary of the scan outcome and overall risk posture.",
  "riskLevel": "LOW | MEDIUM | HIGH | CRITICAL",
  "findings": [
    {
      "title": "Short finding title",
      "severity": "LOW | MEDIUM | HIGH | CRITICAL",
      "evidence": "What the scan data shows",
      "impact": "Potential impact if exploited",
      "recommendation": "Specific remediation action"
    }
  ],
  "remediationRoadmap": [
    {
      "priority": 1,
      "action": "Specific action to take",
      "reason": "Why this action is important"
    }
  ]
}`;

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      const parsed = _parseGeminiJSON(responseText);

      if (!_validateReport(parsed)) {
        logger.warn(`[AI-TRIAGE] AI returned malformed or invalid report for scan ${scanId}`);
        throw new Error('AI returned an invalid structured report.');
      }

      const durationMs = Date.now() - startTime;

      // ── 7. Persist validated analysis ─────────────────────────────────
      // Format findings as clean strings so client components & PDF exporter never crash on plain objects
      const formattedFindings = Array.isArray(parsed.findings)
        ? parsed.findings.map(f => {
            if (typeof f === 'string') return f;
            if (f && typeof f === 'object') {
              const sev = f.severity ? `[${f.severity}] ` : '';
              const title = f.title || 'Finding';
              const detail = f.evidence ? ` — ${f.evidence}` : (f.impact ? ` — ${f.impact}` : '');
              return `${sev}${title}${detail}`;
            }
            return String(f);
          })
        : [];

      // Map structured Gemini output to the existing AIAnalysis schema fields.
      const analysisDoc = new AIAnalysis({
        scanId: scan._id,
        model: process.env.AI_TRIAGE_MODEL || 'gemini-2.5-flash',
        durationMs,
        executiveSummary: parsed.executiveSummary.trim(),
        findings: formattedFindings,
        recommendations: parsed.remediationRoadmap.map(r => `[Priority ${r.priority || 1}] ${r.action} — ${r.reason}`),
        remediationPlan: parsed.remediationRoadmap.map(r => `${r.priority || 1}. ${r.action}`).join('\n'),
        metadata: {
          scannedAt: scan.createdAt,
          threatScore: scan.threatScore,
          riskLevel: scan.riskLevel,
        },
      });

      await analysisDoc.save();
      logger.info(`[AI-TRIAGE] AIAnalysis saved for scan ${scanId} (Generation: ${durationMs}ms)`);

      return {
        executiveSummary: analysisDoc.executiveSummary,
        findings: analysisDoc.findings,
        recommendations: analysisDoc.recommendations,
        remediationPlan: analysisDoc.remediationPlan,
        durationMs: analysisDoc.durationMs,
        createdAt: analysisDoc.createdAt,
      };
    })();

    // Register the in-flight promise so concurrent requests coalesce.
    _inFlight.set(scanId, generationPromise);

    let analysis;
    try {
      analysis = await generationPromise;
    } finally {
      _inFlight.delete(scanId);
    }

    return res.json({ success: true, analysis, source: 'ai' });

  } catch (err) {
    // Never expose internal error details to the client.
    logger.error(`[AI-TRIAGE] Unhandled error for scan ${scanId}: ${err.message}`);
    return res.status(500).json({ success: false, error: 'AI triage encountered an internal error.' });
  }
};
