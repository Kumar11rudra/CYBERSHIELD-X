const capabilityConfig = require('../config/capabilityRegistry.config.js');
const { getSecurityModule } = require('./securityComposition');

class ExecutionDispatcher {
    constructor() {
        this.registry = capabilityConfig.capabilities;
    }

    resolveCapability(capabilityId) {
        return this.registry.find(c => c.capabilityId === capabilityId);
    }

    async dispatch(requestDTO, progressCallback) {
        const capability = this.resolveCapability(requestDTO.capabilityId);
        if (!capability) throw new Error(`Capability not found: ${requestDTO.capabilityId}`);

        const diContainer = getSecurityModule(); // Or a more generic resolver
        const adapterName = capability.adapter;
        
        // This relies on composition root exposing adapters by lowercase camel case
        // e.g., 'UrlEngineAdapter', 'UrlEngineAdapter'
        const adapterKey = adapterName.charAt(0).toLowerCase() + adapterName.slice(1);
        const adapter = diContainer[adapterKey] || diContainer.adapters?.[adapterKey];

        if (!adapter) throw new Error(`Adapter ${adapterName} not registered in DI container.`);

        if (capability.supportsStreaming) {
            if (!progressCallback) throw new Error("Streaming capability requires a progressCallback");
            return adapter.executeStream(requestDTO, progressCallback);
        } else {
            return adapter.execute(requestDTO);
        }
    }
}

module.exports = new ExecutionDispatcher();
