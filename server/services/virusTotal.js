const axios = require('axios');

const VT_BASE = 'https://www.virustotal.com/api/v3';

/**
 * Analyze a URL with VirusTotal
 */
const scanURL = async (url) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    console.warn('VirusTotal API key not configured');
    return { error: 'API key not configured', source: 'virustotal' };
  }

  try {
    // Submit URL for analysis
    const encoded = Buffer.from(url).toString('base64').replace(/=/g, '');
    const response = await axios.get(`${VT_BASE}/urls/${encoded}`, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000,
    });

    const stats = response.data?.data?.attributes?.last_analysis_stats || {};
    const results = response.data?.data?.attributes?.last_analysis_results || {};

    return {
      source: 'virustotal',
      type: 'url',
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      permalink: `https://www.virustotal.com/gui/url/${encoded}`,
      scanDate: response.data?.data?.attributes?.last_analysis_date
        ? new Date(response.data.data.attributes.last_analysis_date * 1000).toISOString()
        : null,
      categories: response.data?.data?.attributes?.categories || {},
      topEngines: Object.entries(results)
        .filter(([, v]) => v.category === 'malicious')
        .slice(0, 5)
        .map(([engine, v]) => ({ engine, result: v.result })),
    };
  } catch (error) {
    if (error.response?.status === 404) {
      // URL not in VT database yet — submit it
      try {
        await axios.post(
          `${VT_BASE}/urls`,
          `url=${encodeURIComponent(url)}`,
          {
            headers: { 'x-apikey': apiKey, 'Content-Type': 'application/x-www-form-urlencoded' },
            timeout: 10000,
          }
        );
        return {
          source: 'virustotal',
          type: 'url',
          malicious: 0,
          suspicious: 0,
          harmless: 0,
          undetected: 0,
          total: 0,
          note: 'URL submitted for analysis. Results pending.',
        };
      } catch {
        return { error: 'Failed to submit URL', source: 'virustotal' };
      }
    }
    if (error.response?.status === 429) {
      return { error: 'VirusTotal rate limit exceeded', source: 'virustotal' };
    }
    console.error('VirusTotal error:', error.message);
    return { error: error.message, source: 'virustotal' };
  }
};

/**
 * Analyze an IP address with VirusTotal
 */
const scanIP = async (ip) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { error: 'API key not configured', source: 'virustotal' };
  }

  try {
    const response = await axios.get(`${VT_BASE}/ip_addresses/${ip}`, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000,
    });

    const attrs = response.data?.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};

    return {
      source: 'virustotal',
      type: 'ip',
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      country: attrs.country || null,
      asOwner: attrs.as_owner || null,
      network: attrs.network || null,
      reputation: attrs.reputation || 0,
      permalink: `https://www.virustotal.com/gui/ip-address/${ip}`,
    };
  } catch (error) {
    if (error.response?.status === 429) {
      return { error: 'VirusTotal rate limit exceeded', source: 'virustotal' };
    }
    console.error('VirusTotal IP error:', error.message);
    return { error: error.message, source: 'virustotal' };
  }
};

const scanDomain = async (domain) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { error: 'API key not configured', source: 'virustotal' };
  }

  try {
    const response = await axios.get(`${VT_BASE}/domains/${domain}`, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000,
    });

    const attrs = response.data?.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};

    return {
      source: 'virustotal',
      type: 'domain',
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      reputation: attrs.reputation || 0,
      categories: attrs.categories || {},
      registrar: attrs.registrar || null,
      creationDate: attrs.creation_date ? new Date(attrs.creation_date * 1000).toISOString() : null,
      lastUpdateDate: attrs.last_modification_date ? new Date(attrs.last_modification_date * 1000).toISOString() : null,
      whoisDate: attrs.whois_date ? new Date(attrs.whois_date * 1000).toISOString() : null,
      lastDnsRecords: (attrs.last_dns_records || []).slice(0, 6).map((entry) => ({
        type: entry.type,
        value: entry.value,
      })),
      permalink: `https://www.virustotal.com/gui/domain/${domain}`,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        source: 'virustotal',
        type: 'domain',
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
        total: 0,
        note: 'Domain not present in VirusTotal yet.',
      };
    }
    if (error.response?.status === 429) {
      return { error: 'VirusTotal rate limit exceeded', source: 'virustotal' };
    }
    console.error('VirusTotal domain error:', error.message);
    return { error: error.message, source: 'virustotal' };
  }
};

const scanHash = async (hash) => {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey) {
    return { error: 'API key not configured', source: 'virustotal' };
  }

  try {
    const response = await axios.get(`${VT_BASE}/files/${hash}`, {
      headers: { 'x-apikey': apiKey },
      timeout: 10000,
    });

    const attrs = response.data?.data?.attributes || {};
    const stats = attrs.last_analysis_stats || {};

    return {
      source: 'virustotal',
      type: 'hash',
      malicious: stats.malicious || 0,
      suspicious: stats.suspicious || 0,
      harmless: stats.harmless || 0,
      undetected: stats.undetected || 0,
      total: Object.values(stats).reduce((a, b) => a + b, 0),
      size: attrs.size || null,
      fileType: attrs.type_description || attrs.type_tag || null,
      magic: attrs.magic || null,
      firstSubmissionDate: attrs.first_submission_date ? new Date(attrs.first_submission_date * 1000).toISOString() : null,
      lastSubmissionDate: attrs.last_submission_date ? new Date(attrs.last_submission_date * 1000).toISOString() : null,
      names: (attrs.names || []).slice(0, 5),
      tags: attrs.tags || [],
      popularThreatClassification: attrs.popular_threat_classification || null,
      meaningfulName: attrs.meaningful_name || null,
      permalink: `https://www.virustotal.com/gui/file/${hash}`,
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return {
        source: 'virustotal',
        type: 'hash',
        malicious: 0,
        suspicious: 0,
        harmless: 0,
        undetected: 0,
        total: 0,
        note: 'Hash not present in VirusTotal yet.',
      };
    }
    if (error.response?.status === 429) {
      return { error: 'VirusTotal rate limit exceeded', source: 'virustotal' };
    }
    console.error('VirusTotal hash error:', error.message);
    return { error: error.message, source: 'virustotal' };
  }
};

module.exports = { scanURL, scanIP, scanDomain, scanHash };
