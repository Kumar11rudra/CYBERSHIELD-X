'use strict';

const { ExecutiveSectionDTO } = require('../dtos/ExecutiveSectionDTO');
const { ExecutiveReportDTO } = require('../dtos/ExecutiveReportDTO');
const { ExportBundleDTO } = require('../dtos/ExportBundleDTO');
const ReportValidation = require('./ReportValidation');
const ReportTemplateRegistry = require('./ReportTemplateRegistry');

const MarkdownExporter = require('./exporters/MarkdownExporter');
const HtmlExporter = require('./exporters/HtmlExporter');
const JsonExporter = require('./exporters/JsonExporter');
const SarifExporter = require('./exporters/SarifExporter');
const StixExporter = require('./exporters/StixExporter');

class ExecutiveReportEngine {
    constructor() {
        ReportTemplateRegistry.initialize();
    }

    /**
     * @param {Array} findings 
     * @param {Object} riskResult 
     * @param {Object} correlationResult 
     * @param {Object} reasoningResult 
     * @param {string} executionId 
     * @returns {ExportBundleDTO}
     */
    execute(findings, riskResult, correlationResult, reasoningResult, executionId) {
        if (!Array.isArray(findings) || !riskResult || !correlationResult || !reasoningResult || !executionId) {
            throw new Error('[ExecutiveReportEngine] Invalid input parameters');
        }

        // 1. Map to deterministic sections in strict order
        // Sort findings deterministically
        const sortedFindings = [...findings].sort((a, b) => a.deterministicSortKey.localeCompare(b.deterministicSortKey));

        const sections = [
            new ExecutiveSectionDTO({ order: 1, title: 'Cover', content: { executionId } }),
            new ExecutiveSectionDTO({ order: 2, title: 'Executive Summary', content: reasoningResult.executiveSummary }),
            new ExecutiveSectionDTO({ order: 3, title: 'Overall Risk', content: riskResult }),
            new ExecutiveSectionDTO({ order: 4, title: 'Threat Correlation', content: correlationResult }),
            new ExecutiveSectionDTO({ order: 5, title: 'Technical Findings', content: sortedFindings }),
            new ExecutiveSectionDTO({ order: 6, title: 'AI Explanation', content: reasoningResult.observations }),
            new ExecutiveSectionDTO({ order: 7, title: 'Compliance Mapping', content: [] }), // Stub for now, would derive from findings
            new ExecutiveSectionDTO({ order: 8, title: 'Recommended Actions', content: reasoningResult.remediation }),
            new ExecutiveSectionDTO({ order: 9, title: 'Appendix', content: { metadata: executionId } })
        ];

        // 2. Validate
        ReportValidation.validateSections(sections);

        // 3. Build DTO
        const reportDTO = new ExecutiveReportDTO({ sections, executionId });

        // 4. Export
        const mdTemplate = ReportTemplateRegistry.getTemplate('ExecutiveReport.md');
        const htmlTemplate = ReportTemplateRegistry.getTemplate('ExecutiveReport.html');
        const jsonTemplate = ReportTemplateRegistry.getTemplate('ExecutiveReport.json');
        const sarifTemplate = ReportTemplateRegistry.getTemplate('ExecutiveReport.sarif');
        const stixTemplate = ReportTemplateRegistry.getTemplate('ExecutiveReport.stix');

        const markdown = MarkdownExporter.export(reportDTO, mdTemplate);
        const html = HtmlExporter.export(reportDTO, htmlTemplate);
        const json = JsonExporter.export(reportDTO, jsonTemplate);
        const sarif = SarifExporter.export(reportDTO, sarifTemplate);
        const stix = StixExporter.export(reportDTO, stixTemplate);

        // 5. Build Bundle
        const bundle = new ExportBundleDTO({
            markdown,
            html,
            json,
            sarif,
            stix,
            executionId
        });

        return bundle;
    }
}

module.exports = ExecutiveReportEngine;
