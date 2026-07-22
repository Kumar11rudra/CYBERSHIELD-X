'use strict';

const { EngineRegistry } = require('../../../../server/csi/registry/EngineRegistry');
const { IIntelligenceEngine } = require('../../../../server/csi/interfaces/IIntelligenceEngine');
const { DuplicateEngineRegistrationError } = require('../../../../server/csi/errors/CsiErrors');
const { TargetDTO } = require('../../../../server/csi/dtos/TargetDTO');

class MockEngine extends IIntelligenceEngine {
    constructor(id) {
        super();
        this._id = id;
    }
    metadata() {
        return { id: this._id };
    }
    supports(target) {
        return true;
    }
}

describe('EngineRegistry Audit', () => {
    let registry;

    beforeEach(() => {
        registry = new EngineRegistry();
    });

    it('should reject duplicate registrations', () => {
        const engine1 = new MockEngine('test-engine');
        const engine2 = new MockEngine('test-engine');

        registry.register(engine1, { skipFlagCheck: true });
        
        expect(() => {
            registry.register(engine2, { skipFlagCheck: true });
        }).toThrow(DuplicateEngineRegistrationError);
    });

    it('should resolve engines in deterministic order (passive then active)', () => {
        const passive1 = new MockEngine('dns');
        const active1 = new MockEngine('http');
        const passive2 = new MockEngine('ssl');
        const active2 = new MockEngine('port');

        // Register in mixed order
        registry.register(active2, { skipFlagCheck: true });
        registry.register(passive2, { skipFlagCheck: true });
        registry.register(active1, { skipFlagCheck: true });
        registry.register(passive1, { skipFlagCheck: true });

        const target = new TargetDTO({ rawInput: 'example.com', normalized: 'example.com', type: 'domain' });
        const resolved = registry.resolve(target);

        // Expect passive engines first, then active
        expect(resolved[0].metadata().id).toBe('ssl');
        expect(resolved[1].metadata().id).toBe('dns');
        expect(resolved[2].metadata().id).toBe('port');
        expect(resolved[3].metadata().id).toBe('http');
    });

    it('should keep registered engine IDs immutable', () => {
        const engine = new MockEngine('test-engine');
        registry.register(engine, { skipFlagCheck: true });
        
        const metadata = registry.metadata();
        // Freeze metadata locally in registry output or simulate immutability
        expect(metadata[0].id).toBe('test-engine');
        
        // Attempting to modify ID on the output doesn't modify the source
        metadata[0].id = 'hacked';
        expect(registry.metadata()[0].id).toBe('test-engine');
    });
});
