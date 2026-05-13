const axios = require('axios');

/**
 * OWASP ZAP Service
 * Integrates with a local ZAP instance for professional web vulnerability scanning.
 */

const ZAP_BASE = process.env.ZAP_URL || 'http://localhost:8080';
const ZAP_API_KEY = process.env.ZAP_API_KEY || '';

const startWebScan = async (target) => {
  try {
    // 1. Start spider scan (to map the site)
    const spider = await axios.get(`${ZAP_BASE}/JSON/spider/action/scan/`, {
      params: { apikey: ZAP_API_KEY, url: target }
    });

    const scanId = spider.data.scan;

    return {
      source: 'OWASP ZAP (FOSS)',
      target,
      scanId,
      status: 'initiated',
      message: 'Nexus-ZAP Spidering initiated. Deep crawl in progress.'
    };
  } catch (error) {
    console.warn('[ZAP] Local instance not found. Using Sentinel-ZAP Simulator.');
    return {
      source: 'CyberShield-X ZAP Simulator',
      target,
      status: 'simulated',
      vulnerabilities: [
        { name: 'Cross-Site Scripting (XSS)', risk: 'High', confidence: 'Certain' },
        { name: 'SQL Injection', risk: 'Critical', confidence: 'Medium' },
        { name: 'Missing Security Headers', risk: 'Low', confidence: 'Certain' }
      ],
      note: 'Run OWASP ZAP locally on port 8080 for live scanning.'
    };
  }
};

module.exports = { startWebScan };
