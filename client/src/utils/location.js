/**
 * Captures current GPS coordinates (latitude, longitude)
 */
export const captureBrowserLocation = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined' || !navigator.geolocation) {
      return resolve(null);
    }

    const timer = setTimeout(() => resolve(null), 400);

    try {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          clearTimeout(timer);
          resolve({
            lat: pos.coords.latitude,
            lon: pos.coords.longitude,
            accuracy: pos.coords.accuracy,
          });
        },
        () => {
          clearTimeout(timer);
          resolve(null);
        },
        { timeout: 350, maximumAge: 60000 }
      );
    } catch {
      clearTimeout(timer);
      resolve(null);
    }
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
