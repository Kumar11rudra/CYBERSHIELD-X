const Watchlist = require('../models/Watchlist');
const logger = require('../utils/logger');
const { detectInputType, normalizeScanTarget } = require('../utils/validators');

const VALID_SCAN_INTERVALS = new Set(['daily', 'weekly']);

const getWatchlist = async (req, res, next) => {
  try {
    const list = await Watchlist.find({ userId: req.user._id }).sort({ createdAt: -1 });
    res.json({ watchlist: list });
  } catch (error) {
    next(error);
  }
};

const addToWatchlist = async (req, res, next) => {
  try {
    const normalizedTarget = normalizeScanTarget(req.body.target || '');
    if (!normalizedTarget) {
      return res.status(400).json({ error: 'Enter a valid URL, domain, IP address, or MD5/SHA hash' });
    }

    const inferredType = detectInputType(normalizedTarget);
    const requestedType = req.body.targetType ? String(req.body.targetType).trim().toLowerCase() : inferredType;
    if (!inferredType || requestedType !== inferredType) {
      return res.status(400).json({ error: 'Target type does not match the provided target' });
    }

    const interval = VALID_SCAN_INTERVALS.has(req.body.scanInterval) ? req.body.scanInterval : 'daily';

    // Check if already watching
    const existing = await Watchlist.findOne({
      userId: req.user._id,
      target: normalizedTarget,
      targetType: inferredType,
    });
    if (existing) return res.status(400).json({ error: 'Already tracking this target' });

    const newItem = await Watchlist.create({
      userId: req.user._id,
      target: normalizedTarget,
      targetType: inferredType,
      scanInterval: interval,
      nextRunAt: new Date() // Run immediately or next cron cycle
    });

    logger.info(`[AUDIT] Target added to watchlist: ${normalizedTarget} by ${req.user._id}`);
    res.status(201).json({ message: 'Target added to watchlist', item: newItem });
  } catch (error) {
    next(error);
  }
};

const removeFromWatchlist = async (req, res, next) => {
  try {
    const item = await Watchlist.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!item) return res.status(404).json({ error: 'Item not found' });

    logger.info(`[AUDIT] Target removed from watchlist: ${item.target} by ${req.user._id}`);
    res.json({ message: 'Target removed from watchlist' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getWatchlist, addToWatchlist, removeFromWatchlist };
