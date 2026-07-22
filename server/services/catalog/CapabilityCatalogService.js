const CapabilityListDTO = require('./dto/CapabilityListDTO');

/**
 * @module CapabilityCatalogService
 * @description Provides read-only access to capability metadata. 
 * Does NOT execute capabilities.
 */
class CapabilityCatalogService {
    /**
     * @param {Object} deps 
     * @param {import('./CapabilityMetadataRepository')} deps.capabilityMetadataRepo
     * @param {import('../../chatbot_core/events/EventPublisher')} deps.eventPublisher
     */
    constructor(deps) {
        this.capabilityMetadataRepo = deps.capabilityMetadataRepo;
        this.eventPublisher = deps.eventPublisher;
    }

    async getCapabilities() {
        const capabilities = await this.capabilityMetadataRepo.findAll();
        // For security/visibility reasons, we filter out non-public by default in real scenarios,
        // but currently we return all that are enabled/public
        const visibleCapabilities = capabilities.filter(cap => cap.enabled && cap.visibility !== 'hidden');
        
        await this.eventPublisher.publish({
            type: 'CatalogQueried',
            source: 'CapabilityCatalogService',
            payload: { action: 'getCapabilities', count: visibleCapabilities.length }
        });

        return new CapabilityListDTO(visibleCapabilities);
    }

    async getCapabilityById(id) {
        const capability = await this.capabilityMetadataRepo.findById(id);
        
        if (!capability) {
            await this.eventPublisher.publish({
                type: 'CatalogQueryFailed',
                source: 'CapabilityCatalogService',
                payload: { action: 'getCapabilityById', id, reason: 'Not found' }
            });
            return null;
        }

        await this.eventPublisher.publish({
            type: 'CatalogQueried',
            source: 'CapabilityCatalogService',
            payload: { action: 'getCapabilityById', id }
        });

        return capability;
    }
}
module.exports = CapabilityCatalogService;
