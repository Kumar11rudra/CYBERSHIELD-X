'use strict';

class ReportValidation {
    /**
     * @param {Array<import('../dtos/ExecutiveSectionDTO').ExecutiveSectionDTO>} sections 
     */
    static validateSections(sections) {
        if (!Array.isArray(sections) || sections.length === 0) {
            throw new Error('[ReportValidation] Sections array is empty or invalid');
        }

        const requiredSections = [
            { order: 1, title: 'Cover' },
            { order: 2, title: 'Executive Summary' },
            { order: 3, title: 'Overall Risk' },
            { order: 4, title: 'Threat Correlation' },
            { order: 5, title: 'Technical Findings' },
            { order: 6, title: 'AI Explanation' },
            { order: 7, title: 'Compliance Mapping' },
            { order: 8, title: 'Recommended Actions' },
            { order: 9, title: 'Appendix' }
        ];

        if (sections.length !== requiredSections.length) {
            throw new Error('[ReportValidation] Missing or extra mandatory sections');
        }

        const orders = new Set();
        let allFrozen = true;

        for (let i = 0; i < sections.length; i++) {
            const sec = sections[i];
            const req = requiredSections.find(r => r.order === sec.order);

            if (!req) {
                throw new Error(`[ReportValidation] Unknown section order: ${sec.order}`);
            }

            if (req.title !== sec.title) {
                throw new Error(`[ReportValidation] Section title mismatch for order ${sec.order}. Expected '${req.title}', got '${sec.title}'`);
            }

            if (orders.has(sec.order)) {
                throw new Error(`[ReportValidation] Duplicate section order detected: ${sec.order}`);
            }
            orders.add(sec.order);

            if (!Object.isFrozen(sec)) {
                allFrozen = false;
            }

            // Check for duplicate finding IDs if it's the Technical Findings section
            if (sec.order === 5 && Array.isArray(sec.content)) {
                const fIds = new Set();
                for (const f of sec.content) {
                    if (fIds.has(f.findingId)) {
                        throw new Error(`[ReportValidation] Duplicate finding detected: ${f.findingId}`);
                    }
                    fIds.add(f.findingId);
                }
            }
        }

        if (!allFrozen) {
            throw new Error('[ReportValidation] Not all sections are deeply frozen');
        }
    }
}

module.exports = ReportValidation;
