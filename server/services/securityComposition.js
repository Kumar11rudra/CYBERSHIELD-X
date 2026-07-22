const AssetRepository = require('./security/repositories/AssetRepository');
const ScanRepository = require('./security/repositories/ScanRepository');
const ScheduledScanRepository = require('./security/repositories/ScheduledScanRepository');
const VulnerabilityRepository = require('./security/repositories/VulnerabilityRepository');

const AssetService = require('./security/AssetService');
const ScanService = require('./security/ScanService');
const ScheduledScanService = require('./security/ScheduledScanService');
const VulnerabilityService = require('./security/VulnerabilityService');

let cachedModule = null;

function createSecurityModule(activeStorageProvider, userRepo) {
    // 1. Create Repositories
    const assetRepo = new AssetRepository({ storageProvider: activeStorageProvider });
    const scanRepo = new ScanRepository({ storageProvider: activeStorageProvider });
    const scheduleRepo = new ScheduledScanRepository({ storageProvider: activeStorageProvider });
    const vulnRepo = new VulnerabilityRepository({ storageProvider: activeStorageProvider });

    // 2. Create Services
    const assetService = new AssetService({
        assetRepo,
        scanRepo
    });

    const scanService = new ScanService({
        scanRepo,
        userRepo,
        storageProvider: activeStorageProvider
    });

    const scheduledScanService = new ScheduledScanService({
        scheduleRepo
    });

    const vulnerabilityService = new VulnerabilityService({
        vulnRepo,
        assetRepo,
        storageProvider: activeStorageProvider
    });

    return {
        assetRepo, scanRepo, scheduleRepo, vulnRepo,
        assetService, scanService, scheduledScanService, vulnerabilityService
    };
}

function getSecurityModule(deps = {}) {
    if (!cachedModule) {
        if (!deps.activeStorageProvider) throw new Error('Cannot initialize SecurityModule without activeStorageProvider');
        cachedModule = createSecurityModule(deps.activeStorageProvider, deps.userRepo);
    }
    return cachedModule;
}

module.exports = { createSecurityModule, getSecurityModule };
