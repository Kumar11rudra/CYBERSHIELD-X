const axios = require('axios');
const logger = require('../utils/logger');
const configProvider = require('../config/configProvider');
const AIAnalysisRepository = require('../repositories/AIAnalysisRepository');
const AIReportRepository = require('../repositories/AIReportRepository');
const ScanRepository = require('../services/security/repositories/ScanRepository');
const MongoStorageProvider = require('../providers/storage/MongoStorageProvider');
const OllamaProvider = require('../providers/ai/OllamaProvider');
const GeminiProvider = require('../providers/ai/GeminiProvider');
const AIProviderManager = require('../providers/ai/AIProviderManager');
const AIService = require('../services/ai/AIService');
const AIReportService = require('../services/ai/AIReportService');

// Storage
const storageProvider = new MongoStorageProvider();

// Instantiate Repositories
const aiAnalysisRepository = new AIAnalysisRepository();
const aiReportRepository = new AIReportRepository();
const scanRepository = new ScanRepository({ storageProvider });

// Instantiate Providers
const ollamaProvider = new OllamaProvider({ httpClient: axios, configProvider });
const geminiProvider = new GeminiProvider({ httpClient: axios, configProvider });

// Instantiate Provider Manager (Failover Strategy)
const providerManager = new AIProviderManager({
    primaryProvider: ollamaProvider,
    secondaryProvider: geminiProvider,
    logger,
    configProvider
});

// Instantiate Services
const aiService = new AIService({
    providerManager,
    logger,
    configProvider
});

const aiReportService = new AIReportService({
    providerManager,
    aiAnalysisRepository,
    scanRepository,
    logger,
    configProvider
});

module.exports = {
    aiService,
    aiReportService
};
