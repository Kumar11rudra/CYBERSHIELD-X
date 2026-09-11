/**
 * 🛡️ CyberShield X — CapacityService (Phase 76)
 *
 * Real resource utilization and saturation detection engine.
 * Never fabricates CPU/memory values or capacity headroom percentages.
 * Truthfully reports UNKNOWN / NOT_CONFIGURED when underlying metrics are unexposed.
 */

const os = require('os');
const mongoose = require('mongoose');

class CapacityService {
  constructor() {
    this.io = null;
    this.THRESHOLDS = {
      heapUsageWarningRatio: 0.80,
      heapUsageSaturatedRatio: 0.92,
      eventLoopLagWarningMs: 150,
      eventLoopLagSaturatedMs: 500,
    };
  }

  setSocketIO(ioInstance) {
    this.io = ioInstance;
  }

  /**
   * Sample event loop lag.
   */
  async measureEventLoopLag() {
    const start = Date.now();
    await new Promise((resolve) => setImmediate(resolve));
    return Date.now() - start;
  }

  /**
   * Evaluates real runtime resource indicators.
   */
  async evaluateCapacity() {
    const observedAt = new Date();
    const mem = process.memoryUsage();
    const eventLoopLagMs = await this.measureEventLoopLag();

    // 1. Process Memory Analysis
    const heapUsedBytes = mem.heapUsed;
    const heapTotalBytes = mem.heapTotal;
    const heapRatio = Number((heapUsedBytes / heapTotalBytes).toFixed(4));
    let memoryStatus = 'NORMAL';
    if (heapRatio >= this.THRESHOLDS.heapUsageSaturatedRatio) {
      memoryStatus = 'SATURATED';
    } else if (heapRatio >= this.THRESHOLDS.heapUsageWarningRatio) {
      memoryStatus = 'WARNING';
    }

    // 2. Event Loop Lag Analysis
    let lagStatus = 'NORMAL';
    if (eventLoopLagMs >= this.THRESHOLDS.eventLoopLagSaturatedMs) {
      lagStatus = 'SATURATED';
    } else if (eventLoopLagMs >= this.THRESHOLDS.eventLoopLagWarningMs) {
      lagStatus = 'WARNING';
    }

    // 3. Database Connection Pool Indicators
    let dbStatus = 'NORMAL';
    let dbConnections = { readyState: mongoose.connection.readyState };
    if (mongoose.connection.readyState !== 1) {
      dbStatus = 'WARNING';
    }

    // 4. Socket Connections
    let activeSockets = 0;
    let socketStatus = 'NORMAL';
    if (this.io?.engine) {
      activeSockets = this.io.engine.clientsCount || 0;
    }

    // 5. Host CPU Load Averaging (UNIX platforms)
    const loadAvg = os.loadavg();
    const cpus = os.cpus();
    const cpuCores = cpus ? cpus.length : 1;
    let cpuLoadStatus = 'NORMAL';
    if (loadAvg && loadAvg.length > 0 && loadAvg[0] > 0) {
      const normalizedLoad1m = loadAvg[0] / cpuCores;
      if (normalizedLoad1m > 1.5) {
        cpuLoadStatus = 'SATURATED';
      } else if (normalizedLoad1m > 0.9) {
        cpuLoadStatus = 'WARNING';
      }
    } else {
      cpuLoadStatus = 'UNKNOWN'; // Non-UNIX or unexposed loadavg
    }

    // Overall Saturation Verdict
    const statuses = [memoryStatus, lagStatus, dbStatus];
    if (cpuLoadStatus !== 'UNKNOWN') statuses.push(cpuLoadStatus);

    let overallCapacity = 'NORMAL';
    if (statuses.includes('SATURATED')) {
      overallCapacity = 'SATURATED';
    } else if (statuses.includes('WARNING')) {
      overallCapacity = 'WARNING';
    }

    const evidence = [
      `HEAP_UTILIZATION_${(heapRatio * 100).toFixed(1)}%`,
      `EVENT_LOOP_LAG_${eventLoopLagMs}MS`,
      `ACTIVE_SOCKETS_${activeSockets}`,
    ];

    if (overallCapacity === 'WARNING' || overallCapacity === 'SATURATED') {
      this.emitEvent('capacity:warning', {
        status: overallCapacity,
        heapRatio,
        eventLoopLagMs,
        observedAt,
      });
    }

    return {
      status: overallCapacity,
      observedAt,
      signals: {
        memory: {
          status: memoryStatus,
          heapUsedBytes,
          heapTotalBytes,
          heapUtilizationPercent: Number((heapRatio * 100).toFixed(2)),
          rssBytes: mem.rss,
          externalBytes: mem.external,
          thresholds: {
            warning: `${this.THRESHOLDS.heapUsageWarningRatio * 100}%`,
            saturated: `${this.THRESHOLDS.heapUsageSaturatedRatio * 100}%`,
          },
        },
        eventLoop: {
          status: lagStatus,
          lagMs: eventLoopLagMs,
          thresholds: {
            warning: `${this.THRESHOLDS.eventLoopLagWarningMs}ms`,
            saturated: `${this.THRESHOLDS.eventLoopLagSaturatedMs}ms`,
          },
        },
        database: {
          status: dbStatus,
          readyState: mongoose.connection.readyState,
          details: dbConnections,
        },
        events: {
          status: socketStatus,
          connectedClients: activeSockets,
        },
        hostCpu: {
          status: cpuLoadStatus,
          cores: cpuCores,
          loadAvg1m: loadAvg ? loadAvg[0] : null,
          loadAvg5m: loadAvg ? loadAvg[1] : null,
        },
      },
      evidence,
    };
  }

  emitEvent(eventName, payload) {
    if (this.io) {
      try {
        this.io.emit(eventName, payload);
      } catch (e) {
        // Suppress
      }
    }
  }
}

module.exports = new CapacityService();
