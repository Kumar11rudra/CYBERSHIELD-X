'use strict';

const JsonExporter = require('../../../../../server/csi/reports/exporters/JsonExporter');

describe('JsonExporter', () => {
    test('should export deterministic json', () => {
        const reportDTO = {
            executionId: 'exec1',
            version: '1.0.0',
            sections: [
                { order: 2, title: 'B', content: 'B content' },
                { order: 1, title: 'A', content: 'A content' }
            ]
        };
        const template = { checksum: 'abc123hash', content: '{}' };

        const result = JsonExporter.export(reportDTO, template);
        const parsed = JSON.parse(result);
        
        expect(parsed.executionId).toBe('exec1');
        expect(parsed._template_checksum).toBe('abc123hash');
        expect(parsed.sections[0].order).toBe(1);
        expect(parsed.sections[1].order).toBe(2);
    });
});
