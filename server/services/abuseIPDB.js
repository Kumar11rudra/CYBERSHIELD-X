const axios = require('axios');

const ABUSE_BASE = 'https://api.abuseipdb.com/api/v2';

/**
 * Check an IP address against AbuseIPDB
 */
const checkIP = async (ip) => {
  const apiKey = process.env.ABUSEIPDB_API_KEY;
  if (!apiKey) {
    console.warn('AbuseIPDB API key not configured');
    return { error: 'API key not configured', source: 'abuseipdb' };
  }

  try {
    const response = await axios.get(`${ABUSE_BASE}/check`, {
      headers: {
        Key: apiKey,
        Accept: 'application/json',
      },
      params: {
        ipAddress: ip,
        maxAgeInDays: 90,
        verbose: true,
      },
      timeout: 10000,
    });

    const data = response.data?.data || {};

    return {
      source: 'abuseipdb',
      ipAddress: data.ipAddress,
      isPublic: data.isPublic,
      ipVersion: data.ipVersion,
      isWhitelisted: data.isWhitelisted || false,
      abuseConfidenceScore: data.abuseConfidenceScore || 0,
      countryCode: data.countryCode || null,
      usageType: data.usageType || null,
      isp: data.isp || null,
      domain: data.domain || null,
      hostnames: data.hostnames || [],
      totalReports: data.totalReports || 0,
      numDistinctUsers: data.numDistinctUsers || 0,
      lastReportedAt: data.lastReportedAt || null,
      reports: (data.reports || []).slice(0, 5).map((r) => ({
        reportedAt: r.reportedAt,
        comment: r.comment?.substring(0, 200),
        categories: r.categories,
      })),
    };
  } catch (error) {
    if (error.response?.status === 429) {
      return { error: 'AbuseIPDB rate limit exceeded', source: 'abuseipdb' };
    }
    if (error.response?.status === 422) {
      return { error: 'Invalid IP address format', source: 'abuseipdb' };
    }
    console.error('AbuseIPDB error:', error.message);
    return { error: error.message, source: 'abuseipdb' };
  }
};

/**
 * AbuseIPDB only works for IPs, not URLs
 * Returns a placeholder for URL scans
 */
const notApplicable = (reason = 'Not applicable for this target type') => ({
  source: 'abuseipdb',
  error: reason,
  notApplicable: true,
});

module.exports = { checkIP, notApplicable };
