/**
 * CyberShield X — Threat Scoring Engine
 * Combines multiple threat intelligence signals into a unified score.
 */

/**
 * Calculate threat score from VirusTotal results
 * @param {Object} vtData - VirusTotal API response
 * @returns {number} 0-100 score
 */
const scoreVirusTotal = (vtData) => {
  if (!vtData || vtData.error) return null;

  const { malicious = 0, suspicious = 0, total = 0 } = vtData;
  if (total === 0) return 0;

  // Weight: malicious = full weight, suspicious = half weight
  const weightedMalicious = malicious + suspicious * 0.5;
  const ratio = weightedMalicious / total;

  // Non-linear scale: small number of detections = big jump
  return Math.min(100, Math.round(ratio * 100 * 1.5));
};

/**
 * Calculate threat score from AbuseIPDB results
 * @param {Object} abuseData - AbuseIPDB API response
 * @returns {number} 0-100 score
 */
const scoreAbuseIPDB = (abuseData) => {
  if (!abuseData || abuseData.error) return null;

  const {
    abuseConfidenceScore = 0,
    totalReports = 0,
    isWhitelisted = false,
  } = abuseData;

  if (isWhitelisted) return 0;

  // Base score from confidence percentage
  let score = abuseConfidenceScore;

  // Boost if many reports
  if (totalReports > 100) score = Math.min(100, score + 10);
  if (totalReports > 500) score = Math.min(100, score + 10);

  return Math.round(score);
};

const scoreDomainIntel = (domainData) => {
  if (!domainData || domainData.error) return null;
  if (typeof domainData.riskScore !== 'number') return null;
  return Math.max(0, Math.min(100, Math.round(domainData.riskScore)));
};

const scoreHashlookup = (hashData) => {
  if (!hashData || hashData.error) return null;

  if (hashData.found === false) return 35;

  const trust = typeof hashData.trust === 'number' ? hashData.trust : 50;
  if (trust >= 80) return 0;
  if (trust >= 60) return 10;
  if (trust >= 50) return 20;
  if (trust >= 30) return 45;
  return 70;
};

/**
 * Combine multiple source scores into a final threat score
 * @param {Object} scores - Map of source name to score (null = unavailable)
 * @returns {number} Final combined 0-100 score
 */
const combineScores = (scores) => {
  const weights = {
    virusTotal: 0.55,
    abuseIPDB: 0.35,
    domainIntel: 0.45,
    hashlookup: 0.2,
  };

  let weightedSum = 0;
  let totalWeight = 0;

  for (const [source, score] of Object.entries(scores)) {
    if (score !== null && score !== undefined && weights[source]) {
      weightedSum += score * weights[source];
      totalWeight += weights[source];
    }
  }

  if (totalWeight === 0) return 0;
  return Math.round(weightedSum / totalWeight);
};

/**
 * Map a numeric score to a risk level
 * @param {number} score - 0-100
 * @returns {{ level: string, color: string, label: string }}
 */
const getRiskLevel = (score) => {
  if (score <= 20) return { level: 'safe', color: '#00ff88', label: 'Safe' };
  if (score <= 50) return { level: 'low', color: '#ffdd00', label: 'Low Risk' };
  if (score <= 75) return { level: 'medium', color: '#ff8c00', label: 'Medium Risk' };
  return { level: 'dangerous', color: '#ff2244', label: 'Dangerous' };
};

/**
 * Master threat analysis function
 * @param {Object} apiResults - { virusTotal: vtData, abuseIPDB: abuseData }
 * @returns {Object} Full threat analysis result
 */
const analyzeThreat = (apiResults) => {
  const vtScore = scoreVirusTotal(apiResults.virusTotal);
  const abuseScore = scoreAbuseIPDB(apiResults.abuseIPDB);
  const domainScore = scoreDomainIntel(apiResults.domainIntel);
  const hashlookupScore = scoreHashlookup(apiResults.hashlookup);

  const sourceScores = {
    ...(vtScore !== null && { virusTotal: vtScore }),
    ...(abuseScore !== null && { abuseIPDB: abuseScore }),
    ...(domainScore !== null && { domainIntel: domainScore }),
    ...(hashlookupScore !== null && { hashlookup: hashlookupScore }),
  };

  const finalScore = combineScores(sourceScores);
  const risk = getRiskLevel(finalScore);

  return {
    score: finalScore,
    risk,
    sourceScores,
    breakdown: {
      virusTotal: apiResults.virusTotal,
      abuseIPDB: apiResults.abuseIPDB,
      domainIntel: apiResults.domainIntel,
      hashlookup: apiResults.hashlookup,
    },
    analyzedAt: new Date().toISOString(),
  };
};

module.exports = {
  analyzeThreat,
  getRiskLevel,
  scoreVirusTotal,
  scoreAbuseIPDB,
  scoreDomainIntel,
  scoreHashlookup,
};
