const { getIntelligenceModule } = require('./intelligenceComposition');

const getService = () => {
    const mod = getIntelligenceModule();
    return mod.threatFeedService;
};

module.exports = {
    syncAllFeeds: (...args) => getService().syncAllFeeds(...args),
    getFeedStats: (...args) => getService().getFeedStats(...args),
    getFeedHealth: (...args) => getService().getFeedHealth(...args),
    syncURLHaus: (...args) => getService().syncURLHaus(...args),
    syncOpenPhish: (...args) => getService().syncOpenPhish(...args),
    syncFeodoTracker: (...args) => getService().syncFeodoTracker(...args),
    syncCisaKev: (...args) => getService().syncCisaKev(...args)
};
