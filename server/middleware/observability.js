/**
 * 📊 Nexus Observability Engine
 * Tracks request latency, status codes, and endpoint throughput.
 */

const metrics = {
  requestsTotal: 0,
  errorsTotal: 0,
  latencyHistory: [],
  endpointStats: {}
};

const observabilityMiddleware = (req, res, next) => {
  const start = process.hrtime();
  metrics.requestsTotal++;

  // After response finishes
  res.on('finish', () => {
    const diff = process.hrtime(start);
    const timeInMs = (diff[0] * 1e3 + diff[1] * 1e-6).toFixed(2);
    
    const endpoint = `${req.method} ${req.route?.path || req.path}`;
    
    // Update stats
    if (!metrics.endpointStats[endpoint]) {
      metrics.endpointStats[endpoint] = { calls: 0, avgLatency: 0, errors: 0 };
    }
    
    const stats = metrics.endpointStats[endpoint];
    stats.calls++;
    stats.avgLatency = ((parseFloat(stats.avgLatency) * (stats.calls - 1) + parseFloat(timeInMs)) / stats.calls).toFixed(2);
    
    if (res.statusCode >= 400) {
      metrics.errorsTotal++;
      stats.errors++;
    }

    // Keep history for trend analysis (last 100)
    metrics.latencyHistory.push({ time: new Date(), ms: timeInMs, status: res.statusCode });
    if (metrics.latencyHistory.length > 100) metrics.latencyHistory.shift();
  });

  next();
};

const getMetrics = () => ({
  ...metrics,
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  timestamp: new Date()
});

module.exports = { observabilityMiddleware, getMetrics };
