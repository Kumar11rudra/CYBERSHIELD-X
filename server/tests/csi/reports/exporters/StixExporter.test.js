'use strict';

const StixExporter = require('../../../../../server/csi/reports/exporters/StixExporter');

describe('StixExporter', () => {
    test('should export deterministic STIX with required fields', () => {
        const reportDTO = {
            executionId: 'exec1',
            sections: [
                { order: 2, title: 'B', content: 'B content' },
                { order: 1, title: 'A', content: 'A content' }
            ]
        };
        const template = { checksum: 'hash1', content: '{}' };

        const result = StixExporter.export(reportDTO, template);
        const parsed = JSON.parse(result);
        
        expect(parsed.type).toBe('bundle');
        expect(parsed.id).toBe('bundle--exec1');
        
        const reportObj = parsed.objects[0];
        expect(reportObj.type).toBe('report');
        expect(reportObj.id).toBe('report--1');
        expect(reportObj.created).toBeDefined();
        expect(reportObj.modified).toBeDefined();
        expect(reportObj.name).toBe('A');
        expect(reportObj.published).toBeDefined();
        expect(Array.isArray(reportObj.object_refs)).toBe(true);
    });
});
