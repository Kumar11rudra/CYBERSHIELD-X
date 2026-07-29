const CapabilityController = require('../../controllers/capabilityController');

describe('CapabilityController Unit Tests', () => {
    let mockCapabilityCatalogService;
    let controller;
    let req, res;

    beforeEach(() => {
        mockCapabilityCatalogService = {
            getCapabilities: jest.fn(),
            getCapabilityById: jest.fn()
        };

        controller = new CapabilityController({ capabilityCatalogService: mockCapabilityCatalogService });

        req = {
            params: { id: 'cap-1' }
        };

        res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        };
    });

    test('getCapabilities - returns capability catalog list', async () => {
        mockCapabilityCatalogService.getCapabilities.mockResolvedValue([{ id: 'cap-1' }]);
        await controller.getCapabilities(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith([{ id: 'cap-1' }]);
    });

    test('getCapabilityById - returns 404 when missing', async () => {
        mockCapabilityCatalogService.getCapabilityById.mockResolvedValue(null);
        await controller.getCapabilityById(req, res);
        expect(res.status).toHaveBeenCalledWith(404);
        expect(res.json).toHaveBeenCalledWith({ error: 'Capability not found' });
    });

    test('getCapabilityById - returns capability when found', async () => {
        mockCapabilityCatalogService.getCapabilityById.mockResolvedValue({ id: 'cap-1', enabled: true });
        await controller.getCapabilityById(req, res);
        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.json).toHaveBeenCalledWith({ id: 'cap-1', enabled: true });
    });
});
