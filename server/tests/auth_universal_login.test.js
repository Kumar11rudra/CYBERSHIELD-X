const request = require('supertest');
const { app } = require('../index');
const { connectTestDb, closeTestDb, clearTestDb } = require('./helpers/testDbHelper');

describe('Universal 3-Way Authentication (Username / Email / Mobile)', () => {
    beforeAll(async () => {
        await connectTestDb();
    });

    afterAll(async () => {
        await closeTestDb();
    });

    beforeEach(async () => {
        await clearTestDb();
    });

    it('should register a new user and login successfully via Username, Email, AND Mobile Number', async () => {
        // 1. Register account
        const signupRes = await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'cyber_operative',
                email: 'operative@cybershieldx.in',
                password: 'Password123!',
                fullName: 'Cyber Operative',
                mobileNumber: '+919876543210'
            });

        expect(signupRes.status).toBe(201);
        expect(signupRes.body.success).toBe(true);
        expect(signupRes.body.user.username).toBe('cyber_operative');

        // 2. Login via Username
        const loginByUsername = await request(app)
            .post('/api/auth/login')
            .send({
                identity: 'cyber_operative',
                password: 'Password123!'
            });

        expect(loginByUsername.status).toBe(200);
        expect(loginByUsername.body.success).toBe(true);
        expect(loginByUsername.body.token).toBeDefined();
        expect(loginByUsername.body.user.username).toBe('cyber_operative');

        // 3. Login via Email Address
        const loginByEmail = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'operative@cybershieldx.in',
                password: 'Password123!'
            });

        expect(loginByEmail.status).toBe(200);
        expect(loginByEmail.body.success).toBe(true);
        expect(loginByEmail.body.token).toBeDefined();
        expect(loginByEmail.body.user.email).toBe('operative@cybershieldx.in');

        // 4. Login via Mobile Number (with country code)
        const loginByMobileFull = await request(app)
            .post('/api/auth/login')
            .send({
                identity: '+919876543210',
                password: 'Password123!'
            });

        expect(loginByMobileFull.status).toBe(200);
        expect(loginByMobileFull.body.success).toBe(true);
        expect(loginByMobileFull.body.token).toBeDefined();

        // 5. Login via Mobile Number (10 raw digits)
        const loginByMobileDigits = await request(app)
            .post('/api/auth/login')
            .send({
                identity: '9876543210',
                password: 'Password123!'
            });

        expect(loginByMobileDigits.status).toBe(200);
        expect(loginByMobileDigits.body.success).toBe(true);
        expect(loginByMobileDigits.body.token).toBeDefined();
    });

    it('should reject login with wrong password (401)', async () => {
        await request(app)
            .post('/api/auth/signup')
            .send({
                username: 'agent_smith',
                email: 'smith@matrix.com',
                password: 'Password123!',
                fullName: 'Agent Smith',
                mobileNumber: '+919123456789'
            });

        const res = await request(app)
            .post('/api/auth/login')
            .send({
                identity: 'agent_smith',
                password: 'WrongPassword999!'
            });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject login for nonexistent account (401)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({
                identity: 'non_existent_user_99',
                password: 'Password123!'
            });

        expect(res.status).toBe(401);
        expect(res.body.error).toBe('Invalid credentials');
    });

    it('should reject empty login credentials (400)', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .send({});

        expect(res.status).toBe(400);
    });
});
