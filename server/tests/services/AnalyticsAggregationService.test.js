const mongoose = require('mongoose');
const AnalyticsAggregationService = require('../../services/platform/AnalyticsAggregationService');
const RBACService = require('../../services/org/RBACService');
const Scan = require('../../models/Scan');
const Vulnerability = require('../../models/Vulnerability');

jest.mock('../../services/org/RBACService');
jest.mock('../../models/Scan');
jest.mock('../../models/Vulnerability');

describe('AnalyticsAggregationService', () => {
    let orgId, userId;

    beforeEach(() => {
        orgId = new mongoose.Types.ObjectId().toString();
        userId = new mongoose.Types.ObjectId().toString();
        jest.clearAllMocks();
        RBACService.requirePermission.mockResolvedValue('viewer');
    });

    it('should aggregate daily scans', async () => {
        Scan.aggregate.mockResolvedValue([{ _id: '2026-07-21', count: 5 }]);
        const result = await AnalyticsAggregationService.getDailyScans(orgId, userId);
        expect(result.data.length).toBe(1);
        expect(result.data[0].count).toBe(5);
    });

    it('should aggregate top vulnerable assets', async () => {
        Vulnerability.aggregate.mockResolvedValue([{ hostname: 'test.com', vulnCount: 10 }]);
        const result = await AnalyticsAggregationService.getTopVulnerableAssets(orgId, userId);
        expect(result.data.length).toBe(1);
    });
});
