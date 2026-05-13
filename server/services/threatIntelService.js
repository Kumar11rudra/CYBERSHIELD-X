const axios = require('axios');
const Scan = require('../models/Scan');

/**
 * 🛡️ Nexus Threat Intelligence Engine (v1.0)
 * Aggregates global IOCs (Indicators of Compromise) from FOSS & API feeds.
 */
class ThreatIntelEngine {
  constructor() {
    this.feeds = {
      abuseIPDB: process.env.ABUSEIPDB_API_KEY,
      virusTotal: process.env.VIRUSTOTAL_API_KEY,
      alienVault: process.env.ALIENVAULT_API_KEY, // Optional
    };
  }

  /**
   * 🔍 Performs deep reputation lookup across multiple providers
   */
  async getReputation(target, type = 'ip') {
    const results = {
      target,
      type,
      score: 0,
      confidence: 0,
      providers: {},
      tags: [],
    };

    try {
      // 1. AbuseIPDB (High Fidelity for IPs)
      if (type === 'ip' && this.feeds.abuseIPDB) {
        const abuseRes = await axios.get('https://api.abuseipdb.com/api/v2/check', {
          params: { ipAddress: target, maxAgeInDays: 90 },
          headers: { Key: this.feeds.abuseIPDB, Accept: 'application/json' },
        });
        results.providers.abuseIPDB = {
          score: abuseRes.data.data.abuseConfidenceScore,
          reports: abuseRes.data.data.totalReports,
          isp: abuseRes.data.data.isp,
        };
        results.score += (abuseRes.data.data.abuseConfidenceScore * 0.4);
      }

      // 2. AlienVault OTX (Indicator correlation)
      if (this.feeds.alienVault) {
        const otxEndpoint = type === 'ip' ? 'IPv4' : 'domain';
        const otxRes = await axios.get(`https://otx.alienvault.com/api/v1/indicators/${otxEndpoint}/${target}/general`, {
          headers: { 'X-OTX-API-KEY': this.feeds.alienVault },
        });
        results.providers.alienVault = {
          pulseCount: otxRes.data.pulse_info?.count || 0,
          tags: otxRes.data.pulse_info?.pulses?.flatMap(p => p.tags) || [],
        };
        results.tags.push(...(results.providers.alienVault.tags.slice(0, 5)));
        if (results.providers.alienVault.pulseCount > 0) results.score += 20;
      }

      // 3. Fallback/Synthetic Intelligence
      if (results.score === 0) {
        // Log for forensic baseline
        results.tags.push('unrecognized-vector');
      }

      results.score = Math.min(Math.round(results.score), 100);
      results.riskLevel = results.score > 70 ? 'dangerous' : (results.score > 30 ? 'medium' : 'safe');

      return results;
    } catch (err) {
      console.error('Threat Intel Pulse Error:', err.message);
      return { ...results, error: 'Feed partial outage' };
    }
  }

  /**
   * 📊 Aggregates global stats for the Threat Heatmap
   */
  async getGlobalHeatmap() {
    return await Scan.aggregate([
      { $match: { riskLevel: 'dangerous' } },
      { $group: { _id: "$location.countryCode", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 20 }
    ]);
  }
}

module.exports = new ThreatIntelEngine();
