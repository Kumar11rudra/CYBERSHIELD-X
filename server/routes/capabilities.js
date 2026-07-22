const express = require('express');
const router = express.Router();
const { authenticate } = require('../middleware/auth');

// Dependency Injection Resolution
const { eventPublisher, capabilityResolver } = require('../controllers/chatbot/chatbotController');

// Initialize catalog dependencies
const CapabilityMetadataRepository = require('../services/catalog/CapabilityMetadataRepository');
const CapabilityCatalogService = require('../services/catalog/CapabilityCatalogService');
const CapabilityController = require('../controllers/capabilityController');

const capabilityMetadataRepo = new CapabilityMetadataRepository({ capabilityResolver, storageProvider: null });
const capabilityCatalogService = new CapabilityCatalogService({ capabilityMetadataRepo, eventPublisher });
const capabilityController = new CapabilityController({ capabilityCatalogService });

// Routes
router.get('/', authenticate, capabilityController.getCapabilities);
router.get('/:id', authenticate, capabilityController.getCapabilityById);

module.exports = router;
