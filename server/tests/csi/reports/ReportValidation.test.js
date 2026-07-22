'use strict';

const ReportValidation = require('../../../../server/csi/reports/ReportValidation');
const { ExecutiveSectionDTO } = require('../../../../server/csi/dtos/ExecutiveSectionDTO');

describe('ReportValidation', () => {
    let validSections;

    beforeEach(() => {
        validSections = [
            new ExecutiveSectionDTO({ order: 1, title: 'Cover', content: {} }),
            new ExecutiveSectionDTO({ order: 2, title: 'Executive Summary', content: {} }),
            new ExecutiveSectionDTO({ order: 3, title: 'Overall Risk', content: {} }),
            new ExecutiveSectionDTO({ order: 4, title: 'Threat Correlation', content: {} }),
            new ExecutiveSectionDTO({ order: 5, title: 'Technical Findings', content: [{ findingId: 'f1' }] }),
            new ExecutiveSectionDTO({ order: 6, title: 'AI Explanation', content: {} }),
            new ExecutiveSectionDTO({ order: 7, title: 'Compliance Mapping', content: {} }),
            new ExecutiveSectionDTO({ order: 8, title: 'Recommended Actions', content: {} }),
            new ExecutiveSectionDTO({ order: 9, title: 'Appendix', content: {} })
        ];
    });

    test('should pass valid sections', () => {
        expect(() => ReportValidation.validateSections(validSections)).not.toThrow();
    });

    test('should reject missing mandatory sections', () => {
        validSections.pop();
        expect(() => ReportValidation.validateSections(validSections)).toThrow(/Missing or extra mandatory sections/);
    });

    test('should reject incorrect titles for orders', () => {
        const invalidTitleSections = [...validSections];
        invalidTitleSections[0] = new ExecutiveSectionDTO({ order: 1, title: 'Wrong Title', content: {} });
        expect(() => ReportValidation.validateSections(invalidTitleSections)).toThrow(/Section title mismatch/);
    });

    test('should reject duplicate finding IDs', () => {
        const invalidFindingsSections = [...validSections];
        invalidFindingsSections[4] = new ExecutiveSectionDTO({ 
            order: 5, 
            title: 'Technical Findings', 
            content: [{ findingId: 'f1' }, { findingId: 'f1' }] 
        });
        expect(() => ReportValidation.validateSections(invalidFindingsSections)).toThrow(/Duplicate finding detected/);
    });

    test('should reject mutable (unfrozen) sections', () => {
        const unfrozenSection = { order: 1, title: 'Cover', content: {} };
        const mixedSections = [unfrozenSection, ...validSections.slice(1)];
        expect(() => ReportValidation.validateSections(mixedSections)).toThrow(/Not all sections are deeply frozen/);
    });
});
