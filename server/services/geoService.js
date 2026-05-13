const axios = require('axios');

/**
 * Resolves an IP address to a physical location.
 * USES: ip-api.com (Free tier, no API key needed for basic lookups)
 */
const resolveIpLocation = async (ip) => {
  try {
    // Standard local IP check
    if (ip === '127.0.0.1' || ip === '::1' || ip === '::ffff:127.0.0.1') {
      return { city: 'Localhost', country: 'System', coordinates: [0, 0] };
    }

    const response = await axios.get(`http://ip-api.com/json/${ip}?fields=status,country,city,lat,lon,isp`);
    
    if (response.data.status === 'success') {
      return {
        city: response.data.city,
        country: response.data.country,
        coordinates: [response.data.lon, response.data.lat],
        isp: response.data.isp,
      };
    }
    
    return { city: 'Unknown', country: 'Unknown', coordinates: [0, 0], isp: 'Unknown ISP' };
  } catch (error) {
    console.warn(`[GEO SERVICE] Failed to resolve IP ${ip}:`, error.message);
    return { city: 'Unknown', country: 'Unknown', coordinates: [0, 0] };
  }
};

module.exports = { resolveIpLocation };
