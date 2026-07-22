'use strict';

class JsonExporter {
    /**
     * @param {import('../../dtos/ExecutiveReportDTO').ExecutiveReportDTO} reportDTO 
     * @param {Object} template 
     * @returns {string}
     */
    static export(reportDTO, template) {
        if (!reportDTO || !template || !template.content) {
            throw new TypeError('[JsonExporter] Invalid input');
        }

        const sortedSections = [...reportDTO.sections].sort((a, b) => a.order - b.order);

        const out = {
            _template_checksum: template.checksum,
            executionId: reportDTO.executionId,
            version: reportDTO.version,
            sections: sortedSections.map(s => ({
                order: s.order,
                title: s.title,
                content: s.content
            }))
        };

        return JSON.stringify(out, null, 2);
    }
}

module.exports = JsonExporter;
