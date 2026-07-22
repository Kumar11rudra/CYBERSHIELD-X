'use strict';

class SarifExporter {
    /**
     * @param {import('../../dtos/ExecutiveReportDTO').ExecutiveReportDTO} reportDTO 
     * @param {Object} template 
     * @returns {string}
     */
    static export(reportDTO, template) {
        if (!reportDTO || !template || !template.content) {
            throw new TypeError('[SarifExporter] Invalid input');
        }

        const sortedSections = [...reportDTO.sections].sort((a, b) => a.order - b.order);

        // Minimal SARIF stub
        const sarif = {
            version: "2.1.0",
            $schema: "http://json.schemastore.org/sarif-2.1.0-rtm.5",
            runs: [
                {
                    tool: {
                        driver: {
                            name: "CSI V1 Executive Engine",
                            version: "1.0.0"
                        }
                    },
                    results: sortedSections.map(s => ({
                        ruleId: `SEC-${s.order}`,
                        message: { text: s.title }
                    })),
                    properties: {
                        executionId: reportDTO.executionId,
                        templateChecksum: template.checksum
                    }
                }
            ]
        };

        return JSON.stringify(sarif, null, 2);
    }
}

module.exports = SarifExporter;
