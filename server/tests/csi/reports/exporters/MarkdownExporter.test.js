'use strict';

const MarkdownExporter = require('../../../../../server/csi/reports/exporters/MarkdownExporter');

describe('MarkdownExporter', () => {
    test('should export deterministic markdown and escape characters', () => {
        const reportDTO = {
            executionId: 'exec1',
            sections: [
                { order: 1, title: 'A', content: '# Heading\n*bold*\n[link](url)\n![img](url)' },
                { order: 2, title: 'B', content: '```javascript\ncode\n```' },
                { order: 3, title: 'C', content: { table: '|a|b|\n|-|-|\n|1|2|' } }
            ]
        };
        const template = { content: '# Template' };

        const result = MarkdownExporter.export(reportDTO, template);
        expect(result).toContain('# Template');
        expect(result).toContain('Execution ID: exec1');
        
        // Assert escaping
        expect(result).toContain('\\# Heading');
        expect(result).toContain('\\*bold\\*');
        expect(result).toContain('\\[link\\]\\(url\\)');
        expect(result).toContain('\\!\\[img\\]\\(url\\)');
        expect(result).toContain('\\`\\`\\`javascript');
        expect(result).toContain('\\|a\\|b\\|');

        expect(result.indexOf('1\\. A')).toBeLessThan(result.indexOf('2\\. B'));
    });

    test('should throw on invalid input', () => {
        expect(() => MarkdownExporter.export(null, {})).toThrow(/Invalid input/);
    });
});
