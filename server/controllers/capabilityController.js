/**
 * @module CapabilityController
 * @description HTTP adapter mapping for the Capability Catalog APIs.
 */
class CapabilityController {
    /**
     * @param {Object} deps 
     * @param {import('../services/catalog/CapabilityCatalogService')} deps.capabilityCatalogService
     */
    constructor(deps) {
        this.capabilityCatalogService = deps.capabilityCatalogService;

        // Bind contexts
        this.getCapabilities = this.getCapabilities.bind(this);
        this.getCapabilityById = this.getCapabilityById.bind(this);
    }

    async getCapabilities(req, res) {
        try {
            const result = await this.capabilityCatalogService.getCapabilities();
            return res.status(200).json(result);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to retrieve capabilities', reason: 'Internal catalog error' });
        }
    }

    async getCapabilityById(req, res) {
        try {
            const { id } = req.params;
            const capability = await this.capabilityCatalogService.getCapabilityById(id);
            if (!capability) {
                return res.status(404).json({ error: 'Capability not found' });
            }
            // For now, if disabled, hide from public view if the frontend asks directly? 
            // The prompt says "Disabled capability -> Hidden from list OR marked unavailable"
            // We'll return it but the DTO indicates `enabled: false`. If it was completely omitted by service, we hit 404 above.
            return res.status(200).json(capability);
        } catch (error) {
            return res.status(500).json({ error: 'Failed to retrieve capability', reason: 'Internal catalog error' });
        }
    }
}
module.exports = CapabilityController;
