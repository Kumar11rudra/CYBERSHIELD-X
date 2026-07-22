'use strict';

const SarifExporter = require('../../../../../server/csi/reports/exporters/SarifExporter');

describe('SarifExporter', () => {
    test('should export deterministic SARIF', () => {
        const reportDTO = {
            executionId: 'exec1',
            sections: [
                { order: 2, title: 'B', content: 'B content' },
                { order: 1, title: 'A', content: 'A content' }
            ]
        };
        const template = { checksum: 'hash1', content: '{}' };

        const result = SarifExporter.export(reportDTO, template);
        const parsed = JSON.parse(result);
        
        expect(parsed.version).toBe('2.1.0');
        expect(parsed.runs[0].results[0].ruleId).toBe('SEC-1');
        expect(parsed.runs[0].results[1].ruleId).toBe('SEC-2');
    });
});
