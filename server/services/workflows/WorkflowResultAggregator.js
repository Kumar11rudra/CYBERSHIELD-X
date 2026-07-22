const WorkflowResultDTO = require('./dto/WorkflowResultDTO');

/**
 * @module WorkflowResultAggregator
 * @description Collects all completed ScanResultDTOs from jobs in a workflow and aggregates them into a final IntelligenceReportDTO.
 */
class WorkflowResultAggregator {
    /**
     * @param {Object} deps 
     * @param {import('../jobs/JobManager')} deps.jobManager 
     * @param {import('../intelligence/CorrelationEngine')} deps.correlationEngine 
     */
    constructor({ jobManager, correlationEngine }) {
        this.jobManager = jobManager;
        this.correlationEngine = correlationEngine;
    }

    /**
     * @param {import('./dto/WorkflowExecutionDTO')} execution 
     * @returns {Promise<WorkflowResultDTO>}
     */
    async aggregate(execution) {
        const scanResults = [];
        let hasErrors = false;

        for (const mapping of execution.jobMappings) {
            const job = await this.jobManager.getJob(mapping.jobId);
            if (job) {
                if (job.status !== 'COMPLETED') {
                    hasErrors = true;
                }
                if (job.normalizedOutput) {
                    scanResults.push(job.normalizedOutput);
                }
            }
        }

        let intelligenceReport = null;
        if (scanResults.length > 0) {
            // Aggregate all normalized outputs from the entire workflow into a single consolidated report
            intelligenceReport = this.correlationEngine.correlate(scanResults);
        }

        return new WorkflowResultDTO({
            executionId: execution.executionId,
            success: !hasErrors,
            intelligenceReport,
            stageResults: execution.jobMappings
        });
    }
}

module.exports = WorkflowResultAggregator;
