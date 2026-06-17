const ScheduledScan = require('../models/ScheduledScan');
const logger = require('../utils/logger');

const calculateNextRun = (frequency) => {
  const now = new Date();
  if (frequency === 'daily') {
    return new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else if (frequency === 'weekly') {
    return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  } else if (frequency === 'monthly') {
    return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  }
  return now;
};

const getSchedules = async (req, res, next) => {
  try {
    const query = req.organizationId
      ? { organizationId: req.organizationId }
      : { userId: req.user._id, organizationId: { $exists: false } };

    const schedules = await ScheduledScan.find(query).sort({ createdAt: -1 });
    res.json({ success: true, schedules });
  } catch (error) {
    next(error);
  }
};

const createSchedule = async (req, res, next) => {
  try {
    const { target, targetType, frequency, tools, scanMode, teamId } = req.body;

    if (!target || !targetType || !frequency) {
      return res.status(400).json({ error: 'Target, Target Type, and Frequency are required.' });
    }

    if (!['daily', 'weekly', 'monthly'].includes(frequency.toLowerCase())) {
      return res.status(400).json({ error: 'Frequency must be daily, weekly, or monthly.' });
    }

    const nextRun = calculateNextRun(frequency.toLowerCase());

    const schedule = await ScheduledScan.create({
      userId: req.user._id,
      organizationId: req.organizationId || undefined,
      teamId: teamId || undefined,
      target: target.trim(),
      targetType: targetType.toLowerCase(),
      frequency: frequency.toLowerCase(),
      tools: tools || ['nmap', 'ssl'],
      scanMode: scanMode || 'quick',
      nextRun,
    });

    logger.info(`[SCHEDULER] Created scheduled scan for ${target} [${frequency}]`);
    res.status(201).json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
};

const updateSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { frequency, isActive, tools, scanMode, teamId } = req.body;

    const query = req.organizationId
      ? { _id: id, organizationId: req.organizationId }
      : { _id: id, userId: req.user._id, organizationId: { $exists: false } };

    const schedule = await ScheduledScan.findOne(query);
    if (!schedule) {
      return res.status(404).json({ error: 'Scheduled scan not found or access denied.' });
    }

    if (frequency !== undefined) {
      if (!['daily', 'weekly', 'monthly'].includes(frequency.toLowerCase())) {
        return res.status(400).json({ error: 'Frequency must be daily, weekly, or monthly.' });
      }
      schedule.frequency = frequency.toLowerCase();
      schedule.nextRun = calculateNextRun(frequency.toLowerCase());
    }

    if (isActive !== undefined) schedule.isActive = isActive;
    if (tools !== undefined) schedule.tools = tools;
    if (scanMode !== undefined) schedule.scanMode = scanMode;
    if (teamId !== undefined) schedule.teamId = teamId || null;

    await schedule.save();
    res.json({ success: true, schedule });
  } catch (error) {
    next(error);
  }
};

const deleteSchedule = async (req, res, next) => {
  try {
    const { id } = req.params;

    const query = req.organizationId
      ? { _id: id, organizationId: req.organizationId }
      : { _id: id, userId: req.user._id, organizationId: { $exists: false } };

    const schedule = await ScheduledScan.findOneAndDelete(query);

    if (!schedule) {
      return res.status(404).json({ error: 'Scheduled scan not found or access denied.' });
    }

    logger.info(`[SCHEDULER] Removed scheduled scan for ${schedule.target}`);
    res.json({ success: true, message: 'Scheduled scan successfully deleted.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSchedules,
  createSchedule,
  updateSchedule,
  deleteSchedule,
  calculateNextRun,
};
