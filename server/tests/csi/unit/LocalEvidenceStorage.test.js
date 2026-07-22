const { LocalEvidenceStorage } = require('../../../csi/evidence/LocalEvidenceStorage');
const { EvidenceIntegrityError, CsiEvidenceError } = require('../../../csi/errors/CsiErrors');
const fs = require('fs');
const path = require('path');
const os = require('os');

describe('LocalEvidenceStorage', () => {
    let storageDir;
    let storage;

    beforeEach(() => {
        storageDir = fs.mkdtempSync(path.join(os.tmpdir(), 'csi-evidence-'));
        storage = new LocalEvidenceStorage({ baseDir: storageDir });
    });

    afterEach(() => {
        if (fs.existsSync(storageDir)) {
            fs.rmSync(storageDir, { recursive: true, force: true });
        }
    });

    it('should successfully store and retrieve immutable evidence (write, read, hash)', async () => {
        const data = Buffer.from('test evidence data');
        const dto = await storage.store(data, { contentType: 'text', engineSource: 'TestEngine' });
        
        expect(dto.evidenceId).toBeDefined();
        expect(dto.sha256Hash).toBeDefined();

        const retrieved = await storage.retrieve(dto.evidenceId);
        expect(retrieved.toString()).toBe('test evidence data');
        
        // Assert hashing was applied correctly
        const crypto = require('crypto');
        const expectedHash = crypto.createHash('sha256').update(data).digest('hex');
        expect(dto.sha256Hash).toBe(expectedHash);
    });

    it('should detect file corruption and throw EvidenceIntegrityError on retrieve', async () => {
        const data = Buffer.from('test evidence data');
        const dto = await storage.store(data, { contentType: 'text', engineSource: 'TestEngine' });

        // Artificially corrupt the stored file
        const entry = storage._index.get(dto.evidenceId);
        expect(entry).toBeDefined();
        
        // Modify the file on disk
        fs.writeFileSync(entry.filePath, Buffer.from('corrupted evidence data'));

        // Attempting to retrieve should now throw EvidenceIntegrityError due to hash mismatch
        await expect(storage.retrieve(dto.evidenceId)).rejects.toThrow(EvidenceIntegrityError);
        await expect(storage.retrieve(dto.evidenceId)).rejects.toThrow(/Evidence corrupted on disk/);
    });

    it('should throw EvidenceIntegrityError on read-after-write verification failure', async () => {
        // Mock fs.readFileSync to return corrupted data right after write
        const originalReadFileSync = fs.readFileSync;
        fs.readFileSync = jest.fn((filepath) => {
            if (filepath.includes('evidence')) {
                return Buffer.from('corrupted'); // Simulate disk corruption immediately on write
            }
            return originalReadFileSync(filepath);
        });

        const data = Buffer.from('test evidence data');
        await expect(storage.store(data)).rejects.toThrow(EvidenceIntegrityError);
        await expect(storage.store(data)).rejects.toThrow(/Read-after-write verification failed/);

        // Restore mock
        fs.readFileSync = originalReadFileSync;
    });

    it('should handle deterministic failure for non-existent evidence', async () => {
        await expect(storage.retrieve('non-existent-id')).rejects.toThrow(CsiEvidenceError);
    });

    it('should return boolean correctly for exists()', async () => {
        const data = Buffer.from('test evidence data');
        const dto = await storage.store(data);

        expect(await storage.exists(dto.evidenceId)).toBe(true);
        expect(await storage.exists('non-existent')).toBe(false);
    });
});
