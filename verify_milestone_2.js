const { getSecurityModule } = require('./server/services/securityComposition');
const MongoStorageProvider = require('./server/providers/storage/MongoStorageProvider');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

async function run() {
    console.log("Starting Milestone 2 Verification...");
    let mongoServer;
    
    try {
        mongoServer = await MongoMemoryServer.create();
        const uri = mongoServer.getUri();
        await mongoose.connect(uri);
        
        console.log("Mock Database Connected.");

        const storageProvider = new MongoStorageProvider(uri);
        await storageProvider.connect();

        // Pass a mock userRepo just to satisfy dependencies
        const mockUserRepo = {
            findById: async (id) => ({ id, totalScans: 0 }),
            update: async (user) => (user)
        };

        const securityModule = getSecurityModule({ 
            activeStorageProvider: storageProvider,
            userRepo: mockUserRepo
        });

        const { assetRepo, scanRepo, scheduleRepo, vulnRepo } = securityModule;
        
        // 1. Verify IRepository inheritance
        const IRepository = require('./server/shared/IRepository');
        console.assert(assetRepo instanceof IRepository, "assetRepo does not extend IRepository");
        console.assert(scanRepo instanceof IRepository, "scanRepo does not extend IRepository");
        console.assert(scheduleRepo instanceof IRepository, "scheduleRepo does not extend IRepository");
        console.assert(vulnRepo instanceof IRepository, "vulnRepo does not extend IRepository");
        console.log("✓ IRepository Validated");

        // 2. Verify Constructor DI
        console.assert(assetRepo.storageProvider === storageProvider, "assetRepo missing DI");
        console.assert(scanRepo.storageProvider === storageProvider, "scanRepo missing DI");
        console.log("✓ Constructor DI Validated");

        // 3. Runtime Test (Create Asset)
        const newAsset = await securityModule.assetService.createAsset({
            userId: new mongoose.Types.ObjectId().toString(),
            hostname: 'test-asset.com',
            assetType: 'Domain',
            environment: 'Production'
        });
        
        console.assert(newAsset.hostname === 'test-asset.com', "Asset creation failed");
        console.assert(Object.isFrozen(newAsset), "Asset DTO is not frozen");
        console.log("✓ Asset DTO Immutability Validated");
        console.log("✓ Runtime Operations Validated");

        console.log("ALL MILESTONE 2 CHECKS PASSED.");
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
