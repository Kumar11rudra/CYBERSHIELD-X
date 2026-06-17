const axios = require('axios');
const ThreatFeedRecord = require('../models/ThreatFeedRecord');
const IOCRecord = require('../models/IOCRecord');
const logger = require('../utils/logger');

// Configurable limit from environment variable (default: 200)
const SYNC_LIMIT = parseInt(process.env.THREAT_FEED_LIMIT, 10) || 200;

// Helper function to fetch data with request timeout and retry capability
const fetchWithRetry = async (url, options = {}, retries = 3) => {
  const timeout = options.timeout || 8000;
  for (let attempt = 1; attempt <= retries; attempt++) {
    let id;
    try {
      const controller = new AbortController();
      id = setTimeout(() => controller.abort(), timeout);
      const res = await axios.get(url, {
        ...options,
        signal: controller.signal,
        timeout // fallback timeout
      });
      return res;
    } catch (err) {
      if (attempt === retries) {
        throw err;
      }
      logger.warn(`[THREAT-SYNC] Fetch attempt ${attempt} failed for ${url}: ${err.message}. Retrying...`);
      await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
    } finally {
      if (id) {
        clearTimeout(id);
      }
    }
  }
};

// Sync helpers to propagate active indicators from ThreatFeedRecord to IOCRecord
const propagateToIOCRecord = async (feedRecord) => {
  if (feedRecord.indicatorType === 'cve') return; // CVEs are stored in ThreatFeedRecord only

  try {
    // Map reputation based on severity
    let reputation = 80;
    if (feedRecord.severity === 'Critical') reputation = 95;
    else if (feedRecord.severity === 'High') reputation = 85;
    else if (feedRecord.severity === 'Medium') reputation = 60;
    else if (feedRecord.severity === 'Low') reputation = 30;

    await IOCRecord.findOneAndUpdate(
      { type: feedRecord.indicatorType, value: feedRecord.indicator.toLowerCase() },
      {
        type: feedRecord.indicatorType,
        value: feedRecord.indicator.toLowerCase(),
        reputation,
        confidence: feedRecord.confidence,
        source: feedRecord.source,
        sourceType: 'feed',
        tags: [feedRecord.source.toLowerCase(), 'malicious'],
        lastSeen: new Date()
      },
      { upsert: true, new: true }
    );
  } catch (err) {
    logger.error(`[THREAT-SYNC] Propagation to IOCRecord failed for ${feedRecord.indicator}: ${err.message}`);
  }
};

// 1. URLHaus Feed Ingestion
const syncURLHaus = async () => {
  logger.info('[THREAT-SYNC] Fetching URLHaus malware URLs feed...');
  try {
    const res = await fetchWithRetry('https://urlhaus.abuse.ch/downloads/text/');
    const lines = res.data.split('\n');
    let ingested = 0;

    for (const line of lines) {
      if (ingested >= SYNC_LIMIT) break;
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const record = await ThreatFeedRecord.findOneAndUpdate(
        { source: 'URLHaus', indicator: cleanLine },
        {
          source: 'URLHaus',
          indicator: cleanLine,
          indicatorType: 'url',
          confidence: 90,
          severity: 'High',
          active: true,
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
      await propagateToIOCRecord(record);
      ingested++;
    }
    logger.info(`[THREAT-SYNC] URLHaus synchronization complete. Ingested: ${ingested} records.`);
    return { success: true, count: ingested };
  } catch (err) {
    logger.error(`[THREAT-SYNC] URLHaus feed sync failed: ${err.message}. Using cache.`);
    return { success: false, error: err.message };
  }
};

// 2. OpenPhish Feed Ingestion
const syncOpenPhish = async () => {
  logger.info('[THREAT-SYNC] Fetching OpenPhish active phishing links...');
  try {
    const res = await fetchWithRetry('https://openphish.com/feed.txt');
    const lines = res.data.split('\n');
    let ingested = 0;

    for (const line of lines) {
      if (ingested >= SYNC_LIMIT) break;
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const record = await ThreatFeedRecord.findOneAndUpdate(
        { source: 'OpenPhish', indicator: cleanLine },
        {
          source: 'OpenPhish',
          indicator: cleanLine,
          indicatorType: 'url',
          confidence: 95,
          severity: 'Critical',
          active: true,
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
      await propagateToIOCRecord(record);
      ingested++;
    }
    logger.info(`[THREAT-SYNC] OpenPhish synchronization complete. Ingested: ${ingested} records.`);
    return { success: true, count: ingested };
  } catch (err) {
    logger.error(`[THREAT-SYNC] OpenPhish feed sync failed: ${err.message}. Using cache.`);
    return { success: false, error: err.message };
  }
};

// 3. Abuse.ch Feodo Tracker Ingestion
const syncFeodoTracker = async () => {
  logger.info('[THREAT-SYNC] Fetching Feodo Tracker active C2 blocklist...');
  try {
    const res = await fetchWithRetry('https://feodotracker.abuse.ch/downloads/ipblocklist.txt');
    const lines = res.data.split('\n');
    let ingested = 0;

    for (const line of lines) {
      if (ingested >= SYNC_LIMIT) break;
      const cleanLine = line.trim();
      if (!cleanLine || cleanLine.startsWith('#')) continue;

      const record = await ThreatFeedRecord.findOneAndUpdate(
        { source: 'FeodoTracker', indicator: cleanLine },
        {
          source: 'FeodoTracker',
          indicator: cleanLine,
          indicatorType: 'ip',
          confidence: 90,
          severity: 'High',
          active: true,
          lastSeen: new Date()
        },
        { upsert: true, new: true }
      );
      await propagateToIOCRecord(record);
      ingested++;
    }
    logger.info(`[THREAT-SYNC] Feodo Tracker synchronization complete. Ingested: ${ingested} records.`);
    return { success: true, count: ingested };
  } catch (err) {
    logger.error(`[THREAT-SYNC] Feodo Tracker feed sync failed: ${err.message}. Using cache.`);
    return { success: false, error: err.message };
  }
};

// 4. CISA KEV JSON Ingestion
const syncCisaKev = async () => {
  logger.info('[THREAT-SYNC] Fetching CISA Known Exploited Vulnerabilities catalog...');
  try {
    const res = await fetchWithRetry('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
    if (!res.data || !res.data.vulnerabilities) {
      throw new Error('Malformed JSON payload from CISA endpoint.');
    }
    const vulns = res.data.vulnerabilities;
    let ingested = 0;

    for (const vuln of vulns) {
      if (ingested >= SYNC_LIMIT) break;
      if (!vuln.cveID) continue;

      await ThreatFeedRecord.findOneAndUpdate(
        { source: 'CISA-KEV', indicator: vuln.cveID },
        {
          source: 'CISA-KEV',
          indicator: vuln.cveID,
          indicatorType: 'cve',
          confidence: 100,
          severity: 'Critical',
          rawData: vuln,
          active: true,
          lastSeen: new Date()
        },
        { upsert: true }
      );
      ingested++;
    }
    logger.info(`[THREAT-SYNC] CISA KEV synchronization complete. Ingested: ${ingested} records.`);
    return { success: true, count: ingested };
  } catch (err) {
    logger.error(`[THREAT-SYNC] CISA KEV feed sync failed: ${err.message}. Using cache.`);
    return { success: false, error: err.message };
  }
};

// Core sync job coordinating all feeds
const syncAllFeeds = async () => {
  logger.info('[THREAT-SYNC] Commencing global threat intelligence synchronization sequence...');
  const results = await Promise.all([
    syncURLHaus(),
    syncOpenPhish(),
    syncFeodoTracker(),
    syncCisaKev()
  ]);

  const success = results.every((r) => r.success);
  logger.info(`[THREAT-SYNC] Threat intelligence synchronization sequence completed. Success: ${success}`);
  return {
    success,
    urlhaus: results[0],
    openphish: results[1],
    feodotracker: results[2],
    cisakev: results[3]
  };
};

// Fetch stats of stored records grouped by feed source
const getFeedStats = async () => {
  try {
    const stats = await ThreatFeedRecord.aggregate([
      { $group: { _id: '$source', count: { $sum: 1 } } }
    ]);

    const formatted = {
      URLHaus: 0,
      OpenPhish: 0,
      FeodoTracker: 0,
      'CISA-KEV': 0
    };

    stats.forEach((s) => {
      if (s._id in formatted) {
        formatted[s._id] = s.count;
      }
    });

    return formatted;
  } catch (err) {
    logger.error(`[THREAT-SYNC] Stats aggregation failed: ${err.message}`);
    return {};
  }
};

// Retrieve diagnostic health status and last sync time for all feeds
const getFeedHealth = async () => {
  try {
    const sources = ['URLHaus', 'OpenPhish', 'FeodoTracker', 'CISA-KEV'];
    const health = {};

    for (const source of sources) {
      const latestRecord = await ThreatFeedRecord.findOne({ source }).sort({ updatedAt: -1 });
      if (latestRecord) {
        const timeDiffMs = Date.now() - new Date(latestRecord.updatedAt).getTime();
        // If updated within last 36 hours, mark as healthy
        const status = timeDiffMs < 36 * 60 * 60 * 1000 ? 'healthy' : 'degraded';
        health[source] = {
          status,
          lastSyncAt: latestRecord.updatedAt
        };
      } else {
        health[source] = {
          status: 'unknown',
          lastSyncAt: null
        };
      }
    }
    return health;
  } catch (err) {
    logger.error(`[THREAT-SYNC] Diagnostic health retrieval failed: ${err.message}`);
    return {};
  }
};

module.exports = {
  syncAllFeeds,
  getFeedStats,
  getFeedHealth,
  syncURLHaus,
  syncOpenPhish,
  syncFeodoTracker,
  syncCisaKev
};
