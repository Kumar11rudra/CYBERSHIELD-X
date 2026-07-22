const { ServiceFingerprintEngine } = require('../../../csi/engines/ServiceFingerprintEngine');
const { SignatureLoadError } = require('../../../csi/errors/CsiErrors');
const fs = require('fs');

jest.mock('fs');

describe('ServiceFingerprintEngine - Signature Loading', () => {
    let engine;
    let mockTcpClient;
    let mockEvidenceStorage;

    beforeEach(() => {
        mockTcpClient = {};
        mockEvidenceStorage = {};
        engine = new ServiceFingerprintEngine(mockTcpClient, mockEvidenceStorage);
    });

    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should throw SignatureLoadError when signatures file is missing', async () => {
        fs.readFileSync.mockImplementation(() => {
            throw new Error('ENOENT: no such file or directory');
        });

        await expect(engine.initialize()).rejects.toThrow(SignatureLoadError);
        await expect(engine.initialize()).rejects.toThrow(/Failed to load service signatures/);
    });

    it('should throw SignatureLoadError when JSON is corrupted', async () => {
        fs.readFileSync.mockReturnValue('{ corrupted_json: true, }'); // Invalid JSON

        await expect(engine.initialize()).rejects.toThrow(SignatureLoadError);
        await expect(engine.initialize()).rejects.toThrow(/Failed to load service signatures/);
    });

    it('should initialize successfully with empty array', async () => {
        fs.readFileSync.mockReturnValue('[]');

        await expect(engine.initialize()).resolves.toBeUndefined();
    });

    it('should initialize successfully with valid signatures', async () => {
        fs.readFileSync.mockReturnValue(JSON.stringify([
            { port: 21, payload: "" }
        ]));

        await expect(engine.initialize()).resolves.toBeUndefined();
    });
});
