const AIOrchestrator = require('../../services/chatbot_core/AIOrchestrator');
const ContextBuilder = require('../../services/chatbot_core/ContextBuilder');
const MemoryManager = require('../../services/chatbot_core/MemoryManager');
const PermissionManager = require('../../services/chatbot_core/PermissionManager');
const PolicyEngine = require('../../services/chatbot_core/PolicyEngine');
const ToolRegistry = require('../../services/chatbot_core/ToolRegistry');
const NotificationManager = require('../../services/chatbot_core/NotificationManager');
const ResponseFormatter = require('../../services/chatbot_core/ResponseFormatter');
const EventBus = require('../../services/chatbot_core/EventBus');
const ObservationPipeline = require('../../services/chatbot_core/ObservationPipeline');
const ActivityCollector = require('../../services/chatbot_core/ActivityCollector');
const SystemHealthCollector = require('../../services/chatbot_core/SystemHealthCollector');
const ContextAggregator = require('../../services/chatbot_core/ContextAggregator');
const IntentAnalyzer = require('../../services/chatbot_core/IntentAnalyzer');
const RiskAnalyzer = require('../../services/chatbot_core/RiskAnalyzer');
const OldCapabilityResolver = require('../../services/chatbot_core/CapabilityResolver');
const ActionPlanner = require('../../services/chatbot_core/ActionPlanner');
const DecisionEngine = require('../../services/chatbot_core/DecisionEngine');

// Instantiate base dependencies
const contextBuilder = new ContextBuilder();
const memoryManager = new MemoryManager();
const permissionManager = new PermissionManager();
const policyEngine = new PolicyEngine();
const toolRegistry = new ToolRegistry();
const notificationManager = new NotificationManager();
const responseFormatter = new ResponseFormatter();
const eventBus = new EventBus();
const observationPipeline = new ObservationPipeline();

// Instantiate Phase 2 collectors
const activityCollector = new ActivityCollector({ eventBus, observationPipeline });
const systemHealthCollector = new SystemHealthCollector({ eventBus, observationPipeline });

// Instantiate Aggregator
const contextAggregator = new ContextAggregator({
  contextBuilder,
  activityCollector,
  systemHealthCollector,
  memoryManager,
  observationPipeline,
  toolRegistry
});

// Instantiate Phase 3 Brain Modules
const intentAnalyzer = new IntentAnalyzer();
const riskAnalyzer = new RiskAnalyzer(policyEngine);
const oldCapabilityResolver = new OldCapabilityResolver(toolRegistry);
const actionPlanner = new ActionPlanner();

const decisionEngine = new DecisionEngine(intentAnalyzer, riskAnalyzer, oldCapabilityResolver, actionPlanner);

// Instantiate Phase 7 Runtime Integration Modules
const FeatureFlagProvider = require('../../services/chatbot_core/FeatureFlagProvider');
const RuntimePipeline = require('../../services/chatbot_core/RuntimePipeline');

// Instantiate Phase 8 Execution Orchestration Modules
const ExecutionDispatcher = require('../../services/chatbot_core/execution/ExecutionDispatcher');
const ExecutionOrchestrator = require('../../services/chatbot_core/execution/ExecutionOrchestrator');
const ScanExecutionService = require('../../services/scanners/ScanExecutionService');

// Instantiate Phase 9 Audit & Telemetry Modules
const AuditCollector = require('../../services/chatbot_core/audit/AuditCollector');
const AuditFormatter = require('../../services/chatbot_core/audit/AuditFormatter');
const AuditPolicy = require('../../services/chatbot_core/audit/AuditPolicy');
const AuditEngine = require('../../services/chatbot_core/audit/AuditEngine');

// Instantiate Phase 10 Storage Abstraction Modules
const MockStorageProvider = require('../../services/chatbot_core/storage/MockStorageProvider');
const AuditStorageRepository = require('../../services/chatbot_core/storage/AuditStorageRepository');
const SessionStorageRepository = require('../../services/chatbot_core/storage/SessionStorageRepository');
const StorageManager = require('../../services/chatbot_core/storage/StorageManager');

// Wiring for real adapters
const AdapterRegistry = require('../../adapters/AdapterRegistry');
const AdapterResolver = require('../../adapters/AdapterResolver');
const AdapterFactory = require('../../adapters/AdapterFactory');
const AdapterDescriptor = require('../../adapters/AdapterDescriptor');

const adapterRegistry = new AdapterRegistry();

// Register mock descriptors mapped to real adapter implementations so the dispatcher doesn't break for older tests
adapterRegistry.register(new AdapterDescriptor({
    adapterId: 'shell-001',
    adapterType: 'Shell',
    supportedCapabilities: ['exec-001', 'mock-cap-01'], // exec-001 from runtime_validation
    lifecycleStatus: 'Active',
    compatibilityVersion: '1.0.0'
}));

adapterRegistry.register(new AdapterDescriptor({
    adapterId: 'docker-001',
    adapterType: 'Docker',
    supportedCapabilities: ['cap-docker-x'], 
    lifecycleStatus: 'Active',
    compatibilityVersion: '1.0.0'
}));

const adapterResolver = new AdapterResolver(adapterRegistry);
const adapterFactory = new AdapterFactory();

// Mocks for Governance, Safety (Wiring only)
const mockGovernanceManager = { authorizeExecution: async () => ({ success: true, data: {} }) };
const mockSafetyManager = { validateExecution: async () => ({ success: true, data: {} }) };
const mockCapabilityRegistry = { resolveCapability: () => ({ success: true, data: {} }) };

// Moved Execution Dispatcher and Job wiring further down

const auditEngine = new AuditEngine({
    auditCollector: new AuditCollector(),
    auditFormatter: new AuditFormatter(),
    auditPolicy: new AuditPolicy()
});

// Instantiate Phase 11 Event & Domain Messaging Modules
const EventRegistry = require('../../services/chatbot_core/events/EventRegistry');
const EventDispatcher = require('../../services/chatbot_core/events/EventDispatcher');
const EventPublisher = require('../../services/chatbot_core/events/EventPublisher');

// Instantiate Phase 12 Plugin & Extension Framework Modules
const PluginRegistry = require('../../services/chatbot_core/plugins/PluginRegistry');
const MockPluginLoader = require('../../services/chatbot_core/plugins/MockPluginLoader');
const PluginManager = require('../../services/chatbot_core/plugins/PluginManager');

// Instantiate Phase 13 Capability Runtime & Binding
const CapabilityResolver = require('../../services/chatbot_core/runtime/CapabilityResolver');
const CapabilityRuntime = require('../../services/chatbot_core/runtime/CapabilityRuntime');

// Instantiate Phase 14 Final Integration & System Composition
const SystemComposer = require('../../services/chatbot_core/composition/SystemComposer');

// Instantiate Phase 15 Production Providers
const EnvConfigProvider = require('../../providers/config/EnvConfigProvider');
const EnvSecretsProvider = require('../../providers/secrets/EnvSecretsProvider');
const LoggerProvider = require('../../providers/logging/LoggerProvider');
const MongoStorageProvider = require('../../providers/storage/MongoStorageProvider');

const configProvider = new EnvConfigProvider();
const isProduction = configProvider.get('NODE_ENV') === 'production';
const mongoConnectionString = configProvider.get('MONGO_URI', 'mongodb://localhost:27017/cybershield');

// Provider Selection Mechanism
const activeStorageProvider = isProduction 
    ? new MongoStorageProvider(mongoConnectionString)
    : new MockStorageProvider();

if (isProduction && activeStorageProvider instanceof MongoStorageProvider) {
    activeStorageProvider.connect().then(res => {
        if (!res.success) {
            console.error("FATAL: MongoDB is unavailable in production. Failing fast.");
            process.exit(1);
        }
    }).catch(err => {
        console.error("FATAL: MongoDB connection error", err);
        process.exit(1);
    });
}

const storageManager = new StorageManager({
    auditRepo: new AuditStorageRepository(activeStorageProvider),
    sessionRepo: new SessionStorageRepository(activeStorageProvider)
});

// ---------------------------------------------------------
// Feature 013 Notification Engine Wiring
// ---------------------------------------------------------
const WebSocketTransport = require('../../services/chatbot_core/notifications/transports/WebSocketTransport');
const NotificationDispatcher = require('../../services/chatbot_core/notifications/NotificationDispatcher');
const NotificationSubscriptionService = require('../../services/chatbot_core/notifications/NotificationSubscriptionService');

// We will inject the real socket.io instance later or let the transport handle null gracefully.
const webSocketTransport = new WebSocketTransport({ io: null });
const notificationDispatcher = new NotificationDispatcher({ transports: [webSocketTransport] });

// Event modules are already required at line 116.

const eventRegistry = new EventRegistry();
const eventDispatcherCore = new EventDispatcher({ eventRegistry });
const eventPublisher = new EventPublisher({ eventDispatcher: eventDispatcherCore });

const notificationSubscriptionService = new NotificationSubscriptionService({
    eventRegistry,
    notificationDispatcher
});

// Job Management Wiring
const JobRepository = require('../../services/jobs/JobRepository');
const JobManager = require('../../services/jobs/JobManager');
const JobScheduler = require('../../services/jobs/JobScheduler');
const JobCancellationService = require('../../services/jobs/JobCancellationService');

const jobRepository = new JobRepository({ storageProvider: activeStorageProvider });
const jobManager = new JobManager({ jobRepository, eventPublisher });
const jobScheduler = new JobScheduler({ jobManager });
const jobCancellationService = new JobCancellationService({ jobManager, jobScheduler });

const executionDispatcher = new ExecutionDispatcher({ 
    adapterResolver, 
    adapterFactory,
    jobManager,
    jobScheduler,
    eventPublisher
});
const executionOrchestrator = new ExecutionOrchestrator({ executionDispatcher });

// Intelligence Engine (Feature 009)
const FindingNormalizer = require('../../services/intelligence/FindingNormalizer');
const RiskScoringService = require('../../services/intelligence/RiskScoringService');
const FindingDeduplicator = require('../../services/intelligence/FindingDeduplicator');
const IntelligenceReportService = require('../../services/intelligence/IntelligenceReportService');
const CorrelationEngine = require('../../services/intelligence/CorrelationEngine');

const findingNormalizer = new FindingNormalizer();
const riskScoringService = new RiskScoringService();
const findingDeduplicator = new FindingDeduplicator(riskScoringService);
const intelligenceReportService = new IntelligenceReportService();
const correlationEngine = new CorrelationEngine(findingNormalizer, findingDeduplicator, intelligenceReportService, eventPublisher);

const scanExecutionService = new ScanExecutionService({ executionOrchestrator, jobRepository, correlationEngine });

// (Events were moved up above JobManager)

const pluginRegistry = new PluginRegistry();
const pluginLoader = new MockPluginLoader();
const pluginManager = new PluginManager({ pluginRegistry, pluginLoader });

const capabilityResolver = new CapabilityResolver({ pluginManager });
const capabilityRuntime = new CapabilityRuntime({ capabilityResolver });

// Initialize Workflow Engine (Feature 010)
const WorkflowRepository = require('../../services/workflows/WorkflowRepository');
const WorkflowTemplateRepository = require('../../services/workflows/WorkflowTemplateRepository');
const WorkflowValidationService = require('../../services/workflows/WorkflowValidationService');
const WorkflowProgressService = require('../../services/workflows/WorkflowProgressService');
const WorkflowResultAggregator = require('../../services/workflows/WorkflowResultAggregator');
const WorkflowExecutionService = require('../../services/workflows/WorkflowExecutionService');
const WorkflowManager = require('../../services/workflows/WorkflowManager');
const WorkflowController = require('../WorkflowController');

const workflowRepository = new WorkflowRepository({ storageProvider: activeStorageProvider });
const workflowTemplateRepository = new WorkflowTemplateRepository({ storageProvider: activeStorageProvider });

// Initialize predefined templates idempotently
workflowTemplateRepository.initialize().catch(err => {
    console.error("Failed to initialize WorkflowTemplateRepository:", err);
});
const workflowValidationService = new WorkflowValidationService({ capabilityResolver, scanExecutionService });
const workflowProgressService = new WorkflowProgressService({ eventPublisher });
const workflowResultAggregator = new WorkflowResultAggregator({ jobManager, correlationEngine });

const workflowExecutionService = new WorkflowExecutionService({
    workflowRepository,
    scanExecutionService,
    capabilityResolver,
    workflowResultAggregator
});

const workflowManager = new WorkflowManager({
    workflowRepository,
    workflowTemplateRepository,
    workflowValidationService,
    workflowExecutionService,
    workflowProgressService,
    eventPublisher
});

const workflowController = new WorkflowController({ workflowManager });

// Generate Final Structural Dependency Graph
const systemComposer = new SystemComposer({
    'SystemRoot': ['SystemComposer'],
    'SystemComposer': ['RuntimePipeline', 'AIOrchestrator', 'EventPublisher', 'CapabilityRuntime', 'StorageManager'],
    'AIOrchestrator': ['RuntimePipeline', 'StorageManager', 'AuditEngine', 'ExecutionOrchestrator'],
    'RuntimePipeline': ['FeatureFlagProvider', 'EventPublisher'],
    'EventPublisher': ['EventDispatcher'],
    'EventDispatcher': ['EventRegistry'],
    'EventRegistry': [],
    'CapabilityRuntime': ['CapabilityResolver'],
    'CapabilityResolver': ['PluginManager'],
    'PluginManager': ['PluginRegistry', 'PluginLoader'],
    'PluginRegistry': [],
    'PluginLoader': [],
    'ExecutionOrchestrator': ['ExecutionDispatcher'],
    'ExecutionDispatcher': ['AdapterResolver', 'AdapterFactory'],
    'AdapterResolver': [],
    'AdapterFactory': [],
    'AuditEngine': ['AuditCollector', 'AuditPolicy'],
    'AuditCollector': [],
    'AuditPolicy': [],
    'StorageManager': ['AuditStorageRepository', 'SessionStorageRepository'],
    'AuditStorageRepository': ['IStorageProvider'],
    'SessionStorageRepository': ['IStorageProvider'],
    'IStorageProvider': [],
    'FeatureFlagProvider': []
});

const systemComposition = systemComposer.compose();

const featureFlagProvider = new FeatureFlagProvider();
const runtimePipeline = new RuntimePipeline({
  featureFlagProvider,
  intentAnalyzer,
  decisionEngine,
  actionPlanner,
  governanceManager: mockGovernanceManager,
  safetyManager: mockSafetyManager,
  capabilityRegistry: mockCapabilityRegistry,
  executionOrchestrator,
  auditEngine,
  responseFormatter
});

// ---------------------------------------------------------
// Phase 16 Production Readiness Validation
// ---------------------------------------------------------
const StartupValidator = require('../../production/StartupValidator');
const startupValidator = new StartupValidator({
    envConfigProvider: configProvider,
    storageProvider: activeStorageProvider,
    compositionResult: systemComposition
});

// Inject dependencies into the Orchestrator
const orchestrator = new AIOrchestrator({
  contextAggregator,
  memoryManager,
  permissionManager,
  policyEngine,
  responseFormatter,
  decisionEngine,
  runtimePipeline,
  storageManager
});



const handleChat = async (req, res) => {
  try {
    const { messages } = req.body; // Expecting an array of previous messages for context, plus the new user message

    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      const errorResp = responseFormatter.formatError('Messages array is required.', 'INVALID_REQUEST');
      return res.status(400).json(errorResp.error);
    }

    // Process the chat request via the orchestrator pipeline
    const orchestratorResult = await orchestrator.processChatRequest(req, messages);

    if (!orchestratorResult.success) {
       return res.status(orchestratorResult.metadata.errorCode === 'AI_OFFLINE' ? 503 : 500)
                 .json({ error: orchestratorResult.error });
    }

    res.status(200).json(orchestratorResult.data);

  } catch (error) {
    console.error('[CHATBOT CONTROLLER ERROR]', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

module.exports = {
  handleChat,
  runtimePipeline,
  orchestrator,
  decisionEngine,
  contextAggregator,
  permissionManager,
  policyEngine,
  memoryManager,
  responseFormatter,
  systemComposition,
  startupValidator,
  eventPublisher,
  activeStorageProvider,
  storageManager,
  capabilityResolver,
  executionOrchestrator,
  scanExecutionService,
  jobManager,
  jobCancellationService,
  correlationEngine,
  intelligenceReportService,
  workflowManager,
  workflowController
};
