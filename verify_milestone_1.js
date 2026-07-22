const mongoose = require('mongoose');
const { getAuthModule } = require('./server/services/authComposition');
const MongoStorageProvider = require('./server/providers/storage/MongoStorageProvider');
const dotenv = require('dotenv');

dotenv.config({ path: './server/.env' });

async function runValidation() {
    try {
        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/cybershield_x_test');
        console.log('Connected.');

        const storageProvider = new MongoStorageProvider();
        const eventPublisher = {
            publish: async (evt) => console.log('Mock Event published:', evt.type)
        };
        const permissionManager = {};

        const authModule = getAuthModule({
            storageManager: {},
            eventPublisher,
            activeStorageProvider: storageProvider,
            permissionManager,
            capabilityResolver: {}
        });

        console.log('\\n--- Repository Verification ---');
        console.log('UserRepository implemented IRepository?', !!authModule.userRepo.findById);
        console.log('OrganizationRepository implemented IRepository?', !!authModule.orgRepo.findById);
        console.log('TeamRepository implemented IRepository?', !!authModule.teamRepo.findById);
        console.log('MembershipRepository implemented IRepository?', !!authModule.membershipRepo.findById);

        console.log('\\n--- Runtime Verification ---');
        
        // 1. Create User
        console.log('Testing User creation...');
        const user = await authModule.userService.userRepo.create({
            id: new mongoose.Types.ObjectId().toString(),
            username: 'testuser_' + Date.now(),
            email: `test${Date.now()}@example.com`,
            password: 'hash',
            role: 'user'
        });
        console.log('User created:', user.id);

        // 2. Create Org
        console.log('Testing Org creation...');
        const org = await authModule.orgService.createOrganization('Test Org', 'Desc', user.id);
        console.log('Org created:', org.id);

        // 3. Create Team
        console.log('Testing Team creation...');
        const team = await authModule.teamService.createTeam(org.id, 'Test Team');
        console.log('Team created:', team.id);

        // 4. Create Membership
        console.log('Testing Membership creation...');
        const membership = await authModule.membershipService.addMemberByUserId(org.id, user.id, 'owner', [team.id]);
        console.log('Membership created:', membership.id);

        console.log('\\nValidation Successful.');
        process.exit(0);
    } catch (err) {
        console.error('Validation Failed:', err);
        process.exit(1);
    }
}

runValidation();
