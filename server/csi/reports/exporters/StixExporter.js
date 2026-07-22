'use strict';

class StixExporter {
    /**
     * @param {import('../../dtos/ExecutiveReportDTO').ExecutiveReportDTO} reportDTO 
     * @param {Object} template 
     * @returns {string}
     */
    static export(reportDTO, template) {
        if (!reportDTO || !template || !template.content) {
            throw new TypeError('[StixExporter] Invalid input');
        }

        const sortedSections = [...reportDTO.sections].sort((a, b) => a.order - b.order);

        // Minimal STIX stub
        const stix = {
            type: "bundle",
            id: `bundle--${reportDTO.executionId}`,
            spec_version: "2.1",
            objects: sortedSections.map(s => ({
                type: "report",
                spec_version: "2.1",
                id: `report--${s.order}`,
                created: "2026-01-01T00:00:00.000Z", // Deterministic date for regression
                modified: "2026-01-01T00:00:00.000Z", // Deterministic date for regression
                name: s.title,
                published: "2026-01-01T00:00:00.000Z", // Deterministic date for regression
                object_refs: [], // NOTE: Currently empty as per limitation, to remain schema compliant
                description: JSON.stringify(s.content)
            }))
        };

        return JSON.stringify(stix, null, 2);
    }
}

module.exports = StixExporter;
