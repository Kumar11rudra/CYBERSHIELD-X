const { TechnologyDetectionEngine } = require('../../../csi/engines/TechDetectionEngine');
const { SignatureLoadError } = require('../../../csi/errors/CsiErrors');
const fs = require('fs');

jest.mock('fs');

describe('TechnologyDetectionEngine - Signature Loading', () => {
    let engine;
    let mockHttpClient;
    let mockEvidenceStorage;

    beforeEach(() => {
        mockHttpClient = {};
        mockEvidenceStorage = {};
        engine = new TechnologyDetectionEngine(mockHttpClient, mockEvidenceStorage);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should throw SignatureLoadError when signatures file is missing', async () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error('ENOENT: no such file or directory');
        });

        await expect(engine.initialize()).rejects.toThrow(SignatureLoadError);
        await expect(engine.initialize()).rejects.toThrow(/Failed to load technology signatures/);
    });

    it('should throw SignatureLoadError when JSON is corrupted', async () => {
        fs.readFileSync.mockReturnValue('{ corrupted_json: true, }'); // Invalid JSON

        await expect(engine.initialize()).rejects.toThrow(SignatureLoadError);
        await expect(engine.initialize()).rejects.toThrow(/Failed to load technology signatures/);
    });

    it('should initialize successfully with empty array', async () => {
        fs.readFileSync.mockReturnValue('[]');

        await expect(engine.initialize()).resolves.toBeUndefined();
    });

    it('should throw SignatureLoadError when parsing regex fails (invalid schema)', async () => {
        // missing regex string that causes regex constructor to fail, or just malformed schema
        fs.readFileSync.mockReturnValue('[{"name":"Test", "regex": "["}]'); // unclosed char class

        await expect(engine.initialize()).rejects.toThrow(SignatureLoadError);
    });

    it('should initialize successfully with valid signatures', async () => {
        fs.readFileSync.mockReturnValue(JSON.stringify([
            { name: "WordPress", regex: "wordpress/([0-9.]+)" }
        ]));

        await expect(engine.initialize()).resolves.toBeUndefined();
    });
});
