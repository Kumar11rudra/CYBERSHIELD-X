const request = require('supertest');
const express = require('express');
const mongoose = require('mongoose');
const adminRoutes = require('../../routes/admin');
const User = require('../../models/User');
const SystemSettings = require('../../models/SystemSettings');
const ActivityLog = require('../../models/ActivityLog');

const app = express();
app.use(express.json());
app.use((req, res, next) => {
    // Mock authenticated admin user middleware for testing
    req.user = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
    next();
});

// Since the router uses `router.use(authenticate, requireAdmin)` internally, we need to bypass them or mock them.
// Wait, `server/routes/admin.js` requires `authenticate` and `requireAdmin` from `../middleware/auth`.
// When running tests, we either mock `../middleware/auth` or provide valid JWTs.
// Since we are loading the actual route file, let's inject a mock into the `require` cache before loading it.
jest.mock('../../middleware/auth', () => {
    const mongoose = require('mongoose');
    return {
        authenticate: (req, res, next) => {
            req.user = { _id: new mongoose.Types.ObjectId(), role: 'admin' };
            next();
        },
        requireAdmin: (req, res, next) => next()
    };
});
// Re-require after mocking
const mockAdminRoutes = require('../../routes/admin');
app.use('/api/admin', mockAdminRoutes);

// Error handler
app.use((err, req, res, next) => {
    res.status(err.status || 500).json({ error: err.message });
});

describe('AdminController', () => {
    let mockUserId;

    beforeAll(async () => {
        const url = 'mongodb://127.0.0.1:27017/cybershield_test_admin';
        await mongoose.connect(url, { useNewUrlParser: true, useUnifiedTopology: true });
    });

    afterAll(async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();
    });

    beforeEach(async () => {
        await User.deleteMany({});
        await SystemSettings.deleteMany({});
        await ActivityLog.deleteMany({});

        const user = await User.create({
            email: 'test@example.com',
            username: 'testuser',
            password: 'Password123!',
            role: 'user'
        });
        mockUserId = user._id;

        // Ensure there are at least two admins so we don't trip the "last admin" check
        await User.create({
            email: 'admin1@example.com',
            username: 'admin1',
            password: 'Password123!',
            role: 'admin'
        });
        await User.create({
            email: 'admin2@example.com',
            username: 'admin2',
            password: 'Password123!',
            role: 'admin'
        });
    });

    it('GET /api/admin/users - should fetch users with pagination', async () => {
        const res = await request(app).get('/api/admin/users?page=1&limit=10');
        expect(res.status).toBe(200);
        expect(res.body.users).toHaveLength(3); // 1 user + 2 admins
        expect(res.body.pagination).toBeDefined();
        expect(res.body.users[0].password).toBeUndefined();
    });

    it('GET /api/admin/stats - should fetch platform stats', async () => {
        const res = await request(app).get('/api/admin/stats');
        expect(res.status).toBe(200);
        expect(res.body.users).toBe(3);
        expect(res.body.timestamp).toBeDefined();
    });

    it('PATCH /api/admin/users/:id/role - should update user role', async () => {
        const res = await request(app).patch(`/api/admin/users/${mockUserId}/role`).send({ role: 'analyst' });
        expect(res.status).toBe(200);
        expect(res.body.user.role).toBe('analyst');

        const logs = await ActivityLog.find({});
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('UPDATE_USER_ROLE');
    });

    it('DELETE /api/admin/users/:id - should soft delete user', async () => {
        const res = await request(app).delete(`/api/admin/users/${mockUserId}`);
        expect(res.status).toBe(200);

        const deletedUser = await User.findById(mockUserId);
        expect(deletedUser.isDeleted).toBe(true);

        const logs = await ActivityLog.find({});
        expect(logs.length).toBe(1);
        expect(logs[0].action).toBe('DELETE_USER');
    });

    it('POST /api/admin/users/:id/ban - should toggle ban user', async () => {
        const res = await request(app).post(`/api/admin/users/${mockUserId}/ban`).send({ banReason: 'Violation' });
        expect(res.status).toBe(200);
        expect(res.body.isBanned).toBe(true);

        const user = await User.findById(mockUserId);
        expect(user.isBanned).toBe(true);
        expect(user.banReason).toBe('Violation');
    });

    it('POST /api/admin/firewall - should add firewall rule', async () => {
        const res = await request(app).post('/api/admin/firewall').send({ ip: '1.2.3.4' });
        expect(res.status).toBe(200);
        expect(res.body.rules).toContain('1.2.3.4');
    });

    it('POST /api/admin/maintenance - should toggle maintenance mode', async () => {
        const res = await request(app).post('/api/admin/maintenance').send({ enabled: true, message: 'Testing' });
        expect(res.status).toBe(200);
        expect(res.body.enabled).toBe(true);
        expect(res.body.message).toBe('Testing');

        const statusRes = await request(app).get('/api/admin/maintenance');
        expect(statusRes.body.enabled).toBe(true);
    });

    it('GET /api/admin/telemetry - should return OS metrics', async () => {
        const res = await request(app).get('/api/admin/telemetry');
        expect(res.status).toBe(200);
        expect(res.body.uptime).toBeDefined();
        expect(res.body.memory).toBeDefined();
    });
});
