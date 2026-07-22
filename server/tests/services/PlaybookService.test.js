const mongoose = require('mongoose');
const PlaybookService = require('../../services/platform/PlaybookService');
const RBACService = require('../../services/org/RBACService');
const Playbook = require('../../models/Playbook');
const QueryBuilder = require('../../utils/QueryBuilder');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/Playbook');

describe('PlaybookService', () => {
    let orgId, userId;

    beforeEach(() => {
        orgId = new mongoose.Types.ObjectId().toString();
        userId = new mongoose.Types.ObjectId().toString();
        jest.clearAllMocks();
        RBACService.requirePermission.mockResolvedValue('viewer');

        QueryBuilder.mockImplementation(() => {
            const qb = {
                tenant: jest.fn().mockReturnThis(),
                filter: jest.fn().mockReturnThis(),
                paginate: jest.fn().mockReturnThis(),
                sortBy: jest.fn().mockReturnThis(),
                mongoQuery: {},
                execute: jest.fn().mockResolvedValue({
                    data: [{ _id: '123', name: 'Auto-isolate' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    it('should retrieve playbooks', async () => {
        const result = await PlaybookService.getPlaybooks(orgId, userId, {});
        expect(result.data.length).toBe(1);
    });

    it('should update playbook', async () => {
        Playbook.findOneAndUpdate.mockResolvedValue({ _id: '123', name: 'New Name' });
        const result = await PlaybookService.updatePlaybook(orgId, userId, '123', { name: 'New Name' });
        expect(result.name).toBe('New Name');
    });

    it('should delete playbook', async () => {
        Playbook.findOneAndDelete.mockResolvedValue({ _id: '123' });
        const result = await PlaybookService.deletePlaybook(orgId, userId, '123');
        expect(result.success).toBe(true);
    });
});
