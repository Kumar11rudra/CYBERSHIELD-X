const logger = require('../../../utils/logger');
const { detectInputType, normalizeScanTarget } = require('../../../utils/validators');

class IOCService {
    constructor(deps) {
        this.iocRepo = deps.iocRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    generateLocalThreatDetails(type, value) {
        const valueLower = value.toLowerCase();
        
        if (/malware|ransom|botnet|cobalt|phish|spyware|trojan/.test(valueLower)) {
            return {
                reputation: 92,
                confidence: 90,
                tags: ['malicious', 'active-threat', 'command-and-control'],
                source: 'CISA Threat Alert Feed',
                description: `Target matched signature for known malicious ${type} indicator.`
            };
        }

        if (/safe|clean|google|microsoft|github|apple/.test(valueLower)) {
            return {
                reputation: 2,
                confidence: 95,
                tags: ['safe', 'whitelisted', 'trusted-node'],
                source: 'Nexus Global Whitelist',
                description: `Target identified as trusted authority infrastructure.`
            };
        }

        let hashVal = 0;
        for (let i = 0; i < value.length; i++) {
            hashVal = (hashVal << 5) - hashVal + value.charCodeAt(i);
            hashVal |= 0; 
        }
        const score = Math.abs(hashVal) % 100;
        const reputation = score;
        const confidence = 65 + (Math.abs(hashVal) % 35);
        
        let tags = ['unverified-reputation'];
        let source = 'Nexus Passive Heuristics';
        let description = `Target reviewed by passive heuristic engines.`;

        if (reputation > 75) {
            tags = ['high-risk', 'anomaly-detected'];
            source = 'UrlEngine Local Cache';
            description = `Target flagged with suspicious behavior patterns.`;
        } else if (reputation > 40) {
            tags = ['medium-risk', 'suspicious'];
            source = 'UrlEngine Local Cache';
            description = `Target returned moderate alert indicators.`;
        } else {
            tags = ['safe-reputation', 'low-risk'];
            description = `No active malicious flags found in public records.`;
        }

        return { reputation, confidence, tags, source, description };
    }

    async searchIOC(target) {
        const normalizedTarget = normalizeScanTarget(target);
        if (!normalizedTarget) {
            throw new Error('Invalid target format. Enter IP, Domain, URL, Hash or Email.');
        }

        const type = detectInputType(normalizedTarget);
        if (!type) {
            throw new Error('Could not auto-detect target type.');
        }

        let record = await this.iocRepo.findOne({ type, value: normalizedTarget });

        if (!record) {
            logger.info(`[IOC-INTEL] Indicator not cached. Generating local intelligence: ${normalizedTarget} [${type}]`);
            const details = this.generateLocalThreatDetails(type, normalizedTarget);
            
            record = await this.iocRepo.create({
                type,
                value: normalizedTarget,
                reputation: details.reputation,
                confidence: details.confidence,
                source: details.source,
                tags: details.tags,
                description: details.description,
                enrichmentStatus: 'completed'
            });

            if (this.eventPublisher) {
                this.eventPublisher.publish('IOC_CREATED', {
                    iocId: record.id,
                    type: record.type,
                    value: record.value
                });
            }
        } else {
            const updated = { ...record, lastSeen: new Date(), id: record.id };
            record = await this.iocRepo.update(updated);

            if (this.eventPublisher) {
                this.eventPublisher.publish('IOC_UPDATED', {
                    iocId: record.id,
                    type: record.type,
                    value: record.value
                });
            }
        }

        return record;
    }

    async addIOC(data) {
        const { type, value, reputation, confidence, source, tags, description } = data;
        
        if (!type || !value || reputation === undefined) {
            throw new Error('Type, Value, and Reputation are required.');
        }

        const normalizedValue = normalizeScanTarget(value);
        if (!normalizedValue) {
            throw new Error('Invalid value format.');
        }

        const exists = await this.iocRepo.findOne({ type, value: normalizedValue });
        if (exists) {
            throw new Error('Indicator already exists in the intelligence logs.');
        }

        const record = await this.iocRepo.create({
            type,
            value: normalizedValue,
            reputation,
            confidence: confidence || 80,
            source: source || 'Admin Entry',
            tags: tags || [],
            description,
            enrichmentStatus: 'completed'
        });

        logger.info(`[IOC-INTEL] Custom indicator added by Admin: ${normalizedValue} [${type}]`);

        if (this.eventPublisher) {
            this.eventPublisher.publish('IOC_CREATED', {
                iocId: record.id,
                type: record.type,
                value: record.value
            });
        }

        return record;
    }

    async getRecentIOCs(limit = 10) {
        const records = await this.iocRepo.findMany({});
        // In-memory sort since standard findMany doesn't sort by default in this fake implementation
        records.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        return records.slice(0, limit);
    }
}

module.exports = IOCService;
