const mongoose = require('mongoose');
const DashboardAggregationService = require('../../services/platform/DashboardAggregationService');
const RBACService = require('../../services/org/RBACService');
const Scan = require('../../models/Scan');
const Asset = require('../../models/Asset');
const Vulnerability = require('../../models/Vulnerability');

jest.mock('../../services/org/RBACService');
jest.mock('../../models/Scan');
jest.mock('../../models/Asset');
jest.mock('../../models/Vulnerability');

describe('DashboardAggregationService', () => {
    let orgId, userId;

    beforeEach(() => {
        orgId = new mongoose.Types.ObjectId().toString();
        userId = new mongoose.Types.ObjectId().toString();
        jest.clearAllMocks();
        RBACService.requirePermission.mockResolvedValue('viewer');
    });

    it('should aggregate dashboard stats', async () => {
        Scan.countDocuments.mockResolvedValueOnce(10).mockResolvedValueOnce(2);
        Asset.countDocuments.mockResolvedValueOnce(5).mockResolvedValueOnce(4);
        Vulnerability.aggregate.mockResolvedValue([{ total: 10, critical: 2, high: 3, medium: 4, low: 1 }]);
        Scan.find.mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            limit: jest.fn().mockReturnThis(),
            lean: jest.fn().mockResolvedValue([])
        });

        const result = await DashboardAggregationService.getStats(orgId, userId);
        expect(result.scans.total).toBe(10);
        expect(result.assets.active).toBe(4);
        expect(result.vulnerabilities.critical).toBe(2);
    });
});
