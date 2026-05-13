const ActivityLog = require('../models/ActivityLog');
const SystemSettings = require('../models/SystemSettings');
const { SEVERITY_TIERS } = require('./incidentClassifier');
const logger = require('../utils/logger');

/**
 * ⚡ Nexus SOAR Engine (Security Orchestration, Automation, and Response)
 * Automatically executes defensive actions based on incident classification.
 */
class SOAREngine {
  constructor() {
    this.autoBlockEnabled = true; // Security switch
  }

  /**
   * 🎯 Evaluates an incident and orchestrates a response
   */
  async orchestrateResponse(incident, metadata = {}) {
    const { label, action, score } = incident;

    logger.info(`SOAR: Orchestrating response for ${label} incident (Score: ${score})`);

    try {
      // 1. Critical Threat: Automatic Perimeter Hardening
      if (label === 'CRITICAL' && this.autoBlockEnabled) {
        await this.executeAutoBlock(metadata.target);
      }

      // 2. High Threat: Incident Alert Escalation
      if (label === 'HIGH' || label === 'CRITICAL') {
        await this.dispatchAlert(incident, metadata);
      }

      // 3. Log the SOAR action for Audit
      await ActivityLog.create({
        action: `SOAR_AUTO_${action}`,
        status: 'success',
        metadata: {
          details: `Automated response executed for ${label} threat on ${metadata.target}`,
          target: metadata.target,
          incidentScore: score,
        }
      });

      return { orchestrated: true, actionExecuted: action };
    } catch (err) {
      logger.error(`SOAR: Orchestration failure: ${err.message}`);
      return { orchestrated: false, error: err.message };
    }
  }

  /**
   * 🛡️ Injects malicious targets directly into the Global Firewall
   */
  async executeAutoBlock(target) {
    if (!target) return;
    
    logger.warn(`SOAR: AUTO-BLOCKING highly malicious target: ${target}`);
    
    const settings = await SystemSettings.findOne();
    if (!settings) return;

    if (!settings.blockedIPs.includes(target)) {
      settings.blockedIPs.push(target);
      await settings.save();
    }
  }

  /**
   * 📣 Dispatches real-time alerts to the SOC notification pipeline
   */
  async dispatchAlert(incident, metadata) {
    // In a real scenario, this would POST to a Slack/Discord webhook
    // For now, we simulate the dispatch logic
    logger.info(`SOAR: ALERT DISPATCHED - [${incident.label}] Detection on ${metadata.target}`);
    
    // Logic for socket.io real-time alert to all connected Admins
    if (global.io) {
      global.io.to('admins').emit('soar:alert', {
        severity: incident.label,
        message: `Automated ${incident.action} executed for ${metadata.target}`,
        timestamp: new Date()
      });
    }
  }
}

module.exports = new SOAREngine();
