/**
 * Captures current GPS coordinates (latitude, longitude)
 */
export const captureBrowserLocation = () => {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      return resolve(null);
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        resolve({
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
      },
      (error) => {
        console.warn('[LOCATION] Permission denied or unavailable:', error.message);
        resolve(null);
      },
      { timeout: 5000 }
    );
  });
};

/**
 * Detects current Network Type (4G, 5G, WiFi, etc.)
 */
export const captureNetworkInfo = () => {
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (!conn) return 'Unknown';

  return {
    type: conn.effectiveType || 'Unknown', // e.g., '4g'
    downlink: conn.downlink, // Mbps
    rtt: conn.rtt, // Round-trip time
  };
};
