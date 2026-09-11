const crypto = require('crypto');
const Alert = require('../models/Alert');
const auditLogger = require('../utils/auditLogger');
const logger = require('../utils/logger');

/**
 * Emit Socket.IO alert events safely
 */
const emitAlertEvent = (req, eventName, alertData) => {
  try {
    const io = req.app?.get('io');
    if (io) {
      io.emit(eventName, {
        alertId: alertData.alertId,
        title: alertData.title,
        severity: alertData.severity,
        status: alertData.status,
        category: alertData.category,
        source: alertData.source,
        asset: alertData.asset,
        timestamp: new Date().toISOString()
      });
    }
  } catch (err) {
    logger.warn(`Failed to broadcast ${eventName}: ${err.message}`);
  }
};

/**
 * List alerts with filtering and pagination
 */
exports.getAlerts = async (req, res) => {
  try {
    const page = Math.max(parseInt(req.query.page) || 1, 1);
    const limit = Math.min(parseInt(req.query.limit) || 20, 100);
    const { status, severity, category, source } = req.query;

    const filter = {};
    if (status) filter.status = status.toUpperCase();
    if (severity) filter.severity = severity.toUpperCase();
    if (category) filter.category = category.toUpperCase();
    if (source) filter.source = { $regex: source, $options: 'i' };

    const total = await Alert.countDocuments(filter);
    const alerts = await Alert.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    res.json({
      success: true,
      data: {
        alerts,
        pagination: {
          total,
          page,
          limit,
          pages: Math.ceil(total / limit) || 1
        }
      }
    });
  } catch (error) {
    logger.error('Failed to get alerts:', error);
    res.status(500).json({ success: false, error: 'Failed to retrieve alerts' });
  }
};

/**
 * Get alert by ID
 */
exports.getAlertById = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await Alert.findOne({
      $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    }).lean();

    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert ${id} not found` });
    }

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error(`Failed to get alert ${req.params.id}:`, error);
    res.status(500).json({ success: false, error: 'Failed to retrieve alert' });
  }
};

/**
 * Create a new SOC alert
 */
exports.createAlert = async (req, res) => {
  try {
    const { title, description, severity, category, source, asset, findingId, executionId, metadata } = req.body;

    if (!title || !source) {
      return res.status(400).json({ success: false, error: 'title and source are required' });
    }

    const alertId = `ALT-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const newAlert = new Alert({
      alertId,
      title: title.trim(),
      description: description || '',
      severity: (severity || 'MEDIUM').toUpperCase(),
      category: (category || 'SECURITY_EVENT').toUpperCase(),
      source: source.trim(),
      asset: asset || '',
      findingId: findingId || null,
      executionId: executionId || null,
      status: 'NEW',
      metadata: metadata || {}
    });

    await newAlert.save();

    emitAlertEvent(req, 'alert:new', newAlert);

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'CREATE_ALERT',
      resource: { type: 'ALERT', id: alertId },
      outcome: 'SUCCESS',
      details: { title, severity: newAlert.severity, category: newAlert.category, source }
    });

    res.status(201).json({ success: true, data: newAlert });
  } catch (error) {
    logger.error('Failed to create alert:', error);
    res.status(500).json({ success: false, error: 'Failed to create alert' });
  }
};

/**
 * Transition alert to ACKNOWLEDGED
 */
exports.acknowledgeAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const alert = await Alert.findOne({
      $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert ${id} not found` });
    }

    const previousState = { status: alert.status };
    alert.status = 'ACKNOWLEDGED';
    alert.acknowledgedBy = userId;
    alert.acknowledgedAt = new Date();

    await alert.save();
    emitAlertEvent(req, 'alert:status', alert);

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'ALERT_STATE_TRANSITION',
      resource: { type: 'ALERT', id: alert.alertId },
      outcome: 'SUCCESS',
      details: { previousState, newState: { status: alert.status } }
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Failed to acknowledge alert:', error);
    res.status(500).json({ success: false, error: 'Failed to acknowledge alert' });
  }
};

/**
 * Transition alert to INVESTIGATING
 */
exports.investigateAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const alert = await Alert.findOne({
      $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert ${id} not found` });
    }

    const previousState = { status: alert.status };
    alert.status = 'INVESTIGATING';

    await alert.save();
    emitAlertEvent(req, 'alert:status', alert);

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'ALERT_STATE_TRANSITION',
      resource: { type: 'ALERT', id: alert.alertId },
      outcome: 'SUCCESS',
      details: { previousState, newState: { status: alert.status } }
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Failed to investigate alert:', error);
    res.status(500).json({ success: false, error: 'Failed to update alert' });
  }
};

/**
 * Transition alert to RESOLVED
 */
exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNotes } = req.body;
    const user = req.user;
    const userId = user?.id || user?._id || 'system';

    const alert = await Alert.findOne({
      $or: [{ alertId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }]
    });

    if (!alert) {
      return res.status(404).json({ success: false, error: `Alert ${id} not found` });
    }

    const previousState = { status: alert.status };
    alert.status = 'RESOLVED';
    alert.resolvedBy = userId;
    alert.resolvedAt = new Date();
    alert.resolutionNotes = resolutionNotes || 'Resolved by operator';

    await alert.save();
    emitAlertEvent(req, 'alert:status', alert);

    await auditLogger.log({
      actor: { id: userId, email: user?.email, role: user?.role },
      action: 'ALERT_STATE_TRANSITION',
      resource: { type: 'ALERT', id: alert.alertId },
      outcome: 'SUCCESS',
      details: { previousState, newState: { status: alert.status }, resolutionNotes: alert.resolutionNotes }
    });

    res.json({ success: true, data: alert });
  } catch (error) {
    logger.error('Failed to resolve alert:', error);
    res.status(500).json({ success: false, error: 'Failed to resolve alert' });
  }
};
