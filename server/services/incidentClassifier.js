/**
 * 🛰️ Nexus Incident Classifier
 * Automatically classifies threats into severity tiers and suggests response workflows.
 */

const SEVERITY_TIERS = {
  CRITICAL: {
    label: 'CRITICAL',
    minScore: 90,
    color: '#ff2244',
    action: 'IMMEDIATE_BLOCK',
    description: 'Confirmed malicious node with high confidence signals.'
  },
  HIGH: {
    label: 'HIGH',
    minScore: 70,
    color: '#ff8c00',
    action: 'ISOLATION_RECOMMENDED',
    description: 'Multiple suspicious pulses detected from known threat vectors.'
  },
  MEDIUM: {
    label: 'MEDIUM',
    minScore: 40,
    color: '#ffdd00',
    action: 'WATCHLIST_ADD',
    description: 'Anomalous behavior detected. Requires operator verification.'
  },
  LOW: {
    label: 'LOW',
    minScore: 0,
    color: '#00ff88',
    action: 'MONITOR',
    description: 'Target appears nominal at current forensic baseline.'
  }
};

const classifyIncident = (intel) => {
  const score = intel.score || 0;
  let tier = SEVERITY_TIERS.LOW;

  if (score >= SEVERITY_TIERS.CRITICAL.minScore) tier = SEVERITY_TIERS.CRITICAL;
  else if (score >= SEVERITY_TIERS.HIGH.minScore) tier = SEVERITY_TIERS.HIGH;
  else if (score >= SEVERITY_TIERS.MEDIUM.minScore) tier = SEVERITY_TIERS.MEDIUM;

  return {
    ...tier,
    timestamp: new Date(),
    confidence: intel.confidence || 0,
    indicators: intel.tags || []
  };
};

module.exports = { classifyIncident, SEVERITY_TIERS };
