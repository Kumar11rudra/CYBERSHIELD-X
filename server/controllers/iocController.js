const { getIntelligenceModule } = require('../services/intelligenceComposition');

exports.searchIOC = async (req, res, next) => {
    try {
        const { query } = req.query;
        const mod = getIntelligenceModule();
        const ioc = await mod.iocService.searchIOC(query);
        res.json({ success: true, ioc });
    } catch (err) {
        next(err);
    }
};

exports.addIOC = async (req, res, next) => {
    try {
        const mod = getIntelligenceModule();
        const ioc = await mod.iocService.addIOC(req.body);
        res.status(201).json({ success: true, ioc });
    } catch (err) {
        next(err);
    }
};

exports.getRecentIOCs = async (req, res, next) => {
    try {
        const mod = getIntelligenceModule();
        const iocs = await mod.iocService.getRecentIOCs(parseInt(req.query.limit) || 10);
        res.json({ success: true, iocs });
    } catch (err) {
        next(err);
    }
};

exports.runCorrelation = async (req, res, next) => {
    try {
        const { target, targetType } = req.query;
        if (!target || !targetType) {
            return res.status(400).json({ error: 'Target and Target Type query parameters are required' });
        }
        const mod = getIntelligenceModule();
        const result = await mod.correlationService.correlateTarget(target, targetType, req.user._id || req.user.id);
        res.json(result);
    } catch (err) {
        next(err);
    }
};

exports.triggerFeedSync = async (req, res, next) => {
    try {
        const mod = getIntelligenceModule();
        const result = await mod.threatFeedService.syncAllFeeds();
        res.json({ success: true, ...result });
    } catch (err) {
        next(err);
    }
};

exports.getFeedStatsAndHealth = async (req, res, next) => {
    try {
        const mod = getIntelligenceModule();
        const stats = await mod.threatFeedService.getFeedStats();
        const health = await mod.threatFeedService.getFeedHealth();
        const recentCorrelations = await mod.correlationService.getRecentCorrelations(req.user._id || req.user.id);
        res.json({ success: true, stats, health, recentCorrelations });
    } catch (err) {
        next(err);
    }
};
