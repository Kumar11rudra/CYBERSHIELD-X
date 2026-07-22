'use strict';

const HtmlExporter = require('../../../../../server/csi/reports/exporters/HtmlExporter');

describe('HtmlExporter', () => {
    test('should export deterministic html and escape characters', () => {
        const reportDTO = {
            executionId: 'exec1',
            sections: [
                { order: 1, title: 'A', content: '<script>alert(1)</script>' },
                { order: 2, title: 'B', content: { nested: 'img <img onerror="bad">' } },
                { order: 3, title: 'C', content: ['&', '"', "'"] }
            ]
        };
        const template = { content: '<html><body></body></html>' };

        const result = HtmlExporter.export(reportDTO, template);
        expect(result).toContain('<html><body>');
        expect(result).toContain('<div id="execution-id">Execution ID: exec1</div>');
        expect(result.indexOf('1. A')).toBeLessThan(result.indexOf('2. B'));
        
        // Assertions for escaping
        expect(result).not.toContain('<script>');
        expect(result).toContain('&lt;script&gt;');
        expect(result).not.toContain('<img');
        expect(result).toContain('&lt;img');
        expect(result).toContain('&amp;');
        expect(result).toContain('&quot;');
        expect(result).toContain('&#39;');

        expect(result.endsWith('</body></html>')).toBe(true);
    });
});
