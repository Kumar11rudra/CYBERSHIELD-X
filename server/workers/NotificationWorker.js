const { notificationQueue } = require('./queueProvider');
const logger = require('../utils/logger');

notificationQueue.process(async (jobData) => {
  const { type, payload } = jobData;
  logger.info(`[NotificationWorker] Processing notification task of type: ${type}`);
  
  if (type === 'email') {
    try {
      const emailAlerts = require('../services/emailAlerts');
      if (payload.action === 'sendSlaBreachAlert' && typeof emailAlerts.sendSlaBreachAlert === 'function') {
        await emailAlerts.sendSlaBreachAlert(payload.email, payload.vuln);
      }
    } catch (err) {
      logger.error(`[NotificationWorker] Email alert failure: ${err.message}`);
      throw err;
    }
  } else if (type === 'system') {
    try {
      const Notification = require('../models/Notification');
      await Notification.create(payload);
    } catch (err) {
      logger.error(`[NotificationWorker] System notification database write failure: ${err.message}`);
      throw err;
    }
  } else if (type === 'socket') {
    if (global.io) {
      global.io.to(payload.room || 'admins').emit(payload.event, payload.data);
    }
  } else {
    logger.warn(`[NotificationWorker] Unsupported task type: ${type}`);
  }
});

console.log('👷 [Workers] NotificationWorker initialized and processing notification tasks.');
