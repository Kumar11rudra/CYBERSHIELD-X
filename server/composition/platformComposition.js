const ActivityLogRepository = require('../repositories/ActivityLogRepository');
const IntegrationConfigRepository = require('../repositories/IntegrationConfigRepository');
const NotificationRepository = require('../repositories/NotificationRepository');
const PlaybookRepository = require('../repositories/PlaybookRepository');
const AutomationRunRepository = require('../repositories/AutomationRunRepository');
const CommunityNoteRepository = require('../repositories/CommunityNoteRepository');
const VaultAssetRepository = require('../repositories/VaultAssetRepository');
const WatchlistRepository = require('../repositories/WatchlistRepository');
const SystemSettingsRepository = require('../repositories/SystemSettingsRepository');
const OrganizationSettingsRepository = require('../repositories/OrganizationSettingsRepository');
const ScanRepository = require('../repositories/ScanRepository');
const UserRepository = require('../repositories/UserRepository');

const BreachProviderManager = require('../providers/breach/BreachProviderManager');
const VaultCryptoProvider = require('../providers/vault/VaultCryptoProvider');

const DashboardAggregationService = require('../services/platform/DashboardAggregationService');
const SecurityScoringService = require('../services/platform/SecurityScoringService');
const RecommendationService = require('../services/platform/RecommendationService');
const ReportBuilderService = require('../services/platform/ReportBuilderService');
const ReportExportService = require('../services/platform/ReportExportService');
const PdfRenderer = require('../services/platform/PdfRenderer');
const AnalyticsAggregationService = require('../services/platform/AnalyticsAggregationService');
const AnalyticsFormatter = require('../services/platform/AnalyticsFormatter');
const VaultService = require('../services/platform/VaultService');
const BreachIntelligenceService = require('../services/platform/BreachIntelligenceService');
const NotificationService = require('../services/platform/NotificationService');
const PlaybookService = require('../services/platform/PlaybookService');
const CommunityService = require('../services/platform/CommunityService');
const WatchlistService = require('../services/platform/WatchlistService');
const HistoryService = require('../services/platform/HistoryService');
const IntegrationService = require('../services/platform/IntegrationService');

class PlatformComposition {
    constructor() {
        // Repositories
        this.activityLogRepository = new ActivityLogRepository();
        this.integrationConfigRepository = new IntegrationConfigRepository();
        this.notificationRepository = new NotificationRepository();
        this.playbookRepository = new PlaybookRepository();
        this.automationRunRepository = new AutomationRunRepository();
        this.communityNoteRepository = new CommunityNoteRepository();
        this.vaultAssetRepository = new VaultAssetRepository();
        this.watchlistRepository = new WatchlistRepository();
        this.systemSettingsRepository = new SystemSettingsRepository();
        this.organizationSettingsRepository = new OrganizationSettingsRepository();
        this.scanRepository = new ScanRepository();
        this.userRepository = new UserRepository();

        // Providers
        this.breachProviderManager = new BreachProviderManager();
        this.vaultCryptoProvider = new VaultCryptoProvider();

        // Services
        this.dashboardAggregationService = new DashboardAggregationService(this.scanRepository);
        this.securityScoringService = new SecurityScoringService();
        this.recommendationService = new RecommendationService();
        this.reportBuilderService = new ReportBuilderService(this.scanRepository);
        this.pdfRenderer = new PdfRenderer();
        this.reportExportService = new ReportExportService(this.reportBuilderService, this.pdfRenderer);
        this.analyticsAggregationService = new AnalyticsAggregationService(this.userRepository, this.scanRepository, this.activityLogRepository);
        this.analyticsFormatter = new AnalyticsFormatter();
        this.vaultService = new VaultService(this.vaultAssetRepository, this.activityLogRepository, this.vaultCryptoProvider);
        this.breachIntelligenceService = new BreachIntelligenceService(this.breachProviderManager, this.activityLogRepository);
        this.notificationService = new NotificationService(this.notificationRepository);
        this.playbookService = new PlaybookService(this.playbookRepository);
        this.communityService = new CommunityService(this.communityNoteRepository);
        this.watchlistService = new WatchlistService(this.watchlistRepository);
        this.historyService = new HistoryService(this.scanRepository);
        this.integrationService = new IntegrationService(this.integrationConfigRepository);
    }
}

// Singleton export
module.exports = new PlatformComposition();
