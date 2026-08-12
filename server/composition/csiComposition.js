'use strict';

/**
 * csiComposition.js — CSI V1 Composition Root
 *
 * Milestone 6.2: Passive Engines (DnsEngine, WhoisEngine, SslEngine)
 * added to the composition root.
 *
 * Milestone 6.3+ will add active engines (Port, Service, HTTP, Tech).
 * Milestone 6.4+ will add RiskScoringEngine, ReportGenerationEngine.
 * Milestone 6.5+ will add AI Reasoning.
 * Milestone 6.6+ will add CsiOrchestrationService.
 *
 * Existing platformComposition.js is NOT modified.
 */

// ── M6.1 — Foundation ──────────────────────────────────────────────────────
const { EngineRegistry }          = require('../csi/registry/EngineRegistry');
const { TargetNormalizer }        = require('../csi/pipeline/TargetNormalizer');
const { TargetClassifier }        = require('../csi/pipeline/TargetClassifier');

// ── M6.2 — Network Clients ────────────────────────────────────────────────
const { DnsClient }               = require('../csi/network/DnsClient');
const { TlsClient }               = require('../csi/network/TlsClient');
const { TcpClient }               = require('../csi/network/TcpClient');
const { HttpClient }              = require('../csi/network/HttpClient');

// ── M6.2 — Evidence Storage ───────────────────────────────────────────────
const { LocalEvidenceStorage }    = require('../csi/evidence/LocalEvidenceStorage');

// ── M6.2 — Passive Engines ────────────────────────────────────────────────
const { DnsEngine }               = require('../csi/engines/DnsEngine');
const { WhoisEngine }             = require('../csi/engines/WhoisEngine');
const { SslEngine }               = require('../csi/engines/SslEngine');

// ── M6.3 — Active Engines ─────────────────────────────────────────────────
const { HttpEngine }              = require('../csi/engines/HttpEngine');
const { UrlEngine }               = require('../csi/engines/UrlEngine');
const { PortEngine }              = require('../csi/engines/PortEngine');
const { ServiceFingerprintEngine } = require('../csi/engines/ServiceFingerprintEngine');
const { TechnologyDetectionEngine } = require('../csi/engines/TechDetectionEngine');

// ── Instantiate network clients ────────────────────────────────────────────
const dnsClient = new DnsClient({ defaultTimeout: 5000 });
const tlsClient = new TlsClient({ defaultTimeout: 10000 });
const tcpClient = new TcpClient({ defaultTimeout: 15000 });
const httpClient = new HttpClient({ defaultTimeout: 10000 });

const networkClients = Object.freeze({ dnsClient, tlsClient, tcpClient, httpClient });

// ── Evidence storage ───────────────────────────────────────────────────────
const evidenceStorage = new LocalEvidenceStorage();

// ── Passive engines ────────────────────────────────────────────────────────
const dnsEngine   = new DnsEngine(dnsClient, evidenceStorage);
const whoisEngine = new WhoisEngine(tcpClient, evidenceStorage);
const sslEngine   = new SslEngine(tlsClient, evidenceStorage);

// ── Active engines ─────────────────────────────────────────────────────────
const httpEngine = new HttpEngine(httpClient, evidenceStorage);
const urlEngine = new UrlEngine(httpClient, evidenceStorage);
const portEngine = new PortEngine(tcpClient, evidenceStorage);
const serviceFingerprintEngine = new ServiceFingerprintEngine(tcpClient, evidenceStorage);
const techDetectionEngine = new TechnologyDetectionEngine(httpClient, evidenceStorage);

// ── Engine Registry ────────────────────────────────────────────────────────
const engineRegistry = new EngineRegistry();
engineRegistry.register(dnsEngine,   { skipFlagCheck: false });
engineRegistry.register(whoisEngine, { skipFlagCheck: false });
engineRegistry.register(sslEngine,   { skipFlagCheck: false });
engineRegistry.register(httpEngine,  { skipFlagCheck: false });
engineRegistry.register(urlEngine,   { skipFlagCheck: false });
engineRegistry.register(portEngine,  { skipFlagCheck: false });
engineRegistry.register(serviceFingerprintEngine, { skipFlagCheck: false });
engineRegistry.register(techDetectionEngine, { skipFlagCheck: false });

// ── Target Pipeline ────────────────────────────────────────────────────────
const targetNormalizer = new TargetNormalizer();
const targetClassifier = new TargetClassifier();

// ── M6.4 — Risk & Reports ──────────────────────────────────────────────────
const RiskScoringEngine = require('../csi/risk/RiskScoringEngine');
const ExecutiveReportEngine = require('../csi/reports/ExecutiveReportEngine');

// ── M6.4B — Threat Correlation ─────────────────────────────────────────────
const ThreatCorrelationEngine = require('../csi/correlation/ThreatCorrelationEngine');

// ── M6.5 — AI Reasoning ────────────────────────────────────────────────────
const ReasoningEngine = require('../csi/ai/ReasoningEngine');
const LLMProviderMock = require('../csi/ai/LLMProviderMock'); // Default to mock for tests unless overridden

// ── M6.6 — Orchestration & Concurrency ─────────────────────────────────────
const { EngineRunner } = require('../csi/runner/EngineRunner');
const { WorkerPool } = require('../csi/concurrency/WorkerPool');
const { ExecutionValidation } = require('../csi/orchestration/ExecutionValidation');
const { PipelineHealth } = require('../csi/orchestration/PipelineHealth');
const { CsiExecutionPipeline } = require('../csi/orchestration/CsiExecutionPipeline');
const { CsiOrchestrationService } = require('../csi/CsiOrchestrationService');

// ── Milestone 6.4–6.6 Instantiations ────────────────────────────────────────
const riskScoringEngine       = RiskScoringEngine; 
const threatCorrelationEngine = ThreatCorrelationEngine;
const csiAiReasoningService   = new ReasoningEngine(new LLMProviderMock());
const reportGenerationEngine  = new ExecutiveReportEngine();

const workerPool = new WorkerPool(10); // Standard concurrency
const executionValidator = ExecutionValidation;
const pipelineHealth = PipelineHealth;

// ── Initialize global static registries ───────────────────────────────────
const RiskRuleRegistry = require('../csi/risk/RiskRuleRegistry');
const CorrelationRuleRegistry = require('../csi/correlation/CorrelationRuleRegistry');
const PromptRegistry = require('../csi/ai/PromptRegistry');
const ReportTemplateRegistry = require('../csi/reports/ReportTemplateRegistry');

RiskRuleRegistry.initialize();
CorrelationRuleRegistry.initialize();
PromptRegistry.initialize();
ReportTemplateRegistry.initialize();

// Initialize engines with signature files at startup
techDetectionEngine.initialize().catch(err => console.error('[TECH DETECTION INITIALIZATION ERROR]', err));
serviceFingerprintEngine.initialize().catch(err => console.error('[SERVICE FINGERPRINT INITIALIZATION ERROR]', err));

const executionPipeline = new CsiExecutionPipeline({
    engineRunner: EngineRunner,
    engineRegistry,
    riskEngine: riskScoringEngine,
    correlationEngine: threatCorrelationEngine,
    reasoningEngine: csiAiReasoningService,
    executiveReportEngine: reportGenerationEngine,
    workerPool,
    executionValidator,
    pipelineHealth,
    evidenceStorage,
    targetNormalizer,
    targetClassifier
});

const csiOrchestrationService = new CsiOrchestrationService({
    executionPipeline
});

/**
 * csiComposition — singleton export.
 */
const csiComposition = Object.freeze({
    // Foundation
    engineRegistry,
    targetNormalizer,
    targetClassifier,
    // Network
    networkClients,
    // Storage
    evidenceStorage,
    // Engines
    dnsEngine,
    whoisEngine,
    sslEngine,
    httpEngine,
    urlEngine,
    portEngine,
    serviceFingerprintEngine,
    techDetectionEngine,
    // Concurrency
    workerPool,
    // Advanced Engines & Orchestration
    riskScoringEngine,
    threatCorrelationEngine,
    csiAiReasoningService,
    reportGenerationEngine,
    csiOrchestrationService,
});

module.exports = csiComposition;
