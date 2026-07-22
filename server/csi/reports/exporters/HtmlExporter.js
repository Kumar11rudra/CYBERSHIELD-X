'use strict';

const EscapeUtils = require('./EscapeUtils');

class HtmlExporter {
    /**
     * @param {import('../../dtos/ExecutiveReportDTO').ExecutiveReportDTO} reportDTO 
     * @param {Object} template 
     * @returns {string}
     */
    static export(reportDTO, template) {
        if (!reportDTO || !template || !template.content) {
            throw new TypeError('[HtmlExporter] Invalid input');
        }

        const sortedSections = [...reportDTO.sections].sort((a, b) => a.order - b.order);
        
        let html = template.content.replace('</body></html>', '');
        html += `\n<div id="execution-id">Execution ID: ${EscapeUtils.escapeHtml(reportDTO.executionId)}</div>\n`;

        for (const section of sortedSections) {
            html += `<section id="section-${section.order}">\n`;
            html += `  <h2>${EscapeUtils.escapeHtml(section.order + '. ' + section.title)}</h2>\n`;
            html += `  <pre>${EscapeUtils.formatSafeHtml(section.content)}</pre>\n`;
            html += `</section>\n`;
        }

        html += '</body></html>';
        return html;
    }
}

module.exports = HtmlExporter;
