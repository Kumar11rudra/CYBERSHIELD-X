const PluginLoader = require('./PluginLoader');
const PluginManifest = require('./PluginManifest');
const PluginDescriptor = require('./PluginDescriptor');
const PluginCapability = require('./PluginCapability');
const PluginResult = require('./PluginResult');

/**
 * @module MockPluginLoader
 * @description In-memory mock implementing PluginLoader without real dynamic/fs loading.
 */
class MockPluginLoader extends PluginLoader {
    /**
     * Returns predefined static plugins.
     * @param {string} pluginId 
     * @returns {Promise<PluginResult>}
     */
    async load(pluginId) {
        if (pluginId === 'mock-plugin-1') {
            const manifest = new PluginManifest({
                pluginId: 'mock-plugin-1',
                name: 'Security Scanner Ext',
                version: '1.0.0',
                capabilities: [
                    new PluginCapability({
                        capabilityId: 'cap-scan-1',
                        type: 'SECURITY_SCAN',
                        description: 'Basic Mock Scan'
                    })
                ]
            });

            const descriptor = new PluginDescriptor({
                manifest,
                status: 'LOADED'
            });

            return new PluginResult({
                success: true,
                status: 'MOCK_LOADED',
                data: { descriptor }
            });
        }

        if (pluginId === 'invalid-plugin') {
            const manifest = new PluginManifest({
                pluginId: 'invalid-plugin',
                name: 'Bad Ext',
                version: '1.0.0',
                capabilities: [
                    // Deliberately duplicate capabilities to trigger validation failure
                    new PluginCapability({ capabilityId: 'cap-1', type: 'TEST' }),
                    new PluginCapability({ capabilityId: 'cap-1', type: 'TEST' })
                ]
            });

            const descriptor = new PluginDescriptor({ manifest, status: 'LOADED' });
            return new PluginResult({
                success: true,
                status: 'MOCK_LOADED',
                data: { descriptor } // Manager will reject this upon validation
            });
        }

        return PluginResult.fallbackError(`Plugin ${pluginId} not found in mock store.`);
    }

    async unload(pluginId) {
        return new PluginResult({ success: true, status: 'MOCK_UNLOADED' });
    }
}

module.exports = MockPluginLoader;
