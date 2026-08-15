'use strict';

class SmsService {
  static async analyzeSMS(message) {
    if (!message || typeof message !== 'string') {
      throw new Error('text or message field is required.');
    }
    if (message.length > 5000) {
      throw new Error('Message exceeds maximum length of 5000 characters.');
    }

    const text = message;
    const lc = text.toLowerCase();
    const indicators = [];
    let score = 0;

    // Category: Urgency / Threat
    const urgencyPatterns = [
      /\burgent\b/i, /\bimmediately\b/i, /\bact now\b/i, /\blast chance\b/i,
      /\bwarning\b/i, /\byour account.*suspend/i, /\bdeactivat/i,
      /\barrest\b/i, /\bfir filed\b/i, /\bcourt order\b/i, /\bcyber crime\b/i,
      /\bkya to\b/i, /\babhi call karo\b/i,
    ];
    const urgencyHits = urgencyPatterns.filter(p => p.test(lc));
    if (urgencyHits.length > 0) {
      indicators.push({ category: 'Urgency / Threat Language', weight: 25, matched: urgencyHits.length });
      score += Math.min(25, urgencyHits.length * 10);
    }

    // Category: Financial Bait / Prize
    const prizePatterns = [
      /\byou have won\b/i, /\bcongratulations\b/i, /\bclaim your (prize|reward|cash|money)/i,
      /\blottery\b/i, /\bgift card\b/i, /\bfree ?(money|recharge|data)\b/i,
      /\b(₹|rs\.?|inr)\s*\d+/i, /\bkbc\b/i, /\bjio\b.*win/i,
    ];
    const prizeHits = prizePatterns.filter(p => p.test(lc));
    if (prizeHits.length > 0) {
      indicators.push({ category: 'Financial Bait / Prize Scam', weight: 25, matched: prizeHits.length });
      score += Math.min(25, prizeHits.length * 12);
    }

    // Category: Credential / OTP Harvesting
    const credPatterns = [
      /\bshare.*otp\b/i, /\benter.*otp\b/i, /\bdo not share.*otp\b/i,
      /\bverification code\b/i, /\bpin\b.*\bsend\b/i,
      /\bpassword\b.*\bsend\b/i, /\bbank.*detail\b/i, /\baccount number\b/i,
      /\bcard.*number\b/i, /\bcvv\b/i,
    ];
    const credHits = credPatterns.filter(p => p.test(lc));
    if (credHits.length > 0) {
      indicators.push({ category: 'Credential / OTP Harvesting', weight: 35, matched: credHits.length });
      score += Math.min(35, credHits.length * 15);
    }

    // Category: Brand Impersonation
    const impersonationPatterns = [
      /\bsbi\b/i, /\bhdfc\b/i, /\bicici\b/i, /\baxis bank\b/i,
      /\bpaytm\b/i, /\bgoogle pay\b/i, /\bphonepe\b/i,
      /\bincome tax\b/i, /\brbi\b/i, /\btrai\b/i,
      /\bamazon\b.*prize/i, /\bflipart\b/i, /\bnpci\b/i,
    ];
    const impersonationHits = impersonationPatterns.filter(p => p.test(lc));
    if (impersonationHits.length > 0) {
      indicators.push({ category: 'Brand / Authority Impersonation', weight: 20, matched: impersonationHits.length });
      score += Math.min(20, impersonationHits.length * 8);
    }

    // Category: Suspicious URLs embedded
    const urlPattern = /https?:\/\/[^\s]+/gi;
    const embeddedUrls = text.match(urlPattern) || [];
    const suspiciousUrlPatterns = [/bit\.ly/i, /tinyurl/i, /t\.me\//i, /\.tk\b/i, /\.cf\b/i, /\.ml\b/i, /\.xyz\b/i];
    const suspiciousUrlHits = embeddedUrls.filter(u => suspiciousUrlPatterns.some(p => p.test(u)));
    if (embeddedUrls.length > 0) {
      const urlScore = suspiciousUrlHits.length > 0 ? 20 : 5;
      indicators.push({
        category: 'Embedded URLs',
        weight: urlScore,
        matched: embeddedUrls.length,
        suspiciousCount: suspiciousUrlHits.length,
      });
      score += urlScore;
    }

    score = Math.min(100, score);

    const riskLevel =
      score >= 70 ? 'dangerous' :
      score >= 40 ? 'medium' :
      score >= 15 ? 'warning' : 'safe';

    return {
      score,
      riskLevel,
      verifyingAuthority: 'CyberShield Heuristic SMS Engine',
      disclaimer: 'This is a heuristic analysis based on pattern matching. It is not conclusive proof of fraud. Results may produce false positives or negatives.',
      indicators,
      embeddedUrls,
    };
  }
}

module.exports = SmsService;
