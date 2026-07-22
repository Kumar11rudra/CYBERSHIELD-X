'use strict';

const EscapeUtils = require('./EscapeUtils');

class MarkdownExporter {
    /**
     * @param {import('../../dtos/ExecutiveReportDTO').ExecutiveReportDTO} reportDTO 
     * @param {Object} template 
     * @returns {string}
     */
    static export(reportDTO, template) {
        if (!reportDTO || !template || !template.content) {
            throw new TypeError('[MarkdownExporter] Invalid input');
        }

        const sortedSections = [...reportDTO.sections].sort((a, b) => a.order - b.order);
        
        let markdown = template.content + '\n\n';
        markdown += `Execution ID: ${EscapeUtils.escapeMarkdown(reportDTO.executionId)}\n\n`;

        for (const section of sortedSections) {
            markdown += `## ${EscapeUtils.escapeMarkdown(section.order + '. ' + section.title)}\n`;
            markdown += `${EscapeUtils.formatSafeMarkdown(section.content)}\n\n`;
        }

        return markdown.trim();
    }
}

module.exports = MarkdownExporter;
