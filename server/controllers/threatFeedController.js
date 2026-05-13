const { getThreatFeed } = require('../services/threatFeed');

const getLiveThreatFeed = async (req, res, next) => {
  try {
    const feed = await getThreatFeed();
    res.json({
      source: 'CISA Cybersecurity Alerts & Advisories',
      sourceUrl: feed.sourceUrl,
      fetchedAt: new Date(feed.fetchedAt).toISOString(),
      items: feed.items,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getLiveThreatFeed,
};
