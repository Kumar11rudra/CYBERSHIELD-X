const axios = require('axios');
const { detectInputType, normalizeScanTarget } = require('../utils/validators');
const { analyzeThreat } = require('../utils/threatScoring');
const cache = require('../utils/cache');
const { scanURL, scanIP: vtScanIP, scanDomain, scanHash } = require('../services/virusTotal');
const { checkIP, notApplicable } = require('../services/abuseIPDB');
const { scanDomainIntel } = require('../services/domainIntel');
const { lookupHash } = require('../services/hashLookup');
const { sendThreatAlert } = require('../services/emailAlerts');
const Scan = require('../models/Scan');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const crypto = require('crypto');
const logger = require('../utils/logger');

const { classifyIncident } = require('../services/incidentClassifier');
const SOAREngine = require('../services/soarEngine');

const sourceNotApplicable = (source, reason) => ({
  source,
  error: reason,
  notApplicable: true,
});

const performScan = async (req, res, next) => {
  try {
    const { target } = req.body;
    const normalizedTarget = normalizeScanTarget(target);
    if (!normalizedTarget) {
      return res.status(400).json({
        error: 'Invalid target. Please enter a valid URL, domain, IP address, or MD5/SHA hash.',
      });
    }

    const targetType = detectInputType(normalizedTarget);
    if (!targetType) {
      return res.status(400).json({
        error: 'Invalid target. Please enter a valid URL, domain, IP address, or MD5/SHA hash.',
      });
    }

    // CHECK CACHE
    const intelCacheKey = `intel:${targetType}:${normalizedTarget}`;
    const cachedIntel = await cache.get(intelCacheKey);

    let vtResult, abuseResult, domainIntelResult, hashlookupResult;

    if (cachedIntel) {
      ({ vtResult, abuseResult, domainIntelResult, hashlookupResult } = cachedIntel);
    } else if (targetType === 'url') {
      const hostname = new URL(normalizedTarget).hostname;
      [vtResult, abuseResult, domainIntelResult, hashlookupResult] = await Promise.all([
        scanURL(normalizedTarget),
        Promise.resolve(notApplicable('AbuseIPDB only supports IP addresses')),
        scanDomainIntel(hostname),
        Promise.resolve(sourceNotApplicable('hashlookup', 'Hashlookup only supports file hashes')),
      ]);
    } else if (targetType === 'ip') {
      [vtResult, abuseResult, domainIntelResult, hashlookupResult] = await Promise.all([
        vtScanIP(normalizedTarget),
        checkIP(normalizedTarget),
        Promise.resolve(sourceNotApplicable('domainIntel', 'Domain intelligence only supports domains and hostnames')),
        Promise.resolve(sourceNotApplicable('hashlookup', 'Hashlookup only supports file hashes')),
      ]);
    } else if (targetType === 'domain') {
      [vtResult, abuseResult, domainIntelResult, hashlookupResult] = await Promise.all([
        scanDomain(normalizedTarget),
        Promise.resolve(notApplicable('AbuseIPDB only supports IP addresses')),
        scanDomainIntel(normalizedTarget),
        Promise.resolve(sourceNotApplicable('hashlookup', 'Hashlookup only supports file hashes')),
      ]);
    } else {
      [vtResult, abuseResult, domainIntelResult, hashlookupResult] = await Promise.all([
        scanHash(normalizedTarget),
        Promise.resolve(notApplicable('AbuseIPDB only supports IP addresses')),
        Promise.resolve(sourceNotApplicable('domainIntel', 'Domain intelligence only supports domains and hostnames')),
        lookupHash(normalizedTarget),
      ]);
    }
    
    // FETCH LOCATION
    let location = null;
    try {
      let lookupTarget = "";
      if (targetType === 'ip') lookupTarget = normalizedTarget;
      else if (targetType === 'domain') lookupTarget = normalizedTarget;
      else if (targetType === 'url') lookupTarget = new URL(normalizedTarget).hostname;

      if (lookupTarget) {
        const geoRes = await axios.get(`https://ipwho.is/${lookupTarget}`, { timeout: 5000 });
        if (geoRes.data.success !== false) {
          location = {
            lat: geoRes.data.latitude,
            lon: geoRes.data.longitude,
            country: geoRes.data.country,
            city: geoRes.data.city,
            countryCode: geoRes.data.country_code
          };
        }
      }
    } catch (err) {
      console.warn('[GEO ERROR] Failed to fetch target location:', err.message);
    }

    // Calculate threat score
    const analysis = analyzeThreat({
      virusTotal: vtResult.error ? null : vtResult,
      abuseIPDB: abuseResult.error ? null : abuseResult,
      domainIntel: domainIntelResult?.error ? null : domainIntelResult,
      hashlookup: hashlookupResult?.error ? null : hashlookupResult,
    });

    // ─── SOC AUTOMATION: Classification & SOAR ──────────────────────────────
    const incident = classifyIncident({ 
      score: analysis.score, 
      tags: analysis.risk.level === 'dangerous' ? ['active-malware', 'high-risk-vector'] : [] 
    });
    
    const soarResult = await SOAREngine.orchestrateResponse(incident, { 
      target: normalizedTarget,
      type: targetType
    });

    // Save to database
    const scan = await Scan.create({
      userId: req.user._id,
      target: normalizedTarget,
      targetType,
      threatScore: analysis.score,
      riskLevel: analysis.risk.level,
      incidentTier: incident.label, // New field for enterprise auditing
      sourceScores: analysis.sourceScores,
      breakdown: {
        virusTotal: vtResult,
        abuseIPDB: abuseResult,
        domainIntel: domainIntelResult,
        hashlookup: hashlookupResult,
      },
      location,
    });

    // Update user scan count
    await User.findByIdAndUpdate(req.user._id, { $inc: { totalScans: 1 } });

    // LOG ACTIVITY: Scan Completed
    try {
      await ActivityLog.create({
        userId: req.user._id,
        action: 'SCAN_COMPLETED',
        metadata: {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          target: normalizedTarget,
          details: `Scan Score: ${analysis.score} (${analysis.risk.level})`
        }
      });
      logger.info(`[AUDIT] Scan completed by User ${req.user._id}: Target ${normalizedTarget} [${targetType}], Risk: ${analysis.risk.level}`);
    } catch (logErr) {
      console.error('[AUDIT ERROR] Failed to log scan activity:', logErr.message);
    }

    // Send email alert if dangerous
    const user = req.user;
    if (
      analysis.score >= (user.alertThreshold || 75) &&
      user.emailAlerts &&
      analysis.risk.level !== 'safe'
    ) {
      sendThreatAlert({
        to: user.email,
        username: user.username,
        scan: { ...scan.toObject(), createdAt: scan.createdAt },
      }).then(() => {
        Scan.findByIdAndUpdate(scan._id, { alertSent: true }).exec();
      });
    }

    const scanResponse = {
      id: scan._id,
      target: scan.target,
      targetType: scan.targetType,
      threatScore: analysis.score,
      risk: analysis.risk,
      sourceScores: analysis.sourceScores,
      breakdown: {
        virusTotal: vtResult,
        abuseIPDB: abuseResult,
        domainIntel: domainIntelResult,
        hashlookup: hashlookupResult,
      },
      scannedAt: scan.createdAt,
      location,
    };

    // ─── #18: Scan Result Tamper Detection (Report Integrity) ─────────────────
    // Generate an HMAC signature of the critical scan data so third-parties
    // can verify that a downloaded/exported report hasn't been maliciously altered.
    if (process.env.SCAN_HMAC_KEY) {
      const payloadToSign = `${scan._id}:${scan.target}:${analysis.score}:${analysis.risk.level}`;
      scanResponse.signature = crypto
        .createHmac('sha256', process.env.SCAN_HMAC_KEY)
        .update(payloadToSign)
        .digest('hex');
    }

    // SAVE RAW INTEL TO CACHE — only the API results, not the user-specific scan record
    // This way multiple users scanning the same target share API data but get unique scan IDs
    if (!cachedIntel) {
      await cache.set(intelCacheKey, { vtResult, abuseResult, domainIntelResult, hashlookupResult }, 86400);
    }

    res.json({
      success: true,
      scan: scanResponse,
    });
  } catch (error) {
    next(error);
  }
};

// ─── #18: Verify Scan Tamper Signature ────────────────────────────────────────
const verifyScanSignature = async (req, res) => {
  try {
    const { scanId, target, threatScore, riskLevel, signature } = req.body;
    if (!scanId || !target || threatScore === undefined || !riskLevel || !signature) {
      return res.status(400).json({ error: 'Missing required verification fields.' });
    }
    if (!process.env.SCAN_HMAC_KEY) {
      return res.status(503).json({ error: 'Scan signature verification is not configured.' });
    }
    if (!/^[a-f0-9]{64}$/i.test(String(signature))) {
      return res.status(400).json({ valid: false, error: 'Invalid signature format.' });
    }

    const payloadToSign = `${scanId}:${target}:${threatScore}:${riskLevel}`;
    const expectedSignature = crypto
      .createHmac('sha256', process.env.SCAN_HMAC_KEY)
      .update(payloadToSign)
      .digest('hex');
    const provided = Buffer.from(String(signature), 'hex');
    const expected = Buffer.from(expectedSignature, 'hex');

    if (provided.length === expected.length && crypto.timingSafeEqual(provided, expected)) {
      return res.json({ valid: true, message: 'Scan report integrity verified. No tampering detected.' });
    } else {
      return res.status(400).json({ valid: false, error: 'TAMPER DETECTED: This scan report has been altered!' });
    }
  } catch (e) {
    res.status(500).json({ error: 'Verification failed' });
  }
};

module.exports = { performScan, verifyScanSignature };
