const IOCRepository = require('./intelligence/repositories/IOCRepository');
const ThreatFeedRepository = require('./intelligence/repositories/ThreatFeedRepository');
const CorrelationRepository = require('./intelligence/repositories/CorrelationRepository');

const IOCService = require('./intelligence/IOCService');
const ThreatFeedService = require('./intelligence/ThreatFeedService');
const CorrelationService = require('./intelligence/CorrelationService');

// We need the security module for cross-domain repository dependencies
const { getSecurityModule } = require('./securityComposition');

let cachedModule = null;

function createIntelligenceModule(activeStorageProvider, eventPublisher) {
    // 1. Create Repositories
    const iocRepo = new IOCRepository({ storageProvider: activeStorageProvider });
    const threatFeedRepo = new ThreatFeedRepository({ storageProvider: activeStorageProvider });
    const correlationRepo = new CorrelationRepository({ storageProvider: activeStorageProvider });

    // Try to get security module dependencies if initialized
    let assetRepo = null;
    let scanRepo = null;
    try {
        const securityModule = getSecurityModule();
        assetRepo = securityModule.assetRepo;
        scanRepo = securityModule.scanRepo;
    } catch (err) {
        console.warn('[INTELLIGENCE-COMPOSITION] Security module not initialized yet. CorrelationService might lack cross-domain repos.');
    }

    // 2. Create Services
    const iocService = new IOCService({
        iocRepo,
        eventPublisher
    });

    const threatFeedService = new ThreatFeedService({
        threatFeedRepo,
        iocRepo,
        eventPublisher
    });

    const correlationService = new CorrelationService({
        correlationRepo,
        iocRepo,
        threatFeedRepo,
        assetRepo,
        scanRepo,
        eventPublisher
    });

    return {
        iocRepo, threatFeedRepo, correlationRepo,
        iocService, threatFeedService, correlationService
    };
}

function getIntelligenceModule(deps = {}) {
    if (!cachedModule) {
        if (!deps.activeStorageProvider) throw new Error('Cannot initialize IntelligenceModule without activeStorageProvider');
        cachedModule = createIntelligenceModule(deps.activeStorageProvider, deps.eventPublisher);
    }
    return cachedModule;
}

module.exports = { createIntelligenceModule, getIntelligenceModule };
