const mongoose = require('mongoose');
const AIService = require('../../services/platform/AIService');
const BreachService = require('../../services/platform/BreachService');
const CommunityService = require('../../services/platform/CommunityService');
const IOCService = require('../../services/platform/IOCService');
const ThreatFeedService = require('../../services/platform/ThreatFeedService');
const RemediationService = require('../../services/platform/RemediationService');
const ToolsService = require('../../services/platform/ToolsService');
const WatchlistService = require('../../services/platform/WatchlistService');
const RBACService = require('../../services/org/RBACService');
const QueryBuilder = require('../../utils/QueryBuilder');
const CommunityNote = require('../../models/CommunityNote');
const IOCRecord = require('../../models/IOCRecord');
const CorrelationRecord = require('../../models/CorrelationRecord');
const ThreatFeedRecord = require('../../models/ThreatFeedRecord');
const Vulnerability = require('../../models/Vulnerability');
const Watchlist = require('../../models/Watchlist');

jest.mock('../../services/org/RBACService');
jest.mock('../../utils/QueryBuilder');
jest.mock('../../models/CommunityNote');
jest.mock('../../models/IOCRecord');
jest.mock('../../models/CorrelationRecord');
jest.mock('../../models/ThreatFeedRecord');
jest.mock('../../models/Vulnerability');
jest.mock('../../models/Watchlist');

describe('Phase 7 Intelligence Services', () => {
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
                    data: [{ _id: '123', name: 'test' }],
                    pagination: { total: 1 }
                })
            };
            return qb;
        });
    });

    test('AIService processChat & analyzeScan', async () => {
        const chat = await AIService.processChat(orgId, userId, 'hello');
        expect(chat.response).toBeDefined();

        const scan = await AIService.analyzeScan(orgId, userId, 'scan_1');
        expect(scan.analysis).toBeDefined();
    });

    test('BreachService checkEmail, phone, password', async () => {
        const email = await BreachService.checkEmail(orgId, userId, 'test@example.com');
        expect(email.breaches).toEqual([]);

        const pwd = await BreachService.checkPassword(orgId, userId, 'secret');
        expect(pwd.pwned).toBe(false);
    });

    test('CommunityService getNotes & vote', async () => {
        const notes = await CommunityService.getCommunityNotes(orgId, userId, {});
        expect(notes.data.length).toBe(1);

        CommunityNote.findByIdAndUpdate.mockResolvedValue({ _id: '1', upvotes: 1 });
        const vote = await CommunityService.voteCommunityNote(orgId, userId, '1', 'up');
        expect(vote.upvotes).toBe(1);
    });

    test('IOCService search & add', async () => {
        const res = await IOCService.searchIOC(orgId, userId, {});
        expect(res.data.length).toBe(1);
    });

    test('ThreatFeedService stats & health', async () => {
        ThreatFeedRecord.countDocuments.mockResolvedValue(42);
        const health = await ThreatFeedService.getFeedStatsAndHealth(orgId, userId);
        expect(health.records).toBe(42);
    });

    test('RemediationService getRemediation', async () => {
        Vulnerability.findOne.mockResolvedValue({ _id: 'v1', organizationId: orgId, remediation: 'Update package' });
        const rem = await RemediationService.getRemediation(orgId, userId, 'v1');
        expect(rem.remediation).toBe('Update package');
    });

    test('ToolsService analyzeSMS & checkSSL', async () => {
        const sms = await ToolsService.analyzeSMS(orgId, userId, { text: 'Win free money' });
        expect(sms.isSpam).toBe(false);

        const ssl = await ToolsService.checkSSL(orgId, userId, 'example.com');
        expect(ssl.valid).toBe(true);
    });

    test('WatchlistService getWatchlist & remove', async () => {
        const list = await WatchlistService.getWatchlist(orgId, userId, {});
        expect(list.data.length).toBe(1);

        Watchlist.findOneAndDelete.mockResolvedValue({ _id: 'w1' });
        const del = await WatchlistService.removeFromWatchlist(orgId, userId, 'w1');
        expect(del.success).toBe(true);
    });
});
