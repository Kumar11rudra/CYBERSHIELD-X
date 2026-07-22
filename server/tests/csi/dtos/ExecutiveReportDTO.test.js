'use strict';

const { ExecutiveReportDTO } = require('../../../../server/csi/dtos/ExecutiveReportDTO');
const { ExecutiveSectionDTO } = require('../../../../server/csi/dtos/ExecutiveSectionDTO');

describe('ExecutiveReportDTO', () => {
    test('should deeply freeze the DTO and sections', () => {
        const s1 = new ExecutiveSectionDTO({ order: 1, title: 'Cover', content: { val: 1 } });
        const dto = new ExecutiveReportDTO({ sections: [s1], executionId: 'exec1' });

        expect(Object.isFrozen(dto)).toBe(true);
        expect(Object.isFrozen(dto.sections)).toBe(true);
        expect(Object.isFrozen(dto.sections[0])).toBe(true);
        expect(Object.isFrozen(dto.sections[0].content)).toBe(true);

        expect(() => { dto.executionId = 'new'; }).toThrow();
        expect(() => { dto.sections.push(new ExecutiveSectionDTO({ order: 2, title: 'x', content: 'y' })); }).toThrow();
        expect(() => { dto.sections[0].content.val = 2; }).toThrow();
    });

    test('should reject invalid constructor parameters', () => {
        expect(() => new ExecutiveReportDTO()).toThrow();
        expect(() => new ExecutiveReportDTO({ sections: 'not array', executionId: 'exec1' })).toThrow(/sections must be an array/);
        expect(() => new ExecutiveReportDTO({ sections: [], executionId: null })).toThrow(/executionId is required/);
    });
});
