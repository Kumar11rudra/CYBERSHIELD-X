'use strict';

const KNOWN_UPI_HANDLES = new Set([
  'okaxis', 'oksbi', 'okicici', 'okhdfcbank',
  'paytm', 'ybl', 'upi', 'apl', 'axl',
  'ibl', 'idbi', 'boi', 'cnrb', 'ubi',
  'federal', 'kotak', 'pnb', 'sib', 'scb',
  'indus', 'rbl', 'cub', 'icici', 'sbi',
  'hdfc', 'axis', 'fbl', 'jkb', 'dbs',
  'airtel', 'airtelpaymentsbank', 'jupiteraxis',
  'freecharge', 'rajgovhdfcbank', 'hdfcbankjd',
  'superyes', 'abfspay', 'timecosmos',
]);

class UpiService {
  static async verifyUPI(upiId) {
    if (!upiId || typeof upiId !== 'string') {
      throw new Error('upiId or upi field is required.');
    }
    if (upiId.length > 256) {
      throw new Error('UPI ID exceeds maximum length.');
    }

    const trimmed = upiId.trim();
    const atParts = trimmed.split('@');
    const formatValid = atParts.length === 2 && atParts[0].length > 0 && atParts[1].length > 0;
    const prefix = formatValid ? atParts[0] : '';
    const handle = formatValid ? atParts[1].toLowerCase() : '';
    const providerKnown = KNOWN_UPI_HANDLES.has(handle);

    const riskIndicators = [];

    if (!formatValid) {
      riskIndicators.push('Invalid format: UPI ID must follow the pattern username@provider');
    }
    if (prefix && /^[0-9]+$/.test(prefix)) {
      riskIndicators.push('Prefix is entirely numeric — uncommon for personal UPI IDs');
    }
    if (prefix && prefix.length > 50) {
      riskIndicators.push('Unusually long prefix — may indicate a generated or suspicious identifier');
    }
    if (prefix && /[^a-zA-Z0-9._-]/.test(prefix)) {
      riskIndicators.push('Prefix contains special characters not standard in UPI IDs');
    }
    if (!providerKnown && handle) {
      riskIndicators.push(`Provider handle "@${handle}" is not in the known registered VPA suffix list`);
    }

    const score = riskIndicators.length === 0 ? 0 : riskIndicators.length === 1 ? 45 : 85;
    const riskLevel = riskIndicators.length === 0 ? 'safe' : riskIndicators.length === 1 ? 'warning' : 'dangerous';

    return {
      score,
      riskLevel,
      verifyingAuthority: 'Heuristic Check (Format + Suffixes)',
      disclaimer: 'This is format and heuristic analysis only. It does NOT verify the identity, legitimacy, activity status, or payment safety of this UPI ID. Only an authoritative NPCI verification can confirm VPA existence.',
      upiId: trimmed,
      format_valid: formatValid,
      risk_indicators: riskIndicators,
    };
  }
}

module.exports = UpiService;
