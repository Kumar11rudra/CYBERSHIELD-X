const Scan = require('../models/Scan');
const { activeProvider } = require('../utils/cacheProvider');
const { scanQueue, aiQueue, notificationQueue, integrationQueue } = require('../workers/queueProvider');

const getScanPerformanceAnalytics = async () => {
  try {
    const totalScansCount = await Scan.countDocuments({});
    
    // Scans in the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const scansLastHour = await Scan.countDocuments({ createdAt: { $gte: oneHourAgo } });

    // Success vs Failure
    const completedScansCount = await Scan.countDocuments({ status: 'completed' });
    const failedScansCount = await Scan.countDocuments({ status: 'failed' });
    const totalFinished = completedScansCount + failedScansCount;
    
    const successRate = totalFinished > 0 ? Math.round((completedScansCount / totalFinished) * 100) : 100;
    const failureRate = totalFinished > 0 ? Math.round((failedScansCount / totalFinished) * 100) : 0;

    // Durations for completed scans
    const completedScans = await Scan.find({ status: 'completed' })
      .select('createdAt updatedAt')
      .lean();

    let totalDurationMs = 0;
    let fastestScanSec = Infinity;
    let slowestScanSec = 0;

    completedScans.forEach(scan => {
      const durMs = scan.updatedAt - scan.createdAt;
      const durSec = Math.max(0, Math.round(durMs / 1000));
      totalDurationMs += durMs;
      if (durSec < fastestScanSec) fastestScanSec = durSec;
      if (durSec > slowestScanSec) slowestScanSec = durSec;
    });

    if (fastestScanSec === Infinity) fastestScanSec = 0;

    const avgScanSec = completedScans.length > 0
      ? Math.round((totalDurationMs / completedScans.length) / 1000)
      : 0;

    return {
      totalScans: totalScansCount,
      scansPerHour: scansLastHour,
      successRate,
      failureRate,
      averageScanTime: avgScanSec,
      fastestScan: fastestScanSec,
      slowestScan: slowestScanSec,
      activeQueueSize: scanQueue.getMetrics().size
    };
  } catch (err) {
    console.error('Error in getScanPerformanceAnalytics:', err);
    return {
      totalScans: 0,
      scansPerHour: 0,
      successRate: 100,
      failureRate: 0,
      averageScanTime: 0,
      fastestScan: 0,
      slowestScan: 0,
      activeQueueSize: 0
    };
  }
};

const getSystemMetrics = async () => {
  const scanStats = await getScanPerformanceAnalytics();
  
  return {
    scanPerformance: scanStats,
    cache: activeProvider.getMetrics(),
    queues: {
      scan: scanQueue.getMetrics(),
      ai: aiQueue.getMetrics(),
      notification: notificationQueue.getMetrics(),
      integration: integrationQueue.getMetrics()
    }
  };
};

module.exports = {
  getScanPerformanceAnalytics,
  getSystemMetrics
};
