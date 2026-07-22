const mongoose = require('mongoose');
const ReportService = require('../../services/platform/ReportService');
const RBACService = require('../../services/org/RBACService');

jest.mock('../../services/org/RBACService');

describe('ReportService', () => {
    let orgId, userId;

    beforeEach(() => {
        orgId = new mongoose.Types.ObjectId().toString();
        userId = new mongoose.Types.ObjectId().toString();
        jest.clearAllMocks();
        RBACService.requirePermission.mockResolvedValue('viewer');
    });

    it('should generate a pdf report url', async () => {
        const result = await ReportService.generatePdfReport(orgId, userId, {});
        expect(result.url).toContain(orgId);
        expect(result.generatedAt).toBeDefined();
    });
});
