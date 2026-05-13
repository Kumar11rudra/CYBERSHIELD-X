/**
 * Breach Intelligence Service
 * Uses Enzoic API (Free Tier) for accurate dark web monitoring.
 */

const ENZOIC_BASE = 'https://api.enzoic.com/v1';

const checkEmailBreaches = async (email) => {
  const apiKey = process.env.ENZOIC_API_KEY;
  if (!apiKey) {
    console.warn('[BREACH] Enzoic API key not configured. Using professional mock data.');
    return { 
      source: 'CyberShield-X Intel (Simulated)', 
      breaches: [], 
      note: 'Configure ENZOIC_API_KEY for real-world dark web alerts.' 
    };
  }

  try {
    const response = await axios.get(`${ENZOIC_BASE}/exposure/${encodeURIComponent(email)}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      timeout: 10000
    });

    return {
      source: 'Enzoic Intelligence',
      breaches: response.data.exposures.map(b => ({
        name: b.title,
        date: b.date,
        description: b.details,
        dataClasses: b.exposed_data,
        severity: b.severity
      })),
      total: response.data.exposures.length
    };
  } catch (error) {
    if (error.response?.status === 404) {
      return { source: 'Enzoic', breaches: [], total: 0, message: 'Identity clear in current global indexes.' };
    }
    console.error('[ENZOIC ERROR]', error.message);
    return { error: 'Failed to fetch Enzoic intel.', source: 'Enzoic' };
  }
};

module.exports = { checkEmailBreaches };
