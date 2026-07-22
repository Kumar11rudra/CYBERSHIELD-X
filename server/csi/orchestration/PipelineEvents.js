'use strict';

const PipelineEvents = Object.freeze({
    PipelineStarted: 'PipelineStarted',
    EnginesResolved: 'EnginesResolved',
    EvidenceCollected: 'EvidenceCollected',
    FindingsGenerated: 'FindingsGenerated',
    RiskCalculated: 'RiskCalculated',
    ThreatCorrelationCompleted: 'ThreatCorrelationCompleted',
    ReasoningCompleted: 'ReasoningCompleted',
    ExecutiveReportCompleted: 'ExecutiveReportCompleted',
    PipelineCompleted: 'PipelineCompleted',
    PipelineFailed: 'PipelineFailed'
});

module.exports = { PipelineEvents };
