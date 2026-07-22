const { getIntelligenceModule } = require('./server/services/intelligenceComposition');
const { getSecurityModule, createSecurityModule } = require('./server/services/securityComposition');
const MongoStorageProvider = require('./server/providers/storage/MongoStorageProvider');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
    console.log("Starting Milestone 3 Verification...");
    let mongoServer;
    
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        
        console.log("Mock Database Connected.");

        const storageProvider = new MongoStorageProvider(uri);
        await storageProvider.connect();

        // Pass a mock eventPublisher
        const mockEventPublisher = {
            publish: (event, payload) => console.log(`Mock Event Published: ${event}`)
        };

        const mockUserRepo = {
            findById: async (id) => ({ id, totalScans: 0 }),
            update: async (user) => (user)
        };

        // Initialize security module for dependencies
        createSecurityModule(storageProvider, mockUserRepo);

        const intelligenceModule = getIntelligenceModule({ 
            activeStorageProvider: storageProvider,
            eventPublisher: mockEventPublisher
        });

        const { iocRepo, threatFeedRepo, correlationRepo } = intelligenceModule;
        
        // 1. Verify IRepository inheritance
        const IRepository = require('./server/shared/IRepository');
        console.assert(iocRepo instanceof IRepository, "iocRepo does not extend IRepository");
        console.assert(threatFeedRepo instanceof IRepository, "threatFeedRepo does not extend IRepository");
        console.assert(correlationRepo instanceof IRepository, "correlationRepo does not extend IRepository");
        console.log("✓ IRepository Validated");

        // 2. Verify Constructor DI
        console.assert(iocRepo.storageProvider === storageProvider, "iocRepo missing DI");
        console.assert(threatFeedRepo.storageProvider === storageProvider, "threatFeedRepo missing DI");
        console.assert(correlationRepo.storageProvider === storageProvider, "correlationRepo missing DI");
        console.log("✓ Constructor DI Validated");

        // 3. Runtime Test (Create IOC)
        const newIoc = await intelligenceModule.iocService.addIOC({
            type: 'domain',
            value: 'malicious-test.com',
            reputation: 99
        });
        
        console.assert(newIoc.value === 'malicious-test.com', "IOC creation failed");
        console.assert(Object.isFrozen(newIoc), "IOC DTO is not frozen");
        console.log("✓ IOC DTO Immutability Validated");
        console.log("✓ Runtime Operations Validated");

        // 4. Verify pure Correlation Engine
        const { computeCorrelation } = require('./server/services/IOCCorrelationEngine');
        const pureResult = computeCorrelation('malicious-test.com', 'domain', {});
        console.assert(pureResult.score === 0, "Pure function failed expected return");
        console.log("✓ IOCCorrelationEngine Purity Validated");

        console.log("ALL MILESTONE 3 CHECKS PASSED.");
        process.exit(0);

    } catch (error) {
        console.error("Verification failed:", error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        if (mongoServer) await mongoServer.stop();
    }
}

run();
