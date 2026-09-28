const { getThreatFeed } = require('../services/threatFeed');

exports.getLiveThreatFeed = async (req, res) => {
  try {
    const feed = await getThreatFeed();
    return res.status(200).json(feed);
  } catch (err) {
    return res.status(200).json({
      source: 'CISA Known Exploited Vulnerabilities Catalog (Fallback)',
      isLive: false,
      items: [],
      ticker: [
        '⚠ CISA KEV: Critical RCE in Ivanti Connect Secure (CVE-2024-21887)',
        '🔴 ALERT: New Lumma Stealer campaign targeting banking credentials',
        '⚡ UrlEngine: Active IOC telemetry stream synchronized',
        '🛡 UrlEngine: 14,000+ malicious IPs tracked for DDoS activity',
        '⚠ NCIIPC Advisory: Phishing attacks targeting payment endpoints',
        '🔴 CERT-In: Ransomware targeting enterprise critical infrastructure',
      ],
      warning: err.message,
    });
  }
};
