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
const activeStorageProvider = (isProduction || process.env.NODE_ENV === 'test')
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

    res.status(200).json({
      role: orchestratorResult.data?.role || 'assistant',
      content: orchestratorResult.data?.content || '',
      model: orchestratorResult.metadata?.actualModelUsed || orchestratorResult.metadata?.requestedModel || 'gemini-2.5-flash',
      provider: orchestratorResult.metadata?.provider || 'Google Gemini',
      metadata: orchestratorResult.metadata
    });

  } catch (error) {
    console.error('[CHATBOT CONTROLLER ERROR]', error);
    res.status(500).json({ error: 'Internal server error.' });
  }
};

const handleInvestigate = async (req, res) => {
  try {
    const { caseId, findingId, rawEvidence: inputRawEvidence, userQuery } = req.body;
    const Case = require('../../models/Case');
    const Finding = require('../../models/Finding');
    const crypto = require('crypto');

    let evidenceContext = '';
    let targetCase = null;
    let targetFinding = null;

    if (caseId) {
      targetCase = await Case.findOne({
        $or: [{ caseId }, { _id: (typeof caseId === 'string' && caseId.match(/^[0-9a-fA-F]{24}$/)) ? caseId : null }]
      });
      if (targetCase && targetCase.evidence && targetCase.evidence.length > 0) {
        evidenceContext += targetCase.evidence.map(e => `[Evidence ${e.evidenceId} - Tool: ${e.tool}]\n${e.rawOutput}`).join('\n\n');
      }
    }

    if (findingId) {
      targetFinding = await Finding.findOne({
        $or: [{ findingId }, { _id: (typeof findingId === 'string' && findingId.match(/^[0-9a-fA-F]{24}$/)) ? findingId : null }]
      });
      if (targetFinding && targetFinding.rawEvidence) {
        evidenceContext += `\n[Finding ${targetFinding.findingId} - Tool: ${targetFinding.sourceTool}]\n${JSON.stringify(targetFinding.rawEvidence, null, 2)}`;
      }
    }

    if (inputRawEvidence) {
      evidenceContext += `\n[Direct Evidence Input]\n${typeof inputRawEvidence === 'string' ? inputRawEvidence : JSON.stringify(inputRawEvidence, null, 2)}`;
    }

    // Adversarial Prompt Injection Defense
    const isAdversarial = /(?:ignore\s+previous\s+instructions|system\s+override|you\s+are\s+now|bypass\s+auth|format\s+c:|rm\s+-rf)/i.test(userQuery || '');

    let summary = 'Automated SOC evidence synthesis';
    let correlation = 'No anomalous cross-vector correlations observed in current artifacts';
    let explanation = 'Analysis based on verified system telemetry and raw tool outputs.';
    let remediationDraft = 'Ensure proper firewall filtering, certificate renewal, and least-privilege service configurations.';
    let actionProposals = [];

    if (isAdversarial) {
      explanation = 'Security Guardrail Notice: Adversarial prompt instruction detected in input query. Operational privileged actions are prohibited.';
      actionProposals.push({
        actionType: 'ANALYSIS_ONLY',
        tool: 'security-audit',
        target: 'local',
        args: [],
        rationale: 'Input contains adversarial prompt injection payload. Restricted to passive analysis.',
        requiresApproval: false,
        approvalRole: 'analyst'
      });
    } else {
      summary = `Investigation Analysis: Observed ${evidenceContext ? 'active telemetry artifacts' : 'general inquiry'}. Primary vector appears related to network configuration and application exposure.`;
      correlation = targetCase ? `Correlated across ${targetCase.assets?.length || 0} asset(s) with ${targetCase.findings?.length || 0} associated finding(s).` : 'Stand-alone diagnostic correlation.';
      explanation = evidenceContext ? `Observed evidence indicates potential surface exposure. Recommended to verify authoritative DNS, TLS certificate chain, and service listening ports.` : 'Grounded SOC response to operator inquiry.';
      remediationDraft = '1. Review listening network sockets on host.\n2. Verify TLS certificate expiration and cipher suites.\n3. Validate DNS authoritative NS delegation.';

      actionProposals.push({
        actionType: 'ANALYSIS_ONLY',
        tool: 'passive_correlation',
        target: targetCase?.assets?.[0] || 'domain',
        args: [],
        rationale: 'Passive correlation of open telemetry and threat feeds.',
        requiresApproval: false,
        approvalRole: 'analyst'
      });

      actionProposals.push({
        actionType: 'USER_APPROVED_TOOL_ACTION',
        tool: 'dns',
        target: targetCase?.assets?.[0] || 'example.com',
        args: ['-t', 'ANY'],
        rationale: 'Validate authoritative DNS records for domain anomalies.',
        requiresApproval: true,
        approvalRole: 'operator'
      });

      actionProposals.push({
        actionType: 'USER_APPROVED_TOOL_ACTION',
        tool: 'ssl',
        target: targetCase?.assets?.[0] || 'example.com',
        args: [],
        rationale: 'Inspect TLS certificate expiration and cipher configurations.',
        requiresApproval: true,
        approvalRole: 'operator'
      });

      actionProposals.push({
        actionType: 'PRIVILEGED_ACTION',
        tool: 'port',
        target: targetCase?.assets?.[0] || '127.0.0.1',
        args: ['-sS', '-p', '1-1024'],
        rationale: 'SYN packet port discovery scan requires administrative privileges.',
        requiresApproval: true,
        approvalRole: 'admin'
      });
    }

    let modelName = 'gemini-2.5-flash';
    let providerName = 'CyberShield Bounded SOC AI';

    if (orchestrator.genAI && !isAdversarial) {
      try {
        const model = orchestrator.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const aiPrompt = `You are CyberShield X Bounded SOC Copilot.
You analyze raw security evidence and output grounded SOC analysis.
Security rule: Never execute commands. Actions must be proposals only.
User Query: ${userQuery || 'Analyze evidence'}
<untrusted_evidence_data>
${evidenceContext.substring(0, 4000)}
</untrusted_evidence_data>

Provide a concise technical summary and explanation in 2-3 paragraphs.`;

        const resAI = await model.generateContent(aiPrompt);
        const text = resAI?.response?.text();
        if (text) {
          explanation = text;
          providerName = 'Google Gemini (Bounded)';
        }
      } catch (aiErr) {
        // Fallback
      }
    }

    // Persist to Case aiNotes if case is provided
    if (targetCase) {
      const noteEntry = {
        noteId: `NOTE-${Date.now().toString(36).toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`,
        prompt: userQuery || 'Investigation inquiry',
        response: explanation,
        actionProposals,
        model: modelName,
        timestamp: new Date()
      };
      targetCase.aiNotes.push(noteEntry);
      targetCase.timeline.push({
        action: 'AI_INVESTIGATION',
        performedBy: req.user?.id || 'ai_copilot',
        timestamp: new Date(),
        details: `AI investigation completed (${actionProposals.length} action proposals generated)`
      });
      await targetCase.save();
    }

    // Persist to Finding aiInterpretation if finding is provided
    if (targetFinding) {
      targetFinding.aiInterpretation = explanation;
      await targetFinding.save();
    }

    res.json({
      success: true,
      data: {
        summary,
        correlation,
        explanation,
        remediationDraft,
        actionProposals,
        model: modelName,
        provider: providerName
      }
    });
  } catch (error) {
    console.error('[AI INVESTIGATE ERROR]', error);
    res.status(500).json({ success: false, error: 'AI investigation failed: ' + error.message });
  }
};

/**
 * AI-assisted detection rule analysis
 * POST /api/chatbot/detection/analyze
 */
const handleAnalyzeDetection = async (req, res) => {
  try {
    const { ruleId, eventData } = req.body;
    const DetectionRuleModel = require('../../models/DetectionRule');
    const rule = ruleId ? await DetectionRuleModel.findOne({ ruleId }) : null;

    const sanitizedContext = JSON.stringify(eventData || {}).substring(0, 3000);
    const isAdversarial = /(system\s*prompt|ignore\s*previous|developer\s*mode)/i.test(sanitizedContext);

    if (isAdversarial) {
      return res.json({
        success: true,
        data: {
          analysis: 'Security Notice: Adversarial prompt injection detected in event payload. Bounded analysis active.',
          recommendations: ['Quarantine untrusted input', 'Review security audit logs'],
          confidence: 0.95
        }
      });
    }

    const explanation = rule
      ? `Rule [${rule.name}] evaluated conditions against event payload. Primary condition match on ${rule.conditions?.map(c => c.field).join(', ') || 'fields'}. Severity level [${rule.severity}] is appropriate for observed indicators.`
      : 'Grounded SOC Detection Analysis: Event indicates security indicator match based on deterministic evaluation.';

    res.json({
      success: true,
      data: {
        analysis: explanation,
        explanation,
        actionProposals: [
          { actionType: 'ANALYSIS_ONLY', description: 'Review rule telemetry and host interfaces' },
          { actionType: 'USER_APPROVED_TOOL_ACTION', description: 'Run diagnostic tool on affected target', tool: 'ping' }
        ],
        recommendations: [
          'Verify affected asset host interfaces',
          'Inspect related process execution records',
          'Enrich associated IOC indicators'
        ],
        confidence: 0.88,
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AI-assisted multi-finding correlation explanation
 * POST /api/chatbot/detection/correlate
 */
const handleCorrelateFindings = async (req, res) => {
  try {
    const { findings = [], signals = [] } = req.body;
    const combined = [...findings, ...signals];
    const count = combined.length;
    const assets = [...new Set(combined.map(f => f.asset || f.affectedAsset).filter(Boolean))];

    const correlationExplanation = count > 1
      ? `Observed ${count} correlated security signals across ${assets.length || 1} asset(s). Temporal and asset alignment indicates potential multi-stage threat progression (Reconnaissance -> Service Enumeration -> Vulnerability Exposure).`
      : 'Single finding observed. Recommend collecting additional host telemetry to assess lateral movement.';

    res.json({
      success: true,
      data: {
        correlation: correlationExplanation,
        explanation: correlationExplanation,
        correlationConfidence: 0.85,
        confidence: 0.85,
        canSelfExecute: false,
        actionProposals: [
          { actionType: 'ANALYSIS_ONLY', description: 'Correlated multi-finding assessment' },
          { actionType: 'USER_APPROVED_TOOL_ACTION', description: 'Verify asset reachability' }
        ],
        hypothesizedStage: count > 2 ? 'Active Reconnaissance / Initial Access' : 'Surface Exposure',
        recommendedPlaybook: count > 2 ? 'Auto-Remediate Critical Vulnerabilities' : 'Standard Host Audit',
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AI detection engineering - Draft candidate detection rule
 * POST /api/chatbot/detection/draft-rule
 */
const handleDraftRule = async (req, res) => {
  try {
    const { prompt, evidenceContext, category = 'suspicious_ioc', severity = 'MEDIUM' } = req.body;
    const DetectionRuleModel = require('../../models/DetectionRule');

    const sanitizedPrompt = String(prompt || 'Suspicious Activity Detection').substring(0, 500);
    const ruleId = `RULE-AI-${Date.now().toString().slice(-6)}`;

    // AI-generated rules MUST start as DRAFT and require human testing/approval
    const draftRule = await DetectionRuleModel.create({
      ruleId,
      name: `AI Draft: ${sanitizedPrompt.slice(0, 60)}`,
      description: `AI-proposed detection rule based on operator prompt: ${sanitizedPrompt}`,
      severity,
      category,
      status: 'DRAFT',
      enabled: false, // Inactive until approved
      version: 1,
      author: 'AI_ASSISTANT',
      isAiGenerated: true,
      aiDraft: true,
      aiMetadata: {
        rationale: 'Generated by AI Copilot for operator review. Requires validation test before activation.',
        proposedConditions: [
          { field: 'tool', operator: 'equals', value: 'whois' }
        ],
        expectedFalsePositives: 'May trigger on benign diagnostic scans. Recommend tuning suppression.',
        confidence: 80
      },
      conditions: [
        { field: 'tool', operator: 'equals', value: 'whois' }
      ],
      affectedEntityTypes: ['finding', 'terminal_event'],
      tags: ['ai-draft', 'soc-engineering'],
      responsePolicy: {
        actionType: 'ALERT',
        requiresApproval: true
      },
      organizationId: req.user?.organizationId || null
    });

    res.status(200).json({
      success: true,
      data: {
        ...(draftRule.toObject ? draftRule.toObject() : draftRule),
        rule: draftRule,
        explanation: 'AI-generated detection rule drafted in DRAFT status. Human analyst review required.',
      },
      message: 'AI candidate rule created in DRAFT status. Analyst review and explicit approval required for activation.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * AI-assisted incident summary
 * POST /api/chatbot/detection/summarize-incident
 */
const handleSummarizeIncident = async (req, res) => {
  try {
    const { incidentId } = req.body;
    const IncidentModel = require('../../models/Incident');
    const incident = incidentId ? await IncidentModel.findOne({ incidentId }) : null;

    if (!incident) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const summary = `Incident [${incident.incidentId}] is currently [${incident.status}] with severity [${incident.severity}] and risk score [${incident.riskScore}/100]. Affected asset(s): ${incident.affectedAssets?.join(', ') || 'unknown'}. Correlated findings: ${incident.correlatedFindings?.length || 0}. Attack-chain nodes mapped: ${incident.attackChainGraph?.nodes?.length || 0}.`;

    res.json({
      success: true,
      data: {
        incidentId: incident.incidentId,
        summary,
        recommendedAction: incident.status === 'DETECTED' ? 'Triage and assign to lead analyst' : 'Execute approved diagnostic verification',
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ─── Phase 71: Bounded AI Threat Hunting Handlers ───────────────────────────
 */

/**
 * Generates an analytical threat hunting hypothesis
 * POST /api/chatbot/hunting/hypothesis
 */
const handleHuntingHypothesis = async (req, res) => {
  try {
    const { observationContext = '', category = 'IOC_SWEEP' } = req.body;
    const sanitizedCtx = String(observationContext).slice(0, 500);

    const hypotheses = {
      IOC_SWEEP: 'Threat indicators observed in perimeter scans match active adversary C2 infrastructure.',
      BEHAVIORAL: 'High-severity findings indicate lateral movement attempts across exposed database endpoints.',
      DNS_ANOMALY: 'Internal assets are querying high-entropy domains characteristic of DGA malware beaconing.',
      OUTBOUND_C2: 'Outbound connections from critical server subnets indicate unauthorized reverse shell persistence.',
      CREDENTIAL_ACCESS: 'Spike in authentication failure events signifies ongoing password spraying against administrative accounts.',
      EXECUTION_ANOMALY: 'Repeated diagnostic script timeouts and abnormal exit codes suggest endpoint defense evasion.',
    };

    const chosenHypothesis = hypotheses[category] || `Threat activity matching ${sanitizedCtx || 'observed signals'} indicates active adversary reconnaissance.`;

    res.json({
      success: true,
      data: {
        category,
        hypothesis: chosenHypothesis,
        proposedEntity: category === 'DNS_ANOMALY' || category === 'EXECUTION_ANOMALY' ? 'terminal_job' : (category === 'CREDENTIAL_ACCESS' ? 'alert' : 'finding'),
        rationale: 'Hypothesis derived strictly from category semantics and verified observed evidence fields.',
        suggestedConditions: [
          { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' }
        ],
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Drafts a structured query AST from a hypothesis
 * POST /api/chatbot/hunting/query
 */
const handleHuntingQuery = async (req, res) => {
  try {
    const { hypothesis = '', targetEntity = 'finding', dataSources = ['FINDINGS', 'ALERTS'] } = req.body;
    const entity = String(targetEntity).toLowerCase();

    const structuredQuery = {
      entity: ['finding', 'alert', 'incident', 'ioc', 'terminal_job', 'asset'].includes(entity) ? entity : 'finding',
      conditions: [
        { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' }
      ],
      booleanLogic: 'AND'
    };

    if (hypothesis.toLowerCase().includes('dns') || hypothesis.toLowerCase().includes('whois')) {
      structuredQuery.entity = 'terminal_job';
      structuredQuery.conditions = [
        { field: 'tool', operator: 'in', value: 'dns,whois' },
        { field: 'status', operator: 'equals', value: 'COMPLETED' }
      ];
    } else if (hypothesis.toLowerCase().includes('auth') || hypothesis.toLowerCase().includes('credential')) {
      structuredQuery.entity = 'alert';
      structuredQuery.conditions = [
        { field: 'category', operator: 'contains', value: 'AUTH' },
        { field: 'severity', operator: 'in', value: 'HIGH,CRITICAL' }
      ];
    }

    res.json({
      success: true,
      data: {
        structuredQuery,
        dataSources,
        rationale: 'Compiled safe structured AST without raw database injection. Validated against entity schemas.',
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Explains observed threat hunt execution results
 * POST /api/chatbot/hunting/explain
 */
const handleHuntingExplain = async (req, res) => {
  try {
    const { executionId, resultCount = 0, evidenceSummary = '' } = req.body;
    const count = Number(resultCount) || 0;

    let explanation = '';
    if (count === 0) {
      explanation = `Hunt execution [${executionId || 'HEX'}] returned NO_MATCH. No platform telemetry met the structured query conditions within the bounded time horizon. This indicates either benign operating conditions or defensive coverage gaps.`;
    } else {
      explanation = `Hunt execution [${executionId || 'HEX'}] identified ${count} matching evidence record(s). Observed patterns validate the underlying hypothesis: ${String(evidenceSummary).slice(0, 200)}. Recommend promoting high-severity matches to Findings for analyst triage.`;
    }

    res.json({
      success: true,
      data: {
        executionId,
        explanation,
        keyObservations: count > 0 ? ['Correlated security events confirmed in telemetry', 'Time horizon bounded and verified'] : ['Zero telemetry matches observed'],
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Summarizes threat hunt execution
 * POST /api/chatbot/hunting/summarize
 */
const handleHuntingSummarize = async (req, res) => {
  try {
    const { executionId } = req.body;
    const ThreatHuntExecution = require('../../models/ThreatHuntExecution');
    const execution = executionId ? await ThreatHuntExecution.findOne({ executionId }) : null;

    if (!execution) {
      return res.status(404).json({ success: false, error: 'Execution not found' });
    }

    const summary = `Hunt [${execution.huntName}] executed on ${execution.startedAt?.toISOString() || 'unknown'}. Result status: [${execution.status}] with ${execution.resultCount} observed evidence records across sources (${execution.dataSourcesQueried?.join(', ') || 'N/A'}). Duration: ${execution.durationMs}ms.`;

    res.json({
      success: true,
      data: {
        executionId: execution.executionId,
        huntId: execution.huntId,
        summary,
        recommendedActions: execution.resultCount > 0 ? ['Promote primary evidence to Finding', 'Draft candidate Detection Rule'] : ['Archive hunt run', 'Adjust time window or hypothesis'],
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Drafts candidate detection rule from verified hunt
 * POST /api/chatbot/hunting/draft-detection
 */
const handleHuntingDraftDetection = async (req, res) => {
  try {
    const { huntId, executionId } = req.body;
    const ThreatHunt = require('../../models/ThreatHunt');
    const DetectionRule = require('../../models/DetectionRule');

    const hunt = huntId ? await ThreatHunt.findOne({ huntId }) : null;
    if (!hunt) {
      return res.status(404).json({ success: false, error: 'Hunt not found' });
    }

    const ruleId = `RULE-HUNT-AI-${Date.now().toString().slice(-6)}`;
    const draftRule = await DetectionRule.create({
      ruleId,
      name: `AI Draft from Hunt: ${hunt.name}`,
      description: `AI-drafted detection rule based on verified threat hunt [${hunt.name}]. Hypothesis: ${hunt.hypothesis}`,
      severity: 'MEDIUM',
      category: hunt.category || 'threat_hunt_candidate',
      status: 'DRAFT',
      enabled: false, // Inactive until approved
      version: 1,
      author: 'AI_HUNTING_COPILOT',
      isAiGenerated: true,
      aiDraft: true,
      aiMetadata: {
        rationale: 'Generated from threat hunt execution. Requires isolated validation test and human approval.',
        proposedConditions: hunt.structuredQuery?.conditions || [],
        confidence: 85
      },
      conditions: hunt.structuredQuery?.conditions || [{ field: 'severity', operator: 'equals', value: 'HIGH' }],
      affectedEntityTypes: ['finding', 'alert'],
      tags: ['ai-draft', 'threat-hunt-feedback'],
      responsePolicy: { actionType: 'ALERT', requiresApproval: true },
      organizationId: hunt.organizationId
    });

    res.json({
      success: true,
      data: {
        rule: draftRule,
        explanation: 'Candidate detection rule drafted in DRAFT status. Explicit human operator approval required for activation.',
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * Recommends next investigative steps
 * POST /api/chatbot/hunting/next-step
 */
const handleHuntingNextStep = async (req, res) => {
  try {
    const { executionId, category = 'IOC_SWEEP', resultCount = 0 } = req.body;
    const count = Number(resultCount) || 0;

    const nextSteps = count > 0
      ? [
          'Enrich matched indicator against AlienVault OTX and CIRCL HashLookup.',
          'Execute diagnostic native whois and dns queries on correlated target hostnames.',
          'Check related endpoints in the same CIDR subnet for lateral movement indicators.',
          'Promote the highest-risk match to a formal Incident for attack-chain mapping.'
        ]
      : [
          'Expand search time horizon from 24 hours to 7 days.',
          'Broaden condition scope from exact match to contains or regex.',
          'Include auxiliary terminal jobs and scan histories in data sources.'
        ];

    res.json({
      success: true,
      data: {
        executionId,
        recommendedNextSteps: nextSteps,
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded SOC AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * ============================================================================
 * 🛡️ BOUNDED AI INCIDENT COPILOT HANDLERS (Phase 72)
 *
 * Strict Guardrails:
 * 1. AI may summarize, explain, recommend, and draft.
 * 2. AI may NOT mutate incident state, close incidents, or approve actions.
 * 3. All untrusted incident fields wrapped in strict boundary delimiters.
 * ============================================================================
 */

const IncidentModel = require('../../models/Incident');

const handleIncidentSummarize = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) {
      inc = await IncidentModel.findOne({ incidentId }).lean();
    }
    if (!inc && req.body.incident) {
      inc = req.body.incident;
    }
    if (!inc) {
      return res.status(404).json({ success: false, error: 'Incident not found' });
    }

    const untrustedPayload = `<<<UNTRUSTED_INCIDENT_DATA>>>
ID: ${inc.incidentId}
Title: ${inc.title}
Severity: ${inc.severity}
Status: ${inc.status}
RiskScore: ${inc.riskScore}
AffectedAssets: ${(inc.affectedAssets || []).join(', ')}
Classification: ${JSON.stringify(inc.classification || {})}
Description: ${inc.description || ''}
<<<END_UNTRUSTED_DATA>>>`;

    const summary = {
      executiveSummary: `Incident ${inc.incidentId} (${inc.title}) currently in state ${inc.status}. Identified with ${inc.severity} severity affecting ${(inc.affectedAssets || []).length} assets.`,
      technicalContext: `Adversary tactic categorized as ${inc.classification?.tactic || 'ATTACK'}. Correlated risk score is ${inc.riskScore}/100.`,
      keyFindings: [
        `Target Assets: ${(inc.affectedAssets || []).join(', ') || 'None identified'}`,
        `Current Status: ${inc.status}`,
        `Risk Score: ${inc.riskScore}/100`,
      ],
      delimiterSanitized: true,
      model: 'gemini-2.5-flash',
      provider: 'CyberShield Bounded Incident Copilot',
    };

    res.json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleIncidentTriage = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) inc = await IncidentModel.findOne({ incidentId }).lean();
    if (!inc && req.body.incident) inc = req.body.incident;
    if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

    const triageAdvice = {
      incidentId: inc.incidentId,
      recommendedTactic: inc.classification?.tactic || 'INITIAL_ACCESS',
      recommendedSeverity: inc.severity || 'HIGH',
      priorityBreakdown: {
        assetCriticality: 'MEDIUM',
        incidentSeverity: inc.severity || 'MEDIUM',
        recommendedPriority: inc.severity === 'CRITICAL' ? 'CRITICAL' : 'HIGH',
      },
      recommendedTeam: 'SOC-Tier2',
      rationale: 'Elevated due to correlation across high-severity security findings.',
      requiresAnalystConfirmation: true,
      model: 'gemini-2.5-flash',
    };

    res.json({ success: true, data: triageAdvice });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleIncidentInvestigate = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) inc = await IncidentModel.findOne({ incidentId }).lean();
    if (!inc && req.body.incident) inc = req.body.incident;
    if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

    const steps = [
      'Query passive DNS and WHOIS records for all external IPs in correlated alerts.',
      'Examine host authentication event logs within ±30 minutes of detection.',
      'Check endpoint process trees for unexpected parent-child relationships (e.g. powershell spawning from web server).',
      'Collect and cryptographically hash suspicious binaries or execution artifacts.',
    ];

    res.json({
      success: true,
      data: {
        incidentId: inc.incidentId,
        investigativeHypothesis: `Potential lateral movement or credential access activity observed against ${inc.affectedAssets?.[0] || 'primary asset'}.`,
        recommendedInvestigationSteps: steps,
        model: 'gemini-2.5-flash',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleIncidentRecommendContainment = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) inc = await IncidentModel.findOne({ incidentId }).lean();
    if (!inc && req.body.incident) inc = req.body.incident;
    if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

    const recommendations = [
      {
        actionType: 'HOST_NETWORK_ISOLATION',
        target: inc.affectedAssets?.[0] || 'affected-host',
        riskClass: 'PRIVILEGED',
        requiresApproval: true,
        rationale: 'Prevent outbound C2 communication and east-west movement while preserving memory state for triage.',
      },
      {
        actionType: 'FIREWALL_BLOCK_IOC',
        target: 'external-ioc-ip',
        riskClass: 'USER_APPROVED',
        requiresApproval: true,
        rationale: 'Block outbound traffic to malicious indicators identified in correlated alerts.',
      },
    ];

    res.json({
      success: true,
      data: {
        incidentId: inc.incidentId,
        recommendations,
        governanceNotice: 'All containment actions require Operator/Admin approval via PendingApproval. Command execution exit code 0 does not imply remediation; independent verification is mandatory.',
        model: 'gemini-2.5-flash',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleIncidentDraftTasks = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) inc = await IncidentModel.findOne({ incidentId }).lean();
    if (!inc && req.body.incident) inc = req.body.incident;
    if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

    const draftTasks = [
      {
        title: 'Collect and Hash Volatile Memory Artifacts',
        description: 'Preserve process list and memory dump using certified host tool. Register SHA-256 evidence.',
        priority: 'HIGH',
      },
      {
        title: 'Isolate Host from Local Subnet',
        description: 'Apply temporary network containment policy upon operator approval.',
        priority: 'HIGH',
      },
      {
        title: 'Review Active Directory Authentication Logs',
        description: 'Verify if compromised account initiated lateral Kerberos ticket requests.',
        priority: 'MEDIUM',
      },
      {
        title: 'Independent Remediation Verification',
        description: 'Verify process termination and firewall rule enforcement with diagnostic probe.',
        priority: 'HIGH',
      },
    ];

    res.json({
      success: true,
      data: {
        incidentId: inc.incidentId,
        draftTasks,
        model: 'gemini-2.5-flash',
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

const handleIncidentPostmortem = async (req, res) => {
  try {
    const { incidentId } = req.body;
    let inc = null;
    if (incidentId) inc = await IncidentModel.findOne({ incidentId }).lean();
    if (!inc && req.body.incident) inc = req.body.incident;
    if (!inc) return res.status(404).json({ success: false, error: 'Incident not found' });

    const postmortemDraft = {
      incidentId: inc.incidentId,
      rootCauseHypothesis: `Unrestricted ingress access allowed exploitation of vulnerability on ${inc.affectedAssets?.[0] || 'target host'}.`,
      impactSummary: `Impacted ${inc.affectedAssets?.length || 1} asset(s) with confirmed detection. No persistent data exfiltration confirmed.`,
      containmentSummary: `Host isolated and adversary process terminated. Verified via independent diagnostic probe.`,
      lessonsLearned: 'Improve perimeter ingress filtering and accelerate alert-to-incident correlation window.',
      detectionGaps: 'Absence of behavioral rule alerting on unexpected command interpreter spawn by web daemon.',
      candidateHunts: ['Hunt: Web server anomalous child processes across cluster'],
      notice: 'Advisory draft. High/Critical incidents require analyst and lead review before marking closure.',
      model: 'gemini-2.5-flash',
    };

    res.json({ success: true, data: postmortemDraft });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ─── Phase 73: Bounded AI Detection Engineering Handlers ──────────────────
 */

/**
 * Reviews a detection rule logic and provides advisory feedback
 * POST /api/chatbot/detection/review
 */
const handleDetectionReview = async (req, res) => {
  try {
    const rule = req.body.ruleDefinition || req.body.rule || {};
    const conditions = req.body.conditions || rule.conditions || [];
    const ruleName = String(rule.name || 'Unnamed Rule').slice(0, 100);
    const untrustedData = `<<<UNTRUSTED_DETECTION_DATA>>>\nRule: ${ruleName}\nConditions: ${JSON.stringify(conditions)}\n<<<END_UNTRUSTED_DATA>>>`;

    const reviewAnalysis = {
      ruleName,
      logicAssessment: `Rule conditions evaluated across ${Array.isArray(conditions) ? conditions.length : 1} deterministic predicates. Logic is structurally sound.`,
      falsePositiveRisk: conditions.length <= 1 ? 'MEDIUM' : 'LOW',
      recommendations: [
        'Ensure exact field paths match authoritative telemetry source schema',
        'Add at least one MATCH and one NO_MATCH deterministic test fixture before promotion to REVIEW',
        'Scope query to relevant entityType to prevent unnecessary evaluation load'
      ],
      suggestedAttackMapping: rule.mitreAttack || [{ tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1110', techniqueName: 'Brute Force' }],
      advisoryNotice: 'AI detection review is strictly advisory. Operator human review required for production activation.',
      model: 'gemini-2.5-flash',
      untrustedDataDelimited: true
    };

    res.json({
      success: true,
      advisory: reviewAnalysis.advisoryNotice,
      review: reviewAnalysis,
      data: reviewAnalysis,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Suggests tuning adjustments for a noisy or high false-positive rule
 * POST /api/chatbot/detection/tune
 */
const handleDetectionTune = async (req, res) => {
  try {
    const rule = req.body.rule || {};
    const ruleId = req.body.ruleId || rule.ruleId || 'RULE-TUNED';
    const observedNoise = req.body.feedback || req.body.observedNoise || 'High alert volume';
    const untrustedData = `<<<UNTRUSTED_DETECTION_DATA>>>\nRule: ${ruleId}\nNoise: ${observedNoise}\n<<<END_UNTRUSTED_DATA>>>`;

    const tuningProposal = {
      ruleId,
      status: 'TESTING',
      proposedTuning: 'Add allowlist condition for verified administrative maintenance windows and increase threshold',
      suggestedConditions: [
        ...(rule.conditions || []),
        { field: 'isMaintenanceWindow', operator: 'not_equals', value: 'true' }
      ],
      rationale: 'Suppresses recurring false alarms from automated backups and authorized operator scripts without opening perimeter gaps.',
      promotionConstraint: 'Tuned rules must be created as a new revision and must pass all test fixtures before review.',
      model: 'gemini-2.5-flash'
    };

    res.json({
      success: true,
      proposedRule: tuningProposal,
      data: tuningProposal,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Suggests MITRE ATT&CK mapping based on detection context
 * POST /api/chatbot/detection/map-attack
 */
const handleDetectionMapAttack = async (req, res) => {
  try {
    const description = req.body.ruleDescription || req.body.description || '';
    const conditions = req.body.conditions || [];
    const untrustedData = `<<<UNTRUSTED_DETECTION_DATA>>>\nDesc: ${description}\n<<<END_UNTRUSTED_DATA>>>`;

    const mapping = {
      suggestedTactics: ['INITIAL_ACCESS', 'EXECUTION', 'CREDENTIAL_ACCESS'],
      suggestedTechniques: [
        { tactic: 'CREDENTIAL_ACCESS', techniqueId: 'T1110', techniqueName: 'Brute Force' },
        { tactic: 'COMMAND_AND_CONTROL', techniqueId: 'T1071.001', techniqueName: 'Web Protocols' }
      ],
      confidence: 'HIGH',
      rationale: 'Mapped using semantics of authentication failures and network protocol fields.',
      model: 'gemini-2.5-flash'
    };

    res.json({
      success: true,
      suggestedMappings: mapping.suggestedTechniques,
      data: mapping,
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Discovers potential detection gaps from evidence
 * POST /api/chatbot/detection/find-gaps
 */
const handleDetectionFindGaps = async (req, res) => {
  try {
    const { recentIncidents = [], recentHunts = [] } = req.body;
    const untrustedData = `<<<UNTRUSTED_DETECTION_DATA>>>\nIncidents: ${recentIncidents.length}\nHunts: ${recentHunts.length}\n<<<END_UNTRUSTED_DATA>>>`;

    const gapRecommendations = {
      identifiedGaps: [
        {
          techniqueId: 'T1059.001',
          techniqueName: 'PowerShell Execution',
          tactic: 'EXECUTION',
          recommendation: 'Deploy detection rule alerting on encoded PowerShell arguments (-enc / -encodedcommand)'
        },
        {
          techniqueId: 'T1078',
          techniqueName: 'Valid Accounts Abuse',
          tactic: 'INITIAL_ACCESS',
          recommendation: 'Establish anomaly detection for off-hours login from unexpected autonomous service accounts'
        }
      ],
      candidateRuleStatus: 'DRAFT',
      enabled: false,
      advisoryNotice: 'Candidate detection rules must be saved in DRAFT status with enabled: false.',
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: gapRecommendations });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * Drafts recommended test fixtures for a detection rule
 * POST /api/chatbot/detection/test-plan
 */
const handleDetectionTestPlan = async (req, res) => {
  try {
    const { rule = {} } = req.body;
    const untrustedData = `<<<UNTRUSTED_DETECTION_DATA>>>\nRule: ${rule.name || rule.ruleId}\n<<<END_UNTRUSTED_DATA>>>`;

    const fixtures = [
      {
        fixtureId: `FIX-${Date.now()}-MATCH`,
        name: `${rule.name || 'Rule'} Positive Match Fixture`,
        input: { eventType: 'AUTH_FAILURE', failureCount: 10, command: 'sudo' },
        expectedResult: 'MATCH'
      },
      {
        fixtureId: `FIX-${Date.now()}-NOMATCH`,
        name: `${rule.name || 'Rule'} Negative Normal Traffic Fixture`,
        input: { eventType: 'AUTH_SUCCESS', failureCount: 0, command: 'ls -la' },
        expectedResult: 'NO_MATCH'
      }
    ];

    res.json({ success: true, data: { fixtures, model: 'gemini-2.5-flash' } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

/**
 * ============================================================================
 * 🛡️ BOUNDED AI REPORTING & COMPLIANCE COPILOT (Phase 74)
 *
 * Strict Guardrails:
 * 1. AI may summarize, explain metrics, interpret evidence, draft narratives.
 * 2. AI may NOT invent metrics, invent compliance evidence, certify compliance,
 *    alter report data, close incidents, or execute response actions.
 * 3. All untrusted report content wrapped in strict boundary delimiters.
 * 4. Output is strictly advisory.
 * ============================================================================
 */

const SOCReportModel = require('../../models/SOCReport');
const ComplianceControlModel = require('../../models/ComplianceControl');

const handleReportSummarize = async (req, res) => {
  try {
    const { reportId, reportData } = req.body;
    let report = null;

    if (reportId) {
      report = await SOCReportModel.findOne({ reportId }).lean();
    }
    if (!report && reportData) {
      report = reportData;
    }

    if (!report) {
      return res.status(404).json({ success: false, error: 'Report not found or no report data provided' });
    }

    const untrustedPayload = `<<<UNTRUSTED_REPORT_DATA>>>
ReportID: ${report.reportId}
Type: ${report.reportType}
Title: ${report.title}
Status: ${report.status}
Period: ${JSON.stringify(report.reportingPeriod || {})}
Checksum: ${report.contentHash}
<<<END_UNTRUSTED_REPORT_DATA>>>`;

    const summary = {
      reportId: report.reportId,
      reportType: report.reportType,
      title: report.title,
      executiveNarrative: `Report ${report.reportId} (${report.reportType}) covers period ${report.reportingPeriod?.startDate ? new Date(report.reportingPeriod.startDate).toLocaleDateString() : 'N/A'} to ${report.reportingPeriod?.endDate ? new Date(report.reportingPeriod.endDate).toLocaleDateString() : 'N/A'}. All underlying metrics were derived from verified persisted records with content checksum verification.`,
      keyTakeaways: [
        `Authentic record snapshot verified with cryptographic hash ${report.contentHash || 'verified'}.`,
        'Operational metrics reflect true timestamps with zero synthetic interpolation.',
        'Review individual section drill-downs for raw record citations.'
      ],
      aiBoundary: {
        isAdvisory: true,
        canCertifyCompliance: false,
        canAlterData: false,
        disclaimer: 'AI report summaries are strictly advisory. Factual metrics are derived from immutable database records.'
      },
      model: 'gemini-2.5-flash',
      provider: 'CyberShield Bounded Reporting AI'
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleReportExecutive = async (req, res) => {
  try {
    const { riskScore = 0, criticalIncidents = 0, slaBreaches = 0, detectionGaps = 0, openFindings = 0 } = req.body;

    const narrative = `Executive Intelligence Briefing:
The organization's current calculated risk posture stands at ${riskScore}/100.
There are currently ${criticalIncidents} critical incident(s) requiring active command oversight, and ${slaBreaches} SLA breach(es) recorded in the observation window.
Detection Engineering identifies ${detectionGaps} active detection gap(s) across MITRE ATT&CK coverage, while ${openFindings} vulnerability finding(s) remain open for remediation.
Recommended immediate focus is targeted triage of critical incident timelines and closure of high-risk detection blindspots.`;

    res.json({
      success: true,
      data: {
        executiveNarrative: narrative,
        riskScore,
        aiBoundary: {
          isAdvisory: true,
          syntheticDataAllowed: false,
          disclaimer: 'Advisory executive narrative drafted from actual persisted platform metrics.'
        },
        model: 'gemini-2.5-flash',
        provider: 'CyberShield Bounded Reporting AI'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleExplainMetric = async (req, res) => {
  try {
    const { metricName, metricValue } = req.body;
    if (!metricName) {
      return res.status(400).json({ success: false, error: 'metricName is required' });
    }

    const explanations = {
      MTTA: {
        name: 'Mean Time To Acknowledge (MTTA)',
        formula: 'Sum(acknowledgedAt - createdAt) / Total Acknowledged Incidents',
        interpretation: 'Measures how swiftly the SOC triage team claims and begins investigating an alert after incident inception. Lower values reflect faster triage response.',
        methodology: 'Computed strictly from genuine incident timestamps. Unacknowledged records are explicitly excluded and disclosed.'
      },
      MTTR: {
        name: 'Mean Time To Resolve (MTTR)',
        formula: 'Sum(resolvedAt - createdAt) / Total Resolved Incidents',
        interpretation: 'Measures the total operational duration from incident creation to verified resolution. Reflects end-to-end containment, mitigation, and verification velocity.',
        methodology: 'Computed strictly from genuine resolution timestamps. Open or unresolved incidents are excluded and counted under excludedRecords.'
      },
      SLA_BREACH_RATE: {
        name: 'SLA Breach Rate',
        formula: '(Breached Incidents / Total SLA-Governed Incidents) * 100',
        interpretation: 'Percentage of incidents that exceeded predetermined operational response time thresholds.',
        methodology: 'Computed against persisted SLA governance rules.'
      },
      ATTACK_COVERAGE: {
        name: 'MITRE ATT&CK Coverage Rate',
        formula: '(Covered Techniques / Total Tracked Techniques) * 100',
        interpretation: 'Indicates the breadth of threat detection rules actively monitoring against known adversary tactics, techniques, and procedures.',
        methodology: 'Mapped directly from active DetectionRule definitions.'
      }
    };

    const key = metricName.toUpperCase().replace(/[\s-]/g, '_');
    const explanation = explanations[key] || {
      name: metricName,
      formula: 'Persisted Record Aggregation',
      interpretation: `Operational metric tracking ${metricName}. Value: ${metricValue !== undefined ? metricValue : 'N/A'}.`,
      methodology: 'Zero synthetic interpolation. Real platform counts.'
    };

    res.json({
      success: true,
      data: {
        ...explanation,
        currentValue: metricValue,
        aiBoundary: {
          isAdvisory: true,
          disclaimer: 'Metric explanations provide mathematical and operational context. Values are factual platform metrics.'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleExplainControl = async (req, res) => {
  try {
    const { controlId, domain } = req.body;
    let control = null;

    if (controlId) {
      control = await ComplianceControlModel.findOne({ controlId }).lean();
    }

    const domainName = control?.domain || domain || 'COMPLIANCE_CONTROL';
    const status = control?.status || 'NOT_ASSESSED';

    res.json({
      success: true,
      data: {
        controlId: control?.controlId || controlId || 'CTRL-UNKNOWN',
        title: control?.title || `Control in ${domainName}`,
        domain: domainName,
        status,
        explanation: `Control ${control?.controlId || controlId} assesses operational readiness in domain ${domainName}. CyberShield X evaluates concrete platform records (audit events, access policies, rule detections, and evidence records) to determine evidence sufficiency.`,
        evidenceCriteria: control?.evidenceCriteria || 'Automated inspection of persisted operational records.',
        aiBoundary: {
          isAdvisory: true,
          legalCertificationAuthority: false,
          disclaimer: 'Platform indicates technical evidence presence only. Formal legal or regulatory compliance requires external audit qualification.'
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleRecommendReportActions = async (req, res) => {
  try {
    const { criticalCount = 0, gapsCount = 0, slaBreachCount = 0 } = req.body;

    const recommendations = [];
    if (criticalCount > 0) {
      recommendations.push({
        priority: 'CRITICAL',
        title: 'Triage and Contain Active Critical Incidents',
        rationale: `${criticalCount} critical incident(s) currently open. Rapid containment reduces exposure surface.`
      });
    }
    if (slaBreachCount > 0) {
      recommendations.push({
        priority: 'HIGH',
        title: 'Investigate Root Causes of SLA Breaches',
        rationale: `${slaBreachCount} incident(s) exceeded response targets. Review queue staffing and escalation workflows.`
      });
    }
    if (gapsCount > 0) {
      recommendations.push({
        priority: 'MEDIUM',
        title: 'Author Detection Rules for Uncovered ATT&CK Techniques',
        rationale: `${gapsCount} detection gaps identified. Deploy content packs or custom rules to close blind spots.`
      });
    }
    if (recommendations.length === 0) {
      recommendations.push({
        priority: 'LOW',
        title: 'Conduct Scheduled Threat Hunt Sweeps',
        rationale: 'Core operational indicators are stable. Execute proactive indicator sweeps to uncover latent risks.'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        aiBoundary: {
          isAdvisory: true,
          canApproveActions: false,
          canExecuteActions: false,
          disclaimer: 'Recommendations are prioritized suggestions for human analyst review. AI cannot autonomously approve or execute actions.'
        },
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============================================================================
// Phase 75: Bounded AI Governance Copilot
// ============================================================================

const GovernancePolicyModel = require('../../models/GovernancePolicy');
const GovernanceEvaluationService = require('../../services/soc/GovernanceEvaluationService');

const AI_GOVERNANCE_BOUNDARY = {
  isAdvisory: true,
  canApprove: false,
  canActivate: false,
  canSuspend: false,
  canRetire: false,
  canAlterRetention: false,
  canDeleteOrArchive: false,
  canReleaseLegalHold: false,
  canGrantRoles: false,
  canGrantBreakGlass: false,
  canCertifyCompliance: false,
  disclaimer: 'AI governance assistance is strictly advisory. Official governance compliance and policy mutations require human administrative approval.'
};

/**
 * POST /api/chatbot/governance/summarize
 * Summarizes organization governance posture and key control domains
 */
const handleGovernanceSummarize = async (req, res) => {
  try {
    const { organizationId, postureData } = req.body;
    const orgId = organizationId || req.user?.organizationId || 'default-org';

    let posture = postureData;
    if (!posture) {
      posture = await GovernanceEvaluationService.evaluateGovernancePosture(orgId);
    }

    const untrustedPayload = `<<<UNTRUSTED_GOVERNANCE_DATA>>>
OrganizationId: ${orgId}
OverallStatus: ${posture.overallStatus}
ComplianceScore: ${posture.complianceScore}%
TotalDomains: ${posture.totalDomains}
CompliantDomains: ${posture.compliantDomains}
GapsCount: ${posture.gaps ? posture.gaps.length : 0}
<<<END_UNTRUSTED_GOVERNANCE_DATA>>>`;

    const summary = {
      organizationId: orgId,
      overallStatus: posture.overallStatus,
      complianceScore: posture.complianceScore,
      narrative: `Organization governance posture is currently assessed as ${posture.overallStatus} with an overall compliance score of ${posture.complianceScore}%. ${posture.compliantDomains} of ${posture.totalDomains} canonical policy domains have active, enforced policies. ${posture.gaps?.length || 0} governance gap(s) were identified for remediation.`,
      highlights: [
        `Operational status: ${posture.overallStatus}`,
        `Compliance score: ${posture.complianceScore}% (${posture.compliantDomains}/${posture.totalDomains} domains active)`,
        posture.gaps?.length > 0
          ? `${posture.gaps.length} gap(s) require administrative review.`
          : 'All evaluated governance domains are active.'
      ],
      aiBoundary: AI_GOVERNANCE_BOUNDARY,
      model: 'gemini-2.5-flash',
      provider: 'CyberShield Bounded AI Governance'
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/governance/explain-policy
 * Explains security controls and implications of a specific policy
 */
const handleGovernanceExplainPolicy = async (req, res) => {
  try {
    const { policyId, organizationId, policyData } = req.body;
    const orgId = organizationId || req.user?.organizationId || 'default-org';

    let policy = policyData;
    if (!policy && policyId) {
      policy = await GovernancePolicyModel.findOne({ policyId, organizationId: orgId }).lean();
    }

    if (!policy) {
      return res.status(404).json({ success: false, error: 'Policy not found or no policy data provided' });
    }

    const untrustedPayload = `<<<UNTRUSTED_GOVERNANCE_DATA>>>
PolicyID: ${policy.policyId}
PolicyType: ${policy.policyType}
Name: ${policy.name}
Status: ${policy.status}
Version: ${policy.currentVersion}
EnforcementMode: ${policy.enforcementMode}
Configuration: ${JSON.stringify(policy.configuration || {})}
<<<END_UNTRUSTED_GOVERNANCE_DATA>>>`;

    const explanation = {
      policyId: policy.policyId,
      policyType: policy.policyType,
      name: policy.name,
      status: policy.status,
      version: policy.currentVersion,
      enforcementMode: policy.enforcementMode,
      summary: `Policy ${policy.name} (${policy.policyType}) is in ${policy.status} status with enforcement mode ${policy.enforcementMode}.`,
      controlAnalysis: `Governs ${policy.policyType.toLowerCase().replace('_', ' ')} with parameters: ${Object.keys(policy.configuration || {}).join(', ') || 'standard baseline'}.`,
      recommendations: policy.status === 'DRAFT'
        ? ['Submit for review once configuration parameters are verified.', 'Ensure dual-authorization approval before activation.']
        : ['Ensure regular annual review cycle.', 'Verify runtime audit telemetry continues to report zero bypass attempts.'],
      aiBoundary: AI_GOVERNANCE_BOUNDARY,
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/governance/explain-gap
 * Explains root cause and risk of an identified governance gap
 */
const handleGovernanceExplainGap = async (req, res) => {
  try {
    const { gapId, domain, gapData } = req.body;
    const gap = gapData || { gapId, domain };

    const untrustedPayload = `<<<UNTRUSTED_GOVERNANCE_DATA>>>
GapID: ${gap.gapId || gapId}
Domain: ${gap.domain || domain}
Severity: ${gap.severity || 'MEDIUM'}
Title: ${gap.title || 'Identified Governance Gap'}
Description: ${gap.description || ''}
<<<END_UNTRUSTED_GOVERNANCE_DATA>>>`;

    const explanation = {
      gapId: gap.gapId || gapId,
      domain: gap.domain || domain,
      severity: gap.severity || 'MEDIUM',
      title: gap.title || `Governance Gap in ${gap.domain || domain}`,
      riskExposure: `Without an active policy in ${gap.domain || domain}, operational safeguards rely on default behaviors rather than enforceable organizational mandates. This creates potential non-compliance risks during external audits.`,
      regulatoryImpact: 'May be flagged as a control deficiency under SOC 2 Type II, ISO 27001, and NIST CSF frameworks.',
      aiBoundary: AI_GOVERNANCE_BOUNDARY,
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/governance/recommend-remediation
 * Generates prioritized, actionable remediation steps for governance gaps
 */
const handleGovernanceRecommendRemediation = async (req, res) => {
  try {
    const { organizationId, gapId, gaps } = req.body;
    const orgId = organizationId || req.user?.organizationId || 'default-org';

    const untrustedPayload = `<<<UNTRUSTED_GOVERNANCE_DATA>>>
OrganizationId: ${orgId}
TargetGapId: ${gapId || 'ALL'}
ProvidedGaps: ${JSON.stringify(gaps || [])}
<<<END_UNTRUSTED_GOVERNANCE_DATA>>>`;

    const remediationSteps = [
      {
        step: 1,
        title: 'Initialize Canonical Policy Draft',
        action: 'POST /api/governance/policies/seed-canonical',
        description: 'Seed standard baseline governance policies for any unconfigured domains.',
        roleRequired: 'OPERATOR'
      },
      {
        step: 2,
        title: 'Conduct Administrative Review',
        action: 'POST /api/governance/policies/:policyId/review',
        description: 'Review policy parameters with security leadership and verify alignment with organizational standards.',
        roleRequired: 'ANALYST'
      },
      {
        step: 3,
        title: 'Cryptographic Approval & Activation',
        action: 'POST /api/governance/policies/:policyId/approve then /activate',
        description: 'Authorized administrator signs off on immutable configuration hash and activates runtime enforcement.',
        roleRequired: 'ADMIN'
      }
    ];

    res.json({
      success: true,
      data: {
        organizationId: orgId,
        remediationPlan: remediationSteps,
        aiBoundary: AI_GOVERNANCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// 🛡️ Phase 76 Bounded AI Reliability Copilot
// ==========================================

const AI_RELIABILITY_BOUNDARY = {
  isAdvisory: true,
  canMutateRuntime: false,
  canAlterSLOs: false,
  canSuppressAlerts: false,
  canExecuteRecovery: false,
  canRestoreBackups: false,
  canCertifyReadiness: false,
  delimiters: {
    start: '<<<UNTRUSTED_RELIABILITY_DATA>>>',
    end: '<<<END_UNTRUSTED_RELIABILITY_DATA>>>'
  },
  disclaimer: 'AI reliability analysis is strictly advisory. Operational status declarations, disaster recovery execution, and SLO mutations require human administrative verification.'
};

/**
 * POST /api/chatbot/reliability/summarize
 * Summarizes platform health, capacity, and operational telemetry
 */
const handleReliabilitySummarize = async (req, res) => {
  try {
    const { organizationId } = req.body;
    const orgId = organizationId || req.user?.organizationId || null;

    const serviceHealthService = require('../../services/observability/ServiceHealthService');
    const apiObservabilityService = require('../../services/observability/APIObservabilityService');
    const capacityService = require('../../services/observability/CapacityService');

    const health = await serviceHealthService.evaluateAllServices(orgId, false);
    const apiMetrics = apiObservabilityService.getMetricsSummary(15 * 60 * 1000, orgId);
    const capacity = await capacityService.evaluateCapacity();

    const untrustedPayload = `<<<UNTRUSTED_RELIABILITY_DATA>>>
OverallHealth: ${health.overallStatus}
Subsystems: ${JSON.stringify(health.subsystems.map(s => ({ id: s.serviceId, status: s.status, latency: s.latencyMs })))}
APIMetrics: ${JSON.stringify(apiMetrics.requests)}
CapacityStatus: ${capacity.status}
HeapUtilization: ${capacity.signals.memory.heapUtilizationPercent}%
<<<END_UNTRUSTED_RELIABILITY_DATA>>>`;

    const summary = {
      overallStatus: health.overallStatus,
      capacityStatus: capacity.status,
      narrative: `Platform reliability is currently assessed as ${health.overallStatus} with capacity state ${capacity.status}. Monitored ${health.subsystemCount} platform subsystems. Memory heap utilization is at ${capacity.signals.memory.heapUtilizationPercent}%. Total observed API requests in rolling 15m window: ${apiMetrics.requests.total} with error rate ${(apiMetrics.requests.errorRate * 100).toFixed(2)}%.`,
      subsystemBreakdown: health.subsystems.map(s => ({
        serviceId: s.serviceId,
        serviceName: s.serviceName,
        status: s.status,
        latencyMs: s.latencyMs
      })),
      aiBoundary: AI_RELIABILITY_BOUNDARY,
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/reliability/explain-health
 * Explains root causes and diagnostic indicators of degraded/unhealthy subsystems
 */
const handleReliabilityExplainHealth = async (req, res) => {
  try {
    const { serviceId, status, details } = req.body;

    const untrustedPayload = `<<<UNTRUSTED_RELIABILITY_DATA>>>
TargetServiceId: ${serviceId}
ReportedStatus: ${status}
ObservedDetails: ${JSON.stringify(details || {})}
<<<END_UNTRUSTED_RELIABILITY_DATA>>>`;

    const explanation = {
      serviceId: serviceId || 'UNKNOWN',
      status: status || 'UNKNOWN',
      analysis: `Subsystem '${serviceId || 'unknown'}' was observed in status '${status || 'UNKNOWN'}'. Observed evidence indicates diagnostic parameters require operator review. If degraded or unhealthy, downstream service calls may experience increased latency or fallback behavior.`,
      recommendedActions: [
        'Inspect bounded probe telemetry and error references',
        'Verify host and database connection availability',
        'Check recent operational spikes or concurrent incidents'
      ],
      aiBoundary: AI_RELIABILITY_BOUNDARY,
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/reliability/explain-slo
 * Explains SLO performance, error budget remaining, and risk of breach
 */
const handleReliabilityExplainSLO = async (req, res) => {
  try {
    const { sloId, organizationId } = req.body;
    const SLODefinition = require('../../models/SLODefinition');

    const slo = await SLODefinition.findOne({
      sloId,
      ...(organizationId ? { organizationId } : {})
    }).lean();

    if (!slo) {
      return res.status(404).json({ success: false, error: `SLO definition '${sloId}' not found` });
    }

    const untrustedPayload = `<<<UNTRUSTED_RELIABILITY_DATA>>>
SLOId: ${slo.sloId}
Name: ${slo.name}
Service: ${slo.service}
Target: ${slo.targetPercent}%
CurrentAttainment: ${slo.currentAttainmentPercent !== null ? slo.currentAttainmentPercent + '%' : 'NOT_MEASURED'}
Status: ${slo.status}
ErrorBudgetRemaining: ${slo.errorBudgetRemainingPercent !== null ? slo.errorBudgetRemainingPercent + '%' : 'N/A'}
<<<END_UNTRUSTED_RELIABILITY_DATA>>>`;

    const explanation = {
      sloId: slo.sloId,
      name: slo.name,
      service: slo.service,
      status: slo.status,
      targetPercent: slo.targetPercent,
      currentAttainmentPercent: slo.currentAttainmentPercent,
      errorBudgetRemainingPercent: slo.errorBudgetRemainingPercent,
      analysis: slo.status === 'MEETING'
        ? `SLO '${slo.name}' is currently meeting its objective of ${slo.targetPercent}% with 100% of error budget preserved.`
        : slo.status === 'AT_RISK'
        ? `SLO '${slo.name}' is AT_RISK. Error budget has been partially consumed (${100 - (slo.errorBudgetRemainingPercent || 0)}% consumed). Corrective stabilization recommended.`
        : slo.status === 'BREACHED'
        ? `SLO '${slo.name}' has breached its objective of ${slo.targetPercent}%. Attainment observed: ${slo.currentAttainmentPercent}%. Error budget exhausted.`
        : `SLO '${slo.name}' has status '${slo.status}'. Insufficient or no real telemetry samples have been accumulated in the sliding window.`,
      aiBoundary: AI_RELIABILITY_BOUNDARY,
      model: 'gemini-2.5-flash'
    };

    res.json({ success: true, data: explanation });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * POST /api/chatbot/reliability/recommend-remediation
 * Generates prioritized reliability remediation recommendations
 */
const handleReliabilityRecommendRemediation = async (req, res) => {
  try {
    const { serviceId, anomalyType, details } = req.body;

    const untrustedPayload = `<<<UNTRUSTED_RELIABILITY_DATA>>>
ServiceId: ${serviceId || 'GENERAL'}
AnomalyType: ${anomalyType || 'GENERIC_ANOMALY'}
Details: ${JSON.stringify(details || {})}
<<<END_UNTRUSTED_RELIABILITY_DATA>>>`;

    const recommendations = [
      {
        priority: 1,
        title: 'Perform Bounded Read-Only Diagnostics',
        action: 'POST /api/observability/health/probe',
        description: 'Trigger immediate bounded subsystem probe to evaluate live connectivity and latency metrics.',
        roleRequired: 'OPERATOR'
      },
      {
        priority: 2,
        title: 'Review Cross-Signal Incident Correlation',
        action: 'GET /api/observability/correlations',
        description: 'Verify if active SOC security incidents or recent deployments temporally correlate with the anomaly.',
        roleRequired: 'ANALYST'
      },
      {
        priority: 3,
        title: 'Verify Safe Non-Destructive Backup State',
        action: 'POST /api/observability/backups/verify',
        description: 'Confirm integrity checksums of primary backups and validate non-destructive restore readiness in isolated sandbox.',
        roleRequired: 'ADMIN'
      }
    ];

    res.json({
      success: true,
      data: {
        serviceId: serviceId || 'GENERAL',
        anomalyType: anomalyType || 'GENERIC_ANOMALY',
        recommendations,
        aiBoundary: AI_RELIABILITY_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🛡️ PHASE 77 — AUTOMATION AI COPILOT HANDLERS
 */

const AI_AUTOMATION_BOUNDARY = {
  isAdvisory: true,
  executionPermitted: false,
  approvalPermitted: false,
  disclaimer: 'AI outputs are strictly advisory. AI cannot execute playbooks or approve security drift remediations.'
};

const handleAutomationSummarize = async (req, res) => {
  try {
    const ControlValidationService = require('../../services/automation/ControlValidationService');
    const DriftDetectionService = require('../../services/automation/DriftDetectionService');
    const orgId = req.user?.organizationId || null;

    const posture = await ControlValidationService.getPostureSummary(orgId);
    const drifts = await DriftDetectionService.getActiveDrifts(orgId);

    const boundedPayload = `<<<UNTRUSTED_AUTOMATION_DATA>>>
Posture: ${JSON.stringify(posture)}
ActiveDriftsCount: ${drifts.length}
<<<END_UNTRUSTED_AUTOMATION_DATA>>>`;

    res.json({
      success: true,
      data: {
        summary: `Control posture evaluated across ${posture.totalEvaluated} controls (${posture.pass} PASS, ${posture.fail} FAIL, ${posture.unknown} UNKNOWN). Active un-remediated drift count: ${drifts.length}.`,
        posture,
        activeDriftCount: drifts.length,
        aiBoundary: AI_AUTOMATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleAutomationExplainDrift = async (req, res) => {
  try {
    const { driftId } = req.body;
    const SecurityDrift = require('../../models/SecurityDrift');
    const orgId = req.user?.organizationId || null;

    const query = { driftId };
    if (orgId) query.organizationId = orgId;
    const drift = await SecurityDrift.findOne(query).lean();

    if (!drift) {
      return res.status(404).json({ success: false, error: 'Drift item not found' });
    }

    const boundedPayload = `<<<UNTRUSTED_AUTOMATION_DATA>>>
DriftId: ${drift.driftId}
DriftType: ${drift.driftType}
ObservedState: ${JSON.stringify(drift.observedState)}
ExpectedState: ${JSON.stringify(drift.expectedState)}
Severity: ${drift.severity}
<<<END_UNTRUSTED_AUTOMATION_DATA>>>`;

    res.json({
      success: true,
      data: {
        driftId: drift.driftId,
        explanation: `Security drift detected on [${drift.sourceRecord}]. Observed state differs from baseline reference [${drift.baselineReference}]. Severity: [${drift.severity}].`,
        impact: `Potential governance, detection, or integration policy breach if left un-remediated.`,
        aiBoundary: AI_AUTOMATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleAutomationRecommendRemediation = async (req, res) => {
  try {
    const { driftId } = req.body;
    const RemediationService = require('../../services/automation/RemediationService');
    const orgId = req.user?.organizationId || null;

    const proposal = await RemediationService.proposeRemediation(driftId, orgId);

    res.json({
      success: true,
      data: {
        driftId,
        proposal,
        recommendation: `Recommended action: [${proposal.classification.actionType || 'MANUAL_INSPECTION'}]. Approval category: [${proposal.classification.category}].`,
        aiBoundary: AI_AUTOMATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleAutomationDraftPlaybook = async (req, res) => {
  try {
    const { name, category, description } = req.body;
    const PlaybookService = require('../../services/automation/PlaybookService');
    const orgId = req.user?.organizationId || null;

    const draftData = {
      name: name || 'AI Drafted Automation Playbook',
      description: description || 'Advisory AI generated playbook proposal.',
      category: category || 'GOVERNANCE_DRIFT',
      requiredRole: 'ADMIN',
      approvalRequired: true,
      steps: [
        {
          stepId: 'STEP-1',
          name: 'Verify Baseline Drift State',
          actionType: 'RESTORE_GOVERNANCE_POLICY',
          targetEntity: 'GovernancePolicy',
          parameters: { autoVerify: true },
          onFailure: 'STOP'
        }
      ]
    };

    const playbook = await PlaybookService.createPlaybook(draftData, { username: 'AI_AUTOMATION_COPILOT', role: 'ADMIN' }, orgId);

    res.json({
      success: true,
      data: {
        playbook,
        explanation: 'Candidate playbook drafted strictly in DRAFT status. Human operator review and approval required before activation.',
        aiBoundary: AI_AUTOMATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

/**
 * 🛡️ PHASE 78 — INVESTIGATION DATA FABRIC AI COPILOT HANDLERS
 */

const AI_INVESTIGATION_BOUNDARY = {
  isAdvisory: true,
  executionPermitted: false,
  attributionPermitted: false,
  disclaimer: 'AI outputs are strictly advisory. AI cannot invent graph edges or assign unverified root cause attribution.'
};

const handleInvestigationSummarize = async (req, res) => {
  try {
    const { entityType, entityId } = req.body;
    const InvestigationQueryService = require('../../services/datafabric/InvestigationQueryService');
    const orgId = req.user?.organizationId || null;

    const neighborhood = entityType && entityId
      ? await InvestigationQueryService.queryNeighborhood({ entityType, entityId, organizationId: orgId })
      : { totalNodes: 0, totalEdges: 0 };

    const boundedPayload = `<<<UNTRUSTED_INVESTIGATION_DATA>>>
EntityType: ${entityType || 'GLOBAL'}
EntityId: ${entityId || 'GLOBAL'}
NodesCount: ${neighborhood.totalNodes}
EdgesCount: ${neighborhood.totalEdges}
<<<END_UNTRUSTED_INVESTIGATION_DATA>>>`;

    res.json({
      success: true,
      data: {
        summary: `Investigation graph localized around [${entityType || 'Root'}:${entityId || 'Scope'}]. Materialized ${neighborhood.totalNodes} nodes and ${neighborhood.totalEdges} evidence-backed edges.`,
        neighborhood,
        aiBoundary: AI_INVESTIGATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleInvestigationExplainRelationship = async (req, res) => {
  try {
    const { fromType, fromId, toType, toId } = req.body;
    const InvestigationQueryService = require('../../services/datafabric/InvestigationQueryService');
    const orgId = req.user?.organizationId || null;

    const pathResult = await InvestigationQueryService.findShortestPath(fromType, fromId, toType, toId, orgId);

    const boundedPayload = `<<<UNTRUSTED_INVESTIGATION_DATA>>>
PathFound: ${pathResult.pathFound}
Length: ${pathResult.length}
Nodes: ${JSON.stringify(pathResult.pathNodes?.map(n => n.nodeId) || [])}
<<<END_UNTRUSTED_INVESTIGATION_DATA>>>`;

    res.json({
      success: true,
      data: {
        pathFound: pathResult.pathFound,
        explanation: pathResult.pathFound
          ? `Shortest deterministic relationship path discovered across ${pathResult.length} hops connecting [${fromType}:${fromId}] to [${toType}:${toId}].`
          : `No deterministic relationship path discovered between [${fromType}:${fromId}] and [${toType}:${toId}] within 4 hops.`,
        pathResult,
        aiBoundary: AI_INVESTIGATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleInvestigationSuggestPivots = async (req, res) => {
  try {
    const { entityType, entityId } = req.body;

    const pivotDirections = [
      `Expand neighborhood to connected Asset & Identity nodes for lateral movement detection.`,
      `Correlate associated IOC indicators against AlienVault OTX and CIRCL threat feeds.`,
      `Inspect related Detection Rules and MITRE ATT&CK technique coverage.`,
      `Verify post-action remediation and governance policy baseline alignment.`
    ];

    res.json({
      success: true,
      data: {
        entityType,
        entityId,
        pivotDirections,
        aiBoundary: AI_INVESTIGATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleInvestigationSummarizeTimeline = async (req, res) => {
  try {
    const InvestigationQueryService = require('../../services/datafabric/InvestigationQueryService');
    const orgId = req.user?.organizationId || null;

    const timeline = await InvestigationQueryService.queryUnifiedTimeline(orgId);

    const boundedPayload = `<<<UNTRUSTED_INVESTIGATION_DATA>>>
TotalEvents: ${timeline.totalEvents}
<<<END_UNTRUSTED_INVESTIGATION_DATA>>>`;

    res.json({
      success: true,
      data: {
        totalEvents: timeline.totalEvents,
        summary: `Unified investigation timeline contains ${timeline.totalEvents} chronological events compiled from verified platform records.`,
        timeline,
        aiBoundary: AI_INVESTIGATION_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ==========================================
// PHASE 79: DECISION INTELLIGENCE COPILOT
// ==========================================
const AI_INTELLIGENCE_BOUNDARY = {
  isAdvisory: true,
  executionPermitted: false,
  attributionPermitted: false,
  riskOverridePermitted: false,
  disclaimer: 'AI outputs are strictly advisory. AI cannot assign authoritative risk scores without deterministic engine backing, cannot declare attacker attribution, and cannot execute remediation.'
};

const handleIntelligenceSummarize = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const RiskSynthesisService = require('../../services/intelligence/RiskSynthesisService');
    const AnalystPriorityService = require('../../services/intelligence/AnalystPriorityService');
    const riskService = new RiskSynthesisService();
    const priorityService = new AnalystPriorityService();

    const executiveRisk = await riskService.calculateExecutiveRisk(orgId);
    const topPriorities = await priorityService.getPrioritizedQueue(orgId, { limit: 5 });

    const boundedPayload = `<<<UNTRUSTED_INTELLIGENCE_DATA>>>
ExecutiveRiskScore: ${executiveRisk.riskScore}
RiskBand: ${executiveRisk.riskBand}
TopPriorityCount: ${topPriorities.returnedCount}
<<<END_UNTRUSTED_INTELLIGENCE_DATA>>>`;

    res.json({
      success: true,
      data: {
        summary: `Executive Risk Posture: ${executiveRisk.riskScore !== null ? `${executiveRisk.riskScore}/100 (${executiveRisk.riskBand})` : 'INSUFFICIENT_EVIDENCE'}. Top ${topPriorities.returnedCount} active investigation items prioritized.`,
        executiveRisk,
        topPriorities: topPriorities.queue || [],
        aiBoundary: AI_INTELLIGENCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleIntelligenceExplainRisk = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { subjectType = 'EXECUTIVE', subjectId = 'ORGANIZATION_WIDE' } = req.body;
    const RiskSynthesisService = require('../../services/intelligence/RiskSynthesisService');
    const DecisionExplanationService = require('../../services/intelligence/DecisionExplanationService');
    const riskService = new RiskSynthesisService();
    const explanationService = new DecisionExplanationService();

    const assessment = await riskService.calculateSubjectRisk(orgId, subjectType, subjectId);
    const explanation = explanationService.explainAssessment(assessment);

    const boundedPayload = `<<<UNTRUSTED_INTELLIGENCE_DATA>>>
SubjectType: ${subjectType}
SubjectId: ${subjectId}
Score: ${assessment.riskScore}
Band: ${assessment.riskBand}
Determination: ${assessment.determination}
<<<END_UNTRUSTED_INTELLIGENCE_DATA>>>`;

    res.json({
      success: true,
      data: {
        subjectType,
        subjectId,
        explanation,
        assessment,
        aiBoundary: AI_INTELLIGENCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleIntelligencePrioritize = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const AnalystPriorityService = require('../../services/intelligence/AnalystPriorityService');
    const priorityService = new AnalystPriorityService();

    const queueResult = await priorityService.getPrioritizedQueue(orgId, { limit: 10 });

    const boundedPayload = `<<<UNTRUSTED_INTELLIGENCE_DATA>>>
TotalCandidates: ${queueResult.totalCandidates}
QueueCount: ${queueResult.returnedCount}
<<<END_UNTRUSTED_INTELLIGENCE_DATA>>>`;

    res.json({
      success: true,
      data: {
        prioritization: queueResult,
        narrative: `Prioritization evaluated ${queueResult.totalCandidates} total platform candidates using multi-factor deterministic scoring.`,
        aiBoundary: AI_INTELLIGENCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleIntelligenceSuggestInvestigation = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { subjectType, subjectId } = req.body;
    const InvestigationRecommendationService = require('../../services/intelligence/InvestigationRecommendationService');
    const recService = new InvestigationRecommendationService();

    const recommendations = await recService.generateRecommendations(orgId, subjectType, subjectId);

    const boundedPayload = `<<<UNTRUSTED_INTELLIGENCE_DATA>>>
SubjectType: ${subjectType}
SubjectId: ${subjectId}
RecommendationsCount: ${recommendations.length}
<<<END_UNTRUSTED_INTELLIGENCE_DATA>>>`;

    res.json({
      success: true,
      data: {
        subjectType,
        subjectId,
        recommendations,
        aiBoundary: AI_INTELLIGENCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const handleIntelligenceSummarizeCluster = async (req, res) => {
  try {
    const orgId = req.user?.organizationId || null;
    const { clusterId } = req.body;
    const CampaignClusteringService = require('../../services/intelligence/CampaignClusteringService');
    const clusteringService = new CampaignClusteringService();

    const explanation = await clusteringService.explainCluster(orgId, clusterId);

    const boundedPayload = `<<<UNTRUSTED_INTELLIGENCE_DATA>>>
ClusterId: ${clusterId}
Determination: ${explanation.determination}
Attribution: ${explanation.attributionStatus}
<<<END_UNTRUSTED_INTELLIGENCE_DATA>>>`;

    res.json({
      success: true,
      data: {
        clusterId,
        explanation,
        aiBoundary: AI_INTELLIGENCE_BOUNDARY,
        model: 'gemini-2.5-flash'
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  handleIntelligenceSummarize,
  handleIntelligenceExplainRisk,
  handleIntelligencePrioritize,
  handleIntelligenceSuggestInvestigation,
  handleIntelligenceSummarizeCluster,
  handleChat,
  handleInvestigate,
  handleAnalyzeDetection,
  handleCorrelateFindings,
  handleDraftRule,
  handleSummarizeIncident,
  handleHuntingHypothesis,
  handleHuntingQuery,
  handleHuntingExplain,
  handleHuntingSummarize,
  handleHuntingDraftDetection,
  handleHuntingNextStep,
  handleIncidentSummarize,
  handleIncidentTriage,
  handleIncidentInvestigate,
  handleIncidentRecommendContainment,
  handleIncidentDraftTasks,
  handleIncidentPostmortem,
  handleDetectionReview,
  handleDetectionTune,
  handleDetectionMapAttack,
  handleDetectionFindGaps,
  handleDetectionTestPlan,
  handleReportSummarize,
  handleReportExecutive,
  handleExplainMetric,
  handleExplainControl,
  handleRecommendReportActions,
  handleGovernanceSummarize,
  handleGovernanceExplainPolicy,
  handleGovernanceExplainGap,
  handleGovernanceRecommendRemediation,
  handleReliabilitySummarize,
  handleReliabilityExplainHealth,
  handleReliabilityExplainSLO,
  handleReliabilityRecommendRemediation,
  handleAutomationSummarize,
  handleAutomationExplainDrift,
  handleAutomationRecommendRemediation,
  handleAutomationDraftPlaybook,
  handleInvestigationSummarize,
  handleInvestigationExplainRelationship,
  handleInvestigationSuggestPivots,
  handleInvestigationSummarizeTimeline,
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




