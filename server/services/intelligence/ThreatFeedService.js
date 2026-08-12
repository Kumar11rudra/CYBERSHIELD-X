const axios = require('axios');
const logger = require('../../utils/logger');

const SYNC_LIMIT = parseInt(process.env.THREAT_FEED_LIMIT, 10) || 200;

class ThreatFeedService {
    constructor(deps) {
        this.threatFeedRepo = deps.threatFeedRepo;
        this.iocRepo = deps.iocRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async fetchWithRetry(url, options = {}, retries = 3) {
        const timeout = options.timeout || 8000;
        for (let attempt = 1; attempt <= retries; attempt++) {
            let id;
            try {
                const controller = new AbortController();
                id = setTimeout(() => controller.abort(), timeout);
                const res = await axios.get(url, {
                    ...options,
                    signal: controller.signal,
                    timeout
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
    }

    async propagateToIOCRecord(feedRecord) {
        if (feedRecord.indicatorType === 'cve') return;

        try {
            let reputation = 80;
            if (feedRecord.severity === 'Critical') reputation = 95;
            else if (feedRecord.severity === 'High') reputation = 85;
            else if (feedRecord.severity === 'Medium') reputation = 60;
            else if (feedRecord.severity === 'Low') reputation = 30;

            const data = {
                type: feedRecord.indicatorType,
                value: feedRecord.indicator.toLowerCase(),
                reputation,
                confidence: feedRecord.confidence,
                source: feedRecord.source,
                sourceType: 'feed',
                tags: [feedRecord.source.toLowerCase(), 'malicious'],
                lastSeen: new Date()
            };

            const record = await this.iocRepo.upsert({ type: feedRecord.indicatorType, value: feedRecord.indicator.toLowerCase() }, data);

            if (this.eventPublisher) {
                this.eventPublisher.publish('IOC_UPDATED', {
                    iocId: record.id,
                    type: record.type,
                    value: record.value
                });
            }
        } catch (err) {
            logger.error(`[THREAT-SYNC] Propagation to IOCRecord failed for ${feedRecord.indicator}: ${err.message}`);
        }
    }

    async syncURLHaus() {
        logger.info('[THREAT-SYNC] Fetching URLHaus malware URLs feed...');
        try {
            const res = await this.fetchWithRetry('https://urlhaus.abuse.ch/downloads/text/');
            const lines = res.data.split('\n');
            let ingested = 0;

            for (const line of lines) {
                if (ingested >= SYNC_LIMIT) break;
                const cleanLine = line.trim();
                if (!cleanLine || cleanLine.startsWith('#')) continue;

                const data = {
                    source: 'URLHaus',
                    indicator: cleanLine,
                    indicatorType: 'url',
                    confidence: 90,
                    severity: 'High',
                    active: true,
                    lastSeen: new Date()
                };

                const record = await this.threatFeedRepo.upsert({ source: 'URLHaus', indicator: cleanLine }, data);
                await this.propagateToIOCRecord(record);
                ingested++;
            }
            logger.info(`[THREAT-SYNC] URLHaus synchronization complete. Ingested: ${ingested} records.`);
            return { success: true, count: ingested };
        } catch (err) {
            logger.error(`[THREAT-SYNC] URLHaus feed sync failed: ${err.message}. Using cache.`);
            return { success: false, error: err.message };
        }
    }

    async syncOpenPhish() {
        logger.info('[THREAT-SYNC] Fetching OpenPhish active phishing links...');
        try {
            const res = await this.fetchWithRetry('https://openphish.com/feed.txt');
            const lines = res.data.split('\n');
            let ingested = 0;

            for (const line of lines) {
                if (ingested >= SYNC_LIMIT) break;
                const cleanLine = line.trim();
                if (!cleanLine || cleanLine.startsWith('#')) continue;

                const data = {
                    source: 'OpenPhish',
                    indicator: cleanLine,
                    indicatorType: 'url',
                    confidence: 95,
                    severity: 'Critical',
                    active: true,
                    lastSeen: new Date()
                };

                const record = await this.threatFeedRepo.upsert({ source: 'OpenPhish', indicator: cleanLine }, data);
                await this.propagateToIOCRecord(record);
                ingested++;
            }
            logger.info(`[THREAT-SYNC] OpenPhish synchronization complete. Ingested: ${ingested} records.`);
            return { success: true, count: ingested };
        } catch (err) {
            logger.error(`[THREAT-SYNC] OpenPhish feed sync failed: ${err.message}. Using cache.`);
            return { success: false, error: err.message };
        }
    }

    async syncFeodoTracker() {
        logger.info('[THREAT-SYNC] Fetching Feodo Tracker active C2 blocklist...');
        try {
            const res = await this.fetchWithRetry('https://feodotracker.abuse.ch/downloads/ipblocklist.txt');
            const lines = res.data.split('\n');
            let ingested = 0;

            for (const line of lines) {
                if (ingested >= SYNC_LIMIT) break;
                const cleanLine = line.trim();
                if (!cleanLine || cleanLine.startsWith('#')) continue;

                const data = {
                    source: 'FeodoTracker',
                    indicator: cleanLine,
                    indicatorType: 'ip',
                    confidence: 90,
                    severity: 'High',
                    active: true,
                    lastSeen: new Date()
                };

                const record = await this.threatFeedRepo.upsert({ source: 'FeodoTracker', indicator: cleanLine }, data);
                await this.propagateToIOCRecord(record);
                ingested++;
            }
            logger.info(`[THREAT-SYNC] Feodo Tracker synchronization complete. Ingested: ${ingested} records.`);
            return { success: true, count: ingested };
        } catch (err) {
            logger.error(`[THREAT-SYNC] Feodo Tracker feed sync failed: ${err.message}. Using cache.`);
            return { success: false, error: err.message };
        }
    }

    async syncCisaKev() {
        logger.info('[THREAT-SYNC] Fetching CISA Known Exploited Vulnerabilities catalog...');
        try {
            const res = await this.fetchWithRetry('https://www.cisa.gov/sites/default/files/feeds/known_exploited_vulnerabilities.json');
            if (!res.data || !res.data.vulnerabilities) {
                throw new Error('Malformed JSON payload from CISA endpoint.');
            }
            const vulns = res.data.vulnerabilities;
            let ingested = 0;

            for (const vuln of vulns) {
                if (ingested >= SYNC_LIMIT) break;
                if (!vuln.cveID) continue;

                const data = {
                    source: 'CISA-KEV',
                    indicator: vuln.cveID,
                    indicatorType: 'cve',
                    confidence: 100,
                    severity: 'Critical',
                    rawData: vuln,
                    active: true,
                    lastSeen: new Date()
                };

                await this.threatFeedRepo.upsert({ source: 'CISA-KEV', indicator: vuln.cveID }, data);
                ingested++;
            }
            logger.info(`[THREAT-SYNC] CISA KEV synchronization complete. Ingested: ${ingested} records.`);
            return { success: true, count: ingested };
        } catch (err) {
            logger.error(`[THREAT-SYNC] CISA KEV feed sync failed: ${err.message}. Using cache.`);
            return { success: false, error: err.message };
        }
    }

    async syncAllFeeds() {
        logger.info('[THREAT-SYNC] Commencing global threat intelligence synchronization sequence...');
        
        if (this.eventPublisher) {
            this.eventPublisher.publish('THREAT_FEED_SYNC_STARTED', { timestamp: new Date() });
        }

        const results = await Promise.all([
            this.syncURLHaus(),
            this.syncOpenPhish(),
            this.syncFeodoTracker(),
            this.syncCisaKev()
        ]);

        const success = results.every((r) => r.success);
        logger.info(`[THREAT-SYNC] Threat intelligence synchronization sequence completed. Success: ${success}`);
        
        if (this.eventPublisher) {
            if (success) {
                this.eventPublisher.publish('THREAT_FEED_SYNC_COMPLETED', { timestamp: new Date() });
            } else {
                this.eventPublisher.publish('THREAT_FEED_SYNC_FAILED', { timestamp: new Date() });
            }
        }

        return {
            success,
            urlhaus: results[0],
            openphish: results[1],
            feodotracker: results[2],
            cisakev: results[3]
        };
    }

    async getFeedStats() {
        const records = await this.threatFeedRepo.findMany({});
        const formatted = {
            URLHaus: 0,
            OpenPhish: 0,
            FeodoTracker: 0,
            'CISA-KEV': 0
        };

        records.forEach(r => {
            if (formatted[r.source] !== undefined) {
                formatted[r.source]++;
            }
        });

        return formatted;
    }

    async getFeedHealth() {
        const sources = ['URLHaus', 'OpenPhish', 'FeodoTracker', 'CISA-KEV'];
        const health = {};

        const allRecords = await this.threatFeedRepo.findMany({});
        
        for (const source of sources) {
            const sourceRecords = allRecords.filter(r => r.source === source);
            sourceRecords.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            const latestRecord = sourceRecords[0];

            if (latestRecord) {
                const timeDiffMs = Date.now() - new Date(latestRecord.updatedAt).getTime();
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
    }

    async getLiveThreatFeed() {
        const { getThreatFeed } = require('../../threatFeed');
        return await getThreatFeed();
    }
}

module.exports = ThreatFeedService;
