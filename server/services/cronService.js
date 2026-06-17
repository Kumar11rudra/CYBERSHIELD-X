const tls = require('tls');
const ScheduledScan = require('../models/ScheduledScan');
const Scan = require('../models/Scan');
const Notification = require('../models/Notification');
const User = require('../models/User');
const IOCRecord = require('../models/IOCRecord');
const Asset = require('../models/Asset');
const Vulnerability = require('../models/Vulnerability');
const localEngine = require('./nexus-engine/LocalExecutor');
const { sendGenericAlertEmail } = require('./emailAlerts');
const logger = require('../utils/logger');
const { calculateNextRun } = require('../controllers/scheduleController');

// Parse open ports from nmap output log
const parseOpenPorts = (rawLog) => {
  if (!rawLog) return [];
  const lines = rawLog.split('\n');
  const ports = [];
  for (const line of lines) {
    const match = line.match(/^(\d+)\/tcp\s+open/i);
    if (match) {
      ports.push(parseInt(match[1], 10));
    }
  }
  return ports;
};

// Check SSL certificate expiration and validity
const checkSSLCertificate = (host) => {
  return new Promise((resolve) => {
    const cleanHost = host.replace(/^https?:\/\//, '').split('/')[0];
    const socket = tls.connect(
      { host: cleanHost, port: 443, servername: cleanHost, rejectUnauthorized: false },
      () => {
        const cert = socket.getPeerCertificate(true);
        socket.destroy();
        if (!cert || !cert.valid_to) {
          resolve({ success: false, error: 'Empty certificate' });
        } else {
          const now = new Date();
          const validTo = new Date(cert.valid_to);
          const daysLeft = Math.floor((validTo - now) / (1000 * 60 * 60 * 24));
          resolve({ success: true, daysLeft, validTo, issuer: cert.issuer?.O || 'Unknown CA' });
        }
      }
    );
    socket.setTimeout(5000, () => {
      socket.destroy();
      resolve({ success: false, error: 'Connection timeout' });
    });
    socket.on('error', (err) => {
      resolve({ success: false, error: err.message });
    });
  });
};

// Orchestrates a single scheduled scan and evaluates escalation rules
const executeScheduleJob = async (schedule) => {
  const { _id, userId, target, targetType, tools, scanMode } = schedule;

  try {
    const user = await User.findById(userId);
    if (!user) {
      logger.warn(`[SCHEDULER] User ${userId} not found for schedule ${_id}`);
      return;
    }

    logger.info(`[SCHEDULER] Starting scheduled job: ${target} [${targetType}]`);

    // 1. Gather baseline scans
    let vtResult = { malicious: 0, harmless: 0, total: 0, note: 'Scan executed via Scheduler' };
    let abuseResult = { source: 'Scheduler_Check', note: 'DNS check executed' };
    let domainIntelResult = { riskScore: 0, riskFactors: [] };
    let hashlookupResult = { found: false };

    let scanLogs = '';
    const now = new Date();

    // Check IOCs
    const ioc = await IOCRecord.findOne({ value: target.toLowerCase() });
    if (ioc) {
      hashlookupResult.found = true;
      if (ioc.reputation > 75) {
        // Rule: High-Risk IOC -> Critical alert
        const title = `Critical Threat Detected: High-Risk IOC for ${target}`;
        const message = `Scheduled monitoring matching active IOC Record: Target ${target} matches high-risk threat signature [Reputation: ${ioc.reputation}%, Source: ${ioc.source}].`;

        await Notification.create({
          userId,
          title,
          message,
          type: 'alert',
          severity: 'critical',
          category: 'ioc',
          source: 'ioc-intel',
          entityId: _id
        });

        await sendGenericAlertEmail({
          to: user.email,
          username: user.username,
          title,
          message,
          severity: 'critical',
          category: 'ioc',
          source: 'ioc-intel'
        });
      }
    }

    // Run Nmap Port check
    if (tools.includes('nmap') && (targetType === 'ip' || targetType === 'domain' || targetType === 'url')) {
      const host = targetType === 'url' ? new URL(target).hostname : target;
      const nmapScan = await localEngine.scanPorts(host, scanMode);
      
      if (nmapScan.success) {
        vtResult = {
          source: 'NLEM_Nmap_Engine',
          type: targetType,
          malicious: nmapScan.data.toLowerCase().includes('open') ? 1 : 0,
          harmless: 1,
          total: 1,
          permalink: 'Scheduled Nmap Scan',
          note: 'Scheduled Port Audit completed.',
          rawLog: nmapScan.data
        };
        scanLogs += nmapScan.data + '\n';

        // Evaluate Port Changes escalation rules
        const previousScan = await Scan.findOne({ userId, target, status: 'completed' }).sort({ createdAt: -1 });
        if (previousScan) {
          const oldPorts = parseOpenPorts(previousScan.breakdown?.virusTotal?.rawLog);
          const newPorts = parseOpenPorts(nmapScan.data);
          const addedPorts = newPorts.filter(p => !oldPorts.includes(p));

          if (addedPorts.length > 0) {
            const title = `Security Sentinel: New Open Ports Detected on ${target}`;
            const message = `Continuous monitoring identified newly opened TCP ports: ${addedPorts.join(', ')} on host ${target}. Verify if these expose insecure services.`;

            await Notification.create({
              userId,
              title,
              message,
              type: 'alert',
              severity: 'high',
              category: 'port',
              source: 'nmap',
              entityId: _id
            });

            await sendGenericAlertEmail({
              to: user.email,
              username: user.username,
              title,
              message,
              severity: 'high',
              category: 'port',
              source: 'nmap'
            });
          }
        }
      }
    }

    // Run SSL audit
    if (tools.includes('ssl') && (targetType === 'domain' || targetType === 'url')) {
      const host = targetType === 'url' ? new URL(target).hostname : target;
      const sslRes = await checkSSLCertificate(host);

      if (sslRes.success) {
        const { daysLeft } = sslRes;
        
        let severity = null;
        let title = '';
        let message = '';

        if (daysLeft <= 0) {
          severity = 'critical';
          title = `Critical Expiry: SSL Certificate Expired for ${target}`;
          message = `Continuous monitoring alert: The SSL certificate for ${target} has expired. Services depending on HTTPS will fail connection security handshakes.`;
        } else if (daysLeft <= 14) {
          severity = 'high';
          title = `Urgent Expiry: SSL Certificate Expiring in ${daysLeft} Days for ${target}`;
          message = `Continuous monitoring alert: The SSL certificate for ${target} will expire in ${daysLeft} days. Immediately procure a certificate renewal.`;
        } else if (daysLeft <= 30) {
          severity = 'warning';
          title = `SSL Certificate Expiry Warning for ${target}`;
          message = `Continuous monitoring alert: The SSL certificate for ${target} will expire in ${daysLeft} days. Ensure a renewal schedule is set.`;
        }

        if (severity) {
          await Notification.create({
            userId,
            title,
            message,
            type: 'alert',
            severity,
            category: 'ssl',
            source: 'ssl-auditor',
            entityId: _id
          });

          await sendGenericAlertEmail({
            to: user.email,
            username: user.username,
            title,
            message,
            severity,
            category: 'ssl',
            source: 'ssl-auditor'
          });
        }
      } else {
        // TLS failure trigger
        const title = `SSL/TLS Connection Failure for ${target}`;
        const message = `Continuous monitoring failed to establish SSL/TLS secure session with ${target}. Host might be offline, port 443 closed, or utilizing unsupported security cipher configurations.`;

        await Notification.create({
          userId,
          title,
          message,
          type: 'alert',
          severity: 'high',
          category: 'ssl',
          source: 'ssl-auditor',
          entityId: _id
        });

        await sendGenericAlertEmail({
          to: user.email,
          username: user.username,
          title,
          message,
          severity: 'high',
          category: 'ssl',
          source: 'ssl-auditor'
        });
      }
    }

    // Run banner audts to check CVEs
    if (targetType === 'url' || targetType === 'domain') {
      const host = targetType === 'url' ? new URL(target).hostname : target;
      const webScan = await localEngine.runWebAuditor(target);
      if (webScan.success) {
        scanLogs += webScan.data + '\n';
        // Parse raw logs for potential CVEs
        const findings = localEngine.lookupCVEsFromBanners(webScan.data);
        for (const vuln of findings) {
          let severity = 'info';
          let numericScore = 0;
          const scoreMatch = vuln.severity.match(/([0-9.]+)/);
          if (scoreMatch) {
            numericScore = parseFloat(scoreMatch[1]);
          }

          if (numericScore >= 9.0) {
            severity = 'critical';
          } else if (numericScore >= 7.0) {
            severity = 'high';
          } else if (numericScore >= 4.0) {
            severity = 'warning';
          }

          if (severity === 'critical' || severity === 'high') {
            const title = `${severity.toUpperCase()} Vulnerability Detected: ${vuln.cve} on ${target}`;
            const message = `Vulnerability assessment identified ${vuln.software} v${vuln.version} affected by ${vuln.cve}. Description: ${vuln.description}`;

            await Notification.create({
              userId,
              title,
              message,
              type: 'alert',
              severity,
              category: 'vulnerability',
              source: 'nikto',
              entityId: _id
            });

            await sendGenericAlertEmail({
              to: user.email,
              username: user.username,
              title,
              message,
              severity,
              category: 'vulnerability',
              source: 'nikto'
            });
          }
        }
      }
    }

    // Calculate threat score
    let score = 0;
    if (vtResult.malicious > 0) score += 40;
    if (domainIntelResult.riskScore > 50) score += 30;
    if (hashlookupResult.found) score += 30;
    score = Math.min(score, 100);

    const riskLevel = score >= 75 ? 'dangerous' : score >= 50 ? 'medium' : score >= 20 ? 'low' : 'safe';

    // Save final Scan Document
    const scanRecord = await Scan.create({
      userId,
      organizationId: schedule.organizationId || undefined,
      teamId: schedule.teamId || undefined,
      target,
      targetType,
      threatScore: score,
      riskLevel,
      incidentTier: score >= 75 ? 'CAT-2 User Compromise' : 'CAT-5 Reconnaissance',
      sourceScores: {
        virusTotal: vtResult.malicious ? 80 : 0,
        abuseIPDB: 0,
        domainIntel: domainIntelResult.riskScore,
        hashlookup: hashlookupResult.found ? 100 : 0
      },
      breakdown: {
        virusTotal: vtResult,
        abuseIPDB: abuseResult,
        domainIntel: domainIntelResult,
        hashlookup: hashlookupResult
      },
      status: 'completed'
    });

    try {
      const { registerScanVulnerabilities } = require('./vulnerabilityService');
      await registerScanVulnerabilities(scanRecord);
    } catch (err) {
      logger.error(`[SCHEDULER] Failed registering vulnerabilities: ${err.message}`);
    }

    // Recalculate related asset risk
    const relatedAsset = await Asset.findOne({ userId, hostname: target.replace(/^https?:\/\//, '').split('/')[0] });
    if (relatedAsset) {
      relatedAsset.lastRiskScore = score;
      relatedAsset.lastScanAt = now;
      await relatedAsset.save();
      logger.info(`[SCHEDULER] Updated risk status for linked asset: ${relatedAsset.hostname}`);
    }

    // Update Schedule counters
    schedule.lastRun = now;
    schedule.nextRun = calculateNextRun(schedule.frequency);
    await schedule.save();

    logger.info(`[SCHEDULER] Job executed successfully for target ${target}. Next run scheduled for ${schedule.nextRun}`);
  } catch (error) {
    logger.error(`[SCHEDULER] Job execution failed for target ${target}: ${error.message}`);
  }
};

// ─── SLA Breach Escalation ───────────────────────────────────────────────────
const checkVulnerabilitySLABreaches = async () => {
  try {
    const now = new Date();

    // Find all open/in-progress vulns past their SLA deadline that aren't already marked Breached
    const breachedVulns = await Vulnerability.find({
      status: { $in: ['Open', 'In Progress'] },
      slaDeadline: { $lt: now },
      slaStatus: { $ne: 'Breached' },
    }).populate('assetId', 'hostname ip criticality').populate('assignedTo', 'username email');

    if (breachedVulns.length === 0) return;

    logger.info(`[SLA-ESCALATION] Found ${breachedVulns.length} SLA-breached vulnerabilities.`);

    for (const vuln of breachedVulns) {
      // Update breach state
      vuln.slaStatus = 'Breached';
      vuln.overdueAt = vuln.overdueAt || now;
      await vuln.save();

      // Trigger Playbook
      try {
        const playbookEngine = require('./playbookEngine');
        await playbookEngine.triggerPlaybook('sla_breached', vuln, vuln.organizationId);
      } catch (triggerErr) {
        logger.error(`[SLA-ESCALATION] Playbook trigger failed: ${triggerErr.message}`);
      }

      // Notify the asset owner / assigned user
      const hostname = vuln.assetId?.hostname || 'Unknown Host';
      const title = `SLA Breach: ${vuln.cve} on ${hostname} is Overdue`;
      const message = `Vulnerability ${vuln.cve} (${vuln.severity}) on ${hostname} has exceeded its SLA deadline (${new Date(vuln.slaDeadline).toLocaleDateString()}). Immediate remediation required.`;

      // Determine notification target (assignee or find org owner)
      const notifyUserId = vuln.assignedTo?._id || null;
      if (notifyUserId) {
        await Notification.create({
          userId: notifyUserId,
          organizationId: vuln.organizationId || undefined,
          title,
          message,
          type: 'alert',
          severity: 'critical',
          category: 'vulnerability',
          source: 'sla-escalation',
          entityId: vuln._id,
        });

        const assignee = vuln.assignedTo;
        if (assignee?.email) {
          await sendGenericAlertEmail({
            to: assignee.email,
            username: assignee.username,
            title,
            message,
            severity: 'critical',
            category: 'vulnerability',
            source: 'sla-escalation',
          });
        }
      }
    }

    logger.info(`[SLA-ESCALATION] Escalated ${breachedVulns.length} overdue vulnerabilities.`);
  } catch (err) {
    logger.error(`[SLA-ESCALATION] Error checking SLA breaches: ${err.message}`);
  }
};

// Runs due jobs in a loop
let lastThreatSyncTime = 0;

const checkAndRunDueScans = async () => {
  try {
    const dueSchedules = await ScheduledScan.find({
      isActive: true,
      nextRun: { $lte: new Date() }
    });

    if (dueSchedules.length > 0) {
      logger.info(`[SCHEDULER] Poller discovered ${dueSchedules.length} scheduled scans due for execution.`);
      for (const schedule of dueSchedules) {
        await executeScheduleJob(schedule);
      }
    }

    // Daily threat intelligence synchronization check
    const now = Date.now();
    if (now - lastThreatSyncTime >= 24 * 60 * 60 * 1000) {
      lastThreatSyncTime = now;
      logger.info('[SCHEDULER] Starting automated daily threat intelligence sync...');
      const { syncAllFeeds } = require('./ThreatFeedSyncService');
      syncAllFeeds().catch(err => logger.error(`[SCHEDULER] Auto Threat Intelligence sync failed: ${err.message}`));
      // Daily SLA breach escalation check
      checkVulnerabilitySLABreaches().catch(err => logger.error(`[SCHEDULER] SLA escalation check failed: ${err.message}`));
    }
  } catch (err) {
    logger.error(`[SCHEDULER] Error polling scheduled scans: ${err.message}`);
  }
};

let pollInterval = null;

const startScheduler = (intervalMs = 60000) => {
  if (pollInterval) return;
  logger.info(`[SCHEDULER] Arming continuous security monitor scheduler (Poll: ${intervalMs}ms)...`);
  
  // Run check on startup
  checkAndRunDueScans();
  
  pollInterval = setInterval(checkAndRunDueScans, intervalMs);
};

const stopScheduler = () => {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
    logger.info('[SCHEDULER] Continuous security monitor scheduler stopped.');
  }
};

module.exports = {
  startScheduler,
  stopScheduler,
  checkAndRunDueScans,
  executeScheduleJob,
  checkSSLCertificate,
  checkVulnerabilitySLABreaches,
};
