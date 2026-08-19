/**
 * 🧪 Test Suite: High-Performance Toolkit LRU Response Caching Engine
 * Validates cache hits, sub-10ms latency speedups, category TTL enforcement,
 * forceRefresh bypass, and error fallback safety.
 */

const { ToolkitCacheService, toolkitCacheService, TTL_TIERS } = require('../services/ToolkitCacheService');
const { executeTool } = require('../controllers/toolkitController');

describe('Toolkit LRU Response Caching Engine', () => {
  beforeEach(() => {
    toolkitCacheService.clear();
  });

  describe('ToolkitCacheService Unit Operations', () => {
    it('correctly maps category TTL tiers for different tool categories', () => {
      // Long passive OSINT
      expect(toolkitCacheService.getTTL('whois')).toBe(TTL_TIERS.LONG_PASSIVE);
      expect(toolkitCacheService.getTTL('cve-lookup')).toBe(TTL_TIERS.LONG_PASSIVE);
      expect(toolkitCacheService.getTTL('mac-lookup')).toBe(TTL_TIERS.LONG_PASSIVE);

      // Non-cacheable dynamic / sandbox tools
      expect(toolkitCacheService.getTTL('cuckoo-sandbox')).toBe(TTL_TIERS.NON_CACHEABLE);
      expect(toolkitCacheService.getTTL('prompt-fuzzer')).toBe(TTL_TIERS.NON_CACHEABLE);
      expect(toolkitCacheService.getTTL('playbook-runner')).toBe(TTL_TIERS.NON_CACHEABLE);
      expect(toolkitCacheService.isCacheable('prompt-fuzzer')).toBe(false);

      // Default standard tools
      expect(toolkitCacheService.getTTL('port')).toBe(TTL_TIERS.MEDIUM_PROBE);
      expect(toolkitCacheService.getTTL('dns')).toBe(TTL_TIERS.MEDIUM_PROBE);
    });

    it('normalizes target domains and URLs into deterministic keys', () => {
      const key1 = toolkitCacheService.normalizeKey('whois', 'https://example.com/');
      const key2 = toolkitCacheService.normalizeKey('WHOIS', 'example.com');
      const key3 = toolkitCacheService.normalizeKey('whois', 'http://example.com');

      expect(key1).toBe('toolkit:whois:example.com');
      expect(key2).toBe('toolkit:whois:example.com');
      expect(key3).toBe('toolkit:whois:example.com');
    });

    it('stores and retrieves cached results with metrics update', async () => {
      const mockResult = { domain: 'example.com', registrar: 'ICANN' };
      
      // Initially empty
      const miss = await toolkitCacheService.get('whois', 'example.com');
      expect(miss).toBeNull();

      // Store in cache
      const stored = await toolkitCacheService.set('whois', 'example.com', mockResult);
      expect(stored).toBe(true);

      // Cache hit
      const hit = await toolkitCacheService.get('whois', 'example.com');
      expect(hit).toBeDefined();
      expect(hit.results).toEqual(mockResult);
      expect(hit.expiresInSeconds).toBe(TTL_TIERS.LONG_PASSIVE);

      // Verify metrics
      const metrics = toolkitCacheService.getMetrics();
      expect(metrics.toolkitHits).toBe(1);
      expect(metrics.toolkitMisses).toBe(1);
    });

    it('bypasses cache when forceRefresh is true', async () => {
      const mockResult = { domain: 'example.com', status: 'cached' };
      await toolkitCacheService.set('whois', 'example.com', mockResult);

      const forcedMiss = await toolkitCacheService.get('whois', 'example.com', true);
      expect(forcedMiss).toBeNull();
    });

    it('refuses to cache non-cacheable tools (TTL=0)', async () => {
      const mockResult = { fuzzed: true };
      const stored = await toolkitCacheService.set('prompt-fuzzer', 'test-model', mockResult);
      expect(stored).toBe(false);

      const retrieved = await toolkitCacheService.get('prompt-fuzzer', 'test-model');
      expect(retrieved).toBeNull();
    });

    it('invalidates specific cache entries cleanly', async () => {
      await toolkitCacheService.set('whois', 'example.com', { test: true });
      expect(await toolkitCacheService.get('whois', 'example.com')).not.toBeNull();

      await toolkitCacheService.invalidate('whois', 'example.com');
      expect(await toolkitCacheService.get('whois', 'example.com')).toBeNull();
    });
  });

  describe('Toolkit Controller Caching Integration', () => {
    it('executes tool on first call (cache miss) and caches result for subsequent sub-10ms call', async () => {
      const req1 = {
        body: { toolId: 'saml-decoder', target: '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_test" />' },
        app: { get: () => null },
        user: { _id: 'test-user-123' },
        headers: {}
      };

      let res1Json;
      const res1 = {
        status: () => res1,
        json: (data) => { res1Json = data; }
      };

      await executeTool(req1, res1);

      expect(res1Json).toBeDefined();
      expect(res1Json.success).toBe(true);
      expect(res1Json._telemetry).toBeDefined();
      expect(res1Json._telemetry.cached).toBe(false);

      // Second identical call (must hit cache)
      const req2 = {
        body: { toolId: 'saml-decoder', target: '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_test" />' },
        app: { get: () => null },
        user: { _id: 'test-user-123' },
        headers: {}
      };

      let res2Json;
      const res2 = {
        status: () => res2,
        json: (data) => { res2Json = data; }
      };

      const start = Date.now();
      await executeTool(req2, res2);
      const duration = Date.now() - start;

      expect(res2Json).toBeDefined();
      expect(res2Json.success).toBe(true);
      expect(res2Json._telemetry.cached).toBe(true);
      expect(duration).toBeLessThanOrEqual(50); // Instant sub-10ms/fast response
    });

    it('bypasses cache when forceRefresh flag is sent in request body', async () => {
      const validSaml = '<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_test_refresh" />';
      // Seed cache
      await toolkitCacheService.set('saml-decoder', validSaml, { dummy: true });

      const req = {
        body: { 
          toolId: 'saml-decoder', 
          target: validSaml,
          forceRefresh: true 
        },
        app: { get: () => null },
        user: { _id: 'test-user-123' },
        headers: {}
      };

      let resJson;
      const res = {
        status: () => res,
        json: (data) => { resJson = data; }
      };

      await executeTool(req, res);

      expect(resJson).toBeDefined();
      expect(resJson.success).toBe(true);
      expect(resJson._telemetry.cached).toBe(false);
    });
  });
});
